import React, { useState } from "react";
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
          stroke="#3B82F6"
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
    borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
    boxShadow: 'none',
    '&:hover': { borderColor: '#3B82F6' },
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
    backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
};
export const WitnessDetailsModal = ({onClose }) => {
  const [witness, setWitness] = useState({
    title: null,
    firstName: "",
    surname: "",
    address: "",
    postCode: "",
    email: "",
    telephone: "+44",
    isIndependent: "Yes",
  });

//   if (!isOpen) return null;

  const titleOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4">
      <div className="WitnessDetails w-[800px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Header with Pagination Indicator Dots */}
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
            Witness Details
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-300 rounded-full" />{" "}
            {/* Active Dot */}
            <div className="w-3 h-3 bg-zinc-300 rounded-full" />{" "}
            {/* Inactive Dot */}
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
              onChange={(opt) => setWitness({ ...witness, title: opt })}
            />
          </div>

          {/* Name Grid */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter First Name"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={witness.firstName}
                onChange={(e) =>
                  setWitness({ ...witness, firstName: e.target.value })
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
                value={witness.surname}
                onChange={(e) =>
                  setWitness({ ...witness, surname: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Address</label>
            <textarea
              placeholder="Witness Address"
              className="h-24 px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              value={witness.address}
              onChange={(e) =>
                setWitness({ ...witness, address: e.target.value })
              }
            />
          </div>

          {/* Post Code & Email */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Post Code
              </label>
              <input
                type="text"
                placeholder="Enter Post Code"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={witness.postCode}
                onChange={(e) =>
                  setWitness({ ...witness, postCode: e.target.value })
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
                value={witness.email}
                onChange={(e) =>
                  setWitness({ ...witness, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Telephone & Independence Toggle */}
          <div className="grid grid-cols-2 gap-5 items-start">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Telephone
              </label>
              <input
                type="tel"
                className="px-5 py-4 border border-gray-200 rounded text-base font-light focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={witness.telephone}
                onChange={(e) =>
                  setWitness({ ...witness, telephone: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-5">
              <label className="text-black text-sm font-medium">
                Witness Independent?
              </label>
              <div className="flex items-center gap-5">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="witnessInd"
                        className="sr-only"
                        checked={witness.isIndependent === option}
                        onChange={() =>
                          setWitness({ ...witness, isIndependent: option })
                        }
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${witness.isIndependent === option ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-white"}`}
                      />
                      {witness.isIndependent === option && (
                        <div className="absolute w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => console.log("Sending Questionnaire...", witness)}
            className="px-6 py-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-flex items-center gap-2"
          >
            Send Questionnaire
          </button>
        </div>
      </div>
    </div>
  );
};
