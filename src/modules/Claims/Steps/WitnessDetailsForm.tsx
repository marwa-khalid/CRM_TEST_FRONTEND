import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { Plus, Mail, Link2, Download, Loader2, Check } from "lucide-react";
import { toast } from "react-toastify";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import { AddressAutocomplete } from "../../../claims/common/AddressAutocomplete";
import { PostcodeLookup } from "../../../claims/common/PostcodeLookup";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import { useCaseReference } from "../../../hooks/useCaseReference";
import { API_BASE_URL } from "../../../services/axiosConfig";
import {
  createWitness,
  updateWitness,
  deleteWitness,
  getWitnesses,
  getQuestionnaireStatus,
  sendEmail,
} from "../../../services/Accidents/Cards/cards";
import { useReportCompletion } from "../Components/ClaimCompletion";

type TitleOption = { value: string; label: string };
type WitnessCard = {
  id?: number;
  title: TitleOption | null;
  firstName: string;
  surname: string;
  address: string;
  postCode: string;
  email: string;
  telephone: string;
  isIndependent: "Yes" | "No";
  sent: Record<string, string>;
};

const EMPTY: WitnessCard = {
  title: null,
  firstName: "",
  surname: "",
  address: "",
  postCode: "",
  email: "",
  telephone: "",
  isIndependent: "Yes",
  sent: {},
};

const titleOptions: TitleOption[] = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
].sort((a, b) => a.label.localeCompare(b.label));

const METHODS = [
  { id: "pdf", label: "Email as PDF Attachment", success: "Email Sent", Icon: Mail },
  { id: "link", label: "Send Secure Digital Form Link", success: "Questionnaire Sent", Icon: Link2 },
  { id: "download", label: "Download for Postal Delivery", success: "Downloaded", Icon: Download },
];

const formatUKNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  let f = digits.substring(0, 4);
  if (digits.length > 4) f += " " + digits.substring(4, 11);
  return f;
};

const fmtDate = (s?: string) => {
  if (!s) return "";
  const norm = s.endsWith("Z") || s.includes("+") ? s : s + "Z";
  const d = new Date(norm);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", "");
};

const inputStyles =
  "hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors";
const inputBox = `w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`;
const labelCls = "text-neutral-700 text-[14px] font-weight-500";

