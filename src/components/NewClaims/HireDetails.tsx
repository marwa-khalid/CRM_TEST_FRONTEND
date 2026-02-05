import "react-phone-input-2/lib/style.css";
import Label from "../common/label";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { useParams } from "react-router-dom";
import { DatePicker } from "../application/date-picker/date-picker";
import CustomSelect from "../ReactSelect/ReactSelect";
import { debounce } from "lodash";
import { useSelector } from "react-redux";
import type { DateValue } from "react-aria-components";
import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  createClientVehicleCategory,
  createHireDetails,
  fetchVehicleExtraData,
  getActualVehicleCategory,
  getAdminFeeType,
  getClientVehicleCategory,
  getHireDetails,
  updateClientVehicleCategory,
  updateHireDetails,
} from "../../services/HireDetail/HireDetails";
import { ChevronDown } from "lucide-react";
import { getHireProvided } from "../../services/HireVehicleProvided/HireVehicleProvided";
import {
  parseCalendarDate,
  parseCalendarDateTimeStamp,
} from "../../common/common";

const validationSchema = Yup.object().shape({
  // thirdPartyVehicles: Yup.array().of(
  //   Yup.object().shape({
  //     client_vehicle_category: Yup.string().required(
  //       "Client vehicle category is required"
  //     ),
  //     actual_vehicle_category: Yup.string().required(
  //       "Actual vehicle category is required"
  //     ),
  //     reference: Yup.string().required("Reference is required"),
  //     claim_id: Yup.number().required("Claim ID is required"),
  //     email_sent_date: Yup.string().nullable(),
  //     accepted_sent_date: Yup.string().nullable(),
  //     hireOutDate: Yup.string().required("Hire out date is required"),
  //     hireBackDate: Yup.string().required("Hire back date is required"),
  //     no_of_days_hired: Yup.number().required(
  //       "Number of days hired is required"
  //     ),
  //     total_no_of_days_hired: Yup.number().required(
  //       "Total number of days hired is required"
  //     ),
  //     vehicle_file_reference: Yup.string().required(
  //       "Vehicle file reference is required"
  //     ),
  //     registration_number: Yup.string().required(
  //       "Registration number is required"
  //     ),
  //     make: Yup.string().required("Make is required"),
  //     model: Yup.string().required("Model is required"),
  //     abi_insured: Yup.boolean(),
  //     admin_fee_type: Yup.string().required("Admin fee type is required"),
  //     abi_hire_charge_per_day: Yup.number().required(
  //       "ABI hire charge per day is required"
  //     ),
  //     extra_charge_per_day: Yup.number().required(
  //       "Extra charge per day is required"
  //     ),
  //     administration_fee: Yup.number().required(
  //       "Administration fee is required"
  //     ),
  //     bhr_hire_charge_per_day: Yup.number().required(
  //       "BHR hire charge per day is required"
  //     ),
  //     bhr_extra_charge_per_day: Yup.number().required(
  //       "BHR extra charge per day is required"
  //     ),
  //     bhr_administration_fee: Yup.number().required(
  //       "BHR administration fee is required"
  //     ),
  //     cwd_per_day: Yup.number().required("CDW per day is required"),
  //     cwd_charge: Yup.number().required("CDW charge is required"),
  //     collection_and_delivery_fee: Yup.number().required(
  //       "Collection and delivery fee is required"
  //     ),
  //     total_abi_hire_charge: Yup.number().required(
  //       "Total ABI hire charge is required"
  //     ),
  //     total_bhr_charge: Yup.number().required("Total BHR charge is required"),
  //   })
  // ),
});

export interface PanelSolicitorDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}
export interface Address {
  address: string;
  postcode: string;
  mobile_tel: string;
  email: string;
}

export interface Company {
  company_name: string;
  reference: string;
  recommendation_sent: string;
  note: string;
  claim_id: number;
  email_sent_date: string;
  accepted_sent_date: string;
  address: Address;
}

