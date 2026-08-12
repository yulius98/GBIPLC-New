import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import IbadahRayaPage from './pages/IbadahRayaPage'
import YouthPage from './pages/YouthPage'
import LifeGroupPage from './pages/LifeGroupPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import EventsPage from './pages/EventsPage'
import DashboardPage from './pages/DashboardPage'
import AdminKegiatanPage from './pages/admin/AdminKegiatanPage'
import AdminSaatTeduhPage from './pages/admin/AdminSaatTeduhPage'
import AdminIbadahRayaPage from './pages/admin/AdminIbadahRayaPage'
import AdminKunjunganPage from './pages/admin/AdminKunjunganPage'
import AdminSettingPage from './pages/admin/AdminSettingPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Halaman publik */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ibadah-raya" element={<IbadahRayaPage />} />
        <Route path="/youth" element={<YouthPage />} />
        <Route path="/life-group" element={<LifeGroupPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Halaman berisi login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/events" element={<EventsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Panel admin (sidebar), khusus pengurus */}
      <Route
        element={
          <ProtectedRoute role="pengurus">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/kegiatan" element={<AdminKegiatanPage />} />
        <Route path="/dashboard/saat-teduh" element={<AdminSaatTeduhPage />} />
        <Route path="/dashboard/ibadah-raya" element={<AdminIbadahRayaPage />} />
        <Route path="/dashboard/kunjungan" element={<AdminKunjunganPage />} />
        <Route path="/dashboard/setting" element={<AdminSettingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
