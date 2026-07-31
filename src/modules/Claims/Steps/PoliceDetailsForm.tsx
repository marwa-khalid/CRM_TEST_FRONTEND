import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { AddressAutocomplete } from "../../../claims/common/AddressAutocomplete";
import { CustomDatePicker } from "../Components/DatePicker";
import {
  createPoliceDetail,
  updatePoliceDetail,
  deletePoliceDetail,
  getPoliceDetails,
} from "../../../services/Accidents/Cards/cards";
import { useReportCompletion } from "../Components/ClaimCompletion";

type PoliceCard = {
  id?: number;
  name: string;
  referenceNo: string;
  stationName: string;
  stationAddress: string;
  incidentReportTaken: "Yes" | "No";
  reportReceivedDate: string; // yyyy-mm-dd
  notes: string;
};

const EMPTY: PoliceCard = {
  name: "",
  referenceNo: "",
  stationName: "",
  stationAddress: "",
  incidentReportTaken: "Yes",
  reportReceivedDate: "",
  notes: "",
};

const localISO = (d: Date) => d.toLocaleDateString("sv-SE");
const inputStyles = "hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors";
const inputBox = `w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`;
const textareaBox = `w-full h-24 px-5 py-4 bg-white rounded text-neutral-700 border border-gray-200 resize-none ${inputStyles}`;
const labelCls = "text-neutral-700 text-[14px] font-weight-500";

export const PoliceDetailsForm = ({ formRef, claimId }: any) => {
  const [police, setPolice] = useState<PoliceCard[]>([{ ...EMPTY }]);
  const [openPicker, setOpenPicker] = useState<number | null>(null);

  const fromRecord = (r: any): PoliceCard => ({
    id: r.id,
    name: r.name || "",
    referenceNo: r.reference_no || "",
    stationName: r.station_name || "",
    stationAddress: r.station_address || "",
    incidentReportTaken: r.incident_report_taken ? "Yes" : "No",
    reportReceivedDate: r.report_received_date
      ? String(r.report_received_date).split("T")[0]
      : "",
    notes: r.additional_info || r.notes || "",
  });

  const load = async () => {
    if (!claimId) return;
    try {
      const resp: any = await getPoliceDetails(Number(claimId));
      const list = Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data : [];
      setPolice(list.length ? list.map(fromRecord) : [{ ...EMPTY }]);
    } catch {
      setPolice([{ ...EMPTY }]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const update = (idx: number, patch: Partial<PoliceCard>) =>
    setPolice((ps) => ps.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const addPolice = () => setPolice((ps) => [...ps, { ...EMPTY }]);

  const removePolice = async (idx: number) => {
    const p = police[idx];
    if (p.id) {
      try {
        await deletePoliceDetail(p.id);
        toast.success("Police detail deleted successfully");
      } catch {
        toast.error("Failed to delete police detail");
        return;
      }
    }
    setPolice((ps) => (ps.length > 1 ? ps.filter((_, i) => i !== idx) : [{ ...EMPTY }]));
  };

  const hasData = (p: PoliceCard) =>
    Boolean(p.name.trim() || p.referenceNo.trim() || p.stationName.trim() || p.stationAddress.trim());

  const toPayload = (p: PoliceCard) => ({
    claim_id: claimId,
    name: p.name,
    reference_no: p.referenceNo,
    station_name: p.stationName,
    station_address: p.stationAddress,
    incident_report_taken: p.incidentReportTaken === "Yes",
    report_received_date: p.reportReceivedDate || null,
    additional_info: p.notes,
  });

  const submitForm = async () => {
    for (const p of police) {
      if (!hasData(p)) continue;
      if (p.id) await updatePoliceDetail(p.id, toPayload(p));
      else await createPoliceDetail(toPayload(p));
    }
    toast.success("Police details saved successfully");
    await load();
  };

  useEffect(() => {
    if (formRef) formRef.current = { submitForm };
  });

  useReportCompletion(police.every((p) => !hasData(p) || p.name.trim()));

  return (
    <div className="w-full flex flex-col gap-6 font-['Stack_Sans_Headline'] py-1">
      <div className="flex justify-between items-center">
        <h1 className="text-black text-2xl font-semibold leading-6">Police Details</h1>
        <button
          type="button"
          onClick={addPolice}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded text-blue-500 text-sm font-normal hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another Police
        </button>
      </div>

      {police.map((p, idx) => (
        <div key={p.id ?? `new-${idx}`} className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 relative">
          {(police.length > 1 || p.id) && (
            <button
              type="button"
              onClick={() => removePolice(idx)}
              className="absolute top-4 right-4 p-1 hover:bg-red-50 rounded"
              title="Remove police detail"
            >
              <img src={trash} className="w-4 h-4" alt="remove" />
            </button>
          )}

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Police Constable Name</label>
            <input type="text" placeholder="Enter Full Name" className={inputBox} value={p.name} onChange={(e) => update(idx, { name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Reference No.</label>
              <input type="text" placeholder="Enter Ref. No." className={inputBox} value={p.referenceNo} onChange={(e) => update(idx, { referenceNo: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Police Station Name</label>
              <input type="text" placeholder="Enter Police Station" className={inputBox} value={p.stationName} onChange={(e) => update(idx, { stationName: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Police Station Address</label>
            <AddressAutocomplete
              address={p.stationAddress || ""}
              onChange={(v) => update(idx, { stationAddress: v })}
              onPlaceSelected={(place) => update(idx, { stationAddress: place.address })}
              placeholder="Police Station Address"
              inputClassName={inputBox}
            />
          </div>

          <div className="grid grid-cols-2 gap-5 items-start">
            <div className="flex flex-col gap-4">
              <label className="text-black text-sm font-weight-400">Incident Report Taken?</label>
              <div className="flex items-center gap-5">
                {(["Yes", "No"] as const).map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <img src={p.incidentReportTaken === option ? Yes : No} alt="" onClick={() => update(idx, { incidentReportTaken: option })} />
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className={labelCls}>Report Received Date</label>
              <div
                onClick={() => setOpenPicker(openPicker === idx ? null : idx)}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              >
                <span className={p.reportReceivedDate ? "text-gray-900 font-light" : "text-gray-300 font-light"}>
                  {p.reportReceivedDate || "Date"}
                </span>
                <img src={Vector6} className="w-4 h-4" alt="calendar" />
              </div>
              {openPicker === idx && (
                <div className="absolute top-[80px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                  <CustomDatePicker
                    selectedDate={p.reportReceivedDate ? new Date(p.reportReceivedDate) : new Date()}
                    onDateSelect={(date: Date) => {
                      if (date <= new Date()) {
                        update(idx, { reportReceivedDate: localISO(date) });
                        setOpenPicker(null);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Notes</label>
            <textarea placeholder="Add Notes" className={textareaBox} value={p.notes} onChange={(e) => update(idx, { notes: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PoliceDetailsForm;
