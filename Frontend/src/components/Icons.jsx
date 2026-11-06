/**
 * Ikon SVG inline (gaya garis Thin, stroke currentColor).
 * Tanpa dependensi eksternal — konsisten dengan design system CSS.
 */
export function SvgIcon({ size = 20, strokeWidth = 1.8, className, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (props) => (
  <SvgIcon {...props}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
  </SvgIcon>
)

export const IconCalendar = (props) => (
  <SvgIcon {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </SvgIcon>
)

export const IconCalendarCheck = (props) => (
  <SvgIcon {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <path d="m9.5 15.5 2 2 3.5-3.5" />
  </SvgIcon>
)

export const IconBook = (props) => (
  <SvgIcon {...props}>
    <path d="M12 6.5C10.5 5 8.5 4.25 6 4.25c-1 0-2 .15-2.75.4V19c.75-.25 1.75-.4 2.75-.4 2.5 0 4.5.75 6 2 1.5-1.25 3.5-2 6-2 1 0 2 .15 2.75.4V4.65c-.75-.25-1.75-.4-2.75-.4-2.5 0-4.5.75-6 2Z" />
    <path d="M12 6.5v14.1" />
  </SvgIcon>
)

export const IconChurch = (props) => (
  <SvgIcon {...props}>
    <path d="M12 2.5v3M10 3.75h4" />
    <path d="M9 21v-9l3-2.5 3 2.5v9" />
    <path d="M20 21V11l-5-3.5M4 21V11l5-3.5" />
    <path d="M2.5 21h19" />
  </SvgIcon>
)

export const IconHeart = (props) => (
  <SvgIcon {...props}>
    <path d="M12 20.5S3.5 15 3.5 9.1C3.5 6.3 5.8 4 8.6 4c1.5 0 2.7.7 3.4 1.8C12.7 4.7 13.9 4 15.4 4c2.8 0 5.1 2.3 5.1 5.1C20.5 15 12 20.5 12 20.5Z" />
  </SvgIcon>
)

export const IconSettings = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.02.66.44 1.24 1.06 1.45H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </SvgIcon>
)

export const IconUsers = (props) => (
  <SvgIcon {...props}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3.5 19c0-3 2.5-4.75 5.5-4.75s5.5 1.75 5.5 4.75" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16.5 14.6c2.5.4 4 2 4 4.4" />
  </SvgIcon>
)

export const IconUserPlus = (props) => (
  <SvgIcon {...props}>
    <circle cx="10" cy="8" r="3.25" />
    <path d="M4 19c0-3 2.5-4.75 6-4.75s6 1.75 6 4.75" />
    <path d="M20 8v6M17 11h6" />
  </SvgIcon>
)

export const IconMonitor = (props) => (
  <SvgIcon {...props}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 21h7M12 17v4" />
    <path d="M7.5 13v-3M12 13V7.5M16.5 13v-5" />
  </SvgIcon>
)

export const IconGlobe = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M3 12h18" />
    <path d="M12 2.75c2.75 2.5 4 5.75 4 9.25s-1.25 6.75-4 9.25c-2.75-2.5-4-5.75-4-9.25s1.25-6.75 4-9.25Z" />
  </SvgIcon>
)

export const IconTrendUp = (props) => (
  <SvgIcon {...props}>
    <path d="m3.5 17 5.5-5.5 3.5 3.5L20.5 7" />
    <path d="M15.5 7h5v5" />
  </SvgIcon>
)

export const IconFileText = (props) => (
  <SvgIcon {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </SvgIcon>
)

export const IconGroup = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="7.5" r="3.25" />
    <path d="M6.5 20c0-3 2.2-5 5.5-5s5.5 2 5.5 5" />
    <circle cx="5" cy="10" r="2" />
    <circle cx="19" cy="10" r="2" />
  </SvgIcon>
)

/* Dua kepala + dua tubuh bertemu: komunitas kecil (life group/komsel). */
export const IconLifeGroup = (props) => (
  <SvgIcon {...props}>
    <circle cx="9" cy="7.5" r="3" />
    <circle cx="15" cy="7.5" r="3" />
    <path d="M3.5 20c.6-2.8 2.6-4.5 5.5-4.5 1.1 0 2.1.25 3 .8" />
    <path d="M12 16.3c.9-.55 1.9-.8 3-.8 2.9 0 4.9 1.7 5.5 4.5" />
  </SvgIcon>
)

export const IconCake = (props) => (
  <SvgIcon {...props}>
    <path d="M4.5 21h15" />
    <path d="M5.5 21v-8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v8" />
    <path d="M4 11h16" />
    <path d="M12 8v3" />
    <path d="M13.5 6.25a1.5 1.5 0 1 1-3 0C10.5 5.25 12 4 12 4s1.5 1.25 1.5 2.25Z" />
  </SvgIcon>
)

export const IconLayout = (props) => (
  <SvgIcon {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="M3.5 9.5h17M9.5 9.5V20.5" />
  </SvgIcon>
)

export const IconGlobeExternal = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M3 12h18" />
    <path d="M12 2.75c2.75 2.5 4 5.75 4 9.25s-1.25 6.75-4 9.25c-2.75-2.5-4-5.75-4-9.25s1.25-6.75 4-9.25Z" />
    <path d="m15 9 3-3M18.5 9.5V6H15" />
  </SvgIcon>
)

export const IconLogout = (props) => (
  <SvgIcon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </SvgIcon>
)

export const IconArrowRight = (props) => (
  <SvgIcon {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </SvgIcon>
)
