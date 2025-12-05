import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodLabStudio - Code. Lab. Collaborate.",
  description:
    "CodLabStudio (pronounced 'Colab Studio') - Collaborative code execution platform where teams write, execute, and debug code together in real-time",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
