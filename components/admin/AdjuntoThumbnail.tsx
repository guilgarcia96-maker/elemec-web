"use client";

import { useEffect, useState } from "react";

interface AdjuntoThumbnailProps {
  storagePath: string | null;
  alt?: string;
  onClick?: () => void;
  size?: "sm" | "md";
}

const SIZES = { sm: 32, md: 48 } as const;

export default function AdjuntoThumbnail({
  storagePath,
  alt = "Adjunto",
  onClick,
  size = "sm",
}: AdjuntoThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null);
  const px = SIZES[size];

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      return;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      setUrl(
        `${supabaseUrl}/storage/v1/object/public/backoffice-docs/${storagePath}`
      );
    }
  }, [storagePath]);

  const wrapperClass = `relative shrink-0 cursor-pointer overflow-hidden rounded-md border transition hover:scale-105 ${
    storagePath && url
      ? "border-gray-200 hover:border-orange-500"
      : "border-gray-200 bg-gray-50 hover:border-gray-300"
  }`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={wrapperClass}
      style={{ width: px, height: px }}
      title={alt}
    >
      {storagePath && url ? (
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <svg
          className="h-full w-full p-1.5 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}
    </button>
  );
}
