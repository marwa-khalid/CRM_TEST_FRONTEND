// Client Vehicles
import Client1 from "../../../assets/AutoClaim_icon/canvas/Client1.svg";
import Client2 from "../../../assets/AutoClaim_icon/canvas/Client2.svg";
import Client3 from "../../../assets/AutoClaim_icon/canvas/Client3.svg";
import Client4 from "../../../assets/AutoClaim_icon/canvas/Client4.svg";
import Client5 from "../../../assets/AutoClaim_icon/canvas/Client5.svg";

// Third Party Vehicles
import TP1 from "../../../assets/AutoClaim_icon/canvas/TP1.svg";
import TP2 from "../../../assets/AutoClaim_icon/canvas/TP2.svg";
import TP3 from "../../../assets/AutoClaim_icon/canvas/TP3.svg";
import TP4 from "../../../assets/AutoClaim_icon/canvas/TP4.svg";
import TP5 from "../../../assets/AutoClaim_icon/canvas/TP5.svg";
import html2canvas from "html2canvas";
// Objects
import Obj1 from "../../../assets/AutoClaim_icon/canvas/Obj1.svg";
import Obj2 from "../../../assets/AutoClaim_icon/canvas/Obj2.svg";
import Obj3 from "../../../assets/AutoClaim_icon/canvas/Obj3.svg";
import Obj4 from "../../../assets/AutoClaim_icon/canvas/Obj4.svg";
import Obj5 from "../../../assets/AutoClaim_icon/canvas/Obj5.svg";
import Obj6 from "../../../assets/AutoClaim_icon/canvas/Obj6.svg";
import clock from '../../../assets/AutoClaim_icon/canvas/clock.svg'
import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { RotateCcw, Type, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  GoogleMap,
  useJsApiLoader,
  TrafficLayer,
} from "@react-google-maps/api";
import { useQuestionnaireForm } from "./QuestionnaireLayout";
import { formSubmitquestionaire } from "../../../services/Accidents/Cards/cards";

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

interface CanvasObject {
  id: string;
  src: string;
  x: number;
  y: number;
  rotation: number;
  isFlipped: boolean;
  type: "vehicle" | "object" | "text";
  scale: number;
  text?: string;
  isEditing?: boolean;
}

const QUESTION_KEYS = [
  "didSeeAccident",
  "location",
  "weatherConditions",
  "roadConditions",
  "vehicleDescription",
  "warningGiven",
  "lightsDisplayed",
  "speedEstimate",
  "obstructedView",
  "driverActions",
  "distanceTravelled",
  "avoidableCollision",
  "faultOpinion",
  "knownDriver",
  "policeStatement",
  "otherWitnesses",
  "interviewLocation",
  "conversationAfterAccident",
];

const CanvasScreen = ({
  mode = "page",
  onClose,
  onSaved,
}: {
  mode?: "page" | "overlay";
  onClose?: () => void;
  onSaved?: () => void;
}) => {
  const navigate = useNavigate();
  const sketchCaptureRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { token } = useParams();
  const { formData, updateStepData, resetFormData } = useQuestionnaireForm();

  const searchParams = new URLSearchParams(location.search);
  const queryToken = searchParams.get("details");
  const queryClaimId = searchParams.get("claim_id");

  const finalToken = token || queryToken || "";
  const claimId = queryClaimId || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY,
    libraries,
  });

  useEffect(() => {
    const savedLocation = localStorage.getItem("location");

    if (isLoaded && savedLocation) {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address: savedLocation }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const { lat, lng } = results[0].geometry.location;
          setMapCenter({ lat: lat(), lng: lng() });
        }
      });
    }
  }, [isLoaded]);

  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [thickness, setThickness] = useState(2);
  const [activeColor, setActiveColor] = useState("#000000");
  const [placedObjects, setPlacedObjects] = useState<CanvasObject[]>(
    formData.signature?.placedObjects || [],
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clientAssets = [Client1, Client2, Client3, Client4, Client5];
  const tpAssets = [TP1, TP2, TP3, TP4, TP5];
  const objectAssets = [Obj1, Obj2, Obj3, Obj4, Obj5, Obj6];

  const lineColors = [
    { name: "black", hex: "#000000", bg: "bg-black" },
    { name: "blue", hex: "#2563eb", bg: "bg-blue-600" },
    { name: "red", hex: "#b91c1c", bg: "bg-red-700" },
    { name: "amber", hex: "#f59e0b", bg: "bg-amber-500" },
    { name: "lime", hex: "#4d7c0f", bg: "bg-lime-700" },
  ];

  useEffect(() => {
    updateStepData("signature", {
      placedObjects,
    });
  }, [placedObjects]);

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

      if (formData.signature?.sketchImage) {
        const image = new Image();
        image.src = formData.signature.sketchImage;
        image.onload = () => {
          context.drawImage(
            image,
            0,
            0,
            canvas.offsetWidth,
            canvas.offsetHeight,
          );
        };
      }
    }
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = activeColor;
      contextRef.current.lineWidth = thickness;
    }
  }, [activeColor, thickness]);

