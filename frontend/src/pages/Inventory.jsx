import { useEffect, useState, useRef } from 'react'
import api from '../services/api'

const empty = { name: '', barcode: '', price: '', cost: '', stock: '', min_stock: 5, category_id: '' }

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const importRef = useRef()

  const load = async () => {
    const { data } = await api.get(`/products/?search=${search}`)
    setProducts(data)
  }

  useEffect(() => { load() }, [search])

  const save = async (e) => {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock), min_stock: Number(form.min_stock) }
    if (editing) {
      await api.put(`/products/${editing}`, payload)
    } else {
      await api.post('/products/', payload)
    }
    setForm(empty)
    setEditing(null)
    load()
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar producto?')) return
    await api.delete(`/products/${id}`)
    load()
  }

  const edit = (p) => {
    setEditing(p.id)
    setForm({ name: p.name, barcode: p.barcode || '', price: p.price, cost: p.cost, stock: p.stock, min_stock: p.min_stock, category_id: p.category_id || '' })
  }

  const uploadImage = async (productId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    await api.post(`/products/${productId}/image`, fd)
    load()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportMsg('Importando...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/import/products', fd)
      setImportMsg(`✅ ${data.created} creados, ${data.updated} actualizados${data.errors.length ? ` — ${data.errors.length} errores` : ''}`)
      load()
    } catch (err) {
      setImportMsg(`❌ Error: ${err.response?.data?.detail || err.message}`)
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Inventario</h2>

      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="grid grid-cols-6 gap-3">
          {[['name','Nombre'],['barcode','Código'],['price','Precio'],['cost','Costo'],['stock','Stock'],['min_stock','Stock mín']].map(([k,l]) => (
            <div key={k} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">{l}</label>
              <input placeholder={l} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required={k === 'name' || k === 'price'} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-indigo-600 text-white rounded px-6 py-1.5 text-sm hover:bg-indigo-700">
            {editing ? 'Actualizar' : 'Agregar'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty) }}
            className="bg-gray-200 rounded px-6 py-1.5 text-sm hover:bg-gray-300">Cancelar</button>}
        </div>
      </form>

      <div className="flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..." className="border rounded px-3 py-2 text-sm w-64" />
        <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
          📥 Importar Excel
          <input type="file" accept=".xlsx,.xls" className="hidden" ref={importRef} onChange={handleImport} />
        </label>
        {importMsg && <span className="text-sm">{importMsg}</span>}
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['Foto','Nombre','Código','Precio','Costo','Stock','Acciones'].map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-t ${p.stock <= p.min_stock ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2">
                  <label className="cursor-pointer">
                    {p.image_url
                      ? <img src={`http://localhost:8000${p.image_url}`} alt={p.name}
                          className="w-10 h-10 object-cover rounded" />
                      : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">+foto</div>
                    }
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files[0] && uploadImage(p.id, e.target.files[0])} />
                  </label>
                </td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-gray-500">{p.barcode}</td>
                <td className="px-4 py-2">${p.price.toFixed(2)}</td>
                <td className="px-4 py-2">${p.cost.toFixed(2)}</td>
                <td className="px-4 py-2">{p.stock}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => edit(p)} className="text-indigo-600 hover:underline">Editar</button>
                  <button onClick={() => del(p.id)} className="text-red-500 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
