import { Field } from "formik";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneNumberProps {
  name: string;
  label?: string;
  country?: string;
  disabled?: boolean;
}

const PhoneNumber = ({ name, label, country = "gb", disabled }: PhoneNumberProps) => {
  return (
    <Field name={name}>
      {({ field, form, meta }: any) => (
        <div className="w-full">
          {label && <label className="block mb-1 text-sm font-medium">{label}</label>}

          <PhoneInput
            country={country}
            value={field.value}
            placeholder='+44'
            onChange={(value) => form.setFieldValue(field.name, value)}
            inputStyle={{ width: "100%", height: "44px", fontSize: '16px' }}
            containerStyle={{ width: "100%" }}
            disabled={disabled}
          />

          {meta.touched && meta.error && (
            <div className="text-red-500 text-xs mt-1">{meta.error}</div>
          )}
        </div>
      )}
    </Field>
  );
};

export default PhoneNumber;
