import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Epoha",
  description: "D&D operations",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
