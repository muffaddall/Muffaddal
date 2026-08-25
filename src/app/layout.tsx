import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Private money dashboard: expenses, investments, and savings.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0f0e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full`}>
      <body className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] antialiased">
        {children}
      </body>
    </html>
  );
}
