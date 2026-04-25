// Simple utility function to combine class names without external dependencies
export type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Alternative implementation that handles objects and arrays like clsx
export function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  inputs.forEach(input => {
    if (!input) return;
    
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nestedClasses = clsx(...input);
      if (nestedClasses) {
        classes.push(nestedClasses);
      }
    } else if (typeof input === 'object') {
      Object.keys(input).forEach(key => {
        if ((input as any)[key]) {
          classes.push(key);
        }
      });
    }
  });
  
  return classes.join(' ').replace(/\s+/g, ' ').trim();
}

// Simple merge function for Tailwind classes (basic version without full tailwind-merge functionality)
export function twMerge(classes: string): string {
  if (!classes) return '';
  
  const classArray = classes.split(/\s+/).filter(Boolean);
  const classMap = new Map<string, string>();
  
  // Group classes by their base name (e.g., 'bg-red-500' and 'bg-blue-500' both have base 'bg')
  classArray.forEach(cls => {
    const match = cls.match(/^([\w-]+?)(-|$)/);
    if (match) {
      const base = match[1];
      classMap.set(base, cls);
    } else {
      classMap.set(cls, cls);
    }
  });
  
  return Array.from(classMap.values()).join(' ');
}