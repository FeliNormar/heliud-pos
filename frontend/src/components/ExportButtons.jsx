import { useState } from 'react'
import { downloadFile } from '../services/download'

export default function ExportButtons({ excelUrl, pdfUrl, excelName, pdfName }) {
  const [loadingXls, setLoadingXls] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const handle = async (url, name, setLoading) => {
    setLoading(true)
    try { await downloadFile(url, name) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => handle(excelUrl, excelName, setLoadingXls)}
        disabled={loadingXls}
        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-60">
        {loadingXls ? '⏳' : '📊'} Excel
      </button>
      <button onClick={() => handle(pdfUrl, pdfName, setLoadingPdf)}
        disabled={loadingPdf}
        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-60">
        {loadingPdf ? '⏳' : '📄'} PDF
      </button>
    </div>
  )
}
