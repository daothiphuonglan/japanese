// app/layout.tsx
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SocketProvider } from '@/context/SocketContext';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Học bảng chữ cái tiếng Nhật (Hiragana, Katakana)",
  description:
    "Học Hiragana và Katakana dễ nhớ với audio, mẹo nhớ và luyện tập miễn phí.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body className="bg-gray-50 text-gray-900">
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}