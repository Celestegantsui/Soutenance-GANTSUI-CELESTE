import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/appBranding";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
