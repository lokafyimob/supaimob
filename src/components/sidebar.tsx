'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Building2,
  Home,
  Users,
  UserCheck,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Brain,
  User,
  DollarSign,
  Target,
  MessageCircle
} from 'lucide-react'

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
  { icon: Home, label: 'Imóveis', href: '/properties' },
  { icon: Users, label: 'Proprietários', href: '/owners' },
  { icon: UserCheck, label: 'Inquilinos', href: '/tenants' },
  { icon: FileText, label: 'Contratos', href: '/contracts' },
  { icon: CreditCard, label: 'Pagamentos', href: '/payments' },
  { icon: DollarSign, label: 'Financeiro', href: '/financial' },
  { icon: Target, label: 'Leads', href: '/leads' },
  { icon: MessageCircle, label: 'Chat OLX', href: '/olx-chat' },
  { icon: Brain, label: 'Analytics & IA', href: '/analytics' },
  { icon: User, label: 'Usuários', href: '/users' },
  { icon: Settings, label: 'Configurações', href: '/settings' }
]

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      try {
        // Clear any local storage or session storage if needed
        localStorage.clear()
        sessionStorage.clear()
        
        await signOut({ 
          callbackUrl: '/login',
          redirect: false
        })
        
        // Force redirect to login
        window.location.href = '/login'
      } catch (error) {
        console.error('Error signing out:', error)
        // Fallback: force redirect to login
        window.location.href = '/login'
      }
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-40 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="logo-font text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                CRM Imobiliário
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sistema Inteligente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Ocultar link 'Usuários' para usuários com role 'USER'
              if (item.href === '/users' && session?.user?.role === 'USER') {
                return null
              }
              
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}