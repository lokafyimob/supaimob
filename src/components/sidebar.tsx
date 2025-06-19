'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Building2,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Building,
  User,
  Receipt,
  Calculator,
  Zap,
  MessageSquare,
  Sparkles,
  UserPlus,
  LogOut,
  DoorOpen,
  Power,
  UserMinus
} from 'lucide-react'

// OPÇÃO 1: Ícones mais modernos
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Building, label: 'Imóveis', href: '/properties' },
  { icon: Users, label: 'Proprietários', href: '/owners' },
  { icon: User, label: 'Inquilinos', href: '/tenants' },
  { icon: FileText, label: 'Contratos', href: '/contracts' },
  { icon: Receipt, label: 'Pagamentos', href: '/payments' },
  { icon: Calculator, label: 'Financeiro', href: '/financial' },
  { icon: Zap, label: 'Leads', href: '/leads' },
  { icon: MessageSquare, label: 'Chat OLX', href: '/olx-chat' },
  { icon: Sparkles, label: 'Analytics & IA', href: '/analytics' },
  { icon: UserPlus, label: 'Usuários', href: '/users' },
  { icon: Settings, label: 'Configurações', href: '/settings' }
]

// OPÇÃO 2: Ícones mais visuais (descomente para usar)
// const menuItems = [
//   { icon: PieChart, label: 'Dashboard', href: '/dashboard' },
//   { icon: HousePlus, label: 'Imóveis', href: '/properties' },
//   { icon: Contact, label: 'Proprietários', href: '/owners' },
//   { icon: UserCheck, label: 'Inquilinos', href: '/tenants' },
//   { icon: ScrollText, label: 'Contratos', href: '/contracts' },
//   { icon: Banknote, label: 'Pagamentos', href: '/payments' },
//   { icon: TrendingUp, label: 'Financeiro', href: '/financial' },
//   { icon: Target, label: 'Leads', href: '/leads' },
//   { icon: Mail, label: 'Chat OLX', href: '/olx-chat' },
//   { icon: Activity, label: 'Analytics & IA', href: '/analytics' },
//   { icon: Users, label: 'Usuários', href: '/users' },
//   { icon: Wrench, label: 'Configurações', href: '/settings' }
// ]

// OPÇÃO 3: Mix balanceado (descomente para usar)
// const menuItems = [
//   { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
//   { icon: Building, label: 'Imóveis', href: '/properties' },
//   { icon: Users, label: 'Proprietários', href: '/owners' },
//   { icon: UserCog, label: 'Inquilinos', href: '/tenants' },
//   { icon: FileContract, label: 'Contratos', href: '/contracts' },
//   { icon: CreditCard, label: 'Pagamentos', href: '/payments' },
//   { icon: Coins, label: 'Financeiro', href: '/financial' },
//   { icon: Zap, label: 'Leads', href: '/leads' },
//   { icon: MessageSquare, label: 'Chat OLX', href: '/olx-chat' },
//   { icon: Brain, label: 'Analytics & IA', href: '/analytics' },
//   { icon: UserPlus, label: 'Usuários', href: '/users' },
//   { icon: Settings, label: 'Configurações', href: '/settings' }
// ]

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()


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

      {/* Sidebar - Mobile (full width) */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{backgroundColor: '#ff4352'}}>
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
              if (item.href === '/users' && session?.user?.role === 'USER') {
                return null
              }
              
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors border-r-2 ${
                      isActive
                        ? ''
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                    }`}
                    style={isActive ? {backgroundColor: '#fef2f2', color: '#ff4352', borderColor: '#ff4352'} : {}}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          
          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full"
            >
              <Power className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </nav>

      </div>

      {/* Sidebar - Desktop (icon only with tooltips) */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 rounded-lg" style={{backgroundColor: '#ff4352'}}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col">
          <ul className="space-y-1 flex-1">
            {menuItems.map((item) => {
              if (item.href === '/users' && session?.user?.role === 'USER') {
                return null
              }
              
              const isActive = pathname === item.href
              return (
                <li key={item.href} className="px-2">
                  <Link
                    href={item.href}
                    className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                      isActive
                        ? ''
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={isActive ? {backgroundColor: '#fef2f2', color: '#ff4352'} : {}}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5" />
                    
                  </Link>
                </li>
              )
            })}
          </ul>
          
          {/* Logout Button */}
          <div className="px-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              title="Sair"
            >
              <Power className="w-5 h-5" />
            </button>
          </div>
        </nav>

      </div>
    </>
  )
}