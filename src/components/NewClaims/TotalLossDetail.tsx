import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "../application/date-picker/date-picker";

import type { DateValue } from "react-aria-components";
import CustomSelect from "../ReactSelect/ReactSelect";
import { toast } from "react-toastify";
import {
  createTotalLoss,
  fetchAgrees,
  fetchCategories,
  fetchKeeping,
  fetchRetaining,
  getTotalLoss,
  updateTotalLoss,
} from "../../services/TotalLoss/TotalLoss";

interface FormValues {
  totalLossDate: DateValue | null;
  pav: string;
  salvageAmount: string;
  salvageCategory: string;
  engineerReportSent: DateValue | null;
  pavChequeReceived: DateValue | null;
  pavSentToClient: DateValue | null;
  vehicle_salvage_milage: string | number;
  clientKeepingSalvage: string | number;
  pavOfferMade: DateValue | null;
  pavOfferAccepted: DateValue | null;
  pavAgreed: string | number;
  clientRetainingSalvage: string | number;
  tpiInstructed: DateValue | null;
  salvageCollectedOn: DateValue | null;
  cilAgreed: string;
}
interface ReferrerDetailsProps {
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

const validationSchema = Yup.object().shape({
  // totalLossDate: Yup.date()
  //   .nullable()
  //   .required("Total Loss Date is required"),
  // pav: Yup.string()
  //   .required("PAV is required"),
  // salvageAmount: Yup.string()
  //   .required("Salvage Amount is required"),
  // salvageCategory: Yup.string()
  //   .required("Salvage Category is required"),
  // engineerReportSent: Yup.date()
  //   .nullable()
  //   .required("Engineer Report Sent date is required"),
  // pavChequeReceived: Yup.date()
  //   .nullable()
  //   .required("PAV Cheque Received date is required"),
  // pavSentToClient: Yup.date()
  //   .nullable()
  //   .required("PAV Sent to Client date is required"),
  // pavOfferMade: Yup.date()
  //   .nullable()
  //   .required("PAV Offer Made to Client date is required"),
  // pavOfferAccepted: Yup.date()
  //   .nullable()
  //   .required("PAV Offer Accepted date is required"),
  // tpiInstructed: Yup.date()
  //   .nullable()
  //   .required("TPI Instructed to Collect Salvage date is required"),
  // salvageCollectedOn: Yup.date()
  //   .nullable()
  //   .required("Salvage Collected On date is required"),
  // cilAgreed: Yup.string()
  //   .required("Please select if Salvage has been collected"),
  // vehicle_salvage_milage: Yup.number()
  //   .typeError("Mileage must be a number")
  //   .required("Vehicle salvage mileage is required")
  //   .min(0, "Mileage cannot be negative"),
  // clientKeepingSalvage: Yup.number()
  //   .typeError("Must be a number")
  //   .required("Client keeping salvage value is required")
  //   .min(0, "Must be 0 or higher"),
  // pavAgreed: Yup.number()
  //   .typeError("PAV agreed amount must be a number")
  //   .required("PAV agreed amount is required")
  //   .min(0, "Must be 0 or higher"),
  // clientRetainingSalvage: Yup.number()
  //   .typeError("Must be a number")
  //   .required("Client retaining salvage value is required")
  //   .min(0, "Must be 0 or higher"),
});

const TotalLossDetail = forwardRef(
  ({ onSuccess, handleNext, skipNext }: ReferrerDetailsProps, ref) => {
    const { id } = useParams();
    const formikRef = useRef<any>(null);
    const { isClosed } = useSelector((state: any) => state.isClosed);
    const engineer_report_received = useSelector(
      (state: any) => state?.engineer?.ocr_engineer
    );
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const [isEditing, setIsEditing] = useState(false);
    const [options, setOptions] = useState([]);
    const [keepings, setKeepings] = useState([]);
    const [pavAgrees, setPavAgrees] = useState([]);
    const [retainings, setRetainings] = useState([]);

    const [initialValues, setInitialValues] = useState<FormValues>({
      totalLossDate: null,
      pav: "",
      salvageAmount: "",
      salvageCategory: "",
      engineerReportSent: null,
      pavChequeReceived: null,
      pavSentToClient: null,
      vehicle_salvage_milage: "",
      clientKeepingSalvage: "",
      pavOfferMade: null,
      pavAgreed: "",
      pavOfferAccepted: null,
      clientRetainingSalvage: "",
      tpiInstructed: null,
      salvageCollectedOn: null,
      cilAgreed: "",
    });

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
  const fetchData = async () => {
    let apiData = null;
    if (id || claimID) {
      try {
        const response = await getTotalLoss(id || claimID);
        apiData = response;
      } catch (err) {
        console.error("Error fetching total loss:", err);
      }
    }

    // Merge: OCR overrides API
    const mergedData = { ...apiData, ...engineer_report_received };
    handleSetInitialValues(mergedData); // update this function to use mergedData
    setIsEditing(!!apiData);
  };

  fetchData();
}, [id, claimID, engineer_report_received]);

