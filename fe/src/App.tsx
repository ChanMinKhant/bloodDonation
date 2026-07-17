import { useState, useEffect } from "react"
import UserForm from "./components/UserForm"
import AdminLogin from "./components/AdminLogin"
import AdminDashboard from "./components/AdminDashboard"
import { ToastProvider, useToast } from "./context/ToastContext"
import { host } from "./host"
import { LogOut, LayoutDashboard, Shield, Heart } from "lucide-react"

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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo / Branding */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentPage("form")}>
              <div className="h-9 w-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100 shadow-sm shrink-0">
                <Heart className="h-4.5 w-4.5 fill-red-500 stroke-red-500" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">
                  UCSPyay <span className="text-red-600 font-extrabold">Blood</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Donation Center</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <button
                onClick={() => setCurrentPage("form")}
                className={`text-xs font-bold uppercase tracking-wider transition-colors py-2 ${
                  currentPage === "form"
                    ? "text-red-650"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Donate
              </button>
              
              {!user ? (
                <button
                  onClick={() => setCurrentPage("login")}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors py-2 ${
                    currentPage === "login"
                      ? "text-red-655"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Admin Portal
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className={`text-xs font-bold uppercase tracking-wider transition-colors py-2 flex items-center gap-1.5 ${
                      currentPage === "dashboard"
                        ? "text-red-650"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </button>

                  <div className="h-4 w-px bg-slate-200"></div>

                  {/* Profile Widget */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-100 border border-slate-200 text-slate-700 font-black rounded-full flex items-center justify-center text-xs shadow-sm uppercase">
                      {user.username[0]}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-bold text-slate-800 leading-none">{user.username}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-0.5">
                        <Shield className="h-2.5 w-2.5" />
                        {user.role}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent rounded-lg transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
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
