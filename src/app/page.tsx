export default function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '48px', color: '#ff4352' }}>AV HOME</h1>
      <p>Teste de deploy - Vercel Build</p>
      <p>{new Date().toLocaleString('pt-BR')}</p>
    </div>
  )
}