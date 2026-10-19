'use client'

import { Creator } from '@/types/database'
import { Share2, Check, UserPlus, UserCheck, Users, Mail, Calendar, Sparkles } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { toggleFollowCreator } from '@/lib/actions/follows'

interface CreatorHeaderProps {
  creator: Creator
  fansCount: number
  followersCount: number
  eventsCount: number
  isOwner?: boolean
  initialFollowing?: boolean
}

export function CreatorHeader({
  creator,
  fansCount,
  followersCount: initialFollowersCount,
  eventsCount,
  isOwner = false,
  initialFollowing = false,
}: CreatorHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [followers, setFollowers] = useState(initialFollowersCount)
  const [isPending, startTransition] = useTransition()

  // Identificador de cliente para visitantes no registrados
  const [clientId, setClientId] = useState<string>('')

  useEffect(() => {
    let id = localStorage.getItem('aura_client_id')
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 12)
      localStorage.setItem('aura_client_id', id)
    }
    setClientId(id)

    // Check local follow state as fallback
    const localFollowing = localStorage.getItem(`aura_following_${creator.id}`)
    if (localFollowing === 'true') {
      setIsFollowing(true)
    }
  }, [creator.id])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: creator.display_name,
          text: `Visita el perfil oficial de ${creator.display_name} en AURA`,
          url: url,
        })
        return
      } catch (err) {
        // Fallback a copiar al portapapeles
      }
    }

    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFollowToggle = () => {
    if (isPending) return
    const nextFollowingState = !isFollowing
    const nextCount = nextFollowingState ? followers + 1 : Math.max(0, followers - 1)

    // Actualización optimista inmediata en UI
    setIsFollowing(nextFollowingState)
    setFollowers(nextCount)
    localStorage.setItem(`aura_following_${creator.id}`, nextFollowingState ? 'true' : 'false')

    startTransition(async () => {
      const res = await toggleFollowCreator(creator.id, clientId)
      if (res?.success) {
        setIsFollowing(res.isFollowing)
        setFollowers(res.followersCount)
        localStorage.setItem(`aura_following_${creator.id}`, res.isFollowing ? 'true' : 'false')
      }
    })
  }

  return (
    <div className="flex flex-col items-center text-center space-y-5">
      {/* Avatar con aura púrpura */}
      <div className="relative">
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl relative z-10 bg-neutral-800">
          {creator.avatar_url ? (
            <img 
              src={creator.avatar_url} 
              alt={creator.display_name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/50">
              {creator.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-25 -z-10 rounded-full scale-150" />
      </div>

      {/* Nombre y @usuario */}
      <div className="space-y-1.5 max-w-lg">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {creator.display_name}
          </h1>
          <button 
            onClick={handleShare}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
            title="Compartir enlace de perfil"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-purple-400 font-mono text-sm">@{creator.username}</p>
        
        {creator.bio && (
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            {creator.bio}
          </p>
        )}
      </div>

      {/* Botón Seguir o Editar mi perfil */}
      <div className="pt-1 flex items-center gap-3">
        {isOwner ? (
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Editar mi perfil</span>
          </Link>
        ) : (
          <button
            onClick={handleFollowToggle}
            disabled={isPending}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shadow-lg ${
              isFollowing
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15 shadow-none'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-4 h-4 text-green-400" />
                <span>Siguiendo</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Seguir</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Barra de 3 Contadores: Seguidores, Fans (correo), Próximos Eventos */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-md w-full pt-3">
        {/* 1. Contador de Seguidores */}
        <div className="glass-card p-3 rounded-2xl border border-white/5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-purple-400 mb-0.5">
            <Users className="w-3.5 h-3.5" />
            <span className="text-lg sm:text-xl font-bold text-white">{followers}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Seguidores</span>
        </div>

        {/* 2. Contador de Fans (que dieron su correo) */}
        <div className="glass-card p-3 rounded-2xl border border-white/5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-fuchsia-400 mb-0.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-lg sm:text-xl font-bold text-white">{fansCount}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Fans (Correo)</span>
        </div>

        {/* 3. Contador de Próximos Eventos */}
        <div className="glass-card p-3 rounded-2xl border border-white/5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-lg sm:text-xl font-bold text-white">{eventsCount}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Próximos Eventos</span>
        </div>
      </div>
    </div>
  )
}
