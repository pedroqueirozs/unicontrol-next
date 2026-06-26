import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  icon?: React.ReactNode;
  labelName: string;
  labelId: string;
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { id, icon, type, placeholder, labelName, labelId, errorMessage, ...props },
    ref
  ) => {
    return (
      <div>
        <div className="flex gap-1">
          <label htmlFor={labelId} className="mb-1 block">
            {labelName}
          </label>
          <span className="text-notification_error text-sm">
            {" "}
            {errorMessage}
          </span>
        </div>
        <div className="relative mb-2">
          <input
            className="bg-input_bg rounded-md h-11 w-full pl-3 outline-none border border-solid border-input_border focus:border-input_border_focus"
            id={id}
            type={type}
            placeholder={placeholder}
            ref={ref}
            {...props}
          />
          {icon && (
            <div className="bg-input_bg_icon rounded-md flex absolute inset-y-0 right-0 items-center pointer-events-none w-8">
              <div className="w-full text-center">
                <div className="text-input_text_icon w-full flex justify-center ">
                  {" "}
                  {icon}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
