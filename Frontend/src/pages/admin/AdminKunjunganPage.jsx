import { useEffect, useState } from 'react'
import AdminCrudPage from '../../components/AdminCrudPage'
import api from '../../api/client'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminKunjunganPage() {
  const [jemaat, setJemaat] = useState([])

  useEffect(() => {
    api
      .get('/admin/users')
      .then((res) => setJemaat(res.data.data || []))
      .catch(() => {})
  }, [])

  const jemaatOptions = jemaat.map((u) => ({ value: u.id, label: `${u.name} (${u.id})` }))
  const jemaatMap = jemaat.reduce((m, u) => ({ ...m, [u.id]: u.name }), {})

  return (
    <AdminCrudPage
      title="Kunjungan"
      apiPath="/kunjungan"
      searchKeys={['nama_timbesuk', 'keterangan']}
      searchPlaceholder="Cari nama tim besuk atau keterangan…"
      columns={[
        {
          key: 'id_jemaat',
          label: 'Jemaat',
          render: (item) => jemaatMap[item.id_jemaat] || item.id_jemaat,
        },
        { key: 'tglkunjungan', label: 'Tanggal', render: (item) => formatDate(item.tglkunjungan) },
        { key: 'nama_timbesuk', label: 'Nama Tim Besuk' },
        { key: 'keterangan', label: 'Keterangan' },
      ]}
      fields={[
        {
          name: 'id_jemaat',
          label: 'Jemaat',
          type: 'select',
          required: true,
          options: jemaatOptions,
          placeholder: 'Pilih jemaat',
        },
        {
          name: 'tglkunjungan',
          label: 'Tanggal Kunjungan',
          type: 'date',
          required: true,
        },
        {
          name: 'nama_timbesuk',
          label: 'Nama Tim Besuk',
          type: 'text',
          placeholder: 'Nama yang berkunjung',
          required: true,
        },
        {
          name: 'keterangan',
          label: 'Keterangan',
          type: 'textarea',
          rows: 3,
        },
        { name: 'filename', label: 'Foto', type: 'file', accept: 'image/*' },
      ]}
      options={{ id_jemaat: jemaatOptions }}
      initialForm={{
        id_jemaat: '',
        tglkunjungan: '',
        nama_timbesuk: '',
        keterangan: '',
        filename: null,
      }}
      emptyText="Belum ada data kunjungan."
    />
  )
}
