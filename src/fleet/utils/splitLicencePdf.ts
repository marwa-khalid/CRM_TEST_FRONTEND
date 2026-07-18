import * as pdfjsLib from "pdfjs-dist";

// Same worker wiring the Claims document viewer uses — Vite resolves this URL at
// build time, so no CDN/network fetch is needed (works on the free tier).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const canvasToPngFile = async (
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<File | null> => {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return null;
  return new File([blob], filename, { type: "image/png" });
};

const cropCanvasToPngFile = async (
  source: HTMLCanvasElement,
  crop: { x: number; y: number; width: number; height: number },
  filename: string,
): Promise<File | null> => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(crop.width));
  canvas.height = Math.max(1, Math.floor(crop.height));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvasToPngFile(canvas, filename);
};

const imageFileToCanvas = async (file: File): Promise<HTMLCanvasElement | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });

// Render one PDF page to a canvas so it can either become one image or be split.
const renderPageToCanvas = async (
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
): Promise<HTMLCanvasElement | null> => {
  const page = await pdf.getPage(pageNumber);
  // scale 2 keeps the text sharp enough for OCR without a huge file.
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) return null;
  await page.render({ canvas, canvasContext: context, viewport } as never).promise;
  return canvas;
};

type Bounds = { left: number; top: number; right: number; bottom: number };

const isInk = (r: number, g: number, b: number, a: number) =>
  a > 20 && (r < 246 || g < 246 || b < 246);

const getInkBounds = (
  canvas: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  },
): Bounds | null => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const x0 = Math.max(0, Math.floor(region.x));
  const y0 = Math.max(0, Math.floor(region.y));
  const width = Math.max(1, Math.min(canvas.width - x0, Math.floor(region.width)));
  const height = Math.max(1, Math.min(canvas.height - y0, Math.floor(region.height)));
  const { data } = context.getImageData(x0, y0, width, height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (!isInk(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return null;
  const pad = Math.max(8, Math.round(Math.max(width, height) * 0.015));
  return {
    left: Math.max(0, x0 + left - pad),
    top: Math.max(0, y0 + top - pad),
    right: Math.min(canvas.width, x0 + right + pad),
    bottom: Math.min(canvas.height, y0 + bottom + pad),
  };
};

const cropBoundsToFile = (canvas: HTMLCanvasElement, bounds: Bounds | null, filename: string) => {
  const b = bounds || { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
  return cropCanvasToPngFile(
    canvas,
    {
      x: b.left,
      y: b.top,
      width: Math.max(1, b.right - b.left),
      height: Math.max(1, b.bottom - b.top),
    },
    filename,
  );
};

const axisDensities = (
  canvas: HTMLCanvasElement,
  axis: "x" | "y",
  bounds: Bounds,
): number[] => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  const left = Math.max(0, Math.floor(bounds.left));
  const top = Math.max(0, Math.floor(bounds.top));
  const width = Math.max(1, Math.floor(bounds.right - bounds.left));
  const height = Math.max(1, Math.floor(bounds.bottom - bounds.top));
  const { data } = context.getImageData(left, top, width, height);
  const total = axis === "y" ? height : width;
  const cross = axis === "y" ? width : height;
  const densities = new Array(total).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (!isInk(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) continue;
      densities[axis === "y" ? y : x] += 1;
    }
  }

  return densities.map((value) => value / cross);
};

const smoothDensities = (values: number[], radius: number) =>
  values.map((_, idx) => {
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, idx - radius); i <= Math.min(values.length - 1, idx + radius); i += 1) {
      sum += values[i];
      count += 1;
    }
    return count ? sum / count : 0;
  });

const findWhitespaceSplit = (
  canvas: HTMLCanvasElement,
  axis: "x" | "y",
  bounds: Bounds,
): number | null => {
  const raw = axisDensities(canvas, axis, bounds);
  if (!raw.length) return null;
  const smooth = smoothDensities(raw, Math.max(3, Math.floor(raw.length * 0.004)));
  const max = Math.max(...smooth);
  const low = Math.max(0.004, max * 0.08);
  const min = Math.floor(raw.length * 0.2);
  const maxIndex = Math.ceil(raw.length * 0.8);
  let bestStart = -1;
  let bestEnd = -1;
  let runStart = -1;

  for (let i = min; i <= maxIndex; i += 1) {
    const isLow = smooth[i] <= low;
    if (isLow && runStart === -1) runStart = i;
    if ((!isLow || i === maxIndex) && runStart !== -1) {
      const runEnd = isLow && i === maxIndex ? i : i - 1;
      if (runEnd - runStart > bestEnd - bestStart) {
        bestStart = runStart;
        bestEnd = runEnd;
      }
      runStart = -1;
    }
  }

  if (bestStart === -1) return null;
  const origin = axis === "y" ? bounds.top : bounds.left;
  return Math.floor(origin + (bestStart + bestEnd) / 2);
};

