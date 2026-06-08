import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { submitFacilityAssessmentToWhatsApp } from "@/lib/facilityAssessment";
import { toast } from "sonner";

const schema = z.object({
  personName: z.string().trim().min(2, "Enter your full name").max(120),
  facilityName: z.string().trim().min(2, "Enter your facility name").max(160),
  position: z.string().trim().min(2, "Enter your position").max(120),
  contact: z.string().trim().min(8, "Enter a valid phone number").max(24),
  email: z.string().trim().email("Enter a valid email").max(255),
  visitDate: z.date({ required_error: "Choose a preferred visit date" }),
  visitTime: z
    .string()
    .min(1, "Choose a preferred visit time")
    .regex(/^\d{2}:\d{2}$/, "Choose a valid visit time"),
});

type FormState = {
  personName: string;
  facilityName: string;
  position: string;
  contact: string;
  email: string;
  visitDate: Date | undefined;
  visitTime: string;
};

const initialForm: FormState = {
  personName: "",
  facilityName: "",
  position: "",
  contact: "",
  email: "",
  visitDate: undefined,
  visitTime: "",
};

const FacilityAssessmentPage = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormState, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      submitFacilityAssessmentToWhatsApp(parsed.data);
      toast.success("Opening WhatsApp", {
        description: "Send the pre-filled message to confirm your booking request.",
      });
      setForm(initialForm);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <SiteLayout>
      <div className="bg-gradient-section border-b border-border/60">
        <div className="site-wrap py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">
            Free facility assessment
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4 max-w-2xl">
            Book your visit
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Tell us about your facility and preferred date and time. We&apos;ll open WhatsApp with your details so you can
            send the request directly to our team.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl gutter-x py-10 md:py-14">
        <form
          onSubmit={handleSubmit}
          className="glass-panel-teal rounded-3xl border border-border/50 p-6 sm:p-8 space-y-6 shadow-soft"
        >
          <div className="space-y-2">
            <Label htmlFor="personName">Your name</Label>
            <Input
              id="personName"
              value={form.personName}
              onChange={(e) => update("personName", e.target.value)}
              placeholder="e.g. Dr. Jane Wanjiku"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facilityName">Facility name</Label>
            <Input
              id="facilityName"
              value={form.facilityName}
              onChange={(e) => update("facilityName", e.target.value)}
              placeholder="e.g. Westlands Family Clinic"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position in the facility</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => update("position", e.target.value)}
              placeholder="e.g. Clinic Manager, Nurse In-Charge"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact (phone)</Label>
            <Input
              id="contact"
              type="tel"
              value={form.contact}
              onChange={(e) => update("contact", e.target.value)}
              placeholder="e.g. +254 712 345 678"
              autoComplete="tel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@facility.co.ke"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred visit date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal min-h-[44px]",
                    !form.visitDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {form.visitDate ? format(form.visitDate, "PPP") : "Select a date for the visit"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.visitDate}
                  onSelect={(date) => {
                    update("visitDate", date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date < today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitTime">Preferred visit time</Label>
            <Input
              id="visitTime"
              type="time"
              value={form.visitTime}
              onChange={(e) => update("visitTime", e.target.value)}
              min="08:00"
              max="17:00"
              step={1800}
              disabled={!form.visitDate}
              className="min-h-[44px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              {form.visitDate
                ? "Business hours: 8:00 AM – 5:00 PM"
                : "Select a date first, then choose a time"}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full min-h-[48px] text-sm font-semibold"
            disabled={submitting}
          >
            {submitting ? "Opening WhatsApp…" : "Submit & send via WhatsApp"}
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By submitting, WhatsApp opens with your details pre-filled. Tap send in WhatsApp to complete your
            booking request.
          </p>
        </form>
      </div>
    </SiteLayout>
  );
};

export default FacilityAssessmentPage;
