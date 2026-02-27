
import React, { useState } from "react";
import Select from "react-select";
import { X,ChevronLeft } from "lucide-react";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import {
  createWitness,
  sendEmail,
  updateWitness,
} from "../../../services/Accidents/Cards/Cards";
import { toast } from "react-toastify";
import Vulnerable from '../../../assets/AutoClaim_icon/Vulnerable.svg'
import Vector3 from '../../../assets/AutoClaim_icon/Vector-3.svg'
import type2 from "../../../assets/AutoClaim_icon/type2.svg";
import checkgreen from "../../../assets/AutoClaim_icon/checkgreen.svg";
import pdf from '../../../assets/AutoClaim_icon/pdf.svg'
import download from '../../../assets/AutoClaim_icon/download.svg'
import Letter from '../../../assets/documents/letter.pdf';
import Questionnaire from '../../../assets/documents/questionnaire.pdf';
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";

export const WitnessDetailsModal = ({ onClose, claimId, initialData }) => {
  // New state to manage pagination
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const [witness, setWitness] = useState(
    initialData || {
      title: null,
      firstName: "",
      surname: "",
      address: "",
      postCode: "",
      email: "",
      telephone: "",
      isIndependent: "Yes",
    },
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    let formatted = digits.substring(0, 5);
    if (digits.length > 5) formatted += " " + digits.substring(5, 11);
    setWitness({ ...witness, telephone: formatted });
  };
const SentStatusRow = ({
  label,
  timestamp,
}: {
  label: string;
  timestamp: string;
}) => (
  <div className="self-stretch px-4 py-2 rounded-lg inline-flex justify-between items-center w-full bg-white">
    <div className="flex justify-start items-center gap-4">
      <img src={Vector3} alt="" />
      <span className="text-gray-900 text-sm font-normal font-['Stack_Sans_Headline']">
        {label}
      </span>
    </div>
    <div className="flex justify-start items-center gap-2">
      <img src={checkgreen} alt="" />

      <span className="text-gray-500 text-xs font-normal font-['Stack_Sans_Headline']">
        Questionnaire Sent: {timestamp}
      </span>
    </div>
  </div>
)
  const handleAction = async (addNext = false) => {
    try {
      const cleanPhone = `+44${witness.telephone.replace(/\s/g, "")}`;
      const payload = {
        claim_id: claimId,
        first_name: witness.firstName,
        surname: witness.surname,
        gender: witness.title?.value || "Mr",
        witness_independent: witness.isIndependent === "Yes",
        address: {
          address: witness.address,
          postcode: witness.postCode,
          mobile_tel: cleanPhone,
          email: witness.email,
        },
        // You can now include selectedMethod in the payload if your API supports it
        delivery_method: selectedMethod,
      };

      if (initialData?.id) {
        await updateWitness(initialData.id, payload);
        toast.success("Witness updated successfully");
      } else {
        await createWitness(payload);
        toast.success("Witness added successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Error saving witness details");
    }
  };
  const [sentMethods, setSentMethods] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFunctionality = async (option: any) => {
    setIsProcessing(true);
    try {
      if (option.id === "pdf") {
        const res = await sendEmail(
          witness.email,
          claimId,
          witness.firstName,
          "1234ref",
          option,
        );
      }
      else if (option.id === "download") {
        const link = document.createElement("a");
        link.href = Letter;
        // Set the extension to .docx to match your import
        link.download = "Letter.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        link.href = Questionnaire;
        // Set the extension to .docx to match your import
        link.download = "Questionnaire.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
        // Format timestamp: 02-10-26  5:25PM
        const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear().toString().slice(-2)}  ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;

      // If PDF (Option 1) is clicked, we mark "link" (Option 2) as sent
      if (option.id === "pdf") {
        setSentMethods({ link: timestamp });
      } else {
        setSentMethods({ [option.id]: timestamp });
      }

      toast.success("Action completed successfully");
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setIsProcessing(false);
    }
  };
  const titleOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4 font-['Stack_Sans_Headline']">
      <div className="WitnessDetails w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Header with Navigable Dots */}
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
            Witness Details
          </h2>
          <div className="flex items-center gap-3">
            {/* Dot 1: Form */}
            <button
              onClick={() => setStep(1)}
              className={`w-3 h-3 rounded-full transition-colors ${step === 1 ? "bg-blue-500" : "bg-zinc-300 hover:bg-zinc-400"}`}
            />
            {/* Dot 2: Questionnaire */}
            <button
              onClick={() => setStep(2)}
              className={`w-3 h-3 rounded-full transition-colors ${step === 2 ? "bg-blue-500" : "bg-zinc-300 hover:bg-zinc-400"}`}
            />
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Conditional Rendering based on Step */}
        {step === 1 ? (
          /* STEP 1: THE FORM */
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400">
                  Title
                </label>
                <Select
                  options={titleOptions}
                  value={titleOptions.find(
                    (opt) => opt.value === witness.title?.value,
                  )}
                  placeholder="Select Title"
                  styles={customStyles}
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                  onChange={(opt) => setWitness({ ...witness, title: opt })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Enter First Name"
                  className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-['system-ui'] focus-within:border-blue-500 transition-all"
                  value={witness.firstName}
                  onChange={(e) =>
                    setWitness({ ...witness, firstName: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400">
                  Surname
                </label>
                <input
                  type="text"
                  placeholder="Enter Last Name"
                  className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-['system-ui'] focus-within:border-blue-500 transition-all"
                  value={witness.surname}
                  onChange={(e) =>
                    setWitness({ ...witness, surname: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Address
              </label>
              <LeafletAutocompleteMap
                showMap={false}
                disabled={false}
                apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                address={witness.address}
                onPlaceSelected={(place) => {
                  if (place.address) {
                    setWitness({
                      ...witness,
                      address: place.address,
                      postCode: place.postalCode || "",
                    });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400">
                  Post Code
                </label>
                <input
                  type="text"
                  placeholder="Enter Post Code"
                  className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-['system-ui'] focus-within:border-blue-500 transition-all"
                  value={witness.postCode}
                  onChange={(e) =>
                    setWitness({ ...witness, postCode: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-['system-ui'] focus-within:border-blue-500 transition-all"
                  value={witness.email}
                  onChange={(e) =>
                    setWitness({ ...witness, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="w-96 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-normal">
                Telephone
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-5 text-gray-700 pr-3">
                  +44
                </span>
                <input
                  type="tel"
                  className="w-full h-[52px] px-5 pl-16 pr-5  bg-white rounded border border-gray-200 text-gray-600 font-['system-ui'] focus-within:border-blue-500 transition-all"
                  // className="w-full pl-16 pr-5 py-4 border border-gray-200 rounded text-base focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={witness.telephone}
                  onChange={handlePhoneChange}
                  maxLength={12}
                />
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: THE QUESTIONNAIRE (CONVERTED DATA) */
          <div className="p-3 rounded-lg border border-gray-100 flex flex-col gap-6">
            <div className="px-4 py-2 bg-neutral-100 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src={pdf} alt="" />
                <span className="text-blue-500 text-base font-normal">
                  Questionnaire for Witness
                </span>
              </div>
              <button className="text-blue-500 text-sm font-normal hover:underline">
                View
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { id: "pdf", label: "Email as PDF Attachment", icon: Vector3 },
                {
                  id: "link",
                  label: "Send Secure Digital Form Link",
                  icon: Vulnerable,
                },
                {
                  id: "download",
                  label: "Download for Postal Delivery",
                  icon: download,
                },
              ].map((method) => {
                const isSent = !!sentMethods[method.id];

                // Logic: If ANY method is sent, others are disabled.
                // Specifically, if "link" is the one showing "Sent", PDF and Download are disabled.
                const hasAnythingBeenSent = Object.keys(sentMethods).length > 0;
                const isDisabled = hasAnythingBeenSent && !isSent;

                return (
                  <div key={method.id} className="w-full">
                    {isSent ? (
                      /* CONVERTED UI: SHOWS STATUS */
                      <div className="self-stretch px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <img
                            src={method.icon}
                            className="w-5 h-5 grayscale"
                            alt=""
                          />
                          <span className="text-gray-900 text-sm font-normal">
                            {method.label}
                          </span>
                        </div>
                        {method.id !== "download" &&
                          <div className="flex items-center gap-2">
                            <img src={checkgreen} alt="" />
                            <span className="text-gray-500 text-xs font-normal">
                              Questionnaire Sent: {sentMethods[method.id]}
                            </span>
                          </div>}
                      </div>
                    ) : (
                      /* ACTIONABLE BUTTON */
                      <button
                        onClick={() => handleFunctionality(method)}
                        disabled={isProcessing || isDisabled}
                        className={`w-full px-4 py-3 rounded-lg flex items-center gap-4 transition-all 
              ${isDisabled ? "opacity-40 cursor-not-allowed grayscale" : "border-transparent hover:bg-gray-50"}
            `}
                      >
                        <img src={method.icon} alt="" className="w-5 h-5" />
                        <span className="text-blue-500 text-sm font-normal">
                          {method.label}
                        </span>
                        {isProcessing && <img src={type2} />}
                      </button>
                    )}
                    {/* Line Separator (Optional, matches your layers) */}
                    {method.id !== "download" && (
                      <div className="h-px bg-gray-100 w-full my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100 w-full" />

        {/* Action Buttons */}
        <div className="flex justify-between items-center w-full">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-blue-300 hover:text-blue-600 text-sm font-normal transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Details
              </button>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-weight-400 hover:bg-blue-50 transition-colors"
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700"
              >
                Send Questionnaire
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAction(false)}
                  className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => handleAction(true)}
                  className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700"
                >
                  Save and Add Next Witness
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};