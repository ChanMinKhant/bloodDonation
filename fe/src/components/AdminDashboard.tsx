import React, { useState, useMemo, useEffect } from "react"
import type { DonationRecord } from "../App"
import { host } from "../host"
import { useToast } from "../context/ToastContext"
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Download, 
  UserPlus, 
  Shield, 
  Check, 
  X, 
  Users, 
  Database,
  PlusCircle
} from "lucide-react"

interface AdminDashboardProps {
  userRole: string
}

interface AdminUser {
  _id: string
  username: string
  role: string
}

type Tab = "donations" | "users"

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userRole }) => {
  const [records, setRecords] = useState<DonationRecord[]>([])
  const [activeTab, setActiveTab] = useState<Tab>("donations")
  const { showToast } = useToast()

  // Search, Pagination, Filtering, Sorting States
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    bloodType: "",
    donationStatus: "",
    studentType: "",
    dateRange: "",
  })
  
  const [sortField, setSortField] = useState<keyof DonationRecord | "">("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10;

  // Standard Editing Modal States (for Owner)
  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<DonationRecord | null>(null)

  // Inline Editing Date State (for Admins / Owners)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState("")

  // User Management State (Owner only)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [newAdminCreds, setNewAdminCreds] = useState({ username: "", password: "" })
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // Auth fetch helper
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token")
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      "Authorization": token ? `Bearer ${token}` : "",
    }
    return fetch(url, { ...options, headers })
  }

  // Fetch donation records
  const fetchRecords = async () => {
    try {
      const res = await fetchWithAuth(`${host}/api/donations`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data)
      } else {
        showToast("Failed to fetch donation records", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error connecting to server", "error")
    }
  }

  // Fetch admin users (Owner only)
  const fetchUsers = async () => {
    if (userRole !== "owner") return
    try {
      const res = await fetchWithAuth(`${host}/api/users`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRecords()
    if (userRole === "owner") {
      fetchUsers()
    }
  }, [userRole])

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search term
      const matchesSearch =
        !searchTerm ||
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.phone.includes(searchTerm) ||
        record.bloodType.toLowerCase().includes(searchTerm.toLowerCase())

      // Blood type
      const matchesBloodType = !filters.bloodType ||
        (filters.bloodType === "A" && ["A+", "A-", "A?", "A"].includes(record.bloodType)) ||
        (filters.bloodType === "B" && ["B+", "B-", "B?", "B"].includes(record.bloodType)) ||
        (filters.bloodType === "AB" && ["AB+", "AB-", "AB?", "AB"].includes(record.bloodType)) ||
        (filters.bloodType === "O" && ["O+", "O-", "O?", "O"].includes(record.bloodType)) ||
        record.bloodType === filters.bloodType

      // Willingness
      const matchesWillingness =
        !filters.donationStatus ||
        (filters.donationStatus === "willing" && record.willingToDonate) ||
        (filters.donationStatus === "not-willing" && !record.willingToDonate)

      // Student type
      const matchesStudentType = !filters.studentType || record.studentType === filters.studentType

      // Date range filter
      const matchesDateRange =
        !filters.dateRange ||
        (() => {
          if (record.lastDonationDate === "Never donated") {
            return filters.dateRange === "long-ago" || filters.dateRange === "eligible"
          }
          const lastDonation = new Date(record.lastDonationDate)
          const now = new Date()
          const daysDiff = Math.floor((now.getTime() - lastDonation.getTime()) / (1000 * 60 * 60 * 24))

          switch (filters.dateRange) {
            case "recent":
              return daysDiff <= 90
            case "eligible":
              return daysDiff >= 90
            case "long-ago":
              return daysDiff >= 365
            default:
              return true
          }
        })()

      return (
        matchesSearch &&
        matchesBloodType &&
        matchesWillingness &&
        matchesStudentType &&
        matchesDateRange
      )
    })
  }, [records, searchTerm, filters])

  // Sort records
  const sortedRecords = useMemo(() => {
    if (!sortField) return filteredRecords

    return [...filteredRecords].sort((a, b) => {
      if (sortField === "lastDonationDate") {
        const aDate = a.lastDonationDate === "Never donated" ? new Date(0) : new Date(a.lastDonationDate)
        const bDate = b.lastDonationDate === "Never donated" ? new Date(0) : new Date(b.lastDonationDate)
        return sortDirection === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
      }

      const aVal = a[sortField] ?? ""
      const bVal = b[sortField] ?? ""

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal)
      } else if (typeof aVal === "boolean") {
        const aNum = aVal ? 1 : 0
        const bNum = (bVal as boolean) ? 1 : 0
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum
      } else {
        return sortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number)
      }
    })
  }, [filteredRecords, sortField, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage)
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedRecords, currentPage, itemsPerPage])

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, sortField])

  const handleSort = (field: keyof DonationRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = records.length
    const willing = records.filter((r) => r.willingToDonate).length
    const students = records.filter((r) => r.studentType === "student").length
    const nonStudents = total - students
    return { total, willing, students, nonStudents }
  }, [records])

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({
      bloodType: "",
      donationStatus: "",
      studentType: "",
      dateRange: "",
    })
    setSortField("")
  }

  // API Call: Save inline edited date
  const handleSaveInlineDate = async (id: string) => {
    if (!inlineEditValue) return

    try {
      const res = await fetchWithAuth(`${host}/api/donations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ lastDonationDate: inlineEditValue })
      })

      if (res.ok) {
        const updated = await res.json()
        setRecords((prev) => prev.map((r) => (r._id === id ? updated : r)))
        showToast("Last donation date updated successfully", "success")
        setInlineEditId(null)
      } else {
        const errData = await res.json()
        const errMsg = errData.message || "Failed to update date"
        showToast(errMsg, "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error updating date", "error")
    }
  }

  // standard Edit Record (Owner only)
  const handleEdit = (record: DonationRecord) => {
    setEditingRecord({ ...record })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return
    try {
      const res = await fetchWithAuth(`${host}/api/donations/${editingRecord._id}`, {
        method: "PUT",
        body: JSON.stringify(editingRecord)
      })

      if (res.ok) {
        const updated = await res.json()
        setRecords((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
        showToast("Donation record updated successfully", "success")
        setShowEditModal(false)
        setEditingRecord(null)
      } else {
        const errData = await res.json()
        showToast(errData.message || "Failed to update record", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error updating record", "error")
    }
  }

  // Delete Record (Owner only)
  const handleDelete = (record: DonationRecord) => {
    setRecordToDelete(record)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return
    try {
      const res = await fetchWithAuth(`${host}/api/donations/${recordToDelete._id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r._id !== recordToDelete._id))
        showToast("Donation record deleted successfully", "success")
        setShowDeleteModal(false)
        setRecordToDelete(null)
      } else {
        showToast("Failed to delete record", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error deleting record", "error")
    }
  }

  // Export to CSV
  const handleExportCSV = async () => {
    if (userRole !== "owner") {
      showToast("Unauthorized for CSV export", "error")
      return
    }

    try {
      const res = await fetchWithAuth(`${host}/api/donations/export`)
      if (res.ok) {
        const csvContent = await res.text()
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `blood-donations-${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast("CSV exported successfully", "success")
      } else {
        showToast("Failed to export CSV", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error downloading CSV", "error")
    }
  }

  // Create Admin User (Owner only)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminCreds.username || !newAdminCreds.password) {
      showToast("Please fill in all user credentials", "error")
      return
    }

    setIsCreatingUser(true)
    try {
      const res = await fetchWithAuth(`${host}/api/users`, {
        method: "POST",
        body: JSON.stringify(newAdminCreds)
      })

      const data = await res.json()
      if (res.ok) {
        setUsers((prev) => [...prev, data.user])
        setNewAdminCreds({ username: "", password: "" })
        showToast(`Admin user "${data.user.username}" created successfully`, "success")
      } else {
        showToast(data.message || "Failed to create Admin user", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error creating user", "error")
    } finally {
      setIsCreatingUser(false)
    }
  }

  // Delete Admin User (Owner only)
  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${host}/api/users/${id}`, {
        method: "DELETE"
      })

      const data = await res.json()
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== id))
        showToast("Admin account deleted successfully", "success")
      } else {
        showToast(data.message || "Failed to delete user", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Error deleting user", "error")
    }
  }

  return (
    <div className="space-y-6">
      {/* Upper Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Donors", value: stats.total, color: "border-l-red-500", desc: "Registered donors" },
          { label: "Active & Willing", value: stats.willing, color: "border-l-emerald-500", desc: "Willing to donate" },
          { label: "Students", value: stats.students, color: "border-l-blue-500", desc: "University students" },
          { label: "Non-Students", value: stats.nonStudents, color: "border-l-indigo-500", desc: "External contributors" }
        ].map((s, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-2xl border border-slate-100 border-l-4 ${s.color} shadow-sm`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Tab Switching & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("donations")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
              activeTab === "donations"
                ? "bg-red-600 text-white shadow-md shadow-red-100"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Database className="h-4 w-4" />
            Donations Database
          </button>
          
          {userRole === "owner" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                activeTab === "users"
                  ? "bg-red-600 text-white shadow-md shadow-red-100"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4" />
              Admin Accounts
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeTab === "donations" && (
            <>
              <button
                onClick={clearFilters}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
              
              {userRole === "owner" && (
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {activeTab === "donations" ? (
        <div className="space-y-4">
          {/* Search and Filters Layout */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by name, phone, or blood type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Blood Type Filter */}
                <select
                  value={filters.bloodType}
                  onChange={(e) => setFilters({ ...filters, bloodType: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">All Blood Types</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

                {/* Willingness Filter */}
                <select
                  value={filters.donationStatus}
                  onChange={(e) => setFilters({ ...filters, donationStatus: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="willing">Willing to Donate</option>
                  <option value="not-willing">Not Willing</option>
                </select>

                {/* Student Type Filter */}
                <select
                  value={filters.studentType}
                  onChange={(e) => setFilters({ ...filters, studentType: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="student">Student</option>
                  <option value="not-student">Non-Student</option>
                </select>

                {/* Date range filter */}
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">All Donation Dates</option>
                  <option value="recent">Recent (≤ 3 months)</option>
                  <option value="eligible">Eligible (≥ 3 months)</option>
                  <option value="long-ago">Long Ago (≥ 1 year)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">No.</th>
                    <th 
                      onClick={() => handleSort("name")}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none"
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                    <th 
                      onClick={() => handleSort("bloodType")}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none"
                    >
                      <div className="flex items-center gap-1">
                        Blood Type
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("age")}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none"
                    >
                      <div className="flex items-center gap-1">
                        Age
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("willingToDonate")}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none"
                    >
                      <div className="flex items-center gap-1">
                        Willing
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("lastDonationDate")}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none w-56"
                    >
                      <div className="flex items-center gap-1">
                        Last Donation Date
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Details / Address</th>
                    {userRole === "owner" && (
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-10 text-center text-slate-400">
                        No records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((record, index) => {
                      const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1
                      const isEditingInline = inlineEditId === record._id

                      return (
                        <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-slate-500 font-medium">{absoluteIndex}</td>
                          <td className="px-5 py-4 font-semibold text-slate-800">{record.name}</td>
                          <td className="px-5 py-4 text-slate-600 font-medium">{record.phone}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                              {record.bloodType}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{record.age}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                record.willingToDonate
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-slate-50 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {record.willingToDonate ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {isEditingInline ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="date"
                                  value={inlineEditValue}
                                  onChange={(e) => setInlineEditValue(e.target.value)}
                                  className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-red-500"
                                />
                                <button
                                  onClick={() => handleSaveInlineDate(record._id)}
                                  className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                  title="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setInlineEditId(null)}
                                  className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between group/date gap-2">
                                <span className="text-slate-600 font-medium">
                                  {record.lastDonationDate === "Never donated"
                                    ? "Never donated"
                                    : new Date(record.lastDonationDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric"
                                      })}
                                </span>
                                {/* Edit trigger visible on hover or mobile */}
                                <button
                                  onClick={() => {
                                    setInlineEditId(record._id)
                                    setInlineEditValue(
                                      record.lastDonationDate === "Never donated"
                                        ? ""
                                        : record.lastDonationDate
                                    )
                                  }}
                                  className="opacity-0 group-hover/date:opacity-100 focus:opacity-100 p-1 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                                  title="Edit Donation Date"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                record.studentType === "student"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-slate-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {record.studentType === "student" ? "Student" : "Non-Student"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {record.studentType === "student" ? (
                              <span className="font-medium text-xs">
                                Year {record.year}
                                {record.section && ` (Section ${record.section})`}
                              </span>
                            ) : (
                              <span className="max-w-xs truncate block text-xs" title={record.address}>
                                {record.address || "-"}
                              </span>
                            )}
                          </td>
                          {userRole === "owner" && (
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEdit(record)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors"
                                  title="Edit full record"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(record)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-medium">
                  Showing <span className="font-semibold text-slate-600">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-semibold text-slate-600">
                    {Math.min(currentPage * itemsPerPage, sortedRecords.length)}
                  </span>{" "}
                  of <span className="font-semibold text-slate-600">{sortedRecords.length}</span> records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-8 w-8 text-xs font-bold rounded-lg border transition-all ${
                        currentPage === i + 1
                          ? "bg-red-600 border-red-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* User Management Panel (Owner only) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create User Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-bold text-slate-800">Add Admin Account</h3>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={newAdminCreds.username}
                  onChange={(e) => setNewAdminCreds({ ...newAdminCreds, username: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={newAdminCreds.password}
                  onChange={(e) => setNewAdminCreds({ ...newAdminCreds, password: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingUser}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-red-100 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {isCreatingUser ? "Adding..." : "Add Admin"}
              </button>
            </form>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-600" />
              <h3 className="text-lg font-bold text-slate-800">System Users</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-400 font-semibold border-b border-slate-100">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{u.username}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            u.role === "owner"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== "owner" ? (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                            title="Delete Admin"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic pr-2">System Owner</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* standard Edit Modal (Owner only) */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-red-600" />
                  Edit Donation Record
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingRecord(null)
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                    <input
                      type="text"
                      value={editingRecord.name}
                      onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editingRecord.phone}
                      onChange={(e) => setEditingRecord({ ...editingRecord, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Type</label>
                    <select
                      value={editingRecord.bloodType}
                      onChange={(e) => setEditingRecord({ ...editingRecord, bloodType: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Age</label>
                    <input
                      type="number"
                      min="18"
                      max="65"
                      value={editingRecord.age}
                      onChange={(e) => setEditingRecord({ ...editingRecord, age: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="willingToDonate"
                    checked={editingRecord.willingToDonate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, willingToDonate: e.target.checked })}
                    className="h-4.5 w-4.5 text-red-600 border-slate-200 rounded-lg focus:ring-red-500"
                  />
                  <label htmlFor="willingToDonate" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Willing to donate blood
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Donation Date</label>
                  <input
                    type="date"
                    value={editingRecord.lastDonationDate === "Never donated" ? "" : editingRecord.lastDonationDate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, lastDonationDate: e.target.value || "Never donated" })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        name="editStudentType"
                        value="student"
                        checked={editingRecord.studentType === "student"}
                        onChange={(e) => setEditingRecord({ ...editingRecord, studentType: e.target.value as "student" | "not-student" })}
                        className="text-red-600 focus:ring-red-500"
                      />
                      Student
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        name="editStudentType"
                        value="not-student"
                        checked={editingRecord.studentType === "not-student"}
                        onChange={(e) => setEditingRecord({ ...editingRecord, studentType: e.target.value as "student" | "not-student" })}
                        className="text-red-600 focus:ring-red-500"
                      />
                      Not a Student
                    </label>
                  </div>
                </div>

                {editingRecord.studentType === "student" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                      <select
                        value={editingRecord.year || ""}
                        onChange={(e) => setEditingRecord({ ...editingRecord, year: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white"
                      >
                        <option value="">Select Year</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section</label>
                      <select
                        value={editingRecord.section || ""}
                        onChange={(e) => setEditingRecord({ ...editingRecord, section: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white"
                      >
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </div>
                )}

                {editingRecord.studentType === "not-student" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                    <textarea
                      value={editingRecord.address || ""}
                      onChange={(e) => setEditingRecord({ ...editingRecord, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                      placeholder="Enter street, city, address"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingRecord(null)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-100"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Owner only) */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-rose-50 text-rose-600 h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">Confirm Deletion</h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete the donor registration for <strong>{recordToDelete.name}</strong>? This action is permanent and cannot be undone.
              </p>

              <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setRecordToDelete(null)
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
