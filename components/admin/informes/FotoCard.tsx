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
  compact?: boolean;
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
  compact = false,
}: FotoCardProps) {
  const analizada = !!descripcion && !analizando;

  return (
    <div
      className={`group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
        compact ? '' : ''
      }`}
    >
      {/* ── Imagen ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <img
          src={src}
          alt={`Foto ${orden}`}
          loading="lazy"
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
            compact ? 'h-36' : 'h-48'
          }`}
        />

        {/* Overlay gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Badge número */}
        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
          #{orden}
        </span>

        {/* Indicador de estado */}
        <span
          className={`absolute top-2 right-10 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm ${
            analizando
              ? 'bg-orange-500/90 text-white'
              : analizada
                ? 'bg-green-500/90 text-white'
                : 'bg-gray-500/70 text-white'
          }`}
          title={analizando ? 'Analizando...' : analizada ? 'Analizada' : 'Pendiente'}
        >
          {analizando ? (
            <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : analizada ? (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {analizando ? 'IA' : analizada ? 'OK' : '—'}
        </span>

        {/* Botón eliminar */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-600 text-white rounded-md flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Eliminar foto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Flechas reordenar (overlay bottom) */}
        {(onMoveUp || onMoveDown) && (
          <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-md flex items-center justify-center transition"
                title="Mover a la izquierda"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-md flex items-center justify-center transition"
                title="Mover a la derecha"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Contenido ──────────────────────────────────────────── */}
      <div className="p-3 space-y-2">
        <textarea
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          placeholder="Descripción de la foto..."
          rows={compact ? 2 : 3}
          className="w-full rounded-lg border border-gray-200 bg-[#f8f9fb] px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white resize-none leading-relaxed"
        />

        {/* Botón analizar con IA */}
        {!analizada && !analizando && (
          <button
            type="button"
            onClick={onAnalizar}
            className="w-full flex items-center justify-center gap-1.5 text-xs bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 px-2.5 py-1.5 rounded-lg transition-all duration-200 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            Analizar con IA
          </button>
        )}

        {analizando && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 py-1">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analizando imagen...
          </div>
        )}
      </div>
    </div>
  );
}
