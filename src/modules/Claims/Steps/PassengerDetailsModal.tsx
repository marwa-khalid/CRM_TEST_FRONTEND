import { useState } from "react";
import Select from "react-select";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { createPassenger, updatePassenger } from "../../../services/Accidents/Cards/cards";
import { PostcodeLookup } from "../../../components/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../components/common/AddressAutocomplete";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";

export const PassengerDetailsModal = ({ onClose, claimId, initialData ,addNew}) => {
  // Initialize state with initialData if it exists
  const [passenger, setPassenger] = useState(
    initialData || {
      title: null,
      firstName: "",
      surname: "",
      address: "",
      postCode: "",
      email: "",
      telephone: "",
    },
  );

  const handleAction = async (addNext :boolean) => {
    try {
      const cleanPhone = `+44${passenger.telephone.replace(/\s/g, "")}`;
      const payload = {
        claim_id: parseInt(claimId),
        first_name: passenger.firstName,
        surname: passenger.surname,
        gender: passenger.title?.value || "Mr",
        address: {
          address: passenger.address,
          postcode: passenger.postCode,
          mobile_tel: cleanPhone,
          email: passenger.email,
        },
      };

      if (initialData?.id) {
        // CALL UPDATE API
        await updatePassenger(initialData.id, payload);
        toast.success("Passenger updated successfully");
      } else {
        // CALL CREATE API
        await createPassenger(payload);
        toast.success("Passenger added successfully");
      }

      if (addNext) {
        setPassenger({
          title: null,
          firstName: "",
          surname: "",
          address: "",
          postCode: "",
          email: "",
          telephone: "",
        });
      } else {
        onClose();
      }
    } catch {
      toast.error("Error saving passenger");
    }
  };
  const formatUKNumber = (value) => {
    // Remove everything except digits
    const digits = value.replace(/\D/g, "");

    // If the user is typing, we format based on the digit count (excluding country code)
    // We assume the user is typing the number after +44
    let formatted = "";

    if (digits.length > 0) {
      // Take first 4 digits
      formatted += digits.substring(0, 4);
      if (digits.length > 4) {
        // Add space and next 6 digits
        formatted += " " + digits.substring(4, 11);
      }
    }
    return formatted;
  };
  const handlePhoneChange = (e) => {
    const input = e.target.value;
    // Apply formatting to the input
    const formatted = formatUKNumber(input);
    setPassenger({ ...passenger, telephone: formatted });
  };
  
  const titleOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ].sort((a, b) => String(a.label).localeCompare(String(b.label)));

  // if (!isOpen) return null;
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4 font-['Stack_Sans_Headline']">
      <div className="PassengerDetails w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline'] leading-5">
            Passenger Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X />
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-4">
          {/* Title Dropdown */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Title
              </label>
              <Select
                options={titleOptions}
                value={
                  titleOptions.find(
                    (opt) => opt.value === passenger.title?.value,
                  ) || null
                }
                placeholder="Select Title"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
                onChange={(opt) => setPassenger({ ...passenger, title: opt })}
              />
            </div>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter First Name"
                className={`w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`}
                value={passenger.firstName}
                onChange={(e) =>
                  setPassenger({ ...passenger, firstName: e.target.value })
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
                className={`w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`}
                value={passenger.surname}
                onChange={(e) =>
                  setPassenger({ ...passenger, surname: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Address
            </label>
            {/* <textarea
              placeholder="Passenger's Address"
              className="h-24 px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              value={passenger.address}
              onChange={(e) =>
                setPassenger({ ...passenger, address: e.target.value })
              }
            /> */}
            <AddressAutocomplete
              address={passenger.address || ""}
              onChange={(v) => setPassenger({ ...passenger, address: v })}
              onPlaceSelected={(place) => setPassenger({ ...passenger, address: place.address, postCode: place.postcode })}
              inputClassName={`w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`}
            />
          </div>

          {/* Postcode and Email */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Post Code
              </label>
              <PostcodeLookup
                postcode={passenger.postCode}
                onChange={(v) => setPassenger({ ...passenger, postCode: v })}
                onAddressSelect={(addr) => setPassenger({ ...passenger, postCode: addr.postcode, address: [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", ") })}
                inputClassName={`w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter Email"
                className={`w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`}
                value={passenger.email}
                onChange={(e) =>
                  setPassenger({ ...passenger, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Telephone */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Telephone
              </label>
              <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base">+44</span>
                <input
                  type="tel"
                  className="w-full bg-transparent outline-none text-neutral-900 mb-0.5 font-light placeholder:text-gray-300"
                  value={passenger.telephone}
                  onChange={handlePhoneChange}
                  maxLength={11} // 4 digits + 1 space + 6 digits
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-weight-400 hover:bg-blue-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleAction(false)}
            className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          {addNew &&
            <button
              onClick={() => handleAction(true)}
              className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 transition-colors"
            >
              Save and Add Next Passenger
            </button>}
        </div>
      </div>
    </div>
  );
};
