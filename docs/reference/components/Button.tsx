import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  color?: string;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  text,
  icon,
  borderColor = "FD7401",
  borderWidth = "1px",
  backgroundColor = "#34D399",
  color = "#FFFF",
  onClick,
  isLoading = false,
  type = "button",
  ...props
}) => {
  return (
    <div>
      <button
        type={type}
        className={`w-full h-12 flex justify-center items-center mt-3 gap-3 p-2 border-none rounded-md hover:opacity-80 font-semibold ${
          isLoading ? "cursor-progress" : ""
        }`}
        style={{
          backgroundColor,
          borderColor,
          borderWidth,
          color,
        }}
        onClick={onClick}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          "Carregando..."
        ) : (
          <>
            {icon && <img src={icon} />}
            {text}
          </>
        )}
      </button>
    </div>
  );
};

export default Button;
