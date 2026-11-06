import AdminCrudPage from '../../components/AdminCrudPage'

/**
 * Kelola Life Group (komsel) yang tampil di halaman publik /life-group.
 * Resource: tbl_komsels via /admin/lifegroup — nama ditampilkan abjad,
 * sesuai urutan yang dipakai halaman publik.
 */
export default function AdminLifeGroupPage() {
  return (
    <AdminCrudPage
      title="Life Group"
      apiPath="/admin/lifegroup"
      searchKeys={['nama_komsel', 'ketua_komsel']}
      searchPlaceholder="Cari nama komsel atau ketua…"
      columns={[
        { key: 'nama_komsel', label: 'Nama Komsel' },
        { key: 'ketua_komsel', label: 'Ketua' },
        { key: 'no_telp', label: 'No. HP', render: (item) => item.no_telp || '—' },
        { key: 'alamat', label: 'Alamat', render: (item) => item.alamat || '—' },
      ]}
      fields={[
        {
          name: 'nama_komsel',
          label: 'Nama Komsel',
          type: 'text',
          placeholder: 'Life Group Yogyakarta 1',
          required: true,
        },
        {
          name: 'ketua_komsel',
          label: 'Ketua Komsel',
          type: 'text',
          placeholder: 'Nama ketua',
          required: true,
        },
        {
          name: 'no_telp',
          label: 'No. HP',
          type: 'text',
          placeholder: '08xx-xxxx-xxxx',
        },
        {
          name: 'alamat',
          label: 'Alamat',
          type: 'textarea',
          className: 'field--full',
          rows: 2,
          placeholder: 'Alamat pertemuan life group',
        },
      ]}
      initialForm={{ nama_komsel: '', ketua_komsel: '', no_telp: '', alamat: '' }}
      emptyText="Belum ada life group."
    />
  )
}
