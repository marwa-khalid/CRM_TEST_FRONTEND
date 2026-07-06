import React, { useEffect, useState } from "react";
import { useCaseReference } from "../../../hooks/useCaseReference";
import Select from "react-select";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import { PostcodeLookup } from "../../../components/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../components/common/AddressAutocomplete";
import {
  createWitness,
  getQuestionnaireStatus,
  sendEmail,
  updateWitness,
} from "../../../services/Accidents/Cards/cards";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../../services/axiosConfig";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import Vector3 from "../../../assets/AutoClaim_icon/Vector-3.svg";
import checkgreen from "../../../assets/AutoClaim_icon/checkgreen.svg";
import pdf from "../../../assets/AutoClaim_icon/pdf.svg";
import download from "../../../assets/AutoClaim_icon/download.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";

export const WitnessDetailsModal = ({
  onClose,
  claimId,
  initialData,
  addNew,
}) => {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [sentMethods, setSentMethods] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Re-entrancy lock shared by BOTH save paths (Save / Save-and-Add and the
  // step-2 send methods). Because a new witness's id is only known after the
  // create POST resolves, without this a double-click / concurrent save would
  // fire createWitness twice and insert duplicate records.
  const busyRef = React.useRef(false);
  // Remember the witness once created, so re-saving / re-sending the link updates
  // the same record instead of inserting a duplicate.
  const [savedWitnessId, setSavedWitnessId] = useState<number | string | null>(
    initialData?.id ?? null,
  );
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);

  const claimRef = useCaseReference(claimId); // per-claim ref (was localStorage)

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
      questionnaireReceived: "No",
    },
  );

  const inputStyles =
    "hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors placeholder:font-['Stack_Sans_Headline']";

  const titleOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ].sort((a, b) => String(a.label).localeCompare(String(b.label)));

  const methods = [
    {
      id: "pdf",
      label: "Email as PDF Attachment",
      successText: "Email Sent",
      icon: Vector3,
    },
    {
      id: "link",
      label: "Send Secure Digital Form Link",
      successText: "Questionnaire Sent",
      icon: Vulnerable,
    },
    {
      id: "download",
      label: "Download for Postal Delivery",
      successText: "Downloaded",
      icon: download,
    },
  ];

  const formatWitnessDate = (dateString?: string) => {
    if (!dateString) return "";
    // Ensure UTC timestamps from the DB are parsed as UTC, not local time
    const normalized =
      dateString.endsWith("Z") || dateString.includes("+")
        ? dateString
        : dateString + "Z";
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "";
    return date
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const getCurrentTimestamp = () => {
    return new Date()
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    let formatted = digits.substring(0, 4);

    if (digits.length > 4) {
      formatted += " " + digits.substring(4, 11);
    }

    setWitness({ ...witness, telephone: formatted });
  };

  const saveWitness = async () => {
    const cleanPhone = `+44${(witness.telephone || "").replace(/\s/g, "")}`;

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
      delivery_method: selectedMethod,
    };

    // savedWitnessId is the single source of truth for the current record
    // (seeded from initialData) — so resetting it starts a brand-new witness.
    if (savedWitnessId) {
      await updateWitness(savedWitnessId, payload);
      return savedWitnessId;
    }

    const response = await createWitness(payload);
    const newId = response?.id || response?.data?.id;
    if (newId) setSavedWitnessId(newId);
    return newId;
  };

  const resetForNewWitness = () => {
    setWitness({
      title: null,
      firstName: "",
      surname: "",
      address: "",
      postCode: "",
      email: "",
      telephone: "",
      isIndependent: "Yes",
      questionnaireReceived: "No",
    });
    setSavedWitnessId(null);
    setStep(1);
    setSelectedMethod(null);
    setSentMethods({});
    setQuestionnaireId(null);
    setDeepLink("");
  };

  const handleAction = async (addNext) => {
    if (busyRef.current) return; // ignore double-clicks / concurrent saves
    busyRef.current = true;
    setSaving(true);
    try {
      const wasExisting = !!savedWitnessId;
      await saveWitness();
      toast.success(
        wasExisting
          ? "Witness updated successfully"
          : "Witness added successfully",
      );

      if (addNext) {
        // Open a fresh, empty witness form for the next entry.
        resetForNewWitness();
      } else {
        onClose();
      }
    } catch {
      toast.error("Error saving witness details");
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  };

  const handleViewQuestionnaire = () => {
    // Show the actual questionnaire PDF that gets emailed, so the user can see
    // exactly how it looks.
    window.open(
      `${API_BASE_URL}/witnesses/questionnaire-preview`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleFunctionality = async (method: any) => {
    if (!witness.email && method.id !== "download") {
      toast.error("Please enter witness email first");
      return;
    }
    if (busyRef.current) return; // a save (or another send) is already in flight
    busyRef.current = true;
    setIsProcessing(true);
    setProcessingMethod(method.id);

    try {
      const witnessId = await saveWitness();

      if (method.id === "pdf" || method.id === "link" || method.id === "download") {
        const res = await sendEmail(
          witness.email || "",
          claimId,
          `${witness.firstName} ${witness.surname}`,
          claimRef,
          method,
          witnessId,
        );

        if (method.id === "link" && res?.deep_link) {
          navigator.clipboard.writeText(res.deep_link);
        }

        if (method.id === "download" && res?.zip_base64) {
          const bytes = Uint8Array.from(atob(res.zip_base64), (c) => c.charCodeAt(0));
          const blob = new Blob([bytes], { type: "application/zip" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = res.filename || "Witness-Documents.zip";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      const timestamp = getCurrentTimestamp();

      setSentMethods((prev) => ({
        ...prev,
        [method.id]: timestamp,
      }));

      setSelectedMethod(method.id);

      toast.success(
        method.id === "pdf"
          ? "Email sent successfully"
          : method.id === "link"
            ? "Questionnaire link sent successfully"
            : "Documents downloaded successfully",
      );
    } catch {
      toast.error("Failed to process request");
    } finally {
      busyRef.current = false;
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  useEffect(() => {
    const fetchQuestionnaireStatus = async () => {
      const witnessId = initialData?.id || savedWitnessId;
      if (!claimId || !witnessId) return;

      try {
        const res = await getQuestionnaireStatus(claimId, witnessId);

        if (!res) return;

        if (res.status === "sent" && res.sent_at) {
          setSentMethods((prev) => ({
            ...prev,
            link: formatWitnessDate(res.sent_at),
          }));
        }

        if (res.status === "opened" && res.opened_at) {
          setSentMethods((prev) => ({
            ...prev,
            link: formatWitnessDate(res.opened_at),
          }));
        }

        if (res.status === "completed" && res.completed_at) {
          setSentMethods((prev) => ({
            ...prev,
            link: formatWitnessDate(res.completed_at),
          }));

          setWitness((prev) => ({
            ...prev,
            questionnaireReceived: "Yes",
          }));
        }
      } catch (error) {
        console.error("Failed to fetch questionnaire status:", error);
      }
    };

    fetchQuestionnaireStatus();
  }, [claimId, initialData?.id, savedWitnessId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4 font-['Stack_Sans_Headline']">
      <div className="WitnessDetails w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
            Witness Details
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className={`w-3 h-3 rounded-full transition-colors ${
                step === 1 ? "bg-blue-500" : "bg-zinc-300 hover:bg-zinc-400"
              }`}
            />

            <button
              onClick={() => setStep(2)}
              className={`w-3 h-3 rounded-full transition-colors ${
                step === 2 ? "bg-blue-500" : "bg-zinc-300 hover:bg-zinc-400"
              }`}
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

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
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
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  First Name
                </label>

                <input
                  type="text"
                  placeholder="Enter First Name"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                  value={witness.firstName}
                  onChange={(e) =>
                    setWitness({ ...witness, firstName: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Surname
                </label>

                <input
                  type="text"
                  placeholder="Enter Last Name"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                  value={witness.surname}
                  onChange={(e) =>
                    setWitness({ ...witness, surname: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Address
              </label>

              <AddressAutocomplete
                address={witness.address || ""}
                onChange={(v) => setWitness({ ...witness, address: v })}
                onPlaceSelected={(place) => setWitness({ ...witness, address: place.address, postCode: place.postcode })}
                inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Post Code
                </label>

                <PostcodeLookup
                  postcode={witness.postCode}
                  onChange={(v) => setWitness({ ...witness, postCode: v })}
                  onAddressSelect={(addr) => setWitness({ ...witness, postCode: addr.postcode, address: [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", ") })}
                  inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter Email"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                  value={witness.email}
                  onChange={(e) =>
                    setWitness({ ...witness, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-normal">
                  Telephone
                </label>

                <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                  <span className="text-gray-400 text-base">+44</span>

                  <input
                    type="tel"
                    className="w-full bg-transparent outline-none text-neutral-900 mb-0.5 font-light placeholder:text-gray-300"
                    value={witness.telephone}
                    onChange={handlePhoneChange}
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-black text-sm font-weight-400">
                  Witness Independent?
                </label>

                <div className="h-[52px] flex items-center gap-5">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="witnessIndependent"
                          className="sr-only"
                          checked={witness.isIndependent === option}
                          onChange={() =>
                            setWitness({
                              ...witness,
                              isIndependent: option,
                            })
                          }
                        />

                        {witness.isIndependent === option ? (
                          <img src={Yes} alt="" />
                        ) : (
                          <img src={No} alt="" />
                        )}
                      </div>

                      <span className="text-black text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-gray-100 flex flex-col gap-6">
            <div className="px-4 py-2 bg-neutral-100 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src={pdf} alt="" />

                <span className="text-blue-500 text-base font-normal">
                  Questionnaire for Witness
                </span>
              </div>

              <button
                className="text-blue-500 text-sm font-normal hover:underline"
                onClick={handleViewQuestionnaire}
              >
                View
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {methods.map((method) => {
                const isSent = !!sentMethods[method.id];
                const hasAnythingBeenSent = Object.keys(sentMethods).length > 0;
                const shouldLookGrey = hasAnythingBeenSent && !isSent;
                const isCurrentActionLoading = processingMethod === method.id;
                const loadingText =
                  method.id === "download"
                    ? "Preparing download..."
                    : method.id === "link"
                      ? "Sending link..."
                      : "Sending email...";

                return (
                  <div key={method.id} className="w-full">
                    <button
                      type="button"
                      onClick={() => handleFunctionality(method)}
                      disabled={isProcessing || saving}
                      className={`w-full px-4 py-3 rounded-lg flex justify-between items-center transition-all group ${
                        isCurrentActionLoading
                          ? "bg-neutral-100"
                          : shouldLookGrey
                          ? "opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:bg-gray-50"
                          : "hover:bg-gray-50"
                      } ${
                        isProcessing && !isCurrentActionLoading
                          ? "opacity-50 grayscale cursor-not-allowed"
                          : isProcessing
                            ? "cursor-wait"
                            : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img src={method.icon} alt="" className="w-5 h-5" />

                        <span
                          className={`text-sm font-normal ${
                            isSent ? "text-gray-900" : "text-blue-500"
                          }`}
                        >
                          {method.label}
                        </span>
                      </div>

                      {isCurrentActionLoading ? (
                        <div className="flex items-center gap-2 rounded bg-neutral-200 px-3 py-1.5 text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />

                          <span className="text-xs font-normal">
                            {loadingText}
                          </span>
                        </div>
                      ) : isSent && (
                        <div className="flex items-center gap-2">
                          <img src={checkgreen} alt="" />

                          <span className="text-gray-500 text-xs font-normal">
                            {method.successText}: {sentMethods[method.id]}
                          </span>
                        </div>
                      )}
                    </button>

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
                  disabled={saving || isProcessing}
                  className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                {addNew && (
                  <button
                    onClick={() => handleAction(true)}
                    disabled={saving || isProcessing}
                    className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Save and Add Next Witness
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
