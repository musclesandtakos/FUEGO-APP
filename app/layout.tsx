import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FUEGO AI Chatbot",
  description: "AI Chatbot with AI Elements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
