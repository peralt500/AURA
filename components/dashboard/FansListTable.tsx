'use client'

import { Fan } from '@/types/database'
import { useState, useTransition } from 'react'
import { Download, Search, Users, CheckCircle, Clock, XCircle, UserCheck, Loader2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { confirmFanManually, confirmAllPendingFans } from '@/lib/actions/fans'
import { useRouter } from 'next/navigation'

interface FansListTableProps {
  fans: Fan[]
}

export function FansListTable({ fans }: FansListTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionMessage, setActionMessage] = useState<string | null>(null)

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

  const handleConfirmSingle = async (fanId: string) => {
    startTransition(async () => {
      const res = await confirmFanManually(fanId)
      if (res?.success) {
        setActionMessage('Fan confirmado exitosamente.')
        router.refresh()
      } else {
        setActionMessage(res?.error || 'Error al confirmar fan.')
      }
      setTimeout(() => setActionMessage(null), 3500)
    })
  }

  const handleConfirmAll = async () => {
    if (!confirm('¿Deseas confirmar a todos los fans pendientes ahora mismo?')) return
    startTransition(async () => {
      const res = await confirmAllPendingFans()
      if (res?.success) {
        setActionMessage(`¡Se han confirmado ${res.count} fans con éxito!`)
        router.refresh()
      } else {
        setActionMessage(res?.error || 'Error al confirmar fans.')
      }
      setTimeout(() => setActionMessage(null), 4000)
    })
  }

  return (
    <div className="space-y-4">
      {/* Banner informativo de modelo unificado y sin esperas */}
      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Registro inmediato activado:</strong> Los nuevos fans quedan confirmados al instante sin esperas de correo.
          </span>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleConfirmAll}
            disabled={isPending}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            Confirmar pendientes ({pendingCount})
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

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
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
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
                      <td className="px-4 py-3 text-right">
                        {status === 'pendiente' ? (
                          <button
                            onClick={() => handleConfirmSingle(fan.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg text-xs font-medium transition-colors"
                            title="Confirmar y activar fan manualmente"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Confirmar
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
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
