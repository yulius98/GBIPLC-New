import AdminCrudPage from '../../components/AdminCrudPage'
import { MEDIA_URL } from '../../api/client'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminIbadahRayaPage() {
  return (
    <>
      <AdminCrudPage
        title="Materi Kotbah Ibadah Raya"
        apiPath="/admin/materi-kotbah"
        searchKeys={['judul']}
        searchPlaceholder="Cari judul kotbah…"
        columns={[
          { key: 'tgl_kotbah', label: 'Tanggal', render: (item) => formatDate(item.tgl_kotbah) },
          { key: 'judul', label: 'Judul' },
          {
            key: 'filename',
            label: 'File',
            render: (item) =>
              item.filename ? (
                <a
                  href={`${MEDIA_URL}/uploads/${item.filename}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka file
                </a>
              ) : (
                '—'
              ),
          },
        ]}
        fields={[
          { name: 'tgl_kotbah', label: 'Tanggal Kotbah', type: 'date', required: true },
          { name: 'judul', label: 'Judul', type: 'text', placeholder: 'Judul kotbah' },
          {
            name: 'filename',
            label: 'File',
            type: 'file',
            accept: '.pdf,.ppt,.pptx,image/*',
            placeholder: 'PDF / PowerPoint / gambar',
          },
        ]}
        initialForm={{ tgl_kotbah: '', judul: '', filename: null }}
        emptyText="Belum ada materi kotbah."
      />
      <AdminCrudPage
        title="Link Ibadah Raya"
        apiPath="/admin/ibadahraya"
        searchKeys={['link_ibadah']}
        searchPlaceholder="Cari link ibadah…"
        columns={[
          { key: 'tgl_ibadah', label: 'Tanggal', render: (item) => formatDate(item.tgl_ibadah) },
          { key: 'ibadah_ke', label: 'Sesi / Ke' },
          {
            key: 'link_ibadah',
            label: 'Link Ibadah',
            render: (item) =>
              item.link_ibadah ? (
                <a href={item.link_ibadah} target="_blank" rel="noreferrer">
                  Buka link
                </a>
              ) : (
                '—'
              ),
          },
        ]}
        fields={[
          { name: 'tgl_ibadah', label: 'Tanggal Ibadah', type: 'date', required: true },
          { name: 'ibadah_ke', label: 'Ibadah Ke', type: 'text', placeholder: 'Mis. 1 / 2 / 3' },
          {
            name: 'link_ibadah',
            label: 'Link Ibadah',
            type: 'url',
            placeholder: 'https://…',
          },
        ]}
        initialForm={{ tgl_ibadah: '', ibadah_ke: '', link_ibadah: '' }}
        emptyText="Belum ada jadwal ibadah raya."
      />
    </>
  )
}
