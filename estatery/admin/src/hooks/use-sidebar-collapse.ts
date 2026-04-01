/**
 * Sidebar collapse state – drawer on mobile, collapsible rail on desktop.
 * Mobile: hamburger toggles drawer open (collapsed=false) vs closed (collapsed=true).
 * Desktop: toggle narrows sidebar to icons vs full labels.
 */
import * as React from "react";
import { useIsMobile } from "./use-mobile";

const MOBILE_MAX_WIDTH = 767;

function isNarrowViewport() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_MAX_WIDTH;
}

export function useSidebarCollapse() {
  const isMobile = useIsMobile();
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  const collapsed = isMobile ? !mobileDrawerOpen : desktopCollapsed;

  const onToggle = React.useCallback(() => {
    if (isNarrowViewport()) {
      setMobileDrawerOpen((open) => !open);
    } else {
      setDesktopCollapsed((c) => !c);
    }
  }, []);

  return { collapsed, onToggle };
}
