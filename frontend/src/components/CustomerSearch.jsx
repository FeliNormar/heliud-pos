import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const fmtBalance = (b) => {
  const abs = Math.abs(b).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
  return b < 0
    ? { text: `Debe: ${abs}`, cls: 'text-red-500' }
    : { text: `Saldo: ${abs}`, cls: 'text-green-600' }
}

export default function CustomerSearch({ selected, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [balance, setBalance] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 2) return setResults([])
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { data } = await api.get(`/customers/?search=${query}`)
      setResults(data)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  useEffect(() => {
    if (!selected) return setBalance(null)
    api.get(`/customers/${selected.id}/credit-balance`)
      .then(({ data }) => setBalance(data.balance))
  }, [selected])

  const select = (c) => {
    onSelect(c)
    setQuery('')
    setResults([])
  }

  if (selected) {
    const bal = balance !== null ? fmtBalance(balance) : null
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded px-3 py-1.5 text-sm">
          <span className="text-indigo-700">👤 {selected.name}</span>
          {selected.phone && <span className="text-gray-400">{selected.phone}</span>}
          <button onClick={onClear} className="ml-auto text-gray-400 hover:text-red-500 text-xs">✕</button>
        </div>
        {bal && <p className={`text-xs px-1 ${bal.cls}`}>{bal.text}</p>}
      </div>
    )
  }

  return (
    <div className="relative">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente (nombre o teléfono)..."
        className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      {results.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded shadow w-full max-h-48 overflow-auto">
          {results.map((c) => (
            <li key={c.id} onClick={() => select(c)}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between">
              <span>{c.name}</span>
              <span className="text-gray-400">{c.phone}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
