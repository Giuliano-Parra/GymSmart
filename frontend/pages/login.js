import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    const userId = data.user.id

    try {
      const response = await axios.get(`http://localhost:8000/api/users/profile/${userId}`)
      const role = response.data.role

      if (role === 'admin') {
        window.location.href = '/dashboard/admin'
      } else if (role === 'employee' || role === 'instructor' || role === 'admin_staff') {
        window.location.href = '/dashboard/employee'
      } else {
        window.location.href = '/dashboard/user'
      }
    } catch (err) {
      console.error('Error al obtener perfil:', err)
      window.location.href = '/dashboard/user'
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', marginTop: '20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px' }}
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        ¿No tienes cuenta? <a href="/register" style={{ color: '#0070f3' }}>Regístrate</a>
      </p>
    </div>
  )
}
