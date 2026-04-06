import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { Calendar, ChevronDown } from "lucide-react";
import Select from "react-select";
import {
  BlueDropdownIndicator,
  customStyles,
} from "../Steps/GeneralDetailsForm";
import Yes from '../../../assets/AutoClaim_icon/Yes.svg'
import No from '../../../assets/AutoClaim_icon/No.svg'

import { createTotalLoss, getTotalLoss, updateTotalLoss } from "../../../services/TotalLoss/TotalLoss";
import { toast } from "react-toastify";
import type { CalendarDate } from "@internationalized/date";

export const TotalLossView = ({ isOpen, onClose, engineer_report_received }) => {
  // 1. Internal Formik Instance
      const formatCalendarDate = (date?: CalendarDate) => {
            if (!date) return undefined;
      
            const jsDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
      
            const year = jsDate.getUTCFullYear();
            const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
            const day = String(jsDate.getUTCDate()).padStart(2, "0");
      
            return `${year}-${month}-${day}`;
          };
  
  const formik = useFormik({
    initialValues: {
      totalLossDate: null,
      pav: "",
      salvage_amount: "",
      salvage_category: "",
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
    },
    onSubmit: (values) => {
      const payload = {
        currency: "GBP",
        total_loss_date: values.totalLossDate
          ? formatCalendarDate(values.totalLossDate)
          : "",
        pav: values.pav ? parseFloat(values.pav) : 0,
        salvage_amount: values.salvage_amount
          ? parseFloat(values.salvage_amount)
          : 0,
        salvage_category_id: values.salvage_category
          ? parseInt(
              commonOptions2.find(
                (option) => option.value === values.salvage_category,
              )?.value,
              10,
            )
          : null,

        keeping_salvage_id: values.clientKeepingSalvage
          ? parseInt(
              commonOptions2.find(
                (option) => option.value === values.clientKeepingSalvage,
              )?.value,
              10,
            )
          : null,

        pav_agreed_id: values.pavAgreed
          ? parseInt(
              commonOptions2.find((option) => option.value === values.pavAgreed)
                ?.value,
              10,
            )
          : null,

        retaining_salvage_id: values.clientRetainingSalvage
          ? parseInt(
              commonOptions2.find(
                (option) => option.value === values.clientRetainingSalvage,
              )?.value,
              10,
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
        claim_id: parseInt(claimId),
      };
           let res;
           if (claimId) {
             res = createTotalLoss(parseInt(claimId), payload);
             toast.success("Total Loss Created");
           } else {
             res = updateTotalLoss(parseInt(claimId), payload);
             toast.success("Total Loss Updated Successfully");
           }
      onClose();
    },
  });
  const [salvageCollected, setSalvageCollected] = useState("Yes");
  const claimId = localStorage.getItem("claimId");
  useEffect(() => {
    const fetchData = async () => {
      let apiData = null;
      if (claimId) {
        try {
          const response = await getTotalLoss(parseInt(claimId));
          apiData = response;
        } catch (err) {
          console.error("Error fetching total loss:", err);
        }
      }

      // Merge: OCR overrides API
      const mergedData = { ...apiData, ...engineer_report_received };
      formik.setValues(mergedData); // update this function to use mergedData
    };

    fetchData();
  }, [claimId, engineer_report_received]);
{console.log(formik.values)}
  if (!isOpen) return null;

  const handlerOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "N", label: "N" },
    { value: "S", label: "S" },
  ];
const commonOptions = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "TBC", label: "TBC" },
];