    const fetchTotalLoss = async () => {
      try {
        const totalLoss = await getTotalLoss(id || claimID);
        handleSetInitialValues(totalLoss);
        setIsEditing(true);
      } catch (err) {
        setIsEditing(false);
        console.error("Error fetching repair costs:", err);
      }
    };

    useEffect(() => {
      const fetchSalvageCategories = async () => {
        try {
          const res = await fetchCategories();
          if (res && Array.isArray(res)) {
            const updatedOptions = res.map((item: any) => ({
              value: item?.id,
              label: item?.label,
            }));
            setOptions(updatedOptions);
          }
        } catch (e) {
          toast.error("Unable to fetch salvage categories");
        }
      };

      const fetchRetainingSalvages = async () => {
        try {
          const res = await fetchRetaining();
          if (res && Array.isArray(res)) {
            const updatedOptions = res.map((item: any) => ({
              value: item?.id,
              label: item?.label,
            }));
            setRetainings(updatedOptions);
          }
        } catch (e) {
          toast.error("Unable to fetch salvage categories");
        }
      };

      const fetchPavAgrees = async () => {
        try {
          const res = await fetchAgrees();
          if (res && Array.isArray(res)) {
            const updatedOptions = res.map((item: any) => ({
              value: item?.id,
              label: item?.label,
            }));
            setPavAgrees(updatedOptions);
          }
        } catch (e) {
          toast.error("Unable to fetch salvage categories");
        }
      };

      const fetchKeepingSalvages = async () => {
        try {
          const res = await fetchKeeping();
          if (res && Array.isArray(res)) {
            const updatedOptions = res.map((item: any) => ({
              value: item?.id,
              label: item?.label,
            }));
            setKeepings(updatedOptions);
          }
        } catch (e) {
          toast.error("Unable to fetch salvage categories");
        }
      };

      fetchPavAgrees();
      fetchKeepingSalvages();
      fetchRetainingSalvages();
      fetchSalvageCategories();
    }, []);

    useEffect(() => {
      if (engineer_report_received) {
        setInitialValues((prev) => ({
          ...prev,
          pav: engineer_report_received?.pav,
          salvageAmount: engineer_report_received?.salvage_amount,
          salvageCategory: engineer_report_received?.salvage_category,
        }));
      }
    }, [engineer_report_received]);

    // const formatCalendarDate = (date?: CalendarDate | any) => {
    //   if (!date) return undefined;
    //   const jsDate = new Date(date.year, date.month - 1, date.day);
    //   return jsDate.toISOString().split("T")[0];
    // };
    const formatCalendarDate = (date?: CalendarDate) => {
          if (!date) return undefined;
    
          const jsDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
    
          const year = jsDate.getUTCFullYear();
          const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
          const day = String(jsDate.getUTCDate()).padStart(2, "0");
    
          return `${year}-${month}-${day}`;
        };

    const parseCalendarDate = (dateStr?: any) => {
      if (!dateStr) return undefined;
      const [year, month, day] = dateStr.split("-").map(Number);
      return new CalendarDate(year, month, day);
    };

    const handleSetInitialValues = (data: any) => {
      setInitialValues((prev) => ({
        ...prev,
        totalLossDate: parseCalendarDate(data.total_loss_date),
        pav: data?.pav || prev.pav,
        salvageAmount: data?.salvage_amount || prev.salvageAmount,
        salvageCategory: data?.salvage_category_id || null,
        engineerReportSent: parseCalendarDate(data?.engineer_report_sent_tpi),
        pavChequeReceived: parseCalendarDate(data?.pav_cheque_received),
        pavSentToClient: parseCalendarDate(data?.pav_sent_client),
        vehicle_salvage_milage: data?.vehicle_salvage_milage || "",
        clientKeepingSalvage: data?.keeping_salvage_id || null,
        pavOfferMade: parseCalendarDate(data?.pav_offer_made_client),
        pavAgreed: data?.pav_agreed_id || null,
        pavOfferAccepted: parseCalendarDate(data?.pav_offer_accepted),
        clientRetainingSalvage: data?.retaining_salvage_id || null,
        tpiInstructed: parseCalendarDate(
          data?.tpi_instructed_collect_saving_on
        ),
        cilAgreed:
          data?.has_salvage_been_collected === false ? "false" : "true",
        salvageCollectedOn: parseCalendarDate(data?.salvage_collect_on),
      }));
    };

