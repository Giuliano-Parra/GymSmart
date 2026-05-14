import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeMemberships: 0,
    expiringMemberships: 0,
    todayAttendances: 0,
    monthlyIncome: 0,
    recentAttendances: []
  })

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    }
  }

  const fetchStats = async () => {
    try {
      // Total de clientes
      const { data: customers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'customer')
      
      // Membresias activas
      const { data: activeMemberships } = await supabase
        .from('memberships')
        .select('id')
        .eq('status', 'active')
      
      // Membresias por vencer (proximos 7 dias)
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]
      
      const { data: expiring } = await supabase
        .from('memberships')
        .select('id')
        .eq('status', 'active')
        .lte('end_date', nextWeekStr)
        .gte('end_date', today)
      
      // Asistencias de hoy
      const { data: todayAtt } = await supabase
        .from('attendances')
        .select('id')
        .gte('scanned_at', today)
      
      // Ingresos del mes
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const startStr = startOfMonth.toISOString().split('T')[0]
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_bs')
        .gte('payment_date', startStr)
      
      const monthlyIncome = payments?.reduce((sum, p) => sum + (p.amount_bs || 0), 0) || 0
      
      // Asistencias recientes
      const { data: recent } = await supabase
        .from('attendances')
        .select('*, profiles(email, full_name)')
        .order('scanned_at', { ascending: false })
        .limit(10)
      
      setStats({
        totalCustomers: customers?.length || 0,
        activeMemberships: activeMemberships?.length || 0,
        expiringMemberships: expiring?.length || 0,
        todayAttendances: todayAtt?.length || 0,
        monthlyIncome: monthlyIncome,
        recentAttendances: recent || []
      })
    } catch (error) {
      console.error('Error al cargar estadisticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) return <div style={styles.loading}>Cargando dashboard...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Panel de Administracion</h1>
        <div style={styles.buttonGroup}>
          <button onClick={() => window.location.href = '/dashboard/admin-plans'} style={styles.navButton}>
            Planes
          </button>
          <button onClick={() => window.location.href = '/dashboard/admin-memberships'} style={styles.navButton}>
            Membresias
          </button>
          <button onClick={() => window.location.href = '/dashboard/admin-payments'} style={styles.navButton}>
            Pagos
          </button>
          <button onClick={() => window.location.href = '/dashboard/admin-employees'} style={styles.navButton}>
            Empleados
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={styles.logoutButton}>
            Cerrar Sesion
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <h3>Clientes</h3>
          <p style={styles.statNumber}>{stats.totalCustomers}</p>
          <p>registrados</p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <h3>Membresias Activas</h3>
          <p style={styles.statNumber}>{stats.activeMemberships}</p>
          <p>vigentes</p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚠️</div>
          <h3>Por Vencer</h3>
          <p style={styles.statNumber}>{stats.expiringMemberships}</p>
          <p>en 7 dias</p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <h3>Asistencias Hoy</h3>
          <p style={styles.statNumber}>{stats.todayAttendances}</p>
          <p>entradas</p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <h3>Ingresos del Mes</h3>
          <p style={styles.statNumber}>Bs. {stats.monthlyIncome.toLocaleString()}</p>
          <p>en pagos</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2>Ultimas Asistencias</h2>
        {stats.recentAttendances.length === 0 ? (
          <p style={styles.noData}>No hay asistencias registradas</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Email</th>
                <th>Fecha/Hora</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAttendances.map((att) => (
                <tr key={att.id}>
                  <td>{att.profiles?.full_name || '-'}</td>
                  <td>{att.profiles?.email || '-'}</td>
                  <td>{formatDate(att.scanned_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  navButton: {
    padding: '10px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  logoutButton: {
    padding: '10px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statIcon: {
    fontSize: '40px',
    marginBottom: '10px'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#0070f3'
  },
  section: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
  },
  noData: {
    textAlign: 'center',
    padding: '30px',
    color: '#666'
  }
}
