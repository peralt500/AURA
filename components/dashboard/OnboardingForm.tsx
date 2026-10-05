'use client'

import { useState } from 'react'
import { createCreatorProfile } from '@/lib/actions/dashboard'
import { Sparkles, Loader2, AlertCircle, ArrowRight, User, AtSign, AlignLeft } from 'lucide-react'

export function OnboardingForm({ userEmail }: { userEmail?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sugerir un nombre de usuario basado en el email
  const suggestedUsername = userEmail ? userEmail.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase() : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createCreatorProfile(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4">
            <Sparkles className="w-7 h-7 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold">¡Bienvenido a Agenda Creadores!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Crea tu perfil de artista para habilitar tu página pública y empezar a registrar fans.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-400" />
              Nombre Artístico
            </label>
            <input
              type="text"
              name="display_name"
              required
              placeholder="Ej: Big The Mo"
              disabled={loading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <AtSign className="w-4 h-4 text-purple-400" />
              Nombre de usuario (@slug para tu enlace)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                localhost:3000/
              </span>
              <input
                type="text"
                name="username"
                required
                defaultValue={suggestedUsername}
                placeholder="bigthemo"
                disabled={loading}
                className="w-full pl-36 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 lowercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas, números o guiones. Será tu enlace público para compartir.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-purple-400" />
              Biografía corta (opcional)
            </label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Cantautor, productor y creador independiente..."
              disabled={loading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creando tu perfil...</>
            ) : (
              <>Crear mi perfil de artista <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
