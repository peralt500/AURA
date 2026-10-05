'use client'

import { useState } from 'react'
import { Users, Calendar, Image, User, Mail, ChevronRight } from 'lucide-react'
import { Creator, Fan, EventItem, GalleryItem, BroadcastLog } from '@/types/database'
import { FansListTable } from './FansListTable'
import { EventsManager } from './EventsManager'
import { ProfileEditor } from './ProfileEditor'
import { GalleryManager } from './GalleryManager'
import { BroadcastEmailForm } from './BroadcastEmailForm'

interface DashboardTabsProps {
  creator: Creator
  fans: Fan[]
  events: EventItem[]
  galleryItems: GalleryItem[]
  broadcastLogs: BroadcastLog[]
  confirmedFansCount: number
  upcomingEventsCount: number
}

const tabs = [
  { id: 'fans', label: 'Fans', icon: Users },
  { id: 'events', label: 'Eventos', icon: Calendar },
  { id: 'broadcast', label: 'Correos', icon: Mail },
  { id: 'gallery', label: 'Galería', icon: Image },
  { id: 'profile', label: 'Perfil', icon: User },
]

export function DashboardTabs({
  creator, fans, events, galleryItems, broadcastLogs, confirmedFansCount, upcomingEventsCount
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('fans')

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Fans confirmados', value: confirmedFansCount, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Próximos eventos', value: upcomingEventsCount, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Envíos realizados', value: broadcastLogs.length, icon: Mail, color: 'text-green-400', bg: 'bg-green-400/10' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'fans' && <FansListTable fans={fans} />}
        {activeTab === 'events' && <EventsManager events={events} />}
        {activeTab === 'broadcast' && (
          <BroadcastEmailForm
            activeFansCount={confirmedFansCount}
            logs={broadcastLogs}
          />
        )}
        {activeTab === 'gallery' && <GalleryManager items={galleryItems} />}
        {activeTab === 'profile' && <ProfileEditor creator={creator} />}
      </div>
    </div>
  )
}
