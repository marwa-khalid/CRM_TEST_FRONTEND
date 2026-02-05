import React from 'react'
import { Input } from '../base/input/input'

interface InputProps {
  className?: string;
  icon?:React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label?: string;
  hint?: string;
  placeholder?: string;
  tooltip?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  type?:string;
  id?:string;
  value?: string;
  onChange?: () => void;
}

const CustomInput:React.FC<InputProps> = ({ id, placeholder, icon, type = "text", value, onChange }) => {
  return (
    <Input
      iconClassName="text-stormGray"
      id={id}
      type={type}
      icon={icon}
      placeholder={placeholder}
      value={value}      
      onChange={onChange}
    />
  )
}

export default CustomInput