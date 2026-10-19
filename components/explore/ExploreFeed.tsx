'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Creator, EventItem, GalleryItem } from '@/types/database'
import { Search, Sparkles, Calendar, Image as ImageIcon, MapPin, Share2, ArrowRight, User, ExternalLink, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExploreFeedProps {
  creators: Creator[]
  events: (EventItem & { creators?: { username: string; display_name: string; avatar_url: string | null } })[]
  galleryItems: (GalleryItem & { creators?: { username: string; display_name: string; avatar_url: string | null } })[]
  currentUser: any | null
  currentCreator: Creator | null
}

export function ExploreFeed({
  creators,
  events,
  galleryItems,
  currentUser,
  currentCreator,
}: ExploreFeedProps) {
  const [search, setSearch] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const handleShare = (username: string) => {
    const url = `${window.location.origin}/${username}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedSlug(username)
      setTimeout(() => setCopiedSlug(null), 2000)
    }
  }

  const query = search.toLowerCase().trim()

  // 1. Buscador de artistas
  const matchingCreators = useMemo(() => {
    if (!query) return []
    return creators.filter(c =>
      c.display_name.toLowerCase().includes(query) ||
      c.username.toLowerCase().includes(query) ||
      (c.bio && c.bio.toLowerCase().includes(query))
    )
  }, [creators, query])

  // 2. Feed cronológico de publicaciones y actualizaciones
  const feedItems = useMemo(() => {
    const items: Array<
      | { type: 'gallery'; date: string; data: typeof galleryItems[0] }
      | { type: 'event'; date: string; data: typeof events[0] }
    > = []

    galleryItems.forEach(g => {
      if (
        !query ||
        (g.caption && g.caption.toLowerCase().includes(query)) ||
        (g.creators?.display_name && g.creators.display_name.toLowerCase().includes(query)) ||
        (g.creators?.username && g.creators.username.toLowerCase().includes(query))
      ) {
        items.push({ type: 'gallery', date: g.created_at, data: g })
      }
    })

    events.forEach(e => {
      if (
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.location && e.location.toLowerCase().includes(query)) ||
        (e.creators?.display_name && e.creators.display_name.toLowerCase().includes(query)) ||
        (e.creators?.username && e.creators.username.toLowerCase().includes(query))
      ) {
        items.push({ type: 'event', date: e.created_at || e.event_date, data: e })
      }
    })

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [galleryItems, events, query])

  return (
    <div className="min-h-screen pb-24 text-foreground selection:bg-purple-600 selection:text-white">
      {/* Top Navbar minimalista: solo Logo + Mi Perfil / Login */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo AURA */}
          <Link href="/explore" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 group-hover:border-purple-500 transition-colors">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
              AURA
            </span>
          </Link>

          {/* Navegación derecha: Botón "Mi Perfil" (lleva directo a tu perfil) */}
          <div className="flex items-center gap-3">
            {currentCreator ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href={`/${currentCreator.username}`}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/25 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Mi Perfil</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-colors text-xs"
                  title="Panel de control"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/login?tab=register"
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Crear Perfil</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Buscador de Artista en tiempo real */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Buscar artista o creador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 focus:border-purple-500/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-white placeholder:text-white/40 backdrop-blur-md transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Resultados del Buscador de Artista */}
        {query && matchingCreators.length > 0 && (
          <div className="space-y-3 pb-2">
            <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Artistas encontrados ({matchingCreators.length})
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {matchingCreators.map(creator => (
                <div
                  key={creator.id}
                  className="glass-card p-3.5 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3"
                >
                  <Link href={`/${creator.username}`} className="flex items-center gap-3 group min-w-0 flex-1">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.display_name}
                        className="w-11 h-11 rounded-xl object-cover border border-purple-500/30 shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-purple-600/30 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                        {creator.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                        {creator.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">@{creator.username}</p>
                    </div>
                  </Link>

                  <Link
                    href={`/${creator.username}`}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <span>Ver perfil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explorador Feed (Publicaciones y Actualizaciones) */}
        <div className="space-y-6">
          {feedItems.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border border-white/5 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto" />
              <p className="font-semibold text-sm text-white">No hay publicaciones disponibles</p>
              <p className="text-xs text-muted-foreground">
                {query ? 'No se encontraron resultados para tu búsqueda.' : 'Los artistas aún no han publicado actualizaciones.'}
              </p>
            </div>
          ) : (
            feedItems.map((item, idx) => {
              if (item.type === 'gallery') {
                const photo = item.data as GalleryItem & { creators?: { username: string; display_name: string; avatar_url: string | null } }
                const creator = photo.creators

                return (
                  <article
                    key={`feed-gallery-${photo.id}-${idx}`}
                    className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl shadow-black/20"
                  >
                    {/* Cabecera del artista */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <Link href={`/${creator?.username || ''}`} className="flex items-center gap-3 group">
                        {creator?.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.display_name}
                            className="w-10 h-10 rounded-full object-cover border border-purple-500/30 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center font-bold text-xs text-purple-300">
                            {(creator?.display_name || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            {creator?.display_name || 'Artista'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">@{creator?.username}</p>
                        </div>
                      </Link>

                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(photo.created_at), 'd MMM', { locale: es })}
                      </span>
                    </div>

                    {/* Foto */}
                    <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-black/40 overflow-hidden">
                      <img
                        src={photo.image_url}
                        alt={photo.caption || 'Publicación'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Pie de foto y botón ver perfil */}
                    <div className="p-4 space-y-3">
                      {photo.caption && (
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {photo.caption}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs">
                        <Link
                          href={`/${creator?.username || ''}`}
                          className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          Ver perfil de {creator?.display_name}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => creator?.username && handleShare(creator.username)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          title="Compartir"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              }

              if (item.type === 'event') {
                const ev = item.data as EventItem & { creators?: { username: string; display_name: string; avatar_url: string | null } }
                const creator = ev.creators
                const eventDate = new Date(ev.event_date)

                return (
                  <article
                    key={`feed-event-${ev.id}-${idx}`}
                    className="glass-card rounded-3xl border border-white/10 p-5 shadow-xl shadow-black/20 space-y-4"
                  >
                    {/* Cabecera */}
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/${creator?.username || ''}`} className="flex items-center gap-3 group">
                        {creator?.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.display_name}
                            className="w-10 h-10 rounded-full object-cover border border-purple-500/30 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center font-bold text-xs text-purple-300">
                            {(creator?.display_name || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            {creator?.display_name || 'Artista'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">@{creator?.username}</p>
                        </div>
                      </Link>

                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Próximo Concierto
                      </span>
                    </div>

                    {/* Tarjeta de Concierto */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-purple-600/30 border border-purple-500/30 text-center shrink-0">
                          <span className="text-xs text-purple-300 font-semibold uppercase">
                            {format(eventDate, 'MMM', { locale: es })}
                          </span>
                          <span className="text-lg font-extrabold text-white leading-none">
                            {format(eventDate, 'dd')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-base text-white">{ev.title}</h4>
                          {ev.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              {ev.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ev.ticket_url ? (
                          <a
                            href={ev.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                          >
                            <span>Entradas</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Link
                            href={`/${creator?.username || ''}`}
                            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-xl transition-colors"
                          >
                            Ver perfil
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                )
              }

              return null
            })
          )}
        </div>
      </main>
    </div>
  )
}
