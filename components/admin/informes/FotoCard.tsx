'use client';

interface FotoCardProps {
  src: string;
  descripcion: string;
  onDescripcionChange: (val: string) => void;
  onAnalizar: () => void;
  analizando: boolean;
  orden: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
}

export default function FotoCard({
  src,
  descripcion,
  onDescripcionChange,
  onAnalizar,
  analizando,
  orden,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FotoCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Imagen */}
      <div className="relative">
        <img
          src={src}
          alt={`Foto ${orden}`}
          className="w-full h-48 object-cover"
        />
        {/* Badge orden */}
        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded">
          #{orden}
        </span>
        {/* Badge IA */}
        {descripcion && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            IA
          </span>
        )}
        {/* Botón eliminar */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute bottom-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded transition"
            title="Eliminar foto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 space-y-2">
        <textarea
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          placeholder="Descripción de la foto..."
          rows={3}
          className="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 resize-none"
        />

        <div className="flex items-center gap-1.5">
          {/* Analizar con IA */}
          {!descripcion && !analizando && (
            <button
              type="button"
              onClick={onAnalizar}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded transition font-medium"
            >
              Analizar con IA
            </button>
          )}
          {analizando && (
            <span className="text-xs text-orange-500 flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analizando...
            </span>
          )}

          {/* Flechas reordenar */}
          <div className="ml-auto flex items-center gap-0.5">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="p-1 text-gray-400 hover:text-gray-700 transition"
                title="Mover arriba"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="p-1 text-gray-400 hover:text-gray-700 transition"
                title="Mover abajo"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
