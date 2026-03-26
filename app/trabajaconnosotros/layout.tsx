import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trabaja con Nosotros | ELEMEC",
  description: "Únete al equipo de ELEMEC en Punta Arenas. Buscamos técnicos en gas, electricistas, mecánicos y profesionales de ingeniería en Magallanes.",
  openGraph: {
    title: "Trabaja con Nosotros | ELEMEC",
    description: "Únete al equipo de ELEMEC en Punta Arenas. Oportunidades laborales en servicios industriales en Magallanes.",
  },
};

export default function TrabajaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
