import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import carTopView from "../../assets/images/748e2eb5bb4752f4038bd83956052738e93317bb.png";
import { ButtonGroup, ButtonGroupItem } from "../base/button-group/button-group";
import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useParams, useSearchParams } from "react-router-dom";
import { getClientVehicle, getThirdPartyVehicle } from "../../services/Lookups/Generaldetails";
import CustomSelect from "../ReactSelect/ReactSelect";
import { useDispatch, useSelector } from "react-redux";
import { aiAnalyze, aiAnalyzeSingle, generateClientReport, generateThirdPartyReport, getReportList, saveDamageDetails, sendEmailReport, updateVehicleDamage } from "../../services/VehicleDamage/VehicleDamage";
import { getVehicleDetail } from "../../services/Vehicle/vehicle";
import html2pdf from "html2pdf.js";
import { setClientVehicleIdStore, setThirdPartyVehicleIdStore, setVehicleDataState } from "../../redux/Claim/claimSlice";

// Validation schema
const validationSchema = Yup.object().shape({
  entryMode: Yup.string().required("Entry mode is required"),
  client: Yup.object().shape({
    areaDamage: Yup.string().required("Client area of damage is required"),
    unrelatedDamage: Yup.string().nullable(),
    // status: Yup.string().required("Client vehicle status is required"),
    images: Yup.array().when("entryMode", {
      is: "ai",
      then: Yup.array().min(1, "At least one client image is required"),
      otherwise: Yup.array().notRequired(),
    }),
  }),
  thirdParty: Yup.object().shape({
    areaDamage: Yup.string().required("Third party area of damage is required"),
    unrelatedDamage: Yup.string().nullable(),
    // status: Yup.string().required("Third party vehicle status is required"),
    images: Yup.array().when("entryMode", {
      is: "ai",
      then: Yup.array().min(1, "At least one third party image is required"),
      otherwise: Yup.array().notRequired(),
    }),
  }),
});

// All possible damage zones
const allDamageZones = ["front", "offside-front", "offside-middle", "offside-rear", "rear", "nearside-rear", "nearside-middle", "nearside-front"];

// Helper function to convert array to object with all zones
const convertZonesToObject = (zonesArray: string[]) => {
  const zonesObject: { [key: string]: boolean } = {};
  allDamageZones.forEach(zone => {
    zonesObject[zone] = zonesArray.includes(zone);
  });
  return zonesObject;
};

// Helper function to convert object back to array of selected zones
const convertObjectToZones = (zonesObject: { [key: string]: boolean }) => {
  return Object.keys(zonesObject).filter(zone => zonesObject[zone]);
};

export interface VehicleDamageProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

type VehicleSectionProps = {
  title: string;
  subTitle: string;
  type: string;
  selectedZones: { [key: string]: boolean };
  setSelectedZones: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  isDisabled?: boolean;
};

type VehicleAISectionProps = {
  title: string;
  subTitle: string;
  type: string;
  loadData: void;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setFieldValue: (field: string, value: any) => void;
  isDisabled?: boolean;
  clientVehicleId?: string;
  thirdPartyVehicleId?: string;
  className?: string;
};

