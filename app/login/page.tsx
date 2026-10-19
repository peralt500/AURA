'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithMagicLink, signInWithPassword, signUpUser } from '@/lib/actions/auth'
import { Mail, Lock, Loader2, CheckCircle2, AlertCircle, Sparkles, KeyRound, User, AtSign, ArrowLeft, ArrowRight, UserPlus, LogIn } from 'lucide-react'

function AuthContainer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Tab principal: login vs register
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  
  // Sub-modo para login: contraseña vs enlace mágico
  const [loginMode, setLoginMode] = useState<'password' | 'magic'>('password')
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setStatus('error')
      setMessage(errorParam)
    }
  }, [searchParams])

  // Registro inmediato: sin esperas de correo ni captchas -> va directo a /explore
  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const result = await signUpUser(formData)

    if (result?.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      setStatus('success')
      setMessage('¡Perfil creado con éxito! Entrando al Inicio...')
      setTimeout(() => {
        router.push('/explore')
        router.refresh()
      }, 600)
    }
  }

  // Login inmediato con contraseña -> va directo a /explore
  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const result = await signInWithPassword(formData)

    if (result?.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      router.push('/explore')
      router.refresh()
    }
  }

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

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Selector principal: Ingresar vs Crear Perfil */}
      <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => { setTab('login'); setStatus('idle'); setMessage('') }}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            tab === 'login'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => { setTab('register'); setStatus('idle'); setMessage('') }}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            tab === 'register'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Crear Perfil
        </button>
      </div>

      {status === 'success' ? (
        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 animate-in zoom-in-75 duration-300" />
          </div>
          <h2 className="text-xl font-bold">¡Bienvenido a AURA!</h2>
          <p className="text-muted-foreground text-sm">{message}</p>
          {tab === 'login' && loginMode === 'magic' && (
            <button
              onClick={() => setStatus('idle')}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors pt-2 block mx-auto"
            >
              Volver a intentar
            </button>
          )}
        </div>
      ) : tab === 'register' ? (
        /* Formulario de Crear Perfil (Instantáneo, sin esperas de correo ni captchas) */
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-base font-semibold text-white">Crea tu perfil en AURA</h3>
            <p className="text-xs text-muted-foreground">
              Acceso instantáneo. Podrás cambiar tus datos en cualquier momento.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              Nombre Artístico
            </label>
            <input
              type="text"
              name="display_name"
              required
              placeholder="Ej: Big The Mo"
              disabled={status === 'loading'}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-purple-400" />
              Nombre de usuario (@slug para tu enlace público)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                @
              </span>
              <input
                type="text"
                name="username"
                required
                placeholder="bigthemo"
                disabled={status === 'loading'}
                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm lowercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="tu@correo.com"
              disabled={status === 'loading'}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              disabled={status === 'loading'}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm"
            />
          </div>

          {status === 'error' && message && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 text-sm mt-2"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creando perfil y entrando...</>
            ) : (
              <>Crear Perfil e Ingresar <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground text-center pt-1">
            ⚡ Entrada inmediata al Inicio. Sin esperas ni verificaciones por correo.
          </p>
        </form>
      ) : (
        /* Formulario de Ingresar (Login directo con contraseña o enlace mágico) */
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setStatus('idle'); setMessage('') }}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                loginMode === 'password' ? 'bg-white/10 text-white font-medium' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('magic'); setStatus('idle'); setMessage('') }}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                loginMode === 'magic' ? 'bg-white/10 text-white font-medium' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Enlace Mágico
            </button>
          </div>

          {loginMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="artista@ejemplo.com"
                    disabled={status === 'loading'}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••••••"
                    disabled={status === 'loading'}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm"
                  />
                </div>
              </div>

              {status === 'error' && message && (
                <div className="flex items-start gap-2 text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando al inicio...</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Ingresar</>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="artista@ejemplo.com"
                    disabled={status === 'loading'}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-white/30 text-sm"
                  />
                </div>
              </div>

              {status === 'error' && message && (
                <div className="flex items-start gap-2 text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
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
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Top Back navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Portada
          </Link>
        </div>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-3 shadow-lg shadow-purple-600/20">
            <Sparkles className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">AURA</h1>
          <p className="text-muted-foreground text-xs mt-1">El hub centralizado y abierto para creadores y su comunidad</p>
        </div>

        <Suspense fallback={<div className="glass-card p-8 rounded-2xl border border-white/10 text-center text-muted-foreground text-sm">Cargando...</div>}>
          <AuthContainer />
        </Suspense>
      </div>
    </main>
  )
}
