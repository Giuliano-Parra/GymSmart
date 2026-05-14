import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminPayments() {
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    amount_bs: '',
    notes: ''
  })

  useEffect(() => {
    checkAuth()
    fetchUsers()
    fetchPayments()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, email, full_name')
      setUsers(data || [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      // Primero obtener todos los pagos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
      
      if (paymentsError) {
        console.error('Error en pagos:', paymentsError)
        setPayments([])
        setLoading(false)
        return
      }
      
      if (!paymentsData || paymentsData.length === 0) {
        setPayments([])
        setLoading(false)
        return
      }
      
      // Obtener los perfiles de los usuarios (para mostrar nombre y email)
      const userIds = [...new Set(paymentsData.map(p => p.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
      
      // Crear un mapa de perfil por user_id
      const profileMap = {}
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap[profile.id] = profile
        })
      }
      
      // Combinar pagos con perfiles
      const combinedPayments = paymentsData.map(payment => ({
        ...payment,
        profile: profileMap[payment.user_id] || { email: 'Usuario no encontrado', full_name: '-' }
      }))
      
      setPayments(combinedPayments)
    } catch (error) {
      console.error('Error al cargar pagos:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('payments').insert({
        user_id: formData.user_id,
        amount_bs: parseFloat(formData.amount_bs),
        notes: formData.notes,
        payment_date: new Date().toISOString().split('T')[0],
        registered_by: user?.id
      })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Pago registrado correctamente')
        setShowForm(false)
        setFormData({ user_id: '', amount_bs: '', notes: '' })
        fetchPayments()
      }
    } catch (error) {
      alert('Error: ' + (error.message || 'Error al registrar pago'))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-BO')
  }

  if (loading) return <div style={styles.loading}>Cargando pagos...</div>

  const totalIncome = payments.reduce((sum, p) => sum + (p.amount_bs || 0), 0)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>💰 Gestión de Pagos</h1>
        <div>
          <button onClick={() => window.location.href = '/dashboard/admin'} style={styles.backButton}>
            ← Volver al Dashboard
          </button>
          <button onClick={() => setShowForm(true)} style={styles.addButton}>
            + Registrar Pago
          </button>
        </div>
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Registrar Pago</h2>
            <form onSubmit={handleSubmit}>
              <select 
                value={formData.user_id} 
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} 
                required 
                style={styles.input}
              >
                <option value="">Seleccionar cliente</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.email} - {u.full_name || 'Sin nombre'}
                  </option>
                ))}
              </select>
              
              <input 
                type="number" 
                placeholder="Monto (Bs)" 
                value={formData.amount_bs} 
                onChange={(e) => setFormData({ ...formData, amount_bs: e.target.value })} 
                required 
                style={styles.input} 
              />
              
              <textarea 
                placeholder="Notas (opcional)" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                style={styles.textarea} 
              />
              
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveButton}>Registrar</button>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.summaryCard}>
        <h3>📊 Resumen</h3>
        <div style={styles.summaryRow}>
          <span>Total de pagos registrados:</span>
          <strong>{payments.length}</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>Ingreso total:</span>
          <strong style={styles.totalAmount}>Bs. {totalIncome.toLocaleString()}</strong>
        </div>
      </div>

      {payments.length === 0 ? (
        <div style={styles.noData}>No hay pagos registrados</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Email</th>
              <th>Monto (Bs)</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>{formatDate(p.payment_date)}</td>
                <td>{p.profile?.full_name || '-'}</td>
                <td>{p.profile?.email || '-'}</td>
                <td style={styles.amount}>Bs. {p.amount_bs.toLocaleString()}</td>
                <td>{p.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' },
  backButton: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' },
  addButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  summaryCard: { background: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ccc' },
  totalAmount: { color: '#28a745', fontSize: '18px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  noData: { textAlign: 'center', padding: '40px', color: '#666', background: 'white', borderRadius: '10px' },
  amount: { fontWeight: 'bold', color: '#28a745' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px' },
  textarea: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', minHeight: '80px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '10px', width: '450px', maxWidth: '90%' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
}
