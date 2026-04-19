import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const empty = { name: '', phone: '', email: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    const { data } = await api.get('/customers/')
    setCustomers(data)
  }

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (editing) {
      await api.put(`/customers/${editing}`, form)
    } else {
      await api.post('/customers/', form)
    }
    setForm(empty)
    setEditing(null)
    load()
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar cliente?')) return
    await api.delete(`/customers/${id}`)
    load()
  }

  const edit = (c) => {
    setEditing(c.id)
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Clientes</h2>
      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 grid grid-cols-4 gap-3">
        {[['name','Nombre'],['phone','Teléfono'],['email','Email'],['address','Dirección']].map(([k,l]) => (
          <input key={k} placeholder={l} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            className="border rounded px-2 py-1 text-sm" required={k === 'name'} />
        ))}
        <button type="submit" className="col-span-2 bg-indigo-600 text-white rounded py-1 text-sm hover:bg-indigo-700">
          {editing ? 'Actualizar' : 'Agregar'}
        </button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty) }}
          className="col-span-2 bg-gray-200 rounded py-1 text-sm">Cancelar</button>}
      </form>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['Nombre','Teléfono','Email','Dirección','Acciones'].map((h) => (
              <th key={h} className="px-4 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2">{c.address}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => edit(c)} className="text-indigo-600 hover:underline">Editar</button>
                  <button onClick={() => del(c.id)} className="text-red-500 hover:underline">Eliminar</button>
                  <Link to={`/customers/${c.id}`} className="text-green-600 hover:underline">Crédito</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
