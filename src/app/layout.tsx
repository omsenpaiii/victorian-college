import type { Metadata } from "next";
import { Geist, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const libre = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-editorial" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "Victorian College of Knowledge", template: "%s | Victorian College of Knowledge" },
  description: "Practical learning, personal support and clear pathways for your next chapter in Melbourne.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { Chatbot } from "@/components/Chatbot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className={`${geist.variable} ${libre.variable} min-h-full flex flex-col`}>
        {children}
        {process.env.GEMINI_API_KEY ? <Chatbot /> : null}
      </body>
    </html>
  );
}
