import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { IconMenu } from './Icons'

/**
 * MobileTabBar — navigasi bawah ala aplikasi mobile.
 * Seluruh menu aplikasi (termasuk akun & keluar) hidup di sini:
 * beberapa tujuan utama sebagai tab + tombol "Menu" yang membuka
 * sheet berisi daftar lengkap dari bawah layar.
 *
 * Hanya tampil di layar kecil (CSS menyembunyikannya di desktop).
 *
 * Props:
 * - tabs     : [{ to, label, icon, end? }]  → tab tetap di bar
 * - account  : { name, role } | null        → kartu akun di sheet
 * - rows     : [{ to, label, icon, danger? } | { type: 'sep' } |
 *              { label, icon, danger?, onClick? }] → isi sheet
 */
export default function MobileTabBar({ tabs = [], account = null, rows = [] }) {
  const [open, setOpen] = useState(false)

  // Saat sheet terbuka: kunci scroll latar & tutup dengan tombol Escape
  useEffect(() => {
    if (!open) return
    document.body.classList.add('no-scroll')
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  function renderRow(row, index) {
    if (row.type === 'sep') {
      return <hr className="sheet__sep" key={`sep-${index}`} />
    }
    const cls = `sheet__row${row.danger ? ' sheet__row--danger' : ''}`
    if (row.to) {
      return (
        <NavLink key={row.to} to={row.to} className={cls} onClick={close}>
          {row.icon}
          {row.label}
        </NavLink>
      )
    }
    return (
      <button
        type="button"
        key={row.label}
        className={cls}
        onClick={() => {
          close()
          row.onClick?.()
        }}
      >
        {row.icon}
        {row.label}
      </button>
    )
  }

  return (
    <>
      <nav className="tabbar" aria-label="Navigasi utama">
        <div className="tabbar__inner">
          {tabs.map(({ to, label, icon: TabIcon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}
            >
              <span className="tabbar__ico">
                <TabIcon size={20} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            className="tabbar__item"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span className="tabbar__ico">
              <IconMenu size={20} />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu lengkap">
          <button
            type="button"
            className="sheet__backdrop"
            aria-label="Tutup menu"
            onClick={close}
          />
          <div className="sheet__panel">
            <div className="sheet__handle" aria-hidden="true" />
            {account ? (
              <div className="sheet__account">
                <span className="sheet__avatar" aria-hidden="true">
                  {account.name.charAt(0)}
                </span>
                <span>
                  <span className="sheet__account-name">{account.name}</span>
                  <span className="sheet__account-role">{account.role}</span>
                </span>
              </div>
            ) : (
              <p className="sheet__title">Akun</p>
            )}
            <div className="sheet__list">{rows.map(renderRow)}</div>
          </div>
        </div>
      )}
    </>
  )
}
