import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Wallet, Store, CreditCard, Layers, DollarSign, CheckCircle } from 'lucide-react'
import './index.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [categories, setCategories] = useState([])
  const [establishments, setEstablishments] = useState([])
  
  const [formData, setFormData] = useState({
    categoria_id: '',
    establecimiento_id: '',
    metodo_pago: 'Liquidez',
    tipo_gasto: 'Variable',
    monto: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      const { data: cats } = await supabase.from('categoria').select('*').order('nombre')
      const { data: ests } = await supabase.from('establecimientos').select('*').order('nombre')
      setCategories(cats || [])
      setEstablishments(ests || [])
      if (cats?.length > 0) setFormData(prev => ({ ...prev, categoria_id: cats[0].id }))
      if (ests?.length > 0) setFormData(prev => ({ ...prev, establecimiento_id: ests[0].id }))
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.monto || !formData.categoria_id) return

    setLoading(true)
    try {
      const selectedCategory = categories.find(c => String(c.id) === String(formData.categoria_id))?.nombre
      const selectedEstablishment = establishments.find(e => String(e.id) === String(formData.establecimiento_id))?.nombre

      const { error } = await supabase.from('gastos').insert([
        {
          categoria: selectedCategory,
          establecimiento: selectedEstablishment,
          metodo_pago: formData.metodo_pago,
          tipo_gasto: formData.tipo_gasto,
          monto: parseFloat(formData.monto),
          fecha: new Date().toISOString().split('T')[0]
        }
      ])

      if (error) throw error
      
      setSuccess(true)
      setFormData(prev => ({ ...prev, monto: '' }))
      setTimeout(() => setSuccess(false), 3500)
    } catch (error) {
      alert('Error al guardar gasto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="app-header">
        <div className="app-header-icon">
          <Wallet size={20} color="#fff" />
        </div>
        <div>
          <h1>Gastos de Casa</h1>
          <p className="subtitle">Control de finanzas personales</p>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Registrar nuevo gasto</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><Wallet size={12} /> Categoría</label>
            <select 
              value={formData.categoria_id} 
              onChange={e => setFormData({...formData, categoria_id: e.target.value})}
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label><Store size={12} /> Establecimiento</label>
            <select 
              value={formData.establecimiento_id} 
              onChange={e => setFormData({...formData, establecimiento_id: e.target.value})}
              required
            >
              {establishments.map(est => (
                <option key={est.id} value={est.id}>{est.nombre}</option>
              ))}
            </select>
          </div>

          <hr className="divider" />

          <div className="form-group">
            <label><CreditCard size={12} /> Método de Pago</label>
            <div className="toggle-group">
              <div 
                className={`toggle-option ${formData.metodo_pago === 'Liquidez' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, metodo_pago: 'Liquidez'})}
              >
                Liquidez
              </div>
              <div 
                className={`toggle-option ${formData.metodo_pago === 'Tarjeta' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, metodo_pago: 'Tarjeta'})}
              >
                Tarjeta
              </div>
            </div>
          </div>

          <div className="form-group">
            <label><Layers size={12} /> Tipo de Gasto</label>
            <div className="toggle-group">
              <div 
                className={`toggle-option ${formData.tipo_gasto === 'Fijo' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo_gasto: 'Fijo'})}
              >
                Fijo
              </div>
              <div 
                className={`toggle-option ${formData.tipo_gasto === 'Variable' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo_gasto: 'Variable'})}
              >
                Variable
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="form-group">
            <label><DollarSign size={12} /> Monto</label>
            <div className="amount-wrapper">
              <span className="currency-symbol">$</span>
              <input 
                type="number" 
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monto}
                onChange={e => setFormData({...formData, monto: e.target.value})}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Gasto'}
          </button>

          {success && (
            <div className="success-message">
              <CheckCircle size={16} />
              Gasto registrado correctamente.
            </div>
          )}
        </form>
      </div>
    </>
  )
}

export default App
