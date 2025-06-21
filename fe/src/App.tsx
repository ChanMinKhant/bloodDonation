"use client"

import { useState } from "react"
import UserForm from "./components/UserForm"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"

export interface DonationRecord {
  _id: string
  name: string
  phone: string
  bloodType: string
  age: number
  willingToDonate: boolean
  lastDonationDate: string
  studentType: "student" | "not-student"
  year?: number
  section?: string
  address?: string
  submittedAt: string
}

type Page = "form" | "login" | "dashboard"

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("form")
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)


  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setIsAdminLoggedIn(true)
      setCurrentPage("dashboard")
    }
  }

  const handleLogout = () => {
    setIsAdminLoggedIn(false)
    setCurrentPage("form")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">🩸 UCSPyay Blood Donation Center</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentPage("form")}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === "form" ? "bg-red-700 text-white" : "text-red-100 hover:text-white hover:bg-red-700"
                }`}
              >
                Donate
              </button>
              {!isAdminLoggedIn ? (
                <button
                  onClick={() => setCurrentPage("login")}
                  className={`px-4 py-2 rounded transition-colors ${
                    currentPage === "login" ? "bg-red-700 text-white" : "text-red-100 hover:text-white hover:bg-red-700"
                  }`}
                >
                  Admin Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className={`px-4 py-2 rounded transition-colors ${
                      currentPage === "dashboard"
                        ? "bg-red-700 text-white"
                        : "text-red-100 hover:text-white hover:bg-red-700"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded text-red-100 hover:text-white hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentPage === "form" && <UserForm />}
        {currentPage === "login" && !isAdminLoggedIn && <AdminLogin onLogin={handleAdminLogin} />}
        {currentPage === "dashboard" && isAdminLoggedIn && (
          <AdminDashboard />
        )}
      </main>
    </div>
  )
}

export default App
