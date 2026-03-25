import type { MetadataRoute } from 'next';

const BASE = 'https://elemec-web-six.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const servicios = [
    'montaje-instalaciones',
    'mantencion-equipos',
    'ingenieria-diseno',
    'aislacion-termica',
    'servicios-basicos-industriales',
  ];

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/quienes-somos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/servicios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    ...servicios.map((slug) => ({
      url: `${BASE}/servicios/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: `${BASE}/cotiza-aqui`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/trabajaconnosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];
}
