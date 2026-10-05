import { SocialLinks } from '@/types/database'
import { Instagram, Youtube, Facebook, ShoppingBag, Link as LinkIcon } from 'lucide-react'

interface SocialHubProps {
  socialLinks: SocialLinks
}

export function SocialHub({ socialLinks }: SocialHubProps) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) return null

  // Mapeo básico de íconos según clave
  const getIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'instagram': return <Instagram className="w-5 h-5" />
      case 'tiktok': 
        // Icono simple para TikTok usando SVG ya que Lucide no lo incluye por defecto a veces, 
        // pero podemos usar uno genérico si es necesario, o un SVG personalizado.
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        )
      case 'youtube': return <Youtube className="w-5 h-5" />
      case 'facebook': return <Facebook className="w-5 h-5" />
      case 'shop': return <ShoppingBag className="w-5 h-5" />
      default: return <LinkIcon className="w-5 h-5" />
    }
  }

  // Diccionario para nombres bonitos
  const getLabel = (key: string) => {
    switch(key.toLowerCase()) {
      case 'shop': return 'Tienda Oficial'
      default: return key.charAt(0).toUpperCase() + key.slice(1)
    }
  }

  const entries = Object.entries(socialLinks).filter(([_, url]) => !!url)

  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {entries.map(([key, url]) => (
        <a 
          key={key}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-sm font-medium"
        >
          {getIcon(key)}
          <span className="hidden sm:inline">{getLabel(key)}</span>
        </a>
      ))}
    </div>
  )
}
