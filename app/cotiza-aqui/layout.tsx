import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitar Cotización | ELEMEC",
  description: "Solicita una cotización para servicios industriales en Magallanes. Montaje, mantención, ingeniería y más. Respuesta en menos de 24 horas.",
  openGraph: {
    title: "Solicitar Cotización | ELEMEC",
    description: "Solicita una cotización para servicios industriales en Magallanes. Respuesta en menos de 24 horas.",
  },
};

export default function CotizaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
