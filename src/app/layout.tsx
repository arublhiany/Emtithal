import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import "./globals.css";
import { DemoStoreProvider } from "@/lib/store/demoStore";

// Cairo is the canonical Emtithal UI font (product-owner locked). One family,
// used across the whole product.
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "امتثال | Emtithal",
  description:
    "منصة امتثال — منصة ذكاء اصطناعي للامتثال الاستباقي وذكاء القرار لشركات خدمة الحج والجهات الرقابية.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <body className="min-h-full antialiased">
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