const ImageUploader = ({
  images,
  setImages,
  setModalOpen,
  type,
  loadData,
  setFieldValue,
  setClientReport,
  setThirdPartyReport,
  isDisabled,
  clientVehicleId,
  thirdPartyVehicleId,
}: {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  type: string;
  setFieldValue: (field: string, value: any) => void;
  setClientReport: React.Dispatch<React.SetStateAction<null>>;
  setThirdPartyReport: React.Dispatch<React.SetStateAction<null>>;
  isDisabled?: boolean;
  clientVehicleId?: string;
  thirdPartyVehicleId?: string;
}) => {

  const { id } = useParams()
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');

  const { clientVehicleIdStore, thirdPartyVehicleIdStore } = useSelector((state: any) => state.isClosed);
  const vehicleData = useSelector((state) => state.isClosed.vehicleDataStateAI)

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [damageDetailsClient, setDamageDetailsClient] = useState(false)
  const [damageDetailsThird, setDamageDetailsThird] = useState(false)
  const [analyzeResponseClient, setAnalyzeResponseClient] = useState(null)
  const [analyzeResponseThird, setAnalyzeResponseThird] = useState(null)
  const [singleImageAnalysisResponse, setSingleImageAnalysisResponse] = useState(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewModal, setImageViewModal] = useState(false);
  const [loading, setLoading] = useState(false)
  const [disableAnalyze, setDisableAnalyze] = useState(false)
  const [reportListModal, setReportListModal] = useState(false)
  const [reportVersions, setReportVersions] = useState([])
  const [loadingImageIndex, setLoadingImageIndex] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = React.useState({ width: 0, height: 0 });
  const imgRef = React.useRef(null);


  const base64ToFile = async (imageSrc: string, filenameBase: string): Promise<File | null> => {
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(blob.type)) {
        console.warn(`Unsupported file type: ${blob.type}`);
        return null;
      }

      const extension = blob.type === 'image/png' ? 'png' : 'jpg';
      const filename = `${filenameBase}.${extension}`;

      return new File([blob], filename, { type: blob.type });
    } catch (err) {
      console.error('Failed to convert base64/URL to File:', err);
      return null;
    }
  };


  useEffect(() => {
    const prepareFiles = async () => {
      if (images?.length > 0 && files?.length === 0) {
        const filePromises = images?.map((img, index) => base64ToFile(img, `image-${index}`));
        const result = await Promise.all(filePromises);
        const validFiles = result.filter((file): file is File => file !== null);
        setFiles(validFiles);
        setDamageDetailsClient(true)
        setDamageDetailsThird(true)
      }
    };

    prepareFiles();
  }, [images]);


  const handleAddImage = () => {
    if (!isDisabled) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;

    setDisableAnalyze(false);

    if (selectedFiles && selectedFiles.length > 0) {
      const fileArray = Array.from(selectedFiles);
      const previews = fileArray.map((file) => URL.createObjectURL(file));

      setFiles((prev) => [...prev, ...fileArray]);
      setImages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const updatedImages = [...safePrev, ...previews];
        setFieldValue(`${type.toLowerCase()}.images`, updatedImages);
        return updatedImages;
      });
    }

    e.target.value = '';
  };



  const transformResponseToPayload = (response: any) => {
    const normalizedReport = response.normalized_report;
  
    const responseImages = response?.annotated_images?.map(img => img.file_path) || [];
  
    const cleanedImages =
      responseImages.length > 0
        ? responseImages
        : (images || [])
            .map(item => {
              if (typeof item === 'object' && item.uploaded_image_url) {
                return item.uploaded_image_url;
              }
              if (typeof item === 'object' && item.file_path) {
                return item.file_path;
              }
              return typeof item === 'string' ? item : null;
            })
            .filter(Boolean);
  
    const commonFields = {
      damage_side: normalizedReport?.damage_side || "",
      area_of_damage: normalizedReport?.area_of_damage || "",
      type_of_damage: normalizedReport?.type_of_damage || "",
      severity: normalizedReport?.severity || "",
      confidence_percent: normalizedReport?.confidence_percent || 0,
      total_damaged_points_identified: normalizedReport?.total_damaged_points_identified || 0,
      suggested_repair_action: normalizedReport?.suggested_repair_action || "",
      vehicle_status_id: 4,
      raw_result: normalizedReport?.raw_result || {},
      images: cleanedImages,
    };
  
    const vehicleDetailPayload = {
      id: type === 'Client' ? clientVehicleIdStore : thirdPartyVehicleIdStore,
      client_area_of_damage: normalizedReport?.area_of_damage || "",
      client_unrelated_damage: normalizedReport?.client_unrelated_damage || "",
      client_vehicle_status_id: 4,
      damage_diagram: normalizedReport?.damage_diagram || {},
      ...commonFields,
    };
  
    const payload: any = {
      claim_id: parseInt(claimID || id),
      ...commonFields,
    };
  
    delete payload.images;
  
    if (type === 'Client') {
      payload.vehicle_detail = vehicleDetailPayload;
    } else {
      payload.third_party_vehicle_detail = vehicleDetailPayload;
    }
 
    return payload;
  };
  



  const analyzeImage = async (type: string) => {
    setLoading(true)
    try {
      if (images.length === 0) return;

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      formData.append("include_summary", "true");
      formData.append("include_annotated_image", "true");

      const response = await aiAnalyze(formData);
      if (type === 'Client') {
        setAnalyzeResponseClient(response)
      } else {
        setAnalyzeResponseThird(response)
      }

      const payload = transformResponseToPayload(response);
      const res = await saveDamageDetails(payload)
      setImages(res?.images)
      if (type === 'Client') {
        setDamageDetailsClient(true)
      } else {
        setDamageDetailsThird(true)
      }
      loadData()

    } catch (error) {
      console.error("Image analysis failed", error);
    } finally {
      setDisableAnalyze(true)
      setLoading(false)
    }
  };

  const analyzeSingleImage = async (imageIndex: number, type: string, src: string) => {
    try {
      // if (files.length === 0 || !files[imageIndex]) return;
      // let formData = new FormData()
      let payload
      // if(files.length > 0){
      payload = {
        image_urls: [src],
        include_summary: true,
        include_annotated_image: true
      }
      const response = await aiAnalyzeSingle(payload, "payload");
      setSingleImageAnalysisResponse(response);
      // } else{
      //   const imageUrl = images[imageIndex].file_path;
      //   const response = await fetch(imageUrl);
      //   const blob = await response.blob();

      //   const filename = `image-${imageIndex}.jpg`;

      //   const file = new File([blob], filename, { type: blob.type });

      //   formData.append("images", file);
      //   formData.append("include_summary", "true");
      //   formData.append("include_annotated_image", "true");
      //   const res = await aiAnalyzeSingle(formData, "formData");
      //   setSingleImageAnalysisResponse(res);
      // }

      setImageViewModal(true);
    } catch (error) {
      console.error("Single image analysis failed", error);
      toast.error("Failed to analyze image");
    }
  };

  const handleViewReport = async (type: string) => {
    setReportListModal(true)
    try {
      let res
      if (type === 'Client') {
        res = await getReportList(id || claimID, 'client')
        setReportVersions(res.versions)
      } else {
        res = await getReportList(id || claimID, 'third_party')
        setReportVersions(res.versions)
      }
    } catch (e) {

    }
  }

  const handleReportViewClick = async (report: any, type: string) => {
    setReportListModal(false)
    try {
      let res;
      if (type === 'Client') {
        res = await generateClientReport(id || claimID, 'client', report.version)
      } else {
        res = await generateThirdPartyReport(id || claimID, 'third_party', report.version)
      }
      if (type === 'Client') {
        setClientReport(res)
      } else {
        setThirdPartyReport(res)
      }

    } catch (e) {
      toast.error('Unable to get report')
    } finally {
      setModalOpen(true)
    }
  }

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);

    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };



  return (
    <>
      <div className="border rounded-md p-4">
        <div className="flex gap-3 overflow-x-auto mb-4">
          {images?.length > 0 && images.map((src, idx) => {
            return (
              <div key={idx} className="relative h-20 w-20 shrink-0">
                <img
                  src={typeof src !== 'object' ? src : src.uploaded_image_url || src.file_path}
                  alt={`vehicle-${idx}`}
                  onClick={() => {
                    setSelectedImage(typeof src !== 'object' ? src : src.file_path);
                    setLoadingImageIndex(idx);
                    analyzeSingleImage(idx, type, typeof src !== 'object' ? src : src.uploaded_image_url || src.file_path).finally(() => {
                      setLoadingImageIndex(null);
                    });
                  }}
                  className={`h-20 w-20 rounded-md object-cover hover:cursor-pointer ${loadingImageIndex === idx ? "opacity-50" : ""}`}
                />

                {/* X Button */}
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-100"
                  >
                    ×
                  </button>
                )}

                {/* Loader Overlay */}
                {loadingImageIndex === idx && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={handleAddImage}
            disabled={isDisabled}
            className={`flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md text-3xl font-light text-gray-400 shrink-0 ${isDisabled ? "cursor-not-allowed" : "hover:border-[#414651] hover:text-[#414651]"
              }`}
          >
            +
          </button>
        </div>



        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isDisabled}
        />

        <button
          onClick={() => analyzeImage(type)}
          type="button"
          disabled={disableAnalyze}
          className={`px-4 py-2 rounded-md text-white font-medium ${images?.length === 0 || disableAnalyze
            ? "bg-[#b8b8b8] cursor-not-allowed"
            : "bg-custom hover:bg-[#414651]"
            }`}
        >
          {loading && type ? 'Analyzing...' : disableAnalyze ? 'Analyzed' : 'Analyze Images'}
        </button>
        <Modal open={imageViewModal} onClose={() => setImageViewModal(false)}>
          <div className="max-w-4xl w-full bg-white rounded-lg shadow-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Section */}
              <div>
  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
    Selected Image
  </h3>
  {/* Container for image and bounding boxes */}
  <div className="relative w-full" style={{ maxWidth: 800 }}>
    <img
      src={selectedImage}
      alt="Full Size"
      className="w-full h-auto rounded"
      ref={imgRef}
      onLoad={(e) => {
        setImageDimensions({
          width: e.currentTarget.naturalWidth,
          height: e.currentTarget.naturalHeight,
        });
      }}
    />

    {/* Bounding Boxes */}
    {imageDimensions.width &&
      imageDimensions.height &&
      singleImageAnalysisResponse?.predictions?.map((prediction, idx) => {
        // Calculate scale relative to displayed image size
        // Since image is responsive (w-full, h-auto), calculate display size dynamically

        // First, get the displayed image width and height from imgRef
        const displayWidth = imgRef.current?.clientWidth || 0;
        const displayHeight = imgRef.current?.clientHeight || 0;

        if (!displayWidth || !displayHeight) return null;

        const scaleX = displayWidth / imageDimensions.width;
        const scaleY = displayHeight / imageDimensions.height;

        // Convert center (x,y) to top-left coords and scale
        const left = (prediction.x - prediction.width / 2) * scaleX;
        const top = (prediction.y - prediction.height / 2) * scaleY;
        const width = prediction.width * scaleX;
        const height = prediction.height * scaleY;

        return (
          <div
            key={prediction.detection_id || idx}
            className="absolute border-2 border-red-500 rounded pointer-events-none"
            style={{ left, top, width, height, boxSizing: "border-box" }}
          >
            {/* <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded-br select-none">
              {prediction.class} — {Math.round(prediction.confidence * 100)}%
            </div> */}
          </div>
        );
      })}
  </div>
</div>


              {/* Analysis Results Section */}
              {singleImageAnalysisResponse && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                    Analysis Results
                  </h3>
                  <div className="grid grid-cols-1 gap-y-3 gap-x-6 text-sm">
                    <div className="text-gray-500 font-medium">Damage side</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.area_of_damage || ''} readOnly />

                    <div className="text-gray-500 font-medium">Area of damage</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.area_of_damage || ''} readOnly />

                    <div className="text-gray-500 font-medium">Type of damage</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.type_of_damage || ''} readOnly />

                    <div className="text-gray-500 font-medium">Severity</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.severity || ''} readOnly />

                    <div className="text-gray-500 font-medium">Confidence</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={`${singleImageAnalysisResponse?.normalized_report?.confidence_percent || 0}%`} readOnly />

                    <div className="text-gray-500 font-medium">Total damaged points identified</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.total_damaged_points_identified || ''} readOnly />

                    <div className="text-gray-500 font-medium">Suggested repair action</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.suggested_repair_action || ''} readOnly />

                    <div className="text-gray-500 font-medium">Vehicle status</div>
                    <input type="text" className="w-full border rounded px-3 py-2 text-sm" value="Unroadworthy" readOnly />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
        <Modal open={reportListModal} onClose={() => setReportListModal(false)}>
          <div className="max-w-4xl w-full bg-white rounded-lg shadow-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Select Report to View {type}
                </h3>
                {/* <img src={selectedImage} alt="Full Size" className="w-full h-auto rounded" /> */}
              </div>
            </div>
            {reportVersions?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Version</th>
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportVersions.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b text-sm text-gray-800">Report - v{item.version}</td>
                        <td className="px-4 py-2 border-b text-sm text-gray-800">{item.version_notes || 'No text available'}</td>
                        <td className="px-4 py-2 border-b">
                          <button
                            onClick={() => handleReportViewClick(item, type)}
                            className="px-4 py-1 bg-custom text-white rounded hover:bg-[#252B37] transition text-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


          </div>
        </Modal>
      </div>
      {(damageDetailsClient && type === 'Client') || (vehicleData !== null && id && type === 'Client' && damageDetailsClient) ? <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          Damage Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
          <div className="text-gray-500 font-medium">Damage side</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.area_of_damage || vehicleData?.ai_reports[0]?.area_of_damage} readOnly />

          <div className="text-gray-500 font-medium">Area of damage</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.area_of_damage || vehicleData?.ai_reports[0]?.area_of_damage} readOnly />

          <div className="text-gray-500 font-medium">Type of damage</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.type_of_damage || vehicleData?.ai_reports[0]?.type_of_damage} readOnly />

          <div className="text-gray-500 font-medium">Severity</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.severity || vehicleData?.ai_reports[0]?.severity} readOnly />

          <div className="text-gray-500 font-medium">Confidence</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={`${analyzeResponseClient?.normalized_report?.confidence_percent || vehicleData?.ai_reports[0]?.confidence_percent}%`} readOnly />

          <div className="text-gray-500 font-medium">Total damaged points identified</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.total_damaged_points_identified || vehicleData?.ai_reports[0]?.total_damaged_points_identified} readOnly />

          <div className="text-gray-500 font-medium">Suggested repair action</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.suggested_repair_action || vehicleData?.ai_reports[0]?.suggested_repair_action} readOnly />

          <div className="text-gray-500 font-medium">Vehicle status</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value="Unroadworthy" readOnly />
        </div>
        <button
          type="button"
          onClick={() => {
            // setReportListModal(true)
            handleViewReport(type)
          }}
          className="px-4 mt-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          View Report
        </button>
      </div> : (damageDetailsThird && type !== 'Client') || (vehicleData !== null && id && type !== 'Client' && damageDetailsThird) ? <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          Damage Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div className="text-gray-500 font-medium">Damage side</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.area_of_damage || vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.area_of_damage} readOnly />

          <div className="text-gray-500 font-medium">Area of damage</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.area_of_damage || vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.area_of_damage} readOnly />

          <div className="text-gray-500 font-medium">Type of damage</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.type_of_damage || vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.type_of_damage} readOnly />

          <div className="text-gray-500 font-medium">Severity</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.severity || analyzeResponseThird?.normalized_report?.severity} readOnly />

          <div className="text-gray-500 font-medium">Confidence</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={`${vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.confidence_percent || analyzeResponseThird?.normalized_report?.confidence_percent}%`} readOnly />

          <div className="text-gray-500 font-medium">Total damaged points identified</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.total_damaged_points_identified || vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.total_damaged_points_identified} readOnly />

          <div className="text-gray-500 font-medium">Suggested repair action</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.suggested_repair_action || vehicleData?.third_party_vehicles[0]?.ai_reports[0]?.suggested_repair_action} readOnly />

          <div className="text-gray-500 font-medium">Vehicle status</div>
          <input type="text" className="w-full border rounded px-3 py-2 text-sm" value="Unroadworthy" readOnly />
        </div>
        <button
          type="button"
          onClick={() => {
            // setReportListModal(true)
            handleViewReport(type)
          }}
          className="px-4 mt-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          View Report
        </button>
      </div> : ''}

    </>

  );
};

