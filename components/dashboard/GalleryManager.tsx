'use client'

import { GalleryItem } from '@/types/database'
import { useState } from 'react'
import { addGalleryItem, deleteGalleryItem } from '@/lib/actions/dashboard'
import { ImagePlus, Trash2, Loader2, AlertCircle } from 'lucide-react'

interface GalleryManagerProps {
  items: GalleryItem[]
}

export function GalleryManager({ items }: GalleryManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError('')
    const formData = new FormData(e.currentTarget)
    const result = await addGalleryItem(formData)
    if (result?.error) setError(result.error)
    else (e.target as HTMLFormElement).reset()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteGalleryItem(id)
    setDeletingId(null)
  }

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      {/* Formulario de nueva foto */}
      <div className="glass-card p-5 rounded-2xl border border-white/5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-purple-400" />
          Agregar foto a la galería
        </h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground block">Opción 1: Subir archivo</label>
            <input
              name="image_file"
              type="file"
              accept="image/*"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex-1 h-px bg-white/10"></span>
            o
            <span className="flex-1 h-px bg-white/10"></span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground block">Opción 2: Usar URL</label>
            <input
              name="image_url"
              type="url"
              placeholder="URL de la imagen (https://...)"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
            />
          </div>
          <input
            name="caption"
            placeholder="Descripción (opcional)"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
          />
          {error && (
            <p className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            Agregar
          </button>
        </form>
      </div>

      {/* Grid de fotos */}
      {sorted.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center border border-white/5 border-dashed">
          <p className="text-muted-foreground text-sm">La galería está vacía. ¡Agrega tus primeras fotos!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sorted.map(item => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-800 border border-white/5">
              <img src={item.image_url} alt={item.caption || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                {item.caption && <p className="text-xs text-white line-clamp-2">{item.caption}</p>}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
