import { format } from "date-fns";
import { whatsAppSendUrl } from "@/lib/contact";

export const FACILITY_ASSESSMENT_BOOK_PATH = "/book-assessment";

export type FacilityAssessmentForm = {
  personName: string;
  facilityName: string;
  position: string;
  contact: string;
  email: string;
  visitDate: Date;
  visitTime: string;
};

function formatVisitTime(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return format(d, "h:mm a");
}

export function buildFacilityAssessmentWhatsAppUrl(data: FacilityAssessmentForm): string {
  const visitDateFormatted = format(data.visitDate, "EEEE, d MMMM yyyy");
  const visitTimeFormatted = formatVisitTime(data.visitTime);
  const message = [
    "Hello Biopharmlifescience EA, I would like to book a facility assessment. Details:",
    "",
    `Name: ${data.personName}`,
    `Facility: ${data.facilityName}`,
    `Position: ${data.position}`,
    `Contact: ${data.contact}`,
    `Email: ${data.email}`,
    `Preferred visit date: ${visitDateFormatted}`,
    `Preferred visit time: ${visitTimeFormatted}`,
  ].join("\n");

  return whatsAppSendUrl(message);
}

export function submitFacilityAssessmentToWhatsApp(data: FacilityAssessmentForm) {
  const url = buildFacilityAssessmentWhatsAppUrl(data);
  window.open(url, "_blank", "noopener,noreferrer");
}
