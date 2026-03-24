"use client";

import { useState } from "react";
import AdjuntoPreviewPanel from "@/components/admin/AdjuntoPreviewPanel";
import AdjuntoThumbnail from "@/components/admin/AdjuntoThumbnail";

interface Adjunto {
  id: string;
  nombre_archivo: string;
  storage_path?: string;
  created_at: string;
  subido_por: string | null;
}

interface Props {
  adjunto: Adjunto;
  openHref: string;
  storagePath: string | null;
}

export default function CotizacionAdjuntoPreview({ adjunto, openHref, storagePath }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  function getImageUrl(path: string | null): string | null {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/backoffice-docs/${path}`;
  }

  const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(adjunto.nombre_archivo);

  return (
    <>
      {isImage && (
        <AdjuntoThumbnail
          storagePath={storagePath}
          alt={adjunto.nombre_archivo}
          onClick={() => setPanelOpen(true)}
          size="md"
        />
      )}

      <AdjuntoPreviewPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        imageUrl={getImageUrl(storagePath)}
        titulo={adjunto.nombre_archivo}
        datos={[
          { label: "Archivo", valor: adjunto.nombre_archivo },
          { label: "Fecha", valor: new Date(adjunto.created_at).toLocaleString("es-CL") },
          { label: "Origen", valor: adjunto.subido_por ? "Interno" : "Cliente" },
        ]}
      />
    </>
  );
}