const commonOptions2 = [
  ...commonOptions,
  { value: "DISPUTED", label: "Disputed" },
];
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10">
      <div className="card bg-white h-full flex flex-col overflow-auto w-[1070px]">
        {/* Modal Header */}
        <div className="w-full px-10 py-5 bg-white shadow-md flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-semibold text-xl">Total Loss</h1>
          <div className="flex gap-5">
            <button
              className="px-10 py-4 border border-blue-600 text-blue-600 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-10 py-4 bg-blue-500 text-white rounded"
              onClick={() => formik.handleSubmit()}
            >
              Update
            </button>
          </div>
        </div>

        <div className="w-[788px] mx-auto mb-10 space-y-6">
          {/* Section 1: Total Loss Details */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Total Loss Details
            </h2>
            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Row 1 */}
              <InputGroup
                label="Total Loss Date"
                type="date"
                name="totalLossDate"
                formik={formik}
              />
              <InputGroup
                label="PAV £"
                type="currency"
                name="pav"
                formik={formik}
              />

              {/* Row 2 */}
              <InputGroup
                label="Salvage Amount"
                type="currency"
                name="salvage_amount"
                formik={formik}
              />
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Salvage Category
                </label>
                <Select
                  options={handlerOptions}
                  styles={customStyles}
                  value={handlerOptions.find(
                    (o) => o.value === formik.values.salvage_category,
                  )}
                  onChange={(opt) =>
                    formik.setFieldValue("salvage_category", opt?.value)
                  }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>

              {/* Row 3 */}
              <InputGroup
                label="Engineer Report Sent to TPI"
                type="date"
                name="engRepSentTpi"
                formik={formik}
              />
              <InputGroup
                label="PAV Cheque Received"
                type="date"
                name="pavChequeReceived"
                formik={formik}
              />

              {/* Row 4 */}
              <InputGroup
                label="PAV Sent to Client"
                type="date"
                name="pavSentToClient"
                formik={formik}
              />
              <InputGroup
                label="Vehicle Salvage Mileage"
                type="text"
                name="salvageMileage"
                formik={formik}
              />

              {/* Row 5 */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Client Keeping Salvage?
                </label>
                <Select
                  options={commonOptions2}
                  styles={customStyles}
                  value={commonOptions2.find(
                    (o) => o.value === formik.values.clientKeepingSalvage,
                  )}
                  onChange={(opt) =>
                    formik.setFieldValue("clientKeepingSalvage", opt?.value)
                  }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              <InputGroup
                label="PAV Sent to Client"
                type="date"
                name="pavSentToClientExtra"
                formik={formik}
              />

              {/* Row 6 */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  PAV Agreed
                </label>
                <Select
                  options={commonOptions2}
                  styles={customStyles}
                  value={commonOptions2.find(
                    (o) => o.value === formik.values.pavAgreed,
                  )}
                  onChange={(opt) =>
                    formik.setFieldValue("pavAgreed", opt?.value)
                  }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              <InputGroup
                label="PAV Offer Accepted"
                type="date"
                name="pavOfferAccepted"
                formik={formik}
              />
            </div>

            {/* Buttons Group */}
            <div className="flex flex-wrap gap-5 py-4">
              {[
                "Send Eng Rep to TPI",
                "Send PAV to CL",
                "Instruct Fleet to Off Hire",
              ].map((text) => (
                <button
                  key={text}
                  type="button"
                  className="flex-1 min-w-[200px] px-6 py-4 bg-white rounded border border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Salvage Retention */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Salvage Retention Details Section
            </h2>
            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Client Retaining Salvage?
                </label>
                <Select
                  options={commonOptions}
                  styles={customStyles}
                  placeholder="Select Category"
                  value={commonOptions.find(
                    (o) => o.value === formik.values.clientRetainingSalvage,
                  )}
                  onChange={(opt) =>
                    formik.setFieldValue("clientRetainingSalvage", opt?.value)
                  }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              <InputGroup
                label="TPI Instructed to Collect Salvage on"
                type="date"
                name="tpiInstructedCollect"
                formik={formik}
              />

              {/* Radio Buttons */}
              <div className="flex flex-col gap-4">
                <span className="text-gray-700 text-sm font-medium">
                  Has Salvage Been Collected?
                </span>
                {/* <div className="flex gap-5">
                  <img src={Yes} alt="" />
                  <RadioButton
                    label="Yes"
                    active={salvageCollected}
                    onClick={() => setSalvageCollected(true)}
                  />
                  <RadioButton
                    label="No"
                    active={!salvageCollected}
                    onClick={() => setSalvageCollected(false)}
                  />
                </div> */}
                <div className="flex items-center gap-5">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="passengers"
                          className="sr-only"
                          checked={salvageCollected === option}
                          onChange={() => setSalvageCollected(option)}
                        />

                        {salvageCollected === option ? (
                          <img src={Yes} />
                        ) : (
                          <img src={No} />
                        )}
                      </div>

                      <span className="text-black text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <InputGroup
                label="Salvage Collected On"
                type="date"
                name="salvageCollectedOn"
                formik={formik}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const InputGroup = ({ label, type, name, formik }) => (
    <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-sm font-medium">{label}</label>
        <div className="relative">
            {type === "currency" && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">£</span>}
            <input 
                type={type === "date" ? "date" : "text"}
                name={name}
                value={formik.values[name] || ""}
                onChange={formik.handleChange}
                placeholder={type === "currency" ? "0.00" : ""}
                className={`w-full px-5 py-4 bg-white rounded border border-gray-200 focus:border-blue-500 outline-none transition-all ${type === "currency" ? "pl-10" : ""}`}
            />
            {/* {type === "date" && <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />} */}
        </div>
    </div>
);

const RadioButton = ({ label, active, onClick }) => (
    <label className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${active ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"}`}>
            {active && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
        </div>
        <span className="text-sm">{label}</span>
    </label>
);