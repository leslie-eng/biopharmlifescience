import { SiteChatbot } from "@/components/site/SiteChatbot";
import { BrandLogo } from "@/components/site/BrandLogo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, WHATSAPP_URL } from "@/lib/contact";

export const SiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <footer className="site-footer border-t border-border py-8 mt-auto safe-bottom">
      <div className="site-wrap flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-sm text-muted-foreground text-center sm:text-left">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <BrandLogo className="hover:opacity-90 transition-opacity" />
          <p className="text-xs mt-0 sm:pl-[2.75rem]">Clean. Safe. Reliable.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
          <a href={PHONE_HREF} className="hover:text-primary transition-colors min-h-[44px] inline-flex items-center">{PHONE_DISPLAY}</a>
          <a href={EMAIL_HREF} className="hover:text-primary transition-colors break-all min-h-[44px] inline-flex items-center">{EMAIL}</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors min-h-[44px] inline-flex items-center">WhatsApp</a>
        </div>
        <p className="text-xs">© 2025 Biopharmlifescience East Africa Ltd</p>
      </div>
    </footer>
    <SiteChatbot />
  </div>
);
