'use client'

import { Fan } from '@/types/database'
import { useState } from 'react'
import { Download, Search, Users, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface FansListTableProps {
  fans: Fan[]
}

export function FansListTable({ fans }: FansListTableProps) {
  const [search, setSearch] = useState('')

  const filtered = fans.filter(f =>
    f.email.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const active = fans.filter(f => f.confirmed_at && !f.unsubscribed_at)
    const rows = [
      ['Email', 'Fecha de suscripción'],
      ...active.map(f => [f.email, f.confirmed_at ? format(new Date(f.confirmed_at), 'yyyy-MM-dd') : ''])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'fans-confirmados.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const getStatus = (fan: Fan) => {
    if (fan.unsubscribed_at) return 'baja'
    if (fan.confirmed_at) return 'confirmado'
    return 'pendiente'
  }

  const statusConfig = {
    confirmado: { label: 'Confirmado', icon: CheckCircle, className: 'text-green-400 bg-green-400/10' },
    pendiente: { label: 'Pendiente', icon: Clock, className: 'text-amber-400 bg-amber-400/10' },
    baja: { label: 'Baja', icon: XCircle, className: 'text-red-400 bg-red-400/10' },
  }

  const confirmedCount = fans.filter(f => f.confirmed_at && !f.unsubscribed_at).length
  const pendingCount = fans.filter(f => !f.confirmed_at && !f.unsubscribed_at).length
  const unsubCount = fans.filter(f => f.unsubscribed_at).length

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Confirmados', value: confirmedCount, color: 'text-green-400' },
          { label: 'Pendientes', value: pendingCount, color: 'text-amber-400' },
          { label: 'Bajas', value: unsubCount, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-3 rounded-xl border border-white/5 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
          />
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    {search ? 'Sin resultados para esa búsqueda.' : 'Aún no tienes fans registrados.'}
                  </td>
                </tr>
              ) : (
                filtered.map(fan => {
                  const status = getStatus(fan)
                  const cfg = statusConfig[status]
                  const Icon = cfg.icon
                  return (
                    <tr key={fan.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 font-medium truncate max-w-[180px]">{fan.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {format(new Date(fan.created_at), 'd MMM yyyy', { locale: es })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
