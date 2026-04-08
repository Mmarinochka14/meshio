import HeroSection from "../components/HeroSection";
import CategoriesSection from "../components/CategoriesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import WeeklyModelsSection from "../components/WeeklyModelsSection";
import AdvantagesSection from "../components/AdvantagesSection";
import NewModelsSection from "../components/NewModelsSection";
import FAQSection from "../components/FAQSection";

export default function HomePage({ onOpenSellerModal }) {
  return (
    <>
      <HeroSection onOpenSellerModal={onOpenSellerModal} />
      <CategoriesSection />
      <HowItWorksSection />
      <WeeklyModelsSection />
      <AdvantagesSection />
      <NewModelsSection />
      <FAQSection />
    </>
  );
}
