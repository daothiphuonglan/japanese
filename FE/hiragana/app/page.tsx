// app/page.tsx
import Navbar from "@/layout/Navbar";
import Hero from "@/home/Hero";
import KanaSection from "@/home/KanaSection";
import TrustedLogos from "@/home/TrustedLogos";
import SeoContent from "@/home/SeoContent";
import ChatWidget from "@/components/Chat/ChatWidget"; // Import Widget thay vì ChatBox

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      
      <main>
        <Hero />
        <KanaSection />
        <TrustedLogos />
        <SeoContent />
      </main>

      {/* Không cần truyền gì cả! 
        ChatWidget bên trong nó sẽ tự gọi <ChatBox currentUser={user} /> 
        khi nó tìm thấy user trong localStorage.
      */}
      <ChatWidget />
    </div>
  );
}