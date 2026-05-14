import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Cargando...</h2>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🏋️ GymSmart</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
          Sistema Inteligente de Asistencia con QR y Machine Learning
        </p>
        
        {!session ? (
          <div>
            <button 
              onClick={() => window.location.href = '/login'}
              style={{ padding: '12px 30px', margin: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px' }}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => window.location.href = '/register'}
              style={{ padding: '12px 30px', margin: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px' }}
            >
              Registrarse
            </button>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '20px' }}>Bienvenido, <strong>{session.user.email}</strong></p>
            <button 
              onClick={() => window.location.href = '/dashboard/user'}
              style={{ padding: '12px 30px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px' }}
            >
              Ir al Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
