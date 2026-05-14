import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayAttendances, setTodayAttendances] = useState([])

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    } else {
      setUser(user)
      await fetchTodayAttendances()
      setLoading(false)
    }
  }

  const fetchTodayAttendances = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('attendances')
      .select('*, profiles(email, full_name)')
      .gte('scanned_at', today)
      .order('scanned_at', { ascending: false })
    
    setTodayAttendances(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleTimeString('es-BO')
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👔 Panel de Empleado</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Cerrar Sesión</button>
      </div>

      <div style={styles.welcomeCard}>
        <h2>Bienvenido, {user?.user_metadata?.full_name || user?.email}</h2>
        <p>Rol: {user?.user_metadata?.role || 'Empleado'}</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>📅 Asistencias de Hoy</h3>
          <p style={styles.statNumber}>{todayAttendances.length}</p>
          <p>registros</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2>Últimas Asistencias (Hoy)</h2>
        {todayAttendances.length === 0 ? (
          <p style={styles.noData}>No hay asistencias registradas hoy</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Email</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendances.map(att => (
                <tr key={att.id}>
                  <td>{att.profiles?.full_name || '-'}</td>
                  <td>{att.profiles?.email || '-'}</td>
                  <td>{formatTime(att.scanned_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.qrCard}>
        <h3>📱 Registrar Asistencia</h3>
        <p>Los clientes deben escanear el QR en la pantalla de recepción</p>
        <button onClick={() => window.location.href = '/qr-display'} style={styles.qrButton}>
          📷 Ver QR de Recepción
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  logoutButton: { padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  welcomeCard: { background: '#0070f3', color: 'white', padding: '30px', borderRadius: '10px', marginBottom: '30px' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' },
  statNumber: { fontSize: '36px', fontWeight: 'bold', margin: '10px 0', color: '#0070f3' },
  section: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
  noData: { textAlign: 'center', padding: '30px', color: '#666' },
  qrCard: { background: '#e3f2fd', padding: '25px', borderRadius: '10px', textAlign: 'center' },
  qrButton: { padding: '12px 30px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', marginTop: '15px' }
}
