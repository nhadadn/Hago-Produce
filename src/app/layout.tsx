import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Hago Produce — Gestión Integral para Productos Frescos",
    template: "%s | Hago Produce",
  },
  description:
    "Plataforma B2B para la gestión integral de facturación, órdenes de compra y análisis de negocio para la industria de productos frescos en Canadá.",
  keywords: ["produce management", "fresh produce", "B2B invoicing", "agricultural tech", "invoice system"],
  openGraph: {
    title: "Hago Produce — Gestión Integral para Productos Frescos",
    description:
      "Facturación, órdenes de compra y reportes en tiempo real para empresas de productos frescos.",
    type: "website",
    locale: "es_CA",
    siteName: "Hago Produce",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
