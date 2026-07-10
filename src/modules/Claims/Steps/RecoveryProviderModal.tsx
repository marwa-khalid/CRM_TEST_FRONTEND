import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { PostcodeLookup } from "../../../claims/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../claims/common/AddressAutocomplete";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { getRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { CustomDatePicker } from "../Components/DatePicker";

export const RecoveryProviderModal = ({
  onClose,
  claimId,
  initialData,
  formik,
}: any) => {
  const [step, setStep] = useState(1);
  const [showRecoveryDatePicker, setShowRecoveryDatePicker] = useState(false);
   const datepickerRef = useRef<HTMLDivElement>(null);
   const allowDecimalInput = (value: string) => {
     return value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
   };

   const formatTwoDecimals = (value: any) => {
     if (value === "" || value === null || value === undefined) return "0.00";

     const num = Number(value);
     if (Number.isNaN(num)) return "0.00";

     return num.toFixed(2);
   };useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (
         datepickerRef.current &&
         !datepickerRef.current.contains(event.target as Node)
       )
         setShowRecoveryDatePicker(false);
      
     };
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);
  // LOCAL STATE (Buffer): Only push to Parent Formik on "Save"
  const [localData, setLocalData] = useState({
    id: initialData?.id || Date.now(),
    recovery_provider: initialData?.recovery_provider || "",
    name: initialData?.name || "",
    claim_id: parseInt(claimId),
    currency: "GBP",
    date_of_recovery: initialData?.date_of_recovery || null,
    recovery_charges: initialData?.recovery_charges
      ? formatTwoDecimals(initialData.recovery_charges)
      : "0.00",
    address: {
      address: initialData?.address?.address || "",
      postcode: initialData?.address?.postcode || "",
      mobile_tel: initialData?.address?.mobile_tel || "",
      email: initialData?.address?.email || "",
    },
  });
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;

  const handleSave = () => {
    // This is where you pass the local buffer back to the parent's Formik
    const exists = formik.values.recoveries.find((s) => s.id === localData.id);
    const rawNumber = localData.address.mobile_tel.replace("+44 ", "").trim();

    const finalData = {
      ...localData,
      recovery_charges: formatTwoDecimals(localData.recovery_charges),
      address: {
        ...localData.address,
        mobile_tel: rawNumber ? `+44 ${rawNumber}` : "",
      },
    };
    if (exists) {
      formik.setFieldValue(
        "recoveries",
        formik.values.recoveries.map((s) =>
          s.id === finalData.id ? finalData : s,
        ),
      );
    } else {
      formik.setFieldValue("recoveries", [...formik.values.recoveries, finalData]);
    }
    onClose();
  };

  const formatDateLabel = (date: any) => {
    if (!date) return "Select Date";
    return new Date(date).toLocaleDateString("en-GB");
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4 font-['Stack_Sans_Headline']">
      <div className="w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-900 text-[20px] font-weight-600">
            {step === 1
              ? "Recovery Provider Details"
              : "Recovery Provider Billing Details"}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className={`w-3 h-3 rounded-full ${step === 1 ? "bg-blue-500" : "bg-zinc-300"}`}
            />
            <button
              onClick={() => setStep(2)}
              className={`w-3 h-3 rounded-full ${step === 2 ? "bg-blue-500" : "bg-zinc-300"}`}
            />
            <X
              className="w-6 h-6 cursor-pointer text-gray-400"
              onClick={onClose}
            />
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm">
                Network Recovery Provider
              </label>
              <input
                type="text"
                value={localData.recovery_provider}
                onChange={(e) =>
                  setLocalData({ ...localData, recovery_provider: e.target.value })
                }
                placeholder="Enter Company Name"
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm">Name</label>
              <input
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                value={localData.name}
                placeholder="Enter Name"
                onChange={(e) =>
                  setLocalData({ ...localData, name: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm">Address</label>
              <AddressAutocomplete
                address={localData.address.address}
                onChange={(v) => setLocalData({ ...localData, address: { ...localData.address, address: v } })}
                onPlaceSelected={(place) => setLocalData({ ...localData, address: { ...localData.address, address: place.address, postcode: place.postcode } })}
                inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Post Code
                </label>

                <PostcodeLookup
                  postcode={localData.address.postcode}
                  onChange={(v) => setLocalData({ ...localData, address: { ...localData.address, postcode: v } })}
                  onAddressSelect={(addr) => setLocalData({ ...localData, address: { ...localData.address, postcode: addr.postcode, address: [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", ") } })}
                  inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter Email"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={localData.address.email}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      address: {
                        ...localData.address,
                        email: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">Telephone</label>
                <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                  <span className="absolute left-5 text-gray-400 font-weight-300 font-light ">
                    +44
                  </span>
                  <input
                    className="w-full bg-transparent outline-none text-neutral-700 pl-10 font-light placeholder:text-gray-300"
                    value={localData.address.mobile_tel}
                    maxLength={11}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ""); // remove non-digits

                      if (value.length > 4) {
                        value = value.slice(0, 4) + " " + value.slice(4);
                      }

                      setLocalData({
                        ...localData,
                        address: {
                          ...localData.address,
                          mobile_tel: value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 ">
            <div className="grid grid-cols-2 gap-5">
              {/* Start Date */}
              <div className="relative flex flex-col gap-2">
                <label className="text-neutral-700  text-sm font-weight-400">
                  Date of Recovery{" "}
                </label>
                <div
                  onClick={() =>
                    setShowRecoveryDatePicker(!showRecoveryDatePicker)
                  }
                  className="h-[52px] px-5 border rounded flex justify-between items-center cursor-pointer"
                >
                  <span className="font-weight-300 font-light text-neutral-700">
                    {formatDateLabel(localData.date_of_recovery)}
                  </span>
                  <img src={Vector6} alt="cal" />
                </div>
                {showRecoveryDatePicker && (
                  <div className="absolute top-[26px] z-50">
                    <CustomDatePicker
                      selectedDate={localData.date_of_recovery}
                      onDateSelect={(d) => {
                        setLocalData({
                          ...localData,
                          date_of_recovery: new Date(d).toLocaleDateString(
                            "sv-SE",
                          ),
                        });
                        setShowRecoveryDatePicker(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* charges  */}
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">
                  Recovery Charges{" "}
                </label>
                <div className="h-[52px] px-5 border rounded flex items-center">
                  <span className="mr-2 font-weight-300 font-light text-gray-400">
                    £
                  </span>
                  <input
                    value={localData.recovery_charges}
                    onChange={(e) => {
                      const value = allowDecimalInput(e.target.value);

                      setLocalData({
                        ...localData,
                        recovery_charges: value,
                      });
                    }}
                    onBlur={(e) => {
                      setLocalData({
                        ...localData,
                        recovery_charges: formatTwoDecimals(e.target.value),
                      });
                    }}
                    className="outline-none w-full font-weight-300 font-light text-neutral-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex justify-between items-center">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-blue-500 text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Details
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-4 border border-blue-600 text-blue-600 rounded"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 bg-blue-500 text-white rounded"
              >
                Add Billing Details
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-4 bg-blue-500 text-white rounded"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
