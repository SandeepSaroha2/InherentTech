import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "KudoDoc — Digital Signatures",
  description: "AI-Native Digital Signatures",
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
