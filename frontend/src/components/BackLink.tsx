import React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useBackNavigate } from "@/utils/backNavigation";

export interface BackLinkProps extends Omit<LinkProps, "to"> {
  to: string;
}

/**
 * Drop-in replacement for React Router's `<Link>` on "Back to ..." controls.
 * Prevents redundant browser history entries while supporting direct-entry fallbacks
 * and preserving parent query parameters when returning to a visited parent route.
 */
export default function BackLink({ to, onClick, ...rest }: BackLinkProps) {
  const backNavigate = useBackNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Preserve standard browser behavior for modified clicks (new tab/window)
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      (rest.target && rest.target !== "_self")
    ) {
      return;
    }

    e.preventDefault();
    backNavigate(to);
  };

  return <Link to={to} replace onClick={handleClick} {...rest} />;
}