const VehicleAISection: React.FC<VehicleAISectionProps> = ({
  clientVehicleId,
  thirdPartyVehicleId,
  title,
  subTitle,
  type,
  loadData,
  images,
  setImages,
  setFieldValue,
  isDisabled,
  className = "", 
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { id } = useParams()
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');
  const [clientReport, setClientReport] = useState(null)
  const [thirdPartyReport, setThirdPartyReport] = useState(null)
    const imageRefs = useRef([]);
    const imageRefClient = useRef([])
  const [imageSizes, setImageSizes] = useState([]);
  const [imageSizesClient, setImageSizesClient] = useState([])
  const [email, setEmail] = useState('')
  const [query, setQuery] = useState('')
  const [emailModal, setEmailModal] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false); 

  const vehicleData = useSelector((state) => state.isClosed.vehicleDataStateAI)

  const reportRefThirdParty = useRef(null);
  const reportRefClient = useRef(null);

  const handlePrint = (type: string) => {
    if (type === 'Client') {
      const printContents = reportRefClient.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
    } else {
      const printContents = reportRefThirdParty.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
    }
  };

  const handleEmailReport = async () => {
    setIsSendingEmail(true);
    try {
      await sendEmailReport(id || claimID, {
        recipient_email: email,
        message: query
      })
      toast.success('Email sent successfully')
      setEmail('')
      setQuery('')
      setEmailModal(false)
      } catch (e) {
      // 3. Error Handling
      console.error(e);
      toast.error('Failed to send email'); 
    } finally {
      // 4. Stop Loading (Always runs)
      setIsSendingEmail(false);
    }
  }

  const handleImageLoad = (index) => {
    const img = imageRefs.current[index];
    if (img) {
      const { width, height } = img.getBoundingClientRect();
      setImageSizes((prev) => {
        const updated = [...prev];
        updated[index] = { width, height };
        return updated;
      });
    }
  };

  const handleImageLoadClient = (index) => {
    // const img = imageRefClient.current[index];
    // if (img) {
    //   const { width, height } = img.getBoundingClientRect();
    //   setImageSizesClient((prev) => {
    //     const updated = [...prev];
    //     updated[index] = { width, height };
    //     return updated;
    //   });
    // }
  };


  return (
    <div className={`max-w-5xl mx-auto pt-6 space-y-10 ${className}`}>
      <section>
        <h2 className="text-lg font-semibold mb-1">{type} Vehicle Details</h2>
        <p className="text-gray-500 mb-4">{type} {subTitle}</p>
        <ImageUploader
          clientVehicleId={clientVehicleId}
          thirdPartyVehicleId={thirdPartyVehicleId}
          images={images}
          setImages={setImages}
          setModalOpen={setModalOpen}
          type={type}
          loadData={loadData}
          setThirdPartyReport={setThirdPartyReport}
          setClientReport={setClientReport}
          setFieldValue={setFieldValue}
          isDisabled={isDisabled}
        />
      </section>
      <Modal blockScroll={false} open={isModalOpen} classNames={{
        modal: 'right-side-modal',
        overlay: 'no-overlay',
      }} styles={{
        modal: {
          padding: 0,
          margin: 0,
          borderRadius: 0,
        },
        overlay: {
          background: 'transparent', // override inline style too
        },
      }} center={false} onClose={() => setModalOpen(false)}>
        <div
          className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {type === 'Client' ? <div ref={reportRefClient}>
            <h2 className="text-lg font-semibold mb-4">{type} Vehicle Damage Report</h2>
            <div className="text-sm mb-6 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <span>Claim ID</span>
                <span>{id || claimID}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Report ID</span>
                <span>Report - v{clientReport?.version}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Generated on</span>
                <span>
                  {clientReport?.created_at && new Date(clientReport.created_at).toLocaleString()}
                </span>

              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Upload Details</h3>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Uploaded by</span>
                  <span>{clientReport?.upload_details?.uploaded_by}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>File name</span>
                  <span>{clientReport?.upload_details?.file_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Uploaded on</span>
                  <span>{clientReport?.upload_details?.uploaded_on}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Source</span>
                  <span>{clientReport?.upload_details?.source}</span>
                </div>
              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Vehicle Details</h3>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Vehicle Reg. No.</span>
                  <span>{clientReport?.vehicle_details?.vehicle_reg_no}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Make/Model</span>
                  <span>{clientReport?.vehicle_details?.make_model}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Color</span>
                  <span>{clientReport?.vehicle_details?.color}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Year</span>
                  <span>{clientReport?.vehicle_details?.year}</span>
                </div>
              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}UnrelatedDamage`}>
                {type} Unrelated Damage
              </label>
              <Field
                name={`${type.toLowerCase()}.unrelatedDamage`}
                as="input"
                value={clientReport?.client_unrelated_damage}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Type here..."
                disabled={isDisabled}
              />
              <ErrorMessage
                name={`${type.toLowerCase()}.unrelatedDamage`}
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}.status`}>
                {type} Vehicle Status
              </label>
              <Field
                name={`${type.toLowerCase()}.status`}
                as="select"
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={isDisabled}
              >
                <option value="Unroadworthy">Unroadworthy</option>
                <option value="Roadworthy">Roadworthy</option>
              </Field>
              <ErrorMessage
                name={`${type.toLowerCase()}.status`}
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Detected Damages</h3>
              <div className="overflow-hidden rounded-lg border border-gray-300">
                <table className="table-fixed rounded w-full text-sm border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">Damage side</td>
                      <td className="px-2 py-1">{clientReport?.area_of_damage}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">Area of damage</td>
                      <td className="px-2 py-1">{clientReport?.area_of_damage}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">Type of damage</td>
                      <td className="px-2 py-1">{clientReport?.type_of_damage}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">Severity</td>
                      <td className="px-2 py-1">{clientReport?.severity}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">Confidence %</td>
                      <td className="px-2 py-1">{clientReport?.confidence_percent}%</td>
                    </tr>
                    <tr>
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">Total damaged points identified</td>
                      <td className="px-2 py-1">{clientReport?.total_damaged_points_identified}</td>
                    </tr>
                    <tr>
                      <td className="border-r border-gray-300 px-2 py-1 font-normal">AI suggested actions</td>
                      <td className="px-2 py-1">{clientReport?.suggested_repair_action}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Uploaded Images</h3>
              <div className="grid grid-cols-3 gap-2">
  {images?.length > 0 &&
    images.map((src, idx) => {
      const originalWidth = 1920;
          const originalHeight = 1080;

          const displayWidth = imageSizesClient[idx]?.width || 0;
          const displayHeight = imageSizesClient[idx]?.height || 0;

          const scaleX = displayWidth / originalWidth;
          const scaleY = displayHeight / originalHeight;
          return (
            <div
              key={idx}
              className="relative w-full rounded-md overflow-hidden mb-4"
            >
              {/* Image */}
              <img
                ref={(el) => (imageRefClient.current[idx] = el)}
                src={src?.file_path}
                alt={`uploaded-${idx}`}
                className="w-full h-auto rounded"
                draggable={false}
                onLoad={() => handleImageLoadClient(idx)}
              />

              {/* Bounding Boxes */}
              {/* {displayWidth > 0 &&
                clientReport?.raw_result?.predictions
                  ?.map((prediction, pIdx) => {
                    if (
                      prediction.x == null ||
                      prediction.y == null ||
                      prediction.width == null ||
                      prediction.height == null
                    ) return null;

                    const left = (prediction.x - prediction.width / 2) * scaleX;
                    const top = (prediction.y - prediction.height / 2) * scaleY;
                    const width = prediction.width * scaleX;
                    const height = prediction.height * scaleY;

                    return (
                      <div
                        key={prediction.detection_id || pIdx}
                        className="absolute border-2 border-red-500 rounded"
                        style={{
                          left,
                          top,
                          width,
                          height,
                          boxSizing: "border-box",
                          pointerEvents: "none",
                        }}
                      >
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded-br select-none">
                          {typeof prediction.class === "string"
                            ? prediction.class
                            : JSON.stringify(prediction.class)}{" "}
                          — {Math.round(prediction.confidence * 100)}%
                        </div>
                      </div>
                    );
                  })} */}
            </div>
          );
    })}
</div>


              {/* <p className="text-xs text-gray-500 mt-2">{clientReport?.confirmation?.confirmed_by} confirmed at {clientReport?.confirmation?.confirmed_at}</p> */}
            </div>
            <div className="mb-6 border-t pt-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Total by Severity</span>
                  <span>{clientReport?.raw_result?.summary?.total_detections}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Area</span>
                  <span>{clientReport?.area_of_damage}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Estimated Work Category</span>
                  <span>{clientReport?.normalized_report?.raw_result?.summary?.estimated_work_category}</span>
                </div>
              </div>
            </div>
          </div> : <div ref={reportRefThirdParty}>

            <h2 className="text-lg font-semibold mb-4">{type} Vehicle Damage Report</h2>
            <div className="text-sm mb-6 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <span>Claim ID</span>
                <span>{id || claimID}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Report ID</span>
                <span>{thirdPartyReport?.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Generated on</span>
                <span>{thirdPartyReport?.created_at}</span>
              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Upload Details</h3>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Uploaded by</span>
                  <span>{thirdPartyReport?.upload_details?.uploaded_by}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>File name</span>
                  <span>{thirdPartyReport?.upload_details?.file_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Uploaded on</span>
                  <span>{thirdPartyReport?.upload_details?.uploaded_on}</span>
                </div>
                <div className="fgrid grid-cols-2 gap-2">
                  <span>Source</span>
                  <span>{thirdPartyReport?.upload_details?.source}</span>
                </div>
              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Vehicle Details</h3>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Vehicle Reg. No.</span>
                  <span>{thirdPartyReport?.vehicle_details?.vehicle_reg_no}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Make/Model</span>
                  <span>{thirdPartyReport?.vehicle_details?.make_model}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Color</span>
                  <span>{thirdPartyReport?.vehicle_details?.color}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Year</span>
                  <span>{thirdPartyReport?.vehicle_details?.year}</span>
                </div>
              </div>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}UnrelatedDamage`}>
                {type} Unrelated Damage
              </label>
              <Field
                name={`${type.toLowerCase()}.unrelatedDamage`}
                as="input"
                value={thirdPartyReport?.normalized_report?.client_unrelated_damage}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Type here..."
                disabled={isDisabled}
              />
              <ErrorMessage
                name={`${type.toLowerCase()}.unrelatedDamage`}
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}.status`}>
                {type} Vehicle Status
              </label>
              <Field
                name={`${type.toLowerCase()}.status`}
                as="select"
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={isDisabled}
              >
                <option value="Unroadworthy">Unroadworthy</option>
                <option value="Roadworthy">Roadworthy</option>
              </Field>
              <ErrorMessage
                name={`${type.toLowerCase()}.status`}
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Detected Damages</h3>
              <table className="table-fixed w-full rounded-lg text-sm border-collapse border border-gray-300">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">Damage side</td>
                    <td className="px-2 py-1">{thirdPartyReport?.area_of_damage}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">Area of damage</td>
                    <td className="px-2 py-1">{thirdPartyReport?.area_of_damage}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">Type of damage</td>
                    <td className="px-2 py-1">{thirdPartyReport?.type_of_damage}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">Severity</td>
                    <td className="px-2 py-1">{thirdPartyReport?.severity}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">Confidence %</td>
                    <td className="px-2 py-1">{thirdPartyReport?.confidence_percent}%</td>
                  </tr>
                  <tr>
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">Total damaged points identified</td>
                    <td className="px-2 py-1">{thirdPartyReport?.total_damaged_points_identified}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-gray-300 px-2 py-1 font-normal">AI suggested actions</td>
                    <td className="px-2 py-1">{thirdPartyReport?.suggested_repair_action}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <hr className="mb-4" />
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Uploaded Images</h3>
              <div className="grid grid-cols-1 gap-4">
      {images?.length > 0 &&
        images.map((src, idx) => {
          const originalWidth = 1920;
          const originalHeight = 1080;

          const displayWidth = imageSizes[idx]?.width || 0;
          const displayHeight = imageSizes[idx]?.height || 0;

          const scaleX = displayWidth / originalWidth;
          const scaleY = displayHeight / originalHeight;

          return (
            <div
              key={idx}
              className="relative w-full rounded-md overflow-hidden mb-4"
            >
              {/* Image */}
              <img
                ref={(el) => (imageRefs.current[idx] = el)}
                src={src?.file_path}
                alt={`uploaded-${idx}`}
                className="w-full h-auto rounded"
                draggable={false}
                onLoad={() => handleImageLoad(idx)}
              />

              {/* Bounding Boxes */}
              {displayWidth > 0 &&
                thirdPartyReport?.raw_result?.predictions
                  ?.map((prediction, pIdx) => {
                    if (
                      prediction.x == null ||
                      prediction.y == null ||
                      prediction.width == null ||
                      prediction.height == null
                    ) return null;

                    const left = (prediction.x - prediction.width / 2) * scaleX;
                    const top = (prediction.y - prediction.height / 2) * scaleY;
                    const width = prediction.width * scaleX;
                    const height = prediction.height * scaleY;

                    return (
                      <div
                        key={prediction.detection_id || pIdx}
                        className="absolute border-2 border-red-500 rounded"
                        style={{
                          left,
                          top,
                          width,
                          height,
                          boxSizing: "border-box",
                          pointerEvents: "none",
                        }}
                      >
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded-br select-none">
                          {typeof prediction.class === "string"
                            ? prediction.class
                            : JSON.stringify(prediction.class)}{" "}
                          — {Math.round(prediction.confidence * 100)}%
                        </div>
                      </div>
                    );
                  })}
            </div>
          );
        })}
    </div>

              {/* <p className="text-xs text-gray-500 mt-2">{thirdPartyReport?.confirmation?.confirmed_by} confirmed at {thirdPartyReport?.confirmation?.confirmed_at}</p> */}
            </div>
            <hr className="mb-4" />
            <div className="mb-6 border-t pt-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Total by Severity</span>
                  <span>{thirdPartyReport?.raw_result?.summary?.total_detections}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Area</span>
                  <span>{thirdPartyReport?.area_of_damage}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Estimated Work Category</span>
                  <span>{thirdPartyReport?.normalized_report?.raw_result?.summary?.estimated_work_category}</span>
                </div>
              </div>
            </div>
          </div>}
          {/* <button className="w-full bg-custom text-white py-2 rounded hover:bg-[#252B37]" disabled={isDisabled}>
            Save to Claim
          </button> */}
          <div className="flex space-x-3 mt-4">
            {/* <button onClick={() => {
              if (type === 'Client') {
                html2pdf()
                  .set({
                    margin: [5, 5, 5, 5],
                    filename: "client-report.pdf",
                    pagebreak: {
                      mode: ['legacy']
                    },
                    image: { type: "jpg", quality: 0.98 },
                    html2canvas: {
                      scale: 2,
                      useCORS: true,
                      logging: true,
                    },
                    jsPDF: {
                      unit: "mm",
                      format: "a4",
                      orientation: "portrait",
                    },
                  })
                  .from(reportRefClient.current)
                  .save();
              } else {
                html2pdf()
                  .set({
                    margin: [5, 5, 5, 5],
                    filename: "third-party.pdf",
                    image: { type: "jpg", quality: 0.98 },
                    pagebreak: {
                      mode: ['legacy']
                    },
                    html2canvas: {
                      scale: 2,
                      useCORS: true, // Important for fonts and images
                      logging: true,
                    },
                    jsPDF: {
                      unit: "mm",
                      format: "a4",
                      orientation: "portrait",
                    },
                  })
                  .from(reportRefThirdParty.current)
                  .save();
              }
            }} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100" disabled={isDisabled}>
              Download PDF
            </button> */}
            <button onClick={() => {
              setEmailModal(true)
            }} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100">
              Email Report
            </button>
            <button onClick={() => {
              handlePrint(type)
            }} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100" disabled={isDisabled}>
              Print
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={emailModal} onClose={() => setEmailModal(false)} classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}>
  <div
    className="bg-white rounded-lg  overflow-auto p-6 relative"
    onClick={(e) => e.stopPropagation()}
  >
    <h2 className="text-lg font-semibold mb-4">Send Email</h2>

    {/* Email Input */}
    <div className="mb-4">
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        id="email"
        type="email"
        value={email} 
        onChange={(e) => {
          setEmail(e.target.value)
        }}
        disabled={isSendingEmail}
        placeholder=""
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Query Textarea */}
    <div className="mb-4">
      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
        Message
      </label>
      <textarea
        id="message"
        rows={4}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
        }}
        disabled={isSendingEmail}
        placeholder="Write your message here..."
        className="w-full border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>

    {/* Send Button */}
    <div className="text-right">
      <button
              type="button"
              // 4. DISABLE BUTTON BASED ON STATE
              disabled={isSendingEmail} 
              className={`bg-custom text-white px-4 py-2 rounded transition ${
                isSendingEmail 
                  ? "opacity-50 cursor-not-allowed" // Visual feedback
                  : "hover:bg-[#252B37]"
              }`}
              onClick={() => {
                handleEmailReport()
              }}
            >
              {/* 5. CHANGE TEXT BASED ON STATE */}
              {isSendingEmail ? "Sending..." : "Send"}
            </button>
    </div>
  </div>
