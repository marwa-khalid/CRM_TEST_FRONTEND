import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  disabled: boolean;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  showTimeSelect?: boolean;
  showTimeSelectOnly?: boolean;
  timeIntervals?: number;
  timeCaption?: string;
  dateFormat?: string;
  className: string;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  disabled,
  selectedDate,
  setSelectedDate,
  showTimeSelect = false,
  showTimeSelectOnly = false,
  timeIntervals = 30,
  dateFormat,
  minDate,
  className,
  maxDate,
}) => {
  return (
    <DatePicker
      disabled={disabled}
      selected={selectedDate}
      onChange={(date) => setSelectedDate(date)}
      showTimeSelect={showTimeSelect}
      showTimeSelectOnly={showTimeSelectOnly}
      timeIntervals={timeIntervals}
      minDate={minDate}
      maxDate={maxDate}
      timeFormat="HH:mm" 
      dateFormat={dateFormat || (showTimeSelectOnly ? "HH:mm" : "yyyy-MM-dd")}
      className={`w-auto
 p-2 border border-gray-300 h-[45px] ${className} rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-200 ${disabled ? 'cursor-not-allowed' : ''}`}
    />
  );
};

export default CustomDatePicker;
