import React from 'react'
import { TextArea } from "../base/textarea/textarea";

// Define the props interface for the TextField component
interface TextFieldProps {
  className?: string;
  label?: string;
  placeholder?: string;      
  hint?: string;             
  isRequired?: boolean;      
  rows?: number;             
  isReadOnly?: boolean; 
  id?:string; 
  value?: string;
  onChange?: () => void;                
}


const TextField: React.FC<TextFieldProps> = ({
  className,
  label,
  placeholder,
  hint,
  isRequired = false,
  rows = 5,
  id,
  isReadOnly = false,
  value,
  onChange,
}) => {
  return (
    <TextArea
      id={id}
      className={className}
      label={label}
      placeholder={placeholder}
      hint={hint}
      isRequired={isRequired}
      rows={rows}
      isReadOnly={isReadOnly}
      value={value}
      onChange={onChange}
    />
  );
}

export default TextField;