</Modal>

    </div>
  );
};

const VehicleSection: React.FC<VehicleSectionProps> = ({ vehicleStatus, title, subTitle, type, selectedZones, images,setSelectedZones, isDisabled, setFieldValue }) => {
  const { isClosed } = useSelector((state: any) => state.isClosed);
  const toggleZone = (zoneId: string, setFieldValue: FormikHelpers<any>["setFieldValue"]) => {
    if (isDisabled) return;

    setSelectedZones((prev) => {
      const newZones = { ...prev };
      const selectedZoneOrder = [...(prev.selectedZoneOrder || [])];

      const zoneSelected = !newZones[zoneId];
      
      newZones[zoneId] = zoneSelected;

      if (zoneSelected) {
        selectedZoneOrder.push(zoneId);
      } else {
        const index = selectedZoneOrder.indexOf(zoneId);
        if (index > -1) {
          selectedZoneOrder.splice(index, 1);
        }
      }

      const selectedZoneLabels = selectedZoneOrder.map((zoneId) => getZoneLabel(zoneId));

      const zoneLabelString = selectedZoneLabels.join(", ");
      const fieldKey = `${type === 'Client' ? type.toLowerCase() : type.toLowerCase().replace(" ", "_")}.areaDamage`;
      setFieldValue(fieldKey, zoneLabelString);

      return {
        ...newZones,
        selectedZoneOrder,
      };
    });
  };

  const getZoneLabel = (zoneId: string) => {
    const zoneLabels = {
      'front': 'Front',
      'rear': 'Rear',
      'offside-middle': 'Offside Middle',
      'nearside-middle': 'Nearside Middle',
      'offside-front': 'Offside Front',
      'nearside-front': 'Nearside Front',
      'offside-rear': 'Offside Rear',
      'nearside-rear': 'Nearside Rear',
    };

    return zoneLabels[zoneId] || zoneId;
  };

  useEffect(() => {
    if (images?.length > 0) {
      if (type === 'Client') {
        setFieldValue('client.areaDamage', '');
        setFieldValue('client.unrelatedDamage', '');
        setFieldValue('client.status', '');
        setFieldValue('third_party.areaDamage', '');
        setFieldValue('third_party.unrelatedDamage', '');
        setFieldValue('third_party.status', '');
      }
  
      if (type === 'Third Party') {
        setFieldValue(`${type.toLowerCase().replace(" ", "_")}.areaDamage`, '');
        setFieldValue(`${type.toLowerCase().replace(" ", "_")}.unrelatedDamage`, '');
        setFieldValue(`${type.toLowerCase().replace(" ", "_")}.status`, '');
      }
    }
  }, [images, type, setFieldValue]);
  


  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{subTitle}</p>
      <p className="flex justify-center font-bold mb-4">Offside</p>
      <div className="relative w-full max-w-md mx-auto">
        <img src={carTopView} alt="Car Top View" className="w-full" />
        <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none">
          <div className="absolute left-2 top-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["front"] || false}
              onChange={() => toggleZone("front", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute right-2 top-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["rear"] || false}
              onChange={() => toggleZone("rear", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute top-2 left-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["offside-middle"] || false}
              onChange={() => toggleZone("offside-middle", setFieldValue)}
              disabled={isDisabled}
            />
            
          </div>
          <div className="absolute bottom-2 left-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["nearside-middle"] || false}
              onChange={() => toggleZone("nearside-middle", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute top-[10%] left-[10%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["offside-front"] || false}
              onChange={() => toggleZone("offside-front", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute bottom-[10%] left-[10%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["nearside-front"] || false}
              onChange={() => toggleZone("nearside-front", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute top-[10%] left-[88%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["offside-rear"] || false}
              onChange={() => toggleZone("offside-rear", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute bottom-[10%] left-[88%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["nearside-rear"] || false}
              onChange={() => toggleZone("nearside-rear", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
      <p className="flex justify-center font-bold mt-4">Nearside</p>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium col-span-1">{type} Area of Damage</label>
          <div className="col-span-2">
            <Field
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.areaDamage`}
              onChange={(e) => {
                setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.areaDamage`, e.target.value)
              }}
              as="input"
              value={(selectedZones.selectedZoneOrder || []).map(zoneId => getZoneLabel(zoneId)).join(", ") || ""}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
              disabled={isDisabled}
            />
            <ErrorMessage
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.areaDamage`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium col-span-1">{type} Unrelated Damage</label>
          <div className="col-span-2">
            <Field
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.unrelatedDamage`}
              as="input"
              onChange={(e) => {
                setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.unrelatedDamage`, e.target.value)
              }}
              placeholder=""
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
              disabled={isDisabled}
            />
            <ErrorMessage
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.unrelatedDamage`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium col-span-1">{type} Vehicle Status</label>
          <div className="col-span-2">
            {/* <Field
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`}
              as="select"
              onChange={(e) => {
                setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`, e.target.value)
              }}
              className="w-full border rounded-md px-3 py-2 text-sm"
              disabled={isDisabled}
            >
              <option value="Unroadworthy">Unroadworthy</option>
              <option value="Roadworthy">Roadworthy</option>
            </Field> */}
            <Field name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`}>
              {({ field, form, meta }: any) => (
                <div>
                  <CustomSelect
                    options={vehicleStatus.map((h: any) => ({
                      value: h.id,
                      label: h.label,
                    }))}
                    value={vehicleStatus
                      .map((h: any) => ({ value: h.id, label: h.label }))
                      .find((opt: any) => opt.value === field.value) || { value: '', label: '' }}
                    onChange={(option) => form.setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`, option ? option.value : 0)}
                    placeholder="Select reason"
                    disabled={isClosed}
                  />
                  {meta.touched && meta.error && (
                    <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                  )}
                </div>
              )}
            </Field>
            <ErrorMessage
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const VehicleDamageForm = forwardRef(({ onSuccess, handleNext, skipNext }: VehicleDamageProps, ref) => {
  const searchParams = new URLSearchParams(window.location.search);
  const claimId = searchParams.get('claimid');
  const dispatch = useDispatch()
  const { id } = useParams();

  const formikRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // Replace with actual logic, e.g., useSelector for isClosed
  const [selectedKeys, setSelectedKeys] = useState(new Set(["manual"]));
  const [clientZones, setClientZones] = useState<{ [key: string]: boolean }>(convertZonesToObject([]));
  const [thirdPartyZones, setThirdPartyZones] = useState<{ [key: string]: boolean }>(convertZonesToObject([]));
  const [clientImages, setClientImages] = useState<string[]>([]);
  const [thirdPartyImages, setThirdPartyImages] = useState<string[]>([]);
  const [clientVehicleId, setClientVehicleId] = useState<string>("");
  const [thirdPartyVehicleId, setThirdPartyVehicleId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false)
  const [clientVehicleStatus, setClientVehicleStatus] = useState<LookupItem[]>([]);
  const [thirdPartyVehicleStatus, setThirdPartyVehicleStatus] = useState<LookupItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [initialValues, setInitialValues] = useState({
    entryMode: "manual",
    client: {
      areaDamage: "",
      unrelatedDamage: "",
      status: "Unroadworthy",
      images: [],
    },
    third_party: {
      areaDamage: "",
      unrelatedDamage: "",
      status: "Unroadworthy",
      images: [],
    },
  })

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const vehicleData = await getVehicleDetail(claimId || id);
      dispatch(setVehicleDataState(vehicleData))
      setInitialValues({
        entryMode: "manual",
        client: {
          areaDamage: vehicleData.damage_area || "",
          unrelatedDamage: vehicleData.unrelated_damage || "",
          status: vehicleData.vehicle_status_id || "",
          images: [],
        },
        third_party: {
          areaDamage: vehicleData.third_party_vehicles?.[0]?.damage_area || "",
          unrelatedDamage: vehicleData.third_party_vehicles?.[0]?.unrelated_damage || "",
          status: vehicleData.third_party_vehicles?.[0]?.vehicle_status_id || "",
          images: [],
        },
      });

      const latestAIReport = vehicleData?.ai_reports
        ?.slice()
        ?.sort((a, b) => b.id - a.id)[0];
      const latestAIThird = vehicleData?.third_party_vehicles[0]?.ai_reports?.slice()?.sort((a, b) => b.id - a.id)[0]

      setClientImages(latestAIReport?.images)
      setThirdPartyImages(latestAIThird?.images)

      if (vehicleData.damage_diagram) {
        setClientZones(vehicleData.damage_diagram);
      }

      if (vehicleData.third_party_vehicles?.[0]?.damage_diagram) {
        setThirdPartyZones(vehicleData.third_party_vehicles[0].damage_area);
      } else if (vehicleData.third_party_vehicles?.[0]?.damage_area) {
        const thirdPartyZonesArray = vehicleData.third_party_vehicles[0].damage_area.split(", ");
        setThirdPartyZones(convertZonesToObject(thirdPartyZonesArray));
      }

      setClientVehicleId(vehicleData.id || "");
      setThirdPartyVehicleId(vehicleData.third_party_vehicles?.[0]?.id || "");
      dispatch(setClientVehicleIdStore(vehicleData.id || ""))
      dispatch(setThirdPartyVehicleIdStore(vehicleData.third_party_vehicles?.[0]?.id))
      setDataLoaded(true);

    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      // toast.error("Failed to load vehicle details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentClaimId = claimId || id;
    if (currentClaimId && !dataLoaded) {
      loadData();
    }

    getDropdownData()
  }, [id, claimId, dataLoaded]);


  const getDropdownData = async () => {
    const [
      clientVehicleStatus,
      thirdPartyVehicleStatus,
    ] = await Promise.all([
      getClientVehicle(),
      getThirdPartyVehicle(),

    ]);
    setClientVehicleStatus(clientVehicleStatus.data);
    setThirdPartyVehicleStatus(thirdPartyVehicleStatus.data);

  }


  // Handle form submission
  const handleSubmit = async (values: any, actions: any) => {
    try {
      setIsLoading(true);
      const payload = {
        claim_id: parseInt(claimId || id || '0'),
        vehicle_detail: {
          id: parseInt(clientVehicleId) || 0,
          client_area_of_damage: convertObjectToZones(clientZones).join(", "),
          client_unrelated_damage: values.client.unrelatedDamage || "",
          client_vehicle_status_id: 4,
          damage_diagram: clientZones
        },
        third_party_vehicle_detail: {
          id: parseInt(thirdPartyVehicleId) || 0,
          client_area_of_damage: convertObjectToZones(thirdPartyZones).join(", "),
          client_unrelated_damage: values.third_party.unrelatedDamage || "",
          client_vehicle_status_id: 4,
          damage_diagram: thirdPartyZones
        }
      };
      if (selectedKeys.has("manual")) {
        try {
          await updateVehicleDamage(payload);
          toast.success("Vehicle damage details saved successfully");
        } catch (e: any) {
          toast.error("Unable to save vehicle damage details");
        }

      }
      if (handleNext && !skipNext) handleNext(1, "next");
    } catch (error: any) {
      toast.error(`Unable to save vehicle damage details: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      // actions.setSubmitting(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose submitForm method to parent
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      if (!formikRef.current) {
          throw new Error('Formik instance not available');
      }
      await formikRef.current.submitForm();
      return true;
    }
  }));

  const handleSelectionChange = (newSelection: Set<string>) => {
    if (newSelection.size === 0) return;
    setSelectedKeys(newSelection);
    formikRef.current.setFieldValue("entryMode", newSelection.values().next().value);
  };

  return (
    <div className="pb-8 mt-12 sm:pb-12 sm:pl-0 bg-white">
      <Formik
        initialValues={initialValues}
        // validationSchema={validationSchema}
        onSubmit={handleSubmit}
        innerRef={formikRef}
        enableReinitialize
      >
        {({ values, setFieldValue }) => {
          return (
            <Form>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Vehicle Damage Details</h2>
                  <p className="text-gray-500 text-sm">Enter Vehicle Damage Details below</p>
                </div>
                <ButtonGroup selectedKeys={selectedKeys} onSelectionChange={handleSelectionChange} type="single">
                  <ButtonGroupItem id="manual">Enter Details Manually</ButtonGroupItem>
                  <ButtonGroupItem id="ai">Enter Details Using AI</ButtonGroupItem>
                </ButtonGroup>
              </div>
              {selectedKeys.has("manual") ? (
                <>
                  <VehicleSection
                    title="Client Vehicle Details"
                    subTitle="Enter Client Vehicle Details"
                    type="Client"
                    images={clientImages || thirdPartyImages}
                    selectedZones={clientZones}
                    setFieldValue={setFieldValue}
                    setSelectedZones={setClientZones}
                    isDisabled={isDisabled || isLoading}
                    vehicleStatus={clientVehicleStatus}
                    className="ml-0"
                  />
                  <VehicleSection
                    title="Third Party Vehicle Details"
                    subTitle="Enter Third Party Vehicle Details"
                    type="Third Party"
                    setFieldValue={setFieldValue}
                    selectedZones={thirdPartyZones}
                    setSelectedZones={setThirdPartyZones}
                    isDisabled={isDisabled || isLoading}
                    vehicleStatus={thirdPartyVehicleStatus}
                  />
                </>
              ) : (
                <>
                  <VehicleAISection
                    clientVehicleId={clientVehicleId}
                    title="Client Vehicle Details"
                    subTitle="Enter Client Vehicle Details"
                    type="Client"
                    loadData={loadData}
                    images={clientImages}
                    setImages={setClientImages}
                    setFieldValue={setFieldValue}
                    isDisabled={isDisabled || isLoading}
                    className="ml-0"
                  />
                  <VehicleAISection
                    thirdPartyVehicleId={thirdPartyVehicleId}
                    title="Third Party Vehicle Details"
                    subTitle="Enter Third Party Vehicle Details"
                    type="Third Party"
                    loadData={loadData}
                    images={thirdPartyImages}
                    setImages={setThirdPartyImages}
                    setFieldValue={setFieldValue}
                    isDisabled={isDisabled || isLoading}
                    className="ml-0"
                  />
                </>
              )}
            </Form>
          )

        }}
      </Formik>
    </div>
  );
});

VehicleDamageForm.displayName = "VehicleDamageForm";
export default VehicleDamageForm;