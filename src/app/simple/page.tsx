export default function SimplePage() {
  return (
    <html>
      <body>
        <h1>Servidor funcionando!</h1>
        <p>Se você vê esta página, o Next.js está funcionando.</p>
        <p>Data/Hora: {new Date().toLocaleString('pt-BR')}</p>
      </body>
    </html>
  )
}