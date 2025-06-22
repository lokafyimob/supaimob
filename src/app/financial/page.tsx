'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Receipt,
  Calculator,
  RefreshCw,
  X,
  Download,
  FileText
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
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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

  const generateMonthlyReport = async () => {
    try {
      setGeneratingReport(true)
      const response = await fetch(`/api/financial/monthly-report?year=${selectedYear}&month=${selectedMonth}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar relatório')
      }
      
      const reportData = await response.json()
      
      // Check if there's any data for the selected period
      if (reportData.revenue.paymentCount === 0 && reportData.expenses.count === 0) {
        alert(`ℹ️ Nenhum dado encontrado para ${getMonthName(selectedMonth)} ${selectedYear}.\n\nO relatório será gerado mesmo assim, mas estará vazio. Você pode gerar relatórios para qualquer período, mesmo antes do mês estar concluído.`)
      }
      
      // Create report content
      const reportContent = `
RELATÓRIO FINANCEIRO MENSAL
${getMonthName(selectedMonth)} ${selectedYear}

=====================================
RESUMO EXECUTIVO
=====================================

• Total de Receitas: ${formatCurrency(reportData.revenue.netRevenue)}
• Total de Despesas: ${formatCurrency(reportData.expenses.total)}
• Lucro Líquido: ${formatCurrency(reportData.profit)}
• Margem de Lucro: ${reportData.summary.profitMargin.toFixed(1)}%

=====================================
DETALHAMENTO DAS RECEITAS
=====================================

Valor Total dos Aluguéis: ${formatCurrency(reportData.revenue.totalRent)}
Taxa de Administração (10%): ${formatCurrency(reportData.revenue.adminFee)}
Receita Líquida: ${formatCurrency(reportData.revenue.netRevenue)}
Número de Pagamentos: ${reportData.revenue.paymentCount}
${reportData.revenue.paymentCount === 0 ? '\n⚠️  Nenhum pagamento foi registrado como pago neste período.' : ''}

=====================================
DETALHAMENTO DAS DESPESAS
=====================================

Total de Despesas: ${formatCurrency(reportData.expenses.total)}
Número de Despesas: ${reportData.expenses.count}

Despesas por Categoria:
${reportData.expenses.byCategory.length > 0 
  ? reportData.expenses.byCategory.map((cat: any) => 
      `• ${cat.category}: ${formatCurrency(parseFloat(cat.category_total))}`
    ).join('\n')
  : '• Nenhuma despesa registrada neste período'
}

=====================================
ANÁLISE
=====================================

${reportData.profit > 0 
  ? `✅ Mês POSITIVO com lucro de ${formatCurrency(reportData.profit)}`
  : `❌ Mês NEGATIVO com prejuízo de ${formatCurrency(Math.abs(reportData.profit))}`
}

Margem de lucro: ${reportData.summary.profitMargin.toFixed(1)}%

=====================================

Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Sistema: CRM Imobiliário - SupaiMob
      `.trim()

      // Download report
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-financeiro-${getMonthName(selectedMonth).toLowerCase()}-${selectedYear}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setShowReportsModal(false)
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setGeneratingReport(false)
    }
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
            <button 
              onClick={() => setShowReportsModal(true)}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
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
                            {item.tenant} • Taxa: {item.adminFeePercentage}%
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

        {/* Reports Modal */}
        {showReportsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gerar Relatório Financeiro
                </h2>
                <button
                  onClick={() => setShowReportsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mês do Relatório
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ano do Relatório
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Sobre o Relatório
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        O relatório incluirá receitas, despesas, lucro líquido e análise detalhada do período selecionado.
                        Funciona para qualquer mês/ano, mesmo se o período ainda não estiver concluído.
                        O arquivo será baixado automaticamente em formato de texto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowReportsModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={generateMonthlyReport}
                  disabled={generatingReport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Gerar e Baixar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}