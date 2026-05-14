import { useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'

export default function AdminMemberships() {
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active'
  })

  useEffect(() => {
    checkAuth()
    fetchUsers()
    fetchPlans()
    fetchMemberships()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*')
      setUsers(data || [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/plans/')
      setPlans(response.data)
    } catch (error) {
      console.error('Error al cargar planes:', error)
      // Fallback
      setPlans([])
    }
  }

  const fetchMemberships = async () => {
    try {
      const { data } = await supabase.from('memberships').select('*, profiles(email, full_name), plans(name)')
      setMemberships(data || [])
    } catch (error) {
      console.error('Error al cargar membresías:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateEndDate = (startDate, durationDays) => {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + durationDays)
    return end.toISOString().split('T')[0]
  }

  const handlePlanChange = (planId) => {
    const selectedPlan = plans.find(p => p.id === parseInt(planId))
    if (selectedPlan) {
      const endDate = calculateEndDate(formData.start_date, selectedPlan.duration_days)
      setFormData({ ...formData, plan_id: planId, end_date: endDate })
    } else {
      setFormData({ ...formData, plan_id: planId })
    }
  }

  const handleStartDateChange = (startDate) => {
    const selectedPlan = plans.find(p => p.id === parseInt(formData.plan_id))
    if (selectedPlan) {
      const endDate = calculateEndDate(startDate, selectedPlan.duration_days)
      setFormData({ ...formData, start_date: startDate, end_date: endDate })
    } else {
      setFormData({ ...formData, start_date: startDate })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/memberships/create', {
        user_id: formData.user_id,
        plan_id: parseInt(formData.plan_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status
      })
      alert('Membresía asignada correctamente')
      setShowForm(false)
      setFormData({
        user_id: '',
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active'
      })
      fetchMemberships()
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || 'Error al asignar membresía'))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-BO')
  }

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === planId)
    return plan ? plan.name : '-'
  }

  if (loading) return <div style={styles.loading}>Cargando membresías...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📋 Gestión de Membresías</h1>
        <button onClick={() => setShowForm(true)} style={styles.addButton}>
          + Asignar Membresía
        </button>
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Asignar Membresía</h2>
            <form onSubmit={handleSubmit}>
              <select value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} required style={styles.input}>
                <option value="">Seleccionar cliente</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.email} - {u.full_name || 'Sin nombre'}</option>)}
              </select>
              
              <select value={formData.plan_id} onChange={(e) => handlePlanChange(e.target.value)} required style={styles.input}>
                <option value="">Seleccionar plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {p.price_bs} Bs ({p.duration_days} días)</option>)}
              </select>
              
              <input type="date" value={formData.start_date} onChange={(e) => handleStartDateChange(e.target.value)} required style={styles.input} />
              
              <input type="date" value={formData.end_date} disabled style={styles.inputDisabled} />
              
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required style={styles.input}>
                <option value="active">Activo</option>
                <option value="cancelled">Cancelado</option>
              </select>
              
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveButton}>Asignar</button>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Plan</th>
            <th>Inicio</th>
            <th>Vencimiento</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {memberships.map(m => (
            <tr key={m.id}>
              <td>{m.profiles?.email}<br/><small>{m.profiles?.full_name || ''}</small></td>
              <td>{m.plans?.name || getPlanName(m.plan_id)}</td>
              <td>{formatDate(m.start_date)}</td>
              <td style={{ color: new Date(m.end_date) < new Date() ? '#dc3545' : '#28a745' }}>{formatDate(m.end_date)}</td>
              <td>{m.status === 'active' ? '✅ Activo' : '❌ ' + m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' },
  addButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px' },
  inputDisabled: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', background: '#f5f5f5' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '10px', width: '450px', maxWidth: '90%' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
}