// Some uploads are a single PDF page/image with both licence sides scanned
// together. Split it into two card-shaped images: top/bottom for portrait scans,
// left/right for landscape scans.
const splitCombinedCanvas = async (
  canvas: HTMLCanvasElement,
): Promise<{ front: File | null; back: File | null }> => {
  const bounds = getInkBounds(canvas);
  const boundedWidth = bounds ? bounds.right - bounds.left : canvas.width;
  const boundedHeight = bounds ? bounds.bottom - bounds.top : canvas.height;
  const verticalStack = boundedHeight >= boundedWidth * 0.8;

  if (verticalStack) {
    const splitY = (bounds && findWhitespaceSplit(canvas, "y", bounds)) || Math.floor((bounds?.top ?? 0) + boundedHeight / 2);
    const topBounds = getInkBounds(canvas, {
      x: bounds?.left ?? 0,
      y: bounds?.top ?? 0,
      width: boundedWidth,
      height: Math.max(1, splitY - (bounds?.top ?? 0)),
    });
    const bottomBounds = getInkBounds(canvas, {
      x: bounds?.left ?? 0,
      y: splitY,
      width: boundedWidth,
      height: Math.max(1, (bounds?.bottom ?? canvas.height) - splitY),
    });
    return {
      front: await cropBoundsToFile(canvas, topBounds, "driving-license-front.png"),
      back: await cropBoundsToFile(canvas, bottomBounds, "driving-license-back.png"),
    };
  }

  const splitX = (bounds && findWhitespaceSplit(canvas, "x", bounds)) || Math.floor((bounds?.left ?? 0) + boundedWidth / 2);
  const leftBounds = getInkBounds(canvas, {
    x: bounds?.left ?? 0,
    y: bounds?.top ?? 0,
    width: Math.max(1, splitX - (bounds?.left ?? 0)),
    height: boundedHeight,
  });
  const rightBounds = getInkBounds(canvas, {
    x: splitX,
    y: bounds?.top ?? 0,
    width: Math.max(1, (bounds?.right ?? canvas.width) - splitX),
    height: boundedHeight,
  });
  return {
    front: await cropBoundsToFile(canvas, leftBounds, "driving-license-front.png"),
    back: await cropBoundsToFile(canvas, rightBounds, "driving-license-back.png"),
  };
};

// A single licence file → front (page 1) and back (page 2) images.
// - A multi-page PDF splits into the two sides.
// - A single-page PDF or image with both sides is split into Front + Back.
// - Anything that fails to parse falls back to the original file as the front,
//   so the upload never silently drops.
export const splitLicencePdf = async (
  file: File,
): Promise<{ front: File | null; back: File | null }> => {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    const imageCanvas = file.type.startsWith("image/") ? await imageFileToCanvas(file) : null;
    if (!imageCanvas) return { front: file, back: null };
    const split = await splitCombinedCanvas(imageCanvas);
    return split.front || split.back ? split : { front: file, back: null };
  }
  try {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const firstPage = pdf.numPages >= 1 ? await renderPageToCanvas(pdf, 1) : null;
    if (pdf.numPages === 1 && firstPage) {
      const split = await splitCombinedCanvas(firstPage);
      if (split.front || split.back) return split;
    }
    const secondPage = pdf.numPages >= 2 ? await renderPageToCanvas(pdf, 2) : null;
    const front = firstPage ? await cropBoundsToFile(firstPage, getInkBounds(firstPage), "driving-license-front.png") : null;
    const back = secondPage ? await cropBoundsToFile(secondPage, getInkBounds(secondPage), "driving-license-back.png") : null;
    if (!front && !back) return { front: file, back: null };
    return { front: front ?? file, back };
  } catch (error) {
    console.warn("Licence PDF split failed; using the original file as the front.", error);
    return { front: file, back: null };
  }
};
