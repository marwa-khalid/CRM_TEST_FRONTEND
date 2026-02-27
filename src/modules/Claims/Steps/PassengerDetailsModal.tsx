import { useState } from "react";
import Select from "react-select";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { createPassenger, updatePassenger } from "../../../services/Accidents/Cards/cards";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";

export const PassengerDetailsModal = ({ onClose, claimId, initialData }) => {
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

  const handleAction = async (addNext = false) => {
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
    } catch (error) {
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
      // Take first 5 digits
      formatted += digits.substring(0, 5);
      if (digits.length > 5) {
        // Add space and next 6 digits
        formatted += " " + digits.substring(5, 11);
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
  ];

  // if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4 font-['Stack_Sans_Headline']">
      <div className="PassengerDetails w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
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
          <div className="grid grid-cols-2 ">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">Title</label>
              <Select
                options={titleOptions}
                value={titleOptions.find(
                  (opt) => opt.value === passenger.title?.value,
                )}
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
              <label className="text-gray-700 text-sm font-weight-400">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter First Name"
                className="px-5 py-4 border border-gray-200 rounded text-base font-['system-ui'] focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.firstName}
                onChange={(e) =>
                  setPassenger({ ...passenger, firstName: e.target.value })
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
                className="px-5 py-4 border border-gray-200 rounded text-base font-['system-ui'] focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.surname}
                onChange={(e) =>
                  setPassenger({ ...passenger, surname: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">Address</label>
            {/* <textarea
              placeholder="Passenger's Address"
              className="h-24 px-5 py-4 border border-gray-200 rounded text-base font-['system-ui'] focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              value={passenger.address}
              onChange={(e) =>
                setPassenger({ ...passenger, address: e.target.value })
              }
            /> */}
            <LeafletAutocompleteMap
              showMap={false}
              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
              address={passenger.address}
              onPlaceSelected={(place) => {
                if (place.name) {
                  setPassenger({ ...passenger, address: place.address });
                  // formik.setFieldValue("postcode", place?.postalCode);
                }
              }}
              disabled={false}
            />
          </div>

          {/* Postcode and Email */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Post Code
              </label>
              <input
                type="text"
                placeholder="Enter Post Code"
                className="px-5 py-4 border border-gray-200 rounded text-base font-['system-ui'] focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.postCode}
                onChange={(e) =>
                  setPassenger({ ...passenger, postCode: e.target.value })
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
                className="px-5 py-4 border border-gray-200 rounded text-base font-['system-ui'] focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.email}
                onChange={(e) =>
                  setPassenger({ ...passenger, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Telephone */}
          <div className="w-96 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Telephone
            </label>
            <div className="relative flex items-center">
              {/* Visual Prefix */}
              <span className="absolute left-5 text-gray-400 font-['system-ui'] border-r border-gray-200 pr-3">
                +44
              </span>
              <input
                type="tel"
                className="w-full pl-16 pr-5 py-4 border border-gray-200 rounded text-base font-['system-ui'] focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.telephone}
                onChange={handlePhoneChange}
                maxLength={12} // 5 digits + 1 space + 6 digits
              />
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
          <button
            onClick={() => handleAction(true)}
            className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 transition-colors"
          >
            Save and Add Next Passenger
          </button>
        </div>
      </div>
    </div>
  );
};
