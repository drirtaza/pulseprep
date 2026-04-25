import * as React from "react";

interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    className = '', 
    value, 
    onValueChange, 
    defaultValue = [0], 
    min = 0, 
    max = 100, 
    step = 1, 
    disabled = false,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      
      const newValue = [Number(event.target.value)];
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };
    
    const percentage = ((currentValue[0] - min) / (max - min)) * 100;
    
    return (
      <div
        ref={ref}
        className={`relative flex w-full touch-none select-none items-center ${className}`}
        {...props}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue[0]}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };