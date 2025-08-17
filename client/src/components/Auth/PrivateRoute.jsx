// src/components/Auth/PrivateRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'  // adjust relative path

export default function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}