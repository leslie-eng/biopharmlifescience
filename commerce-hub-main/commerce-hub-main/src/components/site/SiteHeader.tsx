import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ABOUT_PATH } from "@/lib/about";
import { AKIBA_CALCULATOR_PATH } from "@/lib/akibaCalculator";
import { BrandLogo } from "@/components/site/BrandLogo";
import { scrollToSection } from "@/lib/contact";

const navLinkClass =
  "text-[13px] transition-colors cursor-pointer bg-transparent border-none font-sans p-0";

const mobileNavLinkClass =
  "block w-full text-left text-base font-medium py-3 px-1 border-b border-border/60 last:border-0 transition-colors";

export const SiteHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const closeMenu = () => setMenuOpen(false);

  const goTo = (id: string) => {
    closeMenu();
    if (pathname !== "/") {
      navigate({ pathname: "/", hash: `#${id}` });
      return;
    }
    scrollToSection(id);
  };

  return (
    <header className="site-chrome sticky top-0 z-40 w-full border-b pt-[env(safe-area-inset-top)]">
      <div className="site-wrap flex h-14 sm:h-16 items-center justify-between gap-3">
        <BrandLogo className="pr-2" onClick={closeMenu} />

        <nav className="site-nav hidden lg:flex items-center gap-6" aria-label="Main navigation">
          <button type="button" className={navLinkClass} onClick={() => goTo("the-model")}>
            Dhibiti Model
          </button>
          <Link to="/products" className={navLinkClass}>
            Products
          </Link>
          <Link to={AKIBA_CALCULATOR_PATH} className={navLinkClass}>
            Akiba Calculator
          </Link>
          <Link to={ABOUT_PATH} className={navLinkClass}>
            About
          </Link>
        </nav>

        <div className="flex items-center shrink-0">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="site-chrome w-[min(100vw-2rem,20rem)] p-0 flex flex-col"
            >
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
                <SheetTitle className="font-serif text-left text-lg">Menu</SheetTitle>
              </SheetHeader>
              <nav className="site-nav flex-1 px-6 py-4 overflow-y-auto" aria-label="Mobile navigation">
                <button type="button" className={mobileNavLinkClass} onClick={() => goTo("the-model")}>
                  Dhibiti Model
                </button>
                <Link to="/products" className={mobileNavLinkClass} onClick={closeMenu}>
                  Products
                </Link>
                <Link to={AKIBA_CALCULATOR_PATH} className={mobileNavLinkClass} onClick={closeMenu}>
                  Akiba Calculator
                </Link>
                <Link to="/the-model" className={mobileNavLinkClass} onClick={closeMenu}>
                  Full Dhibiti model details
                </Link>
                <Link to={ABOUT_PATH} className={mobileNavLinkClass} onClick={closeMenu}>
                  About
                </Link>
                <button
                  type="button"
                  className={mobileNavLinkClass}
                  onClick={() => {
                    closeMenu();
                    if (pathname !== "/") navigate({ pathname: "/", hash: "#contact" });
                    else scrollToSection("contact");
                  }}
                >
                  Contact
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
