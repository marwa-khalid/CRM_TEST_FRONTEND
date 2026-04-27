import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Formik, Field, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { FaTimes } from "react-icons/fa";
import Label from "../common/label";
import CustomSelect from "../ReactSelect/ReactSelect";
import { useParams } from "react-router-dom";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import {
  getCheckoutDetails,
  getDriverChargesByVehicle,
  getHireProvided,
  getTableData,
  saveDriverCheckout,
  updateDriverCheckout,
  updateAllDriverChecksForClaim,
  updateDriverChargesByVehicle,
} from "../../services/HireVehicleProvided/HireVehicleProvided";
import TopRightIcon from "../common/top-right-icon";
import { getActualVehicleCategory } from "../../services/HireDetail/HireDetails";
import { API_BASE_URL } from "../../services/axiosConfig";
import { toast } from "react-toastify";

export interface PanelSolicitorDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext?: boolean;
}

const DriverCheckoutChargesForm = forwardRef<
  HTMLDivElement,
  PanelSolicitorDetailsProps
>(({ handleNext, skipNext }: PanelSolicitorDetailsProps, ref) => {
  const { id } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get("claimid");

  const [isEditing, setIsEditing] = useState(false);
  const validationSchema = Yup.object().shape({
    // vehicles: Yup.array().of(
    //   Yup.object().shape({
    //     interiorCleanCheckOut: Yup.string().required("Required"),
    //     interiorCleanCheckIn: Yup.string().required("Required"),
    //     exteriorCleanCheckOut: Yup.string().required("Required"),
    //     exteriorCleanCheckIn: Yup.string().required("Required"),
    //   })
    // ),
  });

  const [activeTab, setActiveTab] = useState(0);
  const formikRef = useRef<any>(null);
  const [offHireModal, setOffHireModal] = useState(false);
  const [currentVehicleId, setCurrentVehicleId] = useState(null);
  const [cardData, setCardData] = useState([]);
  const [images, setImages] = useState([]);
  const [exteriorImages, setExteriorImages] = useState([]);
  const fileInputRef = useRef(null);
  const fileInputExteriorRef = useRef(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [formData, setFormData] = useState({
    interiorCleanCheckOut: "",
    interiorCleanCheckIn: "",
    interiorDamage: false,
    interiorDamageDescription: "",
    interiorPhotos: [],
    applyDamageCharges: "",
    exteriorCleanCheckOut: "",
    exteriorCleanCheckIn: "",
    exteriorDamage: false,
    petrolChargeAmount: "",
    id: null,
    exteriorDamageDescription: "",
    exteriorPhotos: [],
    petrolCheckoutCharge: "",
    petrolChargeReason: "",
    damageCharges: "",
    damageChargesPaidNow: "",
    damageNotes: "",
    valetCharge: "",
  });

  const [initialValues, setInitialValues] = useState({
    vehicles: [
      {
        interiorCleanCheckOut: "",
        interiorCleanCheckIn: "",
        interiorDamage: false,
        interiorDamageDescription: "",
        interiorPhotos: [],
        id: null,

        exteriorCleanCheckOut: "",
        exteriorCleanCheckIn: "",
        exteriorDamage: false,
        exteriorDamageDescription: "",
        exteriorPhotos: [],

        petrolCheckoutCharge: "",
        petrolChargeAmount: "",
        petrolChargeReason: "",

        applyDamageCharges: "",
        damageCharges: "",
        damageChargesPaid: false,
        damageChargesPaidNow: "",
        damageNotes: "",
        registration_number: "",
        hire_vehicle_provided_id: "",

        valetCharge: "",
      },
    ],
  });
  const currentClaimId = claimID || id;

  const [actualVehicleCategory, setActualVehicleCategory] = useState([]);

  // Helper function for decimal formatting
  const formatToTwoDecimals = (value: string): string => {
    if (value === "" || value === null || value === undefined) return "";

    const num = parseFloat(value);
    if (isNaN(num)) return value;

    return num.toFixed(2);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchActualVehicleCategory();
  }, []);

  const fetchActualVehicleCategory = async () => {
    try {
      const res = await getActualVehicleCategory();
      setActualVehicleCategory(res.data);
    } catch (e) {}
  };

  const loadData = async () => {
    try {
      const [checkoutRes, cardRes, hireProvedRes] = await Promise.all([
        getCheckoutDetails(currentClaimId),
        getTableData(currentClaimId),
        getHireProvided(currentClaimId),
      ]);
      const cardMap = (cardRes?.data || []).reduce((acc: any, item: any) => {
        if (item.hire_vehicle_registration) {
          acc[item.hire_vehicle_registration] = item;
        }
        return acc;
      }, {} as Record<string, any>);

      const hireProvidedMap = (hireProvedRes?.data || []).reduce(
        (acc: any, item: any) => {
          const reg = item.hire_vehicle_registration?.trim()?.toUpperCase();
          if (reg) acc[reg] = item;
          return acc;
        },
        {} as Record<string, any>
      );

      // Map checkout data and merge info from cardData
      if (Array.isArray(checkoutRes.data) && checkoutRes.data.length > 0) {
        const mapped = checkoutRes.data.map((item: any) => {
          const reg = item.registration_number?.trim()?.toUpperCase();
          const cardItem = cardMap[reg] || {};
          const providedItem = hireProvidedMap[reg] || {};

          const actualLabel =
            actualVehicleCategory
              .find(
                (c: any) => c.id === providedItem.actual_vehicle_category_id
              )
              ?.label?.toUpperCase() || "";

          let valetCharge = 0;

          if (
            /CV[1-4]|CM[1-3]|RV[1-2]|CP[1-3]|CS[1-5]/.test(actualLabel) ||
            /XHIRE\s*T12/i.test(actualLabel) ||
            /T12\s*>\s*3\s*YRS|T12\s*<\s*3\s*YRS|T12.*50\/50/i.test(actualLabel)
          ) {
            valetCharge = 50;
          } else if (
            /T10\s*>\s*3\s*YRS|T10\s*<\s*3\s*YRS|T10.*50\/50/i.test(
              actualLabel
            ) ||
            /^M[1-6]?|F[1-9]?|M3\s*TOURAN/i.test(actualLabel)
          ) {
            valetCharge = 40;
          } else {
            valetCharge = Number(item.valet_charges) || 0;
          }

          return {
            make: cardItem.make || providedItem.make || "—",
            model: cardItem.model || providedItem.model || "—",
            hire_vehicle_registration: item.registration_number || "—",
            hire_start_date:
              cardItem.hire_start_date || providedItem.hire_start_date || "—",
            hire_end_date:
              cardItem.hire_end_date || providedItem.hire_end_date || "—",
            hire_vehicle_provided_id:
              item.hire_vehicle_provided_id || providedItem.id || null,
            actual_vehicle_category_id:
              providedItem.actual_vehicle_category_id || "",
            actual_vehicle_category_label: actualLabel || "",
            id: item?.id,

            valetCharge: valetCharge || "",
            damageCharges: Number(item.damage_charges) || "",
            damageChargesPaid: item.damage_charges_paid || false,
            petrolChargeAmount: Number(item.petrol_checkout_charges) || "",

            apply_damage_charges: item.apply_damage_charges,
            damage_charges_paid_now: item.damage_charges_paid_now,
            damage_charges_note: item.damage_charges_note,
            total_driver_checkout_charges: item.total_driver_checkout_charges,

            interior_clean_at_check_in: item.interior_clean_at_check_in,
            interior_clean_at_check_out: item.interior_clean_at_check_out,
            describe_interior_damage: item.describe_interior_damage,
            interior_damage_at_check_in: item.interior_damage_at_check_in,

            exterior_clean_at_check_out: item.exterior_clean_at_check_out,
            exterior_clean_at_check_in: item.exterior_clean_at_check_in,
            exterior_damage_at_check_in: item.exterior_damage_at_check_in,
            describe_exterior_damage: item.describe_exterior_damage,

            apply_petrol_checkout_charges: item.apply_petrol_checkout_charges,
            petrol_checkout_charges: item.petrol_checkout_charges,
            petrol_charges_note: item.petrol_charges_note,
          };
        });

        // Sort the mapped vehicles by hire_vehicle_provided_id in ascending order
        const sortedMapped = mapped.sort((a: any, b: any) => {
          // Handle null/undefined values by placing them at the end
          if (!a.hire_vehicle_provided_id && !b.hire_vehicle_provided_id)
            return 0;
          if (!a.hire_vehicle_provided_id) return 1;
          if (!b.hire_vehicle_provided_id) return -1;

          return a.hire_vehicle_provided_id - b.hire_vehicle_provided_id;
        });

        setInitialValues({ vehicles: sortedMapped });
        setIsEditing(true);
      }
    } catch (e) {
      console.error("❌ Failed to load checkout data:", e);
    }
  };
  useEffect(() => {
    if (!currentClaimId || actualVehicleCategory.length === 0) return;

    loadData();
  }, [id, claimID, actualVehicleCategory]);

  const handleModalFormChange = (name, e) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: e,
    }));
  };

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };
  const handleAddExteriorImage = () => {
    fileInputExteriorRef.current.click();
  };

  const handleFileChange = (e, fieldName) => {
    const files = Array.from(e.target.files || []);

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: [...(prevData[fieldName] || []), ...files],
    }));

    const newImageURLs = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImageURLs]);
  };

  const handleFileExteriorChange = (e, fieldName) => {
    const files = Array.from(e.target.files || []);

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: [...(prevData[fieldName] || []), ...files],
    }));

    const newImageURLs = files.map((file) => URL.createObjectURL(file));
    setExteriorImages((prev) => [...prev, ...newImageURLs]);
  };

  const handleModalCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const handleValetCharge = (typeData: string, value: string) => {
    setFormData((prevData) => {
      const interiorValue =
        typeData === "interiorCleanCheckIn"
          ? value
          : prevData.interiorCleanCheckIn;
      const exteriorValue =
        typeData === "exteriorCleanCheckIn"
          ? value
          : prevData.exteriorCleanCheckIn;

      const originalValetCharge =
        prevData.originalValetCharge !== undefined
          ? prevData.originalValetCharge
          : prevData.valetCharge;

      const valetCharge =
        interiorValue === "Yes" && exteriorValue === "Yes"
          ? 0
          : originalValetCharge;

      return {
        ...prevData,
        [typeData]: value,
        valetCharge,
        originalValetCharge,
      };
    });
  };

  const buildCheckoutFormData = (data: any, vehicleId: any, claimId: any) => {
    const fd = new FormData();

    fd.append("currency", "GBP");
    fd.append("claim_id", claimId);
    fd.append("hire_vehicle_provided_id", vehicleId);

    // -------- INTERIOR --------
    fd.append(
      "interior_clean_at_check_out",
      data.interiorCleanCheckOut === "Yes" ||
        data.interior_clean_at_check_out ||
        false
    );

    fd.append(
      "interior_clean_at_check_in",
      data.interiorCleanCheckIn === "Yes" ||
        data.interior_clean_at_check_in ||
        false
    );

    fd.append(
      "interior_damage_at_check_in",
      data.interiorDamage ?? data.interior_damage_at_check_in ?? false
    );

    fd.append(
      "describe_interior_damage",
      data.interiorDamageDescription ?? data.describe_interior_damage ?? ""
    );

    // -------- EXTERIOR --------
    fd.append(
      "exterior_clean_at_check_out",
      data.exteriorCleanCheckOut === "Yes" ||
        data.exterior_clean_at_check_out ||
        false
    );

    fd.append(
      "exterior_clean_at_check_in",
      data.exteriorCleanCheckIn === "Yes" ||
        data.exterior_clean_at_check_in ||
        false
    );

    fd.append(
      "exterior_damage_at_check_in",
      data.exteriorDamage ?? data.exterior_damage_at_check_in ?? false
    );

    fd.append(
      "describe_exterior_damage",
      data.exteriorDamageDescription ?? data.describe_exterior_damage ?? ""
    );

    // -------- PETROL --------
    fd.append(
      "apply_petrol_checkout_charges",
      data.petrolCheckoutCharge === "Yes" ||
        data.apply_petrol_checkout_charges ||
        false
    );

    fd.append(
      "petrol_checkout_charges",
      Number(data.petrolChargeAmount ?? data.petrol_checkout_charges ?? 0)
    );

    fd.append(
      "petrol_charges_note",
      data.petrolChargeReason ?? data.petrol_charges_note ?? ""
    );

    // -------- DAMAGE --------
    fd.append(
      "apply_damage_charges",
      data.applyDamageCharges === "Yes" || data.apply_damage_charges || false
    );

    fd.append(
      "damage_charges",
      Number(data.damageCharges ?? data.damage_charges ?? 0)
    );

    fd.append(
      "damage_charges_paid_now",
      Number(data.damageChargesPaidNow ?? data.damage_charges_paid_now ?? 0)
    );

    fd.append(
      "damage_charges_note",
      data.damageNotes ?? data.damage_charges_note ?? ""
    );

    fd.append(
      "damage_charges_paid",
      data.damageChargesPaid ?? data.damage_charges_paid ?? false
    );

    // -------- VALET --------
    fd.append(
      "valet_charges",
      Number(data.valetCharge ?? data.valet_charges ?? 0)
    );

    // -------- TOTAL --------
    fd.append(
      "total_driver_checkout_charges",
      Number(
        data.total_driver_checkout_charges ??
          Number(data.petrolChargeAmount ?? data.petrol_checkout_charges ?? 0) +
            Number(data.damageCharges ?? data.damage_charges ?? 0) +
            Number(data.valetCharge ?? data.valet_charges ?? 0)
      )
    );

    // --- PHOTOS ---
    if (data.interiorPhotos?.length) {
      data.interiorPhotos.forEach((file) => fd.append("interior_files", file));
    }

    if (data.exteriorPhotos?.length) {
      data.exteriorPhotos.forEach((file) => fd.append("exterior_files", file));
    }

    return fd;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const storedClaimId = claimID || id;

    try {
      if (isModalEditing) {
        const fd = buildCheckoutFormData(
          formData,
          currentVehicleId,
          storedClaimId
        );

        await updateDriverChargesByVehicle(currentVehicleId, fd);
        toast.success("Driver Checkout Charges updated successfully");
        setOffHireModal(false);
      } else {
        // CREATE MODE
        const fd = buildCheckoutFormData(
          formData,
          currentVehicleId,
          storedClaimId
        );

        await saveDriverCheckout(fd);
        toast.success("Driver Checkout Charges created successfully");
        setOffHireModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadData();
    }
  };

  const handleSubmit = async (values: any) => {
    const storedClaimId = claimID || id;
    const vehicles = values.vehicles || [];

    const promises = vehicles.map((v) => {
      const fd = buildCheckoutFormData(
        v,
        v.hire_vehicle_provided_id,
        storedClaimId
      );
      fd.append("id", v.id);

      if (isEditing) {
        return updateDriverChargesByVehicle(v.hire_vehicle_provided_id, fd);
      } else {
        return saveDriverCheckout(fd);
      }
    });

    await Promise.all(promises);

    toast.success(
      isEditing
        ? "Driver Checkout Charges updated successfully"
        : "Driver Checkout Charges created successfully"
    );

    if (handleNext && !skipNext) {
      handleNext(19, "next");
    }
  };

  const handleViewCharges = async (veh) => {
    setOffHireModal(true);
    setCurrentVehicleId(veh.hire_vehicle_provided_id);

    try {
      const res = await getDriverChargesByVehicle(veh.hire_vehicle_provided_id);
      if (res?.data) {
        const data = res.data;

        const providedItem = actualVehicleCategory.find(
          (c: any) => c.id === veh.actual_vehicle_category_id
        );
        const actualLabel = providedItem?.label?.toUpperCase() || "";

        let valetCharge = 0;

        if (
          /CV[1-4]|CM[1-3]|RV[1-2]|CP[1-3]|CS[1-5]/.test(actualLabel) ||
          /XHIRE\s*T12/i.test(actualLabel) ||
          /T12\s*>\s*3\s*YRS|T12\s*<\s*3\s*YRS|T12.*50\/50/i.test(actualLabel)
        ) {
          valetCharge = 50;
        } else if (
          /T10\s*>\s*3\s*YRS|T10\s*<\s*3\s*YRS|T10.*50\/50/i.test(
            actualLabel
          ) ||
          /^M[1-6]?|F[1-9]?|M3\s*TOURAN/i.test(actualLabel)
        ) {
          valetCharge = 40;
        } else {
          valetCharge = Number(data.valet_charges) || 0;
        }

        setFormData({
          interiorCleanCheckOut: data.interior_clean_at_check_out
            ? "Yes"
            : "No",
          interiorCleanCheckIn: data.interior_clean_at_check_in ? "Yes" : "No",
          interiorDamage: data.interior_damage_at_check_in ?? false,
          interiorDamageDescription: data.describe_interior_damage ?? "",
          interiorPhotos: [],

          applyDamageCharges: data.apply_damage_charges ? "Yes" : "No",
          exteriorCleanCheckOut: data.exterior_clean_at_check_out
            ? "Yes"
            : "No",
          exteriorCleanCheckIn: data.exterior_clean_at_check_in ? "Yes" : "No",
          exteriorDamage: data.exterior_damage_at_check_in ?? false,
          exteriorDamageDescription: data.describe_exterior_damage ?? "",
          exteriorPhotos: [],

          petrolCheckoutCharge: data.apply_petrol_checkout_charges
            ? "Yes"
            : "No",
          petrolChargeAmount: data.petrol_checkout_charges ?? "",
          petrolChargeReason: data.petrol_charges_note ?? "",

          damageCharges: data.damage_charges ?? "",
          damageChargesPaidNow: data.damage_charges_paid_now ?? "",
          damageNotes: data.damage_charges_note ?? "",
          valetCharge,
        });

        setImages(
          data.interior_images?.map((img) =>
            img.url.replace("https://localhost:8009/", API_BASE_URL)
          ) || []
        );

        setExteriorImages(
          data.exterior_images?.map((img) =>
            img.url.replace("https://localhost:8009/", API_BASE_URL)
          ) || []
        );

        setIsModalEditing(true);
      }
    } catch (e) {
      console.error("Error fetching driver charges:", e);
    }
  };

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      if (!formikRef.current) {
        throw new Error("Formik instance not available");
      }
      await formikRef.current.submitForm();
      return true;
    },
  }));

  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        innerRef={formikRef}
        validationSchema={Yup.object()}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, handleBlur }) => {
          return (
            <Form className="space-y-6 mt-2">
              {/* ---------- Tabs ---------- */}
              <div className="flex gap-5 pt-10">
                <h3 className="text-lg font-weight-600  mb-2 sm:text-xl">
                  Driver Checkout Charges
                </h3>
              </div>
              <div className="flex gap-5 border-b border-gray-300 py-5 mb-5">
                {values.vehicles.map((vehicle, index) => (
                  <p
                    key={index}
                    className={`text-sm font-weight-600 cursor-pointer ${
                      activeTab === index
                        ? "underline decoration-2 underline-offset-8"
                        : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab(index)}
                  >
                    Vehicle {vehicle.hire_vehicle_registration || ""}
                  </p>
                ))}
              </div>

              {/* ---------- Vehicle Cards ---------- */}
              {values.vehicles.map(
                (vehicle, index) =>
                  activeTab === index && (
                    <div key={index} className="bg-white rounded-lg space-y-6">
                      {/* Header */}
                      <div
                        className={`flex justify-end gap-1 text-xs text-custom ${
                          !vehicle.hire_vehicle_registration
                            ? "hover:cursor-not-allowed"
                            : "cursor-pointer hover:underline"
                        }`}
                        onClick={() => {
                          if (!vehicle.hire_vehicle_registration) return;
                          handleViewCharges(vehicle);
                        }}
                      >
                        <p className="text-sm">View driver charges</p>
                        <TopRightIcon />
                      </div>

                      {/* Vehicle Info */}
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <p className="text-sm text-gray-600">
                            <strong>Make:</strong>{" "}
                            <span className="text-gray-500">
                              {vehicle.make || "—"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Hire Start:</strong>{" "}
                            <span className="text-gray-500">
                              {vehicle.hire_start_date || "—"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Model:</strong>{" "}
                            <span className="text-gray-500">
                              {vehicle.model || "—"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Hire End:</strong>{" "}
                            <span className="text-gray-500">
                              {vehicle.hire_end_date || "Not specified"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div className="space-y-4">
                        {/* Valet Charges */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <Label>Valet Charges</Label>
                          <div className="col-span-2">
                            <div className="col-span-3 lg:col-span-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field name={`vehicles.${index}.valetCharge`}>
                                  {({ field, form }: any) => (
                                    <input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      className="w-full p-2 rounded focus:outline-none border-none"
                                      onChange={(e: any) => {
                                        form.setFieldValue(
                                          `vehicles.${index}.valetCharge`,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={(
                                        e: React.FocusEvent<HTMLInputElement>
                                      ) => {
                                        if (field.value) {
                                          const formatted = formatToTwoDecimals(
                                            field.value.toString()
                                          );
                                          form.setFieldValue(
                                            `vehicles.${index}.valetCharge`,
                                            formatted
                                          );
                                        }
                                      }}
                                      value={field.value}
                                    />
                                  )}
                                </Field>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Damage Charges */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <Label>Damage Charges</Label>
                          <div className="col-span-2">
                            <div className="col-span-3 lg:col-span-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field name={`vehicles.${index}.damageCharges`}>
                                  {({ field, form }: any) => (
                                    <input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      className="w-full p-2 rounded focus:outline-none border-none"
                                      onChange={(e: any) => {
                                        form.setFieldValue(
                                          `vehicles.${index}.damageCharges`,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={(
                                        e: React.FocusEvent<HTMLInputElement>
                                      ) => {
                                        if (field.value) {
                                          const formatted = formatToTwoDecimals(
                                            field.value.toString()
                                          );
                                          form.setFieldValue(
                                            `vehicles.${index}.damageCharges`,
                                            formatted
                                          );
                                        }
                                      }}
                                      value={field.value}
                                    />
                                  )}
                                </Field>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Petrol Checkout Charges */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <Label>Petrol Checkout Charges</Label>
                          <div className="col-span-2">
                            <div className="col-span-3 lg:col-span-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field
                                  name={`vehicles.${index}.petrolChargeAmount`}
                                >
                                  {({ field, form }: any) => (
                                    <input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      className="w-full p-2 rounded focus:outline-none border-none"
                                      onChange={(e: any) => {
                                        form.setFieldValue(
                                          `vehicles.${index}.petrolChargeAmount`,
                                          e.target.value
                                        );
                                      }}
                                      onBlur={(
                                        e: React.FocusEvent<HTMLInputElement>
                                      ) => {
                                        if (field.value) {
                                          const formatted = formatToTwoDecimals(
                                            field.value.toString()
                                          );
                                          form.setFieldValue(
                                            `vehicles.${index}.petrolChargeAmount`,
                                            formatted
                                          );
                                        }
                                      }}
                                      value={field.value}
                                    />
                                  )}
                                </Field>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 items-center">
                          <Label>Damage Charges Paid</Label>
                          <div className="col-span-2 flex items-center">
                            <Field
                              name={`vehicles.${index}.damageChargesPaid`}
                              type="checkbox"
                              className="p-2 border rounded"
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                const newValue = e.target.checked;
                                setFieldValue(
                                  `vehicles.${index}.damageChargesPaid`,
                                  newValue
                                );
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 items-center">
                          <Label>Total Driver Checkout Charges</Label>
                          <div className="col-span-2">
                            <div className="col-span-3 lg:col-span-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg bg-[#fafafa]">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field
                                  name={`vehicles.${index}.petrolChargeAmount`}
                                  type="number"
                                  className="w-full p-2 rounded focus:outline-none border-none"
                                  disabled
                                  value={(
                                    Number(vehicle.damageCharges || 0) +
                                    Number(vehicle.petrolChargeAmount || 0) +
                                    Number(vehicle.valetCharge || 0)
                                  ).toFixed(2)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
              )}
            </Form>
          );
        }}
      </Formik>

      <Modal
        open={offHireModal}
        onClose={() => setOffHireModal(false)}
        classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
        styles={{
          modal: {
            zIndex: 10000000000000,
          },
          overlay: {},
        }}
        closeIcon={
          <FaTimes size={24} className="text-[#717680] font-normal w-5 h-5" />
        }
      >
        <form className="space-y-4" onSubmit={handleCheckoutSubmit}>
          <div className="flex gap-5 border-b border-cloudGray py-5 mb-5">
            <p className="text-xl font-weight-600">Vehicle Checkout</p>
          </div>

          {/* Interior Section */}
          <div className="space-y-4">
            <p className="text-lg font-weight-600">Interior (Inside)</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Was the interior clean at check-out?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <CustomSelect
                  name="interiorCleanCheckOut"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={
                    formData.interiorCleanCheckOut
                      ? {
                          value: formData.interiorCleanCheckOut,
                          label: formData.interiorCleanCheckOut,
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleModalFormChange(
                      "interiorCleanCheckOut",
                      option ? option.value : ""
                    );
                  }}
                  placeholder="Select"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Was the interior clean at check-in?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <CustomSelect
                  name="interiorCleanCheckIn"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={
                    formData.interiorCleanCheckIn
                      ? {
                          value: formData.interiorCleanCheckIn,
                          label: formData.interiorCleanCheckIn,
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleModalFormChange(
                      "interiorCleanCheckIn",
                      option ? option.value : ""
                    );
                    handleValetCharge(
                      "interiorCleanCheckIn",
                      option?.value || ""
                    );
                  }}
                  placeholder="Select"
                  required
                />
              </div>
            </div>

            {/* Interior Damage Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Was any interior damage observed at check-in?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <input
                  type="checkbox"
                  name="interiorDamage"
                  checked={formData.interiorDamage}
                  onChange={handleModalCheckboxChange}
                />
              </div>
            </div>

            {formData.interiorDamage && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <Label>Describe the interior damage</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md"
                      name="interiorDamageDescription"
                      value={formData.interiorDamageDescription}
                      onChange={(e) =>
                        handleModalFormChange(
                          "interiorDamageDescription",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <Label>Add interior photos (optional)</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <div className="flex gap-3 overflow-x-auto mb-4">
                      {images.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          className="h-20 w-20 rounded-md object-cover hover:cursor-pointer border border-gray-200"
                        />
                      ))}

                      <button
                        type="button"
                        onClick={handleAddImage}
                        className={`flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md text-3xl font-light text-gray-400 hover:border-blue-500 hover:text-blue-500
          `}
                      >
                        +
                      </button>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <hr className="mt-4" />

          {/* Exterior Section */}
          <div className="space-y-4">
            <p className="text-lg font-weight-600">Exterior (Outside)</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Was the exterior clean at check-out?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <CustomSelect
                  name="exteriorCleanCheckOut"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={
                    formData.exteriorCleanCheckOut
                      ? {
                          value: formData.exteriorCleanCheckOut,
                          label: formData.exteriorCleanCheckOut,
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleModalFormChange(
                      "exteriorCleanCheckOut",
                      option ? option.value : ""
                    );
                  }}
                  placeholder="Select"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Was the exterior clean at check-in?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <CustomSelect
                  name="exteriorCleanCheckIn"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={
                    formData.exteriorCleanCheckIn
                      ? {
                          value: formData.exteriorCleanCheckIn,
                          label: formData.exteriorCleanCheckIn,
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleModalFormChange(
                      "exteriorCleanCheckIn",
                      option ? option.value : ""
                    );
                    handleValetCharge(
                      "exteriorCleanCheckIn",
                      option?.value || ""
                    );
                  }}
                  placeholder="Select"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Was any exterior damage observed at check-in?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <input
                  type="checkbox"
                  name="exteriorDamage"
                  checked={formData.exteriorDamage}
                  onChange={handleModalCheckboxChange}
                />
              </div>
            </div>

            {formData.exteriorDamage && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <Label>Describe the exterior damage</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md"
                      name="exteriorDamageDescription"
                      value={formData.exteriorDamageDescription}
                      onChange={(e) =>
                        handleModalFormChange(
                          "exteriorDamageDescription",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <Label>Add exterior photos (optional)</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <div className="flex gap-3 overflow-x-auto mb-4">
                      {exteriorImages.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          className="h-20 w-20 rounded-md object-cover hover:cursor-pointer border border-gray-200"
                        />
                      ))}

                      <button
                        type="button"
                        onClick={handleAddExteriorImage}
                        className={`flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md text-3xl font-light text-gray-400 hover:border-blue-500 hover:text-blue-500
          `}
                      >
                        +
                      </button>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputExteriorRef}
                      className="hidden"
                      onChange={handleFileExteriorChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <hr className="mt-4" />

          {/* Charges Section */}
          <div className="space-y-4">
            <p className="text-lg font-weight-600">Charges</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Apply Petrol Checkout Charge?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <CustomSelect
                  name="petrolCheckoutCharge"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={
                    formData.petrolCheckoutCharge
                      ? {
                          value: formData.petrolCheckoutCharge,
                          label: formData.petrolCheckoutCharge,
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleModalFormChange(
                      "petrolCheckoutCharge",
                      option ? option.value : ""
                    );
                  }}
                  placeholder="Select"
                  required
                />
              </div>
            </div>

            {formData.petrolCheckoutCharge === "Yes" && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <Label>Petrol Checkout Charges (£)</Label>
                  </div>

                  <div className="col-span-3 lg:col-span-2">
                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                        <span className="text-sm sm:text-base">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                        name="petrolChargeAmount"
                        value={formData.petrolChargeAmount || ""}
                        onChange={(e) =>
                          handleModalFormChange(
                            "petrolChargeAmount",
                            e.target.value
                          )
                        }
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          if (formData.petrolChargeAmount) {
                            const formatted = formatToTwoDecimals(
                              formData.petrolChargeAmount
                            );
                            handleModalFormChange(
                              "petrolChargeAmount",
                              formatted
                            );
                          }
                        }}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <Label>Reason/notes</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <input
                      type="text"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                      name="petrolChargeReason"
                      value={formData.petrolChargeReason}
                      onChange={(e) =>
                        handleModalFormChange(
                          "petrolChargeReason",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* Damage Charges Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <label>Apply Damage Charges now?</label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <CustomSelect
                  name="applyDamageCharges"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={
                    formData.applyDamageCharges
                      ? {
                          value: formData.applyDamageCharges,
                          label: formData.applyDamageCharges,
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleModalFormChange(
                      "applyDamageCharges",
                      option ? option.value : ""
                    );
                  }}
                  placeholder="Select"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label>Valet Charges (£)</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                  <div className="flex items-center px-2 sm:px-3 rounded-lg">
                    <span className="text-sm sm:text-base">£</span>
                  </div>
                  <input
                    name="valetCharge"
                    type="number"
                    step="0.01"
                    value={formData.valetCharge}
                    className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                    onChange={(e) =>
                      handleModalFormChange("valetCharge", e.target.value)
                    }
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      if (formData.valetCharge) {
                        const formatted = formatToTwoDecimals(
                          formData.valetCharge.toString()
                        );
                        handleModalFormChange("valetCharge", formatted);
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {formData.applyDamageCharges === "Yes" && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <label>Damage Charges (£)</label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                        <span className="text-sm sm:text-base">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                        name="damageCharges"
                        value={formData.damageCharges || ""}
                        onChange={(e) =>
                          handleModalFormChange("damageCharges", e.target.value)
                        }
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          if (formData.damageCharges) {
                            const formatted = formatToTwoDecimals(
                              formData.damageCharges
                            );
                            handleModalFormChange("damageCharges", formatted);
                          }
                        }}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <label>Damage Charges Paid Now (£)</label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                        <span className="text-sm sm:text-base">£</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                        name="damageChargesPaidNow"
                        value={formData.damageChargesPaidNow || 0}
                        onChange={(e) =>
                          handleModalFormChange(
                            "damageChargesPaidNow",
                            e.target.value
                          )
                        }
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          if (formData.damageChargesPaidNow) {
                            const formatted = formatToTwoDecimals(
                              formData.damageChargesPaidNow.toString()
                            );
                            handleModalFormChange(
                              "damageChargesPaidNow",
                              formatted
                            );
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1">
                    <label>Notes</label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <input
                      type="text"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                      name="damageNotes"
                      value={formData.damageNotes}
                      onChange={(e) =>
                        handleModalFormChange("damageNotes", e.target.value)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {formData.applyDamageCharges === "No" &&
              (formData.interiorDamage || formData.exteriorDamage) && (
                <div className="text-sm text-gray-500 mt-2">
                  Damage recorded. You can add charges later in Driver Checkout
                  Charges.
                </div>
              )}
          </div>

          <div className="flex justify-between mt-5">
            <button
              type="submit"
              className="text-white bg-custom hover:bg-[#252B37] px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setOffHireModal(false)}
              className="px-4 py-2 bg-gray-300 text-black rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
});

export default DriverCheckoutChargesForm;
