import { useState, useEffect } from "react"
import UserForm from "./components/UserForm"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"
import { ToastProvider, useToast } from "./context/ToastContext"
import { host } from "./host"
import { LogOut, LayoutDashboard, UserCheck, ShieldAlert } from "lucide-react"

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

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("form")
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const { showToast } = useToast()

  // Load auth state from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    const savedToken = localStorage.getItem("token")
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setCurrentPage("dashboard")
      } catch (err) {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }
  }, [])

  const handleAdminLogin = (success: boolean, loggedInUser: { username: string; role: string } | null) => {
    if (success && loggedInUser) {
      setUser(loggedInUser)
      setCurrentPage("dashboard")
    } else {
      setUser(null)
    }
  }

  const handleLogout = async () => {
    try {
      // Call backend logout helper (optional, doesn't require token check since we just clear local state anyway)
      await fetch(`${host}/api/auth/logout`, { method: "POST" })
    } catch (err) {
      console.warn("Backend logout connection failed, clearing local session anyway.")
    }
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setCurrentPage("form")
    showToast("Logged out successfully", "info")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🩸</span>
              <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">UCSPyay Blood Donation</h1>
                <p className="text-xs text-slate-400">Save Lives, Donate Blood</p>
              </div>
            </div>

            <nav className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage("form")}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  currentPage === "form"
                    ? "bg-red-50 text-red-600"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                Donate
              </button>
              
              {!user ? (
                <button
                  onClick={() => setCurrentPage("login")}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    currentPage === "login"
                      ? "bg-red-50 text-red-600"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Admin Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                      currentPage === "dashboard"
                        ? "bg-red-50 text-red-600"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>

                  {/* User Role Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
                    {user.role === "owner" ? (
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-slate-700 capitalize">
                      {user.username} ({user.role})
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        {currentPage === "form" && <UserForm />}
        {currentPage === "login" && !user && <AdminLogin onLogin={handleAdminLogin} />}
        {currentPage === "dashboard" && user && (
          <AdminDashboard userRole={user.role} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="container mx-auto px-4 md:px-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} UCSPyay Blood Donation Center. Built for the community.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
