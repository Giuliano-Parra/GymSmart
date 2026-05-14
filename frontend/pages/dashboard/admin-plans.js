import { useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '../../lib/supabaseClient'

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [disciplines, setDisciplines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    discipline_id: '',
    name: '',
    price_bs: '',
    duration_days: '',
    is_active: true
  })

  useEffect(() => {
    checkAuth()
    fetchPlans()
    fetchDisciplines()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/plans/')
      setPlans(response.data)
    } catch (error) {
      console.error('Error al cargar planes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDisciplines = async () => {
  setDisciplines([
    { id: 1, name: 'Máquinas' },
    { id: 2, name: 'Aeróbicos' },
    { id: 3, name: 'Spinning' }
  ])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        await axios.put(`http://localhost:8000/api/plans/${editingPlan.id}`, formData)
        alert('Plan actualizado')
      } else {
        await axios.post('http://localhost:8000/api/plans/', formData)
        alert('Plan creado')
      }
      setShowForm(false)
      setEditingPlan(null)
      setFormData({ discipline_id: '', name: '', price_bs: '', duration_days: '', is_active: true })
      fetchPlans()
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || 'Error al guardar'))
    }
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      discipline_id: plan.discipline_id,
      name: plan.name,
      price_bs: plan.price_bs,
      duration_days: plan.duration_days,
      is_active: plan.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (planId) => {
    if (confirm('¿Desactivar este plan?')) {
      try {
        await axios.delete(`http://localhost:8000/api/plans/${planId}`)
        alert('Plan desactivado')
        fetchPlans()
      } catch (error) {
        alert('Error al desactivar')
      }
    }
  }

  if (loading) return <div style={styles.loading}>Cargando planes...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📋 Gestión de Planes</h1>
        <button onClick={() => { setShowForm(true); setEditingPlan(null); setFormData({ discipline_id: '', name: '', price_bs: '', duration_days: '', is_active: true }) }} style={styles.addButton}>
          + Nuevo Plan
        </button>
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h2>
            <form onSubmit={handleSubmit}>
              <select value={formData.discipline_id} onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })} required style={styles.input}>
                <option value="">Seleccionar disciplina</option>
                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="text" placeholder="Nombre del plan" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={styles.input} />
              <input type="number" placeholder="Precio (Bs)" value={formData.price_bs} onChange={(e) => setFormData({ ...formData, price_bs: e.target.value })} required style={styles.input} />
              <input type="number" placeholder="Duración (días)" value={formData.duration_days} onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })} required style={styles.input} />
              <label style={styles.checkbox}>
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                Activo
              </label>
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveButton}>Guardar</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingPlan(null) }} style={styles.cancelButton}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Disciplina</th>
            <th>Nombre</th>
            <th>Precio (Bs)</th>
            <th>Duración</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => {
            const disciplina = disciplines.find(d => d.id === plan.discipline_id)
            return (
              <tr key={plan.id}>
                <td>{plan.id}</td>
                <td>{disciplina?.name || '-'}</td>
                <td>{plan.name}</td>
                <td>{plan.price_bs}</td>
                <td>{plan.duration_days} días</td>
                <td>{plan.is_active ? '✅ Activo' : '❌ Inactivo'}</td>
                <td>
                  <button onClick={() => handleEdit(plan)} style={styles.editButton}>✏️</button>
                  <button onClick={() => handleDelete(plan.id)} style={styles.deleteButton}>🗑️</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  addButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  editButton: { padding: '5px 10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '10px', width: '400px', maxWidth: '90%' }
}
