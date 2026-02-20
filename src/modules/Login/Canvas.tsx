import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric"; // For v6, use 'fabric'

export const AccidentSketch = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

useEffect(() => {
  // Initialize Canvas
  const canvas = new fabric.Canvas(canvasRef.current!, {
    width: 600,
    height: 400,
    backgroundColor: "#f0f0f0",
  });
  fabricRef.current = canvas;

  // FIX: Wrap the async dispose in a synchronous arrow function
  return () => {
    canvas.dispose();
  };
}, []);
  // 1. Add Vehicle (Rectangle or SVG)
  const addVehicle = (type: string) => {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: type === "car" ? "red" : "blue",
      width: type === "car" ? 60 : 100,
      height: 40,
      angle: 0,
    });
    fabricRef.current?.add(rect);
  };

  // 2. Toggle Drawing Mode (for Roads/Marks)
  const toggleDrawing = () => {
    if (!fabricRef.current) return;
    const nextMode = !isDrawing;
    setIsDrawing(nextMode);
    fabricRef.current.isDrawingMode = nextMode;

    // Customize brush
    if (nextMode) {
      fabricRef.current.freeDrawingBrush = new fabric.PencilBrush(
        fabricRef.current,
      );
      fabricRef.current.freeDrawingBrush.width = 5;
      fabricRef.current.freeDrawingBrush.color = "black";
    }
  };

  const clearCanvas = () => fabricRef.current?.clear();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        fontFamily: "monospace",
      }}
    >
      <h2 style={{ color: "#d9534f" }}>Accident Sketch</h2>
      <p>Drag vehicles and draw the accident scene</p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          border: "2px dashed #999",
          padding: "10px",
        }}
      >
        {/* TOOLBOX */}
        <div
          style={{
            width: "200px",
            borderRight: "1px solid #ccc",
            paddingRight: "15px",
          }}
        >
          <h4 style={{ color: "#d9534f" }}>TOOLBOX</h4>
          <hr />
          <p>
            <strong>Vehicles</strong>
          </p>
          <button onClick={() => addVehicle("car")}>[Car]</button>
          <button onClick={() => addVehicle("truck")}>[Truck]</button>

          <p>
            <strong>Drawing</strong>
          </p>
          <button
            onClick={toggleDrawing}
            style={{ backgroundColor: isDrawing ? "#ffcccc" : "#eee" }}
          >
            {isDrawing ? "Drawing: ON" : "Toggle ON/OFF"}
          </button>

          <div style={{ marginTop: "10px" }}>
            <span>Color: </span>
            <input
              type="color"
              onChange={(e) => {
                if (fabricRef.current?.freeDrawingBrush)
                  fabricRef.current.freeDrawingBrush.color = e.target.value;
              }}
            />
          </div>

          <p>
            <strong>Labels</strong>
          </p>
          <button
            onClick={() => {
              const text = new fabric.IText("Street Name", {
                left: 50,
                top: 50,
                fontSize: 20,
              });
              fabricRef.current?.add(text);
            }}
          >
            Add Text
          </button>
        </div>

        {/* CANVAS AREA */}
        <div style={{ flex: 1 }}>
          <canvas ref={canvasRef} style={{ border: "1px solid #000" }} />

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button onClick={clearCanvas}>Clear Drawing</button>
            <button onClick={() => alert("Saved!")}>Save Sketch</button>
          </div>
        </div>
      </div>
    </div>
  );
};
