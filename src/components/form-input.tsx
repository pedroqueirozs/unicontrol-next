"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  rightElement?: React.ReactNode
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, rightElement, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={cn(
              "w-full h-11 rounded-md border border-border bg-input-bg px-3 text-base outline-none",
              "focus:border-ring transition-colors",
              "placeholder:text-muted-foreground",
              rightElement && "pr-10",
              error && "border-destructive focus:border-destructive",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput }
