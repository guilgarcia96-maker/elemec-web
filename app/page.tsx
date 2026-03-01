import Image from "next/image";
import Link from "next/link";

const templates = [
  {
    key: "azul-dorado",
    label: "Azul + Dorado",
    description: "Paleta oscura con azul marino y detalles dorados. Ideal para perfil profesional e industrial.",
    href: "/plantillas/azul-dorado",
    bg: "#00142b",
    accent: "#957C3D",
  },
  {
    key: "amarillo-verde",
    label: "Amarillo-verde + Gris",
    description: "Paleta clara con fondo blanco y acento amarillo-verde vibrante. Moderna y fresca.",
    href: "/plantillas/amarillo-verde",
    bg: "#ffffff",
    accent: "#BAFF39",
  },
  {
    key: "beige",
    label: "Versión Beige",
    description: "Paleta cálida en tonos beige y tierra. Elegante y acogedora.",
    href: "/plantillas/beige",
    bg: "#f6f1ed",
    accent: "#957C3D",
  },
];

export default function PlantillasHome() {
  return (
    <div className="min-h-screen bg-[#0d1717] text-[#eef4f3]">
      <header className="border-b border-zinc-800 bg-[#0d1717]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.PNG" alt="ELEMEC" width={160} height={56} priority />
            <span className="hidden text-xs tracking-[0.28em] text-zinc-400 md:block">
              OBRAS Y SERVICIOS DE INGENIERÍA
            </span>
          </div>
          <span className="text-xs text-zinc-500">Selector de plantillas</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold">Plantillas del sitio ELEMEC</h1>
          <p className="mt-4 text-zinc-400">
            Elige la versión visual que mejor represente a tu empresa. Cada plantilla aplica una paleta de colores distinta al mismo contenido.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.key}
              href={template.href}
              className="group block overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 transition hover:border-zinc-500 hover:shadow-xl"
            >
              <div
                className="flex h-40 items-center justify-center border-b border-zinc-700"
                style={{ backgroundColor: template.bg }}
              >
                <span
                  className="rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: template.accent, color: "#000" }}
                >
                  {template.label}
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-white">{template.label}</h2>
                <p className="mt-2 text-sm text-zinc-400">{template.description}</p>
                <span className="mt-4 inline-block text-xs font-medium text-zinc-500 group-hover:text-zinc-300">
                  Ver plantilla →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
