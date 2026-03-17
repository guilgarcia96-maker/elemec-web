"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/admin/cotizaciones");
    } else {
      setError("Credenciales incorrectas.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#13131f] p-8">
        <p className="text-2xl font-bold text-[#e2b44b]">ELEMEC</p>
        <p className="mt-1 text-sm text-white/50">Backoffice — Acceso</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b]"
              placeholder="admin@elemec.cl"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b]"
              placeholder="••••••••"
            />
          </div>
          <p className="text-xs text-white/35">
            En el primer acceso puedes usar la clave temporal configurada en el entorno.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#e2b44b] py-2.5 font-bold text-black hover:bg-[#d4a43a] transition disabled:opacity-60"
          >
            {loading ? "Verificando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