const HireDetails = forwardRef(
  ({ handleNext, skipNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [hireOutDate] = useState<DateValue | null>(today(getLocalTimeZone()));
    const [hireBackDate] = useState<DateValue | null>(null);
    const { isClosed } = useSelector((state: any) => state.isClosed);
    const formikRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [adminFeeType, setAdminFeeType] = useState([]);
    const [adminFeeTypeLoading, setAdminFeeTypeLoading] = useState(false);
    const [clientVehicleCategoryLoading, setClientVehicleCategoryLoading] =
      useState(false);
    const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
    const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
    const [activeVehicleTab, setActiveVehicleTab] = useState(0);
    const [actualVehicleCategoryLoading, setActualVehicleCategoryLoading] =
      useState(false);

    useEffect(() => {
      fetchClientVehicleCategory();
      fetchActualVehicleCategory();
      fetchAdminFeeType();
    }, []);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    const fetchClientVehicleCategory = async () => {
      try {
        const res = await getClientVehicleCategory();
        setClientVehicleCategory(res.data);
      } catch (e) {}
    };

    const fetchActualVehicleCategory = async () => {
      try {
        const res = await getActualVehicleCategory();
        setActualVehicleCategory(res.data);
      } catch (e) {}
    };

    const fetchAdminFeeType = async () => {
      try {
        const res = await getAdminFeeType();
        setAdminFeeType(res.data);
      } catch (e) {}
    };

    const [initialValues, setInitialValues] = useState({
      thirdPartyVehicles: [
        {
          client_vehicle_category: "",
          actual_vehicle_category: "",
          reference: "",
          claim_id: claimID || 0,
          email_sent_date: "",
          accepted_sent_date: "",
          hireOutDate: hireOutDate,
          hireBackDate: hireBackDate,
          no_of_days_hired: 0,
          total_no_of_days_hired: 0,
          vehicle_file_reference: "",
          registration_number: "",
          make: "",
          model: "",
          abi_insured: "",
          admin_fee_type: "",
          hire_vehicle_provided_id: "",
          abi_hire_charge_per_day: "",
          extra_charge_per_day: 5,
          administration_fee: 37,
          bhr_hire_charge_per_day: "",
          bhr_extra_charge_per_day: 5,
          bhr_administration_fee: 60,
          cwd_per_day: 15,
          cwd_charge: 0,
          collection_and_delivery_fee: 60,
          total_abi_hire_charge: 0,
          total_bhr_charge: 0,
        },
      ],
    });

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (!currentClaimId) return;

      setIsLoading(true);
      const loadData = async () => {
        try {
          const providedRes = await getHireProvided(currentClaimId);
          const hireProvided = Array.isArray(providedRes?.data)
            ? providedRes.data
            : [];

          let hireDetails: any[] = [];
          try {
            const detailsRes = await getHireDetails(currentClaimId);
            hireDetails = Array.isArray(detailsRes?.data?.hire_details)
              ? detailsRes.data.hire_details
              : [];
            setIsEditing(true);
          } catch (err) {
            console.warn(
              "⚠️ getHireDetails failed, continuing with empty list:",
              err
            );
          }

          const populatedVehicles = await Promise.all(
            hireProvided.map(async (provItem: any, idx: number) => {
              const matchedDetail = hireDetails[idx] || {};

              const clientLabel =
                matchedDetail.client_vehicle_category_id &&
                clientVehicleCategory.find(
                  (c: any) => c.id === matchedDetail.client_vehicle_category_id
                )?.label;

              const actualLabel =
                matchedDetail.actual_vehicle_category_id &&
                actualVehicleCategory.find(
                  (c: any) => c.id === matchedDetail.actual_vehicle_category_id
                )?.label;

              const adminFeeLabel =
                matchedDetail.admin_fee_id &&
                adminFeeType.find(
                  (c: any) => c.id === matchedDetail.admin_fee_id
                )?.label;

              // Call API for each provItem.id
              let extraData = {};
              if (provItem.id) {
                try {
                  const res = await fetchVehicleExtraData(provItem.id);
                  extraData = res.data || {};
                } catch (err) {
                  console.error(
                    `Failed to fetch extra data for vehicle ${provItem.id}:`,
                    err
                  );
                }
              }

              // Calculate hireOutDate and hireBackDate first
              const hireOutDate = provItem.hire_start_date
                ? parseCalendarDateTimeStamp(provItem.hire_start_date)
                : parseCalendarDateTimeStamp(matchedDetail.hire_out) || null;

              const hireBackDate =
                provItem.hire_end_date != null
                  ? parseCalendarDateTimeStamp(provItem.hire_end_date)
                  : matchedDetail.hire_back
                  ? parseCalendarDateTimeStamp(matchedDetail.hire_back)
                  : null;

              // 🧮 Calculate number of hire days
              let no_of_days_hired = 0;
              if (hireOutDate && hireBackDate) {
                const diffMs =
                  new Date(hireBackDate).getTime() -
                  new Date(hireOutDate).getTime();
                no_of_days_hired = Math.max(
                  Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
                );
              }

              const total_no_of_days_hired = no_of_days_hired;

              return {
                registration_number: provItem.hire_vehicle_registration || "",
                make: provItem.make || matchedDetail.make || "",
                model: provItem.model || matchedDetail.model || "",
                hireOutDate,
                hireBackDate,

                no_of_days_hired,
                total_no_of_days_hired,

                abi_insured: matchedDetail.abi_insurer || false,
                claim_id: matchedDetail.claim_id || currentClaimId,

                client_vehicle_category:
                  matchedDetail.client_vehicle_category_id || "",
                client_vehicle_category_label: clientLabel || "",

                actual_vehicle_category:
                  matchedDetail.actual_vehicle_category_id || "",
                actual_vehicle_category_label: actualLabel || "",

                admin_fee_type: matchedDetail.admin_fee_id || "",
                admin_fee_type_label: adminFeeLabel || "",

                abi_hire_charge_per_day: parseFloat(
                  extraData.abi_hire_charge_per_day || ""
                ),
                extra_charge_per_day: parseFloat(
                  matchedDetail.abi_extra_charges_per_day || 5
                ),
                administration_fee: parseFloat(
                  matchedDetail.abi_administration_fee || 37
                ),

                bhr_hire_charge_per_day: parseFloat(
                  extraData.bhr_hire_per_day || ""
                ),
                bhr_extra_charge_per_day: parseFloat(
                  matchedDetail.bhr_extra_charges_per_day || 5
                ),
                bhr_administration_fee: parseFloat(
                  matchedDetail.bhr_administration_fee || 60
                ),

                cwd_per_day: 15,
                cwd_charge: parseFloat(matchedDetail.cdw_charges || 15),
                // collection_and_delivery_fee: parseFloat(
                //   matchedDetail.collection_delivery_fee || 60
                // ),
                collection_and_delivery_fee: idx === 0 
        ? parseFloat(matchedDetail.collection_delivery_fee || 60)
        : 0,
                total_abi_hire_charge: parseFloat(
                  matchedDetail.total_abi_hire_charge || 0
                ),
                total_bhr_charge: parseFloat(
                  matchedDetail.total_bhr_charges || 0
                ),

                reference: matchedDetail.reference || "",
                hire_vehicle_provided_id: provItem.id,
                vehicle_file_reference:
                  matchedDetail.vehicle_file_reference || "",

                // Merge extra data from API
                ...extraData,
              };
            })
          );

          if (populatedVehicles.length === 0) {
            populatedVehicles.push({
              registration_number: "",
              make: "",
              model: "",
              hireOutDate: null,
              hireBackDate: null,
              no_of_days_hired: 0,
              total_no_of_days_hired: 0,
              abi_insured: false,
              client_vehicle_category: "",
              actual_vehicle_category: "",
              admin_fee_type: "",
              abi_hire_charge_per_day: "",
              extra_charge_per_day: 5,
              administration_fee: 37,
              bhr_hire_charge_per_day: "",
              bhr_extra_charge_per_day: 5,
              bhr_administration_fee: 60,
              cwd_charge: 15,
              collection_and_delivery_fee: 60,
              total_abi_hire_charge: 0,
              total_bhr_charge: 0,
              reference: "",
              vehicle_file_reference: "",
            });
          }

          setInitialValues((prev) => ({
            ...prev,
            thirdPartyVehicles: populatedVehicles,
          }));
        } catch (error) {
          console.error("❌ Failed to fetch hire data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [
      id,
      claimID,
      clientVehicleCategory,
      actualVehicleCategory,
      adminFeeType,
    ]);

    // useEffect(() => {
    // },[])

    useEffect(() => {
      const hireSoFar = calculateHireSoFar(hireOutDate);
      const finalHireDays = calculateFinalHireDays(hireOutDate, hireBackDate);

      setInitialValues((prev) => ({
        ...prev,
        thirdPartyVehicles: prev.thirdPartyVehicles.map((vehicle, index) =>
          index === 0
            ? {
                ...vehicle,
                no_of_days_hired: hireSoFar,
                total_no_of_days_hired: finalHireDays,
              }
            : vehicle
        ),
      }));
    }, [hireOutDate, hireBackDate]);

    // useEffect(() => {
    //   const firstVehicle = initialValues.thirdPartyVehicles[0];
    //   const abiTotal = calculateTotalABIHireCharges(
    //     firstVehicle.abi_hire_charge_per_day,
    //     firstVehicle.extra_charge_per_day,
    //     firstVehicle.no_of_days_hired,
    //     firstVehicle.administration_fee
    //   );

    //   const cwdTotal = calculateCDWCharges(
    //     firstVehicle.cwd_per_day,
    //     firstVehicle.no_of_days_hired
    //   );

    //   const bhrTotal = calculateTotalBHRCharges(
    //     firstVehicle.bhr_hire_charge_per_day,
    //     firstVehicle.bhr_extra_charge_per_day,
    //     firstVehicle.no_of_days_hired,
    //     firstVehicle.bhr_administration_fee,
    //     firstVehicle.cwd_per_day !== undefined && firstVehicle.cwd_per_day,
    //     firstVehicle.collection_and_delivery_fee
    //   );

    //   if (
    //     firstVehicle.total_abi_hire_charge !== abiTotal ||
    //     firstVehicle.cwd_charge !== cwdTotal ||
    //     firstVehicle.total_bhr_charge !== bhrTotal
    //   ) {
    //     setInitialValues((prev) => ({
    //       ...prev,
    //       thirdPartyVehicles: prev.thirdPartyVehicles.map((vehicle, index) =>
    //         index === 0
    //           ? {
    //               ...vehicle,
    //               total_abi_hire_charge: abiTotal,
    //               cwd_charge: cwdTotal,
    //               total_bhr_charge: bhrTotal,
    //             }
    //           : vehicle
    //       ),
    //     }));
    //   }
    // }, [initialValues]);

    useEffect(() => {
      // Calculate totals for ALL vehicles, not just the first one
      const updatedVehicles = initialValues.thirdPartyVehicles.map(
        (vehicle, index) => {
          const abiTotal = calculateTotalABIHireCharges(
            vehicle.abi_hire_charge_per_day,
            vehicle.extra_charge_per_day,
            vehicle.no_of_days_hired,
            vehicle.administration_fee,
            index
          );

          const cwdTotal = calculateCDWCharges(
            vehicle.cwd_per_day,
            vehicle.no_of_days_hired,
            "hire_out"
          );

          const bhrTotal = calculateTotalBHRCharges(
            vehicle.bhr_hire_charge_per_day,
            vehicle.bhr_extra_charge_per_day,
            vehicle.no_of_days_hired,
            vehicle.bhr_administration_fee,
            vehicle.cwd_per_day !== undefined && vehicle.cwd_per_day,
            vehicle.collection_and_delivery_fee,
            index
          );

          return {
            ...vehicle,
            total_abi_hire_charge: abiTotal,
            cwd_charge: cwdTotal,
            total_bhr_charge: bhrTotal,
          };
        }
      );

      // Check if we need to update the state
      const shouldUpdate = updatedVehicles.some(
        (vehicle, index) =>
          vehicle.total_abi_hire_charge !==
            initialValues.thirdPartyVehicles[index]?.total_abi_hire_charge ||
          vehicle.cwd_charge !==
            initialValues.thirdPartyVehicles[index]?.cwd_charge ||
          vehicle.total_bhr_charge !==
            initialValues.thirdPartyVehicles[index]?.total_bhr_charge
      );

      if (shouldUpdate) {
        setInitialValues((prev) => ({
          ...prev,
          thirdPartyVehicles: updatedVehicles,
        }));
      }
    }, [initialValues]);

    // Add this function alongside the other calculation functions
    const calculateDaysToCharge = (
      hireOutDate: DateValue | null,
      hireBackDate: DateValue | null
    ): number => {
      if (!hireOutDate) return 0;

      const hireOut = new Date(hireOutDate.toString());
      const today = new Date();
      const endDate = hireBackDate ? new Date(hireBackDate.toString()) : today;

      hireOut.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const effectiveEnd = endDate < today ? endDate : today;
      const timeDiff = effectiveEnd.getTime() - hireOut.getTime();
      const days = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

      return Math.max(0, days);
    };

    const calculateHireSoFar = (hireOutDate: DateValue | null): number => {
      if (!hireOutDate) return 0;

      const today = new Date();
      const hireOut = new Date(hireOutDate.toString());

      today.setHours(0, 0, 0, 0);
      hireOut.setHours(0, 0, 0, 0);

      const timeDiff = today.getTime() - hireOut.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
      return Math.max(0, daysDiff);
    };

    const calculateFinalHireDays = (
      hireOutDate: DateValue | null,
      hireBackDate: DateValue | null
    ): number => {
      if (!hireOutDate || !hireBackDate) return 0;

      const hireOut = new Date(hireOutDate.toString());
      const hireBack = new Date(hireBackDate.toString());

      hireOut.setHours(0, 0, 0, 0);
      hireBack.setHours(0, 0, 0, 0);

      const timeDiff = hireBack.getTime() - hireOut.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

      return Math.max(0, daysDiff);
    };

    const calculateTotalABIHireCharges = (
      abiHireChargePerDay: number,
      extraChargePerDay: number,
      hireDays: number,
      administrationFee: number,
      vehicleIndex: number = 0
    ): number => {
      const result =
        (abiHireChargePerDay + extraChargePerDay) * hireDays +
        administrationFee;
      return result;
    };

    const calculateCDWCharges = (
      cwdPerDay: number,
      hireDays: number,
      type: string
    ): number => {
      const result = 15 * hireDays;
      return result;
    };

    const calculateTotalBHRCharges = (
      bhrHireChargePerDay: number,
      bhrExtraChargePerDay: number,
      hireDays: number,
      bhrAdministrationFee: number,
      cwdPerDay: number,
      collectionDeliveryFee: number,
      vehicleIndex: number = 0
    ): number => {
      const dailyBHRCharges =
        (bhrHireChargePerDay + bhrExtraChargePerDay) * hireDays;
      const effectiveCollectionFee = vehicleIndex === 0 ? collectionDeliveryFee : 0;

      const totalCharges =
        dailyBHRCharges +
        bhrAdministrationFee +
        cwdPerDay * hireDays +
        collectionDeliveryFee;

      return totalCharges;
    };

    const formatDate = (val: string | Date | null) => {
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString().split("T")[0];
    };

    // const handleSubmit = async (values: any) => {
    //   try {
    //     const storedClaimId = claimID || id;
    //     const hireDetailsPayload = values.thirdPartyVehicles.map((vehicle) => ({

    //       hire_out: formatDate(vehicle.hireOutDate),
    //       hire_back: formatDate(vehicle.hireBackDate),

    //       no_of_days_hire_so_far: vehicle.no_of_days_hired || 0,
    //       final_total_no_of_hire_days: vehicle.total_no_of_days_hired || 0,

    //       vehicle_file_reference: vehicle.vehicle_file_reference || "",
    //       registration_number: vehicle.registration_number || "",
    //       make: vehicle.make || "",
    //       model: vehicle.model || "",
    //       abi_insurer: vehicle.abi_insured === "Yes" || vehicle.abi_insured === true ? true : false,

    //       abi_extra_charges_per_day: vehicle.extra_charge_per_day || "",
    //       admin_fee_id: vehicle.admin_fee_type || null,
    //       abi_administration_fee: vehicle.administration_fee || 0,
    //       total_abi_hire_charge: vehicle.total_abi_hire_charge || 0,

    //       bhr_extra_charges_per_day: vehicle.bhr_extra_charge_per_day || "",
    //       bhr_administration_fee: vehicle.bhr_administration_fee || 0,
    //       cdw_charges: vehicle.cwd_charge || 0,
    //       collection_delivery_fee: vehicle.collection_and_delivery_fee || 0,
    //       total_bhr_charges: vehicle.total_bhr_charge || 0,
    //       hire_vehicle_provided_id: vehicle?.hire_vehicle_provided_id,
    //       claim_id: storedClaimId || 0,
    //     }));

    //     const payload = {
    //       hire_details: hireDetailsPayload,
    //     };

    //     if (storedClaimId && isEditing) {
    //       await updateHireDetails(payload, storedClaimId);
    //     } else {
    //       await createHireDetails(payload);
    //     }

    //     toast.success("Hire Details saved successfully");

    //     if (handleNext && !skipNext) {
    //       handleNext(17, "next");
    //     }
    //   } catch (error: any) {
    //     toast.error("Unable to save hire details");
    //     console.error("Error submitting form:", error);
    //   }
    // };

    const handleSubmit = async (values: any) => {
      try {
        const storedClaimId = claimID || id;

        const hireDetailsPayload = values.thirdPartyVehicles.map(
          (vehicle, index) => {
            const collectionFee = index === 0 
          ? parseFloat(vehicle.collection_and_delivery_fee) || 0 
          : 0;
            // Calculate days to charge for each vehicle
            const daysToCharge = vehicle.no_of_days_hired || 0;
            const finalHireDays = vehicle.total_no_of_days_hired || 0;

            // Calculate ABI total charge for each vehicle
            const abiTotal = calculateTotalABIHireCharges(
              parseFloat(vehicle.abi_hire_charge_per_day) || 0,
              parseFloat(vehicle.extra_charge_per_day) || 0,
              finalHireDays,
              parseFloat(vehicle.administration_fee) || 0,
              index
            );

            // Calculate CDW charge for each vehicle
            const cwdTotal = calculateCDWCharges(
              parseFloat(vehicle.cwd_per_day) || 15,
              finalHireDays,
              "hire_back"
            );

            // Calculate BHR total charge for each vehicle
            const bhrTotal = calculateTotalBHRCharges(
              parseFloat(vehicle.bhr_hire_charge_per_day) || 0,
              parseFloat(vehicle.bhr_extra_charge_per_day) || 0,
              finalHireDays,
              parseFloat(vehicle.bhr_administration_fee) || 0,
              parseFloat(vehicle.cwd_per_day) || 15,
              // parseFloat(vehicle.collection_and_delivery_fee) || 0,
              collectionFee,
              index
            );

            return {
              hire_out: formatDate(vehicle.hireOutDate),
              hire_back: formatDate(vehicle.hireBackDate),

              no_of_days_hire_so_far: daysToCharge,
              final_total_no_of_hire_days: finalHireDays,

              vehicle_file_reference: vehicle.vehicle_file_reference || "",
              registration_number: vehicle.registration_number || "",
              make: vehicle.make || "",
              model: vehicle.model || "",
              abi_insurer:
                vehicle.abi_insured === "Yes" || vehicle.abi_insured === true
                  ? true
                  : false,

              // ABI charges
              abi_extra_charges_per_day: vehicle.extra_charge_per_day || 0,
              admin_fee_id: vehicle.admin_fee_type || null,
              abi_administration_fee: vehicle.administration_fee || 0,
              total_abi_hire_charge: abiTotal || 0,

              // BHR charges
              bhr_extra_charges_per_day: vehicle.bhr_extra_charge_per_day || 0,
              bhr_administration_fee: vehicle.bhr_administration_fee || 0,
              cdw_charges: cwdTotal || 0,
              // collection_delivery_fee: vehicle.collection_and_delivery_fee || 0,
              collection_delivery_fee: collectionFee,
              total_bhr_charges: bhrTotal || 0,

              // Vehicle category references
              client_vehicle_category_id:
                vehicle.client_vehicle_category || null,
              actual_vehicle_category_id:
                vehicle.actual_vehicle_category || null,

              hire_vehicle_provided_id: vehicle?.hire_vehicle_provided_id,
              claim_id: storedClaimId || 0,
            };
          }
        );

        const payload = {
          hire_details: hireDetailsPayload,
        };

        console.log("Submitting payload:", payload); // For debugging

        if (storedClaimId && isEditing) {
          await updateHireDetails(payload, storedClaimId);
        } else {
          await createHireDetails(payload);
        }

        toast.success("Hire Details saved successfully");

        if (handleNext && !skipNext) {
          handleNext(17, "next");
        }
      } catch (error: any) {
        toast.error("Unable to save hire details");
        console.error("Error submitting form:", error);
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

    if (isLoading) {
      return (
        <div className={`flex justify-center items-center h-screen bg-gray-50`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          innerRef={formikRef}
          enableReinitialize
        >
          {({ values, setFieldValue }: any) => {
            const handleSelect = (
              company: any,
              vehicleIndex: number = 0,
              type: "client" | "actual" | "adminFee"
            ) => {
              if (!company) return;

              // Extract safe numeric values
              const abiRate = parseFloat(company.abi_rate ?? 0);
              const bhrRate = parseFloat(company.bhr_rate ?? 0);
              const id = company.id ?? 0;
              const label = company.label ?? "";

              // Client Vehicle Category Selection
              if (type === "client") {
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.client_vehicle_category`,
                  id
                );
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.client_vehicle_category_label`,
                  label
                );

                const currentActualCategory =
                  formikRef?.current?.values?.thirdPartyVehicles?.[vehicleIndex]
                    ?.actual_vehicle_category;

                // If actual category not selected yet → default it to same as client
                if (!currentActualCategory) {
                  setFieldValue(
                    `thirdPartyVehicles.${vehicleIndex}.actual_vehicle_category`,
                    id
                  );
                  setFieldValue(
                    `thirdPartyVehicles.${vehicleIndex}.actual_vehicle_category_label`,
                    label
                  );
                }

                // Always update hire charge rates for the selected vehicle tab
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.abi_hire_charge_per_day`,
                  abiRate
                );
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.bhr_hire_charge_per_day`,
                  bhrRate
                );

                // REMOVED: No longer globally filter clientVehicleCategory here.
                // Instead, we'll filter per-dropdown below.
              }

              // Actual Vehicle Category Selection
              else if (type === "actual") {
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.actual_vehicle_category`,
                  id
                );
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.actual_vehicle_category_label`,
                  label
                );

                // Update hire charge rates based on the selected category
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.abi_hire_charge_per_day`,
                  abiRate
                );
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.bhr_hire_charge_per_day`,
                  bhrRate
                );
              }

              // Admin Fee Type Selection
              else if (type === "adminFee") {
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.admin_fee_type`,
                  id
                );
                setFieldValue(
                  `thirdPartyVehicles.${vehicleIndex}.admin_fee_type_label`,
                  label
                );
              }
            };

            return (
              <>
                <div className="mt-4">
                  <h2 className="text-lg font-semibold  mb-2 sm:text-xl">
                    Hire Details
                  </h2>
                  <p className="pb-5 text-lightGray text-sm font-normal">
                    Enter details for Hire Details
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  {values.thirdPartyVehicles.map((_: any, idx: number) => {
                    console.log(_, "_____");
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveVehicleTab(idx)}
                        className={`text-sm cursor-pointer px-0 py-2 transition-colors
        ${
          activeVehicleTab === idx
            ? "text-custom underline decoration-2 decoration-custom underline-offset-[24px]"
            : "text-stormGray"
        }`}
                      >
                        <>
                          Vehicle{" "}
                          <span className="font-semibold">
                            {values.thirdPartyVehicles?.[idx]
                              ?.registration_number ||
                              (values.thirdPartyVehicles.length === 1
                                ? ""
                                : idx + 1)}
                          </span>
                        </>
                      </button>
                    );
                  })}
                </div>

                <FieldArray name="thirdPartyVehicles">
                  {({ remove, push }) => (
                    <div>
                      {values.thirdPartyVehicles.map(
                        (_v: any, index: number) => {
                          if (index !== activeVehicleTab) return null;
                          return (
                            <div key={index} className="my-2 rounded">
                              <div className="flex justify-between items-center my-5">
                                {/* {index === 1 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                  >
                                    <span>Remove Vehicle</span>
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                )} */}
                              </div>

                              {/* Hire Period */}
                              <div className="border-b border-cloudGray my-5">
                                <h2 className="text-secondary text-lg font-semibold">
                                  Hire Period
                                </h2>
                                <p className="pb-5 text-lightGray text-sm font-normal">
                                  Enter details for Hire Period
                                </p>
                              </div>
                              <form className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.hireOutDate`}
                                    >
                                      Hire Out Date
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="w-full">
                                      <Field
                                        name={`thirdPartyVehicles.${index}.hireOutDate`}
                                      >
                                        {({ form }: any) => (
                                          <DatePicker
                                            isDisabled={isClosed}
                                            value={
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.hireOutDate || hireOutDate
                                            }
                                            onChange={(newDate) => {
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.hireOutDate`,
                                                newDate
                                              );
                                              // Auto-calculate hire days
                                              const hireSoFar =
                                                calculateHireSoFar(newDate);
                                              const currentHireBackDate =
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.hireBackDate || hireBackDate;
                                              const finalHireDays =
                                                calculateFinalHireDays(
                                                  newDate,
                                                  currentHireBackDate
                                                );
                                              const daysToCharge =
                                                calculateDaysToCharge(
                                                  newDate,
                                                  currentHireBackDate
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.no_of_days_hired`,
                                                hireSoFar
                                              );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_no_of_days_hired`,
                                                finalHireDays
                                              );

                                              // Trigger ABI total calculation
                                              const abiTotal =
                                                calculateTotalABIHireCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.abi_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.extra_charge_per_day
                                                  ) || 0,
                                                  daysToCharge,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]?.administration_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                                abiTotal
                                              );

                                              // Trigger CDW total calculation
                                              const cwdTotal =
                                                calculateCDWCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  daysToCharge,
                                                  "hire_out"
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.cwd_charge`,
                                                cwdTotal
                                              );

                                              // Trigger BHR total calculation
                                              const bhrTotal =
                                                calculateTotalBHRCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_extra_charge_per_day
                                                  ) || 0,
                                                  daysToCharge,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_administration_fee
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.collection_and_delivery_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                bhrTotal
                                              );
                                            }}
                                            className="w-full"
                                          />
                                        )}
                                      </Field>
                                    </div>
                                  </div>

                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.hireBackDate`}
                                    >
                                      Hire Back Date
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="w-full">
                                      <Field
                                        name={`thirdPartyVehicles.${index}.hireBackDate`}
                                      >
                                        {({ form }: any) => (
                                          <DatePicker
                                            isDisabled={isClosed}
                                            value={
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.hireBackDate || hireBackDate
                                            }
                                            onChange={(newDate) => {
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.hireBackDate`,
                                                newDate
                                              );
                                              // Auto-calculate final hire days
                                              const currentHireOutDate =
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.hireOutDate || hireOutDate;
                                              const finalHireDays =
                                                calculateFinalHireDays(
                                                  currentHireOutDate,
                                                  newDate
                                                );
                                              const hireSoFar =
                                                calculateHireSoFar(
                                                  currentHireOutDate
                                                );
                                              const daysToCharge =
                                                calculateDaysToCharge(
                                                  currentHireOutDate,
                                                  newDate
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_no_of_days_hired`,
                                                finalHireDays
                                              );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.no_of_days_hired`,
                                                hireSoFar
                                              );

                                              // Trigger ABI total calculation
                                              const abiTotal =
                                                calculateTotalABIHireCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.abi_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.extra_charge_per_day
                                                  ) || 0,
                                                  finalHireDays,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]?.administration_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                                abiTotal
                                              );

                                              // Trigger CDW total calculation
                                              const cwdTotal =
                                                calculateCDWCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  finalHireDays,
                                                  "hire_back"
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.cwd_charge`,
                                                cwdTotal
                                              );
                                              // Trigger BHR total calculation
                                              const bhrTotal =
                                                calculateTotalBHRCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_extra_charge_per_day
                                                  ) || 0,
                                                  finalHireDays,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_administration_fee
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.collection_and_delivery_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                bhrTotal
                                              );
                                            }}
                                            className="w-full"
                                          />
                                        )}
                                      </Field>
                                    </div>
                                  </div>
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.no_of_days_hired`}
                                    >
                                      Hire So Far
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.no_of_days_hired`}
                                    >
                                      {({ form }: any) => (
                                        <input
                                          type="text"
                                          value={
                                            form.values.thirdPartyVehicles[
                                              index
                                            ]?.total_no_of_days_hired || 0
                                          }
                                          readOnly
                                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-sm sm:text-base cursor-not-allowed"
                                          style={{ height: "44px" }}
                                        />
                                      )}
                                    </Field>
                                    <ErrorMessage
                                      name={`thirdPartyVehicles.${index}.no_of_days_hired`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.total_no_of_days_hired`}
                                    >
                                      Final Hire Days
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.total_no_of_days_hired`}
                                    >
                                      {({ form }: any) => (
                                        <input
                                          type="text"
                                          value={
                                            form.values.thirdPartyVehicles[
                                              index
                                            ]?.total_no_of_days_hired || 0
                                          }
                                          readOnly
                                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-sm sm:text-base cursor-not-allowed"
                                          style={{ height: "44px" }}
                                        />
                                      )}
                                    </Field>
                                    <ErrorMessage
                                      name={`thirdPartyVehicles.${index}.total_no_of_days_hired`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="col-span-3 lg:col-span-1" />
                                </div>
                                <div className="mt-8 border-t border-cloudGray" />
                              </form>
                              {/* Hire Vehicle Provided  */}

                              {/* <div className="border-b border-cloudGray my-5">
                                <h2 className="text-secondary text-lg font-semibold">
                                  Hire Vehicle Provided
                                </h2>
                                <p className="pb-5 text-lightGray text-sm font-normal">
                                  Enter details for Hire Vehicle Provided{" "}
                                </p>
                              </div>
                              <form className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.vehicle_file_reference`}
                                    >
                                      Vehicle File Reference
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.vehicle_file_reference`}
                                      type="text"
                                      style={{ height: "44px" }}
                                      disabled={isClosed}
                                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                    />
                                    <ErrorMessage
                                      name={`thirdPartyVehicles.${index}.vehicle_file_reference`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.registration_number`}
                                    >
                                      Registration Number
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.registration_number`}
                                      type="text"
                                      style={{ height: "44px" }}
                                      disabled={isClosed}
                                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                    />
                                    <ErrorMessage
                                      name={`thirdPartyVehicles.${index}.registration_number`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.make`}
                                    >
                                      Make
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.make`}
                                      type="text"
                                      style={{ height: "44px" }}
                                      disabled={isClosed}
                                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                    />
                                    <ErrorMessage
                                      name={`thirdPartyVehicles.${index}.make`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.model`}
                                    >
                                      Model
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.model`}
                                      type="text"
                                      style={{ height: "44px" }}
                                      disabled={isClosed}
                                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                    />
                                    <ErrorMessage
                                      name={`thirdPartyVehicles.${index}.model`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  <div className="col-span-3 lg:col-span-1" />
                                </div>
                                <div className="mt-8 border-t border-cloudGray" />
                              </form> */}

                              <div className="border-b border-cloudGray my-5">
                                <h2 className="text-secondary text-lg font-semibold">
                                  ABI Hire Charges & Administration Fee Details
                                </h2>
                                <p className="pb-5 text-lightGray text-sm font-normal">
                                  Enter details for ABI Hire Charges &
                                  Administration Fee Details
                                </p>
                              </div>
                              <form className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.abi_insured`}
                                    >
                                      ABI Insurer
                                    </Label>
                                  </div>
                                  <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                                    <label className="flex items-center">
                                      <Field
                                        type="checkbox"
                                        name={`thirdPartyVehicles.${index}.abi_insured`}
                                        disabled={isClosed}
                                        className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">
                                        Yes
                                      </span>
                                    </label>
                                  </div>

                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.abi_hire_charge_per_day`}
                                    >
                                      ABI Hire Charge Per Day
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.abi_hire_charge_per_day`}
                                      >
                                        {({ field, form }: any) => {
                                          const handleChange = (
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const inputValue = e.target.value;

                                            // Allow empty string to let the user clear the field
                                            if (inputValue === "") {
                                              form.setFieldValue(
                                                field.name,
                                                ""
                                              );
                                              return;
                                            }

                                            // Regex: allow only numbers with up to 2 decimal places
                                            const validPattern =
                                              /^\d+(\.\d{0,2})?$/;

                                            if (validPattern.test(inputValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                inputValue
                                              );

                                              // Trigger ABI total calculation
                                              const abiTotal =
                                                calculateTotalABIHireCharges(
                                                  parseFloat(inputValue) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.extra_charge_per_day
                                                  ) || 0,
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.no_of_days_hired || 0,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]?.administration_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                                abiTotal
                                              );
                                            }
                                          };

                                          return (
                                            <input
                                              {...field}
                                              type="number"
                                              step="0.01"
                                              placeholder="0.00"
                                              disabled={isClosed}
                                              inputMode="decimal"
                                              className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:outline-none"
                                              value={
                                                field.value !== undefined &&
                                                field.value !== null &&
                                                field.value !== ""
                                                  ? parseFloat(
                                                      field.value
                                                    ).toFixed(2)
                                                  : ""
                                              }
                                              onChange={handleChange}
                                            />
                                          );
                                        }}
                                      </Field>
                                      {/* 
                                      <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  {/* Extra Charge Per Day */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.extra_charge_per_day`}
                                    >
                                      Extra Charge Per Day
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.extra_charge_per_day`}
                                      >
                                        {({ field, form }: any) => {
                                          const handleChange = (
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const inputValue = e.target.value;

                                            // Allow empty string to let the user clear the field
                                            if (inputValue === "") {
                                              form.setFieldValue(
                                                field.name,
                                                ""
                                              );
                                              return;
                                            }

                                            // Regex: allow only numbers with up to 2 decimal places
                                            const validPattern =
                                              /^\d+(\.\d{0,2})?$/;

                                            if (validPattern.test(inputValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                inputValue
                                              );

                                              // Trigger ABI total calculation
                                              const abiTotal =
                                                calculateTotalABIHireCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.abi_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(inputValue) || 0,
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.no_of_days_hired || 0,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]?.administration_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                                abiTotal
                                              );
                                            }
                                          };

                                          return (
                                            <input
                                              {...field}
                                              type="number"
                                              step="0.01"
                                              disabled={isClosed}
                                              inputMode="decimal"
                                              placeholder="0.00"
                                              className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:outline-none"
                                              value={
                                                field.value !== undefined &&
                                                field.value !== null &&
                                                field.value !== ""
                                                  ? parseFloat(
                                                      field.value
                                                    ).toFixed(2)
                                                  : "0.00"
                                              }
                                              onChange={handleChange}
                                            />
                                          );
                                        }}
                                      </Field>

                                      {/* <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  {/* Admin Fee Type */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.admin_fee_type`}
                                    >
                                      Admin Fee Type
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.admin_fee_type`}
                                    >
                                      {({ form }: any) => {
                                        const options = adminFeeType.map(
                                          (c: any) => ({
                                            value: c.id,
                                            label: c.label,
                                          })
                                        );

                                        return (
                                          <>
                                            <CustomSelect
                                              key={`admin_fee_type_${index}`}
                                              options={options}
                                              value={
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.admin_fee_type
                                                  ? {
                                                      value:
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ].admin_fee_type,
                                                      label:
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ].admin_fee_type_label,
                                                    }
                                                  : null
                                              }
                                              onInputChange={(
                                                inputValue: any
                                              ) => {
                                                if (inputValue) {
                                                  fetchAdminFeeType(inputValue);
                                                }
                                              }}
                                              onChange={(option) => {
                                                if (option) {
                                                  form.setFieldValue(
                                                    `thirdPartyVehicles.${index}.admin_fee_type`,
                                                    option.value
                                                  );
                                                  form.setFieldValue(
                                                    `thirdPartyVehicles.${index}.admin_fee_type_label`,
                                                    option.label
                                                  );

                                                  const selectedCompany =
                                                    adminFeeType.find(
                                                      (c: any) =>
                                                        c.id === option.value
                                                    );
                                                  if (selectedCompany) {
                                                    handleSelect(
                                                      selectedCompany,
                                                      index,
                                                      "adminFee"
                                                    );
                                                  }
                                                } else {
                                                  form.setFieldValue(
                                                    `thirdPartyVehicles.${index}.admin_fee_type`,
                                                    ""
                                                  );
                                                  form.setFieldValue(
                                                    `thirdPartyVehicles.${index}.admin_fee_type_label`,
                                                    ""
                                                  );
                                                }
                                              }}
                                              placeholder="Type admin fee type"
                                              disabled={isClosed}
                                            />

                                            {adminFeeTypeLoading && (
                                              <div className="absolute right-3 top-2 text-gray-400 text-sm">
                                                Loading...
                                              </div>
                                            )}
                                          </>
                                        );
                                      }}
                                    </Field>
                                  </div>

                                  {/* Administration Fee - Only show for first vehicle (index 0) */}
                                  {index === 0 && (
                                    <>
                                      <div className="col-span-3 lg:col-span-1">
                                        <Label
                                          htmlFor={`thirdPartyVehicles.${index}.administration_fee`}
                                        >
                                          Administration Fee
                                        </Label>
                                      </div>
                                      <div className="col-span-3 lg:col-span-2">
                                        <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                          <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                            <span className="text-sm sm:text-base">
                                              £
                                            </span>
                                          </div>
                                          <Field
                                            name={`thirdPartyVehicles.${index}.administration_fee`}
                                          >
                                            {({ field, form }: any) => {
                                              const handleChange = (
                                                e: React.ChangeEvent<HTMLInputElement>
                                              ) => {
                                                const inputValue =
                                                  e.target.value;

                                                // Allow empty string to let the user clear the field
                                                if (inputValue === "") {
                                                  form.setFieldValue(
                                                    field.name,
                                                    ""
                                                  );
                                                  return;
                                                }

                                                // Regex: allow only numbers with up to 2 decimal places
                                                const validPattern =
                                                  /^\d+(\.\d{0,2})?$/;

                                                if (
                                                  validPattern.test(inputValue)
                                                ) {
                                                  form.setFieldValue(
                                                    field.name,
                                                    inputValue
                                                  );

                                                  // Trigger ABI total calculation
                                                  const abiTotal =
                                                    calculateTotalABIHireCharges(
                                                      parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.abi_hire_charge_per_day
                                                      ) || 0,
                                                      parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]?.extra_charge_per_day
                                                      ) || 0,
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.no_of_days_hired || 0,
                                                      parseFloat(inputValue) ||
                                                        0
                                                    );
                                                  form.setFieldValue(
                                                    `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                                    abiTotal
                                                  );
                                                }
                                              };

                                              return (
                                                <input
                                                  {...field}
                                                  type="number"
                                                  step="0.01"
                                                  disabled={isClosed}
                                                  inputMode="decimal"
                                                  placeholder="0.00"
                                                  className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:outline-none"
                                                  value={
                                                    field.value !== undefined &&
                                                    field.value !== null &&
                                                    field.value !== ""
                                                      ? parseFloat(
                                                          field.value
                                                        ).toFixed(2)
                                                      : "0.00"
                                                  }
                                                  onChange={handleChange}
                                                />
                                              );
                                            }}
                                          </Field>

                                          {/* <div className="relative w-[110px] sm:w-[130px]">
                                            <select
                                              disabled={isClosed}
                                              className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                            >
                                              <option>GBP</option>
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                          </div> */}
                                        </div>
                                        {/* {getFieldError("salvageAmount", formik)} */}
                                      </div>
                                    </>
                                  )}

                                  {/*Total ABI Hire Charge */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.total_abi_hire_charge`}
                                    >
                                      Total ABI Hire Charge
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-gray-100 h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg ">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.total_abi_hire_charge`}
                                      >
                                        {({ field }: any) => (
                                          <input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            disabled={true}
                                            readOnly={true}
                                            placeholder="0.00"
                                            className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none bg-gray-100"
                                            value={
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
                                            }
                                          />
                                        )}
                                      </Field>

                                      {/* <div className="relative w-[110px] sm:w-[130px] ">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-gray-100 appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  <div className="col-span-3 lg:col-span-1" />
                                </div>
                                <div className="mt-8 border-t border-cloudGray" />
                              </form>

                              {/* ABI hire  */}
                              <div className="border-b border-cloudGray my-5">
                                <h2 className="text-secondary text-lg font-semibold">
                                  Total BHR Hire Charges & Administration Fee
                                  Details
                                </h2>
                                <p className="pb-5 text-lightGray text-sm font-normal">
                                  Enter details for BHR Hire Charges &
                                  Administration Fee Details
                                </p>
                              </div>
                              <form className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  {/* BHR Hire Charge Per Day */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.bhr_hire_charge_per_day`}
                                    >
                                      BHR Hire Charge Per Day
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border  border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                        <span className="text-sm sm:text-base ">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.bhr_hire_charge_per_day`}
                                      >
                                        {({ field, form }: any) => {
                                          const handleChange = (
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const inputValue = e.target.value;

                                            // Allow empty string to let the user clear the field
                                            if (inputValue === "") {
                                              form.setFieldValue(
                                                field.name,
                                                ""
                                              );
                                              return;
                                            }

                                            // Regex: allow only numbers with up to 2 decimal places
                                            const validPattern =
                                              /^\d+(\.\d{0,2})?$/;

                                            if (validPattern.test(inputValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                inputValue
                                              );

                                              // Trigger BHR total calculation
                                              const bhrTotal =
                                                calculateTotalBHRCharges(
                                                  parseFloat(inputValue) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_extra_charge_per_day
                                                  ) || 0,
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.no_of_days_hired || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_administration_fee
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.collection_and_delivery_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                bhrTotal
                                              );
                                            }
                                          };

                                          return (
                                            <input
                                              {...field}
                                              type="number"
                                              step="0.01"
                                              disabled={isClosed}
                                              placeholder="0.00"
                                              inputMode="decimal"
                                              className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none"
                                              value={
                                                field.value !== undefined &&
                                                field.value !== null &&
                                                field.value !== ""
                                                  ? parseFloat(
                                                      field.value
                                                    ).toFixed(2)
                                                  : ""
                                              }
                                              onChange={handleChange}
                                            />
                                          );
                                        }}
                                      </Field>

                                      {/* <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  {/* BHR Extra Charge Per Day */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.bhr_extra_charge_per_day`}
                                    >
                                      BHR Extra Charge Per Day
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.bhr_extra_charge_per_day`}
                                      >
                                        {({ field, form }: any) => {
                                          const handleChange = (
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const inputValue = e.target.value;

                                            // Allow empty string to let the user clear the field
                                            if (inputValue === "") {
                                              form.setFieldValue(
                                                field.name,
                                                ""
                                              );
                                              return;
                                            }

                                            // Regex: allow only numbers with up to 2 decimal places
                                            const validPattern =
                                              /^\d+(\.\d{0,2})?$/;

                                            if (validPattern.test(inputValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                inputValue
                                              );

                                              // Trigger BHR total calculation
                                              const bhrTotal =
                                                calculateTotalBHRCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(inputValue) || 0,
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.no_of_days_hired || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_administration_fee
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.collection_and_delivery_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                bhrTotal
                                              );
                                            }
                                          };

                                          return (
                                            <input
                                              {...field}
                                              type="number"
                                              step="0.01"
                                              disabled={isClosed}
                                              inputMode="decimal"
                                              placeholder="0.00"
                                              className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none"
                                              value={
                                                field.value !== undefined &&
                                                field.value !== null &&
                                                field.value !== ""
                                                  ? parseFloat(
                                                      field.value
                                                    ).toFixed(2)
                                                  : "0.00"
                                              }
                                              onChange={handleChange}
                                            />
                                          );
                                        }}
                                      </Field>

                                      {/* <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  {/* BHR Administration Fee */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.bhr_administration_fee`}
                                    >
                                      BHR Administration Fee
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.bhr_administration_fee`}
                                      >
                                        {({ field, form }: any) => {
                                          const handleChange = (
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const inputValue = e.target.value;

                                            // Allow empty string to let the user clear the field
                                            if (inputValue === "") {
                                              form.setFieldValue(
                                                field.name,
                                                ""
                                              );
                                              return;
                                            }

                                            // Regex: allow only numbers with up to 2 decimal places
                                            const validPattern =
                                              /^\d+(\.\d{0,2})?$/;

                                            if (validPattern.test(inputValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                inputValue
                                              );

                                              // Trigger BHR total calculation
                                              const bhrTotal =
                                                calculateTotalBHRCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_extra_charge_per_day
                                                  ) || 0,
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.no_of_days_hired || 0,
                                                  parseFloat(inputValue) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.cwd_per_day
                                                  ) || 15,
                                                  index === 0
                                                    ? parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.collection_and_delivery_fee
                                                      ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                bhrTotal
                                              );
                                            }
                                          };

                                          return (
                                            <input
                                              {...field}
                                              type="number"
                                              step="0.01"
                                              disabled={isClosed}
                                              inputMode="decimal"
                                              placeholder="0.00"
                                              className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none"
                                              value={
                                                field.value !== undefined &&
                                                field.value !== null &&
                                                field.value !== ""
                                                  ? parseFloat(
                                                      field.value
                                                    ).toFixed(2)
                                                  : "0.00"
                                              }
                                              onChange={handleChange}
                                            />
                                          );
                                        }}
                                      </Field>
                                      {/* <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  {/*CDW Per Day */}
                                  {/* <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.cwd_per_day`}
                                    >
                                      CDW Per Day
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.cwd_per_day`}
                                      >
                                        {({ field, form }: any) => {
                                          const handleChange = (
                                            e: React.ChangeEvent<HTMLInputElement>
                                          ) => {
                                            const inputValue = e.target.value;

                                            // Allow empty string to let the user clear the field
                                            if (inputValue === "") {
                                              form.setFieldValue(field.name, "");
                                              return;
                                            }

                                            // Regex: allow only numbers with up to 2 decimal places
                                            const validPattern =
                                              /^\d+(\.\d{0,2})?$/;

                                            if (validPattern.test(inputValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                inputValue
                                              );

                                              // Trigger CDW total calculation
                                              const cwdTotal =
                                                calculateCDWCharges(
                                                  parseFloat(inputValue) || 15,
                                                  form.values.thirdPartyVehicles[
                                                    index
                                                  ]?.no_of_days_hired || 0, "cwd_per_day"
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.cwd_charge`,
                                                cwdTotal
                                              );

                                              // Also trigger BHR total calculation since CDW is part of BHR formula
                                              const bhrTotal =
                                                calculateTotalBHRCharges(
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_hire_charge_per_day
                                                  ) || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_extra_charge_per_day
                                                  ) || 0,
                                                  form.values.thirdPartyVehicles[
                                                    index
                                                  ]?.no_of_days_hired || 0,
                                                  parseFloat(
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.bhr_administration_fee
                                                  ) || 0,
                                                  parseFloat(inputValue) || 0,
                                                  index === 0
                                                    ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                    : 0
                                                );
                                              form.setFieldValue(
                                                `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                bhrTotal
                                              );
                                            }
                                          };

                                          return (
                                            <input
                                              {...field}
                                              type="number"
                                              step="0.01"
                                              disabled={isClosed}
                                              inputMode="decimal"
                                              className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none"
                                              value={
                                                field.value !== undefined &&
                                                  field.value !== null &&
                                                  field.value !== ""
                                                  ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                  : "15.00"
                                              }
                                              onChange={handleChange}
                                            />
                                          );
                                        }}
                                      </Field>

                                      <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div> */}
                                  {/* <div className="col-span-3 lg:col-span-3"> */}
                                  {/* {getFieldError("salvageAmount", formik)} */}
                                  {/* </div> */}

                                  {/*CWD Charge */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.cwd_charge`}
                                    >
                                      CDW Charges
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-gray-100 h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg bg-gray-100">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.cwd_charge`}
                                      >
                                        {({ field }: any) => (
                                          <input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            disabled={true}
                                            readOnly={true}
                                            placeholder="0.00"
                                            className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none bg-gray-100"
                                            value={
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
                                            }
                                          />
                                        )}
                                      </Field>

                                      {/* <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-gray-100 appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  {/*Collection and Delivery fee - Only show for first vehicle (index 0) */}
                                  {index === 0 && (
                                    <>
                                      <div className="col-span-3 lg:col-span-1">
                                        <Label
                                          htmlFor={`thirdPartyVehicles.${index}.collection_and_delivery_fee`}
                                        >
                                          Collection and Delivery fee
                                        </Label>
                                      </div>
                                      <div className="col-span-3 lg:col-span-2">
                                        <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                          <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                            <span className="text-sm sm:text-base">
                                              £
                                            </span>
                                          </div>
                                          <Field
                                            name={`thirdPartyVehicles.${index}.collection_and_delivery_fee`}
                                          >
                                            {({ field, form }: any) => {
                                              const handleChange = (
                                                e: React.ChangeEvent<HTMLInputElement>
                                              ) => {
                                                const inputValue =
                                                  e.target.value;

                                                // Allow empty string to let the user clear the field
                                                if (inputValue === "") {
                                                  form.setFieldValue(
                                                    field.name,
                                                    ""
                                                  );
                                                  return;
                                                }

                                                // Regex: allow only numbers with up to 2 decimal places
                                                const validPattern =
                                                  /^\d+(\.\d{0,2})?$/;

                                                if (
                                                  validPattern.test(inputValue)
                                                ) {
                                                  form.setFieldValue(
                                                    field.name,
                                                    inputValue
                                                  );

                                                  // Trigger BHR total calculation
                                                  const bhrTotal =
                                                    calculateTotalBHRCharges(
                                                      parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.bhr_hire_charge_per_day
                                                      ) || 0,
                                                      parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.bhr_extra_charge_per_day
                                                      ) || 0,
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.no_of_days_hired || 0,
                                                      parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]
                                                          ?.bhr_administration_fee
                                                      ) || 0,
                                                      parseFloat(
                                                        form.values
                                                          .thirdPartyVehicles[
                                                          index
                                                        ]?.cwd_per_day
                                                      ) || 15,
                                                      parseFloat(inputValue) ||
                                                        0
                                                    );
                                                  form.setFieldValue(
                                                    `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                    bhrTotal
                                                  );
                                                }
                                              };

                                              return (
                                                <input
                                                  {...field}
                                                  type="number"
                                                  step="0.01"
                                                  disabled={isClosed}
                                                  inputMode="decimal"
                                                  placeholder="0.00"
                                                  className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none"
                                                  value={
                                                    field.value !== undefined &&
                                                    field.value !== null &&
                                                    field.value !== ""
                                                      ? parseFloat(
                                                          field.value
                                                        ).toFixed(2)
                                                      : "0.00"
                                                  }
                                                  onChange={handleChange}
                                                />
                                              );
                                            }}
                                          </Field>

                                          {/* <div className="relative w-[110px] sm:w-[130px]">
                                            <select
                                              disabled={isClosed}
                                              className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                            >
                                              <option>GBP</option>
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                          </div> */}
                                        </div>
                                        {/* {getFieldError("salvageAmount", formik)} */}
                                      </div>
                                    </>
                                  )}

                                  {/*Total BHR Charge */}
                                  <div className="col-span-3 lg:col-span-1">
                                    <Label
                                      htmlFor={`thirdPartyVehicles.${index}.total_bhr_charge`}
                                    >
                                      Total BHR Charges
                                    </Label>
                                  </div>
                                  <div className="col-span-3 lg:col-span-2">
                                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-gray-100 h-10 sm:h-12">
                                      <div className="flex items-center px-2 sm:px-3 rounded-lg bg-gray-100">
                                        <span className="text-sm sm:text-base">
                                          £
                                        </span>
                                      </div>
                                      <Field
                                        name={`thirdPartyVehicles.${index}.total_bhr_charge`}
                                      >
                                        {({ field }: any) => (
                                          <input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            disabled={true}
                                            readOnly={true}
                                            placeholder="0.00"
                                            className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none bg-gray-100"
                                            value={
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
                                            }
                                          />
                                        )}
                                      </Field>

                                      {/* <div className="relative w-[110px] sm:w-[130px]">
                                        <select
                                          disabled={isClosed}
                                          className="w-full h-full px-2 sm:px-3 rounded-lg bg-gray-100 appearance-none cursor-pointer"
                                        >
                                          <option>GBP</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                      </div> */}
                                    </div>
                                    {/* {getFieldError("salvageAmount", formik)} */}
                                  </div>

                                  <div className="col-span-3 lg:col-span-1" />
                                </div>
                                <div className="mt-8 border-t border-cloudGray" />
                              </form>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </FieldArray>
              </>
            );
          }}
        </Formik>
      </div>
    );
  }
);

HireDetails.displayName = "HireDetails";

export default HireDetails;
