// app/page.tsx
import Navbar from "@/layout/Navbar";
import Hero from "@/home/Hero";
import KanaSection from "@/home/KanaSection";
import TrustedLogos from "@/home/TrustedLogos";
import SeoContent from "@/home/SeoContent";

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