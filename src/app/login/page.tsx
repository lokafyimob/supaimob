'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'credentials' | 'blocked' | 'inactive' | 'general'>('general')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorType('general')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        console.log('Login error details:', result.error)
        // Tratar diferentes tipos de erro baseado na mensagem retornada
        if (result.error.includes('BLOCKED_USER')) {
          setError('Usuário bloqueado. Entre em contato com o administrador.')
          setErrorType('blocked')
        } else if (result.error.includes('INACTIVE_USER')) {
          setError('Usuário inativo. Entre em contato com o administrador.')
          setErrorType('inactive')
        } else {
          setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.')
          setErrorType('credentials')
        }
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-6" style={{backgroundColor: '#ff4352'}}>
              <Building className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2" style={{fontFamily: 'atyp-font-family, sans-serif'}}>G-PROP</h1>
            <p className="text-sm text-gray-600">Entre com suas credenciais para acessar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-1 transition-colors"
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement
                  target.style.borderColor = '#ff4352'
                  target.style.boxShadow = '0 0 0 1px #ff4352'
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement
                  target.style.borderColor = '#d1d5db'
                  target.style.boxShadow = 'none'
                }}
                placeholder="E-mail"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-1 transition-colors pr-10"
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement
                  target.style.borderColor = '#ff4352'
                  target.style.boxShadow = '0 0 0 1px #ff4352'
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement
                  target.style.borderColor = '#d1d5db'
                  target.style.boxShadow = 'none'
                }}
                placeholder="Senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`text-sm text-center py-2 px-3 rounded-md border ${
                errorType === 'blocked' || errorType === 'inactive' 
                  ? 'text-orange-700 bg-orange-50 border-orange-200' 
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {errorType === 'blocked' && (
                  <div className="flex items-center justify-center mb-1">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {errorType === 'inactive' && (
                  <div className="flex items-center justify-center mb-1">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {errorType === 'credentials' && (
                  <div className="flex items-center justify-center mb-1">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: loading || !email || !password ? '#d1d5db' : '#ff4352'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                if (!loading && email && password) {
                  target.style.backgroundColor = '#e03e4d'
                }
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                if (!loading && email && password) {
                  target.style.backgroundColor = '#ff4352'
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>


          {/* Footer */}
          <div className="text-center text-xs text-gray-400">
            <p>&copy; 2025 CRM Imobiliário. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      {/* Right side - Background Image/Pattern */}
      <div className="hidden lg:block flex-1 relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, #ff6b7a, #ff4352, #e03e4d)'}}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-md">
            <Building className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-5xl font-extrabold mb-2 tracking-wide" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)', letterSpacing: '1px'}}>
              <span style={{fontFamily: '"Gia Variable", sans-serif'}}>AV</span>
              <span style={{fontFamily: '"Gia Variable", sans-serif'}}>SISTEM</span>
            </h1>
            <h2 className="text-2xl font-bold mb-4">Sua Imobiliária agora fala com seus Leads!</h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Sistema completo para gestão de imóveis, contratos, pagamentos e muito mais!
            </p>
            <div className="mt-8 space-y-4 text-base opacity-90">
              <div className="flex items-center justify-start space-x-3 animate-pulse-slow">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce-delayed flex-shrink-0"></div>
                <span className="animate-slide-in-right text-left">Leads certos, na hora certa: oportunidades reais!</span>
              </div>
              <div className="flex items-center justify-start space-x-3 animate-pulse-slow-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce-delayed-2 flex-shrink-0"></div>
                <span className="animate-slide-in-right-2 text-left">Seu Lead levado a Sério!</span>
              </div>
              <div className="flex items-center justify-start space-x-3 animate-pulse-slow-3">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce-delayed-3 flex-shrink-0"></div>
                <span className="animate-slide-in-right-3 text-left">Mais Lead, mais crescimento!</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
      </div>

    </div>
  )
}