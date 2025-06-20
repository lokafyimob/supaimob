'use client'

import { DashboardLayout } from '@/components/dashboard-layout'

export default function Financial() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Gerencie receitas, despesas e relatórios financeiros</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Receitas do Mês</h3>
            <p className="text-3xl font-bold text-green-600">R$ 45.250,00</p>
            <p className="text-sm text-gray-500 mt-2">↗ +12% vs mês anterior</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Despesas do Mês</h3>
            <p className="text-3xl font-bold text-red-600">R$ 8.750,00</p>
            <p className="text-sm text-gray-500 mt-2">↘ -3% vs mês anterior</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lucro Líquido</h3>
            <p className="text-3xl font-bold text-blue-600">R$ 36.500,00</p>
            <p className="text-sm text-gray-500 mt-2">↗ +18% vs mês anterior</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2">💰</span>
              <span className="text-sm font-medium">Nova Receita</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2">💸</span>
              <span className="text-sm font-medium">Nova Despesa</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm font-medium">Relatórios</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2">📈</span>
              <span className="text-sm font-medium">Análises</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Transações Recentes</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">↗</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Aluguel - Apt 101</p>
                  <p className="text-sm text-gray-500">João Silva</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">+R$ 2.500,00</p>
                <p className="text-sm text-gray-500">Hoje</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600">↘</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manutenção Hidráulica</p>
                  <p className="text-sm text-gray-500">Casa Jardim América</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-600">-R$ 450,00</p>
                <p className="text-sm text-gray-500">Ontem</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">↗</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Aluguel - Sala 205</p>
                  <p className="text-sm text-gray-500">Empresa ABC Ltda</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">+R$ 3.200,00</p>
                <p className="text-sm text-gray-500">2 dias atrás</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}