import type { Metadata } from "next";
import "./globals.css";
import { getDictionary } from "@/lib/i18n";

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict.app.title,
  description: dict.app.description,
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
