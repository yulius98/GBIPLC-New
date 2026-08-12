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

export default function AdminSaatTeduhPage() {
  return (
    <AdminCrudPage
      title="Saat Teduh"
      apiPath="/admin/pastornote"
      searchKeys={['tgl_note', 'note']}
      searchPlaceholder="Cari tanggal atau isi saat teduh…"
      columns={[
        { key: 'tgl_note', label: 'Tanggal', render: (item) => formatDate(item.tgl_note) },
        { key: 'note', label: 'Isi Saat Teduh', render: (item) => truncate(item.note) },
        { key: 'filename', label: 'Gambar', image: true },
      ]}
      fields={[
        {
          name: 'tgl_note',
          label: 'Tanggal',
          type: 'date',
          required: true,
        },
        {
          name: 'note',
          label: 'Isi Saat Teduh',
          type: 'textarea',
          className: 'field--full',
          rows: 10,
          minHeight: '240px',
          placeholder: 'Tulis renungan / catatan saat teduh…',
          required: true,
        },
        { name: 'filename', label: 'Gambar', type: 'file', accept: 'image/*', webp: true, maxSizeKB: 250 },
      ]}
      initialForm={{ tgl_note: '', note: '', filename: null }}
      emptyText="Belum ada catatan saat teduh."
    />
  )
}
