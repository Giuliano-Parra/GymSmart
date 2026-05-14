import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

export default function UserDashboard() {
  const [user, setUser] = useState(null)
  const [membership, setMembership] = useState(null)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    } else {
      setUser(user)
      await fetchMembership(user.id)
      await fetchAttendanceCount(user.id)
      setLoading(false)
    }
  }

  const fetchMembership = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/memberships/user/${userId}`)
      const activeMembership = response.data.find(m => m.status === 'active')
      setMembership(activeMembership)
    } catch (error) {
      console.error('Error al cargar membresia:', error)
    }
  }

  const fetchAttendanceCount = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/attendance/history/${userId}`)
      setAttendanceCount(response.data.length)
    } catch (error) {
      console.error('Error al cargar asistencias:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-BO')
  }

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false
    const today = new Date()
    const end = new Date(endDate)
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7 && daysLeft > 0
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Mi Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Cerrar Sesion</button>
      </div>

      <div style={styles.welcomeCard}>
        <h2>Bienvenido, {user?.user_metadata?.full_name || user?.email}!</h2>
        <p>Email: {user?.email}</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Asistencias</h3>
          <p style={styles.statNumber}>{attendanceCount}</p>
          <p>entradas registradas</p>
        </div>

        <div style={{...styles.statCard, background: membership ? '#e8f5e9' : '#ffebee'}}>
          <h3>Membresia</h3>
          {membership ? (
            <>
              <p style={styles.statNumber}>{membership.plans?.name || 'Activa'}</p>
              <p>Vence: {formatDate(membership.end_date)}</p>
              {isExpiringSoon(membership.end_date) && (
                <p style={styles.warningText}>Proximo a vencer!</p>
              )}
            </>
          ) : (
            <p style={styles.noMembership}>Sin membresia activa</p>
          )}
        </div>
      </div>

      <div style={styles.qrCard}>
        <h3>Escanea tu asistencia</h3>
        <p>Apunta tu camara al QR en la pantalla de recepcion</p>
        <button onClick={() => window.location.href = '/scan'} style={styles.scanButton}>
          Escanear QR
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' },
  statNumber: { fontSize: '36px', fontWeight: 'bold', margin: '10px 0', color: '#0070f3' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  qrCard: { background: '#e3f2fd', padding: '25px', borderRadius: '10px', textAlign: 'center' },
  scanButton: { padding: '12px 30px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', marginTop: '15px' },
  warningText: { color: '#dc3545', fontWeight: 'bold', marginTop: '10px' },
  noMembership: { color: '#dc3545', fontWeight: 'bold' }
}
