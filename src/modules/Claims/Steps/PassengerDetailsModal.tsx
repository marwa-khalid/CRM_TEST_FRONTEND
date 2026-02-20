import { useState } from "react";
import { Trash2, UserPlus, Mail, Phone, MapPin } from "lucide-react";
import Select, { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import { X, Send } from "lucide-react";
const BlueDropdownIndicator = (props: DropdownIndicatorProps<any, false>) => {
  return (
    <components.DropdownIndicator {...props}>
      <svg
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L6 6L11 1"
          stroke="#0352FD"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </components.DropdownIndicator>
  );
};

// Common custom styles for react-select
const customStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    height: '52px',
    borderRadius: '4px',
    borderColor: state.isFocused ? '#0352FD' : '#E5E7EB',
    boxShadow: 'none',
    '&:hover': { borderColor: '#0352FD' },
    paddingLeft: '8px',
    backgroundColor: 'white',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9CA3AF',
    fontWeight: '300',
    fontSize: '16px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#0352FD' : state.isFocused ? '#EFF6FF' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
};
export const PassengerDetailsModal = ({onClose }) => {
  const [passenger, setPassenger] = useState({
    title: null,
    firstName: "",
    surname: "",
    address: "",
    postCode: "",
    email: "",
    telephone: "+44",
  });

  const titleOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ];

  const handleAction = (addNext = false) => {
    // Basic validation for mandatory text fields
    if (!passenger.firstName || !passenger.surname) {
      alert("Please enter at least the First Name and Surname.");
      return;
    }

    // onSavePassenger({ ...passenger, id: Date.now() });

    if (addNext) {
      setPassenger({
        title: null,
        firstName: "",
        surname: "",
        address: "",
        postCode: "",
        email: "",
        telephone: "+44",
      });
    } else {
      onClose();
    }
  };

  // if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">
      <div className="PassengerDetails w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
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
          <div className="w-96 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Title</label>
            <Select
              options={titleOptions}
              placeholder="Select Title"
              styles={customStyles}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
              onChange={(opt) => setPassenger({ ...passenger, title: opt })}
            />
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter First Name"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.firstName}
                onChange={(e) =>
                  setPassenger({ ...passenger, firstName: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Surname
              </label>
              <input
                type="text"
                placeholder="Enter Last Name"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.surname}
                onChange={(e) =>
                  setPassenger({ ...passenger, surname: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Address</label>
            <textarea
              placeholder="Passenger's Address"
              className="h-24 px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              value={passenger.address}
              onChange={(e) =>
                setPassenger({ ...passenger, address: e.target.value })
              }
            />
          </div>

          {/* Postcode and Email */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Post Code
              </label>
              <input
                type="text"
                placeholder="Enter Post Code"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.postCode}
                onChange={(e) =>
                  setPassenger({ ...passenger, postCode: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter Email"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={passenger.email}
                onChange={(e) =>
                  setPassenger({ ...passenger, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Telephone */}
          <div className="w-96 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Telephone
            </label>
            <input
              type="tel"
              className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={passenger.telephone}
              onChange={(e) =>
                setPassenger({ ...passenger, telephone: e.target.value })
              }
            />
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleAction(false)}
            className="px-6 py-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => handleAction(true)}
            className="px-6 py-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Save and Add Next Passenger
          </button>
        </div>
      </div>
    </div>
  );
};
