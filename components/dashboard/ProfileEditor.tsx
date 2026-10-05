'use client'

import { Creator } from '@/types/database'
import { useState } from 'react'
import { updateProfile } from '@/lib/actions/dashboard'
import { User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ProfileEditorProps {
  creator: Creator
}

export function ProfileEditor({ creator }: ProfileEditorProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const social = (creator.social_links as Record<string, string>) || {}

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setStatus('idle')
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    if (result?.error) { setStatus('error'); setMessage(result.error) }
    else { setStatus('success'); setMessage('Perfil actualizado correctamente.') }
    setLoading(false)
  }

  const fields = [
    { name: 'display_name', label: 'Nombre artístico', placeholder: 'Luna Valente', required: true, defaultValue: creator.display_name },
    { name: 'bio', label: 'Biografía', placeholder: 'Cuéntales a tus fans quién eres...', required: false, defaultValue: creator.bio || '', textarea: true },
  ]

  const socialFields = [
    { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { name: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
    { name: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
    { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
    { name: 'shop', label: 'Tienda (URL)', placeholder: 'https://tienda.tu-dominio.com' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-purple-400" />Información básica</h3>
        {fields.map(f => (
          <div key={f.name} className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{f.label}</label>
            {f.textarea ? (
              <textarea
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={f.defaultValue}
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30 resize-none"
              />
            ) : (
              <input
                type="text"
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={f.defaultValue}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
              />
            )}
          </div>
        ))}
        
        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium text-muted-foreground">Foto de perfil (Avatar)</label>
          <div className="space-y-2">
            <span className="text-xs text-white/50 block">Opción 1: Subir archivo</span>
            <input
              name="avatar_file"
              type="file"
              accept="image/*"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex-1 h-px bg-white/10"></span>
            o
            <span className="flex-1 h-px bg-white/10"></span>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-white/50 block">Opción 2: Usar URL</span>
            <input
              type="url"
              name="avatar_url"
              placeholder="https://..."
              defaultValue={creator.avatar_url || ''}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
        <h3 className="font-semibold">Redes sociales y tienda</h3>
        {socialFields.map(f => (
          <div key={f.name} className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{f.label}</label>
            <input
              type="url"
              name={f.name}
              placeholder={f.placeholder}
              defaultValue={social[f.name] || ''}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
            />
          </div>
        ))}
      </div>

      {status !== 'idle' && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-xl border ${status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto py-2.5 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Guardar cambios
      </button>
    </form>
  )
}