export const WitnessDetailsForm = ({ formRef, claimId }: any) => {
  const [witnesses, setWitnesses] = useState<WitnessCard[]>([{ ...EMPTY }]);
  const [processing, setProcessing] = useState<{ idx: number; method: string } | null>(null);
  const claimRef = useCaseReference(claimId);
  const busyRef = useRef(false);

  const fromRecord = (r: any): WitnessCard => {
    const rawPhone = (r.address?.mobile_tel || "").replace("+44", "");
    return {
      id: r.id,
      title: r.gender ? { value: r.gender, label: r.gender } : null,
      firstName: r.first_name || "",
      surname: r.surname || "",
      address: r.address?.address || "",
      postCode: r.address?.postcode || "",
      email: r.address?.email || "",
      telephone: formatUKNumber(rawPhone),
      isIndependent:
        (r.witness_independent ?? r.is_independent ?? true) ? "Yes" : "No",
      sent: {},
    };
  };

  const load = async () => {
    if (!claimId) return;
    try {
      const resp: any = await getWitnesses(Number(claimId));
      const list = Array.isArray(resp) ? resp : [];
      const cards = list.map(fromRecord);
      setWitnesses(cards.length ? cards : [{ ...EMPTY }]);
      // Seed questionnaire link status per witness.
      cards.forEach(async (c) => {
        if (!c.id) return;
        try {
          const st = await getQuestionnaireStatus(Number(claimId), c.id);
          const at = st?.completed_at || st?.opened_at || st?.sent_at;
          if (at) {
            setWitnesses((ws) =>
              ws.map((w) => (w.id === c.id ? { ...w, sent: { ...w.sent, link: fmtDate(at) } } : w)),
            );
          }
        } catch {
          /* ignore */
        }
      });
    } catch {
      setWitnesses([{ ...EMPTY }]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const update = (idx: number, patch: Partial<WitnessCard>) =>
    setWitnesses((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));

  const addWitness = () => setWitnesses((ws) => [...ws, { ...EMPTY }]);

  const removeWitness = async (idx: number) => {
    const w = witnesses[idx];
    if (w.id) {
      try {
        await deleteWitness(w.id);
        toast.success("Witness deleted successfully");
      } catch {
        toast.error("Failed to delete witness");
        return;
      }
    }
    setWitnesses((ws) => (ws.length > 1 ? ws.filter((_, i) => i !== idx) : [{ ...EMPTY }]));
  };

  const hasData = (w: WitnessCard) =>
    Boolean(w.firstName.trim() || w.surname.trim() || w.address.trim() || w.email.trim());

  const toPayload = (w: WitnessCard) => ({
    claim_id: Number(claimId),
    first_name: w.firstName,
    surname: w.surname,
    gender: w.title?.value || "Mr",
    witness_independent: w.isIndependent === "Yes",
    address: {
      address: w.address,
      postcode: w.postCode,
      mobile_tel: w.telephone ? `+44${w.telephone.replace(/\s/g, "")}` : "",
      email: w.email,
    },
  });

  // Persist one card; returns its backend id (creating if needed).
  const saveCard = async (idx: number): Promise<number | undefined> => {
    const w = witnesses[idx];
    if (w.id) {
      await updateWitness(w.id, toPayload(w));
      return w.id;
    }
    const res: any = await createWitness(toPayload(w));
    const newId = res?.id || res?.data?.id;
    if (newId) update(idx, { id: newId });
    return newId;
  };

  const handleSend = async (idx: number, method: (typeof METHODS)[number]) => {
    const w = witnesses[idx];
    if (!w.email && method.id !== "download") {
      toast.error("Please enter the witness email first");
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    setProcessing({ idx, method: method.id });
    try {
      const witnessId = await saveCard(idx);
      const res: any = await sendEmail(
        w.email || "",
        claimId,
        `${w.firstName} ${w.surname}`,
        claimRef,
        method,
        witnessId,
      );
      if (method.id === "link" && res?.deep_link) navigator.clipboard.writeText(res.deep_link);
      if (method.id === "download" && res?.zip_base64) {
        const bytes = Uint8Array.from(atob(res.zip_base64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename || "Witness-Documents.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      const ts = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", "");
      setWitnesses((ws) => ws.map((x, i) => (i === idx ? { ...x, sent: { ...x.sent, [method.id]: ts } } : x)));
      toast.success(
        method.id === "pdf" ? "Email sent successfully" : method.id === "link" ? "Questionnaire link sent successfully" : "Documents downloaded successfully",
      );
    } catch {
      toast.error("Failed to process request");
    } finally {
      busyRef.current = false;
      setProcessing(null);
    }
  };

  const submitForm = async () => {
    for (let i = 0; i < witnesses.length; i++) {
      if (hasData(witnesses[i])) await saveCard(i);
    }
    toast.success("Witness details saved successfully");
    await load();
  };

  useEffect(() => {
    if (formRef) formRef.current = { submitForm };
  });

  useReportCompletion(
    witnesses.every((w) => !hasData(w) || (w.firstName.trim() && w.surname.trim())),
  );

  const viewQuestionnaire = () =>
    window.open(`${API_BASE_URL}/witnesses/questionnaire-preview`, "_blank", "noopener,noreferrer");

  return (
    <div className="w-full flex flex-col gap-6 font-['Stack_Sans_Headline'] py-1">
      <div className="flex justify-between items-center">
        <h1 className="text-black text-2xl font-semibold leading-6">Witness Details</h1>
        <button
          type="button"
          onClick={addWitness}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded text-blue-500 text-sm font-normal hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another Witness
        </button>
      </div>

      {witnesses.map((w, idx) => (
        <div key={w.id ?? `new-${idx}`} className="flex flex-col gap-6">
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 relative">
            {(witnesses.length > 1 || w.id) && (
              <button
                type="button"
                onClick={() => removeWitness(idx)}
                className="absolute top-4 right-4 p-1 hover:bg-red-50 rounded"
                title="Remove witness"
              >
                <img src={trash} className="w-4 h-4" alt="remove" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Title</label>
                <Select
                  options={titleOptions}
                  value={titleOptions.find((o) => o.value === w.title?.value) || null}
                  placeholder="Select Title"
                  styles={customStyles}
                  components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
                  onChange={(opt) => update(idx, { title: opt as TitleOption })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>First Name</label>
                <input type="text" placeholder="Enter First Name" className={inputBox} value={w.firstName} onChange={(e) => update(idx, { firstName: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Surname</label>
                <input type="text" placeholder="Enter Last Name" className={inputBox} value={w.surname} onChange={(e) => update(idx, { surname: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>Address</label>
              <AddressAutocomplete
                address={w.address || ""}
                onChange={(v) => update(idx, { address: v })}
                onPlaceSelected={(place) => update(idx, { address: place.address, postCode: place.postcode })}
                placeholder="Witness Address"
                inputClassName={inputBox}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Post Code</label>
                <PostcodeLookup
                  postcode={w.postCode}
                  onChange={(v) => update(idx, { postCode: v })}
                  onAddressSelect={(addr: any) => update(idx, { postCode: addr.postcode, address: [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", ") })}
                  inputClassName={inputBox}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Email Address</label>
                <input type="email" placeholder="Enter Email" className={inputBox} value={w.email} onChange={(e) => update(idx, { email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Telephone</label>
                <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                  <span className="text-gray-400 text-base">+44</span>
                  <input type="tel" className="w-full bg-transparent outline-none text-neutral-900 font-light placeholder:text-gray-300" value={w.telephone} maxLength={11} onChange={(e) => update(idx, { telephone: formatUKNumber(e.target.value) })} />
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <label className="text-black text-sm font-medium">Witness Independent?</label>
                <div className="h-[52px] flex items-center gap-5">
                  {(["Yes", "No"] as const).map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <img src={w.isIndependent === option ? Yes : No} alt="" onClick={() => update(idx, { isIndependent: option })} />
                      <span className="text-black text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Questionnaire actions */}
          <div className="self-stretch p-3 rounded-lg border border-gray-100 flex flex-col gap-6">
            <div className="px-4 py-2 bg-neutral-100 rounded-lg flex justify-between items-center">
              <span className="text-blue-500 text-base font-normal">Questionnaire for Witness</span>
              <button type="button" onClick={viewQuestionnaire} className="text-blue-500 text-sm font-normal hover:underline">
                View
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {METHODS.map((m, mi) => {
                const isSent = !!w.sent[m.id];
                const loading = processing?.idx === idx && processing?.method === m.id;
                const anyProcessing = processing?.idx === idx;
                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => handleSend(idx, m)}
                      disabled={anyProcessing}
                      className="w-full px-4 py-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-all disabled:cursor-wait"
                    >
                      <div className="flex items-center gap-4">
                        <m.Icon className="w-5 h-5 text-blue-500" />
                        <span className={`text-sm font-normal ${isSent ? "text-gray-900" : "text-blue-500"}`}>{m.label}</span>
                      </div>
                      {loading ? (
                        <div className="flex items-center gap-2 rounded bg-neutral-200 px-3 py-1.5 text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Processing…</span>
                        </div>
                      ) : (
                        isSent && (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-gray-500 text-xs">{m.success}: {w.sent[m.id]}</span>
                          </div>
                        )
                      )}
                    </button>
                    {mi < METHODS.length - 1 && <div className="h-px bg-gray-100 w-full my-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WitnessDetailsForm;
