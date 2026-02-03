"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value: string;
  displayLabel: string;
  onValueChange: (value: string, label?: string) => void;
  registerLabel: (value: string, label: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within Select");
  return ctx;
}

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
};

function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ""
  );
  const [displayLabel, setDisplayLabel] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const labelsRef = React.useRef<Record<string, string>>({});

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const registerLabel = React.useCallback(
    (v: string, label: string) => {
      labelsRef.current[v] = label;
      if (v === value) setDisplayLabel(label);
    },
    [value]
  );

  const handleValueChange = React.useCallback(
    (v: string, label?: string) => {
      if (!isControlled) setUncontrolledValue(v);
      setDisplayLabel(label ?? labelsRef.current[v] ?? v);
      onValueChange?.(v);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  React.useEffect(() => {
    if (value && labelsRef.current[value]) {
      setDisplayLabel(labelsRef.current[value]);
    }
  }, [value]);

  const context = React.useMemo(
    () => ({
      value,
      displayLabel,
      onValueChange: handleValueChange,
      registerLabel,
      open,
      setOpen,
    }),
    [value, displayLabel, handleValueChange, registerLabel, open]
  );

  return (
    <SelectContext.Provider value={context}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = React.HTMLAttributes<HTMLButtonElement>;

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value, open, setOpen } = useSelectContext();
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [open, setOpen]);

    return (
      <button
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = () => {
  const { value, displayLabel } = useSelectContext();
  return <span>{displayLabel || value || "Select..."}</span>;
};

type SelectContentProps = React.HTMLAttributes<HTMLDivElement>;

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext();
    if (!open) return null;
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 max-h-60 min-w-[8rem] overflow-auto rounded-lg border border-[#e2e8f0] bg-white p-1 shadow-lg",
          className
        )}
        role="listbox"
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

type SelectItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, registerLabel } =
      useSelectContext();
    const isSelected = selectedValue === value;
    const label =
      typeof children === "string" ? children : String(children ?? value);
    React.useEffect(() => {
      registerLabel(value, label);
    }, [value, label, registerLabel]);
    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-8 text-sm outline-none hover:bg-[#f1f5f9] focus:bg-[#f1f5f9]",
          isSelected && "bg-[#e0f2fe] text-[#21438D]",
          className
        )}
        onClick={() => onValueChange(value, label)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onValueChange(value, label);
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
