import * as React from "react";
import { useIsMobile } from "./use-mobile";

/**
 * Returns collapsed state and toggle handler.
 * On small screens (mobile), sidebar is always collapsed.
 * On larger screens, respects user toggle.
 */
export function useSidebarCollapse() {
  const isMobile = useIsMobile();
  const [userCollapsed, setUserCollapsed] = React.useState(false);

  const collapsed = isMobile ? true : userCollapsed;
  const onToggle = React.useCallback(() => {
    setUserCollapsed((prev) => !prev);
  }, []);

  return { collapsed, onToggle };
}
