import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARGOS SST — Sistema de Gestión de Seguridad y Salud Ocupacional",
  description: "Sistema ARGOS SST para gestión de inspecciones, entrega de EPP, hallazgos y documentos de Seguridad y Salud en el Trabajo.",
};

import { FeedbackProvider } from '@/components/common/FeedbackUI';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <FeedbackProvider>
          {children}
        </FeedbackProvider>
      </body>
    </html>
  );
}