    const handleSubmit = async (values: FormData) => {
      const payload = {
        currency: "GBP",
        total_loss_date: values.totalLossDate
          ? formatCalendarDate(values.totalLossDate)
          : "",
        pav: values.pav ? parseFloat(values.pav) : 0,
        salvage_amount: values.salvageAmount
          ? parseFloat(values.salvageAmount)
          : 0,
        salvage_category_id: values.salvageCategory
          ? parseInt(
              options.find((option) => option.value === values.salvageCategory)
                ?.value,
              10
            )
          : null,

        keeping_salvage_id: values.clientKeepingSalvage
          ? parseInt(
              keepings.find(
                (option) => option.value === values.clientKeepingSalvage
              )?.value,
              10
            )
          : null,

        pav_agreed_id: values.pavAgreed
          ? parseInt(
              pavAgrees.find((option) => option.value === values.pavAgreed)
                ?.value,
              10
            )
          : null,

        retaining_salvage_id: values.clientRetainingSalvage
          ? parseInt(
              retainings.find(
                (option) => option.value === values.clientRetainingSalvage
              )?.value,
              10
            )
          : null,
        engineer_report_sent_tpi: values.engineerReportSent
          ? formatCalendarDate(values.engineerReportSent)
          : "",
        pav_cheque_received: values.pavChequeReceived
          ? formatCalendarDate(values.pavChequeReceived)
          : "",
        pav_sent_client: values.pavSentToClient
          ? formatCalendarDate(values.pavSentToClient)
          : "",
        vehicle_salvage_milage: values?.vehicle_salvage_milage
          ? parseInt(values.vehicle_salvage_milage)
          : 0,
        pav_offer_made_client: values.pavOfferMade
          ? formatCalendarDate(values.pavOfferMade)
          : "",
        pav_offer_accepted: values.pavOfferAccepted
          ? formatCalendarDate(values.pavOfferAccepted)
          : "",
        tpi_instructed_collect_saving_on: values.tpiInstructed
          ? formatCalendarDate(values.tpiInstructed)
          : "",
        has_salvage_been_collected:
          values.cilAgreed === "true" ? "true" : "false",
        salvage_collect_on: values.salvageCollectedOn
          ? formatCalendarDate(values.salvageCollectedOn)
          : "",
        claim_id: id || claimID,
      };
      let res;
      if ((id || claimID) && !isEditing) {
        res = await createTotalLoss(id || claimID, payload);
        toast.success("Total Loss Created");
      } else {
        res = await updateTotalLoss(id || claimID, payload);
        toast.success("Total Loss Updated Successfully");
      }
      const navigateValue = localStorage.getItem("navigate");
      if (navigateValue !== "true") {
        if (handleNext && !skipNext) {
          handleNext(9, "next");
        } else {
          return;
        }
      } else {
        return;
      }
    };

