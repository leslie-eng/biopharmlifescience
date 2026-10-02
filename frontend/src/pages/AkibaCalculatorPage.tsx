import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AkibaCalculator } from "@/components/site/AkibaCalculator";

const AkibaCalculatorPage = () => (
  <SiteLayout>
    <div className="bg-gradient-section border-b border-border/60">
      <div className="site-wrap py-8 md:py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </div>
    <div className="mx-auto max-w-4xl gutter-x-sm py-8 md:py-10">
      <AkibaCalculator />
    </div>
  </SiteLayout>
);

export default AkibaCalculatorPage;
