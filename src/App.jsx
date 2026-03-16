import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { extractReceiptItems } from './lib/gemini'
import { Wallet, Store, CreditCard, Layers, DollarSign, CheckCircle, Camera, Upload, CheckSquare, Square } from 'lucide-react'
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
  
  // New State for Photo Scanning Mode
  const [viewMode, setViewMode] = useState('manual') // 'manual' | 'foto'
  const [analyzing, setAnalyzing] = useState(false)
  const [extractedItems, setExtractedItems] = useState(null)
  const [selectedItemIds, setSelectedItemIds] = useState([])

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

  const handleMockScan = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAnalyzing(true)
    setExtractedItems(null)
    setSelectedItemIds([])

    try {
      const items = await extractReceiptItems(file)
      setExtractedItems(items)
      // By default, select all
      setSelectedItemIds(items.map(item => item.id))
    } catch (err) {
      alert(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (viewMode === 'manual' && !formData.monto) return
    if (viewMode === 'foto' && selectedItemIds.length === 0) {
      alert("Selecciona al menos un ítem de la boleta")
      return
    }

    setLoading(true)
    try {
      const selectedCategory = categories.find(c => String(c.id) === String(formData.categoria_id))?.nombre
      const selectedEstablishment = establishments.find(e => String(e.id) === String(formData.establecimiento_id))?.nombre

      if (viewMode === 'manual') {
        const { error } = await supabase.from('gastos').insert([
          {
            categoria: selectedCategory,
            establecimiento: selectedEstablishment,
            metodo_pago: formData.metodo_pago,
            tipo_gasto: formData.tipo_gasto,
            monto: parseFloat(formData.monto),
            fecha: new Date().toISOString().split('T')[0],
            descripcion: null
          }
        ])
        if (error) throw error
      } else {
        const itemsToInsert = extractedItems
          .filter(item => selectedItemIds.includes(item.id))
          .map(item => ({
             categoria: selectedCategory,
             establecimiento: selectedEstablishment,
             metodo_pago: formData.metodo_pago,
             tipo_gasto: formData.tipo_gasto,
             monto: item.price,
             fecha: new Date().toISOString().split('T')[0],
             descripcion: item.name
          }))
        
        const { error } = await supabase.from('gastos').insert(itemsToInsert)
        if (error) throw error
      }
      
      setSuccess(true)
      if (viewMode === 'manual') {
        setFormData(prev => ({ ...prev, monto: '' }))
      } else {
        setExtractedItems(null)
        setSelectedItemIds([])
      }
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
        <div className="view-tabs">
          <div 
            className={`view-tab ${viewMode === 'manual' ? 'active' : ''}`}
            onClick={() => setViewMode('manual')}
          >
            <Wallet size={16} /> Manual
          </div>
          <div 
            className={`view-tab ${viewMode === 'foto' ? 'active' : ''}`}
            onClick={() => setViewMode('foto')}
          >
            <Camera size={16} /> Foto (Boleta)
          </div>
        </div>

        <p className="section-title">
          {viewMode === 'manual' ? 'Ingreso de Monto Manual' : 'Escanear Boleta'}
        </p>

        <form onSubmit={handleSubmit}>

          {viewMode === 'foto' && (
            <>
              {!extractedItems && (
                <div className="photo-upload-area">
                  <input type="file" accept="image/*" onChange={handleMockScan} disabled={analyzing} />
                  <div className="photo-upload-content">
                    {analyzing ? (
                      <>
                        <Upload size={32} className="animate-pulse" color="#2563eb" />
                        <span className="photo-upload-text">Analizando imagen...</span>
                        <span className="photo-upload-subtext">Leyendo ítems y montos</span>
                      </>
                    ) : (
                      <>
                        <Camera size={32} />
                        <span className="photo-upload-text">Selecciona o toma una foto</span>
                        <span className="photo-upload-subtext">Formatos: JPG, PNG</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {extractedItems && (
                <div className="scanned-items-container">
                  <div className="scanned-items-header">
                    <span>Ítems detectados</span>
                    <span>Montos</span>
                  </div>
                  {extractedItems.map(item => {
                    const isSelected = selectedItemIds.includes(item.id)
                    return (
                      <div key={item.id} className="scanned-item" onClick={() => toggleItemSelection(item.id)}>
                        {isSelected ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--text-muted)" />}
                        <label>
                          <span style={{flex: 1}}>{item.name}</span>
                          <span className="scanned-item-price">${item.price.toFixed(2)}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {viewMode === 'manual' && (
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
                  required={viewMode === 'manual'}
                />
              </div>
            </div>
          )}

          <hr className="divider" />
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

          {/* General Assignment For Both Modes */}
          <p className="section-title">Asignación Global</p>

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
