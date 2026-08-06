import { useReportCompletion, isAllFilled } from "../Components/ClaimCompletion";
import Vehicle from "../../../assets/AutoClaim_icon/Vehicle.svg";
import DVLA from "../../../assets/AutoClaim_icon/DVLA.svg"
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import ProcessMID from "../../../assets/AutoClaim_icon/ProcessMID.svg";
import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { Minus, Plus, Upload } from "lucide-react";
import { VehicleCheckModal } from "./VehicleCheckModal";
import { BlueDropdownIndicator, customStyles, scrollSelectIntoView } from "./GeneralDetailsForm";
import { CustomDatePicker } from "../Components/DatePicker";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { toast } from "react-toastify";
import { V5CUploadModal } from "../UploadModalPopups/V5CUploadModal";
import * as Yup from 'yup'
import { useFormik } from "formik";
import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/vehicle";
import { cleanPayload } from "./ClientDetailsForm";
import { getTaxiType } from "../../../services/Lookups/Generaldetails";
import { getActualVehicleCategory } from "../../../services/HireDetail/HireDetails";
export const VehicleDetailsForm = ({ formRef, claimId }: any) => {

  const fuelOptions = [
    { value: 1, label: "Petrol" },
    { value: 2, label: "Diesel" },
    { value: 3, label: "Electric" },
    { value: 4, label: "Hybrid" },
  ].sort((a, b) => String(a.label).localeCompare(String(b.label)));

  const transmissionOptions = [
    { value: 1, label: "Automatic" },
    { value: 2, label: "Manual" },
  ].sort((a, b) => String(a.label).localeCompare(String(b.label)));

  // ABI vehicle categories (S1, S2, S3, NT4, …) from the actual_vehicle_categories
  // lookup — same source as Hire Details. Stores the label string on vehicle.category.
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    getActualVehicleCategory()
      .then((res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        setCategoryOptions(rows.map((i: any) => ({ value: i.label, label: i.label })));
      })
      .catch(() => setCategoryOptions([]));
  }, []);
  const [taxiTypeOptions, setTaxiTypeOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [isTaxiTypeLoading, setIsTaxiTypeLoading] = useState(false);

  useEffect(() => {
    const mapTaxiTypeOptions = (rows: any[]) =>
      rows
        .map((row: any) => ({
          value: row.id,
          label: row.label,
        }))
        .filter((option: any) => option.value && option.label);

    const loadTaxiTypes = async () => {
      setIsTaxiTypeLoading(true);
      try {
        const activeRes = await getTaxiType();
        let options = mapTaxiTypeOptions(
          Array.isArray(activeRes?.data) ? activeRes.data : [],
        );

        if (options.length === 0) {
          const allRes = await getTaxiType(true);
          options = mapTaxiTypeOptions(
            Array.isArray(allRes?.data) ? allRes.data : [],
          );
        }

        setTaxiTypeOptions(options);
      } catch {
        setTaxiTypeOptions([]);
      } finally {
        setIsTaxiTypeLoading(false);
      }
    };

    loadTaxiTypes();
  }, []);

  const blankThirdPartyVehicle = () => ({
    id: null as number | null,
    make: "",
    model: "",
    registration: "",
    color: "",
    imagesAvailable: "Yes",
  });

  const resetThirdPartyModal = () => {
    setEditingId(null);
    setEditingIndex(null);
    setCurrentVehicle(blankThirdPartyVehicle());
  };

  const openAddThirdPartyVehicleModal = () => {
    resetThirdPartyModal();
    setIsModalOpen(true);
  };

  const closeThirdPartyVehicleModal = () => {
    setIsModalOpen(false);
    resetThirdPartyModal();
  };

  const removeTPVehicle = (id: number | null | undefined, index: number) => {
    // if (formik.values.thirdPartyVehicles.length <= 1) {
    //   toast.error("At least one third party vehicle is mandatory.");
    //   return;
    // }

    setDeleteConfirm({
      open: true,
      id: id ?? null,
      index,
    });
  };

  const confirmDeleteTPVehicle = () => {
    const hasDeleteId = deleteConfirm.id !== null && deleteConfirm.id !== undefined;
    if (!hasDeleteId && deleteConfirm.index === null) return;

    formik.setFieldValue(
      "thirdPartyVehicles",
      formik.values.thirdPartyVehicles.filter((v: any, index: number) =>
        hasDeleteId ? v.id !== deleteConfirm.id : index !== deleteConfirm.index,
      ),
    );

    setDeleteConfirm({
      open: false,
      id: null,
      index: null,
    });

    toast.success("Third party vehicle deleted successfully");
  };
  const handleEdit = (vehicle: any, index: number) => {
    setCurrentVehicle({
      ...blankThirdPartyVehicle(),
      ...vehicle,
      imagesAvailable:
        vehicle.imagesAvailable || (vehicle.images_available ? "Yes" : "No"),
    });
    setEditingId(vehicle.id ?? null);
    setEditingIndex(index);
    setIsModalOpen(true);
  };
  const [currentVehicle, setCurrentVehicle] = useState(blankThirdPartyVehicle());
  const claimType = localStorage.getItem("claimType");
  // Validation Logic based on Acceptance Criteria
  const [checkModal, openModal1] = useState<boolean>(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBadgeExpiryPicker, setShowBadgeExpiryPicker] = useState(false);
  const [showBadgeExpiryPicker2, setShowBadgeExpiryPicker2] = useState(false);
  // Keyed by field path so borough1 & borough2 each get independent pickers.
  const [openBoroughPicker, setOpenBoroughPicker] = useState<string | null>(null);
  const badgeExpiryPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showBadgeExpiryPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        badgeExpiryPickerRef.current &&
        !badgeExpiryPickerRef.current.contains(event.target as Node)
      ) {
        setShowBadgeExpiryPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBadgeExpiryPicker]);

  const handleSave = (addNext = false) => {
    // if (!isVehicleValid) {
    //   alert("Please fill in mandatory fields: Make, Model, and Registration.");
    //   return;
    // }

    let updatedVehicles;

    const hasEditingId = editingId !== null && editingId !== undefined;
    const hasEditingIndex = editingIndex !== null && editingIndex !== undefined;

    if (hasEditingId || hasEditingIndex) {
      // ✅ UPDATE existing
      updatedVehicles = formik.values.thirdPartyVehicles.map(
        (v: any, index: number) =>
          (hasEditingId ? v.id === editingId : index === editingIndex)
            ? {
                ...currentVehicle,
                id: editingId ?? currentVehicle.id ?? v.id ?? Date.now(),
              }
            : v,
      );
    } else {
      // ✅ ADD new
      updatedVehicles = [
        ...formik.values.thirdPartyVehicles,
        { ...currentVehicle, id: Date.now() },
      ];
    }

    formik.setFieldValue("thirdPartyVehicles", updatedVehicles);

    // Reset
    setEditingId(null);
    setEditingIndex(null);

    if (addNext) {
      setCurrentVehicle(blankThirdPartyVehicle());
    } else {
      setIsModalOpen(false);
      setCurrentVehicle(blankThirdPartyVehicle());
    }
  };

  // Inline third-party editing — edits persist directly to the formik array
  // (no popup), so third-party details are as visible as the client's vehicle.
  const updateTPVehicle = (index: number, patch: any) =>
    formik.setFieldValue(
      "thirdPartyVehicles",
      formik.values.thirdPartyVehicles.map((v: any, i: number) =>
        i === index ? { ...v, ...patch } : v,
      ),
    );
  const addTPVehicleInline = () =>
    formik.setFieldValue("thirdPartyVehicles", [
      ...formik.values.thirdPartyVehicles,
      { ...blankThirdPartyVehicle(), id: Date.now() },
    ]);
  const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors placeholder:font-['Stack_Sans_Headline']`;
  const boroughInputStyles =
    "w-full h-[52px] px-5 py-4 bg-white rounded border border-gray-200 text-neutral-900 text-base font-light leading-4 font-['Stack_Sans_Headline'] placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

//   const handleSave = (addNext = false) => {
//     if (!isVehicleValid) {
//       alert("Please fill in mandatory fields: Make, Model, and Registration.");
//       return;
//     }
// console.log(currentVehicle);
//     formik.setFieldValue("thirdPartyVehicles",([
//       ...formik.values.thirdPartyVehicles,
//       { ...currentVehicle, id: Date.now() },
//     ]));

//     if (addNext) {
//       setCurrentVehicle({
//         make: "",
//         model: "",
//         registration: "",
//         color: "",
//         imagesAvailable: "Yes",
//       });
//     } else {
//       setIsModalOpen(false);
//       setCurrentVehicle({
//         make: "",
//         model: "",
//         registration: "",
//         color: "",
//         imagesAvailable: "Yes",
//       });
//     }
//   };
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: number | null;
    index: number | null;
  }>({
    open: false,
    id: null,
    index: null,
  });
  const formik = useFormik({
    initialValues: {
      vehicle: {
        make: "",
        model: "",
        registration: "",
        color: "",
        fuelType: null,
        engineSize: "",
        transmission: null,
        bodyType: "",
        seats: 0,
        category: null,
      },
      borough: {
        name: "",
        taxiType: null,
        taxiType2: null,
        clientBadgeNumber: "",
        clientBadgeNumber2: "",
        badgeExpirationDate: "",
        badgeExpirationDate2: "",
        vehicleBadgeNumber: "",
        dualBadge: "No",
        otherBorough: "No",
        otherBoroughName: "",
      },
      borough2: {
        name: "",
        taxiType: null,
        taxiType2: null,
        clientBadgeNumber: "",
        clientBadgeNumber2: "",
        badgeExpirationDate: "",
        badgeExpirationDate2: "",
        vehicleBadgeNumber: "",
        dualBadge: "No",
      },
      thirdPartyVehicles: [
        
      ],
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload = {
          claim_id: parseInt(claimId),
          make: values.vehicle.make,
          model: values.vehicle.model,
          body_type: values.vehicle.bodyType,
          registration: values.vehicle.registration,
          color: values.vehicle.color,
          fuel_type_id: values.vehicle.fuelType,
          engine_size: values.vehicle.engineSize,
          transmission_id: values.vehicle.transmission,
          number_of_seat: values.vehicle.seats,
          vehicle_category: values.vehicle.category,

          borough: {
            borough_name: values.borough.name,
            taxi_type_id: values.borough.taxiType,
            taxi_type_id_2: values.borough.taxiType2,
            client_badge_number: values.borough.clientBadgeNumber,
            client_badge_number_2: values.borough.clientBadgeNumber2,
            badge_expiration_date: values.borough.badgeExpirationDate,
            badge_expiration_date_2: values.borough.badgeExpirationDate2,
            vehicle_badge_number: values.borough.vehicleBadgeNumber,
            dual_badge: values.borough.dualBadge === "Yes" ? true : false,
            any_other_borough:
              values.borough.otherBorough === "Yes"? true:false,
            other_borough_name: values.borough.otherBoroughName || "",
          },
          // Secondary borough — only sent when "Any Other Borough" is Yes;
          // null otherwise so the backend drops any previously-saved one.
          borough2:
            values.borough.otherBorough === "Yes"
              ? {
                  borough_name: values.borough2.name,
                  taxi_type_id: values.borough2.taxiType,
                  taxi_type_id_2: values.borough2.taxiType2,
                  client_badge_number: values.borough2.clientBadgeNumber,
                  client_badge_number_2: values.borough2.clientBadgeNumber2,
                  badge_expiration_date: values.borough2.badgeExpirationDate,
                  badge_expiration_date_2: values.borough2.badgeExpirationDate2,
                  vehicle_badge_number: values.borough2.vehicleBadgeNumber,
                  dual_badge: values.borough2.dualBadge === "Yes" ? true : false,
                }
              : null,

          third_party_vehicles: values.thirdPartyVehicles.map((v: any) => ({
            make: v.make,
            model: v.model,
            registration: v.registration,
            color: v.color,
            images_available: v.imagesAvailable==="Yes"?true:false,
          })),
        };
        const payloadToSend = cleanPayload(payload);
        let response;
        if (claimId && vehicleId) {
          response = await updateVehicle(payloadToSend, parseInt(claimId));
        } else {
          response = await createVehicleDetail(payloadToSend);
        }
        if (response?.id) setVehicleId(String(response.id));
        toast.success("Vehicle details saved successfully");
      } catch (error) {
        toast.error("Error saving vehicle details");
        throw error;
      }
    },
  });
  const [fieldError, setFieldError] = useState({});
  useEffect(() => {
    const fetchData = async () => {
      const res = await getVehicleDetail(parseInt(claimId));
     const mappedValues = {
          vehicle: {
            make: res.make || "",
            model: res.model || "",
            registration: res.registration || "",
            color: res.color || "",
            fuelType: res.fuel_type_id || "",
            engineSize: res.engine_size || "",
            transmission: res.transmission_id || "",
            bodyType: res.body_type || "",
            seats: res.number_of_seat?.toString() || 0,
            category: res.vehicle_category || "",
          },
          borough: {
            name: res.borough?.borough_name || "",
            taxiType: res.borough?.taxi_type_id || "",
            taxiType2: res.borough?.taxi_type_id_2 || "",
            clientBadgeNumber: res.borough?.client_badge_number || "",
            clientBadgeNumber2: res.borough?.client_badge_number_2 || "",
            badgeExpirationDate: res.borough?.badge_expiration_date || "",
            badgeExpirationDate2: res.borough?.badge_expiration_date_2 || "",
            vehicleBadgeNumber: res.borough?.vehicle_badge_number || "",
            dualBadge: res.borough?.dual_badge ? "Yes" : "No",
            otherBorough:
              res.borough?.any_other_borough || res.borough2 ? "Yes" : "No",
            otherBoroughName: res.borough?.other_borough_name || "",
          },
          borough2: {
            name: res.borough2?.borough_name || "",
            taxiType: res.borough2?.taxi_type_id || "",
            taxiType2: res.borough2?.taxi_type_id_2 || "",
            clientBadgeNumber: res.borough2?.client_badge_number || "",
            clientBadgeNumber2: res.borough2?.client_badge_number_2 || "",
            badgeExpirationDate: res.borough2?.badge_expiration_date || "",
            badgeExpirationDate2: res.borough2?.badge_expiration_date_2 || "",
            vehicleBadgeNumber: res.borough2?.vehicle_badge_number || "",
            dualBadge: res.borough2?.dual_badge ? "Yes" : "No",
          },
          thirdPartyVehicles:
            res.third_party_vehicles
              ?.filter((v) => v.is_active !== false && v.is_deleted !== true)
              .map((v) => ({
                id: v.id ?? null,
                make: v.make || "",
                model: v.model || "",
                registration: v.registration || "",
                color: v.color || "",
                imagesAvailable: v.images_available ? "Yes":"No",
              })) || [],
        };

      if (res?.id) setVehicleId(String(res.id));
      formik.setValues(mappedValues);
    };
    if (claimId) {
      fetchData().catch((err) => {
        if (err?.response?.status !== 404) toast.error("Failed to load vehicle details");
      });
    }
  }, [claimId]);
    useEffect(() => {
      if (formRef) {
        formRef.current = formik;
      }
    }, [formRef, formik]);

  useReportCompletion(
    isAllFilled({
      vehicle: {
        make: formik.values.vehicle.make,
        model: formik.values.vehicle.model,
        registration: formik.values.vehicle.registration,
        color: formik.values.vehicle.color,
        fuelType: formik.values.vehicle.fuelType,
        engineSize: formik.values.vehicle.engineSize,
        transmission: formik.values.vehicle.transmission,
        bodyType: formik.values.vehicle.bodyType,
        seats: formik.values.vehicle.seats,
        category: formik.values.vehicle.category,
      },
      borough: {
        name: formik.values.borough.name,
        taxiType: formik.values.borough.taxiType,
        clientBadgeNumber: formik.values.borough.clientBadgeNumber,
        badgeExpirationDate: formik.values.borough.badgeExpirationDate,
        vehicleBadgeNumber: formik.values.borough.vehicleBadgeNumber,
        otherBorough: formik.values.borough.otherBorough,
        otherBoroughName:
          formik.values.borough.otherBorough === "Yes"
            ? formik.values.borough.otherBoroughName
            : "n/a",
      },
      thirdPartyVehicles:
        formik.values.thirdPartyVehicles.length > 0
          ? formik.values.thirdPartyVehicles.map((vehicle: any) => ({
              make: vehicle.make,
              model: vehicle.model,
              registration: vehicle.registration,
              color: vehicle.color,
              imagesAvailable: vehicle.imagesAvailable,
            }))
          : "n/a",
    }),
  );
  const pollJobStatus = async (vehicleDetails: any) => {
    // Show a global loader for the OCR processing
    // setLoading(true);
    try {
      // Loop or interval to check OCR status
      // const result = await checkOCRStatus(jobId);
      // console.log(result)
      // if (result.status === "completed") {
      // Pre-fill your Formik fields
      // formik.setValues({
      //   ...formik.values,
      //   make: result.data.make,
      //   model: result.data.model,
      //   registration: result.data.registration,
      //   colour: result.data.colour,
      // });
      const newErrors: Record<string, string> = {};


      if (!vehicleDetails.make)
        newErrors["vehicle.make"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.model)
        newErrors["vehicle.model"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.registration)
        newErrors["vehicle.registration"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.color)
        newErrors["vehicle.color"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.fuel_type_id)
        newErrors["vehicle.fuelType"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.engine_size)
        newErrors["vehicle.engineSize"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.transmission_id)
        newErrors["vehicle.transmission"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.body_type)
        newErrors["vehicle.bodyType"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails["number_of_seat"])
        newErrors["vehicle.seats"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.vehicle_category)
        newErrors["vehicle.category"] =
          "Low confidence OCR result - please verify.";

      setFieldError(newErrors);
      toast.success("Data extracted successfully!");
    } catch {
      toast.error("OCR extraction failed");
    } finally {
      // setLoading(false);
    }
  };

  // --- Reusable Borough field renderers (used for the single/dual layout) ---
  const getNestedValue = (path: string) =>
    path
      .split(".")
      .reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : ""), formik.values);
  const boroughLabel =
    "self-stretch text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']";
  const renderBadgeInput = (label: string, field: string) => (
    <div className="w-full flex flex-col justify-start items-start gap-2">
      <label className={boroughLabel}>{label}</label>
      <input
        type="number"
        value={getNestedValue(field)}
        onChange={(e) => formik.setFieldValue(field, e.target.value)}
        placeholder="Enter Number"
        className={boroughInputStyles}
      />
    </div>
  );
  const renderTaxiSelect = (label: string, field: string) => (
    <div className="w-full flex flex-col justify-start items-start gap-2">
      <label className={boroughLabel}>{label}</label>
      <Select
        options={taxiTypeOptions}
        placeholder="Select Type"
        isLoading={isTaxiTypeLoading}
        noOptionsMessage={() => (isTaxiTypeLoading ? "Loading..." : "No taxi types found")}
        styles={customStyles} menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
        value={taxiTypeOptions.find((op) => op.value === getNestedValue(field)) || null}
        onChange={(e: any) => formik.setFieldValue(field, e?.value || null)}
        components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
      />
    </div>
  );
  const renderExpiryPicker = (label: string, field: string) => {
    const value = getNestedValue(field);
    const show = openBoroughPicker === field;
    return (
      <div className="w-full flex flex-col justify-start items-start gap-2 relative">
        <label className={boroughLabel}>{label}</label>
        <div
          onClick={() => setOpenBoroughPicker(show ? null : field)}
          className="w-full h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer focus-within:border-blue-500"
        >
          <span
            className={
              value
                ? "text-gray-900 text-base font-light font-['Stack_Sans_Headline']"
                : "text-gray-400 text-base font-light font-['Stack_Sans_Headline']"
            }
          >
            {value || "Date"}
          </span>
          <img src={Vector6} className="w-4 h-4" alt="calendar" />
        </div>
        {show && (
          <div className="absolute bottom-[53px] left-0 z-50">
            <CustomDatePicker
              selectedDate={value ? new Date(value) : new Date()}
              onDateSelect={(date: Date) => {
                formik.setFieldValue(field, date.toLocaleDateString("sv-SE"));
                setOpenBoroughPicker(null);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // The whole Borough field set (single/dual layout), reusable for the primary
  // borough and the repeated "other borough".
  const renderBoroughFields = (prefix: string) => {
    const dual = getNestedValue(`${prefix}.dualBadge`) === "Yes";
    return (
      <>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full flex flex-col justify-start items-start gap-2">
            <label className={boroughLabel}>Borough</label>
            <input
              type="text"
              value={getNestedValue(`${prefix}.name`)}
              onChange={(e) => formik.setFieldValue(`${prefix}.name`, e.target.value)}
              placeholder="Enter Name"
              className={boroughInputStyles}
            />
          </div>
          {renderBadgeInput("Vehicle Badge Number", `${prefix}.vehicleBadgeNumber`)}
        </div>

        <div className="w-full flex flex-col justify-start items-start gap-5">
          <label className="text-black text-sm font-weight-500 font-['Stack_Sans_Headline']">
            Dual Badge?
          </label>
          <div className="inline-flex justify-start items-start gap-5">
            {["Yes", "No"].map((option) => (
              <label key={option} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name={`${prefix}-dualBadge`}
                  className="sr-only"
                  checked={getNestedValue(`${prefix}.dualBadge`) === option}
                  onChange={() => formik.setFieldValue(`${prefix}.dualBadge`, option)}
                />
                <img src={getNestedValue(`${prefix}.dualBadge`) === option ? Yes : No} alt="" />
                <span className="text-black text-sm font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>

        {dual ? (
          <>
            <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderBadgeInput("Client Badge Number 1", `${prefix}.clientBadgeNumber`)}
              {renderBadgeInput("Client Badge Number 2", `${prefix}.clientBadgeNumber2`)}
            </div>
            <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderTaxiSelect("Taxi Type 1", `${prefix}.taxiType`)}
              {renderTaxiSelect("Taxi Type 2", `${prefix}.taxiType2`)}
            </div>
            <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderExpiryPicker("Badge Expiry Date 1", `${prefix}.badgeExpirationDate`)}
              {renderExpiryPicker("Badge Expiry Date 2", `${prefix}.badgeExpirationDate2`)}
            </div>
          </>
        ) : (
          <>
            <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderBadgeInput("Client Badge Number", `${prefix}.clientBadgeNumber`)}
              {renderTaxiSelect("Taxi Type", `${prefix}.taxiType`)}
            </div>
            <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderExpiryPicker("Badge Expiry Date", `${prefix}.badgeExpirationDate`)}
              <div />
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <V5CUploadModal
        isOpen={showUploadModal}
        claimId={claimId}
        formik={formik}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(jobId) => pollJobStatus(jobId)}
      />
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center font-['Stack_Sans_Headline']">
          <div className="w-[420px] bg-white rounded shadow-xl p-6 flex flex-col gap-4">
            <h3 className="text-neutral-900 text-[20px] font-weight-600">
              Delete Third Party Vehicle
            </h3>

            <p className="text-neutral-600 text-sm">
              Are you sure you want to delete this third party vehicle?
            </p>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({
                    open: false,
                    id: null,
                    index: null,
                  })
                }
                className="px-6 py-3 rounded border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteTPVehicle}
                className="px-6 py-3 rounded bg-red-600 text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
        {/* Container matching left-[534px] and top-[157px] from source */}
        <h1 className="text-neutral-900 text-[24px] font-weight-600 font-['Stack_Sans_Headline']">
          Vehicle Details
        </h1>
        {/* Section 1: Personal Information Section */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Client's Vehicle Details
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-weight-400 hover:bg-blue-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload V5C File
            </button>
          </div>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Make */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Make
              </label>
              <input
                value={formik.values.vehicle.make}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.make", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.make"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.make", undefined);
                  }
                }}
                type="text"
                placeholder="Enter Make"
                className={`w-full h-[52px] px-5 bg-white rounded border ${fieldError["vehicle.make"] ? "border-red-500" : "border-gray-200"}  text-neutral-700 ${inputStyles}`}
              />
              {fieldError["vehicle.make"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.make"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Model */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Model
              </label>
              <input
                type="text"
                placeholder="Enter Model"
                value={formik.values.vehicle.model}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.model", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.model"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.model", undefined);
                  }
                }}
                className={`w-full h-[52px] px-5 bg-white rounded border ${fieldError["vehicle.model"] ? "border-red-500" : "border-gray-200"}  text-neutral-700 ${inputStyles}`}
              />
              {fieldError["vehicle.model"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.model"]}
                </p>
              ) : (
                ""
              )}
              {/* {fieldError["vehicle.model"] &&
                <ErrorMessage
                  name="vehicle.model"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />} */}
            </div>
            {/* Body Type */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Body Type
              </label>
              <input
                type="text"
                value={formik.values.vehicle.bodyType}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.bodyType", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.bodyType"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.bodyType", undefined);
                  }
                }}
                placeholder="Enter Body Type"
                className={`w-full h-[52px] px-5 bg-white rounded border ${fieldError["vehicle.bodyType"] ? "border-red-500" : "border-gray-200"}  text-neutral-700 ${inputStyles}`}
              />
              {fieldError["vehicle.bodyType"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.bodyType"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Vehicle Registration */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Vehicle Registration
              </label>
              <input
                type="text"
                value={formik.values.vehicle.registration}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.registration", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.registration"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.registration", undefined);
                  }
                }}
                placeholder="Enter Registration"
                className={`w-full h-[52px] px-5 bg-white rounded border ${fieldError["vehicle.registration"] ? "border-red-500" : "border-gray-200"}  text-neutral-700 ${inputStyles}`}
              />
              {fieldError["vehicle.registration"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.registration"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Color */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Color
              </label>
              <input
                type="text"
                placeholder="Enter Color"
                value={formik.values.vehicle.color}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.color", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.color"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.color", undefined);
                  }
                }}
                className={`w-full h-[52px] px-5 bg-white rounded border ${fieldError["vehicle.color"] ? "border-red-500" : "border-gray-200"}  text-neutral-700 ${inputStyles}`}
              />
              {fieldError["vehicle.color"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.color"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Fuel Type */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Fuel Type
              </label>
              <Select
                options={fuelOptions}
                placeholder="Select Type"
                styles={customStyles} menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
                value={fuelOptions.find(
                  (op) => op.value === formik.values.vehicle.fuelType,
                )}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.fuelType", e.value);

                  if (e.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.fuelType"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.fuelType", undefined);
                  }
                }}
              />
              {fieldError["vehicle.fuelType"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.fuelType"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Engine Size */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Engine Size
              </label>
              <input
                value={formik.values.vehicle.engineSize}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.engineSize", e.target.value);

                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.engineSize"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.engineSize", undefined);
                  }
                }}
                type="text"
                placeholder="Enter Size (cc)"
                className={`w-full h-[52px] px-5 bg-white rounded border ${fieldError["vehicle.engineSize"] ? "border-red-500" : "border-gray-200"}  text-neutral-700 ${inputStyles}`}
              />
              {fieldError["vehicle.engineSize"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.engineSize"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Transmission */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Transmission
              </label>
              <Select
                options={transmissionOptions}
                placeholder="Select Type"
                styles={customStyles} menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
                value={transmissionOptions.find(
                  (op) => op.value === formik.values.vehicle.transmission,
                )}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.transmission", e.value);

                  if (e.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.transmission"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.transmission", undefined);
                  }
                }}
              />
              {fieldError["vehicle.transmission"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.transmission"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Number of Seats */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Number of Seats (Inc. Driver)
              </label>
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded border border-gray-200 h-[52px]">
                <button
                  onClick={() =>
                    formik.setFieldValue(
                      "vehicle.seats",
                      Math.max(1, formik.values.vehicle.seats - 1),
                    )
                  }
                  className="text-blue-500"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-black">
                  {formik.values.vehicle.seats}
                </span>
                <button
                  onClick={() =>
                    formik.setFieldValue(
                      "vehicle.seats",
                      Math.max(1, formik.values.vehicle.seats + 1),
                    )
                  }
                  className="text-blue-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Vehicle Category
              </label>
              <Select
                options={categoryOptions}
                placeholder="Select Category"
                styles={customStyles} menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
                value={categoryOptions.find(
                  (op) => op.value === formik.values.vehicle.category,
                )}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.category", e.value);

                  if (e.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.category"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.category", undefined);
                  }
                }}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
              {fieldError["vehicle.category"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.category"]}
                </p>
              ) : (
                ""
              )}
            </div>
          </div>

          {/* Conditional Borough Section */}
          {/* {claimType !== "RTA - NA" && (
          <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-col gap-2 animate-in fade-in duration-300">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Borough
            </label>
            <input
              type="text"
              placeholder="Enter Borough (Mandatory for Nationwide Assist)"
              className="w-full px-5 py-4 bg-white rounded border border-blue-200 text-base focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
        )} */}
        </div>
        {/* Section 2:  Contact Information */}
        {claimType === "RTA - NA" && (
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col justify-start items-start gap-4 mt-6 animate-in fade-in duration-500">
            <div className="self-stretch inline-flex justify-start items-center gap-4">
              <h2 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
                Borough Details
              </h2>
            </div>
            <div className="self-stretch h-px bg-gray-100" />

            {renderBoroughFields("borough")}

            <div className="self-stretch h-px bg-gray-100" />

            <div className="self-stretch flex flex-col justify-start items-start gap-5">
              <label className="text-black text-sm font-weight-500 font-['Stack_Sans_Headline']">
                Any Other Borough?
              </label>
              <div className="inline-flex justify-start items-start gap-5">
                {["Yes", "No"].map((option) => (
                  <label key={option} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="otherBorough"
                      className="sr-only"
                      checked={formik.values.borough.otherBorough === option}
                      onChange={() => formik.setFieldValue("borough.otherBorough", option)}
                    />
                    {formik.values.borough.otherBorough === option ? (
                      <img src={Yes} alt="" />
                    ) : (
                      <img src={No} alt="" />
                    )}
                    <span className="text-black text-sm font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {claimType === "RTA - NA" &&
          formik.values.borough.otherBorough === "Yes" && (
            <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col justify-start items-start gap-4 mt-6 animate-in fade-in duration-500">
              <div className="self-stretch inline-flex justify-start items-center gap-4">
                <h2 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
                  Other Borough Details
                </h2>
              </div>
              <div className="self-stretch h-px bg-gray-100" />
              {renderBoroughFields("borough2")}
            </div>
          )}


        {/* SECTION: Third Party Vehicles — inline editable cards (no popup) */}
        <div className="self-stretch flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Third Party Vehicles
            </h2>
            <button
              type="button"
              onClick={addTPVehicleInline}
              className="h-8 px-3 py-2 rounded flex items-center gap-2.5 text-blue-500 hover:bg-blue-100"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          {formik.values.thirdPartyVehicles.length === 0 ? (
            <p className="text-gray-600 text-sm">
              Add Third Party Vehicle details by clicking on “Add Vehicle”
            </p>
          ) : (
            formik.values.thirdPartyVehicles.map((vehicle: any, index: number) => (
              <div
                key={vehicle.id ?? `third-party-vehicle-${index}`}
                className="self-stretch p-6 bg-white rounded-lg border border-gray-100 flex flex-col gap-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-black text-xl font-weight-600 leading-5">
                    Third Party Vehicle Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeTPVehicle(vehicle.id, index)}
                    className="p-1 hover:bg-red-50 rounded"
                    title="Remove vehicle"
                  >
                    <img src={trash} className="w-4 h-4" alt="remove" />
                  </button>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-neutral-700 text-[14px] font-weight-500">Make</label>
                      <input
                        type="text"
                        placeholder="Enter Make"
                        className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                        value={vehicle.make || ""}
                        onChange={(e) => updateTPVehicle(index, { make: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-neutral-700 text-[14px] font-weight-500">Model</label>
                      <input
                        type="text"
                        placeholder="Enter Model"
                        className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                        value={vehicle.model || ""}
                        onChange={(e) => updateTPVehicle(index, { model: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-neutral-700 text-[14px] font-weight-500">Registration</label>
                      <input
                        type="text"
                        placeholder="Enter Registration"
                        className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                        value={vehicle.registration || ""}
                        onChange={(e) => updateTPVehicle(index, { registration: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-neutral-700 text-[14px] font-weight-500">Color</label>
                      <input
                        type="text"
                        placeholder="Enter Color"
                        className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                        value={vehicle.color || ""}
                        onChange={(e) => updateTPVehicle(index, { color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <label className="text-black text-sm font-medium">Images Available</label>
                    <div className="flex items-center gap-5">
                      {["Yes", "No"].map((option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <img
                            src={vehicle.imagesAvailable === option ? Yes : No}
                            alt=""
                            onClick={() => updateTPVehicle(index, { imagesAvailable: option })}
                          />
                          <span className="text-black text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {checkModal && (
          <VehicleCheckModal
            isOpen={checkModal}
            onClose={() => openModal1(false)}
          />
        )}
        {/* MODAL: Third Party Vehicle Entry */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[800px] flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-neutral-900 text-[20px] font-weight-600">
                  Third Party Vehicle Details
                </h2>
                {/* <button onClick={() => setIsModalOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button> */}
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Input Grid */}
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-[14px] font-weight-500">
                    Make
                  </label>
                  <input
                    type="text"
                    className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                    placeholder="Enter Make"
                    value={currentVehicle.make}
                    onChange={(e) =>
                      setCurrentVehicle({
                        ...currentVehicle,
                        make: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-[14px] font-weight-500">
                    Model
                  </label>
                  <input
                    type="text"
                    className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                    placeholder="Enter Model"
                    value={currentVehicle.model}
                    onChange={(e) =>
                      setCurrentVehicle({
                        ...currentVehicle,
                        model: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-[14px] font-weight-500">
                    Registration
                  </label>
                  <input
                    type="text"
                    className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                    placeholder="Enter Registration"
                    value={currentVehicle.registration}
                    onChange={(e) =>
                      setCurrentVehicle({
                        ...currentVehicle,
                        registration: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-[14px] font-weight-500">
                    Color
                  </label>
                  <input
                    type="text"
                    className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                    placeholder="Enter Color"
                    value={currentVehicle.color}
                    onChange={(e) =>
                      setCurrentVehicle({
                        ...currentVehicle,
                        color: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Images Radio Group */}
              <div className="flex flex-col gap-4">
                <label className="text-black text-sm font-weight-400">
                  Images Available
                </label>
                <div className="flex gap-5">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="imgAvail"
                        className="hidden"
                        checked={currentVehicle.imagesAvailable === option}
                        onChange={() =>
                          setCurrentVehicle({
                            ...currentVehicle,
                            imagesAvailable: option,
                          })
                        }
                      />

                      {currentVehicle.imagesAvailable === option ? (
                        <img src={Yes} alt="" />
                      ) : (
                        <img src={No} alt="" />
                      )}
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Modal Actions */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeThirdPartyVehicleModal}
                  className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-weight-400 hover:bg-blue-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(false)}
                  className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => handleSave(true)}
                  className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 disabled:opacity-50"
                >
                  Save and Add Next Vehicle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Vehicle Checkpoint */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mb-8">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
            Vehicle Checkpoint
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-3 gap-5">
            {/* Vehicle Check Card */}
            <button
              onClick={() => openModal1(true)}
              className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
            >
              <img src={Vehicle} alt="" />

              <span className="text-blue-500 text-sm font-weight-300">
                Vehicle Check
              </span>
            </button>

            {/* DVLA Card */}
            <a
              // onClick={() => openModal2(true)}
              href="https://www.gov.uk/view-driving-licence/"
              target="_blank"
              className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
            >
              <img src={DVLA} alt="" />

              <span className="text-blue-500 text-sm font-weight-300">
                DVLA
              </span>
            </a>

            {/* Process MID Card */}
            <a
              href="https://www.askmid.com/"
              target="_blank"
              className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
            >
              <img src={ProcessMID} alt="" />
              <span className="text-blue-500 text-sm font-weight-300">
                Process MID
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};;
