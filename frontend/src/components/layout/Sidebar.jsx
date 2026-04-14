import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/materials', label: 'Materials', icon: '🧵' },
  { to: '/purse-types', label: 'Purse Types', icon: '👜' },
  { to: '/production/new', label: 'New Record', icon: '➕' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ mobile = false }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  if (mobile) {
    return (
      <nav className="bg-white border-t border-gray-200 flex justify-around py-2 shadow-lg">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded text-xs ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{l.icon}</span>
            <span>{l.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav className="bg-white border-r border-gray-200 flex flex-col w-full p-4 gap-1">
      <div className="text-lg font-bold text-indigo-700 mb-4 px-3">👜 Purse Tracker</div>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.exact} className={linkClass}>
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      ))}
      <div className="flex-1" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors mt-auto"
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </nav>
  )
}
