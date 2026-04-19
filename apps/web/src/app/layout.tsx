import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "InherentTech — AI-Powered Staffing Solutions",
  description: "AI-Powered Staffing Solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
