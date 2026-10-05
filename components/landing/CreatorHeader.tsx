'use client'

import { Creator } from '@/types/database'
import { Share2, Check } from 'lucide-react'
import { useState } from 'react'

interface CreatorHeaderProps {
  creator: Creator
}

export function CreatorHeader({ creator }: CreatorHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: creator.display_name,
          text: `Visita el perfil de ${creator.display_name}`,
          url: url,
        })
        return
      } catch (err) {
        // Fallback a copiar si el usuario cancela o falla
      }
    }

    // Fallback: Copiar al portapapeles
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center text-center space-y-4">
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
        <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 -z-10 rounded-full scale-150"></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{creator.display_name}</h1>
          <button 
            onClick={handleShare}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
            title="Compartir perfil"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Share2 className="w-4 h-4 text-white/60 group-hover:text-white" />
            )}
          </button>
        </div>
        <p className="text-purple-400 font-medium">@{creator.username}</p>
        
        {creator.bio && (
          <p className="max-w-lg mx-auto text-muted-foreground mt-4 leading-relaxed">
            {creator.bio}
          </p>
        )}
      </div>
    </div>
  )
}
