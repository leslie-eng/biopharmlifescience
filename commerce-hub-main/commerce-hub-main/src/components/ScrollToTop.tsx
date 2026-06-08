import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window scroll when the route changes (e.g. product list → product detail). */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};
