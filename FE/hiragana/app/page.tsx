// app/page.tsx
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import KanaSection from "@/components/home/KanaSection";
import TrustedLogos from "@/components/home/TrustedLogos";
import SeoContent from "@/components/home/SeoContent";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <KanaSection />
      <TrustedLogos />
      <SeoContent />
    </>
  );
}