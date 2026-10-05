'use client'

import { useState, useTransition } from 'react'
import { sendBroadcast } from '@/lib/actions/broadcast'
import { BroadcastLog } from '@/types/database'
import {
  Send, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Users, Mail, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BroadcastEmailFormProps {
  activeFansCount: number
  logs: BroadcastLog[]
}

export function BroadcastEmailForm({ activeFansCount, logs }: BroadcastEmailFormProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [resultMsg, setResultMsg] = useState('')
  const [sentCount, setSentCount] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const handleSubmit = () => {
    setShowConfirm(false)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('body', body)
      const result = await sendBroadcast(formData)
      if (result.success) {
        setStatus('success')
        setSentCount(result.sent ?? 0)
        setResultMsg(`¡Enviado exitosamente a ${result.sent} fan${result.sent !== 1 ? 's' : ''}!${result.error ? ` Nota: ${result.error}` : ''}`)
        setSubject(''); setBody('')
      } else {
        setStatus('error')
        setResultMsg(result.error || 'Error desconocido al enviar.')
      }
    })
  }

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && activeFansCount > 0 && !isPending

  // Preview HTML (simplificado para el cliente)
  const previewHtml = `<div style="font-family:sans-serif;max-width:560px;padding:24px;background:#171717;border-radius:12px;color:#f0f0f0;border:1px solid #262626">
    <h2 style="margin-top:0;font-size:20px">${subject || '(Asunto del correo)'}</h2>
    <p style="color:#a3a3a3;white-space:pre-wrap">${body || '(Cuerpo del correo)'}</p>
    <hr style="border-color:#262626;margin:20px 0"/>
    <p style="font-size:12px;color:#737373;margin:4px 0">Recibes esto porque te suscribiste a las novedades del artista.</p>
    <p style="font-size:12px;color:#737373;margin:4px 0">Remitente: <strong>Tu Nombre Artístico</strong> &lt;tu-email@tudominio.com&gt;</p>
    <p style="font-size:12px;color:#525252;margin:4px 0">¿No quieres recibir más correos? <span style="color:#7c3aed;text-decoration:underline">Darte de baja</span></p>
  </div>`

  return (
    <div className="space-y-6">
      {/* Estado de fans disponibles */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${activeFansCount > 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <div className={`p-2 rounded-lg ${activeFansCount > 0 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
          <Users className={`w-5 h-5 ${activeFansCount > 0 ? 'text-green-400' : 'text-amber-400'}`} />
        </div>
        <div>
          <p className="font-semibold text-sm">
            {activeFansCount > 0
              ? `${activeFansCount} fan${activeFansCount !== 1 ? 's' : ''} recibirán este correo`
              : 'Sin fans confirmados para enviar'
            }
          </p>
          <p className="text-xs text-muted-foreground">Solo fans confirmados y activos (no bajas)</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Asunto del correo</label>
          <input
            type="text"
            value={subject}
            onChange={e => { setSubject(e.target.value); setStatus('idle') }}
            maxLength={200}
            placeholder="¡Nueva fecha anunciada! 🎤"
            disabled={isPending}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30 disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground text-right">{subject.length}/200</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Mensaje</label>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setStatus('idle') }}
            maxLength={10000}
            placeholder="Escribe aquí las novedades para tus fans..."
            rows={8}
            disabled={isPending}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30 resize-y disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground text-right">{body.length}/10.000</p>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-3 items-center pt-1">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!canSend}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-600/20"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isPending ? 'Enviando...' : 'Enviar correo'}
          </button>
        </div>

        {/* Resultado */}
        {status !== 'idle' && (
          <div className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {status === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <p>{resultMsg}</p>
          </div>
        )}
      </div>

      {/* Vista previa */}
      {showPreview && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Vista previa del correo:</p>
          <div
            className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl w-full max-w-sm border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <Send className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg">Confirmar envío</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              ¿Enviar <strong className="text-white">"{subject}"</strong> a{' '}
              <strong className="text-purple-400">{activeFansCount} fan{activeFansCount !== 1 ? 's' : ''}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium text-white transition-all"
              >
                Sí, enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de envíos */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Historial de envíos</h3>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="glass-card rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                >
                  <div className="p-2 bg-white/5 rounded-lg shrink-0">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{log.subject}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {log.recipients_count} enviados
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.sent_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                    </div>
                  </div>
                  {expandedLog === log.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {expandedLog === log.id && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
