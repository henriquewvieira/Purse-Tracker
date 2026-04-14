import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProtectedLayout } from './components/layout/ProtectedLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MaterialsPage from './pages/MaterialsPage.jsx'
import PurseTypesPage from './pages/PurseTypesPage.jsx'
import NewProductionPage from './pages/NewProductionPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/purse-types" element={<PurseTypesPage />} />
          <Route path="/production/new" element={<NewProductionPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
