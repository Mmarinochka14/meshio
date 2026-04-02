import HeroSection from "../components/HeroSection";
import CategoriesSection from "../components/CategoriesSection";
import HowItWorksSection from "../components/HowItWorksSection";

import WeeklyModelsSection from "../components/WeeklyModelsSection";
import AdvantagesSection from "../components/AdvantagesSection";
import NewModelsSection from "../components/NewModelsSection";
import FAQSection from "../components/FAQSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />

      <WeeklyModelsSection />
      <AdvantagesSection />
      <NewModelsSection />
      <FAQSection />
    </>
  );
}
