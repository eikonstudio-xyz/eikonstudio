import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { DemoSection } from "@/components/demo-section";
import { FeaturesSection } from "@/components/features-section";
import { PackagesSection } from "@/components/packages-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <DemoSection />
        <FeaturesSection />
        <PackagesSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
