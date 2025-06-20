'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '48px', color: '#ff4352' }}>AV HOME</h1>
      <p>Redirecionando para login...</p>
    </div>
  )
}