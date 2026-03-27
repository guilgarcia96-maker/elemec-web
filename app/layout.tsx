import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "ELEMEC | Obras y Servicios de Ingeniería en Magallanes",
  description:
    "Empresa con 18 años de trayectoria en Magallanes. Proyectos y mantenciones en gas, calefacción, electricidad, vapor y utilidades industriales.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "ELEMEC SPA",
  "description": "Obras y servicios de ingeniería industrial en Magallanes",
  "url": "https://elemec-web-six.vercel.app",
  "telephone": "+56996492917",
  "email": "elemec.magallanes@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Arturo Prat 1602",
    "addressLocality": "Punta Arenas",
    "addressRegion": "Magallanes",
    "addressCountry": "CL",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -53.1548,
    "longitude": -70.9114,
  },
  "openingHours": "Mo-Fr 08:00-18:00",
  "foundingDate": "2007",
  "taxID": "76.715.440-2",
  "areaServed": "Región de Magallanes y de la Antártica Chilena",
  "serviceType": [
    "Montaje Industrial",
    "Mantención de Equipos",
    "Ingeniería y Diseño",
    "Aislación Térmica",
    "Servicios Básicos Industriales",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {/* Enlace de salto para accesibilidad */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-orange-500 focus:text-white focus:px-4 focus:py-2 focus:rounded"
        >
          Saltar al contenido
        </a>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
