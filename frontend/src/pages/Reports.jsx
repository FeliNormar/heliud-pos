import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import ExportButtons from '../components/ExportButtons'

const today = new Date().toISOString().slice(0, 10)

export default function Reports() {
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [revenueByDay, setRevenueByDay] = useState([])

  useEffect(() => {
    api.get('/reports/summary').then(({ data }) => setSummary(data))
    api.get('/reports/top-products').then(({ data }) => setTopProducts(data))
    api.get('/reports/revenue-by-day').then(({ data }) => setRevenueByDay(data.reverse()))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Reportes</h2>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Ventas hoy', value: summary.total_sales },
            { label: 'Ingresos hoy', value: `$${(summary.total_revenue ?? 0).toFixed(2)}` },
            { label: 'Fecha', value: summary.date },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-gray-500 text-sm">{s.label}</p>
              <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Ingresos últimos 30 días</h3>
          <ExportButtons
            excelUrl="/export/sales/excel"
            pdfUrl="/export/sales/pdf"
            excelName={`ventas_${today}.xlsx`}
            pdfName={`ventas_${today}.pdf`}
          />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueByDay}>
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Utilidad por producto</h3>
          <ExportButtons
            excelUrl="/export/reports/excel?report=profit"
            pdfUrl="/export/reports/pdf?report=profit"
            excelName={`utilidad_${today}.xlsx`}
            pdfName={`utilidad_${today}.pdf`}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Producto</th>
              <th className="px-4 py-2 text-left">Unidades vendidas</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.name} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Ventas por método de pago</h3>
          <ExportButtons
            excelUrl="/export/reports/excel?report=by_payment"
            pdfUrl="/export/reports/pdf?report=by_payment"
            excelName={`pago_${today}.xlsx`}
            pdfName={`pago_${today}.pdf`}
          />
        </div>
        <ExportButtons
          excelUrl="/export/reports/excel?report=by_category"
          pdfUrl="/export/reports/pdf?report=by_category"
          excelName={`categorias_${today}.xlsx`}
          pdfName={`categorias_${today}.pdf`}
        />
        <p className="text-xs text-gray-400 mt-1">↑ Exportar por categoría</p>
      </div>
    </div>
  )
}
