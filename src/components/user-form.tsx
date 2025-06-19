'use client'

import { useState, useEffect } from 'react'
import { X, Building2, User, Eye, EyeOff, Plus } from 'lucide-react'

interface Company {
  id: string
  name: string
  tradeName: string | null
}

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  user?: any
}

export function UserForm({ isOpen, onClose, onSubmit, user }: UserFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    companyId: '',
    isActive: true,
    isBlocked: false,
    createCompany: false,
    companyData: {
      name: '',
      tradeName: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'SP',
      zipCode: ''
    }
  })

  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: user.role || 'USER',
          companyId: user.company?.id || '',
          isActive: user.isActive ?? true,
          isBlocked: user.isBlocked ?? false,
          createCompany: false,
          companyData: {
            name: '',
            tradeName: '',
            document: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: 'SP',
            zipCode: ''
          }
        })
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          companyId: '',
          isActive: true,
          isBlocked: false,
          createCompany: false,
          companyData: {
            name: '',
            tradeName: '',
            document: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: 'SP',
            zipCode: ''
          }
        })
      }
    }
  }, [isOpen, user])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch {
      console.error('Error fetching companies:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        isBlocked: formData.isBlocked,
        ...(formData.password && { password: formData.password }),
        ...(formData.createCompany ? { companyData: formData.companyData } : { companyId: formData.companyId })
      }

      await onSubmit(submitData)
    } catch {
      setError('Erro ao salvar usuário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d{0,3})/, '$1.$2')
    if (numbers.length <= 8) return numbers.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
    if (numbers.length <= 12) return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    
    if (numbers.length === 0) return ''
    if (numbers.length === 1) return `(${numbers}`
    if (numbers.length === 2) return `(${numbers}) `
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    } else if (numbers.length > 6) {
      if (numbers.length > 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      }
    }
    
    return numbers
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    if (numbers.length <= 5) return numbers
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <p className="text-gray-600">
                  {user ? 'Atualize as informações do usuário' : 'Adicione um novo usuário ao sistema'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Informações do Usuário */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Usuário</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {user ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!user}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USER">Usuário</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPER_ADMIN">Super Administrador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Usuário ativo
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isBlocked"
                    checked={formData.isBlocked}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBlocked: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isBlocked" className="text-sm text-gray-700">
                    Usuário bloqueado
                  </label>
                </div>
              </div>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Empresa</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="companyOption"
                      checked={!formData.createCompany}
                      onChange={() => setFormData(prev => ({ ...prev, createCompany: false }))}
                      className="mr-2"
                    />
                    <Building2 className="w-4 h-4 mr-2" />
                    Empresa Existente
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="companyOption"
                      checked={formData.createCompany}
                      onChange={() => setFormData(prev => ({ ...prev, createCompany: true }))}
                      className="mr-2"
                    />
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Empresa
                  </label>
                </div>

                {!formData.createCompany ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecionar Empresa
                    </label>
                    <select
                      value={formData.companyId}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.tradeName || company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Razão Social *
                        </label>
                        <input
                          type="text"
                          required={formData.createCompany}
                          value={formData.companyData.name}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, name: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          value={formData.companyData.tradeName}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, tradeName: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CNPJ *
                        </label>
                        <input
                          type="text"
                          required={formData.createCompany}
                          value={formData.companyData.document}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, document: formatCNPJ(e.target.value) }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={18}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          required={formData.createCompany}
                          value={formData.companyData.email}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, email: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone *
                        </label>
                        <input
                          type="text"
                          required={formData.createCompany}
                          value={formData.companyData.phone}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, phone: formatPhone(e.target.value) }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={15}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CEP *
                        </label>
                        <input
                          type="text"
                          required={formData.createCompany}
                          value={formData.companyData.zipCode}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, zipCode: formatZipCode(e.target.value) }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={9}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço *
                      </label>
                      <input
                        type="text"
                        required={formData.createCompany}
                        value={formData.companyData.address}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          companyData: { ...prev.companyData, address: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          required={formData.createCompany}
                          value={formData.companyData.city}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, city: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado *
                        </label>
                        <select
                          value={formData.companyData.state}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            companyData: { ...prev.companyData, state: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="SP">SP</option>
                          <option value="RJ">RJ</option>
                          <option value="MG">MG</option>
                          <option value="RS">RS</option>
                          <option value="PR">PR</option>
                          <option value="SC">SC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : (user ? 'Atualizar' : 'Criar')} {loading ? '' : 'Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}