import type { StorefrontProduct } from "@/types/api";
import { WHATSAPP_URL } from "@/lib/contact";

/** "KSh 1,200 / box", or "Price on request" while the POS has no price for it. */
export function formatPrice(product: Pick<StorefrontProduct, "price" | "unit">): string {
  if (!product.price) return "Price on request";
  const amount = `KSh ${Number(product.price).toLocaleString()}`;
  return product.unit && product.unit !== "unit" ? `${amount} / ${product.unit}` : amount;
}

export function enquiryUrl(productName: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(`Hello, I would like to enquire about ${productName}.`)}`;
}
