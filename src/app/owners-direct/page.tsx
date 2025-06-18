'use client'

import { useState } from 'react'

export default function OwnersDirectPage() {
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const createOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/owners-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('Proprietário cadastrado com sucesso!')
        setFormData({
          name: '', email: '', phone: '', document: '',
          address: '', city: '', state: '', zipCode: ''
        })
        loadOwners()
      } else {
        alert('Erro: ' + data.error)
      }
    } catch (error) {
      alert('Erro: ' + error)
    }
    setLoading(false)
  }

  const loadOwners = async () => {
    try {
      const response = await fetch('/api/owners-direct')
      const data = await response.json()
      setOwners(data.owners || [])
    } catch (error) {
      console.error('Erro ao carregar proprietários:', error)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🏠 Cadastro de Proprietários (Teste Direto)</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Novo Proprietário</h2>
          
          <form onSubmit={createOwner} className="space-y-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <input
              type="tel"
              placeholder="Telefone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <input
              type="text"
              placeholder="CPF/CNPJ"
              value={formData.document}
              onChange={(e) => setFormData({...formData, document: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <input
              type="text"
              placeholder="Endereço"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Cidade"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="p-3 border rounded-lg"
                required
              />
              
              <input
                type="text"
                placeholder="Estado"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="p-3 border rounded-lg"
                required
              />
            </div>
            
            <input
              type="text"
              placeholder="CEP"
              value={formData.zipCode}
              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Proprietário'}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Proprietários Cadastrados</h2>
            <button
              onClick={loadOwners}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Carregar Lista
            </button>
          </div>
          
          <div className="space-y-3">
            {owners.map((owner: any) => (
              <div key={owner.id} className="p-3 border rounded-lg">
                <div className="font-medium">{owner.name}</div>
                <div className="text-sm text-gray-600">{owner.email}</div>
                <div className="text-sm text-gray-600">{owner.phone}</div>
              </div>
            ))}
            
            {owners.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                Nenhum proprietário cadastrado ainda
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}