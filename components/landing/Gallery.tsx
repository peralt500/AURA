import { GalleryItem } from '@/types/database'
import Image from 'next/image'

interface GalleryProps {
  items: GalleryItem[]
}

export function Gallery({ items }: GalleryProps) {
  if (!items || items.length === 0) return null

  // Ordenar por sort_order
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h3 className="text-xl font-bold px-2">Galería</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedItems.map((item) => (
          <div 
            key={item.id} 
            className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-800 border border-white/5"
          >
            {/* Si es un enlace de unplash u otro remoto, usa img o next/image si el dominio está configurado */}
            <img
              src={item.image_url}
              alt={item.caption || 'Galería'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {item.caption && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white text-sm font-medium line-clamp-2">{item.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
