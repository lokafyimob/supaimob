// Test login and owner creation via API
const fetch = require('node-fetch')

async function testSystem() {
  try {
    console.log('🔍 Testing system via HTTP APIs...')
    
    // Test if server is running
    const healthCheck = await fetch('http://localhost:3000/api/seed')
    if (!healthCheck.ok) {
      console.log('❌ Server not running')
      return
    }
    
    console.log('✅ Server is running')
    
    // Test owner creation without auth (should fail)
    const ownerResponse = await fetch('http://localhost:3000/api/owners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Maria Santos',
        email: 'maria@teste.com',
        phone: '(11) 88888-8888',
        document: '98765432109',
        address: 'Rua B, 456',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20000-000'
      })
    })
    
    const ownerResult = await ownerResponse.json()
    console.log('📊 Owner creation result:', ownerResult)
    
    if (ownerResponse.status === 401) {
      console.log('✅ Authentication is working (rejected unauthorized request)')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testSystem()