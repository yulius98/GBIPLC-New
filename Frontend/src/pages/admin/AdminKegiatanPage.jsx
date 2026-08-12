import AdminCrudPage from '../../components/AdminCrudPage'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function truncate(text, max = 90) {
  const s = String(text || '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

export default function AdminKegiatanPage() {
  return (
    <>
      <AdminCrudPage
        title="Banner"
        apiPath="/admin/carousel"
        searchKeys={['tema', 'description']}
        searchPlaceholder="Cari tema atau deskripsi…"
        columns={[
          { key: 'filename', label: 'Gambar', image: true },
          { key: 'tema', label: 'Tema' },
          { key: 'description', label: 'Deskripsi', width: '55%', render: (item) => truncate(item.description) },
        ]}
        fields={[
          { name: 'tema', label: 'Tema', type: 'text', placeholder: 'Judul banner' },
          {
            name: 'description',
            label: 'Deskripsi',
            type: 'textarea',
            className: 'field--full',
            rows: 6,
            placeholder: 'Deskripsi banner',
          },
          { name: 'filename', label: 'Gambar', type: 'file', accept: 'image/*' },
        ]}
        initialForm={{ tema: '', description: '', filename: null }}
        emptyText="Belum ada banner."
      />
      <AdminCrudPage
        title="Kegiatan"
        apiPath="/admin/event"
        searchKeys={['keterangan']}
        searchPlaceholder="Cari keterangan kegiatan…"
        columns={[
          { key: 'tgl_event', label: 'Tanggal', render: (item) => formatDate(item.tgl_event) },
          { key: 'keterangan', label: 'Keterangan', render: (item) => truncate(item.keterangan) },
          { key: 'filename', label: 'Gambar', image: true },
        ]}
        fields={[
          { name: 'tgl_event', label: 'Tanggal Kegiatan', type: 'date', required: true },
          {
            name: 'keterangan',
            label: 'Keterangan',
            type: 'textarea',
            rows: 3,
            placeholder: 'Deskripsi kegiatan',
          },
          { name: 'filename', label: 'Gambar', type: 'file', accept: 'image/*' },
        ]}
        initialForm={{ tgl_event: '', keterangan: '', filename: null }}
        emptyText="Belum ada kegiatan."
      />
    </>
  )
}
