'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Receipt,
  Calculator,
  RefreshCw
} from 'lucide-react'

interface FinancialSummary {
  currentMonth: {
    year: number
    month: number
    revenue: number
    expenses: number
    netProfit: number
    paymentsCount: number
    expensesCount: number
  }
  previousMonth: {
    year: number
    month: number
    revenue: number
    expenses: number
    netProfit: number
  }
  changes: {
    revenue: number
    expenses: number
    profit: number
  }
  breakdown: {
    revenue: Array<{
      paymentId: string
      property: string
      tenant: string
      rentAmount: number
      adminFeePercentage: number
      managementFeePercentage: number
      adminFee: number
      managementFee: number
      totalFee: number
      paidDate: string
    }>
    expenses: Array<{
      id: string
      description: string
      amount: number
      category: string
      date: string
    }>
  }
}

export default function Financial() {
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financial/summary')
      if (response.ok) {
        const data = await response.json()
        setFinancialData(data)
      } else {
        console.error('Failed to fetch financial summary')
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialSummary()
  }, [])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  const formatPercentage = (value: number) => {
    const icon = value >= 0 ? '↗' : '↘'
    const color = value >= 0 ? 'text-green-600' : 'text-red-600'
    return (
      <span className={`text-sm ${color} mt-2`}>
        {icon} {Math.abs(value).toFixed(1)}% vs mês anterior
      </span>
    )
  }

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1]
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Resumo financeiro de {getMonthName(financialData?.currentMonth.month || new Date().getMonth() + 1)} {financialData?.currentMonth.year || new Date().getFullYear()}
            </p>
          </div>
          <button
            onClick={fetchFinancialSummary}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receitas do Mês</h3>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(financialData?.currentMonth.revenue || 0)}
            </p>
            {formatPercentage(financialData?.changes.revenue || 0)}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Taxas de administração de {financialData?.currentMonth.paymentsCount || 0} pagamentos
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              Apenas as taxas, não o valor total dos aluguéis
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Despesas do Mês</h3>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(financialData?.currentMonth.expenses || 0)}
            </p>
            {formatPercentage(financialData?.changes.expenses || 0)}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {financialData?.currentMonth.expensesCount || 0} despesas registradas
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lucro Líquido</h3>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(financialData?.currentMonth.netProfit || 0)}
            </p>
            {formatPercentage(financialData?.changes.profit || 0)}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Receitas - Despesas
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a 
              href="/payments"
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Receipt className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Pagamentos</span>
            </a>
            <a 
              href="/expenses"
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Nova Despesa</span>
            </a>
            <a 
              href="/contracts"
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Contratos</span>
            </a>
            <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Relatórios</span>
            </button>
          </div>
        </div>

        {/* Breakdown Section */}
        {financialData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Taxas de Administração ({financialData.breakdown.revenue.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Apenas as taxas cobradas sobre os aluguéis pagos
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {financialData.breakdown.revenue.length > 0 ? (
                  financialData.breakdown.revenue.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{item.property}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.tenant} • Taxa: {item.adminFeePercentage}% + {item.managementFeePercentage}%
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Aluguel: {formatCurrency(item.rentAmount)} → Taxa: {formatCurrency(item.totalFee)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600 dark:text-green-400 text-sm">
                          {formatCurrency(item.totalFee)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.paidDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma receita registrada neste mês
                  </p>
                )}
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Despesas do Mês ({financialData.breakdown.expenses.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {financialData.breakdown.expenses.length > 0 ? (
                  financialData.breakdown.expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{expense.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600 dark:text-red-400 text-sm">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma despesa registrada neste mês
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}