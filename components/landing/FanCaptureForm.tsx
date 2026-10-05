'use client'

import { useState, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { captureFan } from '@/lib/actions/fans'

interface FanCaptureFormProps {
  creatorId: string
}

export function FanCaptureForm({ creatorId }: FanCaptureFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    formData.append('creatorId', creatorId)
    
    // Turnstile inyecta el token automáticamente en cf-turnstile-response

    const result = await captureFan(formData)
    
    if (result.success) {
      setStatus('success')
      setMessage(result.message)
      formRef.current?.reset()
    } else {
      setStatus('error')
      setMessage(result.message)
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">¡Únete a la comunidad!</h3>
        <p className="text-sm text-muted-foreground">Sé el primero en enterarte de nuevas fechas y lanzamientos especiales.</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
        <div className="relative w-full">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="email"
            name="email"
            required
            placeholder="tu@correo.com"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/40 transition-all"
            disabled={status === 'loading' || status === 'success'}
          />
        </div>

        <div className="w-full flex justify-center py-2">
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} 
            options={{ theme: 'dark' }}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status === 'idle' && 'Suscribirme'}
          {status === 'error' && 'Intentar de nuevo'}
          {status === 'success' && '¡Hecho!'}
        </button>

        {message && (
          <div className={`flex items-center gap-2 text-sm mt-4 p-3 rounded-xl w-full ${
            status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
            status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''
          }`}>
            {status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p>{message}</p>
          </div>
        )}
      </form>
    </div>
  )
}