const getSketchImage = async () => {
  if (!sketchCaptureRef.current) return "";

  const capturedCanvas = await html2canvas(sketchCaptureRef.current, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: 2,
  });

  return capturedCanvas.toDataURL("image/png");
};

const saveSketchToState = async () => {
  const sketchImage = await getSketchImage();

  updateStepData("signature", {
    sketchImage,
    placedObjects,
  });

  toast.success("Sketch saved");

  if (mode === "overlay") {
    onSaved?.();
  } else {
    navigate(`${token ? `/questionnaire/${token}` : "/questionnaire"}/step-3`);
  }
};

  const buildAnswers = (sketchImage: string) => {
    const witnessDetails = formData.witnessDetails || {};
    const questionnaire = formData.questionnaire || {};
    const incidentSketch = formData.incidentSketch || {};

    const answers: { question: string; answer: any }[] = [
      {
        question: "name",
        answer: witnessDetails.name || "",
      },
      {
        question: "address",
        answer: witnessDetails.address || "",
      },
      {
        question: "dob",
        answer: witnessDetails.dob || "",
      },
      {
        question: "occupation",
        answer: witnessDetails.occupation || "",
      },
    ];

    QUESTION_KEYS.forEach((key, index) => {
      answers.push({
        question: key,
        answer: questionnaire[index] || "",
      });
    });

    answers.push(
      {
        question: "accidentDescription",
        answer: incidentSketch.accidentDescription || "",
      },
      {
        question: "statementOfTruth",
        answer: incidentSketch.isTruthConfirmed ? "Yes" : "No",
      },
      {
        question: "sketch",
        answer: sketchImage || "",
      },
      {
        question: "sketchObjects",
        answer: JSON.stringify(placedObjects || []),
      },
    );

    return answers;
  };

  // const handleFinalSubmit = async () => {
  //   try {
  //     if (!finalToken) {
  //       toast.error("Questionnaire token is missing");
  //       return;
  //     }

  //     if (!formData.incidentSketch?.isTruthConfirmed) {
  //       toast.error("Please confirm the statement of truth before submitting");
  //       return;
  //     }

  //     setIsSubmitting(true);

  //     const sketchImage = getSketchImage();

  //     updateStepData("signature", {
  //       sketchImage,
  //       placedObjects,
  //     });

  //     const payload = {
  //       status: "completed",
  //       claimId: claimId || null,
  //       witness_sign: null,
  //       officer_sign: null,
  //       witness_name: formData.witnessDetails?.name || "",
  //       officer_name: "",
  //       date_of_witness: new Date().toISOString(),
  //       date_of_officer: null,
  //       answers: buildAnswers(sketchImage),
  //     };

  //     await formSubmitquestionaire(payload, finalToken);

  //     toast.success("Questionnaire submitted successfully");

  //     resetFormData();
  //     navigate("/claims");
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Failed to submit questionnaire");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const removeObject = (id: string) => {
    setPlacedObjects((prev) => prev.filter((obj) => obj.id !== id));
  };

  const handleResize = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const objElement = document.getElementById(`obj-${id}`);
    if (!objElement) return;

    const initialScale = placedObjects.find((o) => o.id === id)?.scale || 1;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
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

  const handleRotate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const objElement = document.getElementById(`obj-${id}`);
      if (!objElement) return;

      const rect = objElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX,
      );

      const degree = angle * (180 / Math.PI) + 90;

      setPlacedObjects((prev) =>
        prev.map((obj) => (obj.id === id ? { ...obj, rotation: degree } : obj)),
      );
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

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

    updateStepData("signature", {
      sketchImage: getSketchImage(),
      placedObjects,
    });
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    contextRef.current?.clearRect(0, 0, canvas.width, canvas.height);
    setPlacedObjects([]);

    updateStepData("signature", {
      sketchImage: "",
      placedObjects: [],
    });
  };

  const addObject = (src: string, type: "vehicle" | "object") => {
    setPlacedObjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        src,
        x: 50,
        y: 50,
        rotation: 0,
        scale: 1,
        isFlipped: false,
        type,
      },
    ]);
  };

  const addTextLabel = () => {
    const newId = Date.now().toString();

    setPlacedObjects((prev) => [
      ...prev,
      {
        id: newId,
        src: "",
        x: 100,
        y: 100,
        rotation: 0,
        scale: 1,
        isFlipped: false,
        type: "text",
        text: "",
        isEditing: true,
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
    <div
      className={
        mode === "overlay"
          ? "fixed inset-0 z-[9999] bg-white overflow-hidden flex flex-col font-['Stack_Sans_Headline']"
          : "w-full h-screen bg-white overflow-hidden flex flex-col font-['Stack_Sans_Headline']"
      }
    >
      <div className="w-full px-10 py-3 bg-white shadow-md flex justify-between items-center z-10">
        <div className="text-neutral-900 text-[20px] font-weight-600">
          Draw Accident Sketch
        </div>

        <div className="flex items-center gap-10">
          <button
            onClick={clearAll}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            <img src={clock} alt="" /> Clear All
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (mode === "overlay") onClose?.();
                else navigate(-1);
              }}
              className="px-8 py-4 border border-blue-500 text-blue-500 rounded"
            >
              Cancel
            </button>

            <button
              onClick={saveSketchToState}
              className="px-8 py-4 bg-blue-500 text-white rounded font-weight-400 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Save Sketch
            </button>

            {/* <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 bg-blue-600 text-white rounded font-weight-400 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Questionnaire"}
            </button> */}
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
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  isDrawingEnabled ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                    isDrawingEnabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-xs font-weight-300 font-light">
                  Thickness
                </div>

                <div className="text-gray-600 text-xs font-weight-600">
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
                  className={`w-5 h-5 mt-2 rounded-full ${c.bg} ${
                    activeColor === c.hex
                      ? "ring-2 ring-blue-400 ring-offset-1"
                      : ""
                  }`}
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

        <div
          ref={sketchCaptureRef}
          className="flex-1 bg-white rounded-lg border border-gray-200 shadow-inner relative overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            {isLoaded && mapCenter ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={20}
                options={{
                  disableDefaultUI: true,
                  gestureHandling: "none",
                  restriction: {
                    latLngBounds: ukBounds,
                    strictBounds: false,
                  },
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
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`absolute inset-0 z-10 w-full h-full ${
              isDrawingEnabled ? "cursor-crosshair" : "cursor-default"
            }`}
          />
          <div className="absolute inset-0 z-20">
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
                      transform: `rotate(${obj.rotation}deg) scaleX(${
                        obj.isFlipped ? -obj.scale : obj.scale
                      }) scaleY(${obj.scale})`,
                    }}
                    className="relative flex items-center justify-center p-2"
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 action-button">
                      <button
                        onClick={(e) => toggleFlip(obj.id, e)}
                        className="bg-emerald-500 text-white rounded-full p-1.5 shadow-lg hover:bg-emerald-600"
                      >
                        <div className="w-3 h-3 flex items-center justify-center font-bold text-[10px]">
                          ⇄
                        </div>
                      </button>

                      <button
                        onMouseDown={(e) => handleRotate(obj.id, e)}
                        className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-700 cursor-alias"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => removeObject(obj.id)}
                        className="bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div
                      onMouseDown={(e) => handleResize(obj.id, e)}
                      className="absolute -bottom-2 -right-2 w-6 h-6 rounded-md flex items-center justify-center cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-50 action-button"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-neutral-700 rotate-45"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>

                    {obj.type === "text" ? (
                      <div className="relative">
                        <div style={{ transform: `scale(${1 / obj.scale})` }}>
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
        </div>
      </div>
    </div>
  );
};

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

export default CanvasScreen;
