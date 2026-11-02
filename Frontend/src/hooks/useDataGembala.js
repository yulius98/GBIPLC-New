import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'

// Nilai fallback: dipakai hanya saat API gagal / tabel kosong agar footer
// tidak kosong (sama dengan nilai seed di migrasi tbl_data_gembala).
const DEFAULT_GEMBALA = {
  nama_gembala: 'Pdm. Jimmy Sugiarto',
  wakil_gembala: 'Pdm. Freddy Budiman',
}

/**
 * Data gembala dari tabel tbl_data_gembala (API publik /api/gembala).
 * Return: { gembala: { namaGembala, wakilGembala }, loading }
 */
export default function useDataGembala() {
  const [row, setRow] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/gembala')
      .then((res) => {
        if (active) setRow(res.data?.data || null)
      })
      .catch(() => {
        if (active) setRow(null)
      })
    return () => {
      active = false
    }
  }, [])

  const gembala = useMemo(
    () => ({
      namaGembala: row?.nama_gembala || DEFAULT_GEMBALA.nama_gembala,
      wakilGembala: row?.wakil_gembala || DEFAULT_GEMBALA.wakil_gembala,
    }),
    [row],
  )

  return { gembala, loading: row === null }
}
