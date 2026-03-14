"use client";

/**
 * Tabs – TabsList, TabsTrigger, TabsPanel; horizontal or vertical.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within Tabs");
  return ctx;
}

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
};

function Tabs({
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
}: TabsProps) {
  const context = React.useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange]
  );
  return (
    <TabsContext.Provider value={context}>
      <div
        className={cn(
          orientation === "vertical" && "flex flex-col",
          className
        )}
        role="tablist"
        aria-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-[#f1f5f9] p-1 text-[#64748b]",
        className
      )}
      role="tablist"
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isActive = selectedValue === value;
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-white text-[#1e293b] shadow-sm"
            : "hover:bg-white/50 hover:text-[#1e293b]",
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    if (selectedValue !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
