'use client'

import { EventItem } from '@/types/database'
import { useState } from 'react'
import { createEvent, deleteEvent } from '@/lib/actions/dashboard'
import { CalendarPlus, Trash2, Loader2, AlertCircle, Ticket, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface EventsManagerProps {
  events: EventItem[]
}

export function EventsManager({ events }: EventsManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError('')
    const formData = new FormData(e.currentTarget)
    const result = await createEvent(formData)
    if (result?.error) setError(result.error)
    else (e.target as HTMLFormElement).reset()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteEvent(id)
    setDeletingId(null)
  }

  const sorted = [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  return (
    <div className="space-y-6">
      {/* Formulario nuevo evento */}
      <div className="glass-card p-5 rounded-2xl border border-white/5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-purple-400" />
          Agregar evento
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="title"
            required
            placeholder="Nombre del evento"
            className="col-span-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
          />
          <input
            name="event_date"
            type="datetime-local"
            required
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white/70"
          />
          <input
            name="location"
            placeholder="Lugar (opcional)"
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
          />
          <input
            name="ticket_url"
            type="url"
            placeholder="URL de boletos (opcional)"
            className="col-span-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
          />
          {error && (
            <p className="col-span-2 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="col-span-2 sm:col-span-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            Agregar evento
          </button>
        </form>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center border border-white/5 border-dashed">
            <p className="text-muted-foreground text-sm">Aún no hay eventos. ¡Agrega tu primera fecha!</p>
          </div>
        ) : (
          sorted.map(event => (
            <div key={event.id} className="glass-card p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-white/5 rounded-lg border border-white/10 shrink-0 text-center">
                <span className="text-xs text-purple-400 font-medium uppercase leading-none">
                  {format(new Date(event.event_date), 'MMM', { locale: es })}
                </span>
                <span className="text-lg font-bold leading-none">
                  {format(new Date(event.event_date), 'dd')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{event.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {event.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{event.location}
                    </span>
                  )}
                  {event.ticket_url && (
                    <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-purple-400 flex items-center gap-1 hover:text-purple-300">
                      <Ticket className="w-3 h-3" />Boletos
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(event.id)}
                disabled={deletingId === event.id}
                className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
