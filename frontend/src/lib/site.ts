/** The canonical public origin. Canonical links, og:url and sitemap.xml are built from it. */
export const SITE_URL = "https://biopharmlifescience.co.ke";

/** Public pages listed in sitemap.xml, besides one page per catalog product group. */
export const PUBLIC_PATHS = ["/", "/products", "/the-model", "/book-assessment", "/akiba-calculator", "/about"];

/** Staff-only areas: kept out of search results (robots.txt and a noindex meta tag). */
export const PRIVATE_PATH_PREFIXES = ["/staff", "/admin", "/dashboard"];

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
