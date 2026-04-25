import * as React from "react";

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContext = React.createContext<{
  openItems: Set<string>;
  toggleItem: (value: string) => void;
}>({
  openItems: new Set(),
  toggleItem: () => {}
});

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className = '', type = 'single', collapsible = false, value, onValueChange, children, ...props }, ref) => {
    const [internalOpenItems, setInternalOpenItems] = React.useState<Set<string>>(new Set());
    
    const openItems = React.useMemo(() => {
      if (value !== undefined) {
        return new Set(Array.isArray(value) ? value : [value]);
      }
      return internalOpenItems;
    }, [value, internalOpenItems]);

    const toggleItem = React.useCallback((itemValue: string) => {
      const newOpenItems = new Set(openItems);
      
      if (newOpenItems.has(itemValue)) {
        newOpenItems.delete(itemValue);
      } else {
        if (type === 'single') {
          newOpenItems.clear();
        }
        newOpenItems.add(itemValue);
      }
      
      if (value === undefined) {
        setInternalOpenItems(newOpenItems);
      }
      
      if (onValueChange) {
        if (type === 'single') {
          onValueChange(newOpenItems.size > 0 ? Array.from(newOpenItems)[0] : '');
        } else {
          onValueChange(Array.from(newOpenItems));
        }
      }
    }, [openItems, type, value, onValueChange]);

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className = '', value, children, ...props }, ref) => (
    <div ref={ref} className={`border-b ${className}`} data-value={value} {...props}>
      {children}
    </div>
  )
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className = '', children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemElement = ref && 'current' in ref ? ref.current?.closest('[data-value]') as HTMLElement : null;
    const value = itemElement?.getAttribute('data-value') || '';
    const isOpen = context.openItems.has(value);

    return (
      <button
        ref={ref}
        className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className}`}
        onClick={() => context.toggleItem(value)}
        {...props}
      >
        {children}
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className = '', children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const [itemElement, setItemElement] = React.useState<HTMLElement | null>(null);
    
    React.useEffect(() => {
      const element = ref && 'current' in ref ? ref.current?.closest('[data-value]') as HTMLElement : null;
      setItemElement(element);
    }, [ref]);

    const value = itemElement?.getAttribute('data-value') || '';
    const isOpen = context.openItems.has(value);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={`overflow-hidden text-sm transition-all ${className}`}
        {...props}
      >
        <div className="pb-4 pt-0">
          {children}
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };