import { ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export const SiteFooter = () => (
  <footer id="contact" className="border-t border-border bg-muted/30 mt-24">
    <div className="container py-14 grid gap-10 md:grid-cols-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-md bg-gradient-brand flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <p className="font-display font-bold text-primary">Biolink Solutions EA</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Certified medical consumables and infection control supplies for healthcare facilities across East Africa.
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 text-foreground">Company</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="#about" className="hover:text-primary">About us</a></li>
          <li><a href="#products" className="hover:text-primary">Products</a></li>
          <li><a href="#contact" className="hover:text-primary">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 text-foreground">Categories</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Protective Gloves</li>
          <li>Masks &amp; Safety Gear</li>
          <li>Disinfectants</li>
          <li>Waste Management</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 text-foreground">Get in touch</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +254 714 647 972</li>
          <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> biolinksolutions7@gmail.com</li>
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Eastern Bypass, Nairobi</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Biolink Solutions EA. All rights reserved.
    </div>
  </footer>
);
