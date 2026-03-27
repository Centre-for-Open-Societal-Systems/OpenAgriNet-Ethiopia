import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import FarmerDashboard from './components/farmer/FarmerDashboard'
import BankUserDashboard from './components/bank-user/BankUserDashboard'
import AdminDashboard from './components/admin/AdminDashboard'
import SuperUserDashboard from './components/super-user/SuperUserDashboard'
import Login from './components/Login'

import keycloak from "./keycloak";

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Initialize Keycloak
  useEffect(() => {
    keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256"
    }).then(auth => {
      setIsAuthenticated(auth)

      if (auth) {
        // 👉 Get roles from token (default realm roles)
        const roles = keycloak.tokenParsed?.realm_access?.roles || []

        console.log("Roles:", roles)

        // Map roles → your UI roles
        if (roles.includes("farmer")) setUserRole("Farmer")
        else if (roles.includes("bank")) setUserRole("Bank User")
        else if (roles.includes("admin")) setUserRole("Admin")
        else if (roles.includes("super")) setUserRole("Super User")
        else setUserRole("Farmer") // fallback
      }

      setLoading(false)
    }).catch(err => {
      console.error("Keycloak init failed", err)
      setLoading(false)
    })
  }, [])

  // ✅ Login → redirect to Keycloak
  const handleLogin = () => {
    keycloak.login()
  }

  // ✅ Logout
  const handleLogout = () => {
    keycloak.logout({
      redirectUri: "http://localhost:5173/login"
    })
  }

  // Render dashboard based on role
  const renderDashboard = () => {
    switch (userRole) {
      case 'Farmer':
        return <FarmerDashboard userRole={userRole} onLogout={handleLogout} />
      case 'Bank User':
        return <BankUserDashboard userRole={userRole} onLogout={handleLogout} />
      case 'Admin':
        return <AdminDashboard userRole={userRole} onLogout={handleLogout} />
      case 'Super User':
        return <SuperUserDashboard userRole={userRole} onLogout={handleLogout} />
      default:
        return <AdminDashboard userRole={userRole} onLogout={handleLogout} />
    }
  }

  // ⏳ Loading state
  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        } />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={
          isAuthenticated ? (
            renderDashboard()
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* ROOT */}
        <Route path="/" element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } />

      </Routes>
    </Router>
  )
}

export default App