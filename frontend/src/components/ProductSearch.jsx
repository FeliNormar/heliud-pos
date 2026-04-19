import { useState } from 'react'
import api from '../services/api'
import { useCartStore } from '../store/cartStore'

export default function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const addItem = useCartStore((s) => s.addItem)

  const search = async (e) => {
    const val = e.target.value
    setQuery(val)
    if (val.length < 2) return setResults([])
    const { data } = await api.get(`/products/?search=${val}`)
    setResults(data)
  }

  const select = (product) => {
    addItem(product)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      <input value={query} onChange={search} placeholder="Buscar producto o código de barras..."
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      {results.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded shadow w-full max-h-60 overflow-auto">
          {results.map((p) => (
            <li key={p.id} onClick={() => select(p)}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between">
              <span>{p.name}</span>
              <span className="text-indigo-600 font-medium">${p.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
