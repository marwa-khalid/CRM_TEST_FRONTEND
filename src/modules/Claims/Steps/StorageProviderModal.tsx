import React, { useEffect, useRef, useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { debounce } from "lodash";
import { getStorageProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { CustomDatePicker } from "../Components/DatePicker";

export const StorageProviderModal = ({
  onClose,
  claimId,
  initialData,
  formik,
}: any) => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [storageSuggestions, setStorageSuggestions] = useState<any[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // LOCAL STATE (Buffer): Only push to Parent Formik on "Save"
  const [localData, setLocalData] = useState({
    id: initialData?.id || 0, // Temporary ID if new
    storage_provider: initialData?.storage_provider || "",
    name: initialData?.name || "",
    claim_id: parseInt(claimId),
    start_date: initialData?.start_date || null,
    currency: "GBP",
    end_date: initialData?.end_date || null,
    total_storage_days: initialData?.total_storage_days || 0,
    charge_per_day: initialData?.charge_per_day || 25,
    total_storage_charges: initialData?.total_storage_charges || 0,
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
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

      const totalCharges = diffDays * localData.charge_per_day;

      setLocalData((prev) => ({
        ...prev,
        total_storage_days: diffDays,
        total_storage_charges: totalCharges,
      }));
    }
  }, [localData.start_date, localData.end_date, localData.charge_per_day]);

  // --- HANDLERS ---
  const fetchStorageSuggestions = debounce(async (query: string) => {
    if (!query) return;
    try {
      const response = await getStorageProvider(query);
      setStorageSuggestions(response.data || response);
    } catch (error) {
      console.error(error);
    }
  }, 300);

  const handleCompanySelect = (selected: any) => {
    setSearchTerm(selected.storage_provider);
    setShowDropdown(false);
    setLocalData((prev) => ({
      ...prev,
      storage_provider: selected.storage_provider,
      address: {
        ...prev.address,
        address: selected.address || "",
        postcode: selected.postcode || "",
      },
    }));
  };

  const handleSave = () => {
    // This is where you pass the local buffer back to the parent's Formik
    const exists = formik.values.storages.find((s) => s.id === localData.id);
    const rawNumber = localData.address.mobile_tel.replace("+44 ", "").trim();

    const finalData = {
      ...localData,
      address: {
        ...localData.address,
        // Store the final formatted string: +44 12345 678901
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
console.log(localData)
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4 font-['Stack_Sans_Headline']">
      <div className="w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600">
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
            {/* Network Provider Search */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-neutral-700 text-sm">
                Network Storage Provider
              </label>
              <input
                type="text"
                value={searchTerm || localData.storage_provider}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  fetchStorageSuggestions(e.target.value);
                }}
                placeholder="Enter Company Name"
                className="w-full h-[52px] px-5 border rounded font-weight-300 font-light"
              />
              {showDropdown && storageSuggestions.length > 0 && (
                <div className="absolute top-[80px] w-full bg-white border shadow-lg z-50 max-h-40 overflow-auto">
                  {storageSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleCompanySelect(s)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                    >
                      {s.storage_provider}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm">Name</label>
              <input
                className="h-[52px] px-5 border rounded font-weight-300 font-light"
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
                <label className="text-gray-700 text-sm font-weight-400">
                  Post Code
                </label>

                <input
                  type="text"
                  placeholder="Enter Post Code"
                  className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-weight-300 font-light focus-within:border-blue-500 transition-all"
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
                <label className="text-gray-700 text-sm font-weight-400">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-weight-300 font-light focus-within:border-blue-500 transition-all"
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
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-gray-400 font-weight-300 font-light ">
                    +44
                  </span>
                  <input
                    className="h-[52px] pl-14 w-full border rounded"
                    value={localData.address.mobile_tel}
                    maxLength={12}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ""); // remove non-digits

                      if (value.length > 5) {
                        value = value.slice(0, 5) + " " + value.slice(5, 11);
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
                        setLocalData({ ...localData, start_date: new Date(d).toLocaleDateString("sv-SE") });
                        setShowStartDatePicker(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* End Date */}
              <div className="relative flex flex-col gap-2">
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
                  <span className="mr-2 font-weight-300 font-light text-neutral-700">
                    £
                  </span>
                  <input
                    value={localData.charge_per_day}
                    onChange={(e) =>
                      setLocalData({
                        ...localData,
                        charge_per_day: Number(e.target.value),
                      })
                    }
                    className="outline-none w-full font-weight-300 font-light text-neutral-700"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm">
                  Total Storage Charges
                </label>
                <div className="h-[52px] px-5 border rounded flex items-center">
                  <span className="mr-2 font-weight-300 font-light text-neutral-700">
                    £
                  </span>
                  <input
                    readOnly
                    value={localData.total_storage_charges}
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
