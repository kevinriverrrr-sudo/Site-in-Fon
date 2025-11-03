import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js приложение",
  description: "Современное веб-приложение на Next.js 14",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
