'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signInWithMagicLink, signInWithPassword } from '@/lib/actions/auth'
import { Mail, Lock, Loader2, CheckCircle2, AlertCircle, Sparkles, KeyRound } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setStatus('error')
      setMessage(errorParam)
    }
  }, [searchParams])

  async function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const result = await signInWithMagicLink(formData)

    if (result?.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      setStatus('success')
      setMessage('¡Revisa tu correo! Te hemos enviado un enlace de acceso mágico.')
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const result = await signInWithPassword(formData)

    if (result?.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="glass-card p-8 rounded-2xl border border-white/10">
      {/* Tabs para alternar método de login */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => { setMode('magic'); setStatus('idle'); setMessage('') }}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mode === 'magic'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Enlace Mágico
        </button>
        <button
          type="button"
          onClick={() => { setMode('password'); setStatus('idle'); setMessage('') }}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mode === 'password'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Contraseña
        </button>
      </div>

      {status === 'success' ? (
        <div className="text-center space-y-4 py-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">¡Correo enviado!</h2>
          <p className="text-muted-foreground text-sm">{message}</p>
          <button
            onClick={() => setStatus('idle')}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            Volver a intentar
          </button>
        </div>
      ) : mode === 'magic' ? (
        <form onSubmit={handleMagicSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email-magic" className="text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="login-email-magic"
                type="email"
                name="email"
                required
                defaultValue="bigthemo500@gmail.com"
                placeholder="artista@ejemplo.com"
                disabled={status === 'loading'}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 transition-all text-sm"
              />
            </div>
          </div>

          {status === 'error' && message && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 text-sm"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando enlace...</>
            ) : (
              <><Mail className="w-4 h-4" /> Enviar enlace mágico</>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center pt-2">
            ¿Alcanzaste el límite de correos de Supabase? Cambia a la pestaña <strong>Contraseña</strong>.
          </p>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email-pw" className="text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="login-email-pw"
                type="email"
                name="email"
                required
                defaultValue="bigthemo500@gmail.com"
                placeholder="artista@ejemplo.com"
                disabled={status === 'loading'}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="login-password"
                type="password"
                name="password"
                required
                placeholder="••••••••••••"
                disabled={status === 'loading'}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 transition-all text-sm"
              />
            </div>
          </div>

          {status === 'error' && message && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 text-sm"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
            ) : (
              <><KeyRound className="w-4 h-4" /> Iniciar sesión</>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold">Panel de Creadores</h1>
          <p className="text-muted-foreground text-sm mt-2">Accede con tu enlace mágico o tu contraseña</p>
        </div>

        <Suspense fallback={<div className="glass-card p-8 rounded-2xl border border-white/10 text-center text-muted-foreground">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
