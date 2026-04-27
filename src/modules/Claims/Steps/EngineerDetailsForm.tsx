import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useFormik } from "formik";
import { cleanPayload } from "./ClientDetailsForm";
import { TotalLossView } from "../Components/TotalLossModal";
import RepairCostRouteModal from "../Components/RepairCostModal";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import {
  EngineerDetailsApi,
  gettingEnginerDetails,
  instructEngineer,
  udpateEnginerDetails,
} from "../../../services/EngineeringDetails/engineeringDetails";
import { V5CEngineerUploadModal } from "../Components/V5CEngineerUploadModal";
import { CustomDatePicker } from "../Components/DatePicker";

export const EngineerDetailsForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");

  const [lossModal, openModal1] = useState<boolean>(false);
  const [repairModal, openModal2] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [instructing, setInstructing] = useState(false);
  const [engineer_report_received, setReportData] = useState<any>();

  const [showInvRec, setShowInvRec] = useState(false);
  const [showInvPaid, setShowInvPaid] = useState(false);
  const [showInvSettled, setShowInvSettled] = useState(false);
  const [showEngInstructed, setShowEngInstructed] = useState(false);
  const [showInspection, setShowInspection] = useState(false);
  const [showReportRec, setShowReportRec] = useState(false);

  const invRecRef = useRef<HTMLDivElement>(null);
  const invPaidRef = useRef<HTMLDivElement>(null);
  const invSettledRef = useRef<HTMLDivElement>(null);
  const engInstructedRef = useRef<HTMLDivElement>(null);
  const inspectionRef = useRef<HTMLDivElement>(null);
  const reportRecRef = useRef<HTMLDivElement>(null);

  const inputStyles =
    "hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors placeholder:font-['Stack_Sans_Headline']";

  const toNumberOrNull = (value: any) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatDateLabel = (value: any) => {
    if (!value) return "Date";

    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-GB");
      }
      return value;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB");
    }

    return "Date";
  };

  const formik = useFormik({
    initialValues: {
      companyName: "",
      vehicle_payment_beneficiary: "",
      reference: "",
      currency: "GBP",

      actual_fee: "",
      invoice_received_on: "",
      invoice_paid_on: "",
      invoice_settled_on: "",
      invoice_settled_amount: "",

      engineer_report_received: false,
      engineer_instructed: "",
      inspection_date: "",
      engineer_report_received_date: "",
      engineer_fee: "",

      site: "",

      engineer_address: {
        address: "",
        postcode: "",
        landline_tel: "",
        mobile_tel: "",
        email: "",
      },

      vehicle_address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    },

    validationSchema: Yup.object().shape({}),

    onSubmit: async (values: any) => {
      try {
        if (!claimId) {
          toast.error("Claim ID not found");
          return;
        }

        const payload = {
          company_name: values.companyName,
          vehicle_payment_beneficiary: values.vehicle_payment_beneficiary,
          reference: values.reference,
          currency: values.currency,

          actual_fee: toNumberOrNull(values.actual_fee),
          invoice_received_on: values.invoice_received_on || null,
          invoice_paid_on: values.invoice_paid_on || null,
          invoice_settled_on: values.invoice_settled_on || null,
          invoice_settled_amount: toNumberOrNull(values.invoice_settled_amount),

          engineer_report_received: values.engineer_report_received === true,
          engineer_instructed: values.engineer_instructed || null,
          inspection_date: values.inspection_date || null,
          engineer_report_received_date:
            values.engineer_report_received_date || null,
          engineer_fee: toNumberOrNull(values.engineer_fee),

          site: values.site,
          claim_id: Number(claimId),

          engineer_address: {
            address: values.engineer_address.address,
            postcode: values.engineer_address.postcode,
            landline_tel: values.engineer_address.landline_tel,
            mobile_tel: values.engineer_address.mobile_tel,
            email: values.engineer_address.email,
          },

          vehicle_address: {
            address: values.vehicle_address.address,
            postcode: values.vehicle_address.postcode,
            mobile_tel: values.vehicle_address.mobile_tel,
            email: values.vehicle_address.email,
          },
        };

        const payloadToSend = cleanPayload(payload);

        const existingEngineerId = localStorage.getItem("engineerId");

        if (existingEngineerId && existingEngineerId !== "undefined") {
          const response = await udpateEnginerDetails(
            payloadToSend,
            Number(claimId),
          );

          if (response?.id) {
            localStorage.setItem("engineerId", String(response.id));
          }
        } else {
          const response =
            await EngineerDetailsApi.createEngineerDetails(payloadToSend);

          if (response?.id) {
            localStorage.setItem("engineerId", String(response.id));
          }
        }

        toast.success("Engineer details saved successfully");
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.detail || "Error saving engineer details",
        );
      }
    },
  });

  const handleInstructEngineer = async () => {
    if (!claimId) {
      toast.error("Claim ID not found");
      return;
    }

    if (!formik.values.engineer_address.email) {
      toast.error("Engineer email is required");
      return;
    }

    setInstructing(true);

    try {
      const payload = {
        email: formik.values.engineer_address.email,
        company: formik.values.companyName,
        address: formik.values.engineer_address.address,
        postCode: formik.values.engineer_address.postcode,
        location: formik.values.vehicle_address.address,
      };

      await instructEngineer(payload, Number(claimId));
      toast.success("Email sent with instructions");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Unable to send email");
    } finally {
      setInstructing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!claimId) return;

      try {
        const res = await gettingEnginerDetails(Number(claimId));

        if (res?.id) {
          localStorage.setItem("engineerId", String(res.id));
        }

        const mappedValues = {
          companyName: res.company_name || "",
          vehicle_payment_beneficiary: res.vehicle_payment_beneficiary || "",
          reference: res.reference || "",
          currency: res.currency || "GBP",

          actual_fee: res.actual_fee ?? "",
          invoice_received_on: res.invoice_received_on || "",
          invoice_paid_on: res.invoice_paid_on || "",
          invoice_settled_on: res.invoice_settled_on || "",
          invoice_settled_amount: res.invoice_settled_amount ?? "",

          engineer_report_received: res.engineer_report_received || false,
          engineer_instructed: res.engineer_instructed || "",
          inspection_date: res.inspection_date || "",
          engineer_report_received_date:
            res.engineer_report_received_date || "",
          engineer_fee: res.engineer_fee ?? "",

          site: res.site || "",

          engineer_address: {
            address: res.engineer_address?.address || "",
            postcode: res.engineer_address?.postcode || "",
            landline_tel: res.engineer_address?.landline_tel || "",
            mobile_tel: res.engineer_address?.mobile_tel || "",
            email: res.engineer_address?.email || "",
          },

          vehicle_address: {
            address: res.vehicle_address?.address || "",
            postcode: res.vehicle_address?.postcode || "",
            mobile_tel: res.vehicle_address?.mobile_tel || "",
            email: res.vehicle_address?.email || "",
          },
        };

        formik.setValues(mappedValues);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error(err);
          toast.error("Unable to load engineer details");
        }
      }
    };

    fetchData();
  }, [claimId]);

  useEffect(() => {
    if (formRef) {
      formRef.current = formik;
    }
  }, [formRef, formik]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        invRecRef.current &&
        !invRecRef.current.contains(event.target as Node)
      ) {
        setShowInvRec(false);
      }

      if (
        invPaidRef.current &&
        !invPaidRef.current.contains(event.target as Node)
      ) {
        setShowInvPaid(false);
      }

      if (
        invSettledRef.current &&
        !invSettledRef.current.contains(event.target as Node)
      ) {
        setShowInvSettled(false);
      }

      if (
        engInstructedRef.current &&
        !engInstructedRef.current.contains(event.target as Node)
      ) {
        setShowEngInstructed(false);
      }

      if (
        inspectionRef.current &&
        !inspectionRef.current.contains(event.target as Node)
      ) {
        setShowInspection(false);
      }

      if (
        reportRecRef.current &&
        !reportRecRef.current.contains(event.target as Node)
      ) {
        setShowReportRec(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleHomeNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.setFieldValue("engineer_address.landline_tel", e.target.value);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 4) {
      value = value.slice(0, 4) + " " + value.slice(4);
    }

    formik.setFieldValue("engineer_address.mobile_tel", value);
  };

  const pollJobStatus = async () => {
    try {
      toast.success("Data extracted successfully!");
    } catch (e) {
      toast.error("OCR extraction failed");
    }
  };

  const renderDatePickerField = (
    label: string,
    value: any,
    isOpen: boolean,
    setOpen: (v: boolean) => void,
    ref: React.RefObject<HTMLDivElement>,
    fieldName: string,
    openUpwards :boolean,
  ) => (
    <div className="flex flex-col gap-2 relative" ref={ref}>
      <label className="text-neutral-700 text-[14px] font-weight-500">
        {label}
      </label>

      <div
        onClick={() => setOpen(!isOpen)}
        className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer hover:border-neutral-400 focus-within:border-blue-500 transition-all"
      >
        <span
          className={
            value
              ? "text-neutral-700 font-light"
              : "text-neutral-300 font-light"
          }
        >
          {formatDateLabel(value)}
        </span>

        <img src={Vector6} className="w-4 h-4" alt="calendar" />
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            openUpwards ? "bottom-[423px]" : "top-[23px]"
          } left-0 z-[100] shadow-xl rounded-lg bg-white`}
        >
          <CustomDatePicker
            selectedDate={value ? new Date(value) : new Date()}
            onDateSelect={(date) => {
              formik.setFieldValue(
                fieldName,
                new Date(date).toLocaleDateString("sv-SE"),
              );
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      <V5CEngineerUploadModal
        isOpen={showUploadModal}
        claimId={claimId}
        formik={formik}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => pollJobStatus()}
        setReportData={setReportData}
      />

      {lossModal && (
        <TotalLossView
          isOpen={lossModal}
          onClose={() => openModal1(false)}
          engineer_report_received={engineer_report_received}
        />
      )}

      {repairModal && (
        <RepairCostRouteModal
          isOpen={repairModal}
          onClose={() => openModal2(false)}
          engineer_report_received={engineer_report_received}
        />
      )}

      <div className="MainContent w-full flex flex-col items-start gap-6 py-1 pb-10 font-['Stack_Sans_Headline']">
        <h1 className="text-neutral-900 text-[24px] font-weight-600">
          Engineer Details
        </h1>

        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
              Engineer Details
            </h2>

            <button
              type="button"
              disabled={instructing}
              onClick={handleInstructEngineer}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-weight-400 hover:bg-blue-100 transition-colors disabled:opacity-60"
            >
              {instructing ? "Sending..." : "Instruct Engineer"}
            </button>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Company Name
            </label>
            <input
              value={formik.values.companyName}
              onChange={(e) =>
                formik.setFieldValue("companyName", e.target.value)
              }
              type="text"
              placeholder="Enter Company Name"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Address
            </label>
            <LeafletAutocompleteMap
              showMap={false}
              disabled={false}
              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
              address={formik.values.engineer_address.address}
              onPlaceSelected={(place) => {
                formik.setFieldValue(
                  "engineer_address.address",
                  place.address || "",
                );
                formik.setFieldValue(
                  "engineer_address.postcode",
                  place.postalCode || "",
                );
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Postcode
              </label>
              <input
                type="text"
                value={formik.values.engineer_address.postcode}
                onChange={(e) =>
                  formik.setFieldValue(
                    "engineer_address.postcode",
                    e.target.value,
                  )
                }
                placeholder="Enter Postcode"
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email"
                value={formik.values.engineer_address.email}
                onChange={(e) =>
                  formik.setFieldValue("engineer_address.email", e.target.value)
                }
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Tel. Main
              </label>
              <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <input
                  type="text"
                  onChange={handleHomeNumberChange}
                  maxLength={15}
                  value={formik.values.engineer_address.landline_tel}
                  placeholder="Enter telephone"
                  className="w-full bg-transparent mb-0.5 outline-none text-gray-900 font-light placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Reference
              </label>
              <input
                type="text"
                value={formik.values.reference}
                onChange={(e) =>
                  formik.setFieldValue("reference", e.target.value)
                }
                placeholder="Enter reference"
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
              />
            </div>
          </div>
        </div>

        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
              Vehicle Location
            </h2>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Site
            </label>
            <input
              type="text"
              value={formik.values.site}
              onChange={(e) => formik.setFieldValue("site", e.target.value)}
              placeholder="Enter Site"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Address
            </label>
            <LeafletAutocompleteMap
              showMap={false}
              disabled={false}
              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
              address={formik.values.vehicle_address.address}
              onPlaceSelected={(place) => {
                formik.setFieldValue(
                  "vehicle_address.address",
                  place.address || "",
                );
                formik.setFieldValue(
                  "vehicle_address.postcode",
                  place.postalCode || "",
                );
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Postcode
              </label>
              <input
                type="text"
                value={formik.values.vehicle_address.postcode}
                onChange={(e) =>
                  formik.setFieldValue(
                    "vehicle_address.postcode",
                    e.target.value,
                  )
                }
                placeholder="Enter Postcode"
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
              />
            </div>
          </div>
        </div>

        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Engineer Fees
            </h2>
            <div className="w-full h-px bg-gray-100" />
          </div>

          <div className="flex flex-col gap-5">
            <div className="w-full md:w-1/2">
              <label className="block text-gray-700 text-sm font-weight-400 mb-2">
                Actual Fee
              </label>

              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-base font-light">
                  £
                </span>
                <input
                  type="number"
                  value={formik.values.actual_fee}
                  onChange={(e) =>
                    formik.setFieldValue("actual_fee", e.target.value)
                  }
                  placeholder="0.00"
                  className="w-full pl-10 pr-5 py-4 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-light"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderDatePickerField(
                "Invoice Received On",
                formik.values.invoice_received_on,
                showInvRec,
                setShowInvRec,
                invRecRef,
                "invoice_received_on",
                false
              )}

              {renderDatePickerField(
                "Invoice Paid On",
                formik.values.invoice_paid_on,
                showInvPaid,
                setShowInvPaid,
                invPaidRef,
                "invoice_paid_on",
                false
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderDatePickerField(
                "Invoice Settled On",
                formik.values.invoice_settled_on,
                showInvSettled,
                setShowInvSettled,
                invSettledRef,
                "invoice_settled_on",
                false
              )}

              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Invoice Settled Amount
                </label>

                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-base font-light">
                    £
                  </span>
                  <input
                    type="number"
                    value={formik.values.invoice_settled_amount}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "invoice_settled_amount",
                        e.target.value,
                      )
                    }
                    placeholder="0.00"
                    className={`w-full h-[52px] pl-10 pr-5 bg-white rounded border border-gray-200 ${inputStyles}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Engineer Report & Instructions Details
            </h2>

            <button
              type="button"
              className="h-8 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-2 transition-colors group"
              onClick={() => setShowUploadModal(true)}
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span className="text-blue-600 text-sm font-weight-300">
                Upload Report
              </span>
            </button>
          </div>

          <div className="w-full h-px bg-gray-100" />

          <div className="flex flex-col gap-3">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Engineer Report received?
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() =>
                  formik.setFieldValue("engineer_report_received", true)
                }
                className={`px-6 py-3 rounded border text-sm ${
                  formik.values.engineer_report_received
                    ? "bg-blue-50 border-blue-600 text-blue-600"
                    : "bg-white border-gray-200 text-neutral-700"
                }`}
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() =>
                  formik.setFieldValue("engineer_report_received", false)
                }
                className={`px-6 py-3 rounded border text-sm ${
                  !formik.values.engineer_report_received
                    ? "bg-blue-50 border-blue-600 text-blue-600"
                    : "bg-white border-gray-200 text-neutral-700"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {formik.values.engineer_report_received && (
            <>
              <div className="flex flex-col md:flex-row gap-5">
                <button
                  type="button"
                  onClick={() => openModal2(true)}
                  className="flex-1 px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-weight-400 hover:bg-blue-50 transition-colors"
                >
                  Repair Costs & Route
                </button>

                <button
                  type="button"
                  onClick={() => openModal1(true)}
                  className="flex-1 px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-weight-400 hover:bg-blue-50 transition-colors"
                >
                  Total Loss
                </button>
              </div>

              <div className="w-full h-px bg-gray-100 mt-2" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderDatePickerField(
                  "Engineer Instructed",
                  formik.values.engineer_instructed,
                  showEngInstructed,
                  setShowEngInstructed,
                  engInstructedRef,
                  "engineer_instructed",
                  true,
                )}

                {renderDatePickerField(
                  "Inspection Date",
                  formik.values.inspection_date,
                  showInspection,
                  setShowInspection,
                  inspectionRef,
                  "inspection_date",
                  true,
                )}

                {renderDatePickerField(
                  "Engineer’s Report Received",
                  formik.values.engineer_report_received_date,
                  showReportRec,
                  setShowReportRec,
                  reportRecRef,
                  "engineer_report_received_date",
                  true,
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-[14px] font-weight-500">
                    Engineer’s Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 text-base font-light">
                      £
                    </span>
                    <input
                      type="number"
                      value={formik.values.engineer_fee}
                      onChange={(e) =>
                        formik.setFieldValue("engineer_fee", e.target.value)
                      }
                      placeholder="0.00"
                      className={`w-full h-[52px] pl-10 pr-5 bg-white rounded border border-gray-200 ${inputStyles}`}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};