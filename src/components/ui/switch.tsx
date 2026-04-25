import * as React from "react";

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className = '', checked, onCheckedChange, defaultChecked = false, disabled, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    
    const isChecked = checked !== undefined ? checked : internalChecked;
    
    const handleClick = () => {
      if (disabled) return;
      
      const newChecked = !isChecked;
      
      if (checked === undefined) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };
    
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
          isChecked 
            ? 'bg-primary' 
            : 'bg-input'
        } ${className}`}
        {...props}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
            isChecked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };