// app/page.tsx
import Navbar from "@/layout/Navbar";
import Hero from "@/home/Hero";
import KanaSection from "@/home/KanaSection";
import TrustedLogos from "@/home/TrustedLogos";
import SeoContent from "@/home/SeoContent";
import ChatWidgetLazy from "@/components/Chat/ChatWidgetLazy";
import { LearnedKanaProvider } from "@/context/LearnedKanaContext";

export default function Home() {
  return (
    <LearnedKanaProvider>
      <div className="relative min-h-screen">
        <Navbar />

        <main>
          <Hero />
          <KanaSection />
          <TrustedLogos />
          <SeoContent />
        </main>

        <ChatWidgetLazy />
      </div>
    </LearnedKanaProvider>
  );
}