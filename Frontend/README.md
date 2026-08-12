# GBI PLC Frontend (React + Vite)

Frontend React untuk aplikasi GBI PLC — pengganti halaman web Laravel
(gbiPLC). Mengkonsumsi API dari `Backend/` (Express.js).

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Build tool | Vite |
| UI | React 19 |
| Routing | React Router |
| HTTP | Axios |

## Struktur

```
Frontend/
├── src/
│   ├── main.jsx            # Entry point (BrowserRouter + AuthProvider)
│   ├── App.jsx             # Routes
│   ├── api/client.js       # Axios instance (JWT + redirect 401)
│   ├── context/AuthContext.jsx  # Login/logout/status user
│   ├── components/         # Layout, ProtectedRoute
│   └── pages/              # Login, Beranda (reading), Agenda, Profil, Dashboard
├── vite.config.js          # Proxy /api & /uploads -> localhost:8000
└── package.json
```

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173 (proxy API ke http://localhost:8000)
```

Pastikan backend berjalan di `http://localhost:8000`.

## Environment

| Variabel | Default | Fungsi |
|----------|---------|--------|
| `VITE_API_URL` | `/api` | Base URL API. Jika diisi URL penuh (mis. `https://api.example.com/api`), media upload ikut memakai origin tersebut. |

## Script

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Dev server (HMR) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Pratinjau hasil build |
| `npm run lint` | Oxlint |

## Catatan

- Token JWT disimpan di `localStorage` (`gbipc_token`) dan otomatis dilampirkan
  sebagai `Authorization: Bearer`.
- Respons 401 otomatis mengarahkan kembali ke `/login`.
- Halaman Dashboard hanya tampil untuk role `pengurus`.
