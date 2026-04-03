import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import FarmerDashboard from './components/farmer/FarmerDashboard'
import BankUserDashboard from './components/bank-user/BankUserDashboard'
import AdminDashboard from './components/admin/AdminDashboard'
import SuperUserDashboard from './components/super-user/SuperUserDashboard'
import Login from './components/Login'

import keycloak from './keycloak'
import { exchangeKeycloakSession } from './api/client'

function AppRoutes() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
      })
      .then((auth) => {
        setIsAuthenticated(auth)

        if (auth) {
          const roles = keycloak.tokenParsed?.realm_access?.roles || []
          if (roles.includes('farmer')) setUserRole('Farmer')
          else if (roles.includes('bank')) setUserRole('Bank User')
          else if (roles.includes('admin')) setUserRole('Admin')
          else if (roles.includes('super')) setUserRole('Super User')
          else setUserRole('Farmer')
        }

        setLoading(false)
      })
      .catch((err) => {
        console.error('Keycloak init failed', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !keycloak.token) return undefined
    exchangeKeycloakSession(keycloak.token)
    const id = setInterval(() => {
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed && keycloak.token) exchangeKeycloakSession(keycloak.token)
        })
        .catch(() => {})
    }, 120000)
    return () => clearInterval(id)
  }, [isAuthenticated])

  const handleLogin = () => {
    keycloak.login()
  }

  const handleLogout = () => {
    keycloak.logout({
      redirectUri: 'http://localhost:5173/login',
    })
  }

  const handleRoleChange = (role) => {
    setUserRole(role)
    navigate('/dashboard/overview', { replace: true })
  }

  const renderRoleDashboard = () => {
    const props = { userRole, onRoleChange: handleRoleChange, onLogout: handleLogout }
    switch (userRole) {
      case 'Farmer':
        return <FarmerDashboard {...props} />
      case 'Bank User':
        return <BankUserDashboard {...props} />
      case 'Admin':
        return <AdminDashboard {...props} />
      case 'Super User':
        return <SuperUserDashboard {...props} />
      default:
        return <AdminDashboard {...props} />
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard/overview" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />

      <Route
        path="/dashboard/:section"
        element={
          isAuthenticated ? renderRoleDashboard() : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? '/dashboard/overview' : '/login'} replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
