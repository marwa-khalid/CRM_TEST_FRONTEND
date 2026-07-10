import React from "react";

type Prediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
};

type CarDamageOverlayProps = {
  imageUrl: string;
  predictions: Prediction[];
  originalWidth: number;
  originalHeight: number;
};

// Utility to generate random color
const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const CarDamageOverlay: React.FC<CarDamageOverlayProps> = ({
  imageUrl,
  predictions = [],
  originalWidth,
  originalHeight,
}) => {
  const displayWidth = 600; // fixed display width
  const displayHeight = (originalHeight / originalWidth) * displayWidth;

  const scaleX = displayWidth / originalWidth;
  const scaleY = displayHeight / originalHeight;

  return (
    <div
      style={{
        position: "relative",
        width: displayWidth,
        height: displayHeight,
      }}
    >
      {/* Car Image */}
      <img
        src={imageUrl}
        alt="Car"
        style={{ width: displayWidth, height: displayHeight, display: "block" }}
      />

      {/* Overlay Predictions */}
      {predictions.map((pred, idx) => {
        const left = (pred.x - pred.width / 2) * scaleX;
        const top = (pred.y - pred.height / 2) * scaleY;
        const width = pred.width * scaleX;
        const height = pred.height * scaleY;

        const color = getRandomColor();

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left,
              top,
              width,
              height,
              border: `2px solid ${color}`,
              borderRadius: "4px",
              pointerEvents: "none",
            }}
          >
            {/* Label above bounding box */}
            <span
              style={{
                position: "absolute",
                top: -18,
                left: "50%",
                transform: "translateX(-50%)",
                background: color,
                color: "white",
                fontSize: "12px",
                padding: "2px 4px",
                borderRadius: "3px",
                zIndex: 1,
              }}
            >
              {pred.class} ({(pred.confidence * 100).toFixed(1)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CarDamageOverlay;
