import React, { useEffect, useState } from "react";
import Select from "react-select";
import { X, ChevronLeft } from "lucide-react";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import {
  createWitness,
  getQuestionnaireStatus,
  sendEmail,
  updateWitness,
} from "../../../services/Accidents/Cards/cards";
import { toast } from "react-toastify";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import Vector3 from "../../../assets/AutoClaim_icon/Vector-3.svg";
import checkgreen from "../../../assets/AutoClaim_icon/checkgreen.svg";
import pdf from "../../../assets/AutoClaim_icon/pdf.svg";
import download from "../../../assets/AutoClaim_icon/download.svg";
import Letter from "../../../assets/documents/letter.pdf";
import Questionnaire from "../../../assets/documents/questionnaire.pdf";
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
  const [questionnaireId, setQuestionnaireId] = useState<number | null>(null);
  const [deepLink, setDeepLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const claimRef = localStorage.getItem("CaseReference");

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
  ];

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

    const date = new Date(dateString);

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

    if (initialData?.id) {
      await updateWitness(initialData.id, payload);
      return initialData.id;
    }

    const response = await createWitness(payload);
    return response?.id || response?.data?.id;
  };

  const handleAction = async (addNext) => {
    try {
      await saveWitness();
      toast.success(
        initialData?.id
          ? "Witness updated successfully"
          : "Witness added successfully",
      );

      if (!addNext) {
        onClose();
      }
    } catch (error) {
      toast.error("Error saving witness details");
    }
  };

  const handleViewQuestionnaire = () => {
    if (questionnaireId) {
   
      window.open(`/questionnaire/view/${questionnaireId}`, "_blank");
      return;
    }

    if (deepLink) {
      window.open(`${deepLink}?readonly=true`, "_blank", "noreferrer");
      return;
    }

    window.open("/questionnaire/step-1?readonly=true", "_blank", "noreferrer");
  };

  const handleDownloadPostal = () => {
    const letterLink = document.createElement("a");
    letterLink.href = Letter;
    letterLink.download = "Letter.pdf";
    document.body.appendChild(letterLink);
    letterLink.click();
    document.body.removeChild(letterLink);

    const questionnaireLink = document.createElement("a");
    questionnaireLink.href = Questionnaire;
    questionnaireLink.download = "Questionnaire.pdf";
    document.body.appendChild(questionnaireLink);
    questionnaireLink.click();
    document.body.removeChild(questionnaireLink);
  };

  const handleFunctionality = async (method: any) => {
    setIsProcessing(true);

    try {
      if (!witness.email && method.id !== "download") {
        toast.error("Please enter witness email first");
        return;
      }

      if (method.id === "pdf" || method.id === "link") {
        const res = await sendEmail(
          witness.email,
          claimId,
          `${witness.firstName} ${witness.surname}`,
          claimRef,
          method,
        );

        if (method.id === "link" && res?.deep_link) {
          setDeepLink(res.deep_link);
          navigator.clipboard.writeText(res.deep_link);
          // toast.success("Secure questionnaire link sent and copied");
        }

        if (res?.claim_questionnaire_id) {
          setQuestionnaireId(res.claim_questionnaire_id);
        }
      }

      if (method.id === "download") {
        handleDownloadPostal();
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
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchQuestionnaireStatus = async () => {
      if (!claimId || !initialData?.id) return;

      try {
        const res = await getQuestionnaireStatus(claimId, initialData.id);

        if (!res) return;

        if (res.claim_questionnaire_id) {
          setQuestionnaireId(res.claim_questionnaire_id);
        }

        if (res.deep_link) {
          setDeepLink(res.deep_link);
        }

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
  }, [claimId, initialData?.id]);

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
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Post Code
                </label>

                <input
                  type="text"
                  placeholder="Enter Post Code"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
                  value={witness.postCode}
                  onChange={(e) =>
                    setWitness({ ...witness, postCode: e.target.value })
                  }
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

                return (
                  <div key={method.id} className="w-full">
                    <button
                      type="button"
                      onClick={() => handleFunctionality(method)}
                      disabled={isProcessing}
                      className={`w-full px-4 py-3 rounded-lg flex justify-between items-center transition-all group ${
                        shouldLookGrey
                          ? "opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:bg-gray-50"
                          : "hover:bg-gray-50"
                      } ${isProcessing ? "cursor-wait" : "cursor-pointer"}`}
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

                      {isSent && (
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
                  className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700"
                >
                  Save
                </button>

                {addNew && (
                  <button
                    onClick={() => handleAction(true)}
                    className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700"
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