    const getFieldError = (fieldName: keyof FormValues, formik: any) =>
      formik.touched[fieldName] && formik.errors[fieldName] ? (
        <div className="text-red-500 text-xs mt-1">
          {formik.errors[fieldName]}
        </div>
      ) : null;

    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        if (formikRef.current) {
          await formikRef.current.submitForm();
          if (formikRef.current.isValid) {
            return true;
          } else {
            throw new Error("Form validation failed");
          }
        }
        throw new Error("Form not available");
      },
    }));

    const formatToTwoDecimals = (value: string): string => {
      if (value === "" || value === null || value === undefined) return "";

      const num = parseFloat(value);
      if (isNaN(num)) return value;

      // Format to 2 decimal places
      return num.toFixed(2);
    };

    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pl-6 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formik) => {
            const { setFieldValue, handleBlur } = formik;

            // Custom blur handler for number fields
            const handleNumberBlur = (
              e: React.FocusEvent<HTMLInputElement>,
              fieldName: string
            ) => {
              const value = e.target.value;
              if (value) {
                const formatted = formatToTwoDecimals(value);
                setFieldValue(fieldName, formatted);
              }
              handleBlur(e); // Call Formik's original blur handler
            };
            return (
              <Form>
                <div className="flex-1 p-0 sm:p-0">
                  {/* Total Loss Section */}
                  <div className="bg-white mb-6">
                    <div className="p-0 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Total Loss
                      </h2>
                      <p className="text-sm text-gray-600">
                        Please provide the Total Loss information and contact
                        details.
                      </p>
                    </div>
                    <div className="w-[102%] mt-8">
                      <div className="">
                        {/* Total Loss Date */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            Total Loss Date
                          </label>
                          <div className="w-[81%]">
                            <Field name="totalLossDate">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={field.value}
                                  onChange={(value) =>
                                    form.setFieldValue(field.name, value)
                                  }
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                            {getFieldError("totalLossDate", formik)}
                          </div>
                        </div>

                        {/* PAV */}
                        <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                          <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                            PAV
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                              <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                <span className="text-sm sm:text-base">£</span>
                              </div>
                              <Field
                                name="pav"
                                type="number"
                                step="0.01"
                                disabled={isClosed}
                                placeholder="0.00"
                                className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                onBlur={(
                                  e: React.FocusEvent<HTMLInputElement>
                                ) => handleNumberBlur(e, "pav")}
                              />
                              {/* <div className="relative w-[110px] sm:w-[130px]">
                              <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer">
                                <option>GBP</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                            </div> */}
                            </div>
                            {getFieldError("pav", formik)}
                          </div>
                        </div>

                        {/* Salvage Amount */}
                        <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                          <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                            Salvage Amount
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                              <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                <span className="text-sm sm:text-base">£</span>
                              </div>
                              <Field
                                name="salvageAmount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                disabled={isClosed}
                                className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                onBlur={(
                                  e: React.FocusEvent<HTMLInputElement>
                                ) => handleNumberBlur(e, "salvageAmount")}
                              />
                              {/* <div className="relative w-[110px] sm:w-[130px]">
                              <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer">
                                <option>GBP</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                            </div> */}
                            </div>
                            {getFieldError("salvageAmount", formik)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                          <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                            Salvage Category
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <CustomSelect
                              options={options}
                              value={options.find(
                                (option) =>
                                  option.value ===
                                    formik.values.salvageCategory ||
                                  option.label === formik.values.salvageCategory
                              )}
                              onChange={(option) => {
                                formik.setFieldValue(
                                  "salvageCategory",
                                  option ? option.value : null
                                );
                              }}
                              placeholder="Select Salvage Category"
                              disabled={isClosed}
                            />
                          </div>
                        </div>

                        {/* Engineer Report Sent to TPI */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            Engineer Report Sent to TPI
                          </label>
                          <div className="w-[81%]">
                            <Field name="engineerReportSent">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={field.value}
                                  onChange={(value) =>
                                    form.setFieldValue(field.name, value)
                                  }
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                            {getFieldError("engineerReportSent", formik)}
                          </div>
                        </div>

                        {/* PAV Cheque Received */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            PAV Cheque Received
                          </label>
                          <div className="w-[81%]">
                            <Field name="pavChequeReceived">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={field.value}
                                  onChange={(value) =>
                                    form.setFieldValue(field.name, value)
                                  }
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                            {getFieldError("pavChequeReceived", formik)}
                          </div>
                        </div>

                        {/* PAV Sent to Client */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            PAV Sent to Client
                          </label>
                          <div className="w-[81%]">
                            <Field name="pavSentToClient">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={field.value}
                                  onChange={(value) =>
                                    form.setFieldValue(field.name, value)
                                  }
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                            {getFieldError("pavSentToClient", formik)}
                          </div>
                        </div>

                        {/* Reference */}
                        <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-6 sm:mt-6">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Vehicle Salvage Milage
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              type="number"
                              name="vehicle_salvage_milage"
                              disabled={isClosed}
                              style={{
                                height: "44px",
                                // width: "810px",
                                // marginLeft: "7px",
                              }}
                              placeholder="0"
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white"
                            />
                            {getFieldError("vehicle_salvage_milage", formik)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                          <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                            Client Keeping Salvage
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <CustomSelect
                              options={keepings}
                              value={keepings.find(
                                (option) =>
                                  option.value ===
                                  formik.values.clientKeepingSalvage
                              )}
                              onChange={(option) => {
                                formik.setFieldValue(
                                  "clientKeepingSalvage",
                                  option ? option.value : null
                                );
                              }}
                              placeholder=""
                              disabled={isClosed}
                            />
                          </div>
                        </div>

                        {/* PAV Offer Made */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            PAV Offer Made to Client
                          </label>
                          <div className="w-[81%]">
                            <Field name="pavOfferMade">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={field.value}
                                  onChange={(value) =>
                                    form.setFieldValue(field.name, value)
                                  }
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                            {getFieldError("pavOfferMade", formik)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                          <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                            PAV Agreed
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <CustomSelect
                              options={pavAgrees}
                              value={pavAgrees.find(
                                (option) =>
                                  option.value === formik.values.pavAgreed
                              )}
                              onChange={(option) => {
                                formik.setFieldValue(
                                  "pavAgreed",
                                  option ? option.value : null
                                );
                              }}
                              placeholder=""
                              disabled={isClosed}
                            />
                          </div>
                        </div>

                        {/* PAV Offer Accepted */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            PAV Offer Accepted
                          </label>
                          <div className="w-[81%]">
                            <Field name="pavOfferAccepted">
                              {({ field, form }: any) => {
                                return (
                                  <DatePicker
                                    isDisabled={isClosed}
                                    value={field.value}
                                    onChange={(value) =>
                                      form.setFieldValue(field.name, value)
                                    }
                                    className="mt-1 z-50"
                                  />
                                );
                              }}
                            </Field>
                            {getFieldError("pavOfferAccepted", formik)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="text-slate-300" />
                  </div>

                  {/* Salvage Retention Section */}
                  <div className="bg-white border-b border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Salvage Retention Details
                      </h2>
                      <p className="text-sm mb-2 text-gray-600">
                        Please provide the Salvage Retention details below.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start mb-4 mt-8">
                      <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                        Client Retaining Salvage?
                      </label>
                      <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                        <CustomSelect
                          options={retainings}
                          value={retainings.find(
                            (option) =>
                              option.value ===
                              formik.values.clientRetainingSalvage
                          )}
                          onChange={(option) => {
                            formik.setFieldValue(
                              "clientRetainingSalvage",
                              option ? option.value : null
                            );
                          }}
                          placeholder=""
                          disabled={isClosed}
                        />
                      </div>
                    </div>

                    {/* TPI Instructed */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                      <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                        TPI Instructed to Collect Salvage on
                      </label>
                      <div className="w-[81%]">
                        <Field name="tpiInstructed">
                          {({ field, form }: any) => (
                            <DatePicker
                              isDisabled={isClosed}
                              value={field.value}
                              onChange={(value) =>
                                form.setFieldValue(field.name, value)
                              }
                              className="mt-1 z-50"
                            />
                          )}
                        </Field>
                        {getFieldError("tpiInstructed", formik)}
                      </div>
                    </div>

                    {/* Salvage Collected Radio */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6 mt-7">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Has Salvage Been Collected?
                      </label>
                      <div className="w-full sm:w-3/4 flex gap-4">
                        <label className="flex items-center">
                          <Field
                            type="radio"
                            name="cilAgreed"
                            value="true"
                            disabled={isClosed}
                            className="w-4 h-4 accent-[#414651]"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Yes
                          </span>
                        </label>
                        <label className="flex items-center">
                          <Field
                            type="radio"
                            name="cilAgreed"
                            value="false"
                            disabled={isClosed}
                            className="w-4 h-4 accent-[#414651]"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                        {getFieldError("cilAgreed", formik)}
                      </div>
                    </div>

                    {/* Salvage Collected On */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                      <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                        Salvage Collected On
                      </label>
                      <div className="w-[81%]">
                        <Field name="salvageCollectedOn">
                          {({ field, form }: any) => (
                            <DatePicker
                              isDisabled={isClosed}
                              value={field.value}
                              onChange={(value) =>
                                form.setFieldValue(field.name, value)
                              }
                              className="mt-1 z-50"
                            />
                          )}
                        </Field>
                        {getFieldError("salvageCollectedOn", formik)}
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    );
  }
);

TotalLossDetail.displayName = "TotalLossDetails";
export default TotalLossDetail;
