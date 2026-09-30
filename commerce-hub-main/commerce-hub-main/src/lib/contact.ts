/** Biopharmlifescience EA — public contact details (landing page). */

export const PHONE_DISPLAY = "+254 714 647 972";
export const PHONE_E164 = "254714647972";
export const EMAIL = "biopharmlifescience@gmail.com";

const facilityAssessmentMessage =
  "Hello Biopharmlifescience EA, I would like to book a free facility assessment for our clinic.";

export const WHATSAPP_URL = `https://wa.me/${PHONE_E164}`;

/** Opens WhatsApp with a single pre-filled message (no duplicate text params). */
export function whatsAppSendUrl(message: string): string {
  return `https://api.whatsapp.com/send?phone=${PHONE_E164}&text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_FACILITY_ASSESSMENT_URL = whatsAppSendUrl(facilityAssessmentMessage);
/** @deprecated Use WHATSAPP_FACILITY_ASSESSMENT_URL */
export const WHATSAPP_CONSULTATION_URL = WHATSAPP_FACILITY_ASSESSMENT_URL;

export const PHONE_HREF = `tel:${PHONE_E164}`;
export const EMAIL_HREF = `mailto:${EMAIL}`;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
