import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'employee'
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['employee', 'instructor', 'admin_staff'])
        .order('created_at', { ascending: false })
      
      setEmployees(data || [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingEmployee) {
      // Actualizar empleado existente
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role
        })
        .eq('id', editingEmployee.id)
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Empleado actualizado correctamente')
        setShowForm(false)
        setEditingEmployee(null)
        setFormData({ email: '', full_name: '', phone: '', role: 'employee' })
        fetchEmployees()
      }
    } else {
      // Crear nuevo empleado (primero crear usuario en auth)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: 'empleado123', // Contraseña por defecto
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role
          }
        }
      })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Empleado creado correctamente. Contraseña temporal: empleado123')
        setShowForm(false)
        setFormData({ email: '', full_name: '', phone: '', role: 'employee' })
        fetchEmployees()
      }
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      email: employee.email,
      full_name: employee.full_name || '',
      phone: employee.phone || '',
      role: employee.role
    })
    setShowForm(true)
  }

  const handleDelete = async (employee) => {
    if (confirm(`¿Eliminar a ${employee.full_name || employee.email}?`)) {
      // En Supabase no se puede eliminar fácilmente un usuario de auth
      // Por ahora solo lo marcamos como inactivo o cambiamos su rol
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'customer' })
        .eq('id', employee.id)
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Empleado desactivado')
        fetchEmployees()
      }
    }
  }

  const getRoleName = (role) => {
    const roles = {
      'admin': 'Administrador',
      'employee': 'Empleado',
      'instructor': 'Instructor',
      'admin_staff': 'Personal Admin'
    }
    return roles[role] || role
  }

  if (loading) return <div style={styles.loading}>Cargando empleados...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👥 Control de Empleados</h1>
        <div>
          <button onClick={() => window.location.href = '/dashboard/admin'} style={styles.backButton}>
            ← Volver al Dashboard
          </button>
          <button onClick={() => { setShowForm(true); setEditingEmployee(null); setFormData({ email: '', full_name: '', phone: '', role: 'employee' }) }} style={styles.addButton}>
            + Agregar Empleado
          </button>
        </div>
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
            <form onSubmit={handleSubmit}>
              {!editingEmployee && (
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  required 
                  style={styles.input} 
                />
              )}
              
              <input 
                type="text" 
                placeholder="Nombre completo" 
                value={formData.full_name} 
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                required 
                style={styles.input} 
              />
              
              <input 
                type="tel" 
                placeholder="Teléfono" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                style={styles.input} 
              />
              
              <select 
                value={formData.role} 
                onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                required 
                style={styles.input}
              >
                <option value="employee">Empleado</option>
                <option value="instructor">Instructor</option>
                <option value="admin_staff">Personal Administrativo</option>
              </select>
              
              {!editingEmployee && (
                <p style={styles.note}>Contraseña temporal: <strong>empleado123</strong></p>
              )}
              
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveButton}>Guardar</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingEmployee(null) }} style={styles.cancelButton}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.summaryCard}>
        <h3>Resumen</h3>
        <div style={styles.summaryRow}>
          <span>Total de empleados:</span>
          <strong>{employees.length}</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>Por rol:</span>
          <div>
            {employees.reduce((acc, e) => {
              acc[e.role] = (acc[e.role] || 0) + 1
              return acc
            }, {}).map((count, role) => (
              <div key={role}>{getRoleName(role)}: {count}</div>
            ))}
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div style={styles.noData}>No hay empleados registrados</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.full_name || '-'}</td>
                <td>{emp.email}</td>
                <td>{emp.phone || '-'}</td>
                <td>{getRoleName(emp.role)}</td>
                <td>
                  <button onClick={() => handleEdit(emp)} style={styles.editButton}>✏️</button>
                  <button onClick={() => handleDelete(emp)} style={styles.deleteButton}>🗑️</button>
                </td>
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
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  noData: { textAlign: 'center', padding: '40px', color: '#666', background: 'white', borderRadius: '10px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px' },
  note: { fontSize: '12px', color: '#666', marginTop: '-5px', marginBottom: '15px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '10px', width: '450px', maxWidth: '90%' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveButton: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  editButton: { padding: '5px 10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }
}
