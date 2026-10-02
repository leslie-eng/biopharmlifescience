import { SiteChatbot } from "@/components/site/SiteChatbot";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BiolinkLanding } from "@/components/site/BiolinkLanding";

const Index = () => (
  <div className="homepage min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1">
      <BiolinkLanding />
    </main>
    <SiteChatbot />
  </div>
);

export default Index;
