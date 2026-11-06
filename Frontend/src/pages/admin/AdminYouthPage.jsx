import { useState } from 'react'
import AdminCrudPage from '../../components/AdminCrudPage'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function truncate(text, max = 60) {
  const s = String(text || '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

const TYPE_SCHEDULE_OPTIONS = [
  { value: 'weekly', label: 'Rutininggu (weekly)' },
  { value: 'special_event', label: 'Acara Khusus (special event)' },
]

const TYPE_GALLERY_OPTIONS = [
  { value: 'image', label: 'Gambar' },
  { value: 'video', label: 'Video' },
]

/**
 * Tab: Program Youth (tbl_youth_programs via /youth/programs)
 */
function ProgramTab() {
  return (
    <AdminCrudPage
      title="Program Youth"
      apiPath="/youth/programs"
      searchKeys={['title', 'description', 'category']}
      searchPlaceholder="Cari program…"
      columns={[
        { key: 'icon', label: 'Icon', width: '8%' },
        { key: 'title', label: 'Judul' },
        { key: 'frequency', label: 'Frekuensi' },
        { key: 'category', label: 'Kategori' },
        { key: 'order', label: 'Urutan' },
        { key: 'is_active', label: 'Aktif', render: (item) => (item.is_active ? 'Ya' : 'Tidak') },
      ]}
      fields={[
        { name: 'title', label: 'Judul', type: 'text', placeholder: 'Youth Service', required: true },
        {
          name: 'description',
          label: 'Deskripsi',
          type: 'textarea',
          className: 'field--full',
          rows: 4,
          placeholder: 'Deskripsi program',
        },
        { name: 'icon', label: 'Icon', type: 'text', placeholder: '✦ (emoji/karakter singkat)' },
        { name: 'frequency', label: 'Frekuensi', type: 'text', placeholder: 'Sabtu, 16.00 WIB' },
        { name: 'category', label: 'Kategori', type: 'text', placeholder: 'Fellowship / Worship' },
        { name: 'order', label: 'Urutan Tampil', type: 'number', min: 0, placeholder: '0' },
        {
          name: 'is_active',
          label: 'Tampilkan di halaman publik',
          type: 'checkbox',
          hint: 'Hilangkan centang untuk menyembunyikan program tanpa menghapus datanya.',
        },
      ]}
      initialForm={{ title: '', description: '', icon: '', frequency: '', category: '', order: 0, is_active: true }}
      emptyText="Belum ada program youth."
    />
  )
}

/**
 * Tab: Jadwal Youth (tbl_youth_schedules via /youth/schedules)
 */
function ScheduleTab() {
  return (
    <AdminCrudPage
      title="Jadwal Youth"
      apiPath="/youth/schedules"
      searchKeys={['title', 'location', 'description']}
      searchPlaceholder="Cari jadwal atau lokasi…"
      columns={[
        { key: 'title', label: 'Judul' },
        {
          key: 'type',
          label: 'Tipe',
          render: (item) => (item.type === 'special_event' ? 'Acara Khusus' : 'Rutininggu'),
        },
        {
          key: 'when',
          label: 'Waktu',
          render: (item) =>
            item.type === 'special_event' && item.event_date
              ? formatDate(item.event_date)
              : item.day_of_week || '—',
        },
        {
          key: 'time',
          label: 'Jam',
          render: (item) =>
            item.start_time ? `${item.start_time}${item.end_time ? ` - ${item.end_time}` : ''}` : '—',
        },
        { key: 'location', label: 'Lokasi', render: (item) => truncate(item.location) },
        { key: 'order', label: 'Urutan' },
        { key: 'is_active', label: 'Aktif', render: (item) => (item.is_active ? 'Ya' : 'Tidak') },
      ]}
      fields={[
        { name: 'title', label: 'Judul', type: 'text', placeholder: 'Youth Service', required: true },
        {
          name: 'type',
          label: 'Tipe Jadwal',
          type: 'select',
          required: true,
          options: TYPE_SCHEDULE_OPTIONS,
        },
        { name: 'day_of_week', label: 'Hari (untuk rutininggu)', type: 'text', placeholder: 'Minggu / Sabtu' },
        { name: 'event_date', label: 'Tanggal (untuk acara khusus)', type: 'date' },
        { name: 'start_time', label: 'Jam Mulai', type: 'text', placeholder: '16.00' },
        { name: 'end_time', label: 'Jam Selesai', type: 'text', placeholder: '18.00' },
        { name: 'location', label: 'Lokasi', type: 'text', placeholder: 'Aula GBI PLC', required: true },
        { name: 'location_url', label: 'Link Lokasi (Maps)', type: 'text', placeholder: 'https://maps.google.com/…' },
        {
          name: 'description',
          label: 'Deskripsi',
          type: 'textarea',
          className: 'field--full',
          rows: 3,
          placeholder: 'Keterangan tambahan',
        },
        { name: 'category', label: 'Kategori', type: 'text', placeholder: 'Youth Service / Fellowship' },
        { name: 'order', label: 'Urutan Tampil', type: 'number', min: 0, placeholder: '0' },
        {
          name: 'is_active',
          label: 'Tampilkan di halaman publik',
          type: 'checkbox',
          hint: 'Hilangkan centang untuk menyembunyikan jadwal tanpa menghapus datanya.',
        },
      ]}
      initialForm={{
        title: '',
        type: 'weekly',
        day_of_week: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        location_url: '',
        description: '',
        category: '',
        order: 0,
        is_active: true,
      }}
      emptyText="Belum ada jadwal youth."
    />
  )
}

/**
 * Tab: Galeri Youth (tbl_youth_galleries via /youth/galleries)
 */
function GalleryTab() {
  return (
    <AdminCrudPage
      title="Galeri Youth"
      apiPath="/youth/galleries"
      searchKeys={['title', 'description', 'category']}
      searchPlaceholder="Cari galeri…"
      columns={[
        { key: 'file_path', label: 'Media', image: true },
        { key: 'title', label: 'Judul' },
        { key: 'type', label: 'Tipe', render: (item) => (item.type === 'video' ? 'Video' : 'Gambar') },
        { key: 'category', label: 'Kategori' },
        { key: 'event_date', label: 'Tanggal', render: (item) => formatDate(item.event_date) },
        { key: 'is_featured', label: 'Unggulan', render: (item) => (item.is_featured ? 'Ya' : 'Tidak') },
        { key: 'order', label: 'Urutan' },
      ]}
      fields={[
        { name: 'title', label: 'Judul', type: 'text', placeholder: 'Youth Camp 2026', required: true },
        {
          name: 'type',
          label: 'Tipe Media',
          type: 'select',
          required: true,
          options: TYPE_GALLERY_OPTIONS,
        },
        {
          name: 'file',
          label: 'File Media (gambar/video)',
          type: 'file',
          accept: 'image/*,video/*',
          webp: true,
          // Gambar otomatis dikonversi ke WebP maks 150 KB (video tidak ikut dikonversi)
          maxSizeKB: 150,
          oldFileKey: 'file_path',
          requiredCreate: true,
        },
        {
          name: 'thumbnail',
          label: 'Thumbnail Video (opsional)',
          type: 'file',
          accept: 'image/*',
          webp: true,
          maxSizeKB: 150,
          oldFileKey: 'thumbnail_path',
        },
        {
          name: 'description',
          label: 'Deskripsi',
          type: 'textarea',
          className: 'field--full',
          rows: 3,
          placeholder: 'Keterangan momen',
        },
        { name: 'category', label: 'Kategori', type: 'text', placeholder: 'Retreat / Ibadah' },
        { name: 'event_date', label: 'Tanggal Acara', type: 'date' },
        { name: 'order', label: 'Urutan Tampil', type: 'number', min: 0, placeholder: '0' },
        {
          name: 'is_featured',
          label: 'Jadikan unggulan',
          type: 'checkbox',
        },
      ]}
      initialForm={{
        title: '',
        type: 'image',
        file: null,
        thumbnail: null,
        description: '',
        category: '',
        event_date: '',
        order: 0,
        is_featured: false,
      }}
      emptyText="Belum ada galeri youth."
    />
  )
}

/**
 * Kelola konten halaman publik /youth — tiga resource yang dipisah per tab
 * agar halaman tidak memanjang (hanya satu section aktif yang dirender):
 * 1. Program     (tbl_youth_programs)   via /youth/programs
 * 2. Jadwal      (tbl_youth_schedules)  via /youth/schedules
 * 3. Galeri      (tbl_youth_galleries)  via /youth/galleries
 */
export default function AdminYouthPage() {
  const [active, setActive] = useState('program')

  const tabs = [
    { id: 'program', label: 'Program', content: <ProgramTab /> },
    { id: 'jadwal', label: 'Jadwal', content: <ScheduleTab /> },
    { id: 'galeri', label: 'Galeri', content: <GalleryTab /> },
  ]
  const current = tabs.find((t) => t.id === active) || tabs[0]

  return (
    <>
      <div className="admin-tabs" role="tablist" aria-label="Section Youth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === current.id}
            className={`admin-tabs__tab${tab.id === current.id ? ' admin-tabs__tab--active' : ''}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current.content}
    </>
  )
}
