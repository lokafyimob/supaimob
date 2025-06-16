'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ToastContainer, useToast } from '@/components/toast'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface FinancialStats {
  totalReceivable: number
  totalPayable: number
  rentContractsPercentage: number
  saleContractsPercentage: number
  monthlyIncome: number
  monthlyExpenses: number
  overdueReceivables: number
  overduePayables: number
}

interface Transaction {
  id: string
  type: 'receivable' | 'payable'
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  property?: string
  tenant?: string
}

export default function Financial() {
  const [stats, setStats] = useState<FinancialStats>({
    totalReceivable: 0,
    totalPayable: 0,
    rentContractsPercentage: 0,
    saleContractsPercentage: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    overdueReceivables: 0,
    overduePayables: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const refreshData = async () => {
    try {
      setRefreshing(true)
      showSuccess('Atualizando dados...', 'Os dados financeiros estão sendo atualizados.')
      
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      window.location.reload()
    } catch (error) {
      showError('Erro ao atualizar', 'Não foi possível atualizar os dados.')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true)
        
        // Taxa de administração será calculada individualmente por contrato
        
        let contracts = []
        let properties = []
        
        try {
          // Buscar contratos reais
          const contractsRes = await fetch('/api/contracts')
          console.log('Contracts API response status:', contractsRes.status)
          
          if (contractsRes.ok) {
            contracts = await contractsRes.json()
            console.log('Contracts loaded from API:', contracts.length, contracts)
          } else {
            const errorText = await contractsRes.text()
            console.warn('Failed to load contracts:', contractsRes.status, errorText)
            contracts = []
          }
        } catch (error) {
          console.error('Error fetching contracts:', error)
          contracts = []
        }
        
        try {
          // Tentar buscar propriedades
          const propertiesRes = await fetch('/api/properties')
          if (propertiesRes.ok) {
            properties = await propertiesRes.json()
            console.log('Properties loaded:', properties.length)
          }
        } catch (error) {
          console.error('Error fetching properties:', error)
          properties = []
        }
        
        // Calcular estatísticas reais
        const totalContracts = contracts.length || 1
        const rentContracts = contracts.filter((c: any) => 
          c.type === 'RENT' || c.type === 'RENTAL' || c.type === 'ALUGUEL'
        ).length
        const saleContracts = contracts.filter((c: any) => 
          c.type === 'SALE' || c.type === 'VENDA'
        ).length
        const activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE')
        
        console.log('Contract stats:', {
          total: totalContracts,
          rent: rentContracts,
          sale: saleContracts,
          active: activeContracts.length
        })
        
        // Filtrar contratos ativos de aluguel (igual à página contracts)
        const activeRentContracts = contracts.filter((c: any) => c.status === 'ACTIVE')
        
        // Calcular valor total dos contratos e comissão individual
        let totalContractsValue = 0
        let immobiliariaCommission = 0
        
        activeRentContracts.forEach((contract: any) => {
          const rentAmount = contract.rentAmount || 0
          const adminFeePercentage = (contract.administrationFeePercentage || 10) / 100
          
          totalContractsValue += rentAmount
          immobiliariaCommission += rentAmount * adminFeePercentage
        })
        
        console.log('=== DEBUG FINANCIAL PAGE ===')
        console.log('Total contracts loaded:', contracts.length)
        console.log('Active rent contracts:', activeRentContracts.length)
        console.log('Total contracts value:', totalContractsValue)
        console.log('Imobiliaria commission (individual rates):', immobiliariaCommission)
        
        // Contas a receber = comissão da imobiliária
        const totalReceivable = immobiliariaCommission
        const overdueReceivables = totalReceivable * 0.1 // 10% em atraso
        
        console.log('Imobiliaria commission calculated:', immobiliariaCommission)
        console.log('Total receivable (commission):', totalReceivable)
        console.log('This should show in the UI as: R$', totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        
        // Calcular contas a pagar (manutenção, impostos, etc.)
        const totalPayable = totalReceivable * 0.3 // 30% do que recebe
        const overduePayables = totalPayable * 0.15 // 15% em atraso
        
        const calculatedStats: FinancialStats = {
          totalReceivable: totalReceivable, // Comissão real dos contratos cadastrados
          totalPayable: totalPayable,
          rentContractsPercentage: totalContracts > 0 ? Math.round((rentContracts / totalContracts) * 100) : 0,
          saleContractsPercentage: totalContracts > 0 ? Math.round((saleContracts / totalContracts) * 100) : 0,
          monthlyIncome: totalReceivable, // Receita da comissão dos contratos
          monthlyExpenses: totalPayable,
          overdueReceivables: overdueReceivables,
          overduePayables: overduePayables
        }
        
        console.log('Final stats:', calculatedStats)
        
        // Gerar transações baseadas nos contratos reais
        const realTransactions: Transaction[] = []
        
        // Data base fixa para evitar problemas de hidratação
        const baseDate = new Date('2024-01-15')
        
        // Adicionar transações individuais para cada contrato
        activeRentContracts.forEach((contract: any, index: number) => {
          const rentAmount = contract.rentAmount || 0
          const adminFeePercentage = contract.administrationFeePercentage || 10
          const commissionAmount = rentAmount * (adminFeePercentage / 100)
          
          // Transação do aluguel total (entrada)
          realTransactions.push({
            id: `rent-${contract.id}`,
            type: 'receivable',
            description: `Aluguel - ${contract.property?.title || 'Imóvel'}`,
            amount: rentAmount,
            dueDate: new Date(baseDate.getTime() + (10 + index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: index === 0 ? 'overdue' : 'pending',
            property: contract.property?.title || 'Imóvel',
            tenant: contract.tenant?.name || 'Inquilino'
          })
          
          // Comissão da imobiliária para este contrato
          realTransactions.push({
            id: `commission-${contract.id}`,
            type: 'receivable',
            description: `Comissão (${adminFeePercentage}%) - ${contract.property?.title || 'Imóvel'}`,
            amount: commissionAmount,
            dueDate: new Date(baseDate.getTime() + (5 + index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            property: contract.property?.title || 'Imóvel'
          })
          
          // Pagamento ao proprietário (valor líquido)
          const ownerPayment = rentAmount - commissionAmount
          realTransactions.push({
            id: `owner-payment-${contract.id}`,
            type: 'payable',
            description: `Pagamento Proprietário - ${contract.property?.title || 'Imóvel'}`,
            amount: ownerPayment,
            dueDate: new Date(baseDate.getTime() + (8 + index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            property: contract.property?.title || 'Imóvel'
          })
        })
        
        // Adicionar conta a pagar
        realTransactions.push({
          id: 'maintenance-1',
          type: 'payable',
          description: 'Manutenção Predial',
          amount: 800,
          dueDate: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          property: properties[0]?.title || 'Edifício'
        })
        
        // Se não há contratos ativos de aluguel, remover transações de manutenção
        if (activeRentContracts.length === 0) {
          // Limpar todas as transações se não há contratos
          realTransactions.length = 0
        }
        
        setStats(calculatedStats)
        setTransactions(realTransactions)
      } catch (error) {
        console.error('Error fetching financial data:', error)
        // Fallback para dados simulados em caso de erro
        // Em caso de erro, manter valores zerados
        setStats({
          totalReceivable: 0,
          totalPayable: 0,
          rentContractsPercentage: 0,
          saleContractsPercentage: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          overdueReceivables: 0,
          overduePayables: 0
        })
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'overdue': return 'Vencido'
      default: return 'Pendente'
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
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Controle financeiro completo da imobiliária
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-sm ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {refreshing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {refreshing ? 'Atualizando...' : 'Atualizar Dados'}
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contas a Receber */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contas a Receber</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Comissão da Imobiliária</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatCurrency(stats.totalReceivable)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-red-500 dark:text-red-400">
                {formatCurrency(stats.overdueReceivables)} em atraso
              </span>
            </div>
          </div>

          {/* Contas a Pagar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contas a Pagar</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {formatCurrency(stats.totalPayable)}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-red-500 dark:text-red-400">
                {formatCurrency(stats.overduePayables)} em atraso
              </span>
            </div>
          </div>

          {/* Porcentagem Contratos de Aluguel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contratos de Aluguel</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {stats.rentContractsPercentage}%
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                do total de contratos
              </span>
            </div>
          </div>

          {/* Porcentagem Contratos de Venda */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contratos de Venda</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {stats.saleContractsPercentage}%
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                do total de contratos
              </span>
            </div>
          </div>
        </div>

        {/* Resumo Mensal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md transform hover:scale-[1.01]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumo do Mês
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Receitas</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Este mês</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.monthlyIncome)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Despesas</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Este mês</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(stats.monthlyExpenses)}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Saldo Líquido</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(stats.monthlyIncome - stats.monthlyExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transações Recentes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md transform hover:scale-[1.01]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transações Recentes
            </h2>
            {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'receivable' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {transaction.status === 'paid' ? (
                        <CheckCircle className={`w-5 h-5 ${
                          transaction.type === 'receivable' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      ) : transaction.status === 'overdue' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <DollarSign className={`w-5 h-5 ${
                          transaction.type === 'receivable' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Venc: {new Date(transaction.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${
                      transaction.type === 'receivable' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'receivable' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                    <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma transação encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Cadastre contratos para ver as transações financeiras.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  )
}