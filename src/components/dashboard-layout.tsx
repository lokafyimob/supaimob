'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from './sidebar'
import { SettingsDropdown } from './settings-dropdown'
import { useCompanyLogo } from '@/lib/company-logo-context'
import { Calendar } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const { companyLogo } = useCompanyLogo()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#ff4352'}}></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-16">
        {/* Top Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Welcome */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bem-vindo, {session?.user?.name}
                </h1>
              </div>
            </div>
            
            {/* Right - Date, Avatar and Logout */}
            <div className="flex items-center space-x-4">
              {/* Date */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white overflow-hidden" style={{background: companyLogo ? 'transparent' : 'linear-gradient(to bottom right, #ff4352, #e03e4d)'}}>
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt="Logo da Empresa" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
              </div>
              
              {/* Settings Dropdown */}
              <SettingsDropdown />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}