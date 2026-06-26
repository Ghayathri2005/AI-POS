import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, type = "checkbox", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      if (onCheckedChange) onCheckedChange(isChecked);
      if (onChange) onChange(e);
    };

    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          onChange={handleChange}
          className={cn(
            "peer h-4.5 w-4.5 shrink-0 rounded-lg border border-[#2c2c2c] bg-[#202020] text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer checked:bg-indigo-500 checked:border-indigo-500 transition-all",
            className
          )}
          {...props}
        />
        <Check 
          size={12} 
          className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3px]" 
        />
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
