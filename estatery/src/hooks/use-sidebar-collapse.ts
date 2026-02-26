/**
 * Sidebar collapse state – auto-collapsed on mobile, toggleable on desktop.
 * Use in any screen that renders Sidebar + main content.
 */
import * as React from "react";
import { useIsMobile } from "./use-mobile";

export function useSidebarCollapse() {
  const isMobile = useIsMobile();
  const [userCollapsed, setUserCollapsed] = React.useState(false);

  /* On mobile always collapsed; on desktop use user toggle */
  const collapsed = isMobile ? true : userCollapsed;
  const onToggle = React.useCallback(() => {
    setUserCollapsed((prev) => !prev);
  }, []);

  return { collapsed, onToggle };
}
