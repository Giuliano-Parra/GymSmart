import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: fullName, 
          role: 'customer' 
        } 
      }
    })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Registro exitoso! Ahora puedes iniciar sesión.')
      window.location.href = '/login'
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Registro de Usuario</h2>
      <form onSubmit={handleRegister}>
        <input 
          type="text" 
          placeholder="Nombre completo" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          required 
          style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }} 
        />
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
          style={{ width: '100%', padding: '12px', marginTop: '20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px' }}
        >
          {loading ? 'Cargando...' : 'Registrarse'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        ¿Ya tienes cuenta? <a href="/login" style={{ color: '#0070f3' }}>Inicia sesión</a>
      </p>
    </div>
  )
}
