// app/layout.tsx
import "./globals.css";

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
    <html lang="vi">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}