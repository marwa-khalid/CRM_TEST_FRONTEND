import React, { useEffect, useRef, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { getStorageProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { CustomDatePicker } from "../Components/DatePicker";

export const StorageProviderModal = ({
  onClose,
  claimId,
  initialData,
  formik,
}: any) => {
  const [step, setStep] = useState(1);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;
  const formatTwoDecimals = (value: any) => {
    if (value === "" || value === null || value === undefined) return "0.00";

    const num = Number(value);
    if (Number.isNaN(num)) return "0.00";

    return num.toFixed(2);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startDateRef.current &&
        !startDateRef.current.contains(event.target as Node)
      )
        setShowStartDatePicker(false);
      if (
        endDateRef.current &&
        !endDateRef.current.contains(event.target as Node)
      )
        setShowEndDatePicker(false);
     
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // LOCAL STATE (Buffer): Only push to Parent Formik on "Save"
  const [localData, setLocalData] = useState({
    id: initialData?.id || Date.now(),
    storage_provider: initialData?.storage_provider || "",
    name: initialData?.name || "",
    claim_id: parseInt(claimId),
    start_date: initialData?.start_date || null,
    currency: "GBP",
    end_date: initialData?.end_date || null,
    total_storage_days: initialData?.total_storage_days || 0,
    charge_per_day: initialData?.charge_per_day
      ? formatTwoDecimals(initialData.charge_per_day)
      : "25.00",

    total_storage_charges: initialData?.total_storage_charges
      ? formatTwoDecimals(initialData.total_storage_charges)
      : "0.00",
    address: {
      address: initialData?.address?.address || "",
      postcode: initialData?.address?.postcode || "",
      mobile_tel: initialData?.address?.mobile_tel || "",
      email: initialData?.address?.email || "",
    },
  });

  // --- AUTO CALCULATIONS ---
useEffect(() => {
  if (localData.start_date && localData.end_date) {
    const start = new Date(localData.start_date);
    const end = new Date(localData.end_date);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const chargePerDay = Number(localData.charge_per_day || 0);
    const totalCharges = diffDays * chargePerDay;

    setLocalData((prev) => ({
      ...prev,
      total_storage_days: diffDays,
      total_storage_charges: totalCharges.toFixed(2),
    }));
  }
}, [localData.start_date, localData.end_date, localData.charge_per_day]);

  const allowDecimalInput = (value: string) => {
    return value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  };


  const handleSave = () => {
    
    // This is where you pass the local buffer back to the parent's Formik
    const exists = formik.values.storages.find((s) => s.id === localData.id);
    const rawNumber = localData.address.mobile_tel.replace("+44 ", "").trim();

    const finalData = {
      ...localData,
      charge_per_day: formatTwoDecimals(localData.charge_per_day),
      total_storage_charges: formatTwoDecimals(localData.total_storage_charges),
      address: {
        ...localData.address,
        mobile_tel: rawNumber ? `+44 ${rawNumber}` : "",
      },
    };
    if (exists) {
      formik.setFieldValue(
        "storages",
        formik.values.storages.map((s) =>
          s.id === finalData.id ? finalData : s,
        ),
      );
    } else {
      formik.setFieldValue("storages", [...formik.values.storages, finalData]);
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
              ? "Storage Provider Details"
              : "Storage Provider Billing Details"}
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
                Network Storage Provider
              </label>
              <input
                type="text"
                value={localData.storage_provider}
                onChange={(e) =>
                  setLocalData({ ...localData, storage_provider: e.target.value })
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
              <LeafletAutocompleteMap
                apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                showMap={false}
                disabled={false}
                address={localData.address.address}
                onPlaceSelected={(p) =>
                  setLocalData({
                    ...localData,
                    address: {
                      ...localData.address,
                      address: p.address,
                      postcode: p.postalCode || "",
                    },
                  })
                }
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
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={localData.address.postcode}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      address: {
                        ...localData.address,
                        postcode: e.target.value,
                      },
                    })
                  }
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
              <div ref={startDateRef} className="relative flex flex-col gap-2">
                <label className="text-neutral-700  text-sm font-weight-400">
                  Start Date
                </label>
                <div
                  onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                  className="h-[52px] px-5 border rounded flex justify-between items-center cursor-pointer"
                >
                  <span className="font-weight-300 font-light text-neutral-700">
                    {formatDateLabel(localData.start_date)}
                  </span>
                  <img src={Vector6} alt="cal" />
                </div>
                {showStartDatePicker && (
                  <div className="absolute top-[26px] z-50">
                    <CustomDatePicker
                      selectedDate={localData.start_date}
                      onDateSelect={(d) => {
                        setLocalData({
                          ...localData,
                          start_date: new Date(d).toLocaleDateString("sv-SE"),
                        });
                        setShowStartDatePicker(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* End Date */}
              <div ref={endDateRef} className="relative flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">End Date</label>
                <div
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                  className="h-[52px] px-5 border rounded flex justify-between items-center cursor-pointer"
                >
                  <span className="font-weight-300 font-light text-neutral-700">
                    {formatDateLabel(localData.end_date)}
                  </span>
                  <img src={Vector6} alt="cal" />
                </div>
                {showEndDatePicker && (
                  <div className="absolute top-[26px] z-50 font-weight-300 font-light">
                    <CustomDatePicker
                      selectedDate={localData.end_date}
                      onDateSelect={(d) => {
                        setLocalData({
                          ...localData,
                          end_date: new Date(d).toLocaleDateString("sv-SE"),
                        });
                        setShowEndDatePicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">
                  Total Storage Days
                </label>
                <input
                  readOnly
                  value={localData.total_storage_days}
                  disabled={true}
                  className="h-[52px] px-5 bg-gray-50 border rounded font-weight-300 font-light text-neutral-700"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">
                  Charge per Day
                </label>
                <div className="h-[52px] px-5 border rounded flex items-center">
                  <span className="mr-2 font-weight-300 font-light text-gray-400">
                    £
                  </span>
                  <input
                    value={localData.charge_per_day}
                    onChange={(e) => {
                      const value = allowDecimalInput(e.target.value);

                      setLocalData({
                        ...localData,
                        charge_per_day: value,
                      });
                    }}
                    onBlur={(e) => {
                      setLocalData({
                        ...localData,
                        charge_per_day: formatTwoDecimals(e.target.value),
                      });
                    }}
                    className="outline-none w-full font-weight-300 font-light text-neutral-700"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">
                  Total Storage Charges
                </label>
                <div className="h-[52px] px-5 border rounded flex items-center">
                  <span className="mr-2 font-weight-300 font-light text-gray-400">
                    £
                  </span>
                  <input
                    readOnly
                    value={formatTwoDecimals(localData.total_storage_charges)}
                    disabled={true}
                    className="bg-transparent font-weight-300 font-light text-neutral-700"
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
