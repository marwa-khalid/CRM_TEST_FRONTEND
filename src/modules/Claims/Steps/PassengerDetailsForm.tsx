import { useEffect, useState } from "react";
import Select from "react-select";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { AddressAutocomplete } from "../../../claims/common/AddressAutocomplete";
import { PostcodeLookup } from "../../../claims/common/PostcodeLookup";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import {
  createPassenger,
  updatePassenger,
  deletePassenger,
  getPassengerById,
} from "../../../services/Accidents/Cards/cards";
import { useReportCompletion } from "../Components/ClaimCompletion";

type TitleOption = { value: string; label: string };
type PassengerCard = {
  id?: number;
  title: TitleOption | null;
  firstName: string;
  surname: string;
  address: string;
  postCode: string;
  email: string;
  telephone: string;
};

const EMPTY: PassengerCard = {
  title: null,
  firstName: "",
  surname: "",
  address: "",
  postCode: "",
  email: "",
  telephone: "",
};

const titleOptions: TitleOption[] = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
].sort((a, b) => a.label.localeCompare(b.label));

// UK phone formatting: 4 digits, space, up to 6 more (matches the old modal).
const formatUKNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  let formatted = digits.substring(0, 4);
  if (digits.length > 4) formatted += " " + digits.substring(4, 11);
  return formatted;
};

const inputStyles =
  "hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors";
const inputBox = `w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`;
const labelCls = "text-neutral-700 text-[14px] font-weight-500";

export const PassengerDetailsForm = ({ formRef, claimId }: any) => {
  const [passengers, setPassengers] = useState<PassengerCard[]>([{ ...EMPTY }]);

  const fromRecord = (r: any): PassengerCard => {
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
    };
  };

  const load = async () => {
    if (!claimId) return;
    try {
      const resp: any = await getPassengerById(Number(claimId));
      const data = Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.passengers)
          ? resp.passengers
          : Array.isArray(resp?.data)
            ? resp.data
            : [];
      setPassengers(data.length ? data.map(fromRecord) : [{ ...EMPTY }]);
    } catch {
      setPassengers([{ ...EMPTY }]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const update = (idx: number, patch: Partial<PassengerCard>) =>
    setPassengers((ps) => ps.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const addPassenger = () => setPassengers((ps) => [...ps, { ...EMPTY }]);

  const removePassenger = async (idx: number) => {
    const p = passengers[idx];
    if (p.id) {
      try {
        await deletePassenger(p.id);
        toast.success("Passenger deleted successfully");
      } catch {
        toast.error("Failed to delete passenger");
        return;
      }
    }
    setPassengers((ps) =>
      ps.length > 1 ? ps.filter((_, i) => i !== idx) : [{ ...EMPTY }],
    );
  };

  const toPayload = (p: PassengerCard) => ({
    claim_id: Number(claimId),
    first_name: p.firstName,
    surname: p.surname,
    gender: p.title?.value || "Mr",
    address: {
      address: p.address,
      postcode: p.postCode,
      mobile_tel: p.telephone ? `+44${p.telephone.replace(/\s/g, "")}` : "",
      email: p.email,
    },
  });

  const hasData = (p: PassengerCard) =>
    Boolean(p.firstName.trim() || p.surname.trim() || p.address.trim());

  // Save & Next / sidebar navigation calls this via formRef.
  const submitForm = async () => {
    const toSave = passengers.filter(hasData);
    for (const p of toSave) {
      if (p.id) await updatePassenger(p.id, toPayload(p));
      else await createPassenger(toPayload(p));
    }
    toast.success("Passenger details saved successfully");
    await load();
  };

  // Keep the ref pointing at a submitForm that closes over the latest state.
  useEffect(() => {
    if (formRef) formRef.current = { submitForm };
  });

  // Sidebar green check: complete when every card is either empty or has a name.
  useReportCompletion(
    passengers.every((p) => !hasData(p) || (p.firstName.trim() && p.surname.trim())),
  );

  return (
    <div className="w-full flex flex-col gap-6 font-['Stack_Sans_Headline'] py-1">
      <div className="flex justify-between items-center">
        <h1 className="text-black text-2xl font-semibold leading-6">
          Passenger Details
        </h1>
        <button
          type="button"
          onClick={addPassenger}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded text-blue-500 text-sm font-normal hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another passenger
        </button>
      </div>

      {passengers.map((p, idx) => (
        <div
          key={p.id ?? `new-${idx}`}
          className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 relative"
        >
          {(passengers.length > 1 || p.id) && (
            <button
              type="button"
              onClick={() => removePassenger(idx)}
              className="absolute top-4 right-4 p-1 hover:bg-red-50 rounded"
              title="Remove passenger"
            >
              <img src={trash} className="w-4 h-4" alt="remove" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Title</label>
              <Select
                options={titleOptions}
                value={
                  titleOptions.find((o) => o.value === p.title?.value) || null
                }
                placeholder="Select Title"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
                onChange={(opt) => update(idx, { title: opt as TitleOption })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>First Name</label>
              <input
                type="text"
                placeholder="Enter First Name"
                className={inputBox}
                value={p.firstName}
                onChange={(e) => update(idx, { firstName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Surname</label>
              <input
                type="text"
                placeholder="Enter Last Name"
                className={inputBox}
                value={p.surname}
                onChange={(e) => update(idx, { surname: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Address</label>
            <AddressAutocomplete
              address={p.address || ""}
              onChange={(v) => update(idx, { address: v })}
              onPlaceSelected={(place) =>
                update(idx, { address: place.address, postCode: place.postcode })
              }
              placeholder="Passenger's Address"
              inputClassName={inputBox}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Post Code</label>
              <PostcodeLookup
                postcode={p.postCode}
                onChange={(v) => update(idx, { postCode: v })}
                onAddressSelect={(addr: any) =>
                  update(idx, {
                    postCode: addr.postcode,
                    address: [addr.line1, addr.line2, addr.line3]
                      .filter(Boolean)
                      .join(", "),
                  })
                }
                inputClassName={inputBox}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                placeholder="Enter Email"
                className={inputBox}
                value={p.email}
                onChange={(e) => update(idx, { email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Telephone</label>
              <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base">+44</span>
                <input
                  type="tel"
                  className="w-full bg-transparent outline-none text-neutral-900 font-light placeholder:text-gray-300"
                  value={p.telephone}
                  maxLength={11}
                  onChange={(e) =>
                    update(idx, { telephone: formatUKNumber(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PassengerDetailsForm;
