import * as React from "react";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'asChild'> {
  asChild?: boolean;
}
interface DropdownMenuContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> {
  align?: 'start' | 'center' | 'end';
  forceMount?: boolean;
}
interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {}
});

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className = '', children, asChild = false, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);
    
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setOpen(true);
      if (props.onClick) {
        props.onClick(event as React.MouseEvent<HTMLButtonElement>);
      }
    };
    
    // If asChild is true, clone the child element and add our props to it
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        ref,
        onClick: handleClick
      });
    }
    
    // Default behavior: render as button
    return (
      <button
        ref={ref}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className = '', children, align = 'start', forceMount, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);
    
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      
      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [open, ref, setOpen]);
    
    // If forceMount is true, always render; otherwise only render when open
    if (!forceMount && !open) return null;
    
    // Calculate alignment classes
    const alignmentClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';
    
    // Filter out non-DOM props to prevent React warnings
    const { align: _, forceMount: __, ...domProps } = props as any;
    
    return (
      <div
        ref={ref}
        className={`absolute top-full ${alignmentClass} z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg ${className}`}
        style={{ display: forceMount && !open ? 'none' : undefined }}
        {...domProps}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className = '', children, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);
    
    return (
      <div
        ref={ref}
        className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className}`}
        onClick={() => setOpen(false)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-2 py-1.5 text-sm font-semibold text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`-mx-1 my-1 h-px bg-muted ${className}`}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
};