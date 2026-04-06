// Client Vehicles
import Client1 from '../../../assets/AutoClaim_icon/canvas/Client1.svg';
import Client2 from '../../../assets/AutoClaim_icon/canvas/Client2.svg';
import Client3 from '../../../assets/AutoClaim_icon/canvas/Client3.svg';
import Client4 from '../../../assets/AutoClaim_icon/canvas/Client4.svg';
import Client5 from '../../../assets/AutoClaim_icon/canvas/Client5.svg';

// Third Party Vehicles
import TP1 from '../../../assets/AutoClaim_icon/canvas/TP1.svg';
import TP2 from '../../../assets/AutoClaim_icon/canvas/TP2.svg';
import TP3 from '../../../assets/AutoClaim_icon/canvas/TP3.svg';
import TP4 from '../../../assets/AutoClaim_icon/canvas/TP4.svg';
import TP5 from '../../../assets/AutoClaim_icon/canvas/TP5.svg';

// Objects
import Obj1 from '../../../assets/AutoClaim_icon/canvas/Obj1.svg';
import Obj2 from '../../../assets/AutoClaim_icon/canvas/Obj2.svg';
import Obj3 from '../../../assets/AutoClaim_icon/canvas/Obj3.svg';
import Obj4 from '../../../assets/AutoClaim_icon/canvas/Obj4.svg';
import Obj5 from '../../../assets/AutoClaim_icon/canvas/Obj5.svg';
import Obj6 from "../../../assets/AutoClaim_icon/canvas/Obj6.svg";


import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { RotateCcw, Type, X } from "lucide-react";

import {
  GoogleMap,
  useJsApiLoader,
  TrafficLayer,
} from "@react-google-maps/api";

const libraries: "places"[] = ["places"];
const containerStyle = {
  width: "100%",
  height: "100%",
};
const ukBounds = {
  north: 60.8566,
  south: 49.8566,
  west: -8.6493,
  east: 1.7578,
};
// Types
interface CanvasObject {
  id: string;
  src: string;
  x: number;
  rotation: number; // <--- New field (0-360)
  isFlipped: boolean; // <--- New field
  y: number;
  type: "vehicle" | "object" | "text";
  scale: number; // <--- New field (e.g., 1.0 is 100%)
  text?: string;
  isEditing?: boolean;
}

const Step4Canvas = () => {
  //Google maps
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY,
    libraries,
  });

  // Fetch location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem("location");
     console.log("working");
    if (isLoaded && savedLocation) {
      const geocoder = new google.maps.Geocoder();
      console.log("working");
      console.log(savedLocation)
      geocoder.geocode({ address: savedLocation }, (results, status) => {
        console.log(status);
        if (status === "OK" && results?.[0]) {
          console.log("working")
          const { lat, lng } = results[0].geometry.location;
          setMapCenter({ lat: lat(), lng: lng() });
        }
      });
    }
  }, [isLoaded]);
console.log(mapCenter)
  // State for drawing
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [thickness, setThickness] = useState(2);
  const [activeColor, setActiveColor] = useState("#000000"); // Hex for Canvas

  // State for placed objects
  const [placedObjects, setPlacedObjects] = useState<CanvasObject[]>([]);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // Grouped Assets
  const clientAssets = [Client1, Client2, Client3, Client4, Client5];
  const tpAssets = [TP1, TP2, TP3, TP4, TP5];
  const objectAssets = [Obj1, Obj2, Obj3, Obj4, Obj5, Obj6];
  // Colors mapping (Tailwind to Hex)
  const lineColors = [
    { name: "black", hex: "#000000", bg: "bg-black" },
    { name: "blue", hex: "#2563eb", bg: "bg-blue-600" },
    { name: "red", hex: "#b91c1c", bg: "bg-red-700" },
    { name: "amber", hex: "#f59e0b", bg: "bg-amber-500" },
    { name: "lime", hex: "#4d7c0f", bg: "bg-lime-700" },
  ];
  const removeObject = (id: string) => {
    setPlacedObjects(placedObjects.filter((obj) => obj.id !== id));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(2, 2);
      context.lineCap = "round";
      context.strokeStyle = activeColor;
      context.lineWidth = thickness;
      contextRef.current = context;
    }
  }, []);
const handleResize = (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();

  const startX = e.clientX;
  const objElement = document.getElementById(`obj-${id}`);
  if (!objElement) return;

  const initialRect = objElement.getBoundingClientRect();
  const initialScale = placedObjects.find((o) => o.id === id)?.scale || 1;

  const onMouseMove = (moveEvent: MouseEvent) => {
    // Calculate how far the mouse has moved from the start point
    const deltaX = moveEvent.clientX - startX;

    // 200px of movement equals 1.0 scale change (adjust for sensitivity)
    const scaleChange = deltaX / 200;
    const newScale = Math.max(0.4, Math.min(4, initialScale + scaleChange));

    setPlacedObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, scale: newScale } : obj)),
    );
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = activeColor;
      contextRef.current.lineWidth = thickness;
    }
  }, [activeColor, thickness]);
const handleRotate = (id: string, e: React.MouseEvent) => {
  // 1. CRITICAL: Stop Draggable from taking over
  e.stopPropagation();
  e.preventDefault();

  const onMouseMove = (moveEvent: MouseEvent) => {
    const objElement = document.getElementById(`obj-${id}`);
    if (!objElement) return;

    // 2. Get the bounding box of the element to find its center
    const rect = objElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 3. Calculate the angle between the center and the mouse position
    // Math.atan2 returns radians; we convert to degrees
    const angle = Math.atan2(
      moveEvent.clientY - centerY,
      moveEvent.clientX - centerX,
    );

    // Add 90 degrees so the handle feels like it's "pulling" the top of the object
    const degree = angle * (180 / Math.PI) + 90;

    setPlacedObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, rotation: degree } : obj)),
    );
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  // 4. Attach to window so movement is tracked even if mouse leaves the handle
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};
    const toggleFlip = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPlacedObjects((prev) =>
        prev.map((obj) =>
          obj.id === id ? { ...obj, isFlipped: !obj.isFlipped } : obj,
        ),
      );
    };
  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawingEnabled) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing || !isDrawingEnabled) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    contextRef.current?.clearRect(0, 0, canvas!.width, canvas!.height);
    setPlacedObjects([]);
  };

  const addObject = (src: string, type: "vehicle" | "object") => {
    setPlacedObjects([
      ...placedObjects,
      { id: Date.now().toString(), src, x: 50, y: 50, rotation: 0, scale:1.0,isFlipped:false,type },
    ]);
  };

  // Inside Step4Canvas component
  const addTextLabel = () => {
    const newId = Date.now().toString();
    setPlacedObjects([
      ...placedObjects,
      {
        id: newId,
        src: "",
        x: 100,
        y: 100,
        rotation: 0,
        scale:1.0,
        isFlipped:false,
        type: "text",
        text: "", // Start empty
        isEditing: true, // Custom flag to trigger auto-focus
      },
    ]);
  };

  const updateText = (id: string, newText: string) => {
    setPlacedObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, text: newText } : obj)),
    );
  };

  const toggleEdit = (id: string, editing: boolean) => {
    setPlacedObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, isEditing: editing } : obj)),
    );
  };

  return (
    <div className="w-full h-screen bg-white overflow-hidden flex flex-col font-['Stack_Sans_Headline']">
      <div className="w-full px-10 py-3 bg-white shadow-md flex justify-between items-center z-10">
        <div className="text-black text-xl font-weight-600">
          Draw Accident Sketch
        </div>
        <div className="flex items-center gap-10">
          <button
            onClick={clearAll}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Clear All
          </button>
          <div className="flex items-center gap-2">
            <button className="px-8 py-4 border border-blue-600 text-blue-600 rounded">
              Cancel
            </button>
            <button className="px-8 py-4 bg-blue-600 text-white rounded font-weight-400">
              Save Sketch
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 p-10 gap-10 bg-gray-50 overflow-hidden">
        <aside className="w-60 flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-hide">
          <ToolboxSection
            title="CLIENT VEHICLE"
            images={clientAssets}
            onAdd={(src) => addObject(src, "vehicle")}
          />
          <ToolboxSection
            title="THIRD PARTY"
            images={tpAssets}
            onAdd={(src) => addObject(src, "vehicle")}
          />
          <ToolboxSection
            title="OBJECTS"
            images={objectAssets}
            onAdd={(src) => addObject(src, "object")}
          />

          <div className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col gap-4">
            <div className="text-center text-xs font-bold uppercase text-gray-400 tracking-widest">
              DRAW LINE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Enable Drawing</span>
              <button
                onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isDrawingEnabled ? "bg-blue-500" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isDrawingEnabled ? "left-5" : "left-1"}`}
                />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs font-weight-300 font-light">
                  Thickness
                </div>
                <div className="text-gray-600 text-xs font-weight-600">
                  {/* Calculate percentage: (current / max) * 100 */}
                  {Math.round((thickness / 10) * 100)}%
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={thickness}
                onChange={(e) => setThickness(parseInt(e.target.value))}
                className="w-full h-1 mt-3 bg-blue-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              {lineColors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveColor(c.hex)}
                  className={`w-5 h-5 mt-2 rounded-full ${c.bg} ${activeColor === c.hex ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={addTextLabel}
            className="p-4 rounded-lg border border-blue-200 bg-white text-blue-500 text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
          >
            <Type className="w-4 h-4" /> Add Text Label
          </button>
        </aside>

        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-inner relative overflow-hidden">
          {/* LAYER 1: Google Map Background */}
          <div className="absolute inset-0 z-0">
            {isLoaded && mapCenter ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={20} // High zoom for street-level detail
                options={{
                  disableDefaultUI: true, // Clean map for sketching
                  gestureHandling: "none", // Prevent map moving while drawing
                  // mapTypeId: "satellite", // Optional: use 'satellite' for realism
                  restriction: { latLngBounds: ukBounds, strictBounds: false },
                }}
              >
                <TrafficLayer />
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading Satellite Background...
              </div>
            )}
          </div>

          {/* LAYER 2: Drawing Canvas */}
          
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`absolute inset-0 z-10 w-full h-full ${isDrawingEnabled ? "cursor-crosshair" : "cursor-default"}`}
          />

          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* {placedObjects.map((obj) => (
              <Draggable key={obj.id} bounds="parent">
                <div className="absolute pointer-events-auto group cursor-move">
                  <button
                    onClick={() => removeObject(obj.id)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {obj.type === "text" ? (
          <div className="relative">
            {obj.isEditing ? (
              <input
                autoFocus
                className="px-3 py-1.5 bg-white border-2 border-blue-500 text-sm font-bold rounded shadow-lg text-blue-600 outline-none min-w-[100px]"
                value={obj.text}
                onChange={(e) => updateText(obj.id, e.target.value)}
                onBlur={() => toggleEdit(obj.id, false)}
                onKeyDown={(e) => e.key === 'Enter' && toggleEdit(obj.id, false)}
              />
            ) : (
              <div 
                onDoubleClick={() => toggleEdit(obj.id, true)}
                className="px-3 py-1.5 bg-white border-2 border-blue-500 text-sm font-bold rounded shadow-lg text-blue-600 select-none whitespace-nowrap"
              >
                {obj.text || "Type something..."}
              </div>
            )}
          </div>
        ) : (
        
                    <img
                      src={obj.src}
                      className="w-28 h-auto select-none"
                      alt="canvas item"
                      draggable={false}
                    />
                  )}
                </div>
              </Draggable>
            ))} */}
            {placedObjects.map((obj) => (
              <Draggable
                key={obj.id}
                bounds="parent"
                disabled={obj.isEditing}
                cancel=".action-button"
              >
                <div className="absolute pointer-events-auto group cursor-move">
                  <div
                    id={`obj-${obj.id}`}
                    style={{
                      // ORDER MATTERS: Scale and Flip first, then Rotate
                      transform: `rotate(${obj.rotation}deg) scaleX(${obj.isFlipped ? -obj.scale : obj.scale}) scaleY(${obj.scale})`,
                    }}
                    className="relative flex items-center justify-center p-2"
                  >
                    {/* Action Buttons Layer */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 action-button">
                      {/* Increase Size */}
                      {/* <button
                        onClick={(e) => handleScale(obj.id, 0.1, e)}
                        className="bg-gray-800 text-white rounded-full p-1.5 shadow-lg hover:bg-black transition-colors"
                        title="Increase Size"
                      >
                        <div className="w-3 h-3 flex items-center justify-center font-bold text-xs">
                          +
                        </div>
                      </button>

                      {/* Decrease Size
                      <button
                        onClick={(e) => handleScale(obj.id, -0.1, e)}
                        className="bg-gray-800 text-white rounded-full p-1.5 shadow-lg hover:bg-black transition-colors"
                        title="Decrease Size"
                      >
                        <div className="w-3 h-3 flex items-center justify-center font-bold text-xs">
                          -
                        </div>
                      </button> */}

                      {/* Flip Button */}
                      <button
                        onClick={(e) => toggleFlip(obj.id, e)}
                        className="bg-emerald-500 text-white rounded-full p-1.5 shadow-lg hover:bg-emerald-600"
                      >
                        <div className="w-3 h-3 flex items-center justify-center font-bold text-[10px]">
                          ⇄
                        </div>
                      </button>

                      {/* Rotation Handle */}
                      <button
                        onMouseDown={(e) => handleRotate(obj.id, e)}
                        className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-700 cursor-alias"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeObject(obj.id)}
                        className="bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {/* RESIZE HANDLE (BOTTOM RIGHT) */}
                    <div
                      onMouseDown={(e) => handleResize(obj.id, e)}
                      className="absolute -bottom-2 -right-2 w-6 h-6  rounded-md flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-50 action-button"
                    >
                      {/* A small diagonal drag icon */}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-neutral-700 rotate-45"
                      >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                    {/* Content Rendering */}
                    {obj.type === "text" ? (
                      <div className="relative">
                        {/* Text needs to stay readable (not flipped or scaled backwards) */}
                        <div style={{ transform: `scale(${1 / obj.scale})` }}>
                          {/* Note: This nested div "normalizes" the text size while the box scales */}
                          {obj.isEditing ? (
                            <input
                              autoFocus
                              className="px-3 py-1.5 bg-white border-2 border-blue-500 text-sm font-bold rounded shadow-xl text-blue-600 outline-none"
                              value={obj.text}
                              onChange={(e) =>
                                updateText(obj.id, e.target.value)
                              }
                              onBlur={() => toggleEdit(obj.id, false)}
                            />
                          ) : (
                            <div
                              onDoubleClick={() => toggleEdit(obj.id, true)}
                              className="px-3 py-1.5 bg-white border-2 border-blue-500 text-sm font-bold rounded shadow-md text-blue-600 whitespace-nowrap"
                            >
                              {obj.text || "Label"}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={obj.src}
                        className="w-32 h-auto select-none pointer-events-none"
                        alt="vehicle"
                      />
                    )}
                  </div>
                </div>
              </Draggable>
            ))}
          </div>

          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1.5px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* {placedObjects.length === 0 && !isDrawingEnabled && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
              Select a tool or vehicle to begin sketch
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};;

const ToolboxSection = ({
  title,
  images,
  onAdd,
}: {
  title: string;
  images: string[];
  onAdd: (src: string) => void;
}) => {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col gap-4 shadow-sm">
      <div className="text-center text-[15px] font-weight-600 uppercase text-gray-400 tracking-widest leading-4">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {images.map((src, i) => (
          <div
            key={i}
            onClick={() => onAdd(src)}
            className="cursor-pointer border border-gray-100 hover:border-blue-400 rounded-md p-2 transition-all hover:bg-blue-50/50 flex items-center justify-center group"
          >
            <img
              src={src}
              alt={`${title}-${i}`}
              className="w-full h-auto max-h-12 object-contain group-hover:scale-105 transition-transform"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step4Canvas;