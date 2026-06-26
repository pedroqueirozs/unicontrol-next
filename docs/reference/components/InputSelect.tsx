import React from "react";

interface Option {
  value: string;
  label: string;
}
interface InputSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  labelName: string;
  labelId: string;
  options: Option[];
}

const InputSelect = React.forwardRef<HTMLSelectElement, InputSelectProps>(
  ({ id, labelName, labelId, options, ...props }, ref) => {
    return (
      <div>
        <div className="flex gap-1">
          <label htmlFor={labelId} className="mb-1 block">
            {labelName}
          </label>
        </div>
        <div className="relative mb-2">
          <select
            className="appearance-none rounded-md h-11 w-full pl-3 pr-9 outline-none bg-input_bg border border-solid border-input_border focus:border-input_border_focus cursor-pointer"
            id={id}
            ref={ref}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
InputSelect.displayName = "Input";

export default InputSelect;
