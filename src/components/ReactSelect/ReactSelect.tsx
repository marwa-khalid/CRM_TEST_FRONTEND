import React from "react";
import Select from "react-select";
import type { StylesConfig } from "react-select";

type OptionType = {
  value: string;
  label: string;
};

interface CustomSelectProps {
  options: OptionType[];
  value: OptionType | null;
  onChange: (option: OptionType | null) => void;
  onInputChange: (option: OptionType | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: any;
}

const customStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "44px",        // ✅ increase height (default ~38px)
    height: "44px",  
    borderRadius: '7px', 
    borderColor: state.isFocused ? "" : "",
    boxShadow: state.isFocused ? "#00249c" : "none",
    "&:hover": {
      borderColor: "",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#414651"
      : state.isFocused
      ? "#fff"
      : "white",
    color: state.isSelected ? "white" : "#414651",
    "&:hover": {
      backgroundColor: "#252B37",
      color: "#fff",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6b7280",
  }),
};

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  onInputChange,
  placeholder,
  disabled,
  className,
}) => {
  return (
    <Select<OptionType, false>
      options={options}
      value={value}
      className={className}
      onChange={onChange}
      onInputChange={onInputChange}
      styles={customStyles}
      placeholder={placeholder}
      isDisabled={disabled}
      components={{
        IndicatorSeparator: () => null,
      }}
    />
  );
};

export default CustomSelect;
