import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isPrivatePath, SITE_URL } from "@/lib/site";

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string | null) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (value === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Keep the canonical URL, og:url and robots meta in step with the current route. */
export const SeoTags = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;
    const isPrivate = isPrivatePath(pathname);

    setTag(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement("link"), { rel: "canonical" }),
      "href",
      isPrivate ? null : url,
    );
    setTag(
      'meta[property="og:url"]',
      () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:url");
        return m;
      },
      "content",
      isPrivate ? null : url,
    );
    setTag(
      'meta[name="robots"]',
      () => Object.assign(document.createElement("meta"), { name: "robots" }),
      "content",
      isPrivate ? "noindex, nofollow" : null,
    );
  }, [pathname]);

  return null;
};
