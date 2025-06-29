import React, { useState, useMemo, useEffect } from "react"
import type { DonationRecord } from "../App"
import {host} from "../host"

const AdminDashboard: React.FC<{}> = () => {
  const [records, setRecords] = useState<DonationRecord[]>( [])
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    bloodType: "",
    donationStatus: "",
    studentType: "",
    year: "",
    section: "",
    dateRange: "",
  })

  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<DonationRecord | null>(null)

  // Fetch records from backend
  useEffect(() => {
    fetch(`${host}/get`)
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Failed to fetch records:", err))
  }, [])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.phone.includes(searchTerm) ||
        record.bloodType.toLowerCase().includes(searchTerm.toLowerCase())

      // Blood type filter
      const matchesBloodType = !filters.bloodType ||
        (filters.bloodType === "A" && ["A+", "A-", "A?", "A"].includes(record.bloodType)) ||
        (filters.bloodType === "B" && ["B+", "B-", "B?", "B"].includes(record.bloodType)) ||
        (filters.bloodType === "AB" && ["AB+", "AB-", "AB?", "AB"].includes(record.bloodType)) ||
        (filters.bloodType === "O" && ["O+", "O-", "O?", "O"].includes(record.bloodType)) ||
        record.bloodType === filters.bloodType

      // Donation status filter
      const matchesDonationStatus =
        !filters.donationStatus ||
        (filters.donationStatus === "willing" && record.willingToDonate) ||
        (filters.donationStatus === "not-willing" && !record.willingToDonate)

      // Student type filter
      const matchesStudentType = !filters.studentType || record.studentType === filters.studentType

      // Year filter (only for students)
      const matchesYear =
        !filters.year || (record.studentType === "student" && record.year?.toString() === filters.year)

      // Section filter (only for students)
      const matchesSection =
        !filters.section || (record.studentType === "student" && record.section === filters.section)

      // Date range filter
      const matchesDateRange =
        !filters.dateRange ||
        (() => {
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
        matchesDonationStatus &&
        matchesStudentType &&
        matchesYear &&
        matchesSection &&
        matchesDateRange
      )
    })
  }, [records, searchTerm, filters])

  const stats = useMemo(() => {
    const total = records.length
    const willing = records.filter((r) => r.willingToDonate).length
    const students = records.filter((r) => r.studentType === "student").length
    const bloodTypes = records.reduce(
      (acc, record) => {
        acc[record.bloodType] = (acc[record.bloodType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return { total, willing, students, bloodTypes }
  }, [records])

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({
      bloodType: "",
      donationStatus: "",
      studentType: "",
      year: "",
      section: "",
      dateRange: "",
    })
  }

  const handleEdit = (record: DonationRecord) => {
    setEditingRecord({ ...record })
    setShowEditModal(true)
  }

  // Update local record immediately after editing
  useEffect(() => {
    if (!showEditModal && editingRecord) {
      setRecords((prev) =>
        prev.map((r) => (r._id === editingRecord._id ? editingRecord : r))
      )
    }
    // Only run when modal closes after editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditModal])

  const handleDelete = (record: DonationRecord) => {
    setRecordToDelete(record)
    setShowDeleteModal(true)
  }

  // Update record
  const handleSaveEdit = async () => {
    if (editingRecord) {
      try {
        const res = await fetch(`${host}/update/${editingRecord._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingRecord),
        })
        // Update UI immediately for responsiveness
        if (res.ok) {
          const updated = await res.json()
          setRecords((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
          setShowEditModal(false)
          setEditingRecord(null)
        } else {
          // If update failed, revert UI change
          setRecords((prev) => prev.map((r) => (r._id === editingRecord._id ? editingRecord : r)))
          alert("Failed to update record.")
        }
        if (res.ok) {
          const updated = await res.json()
          setRecords((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
          setShowEditModal(false)
          setEditingRecord(null)
        } else {
          alert("Failed to update record.")
        }
      } catch (err) {
        alert("Error updating record.")
      }
    }
  }

  // Delete record
  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        const res = await fetch(`${host}/delete/${recordToDelete._id}`, {
          method: "DELETE",
        })
        if (res.ok) {
          setRecords((prev) => prev.filter((r) => r._id !== recordToDelete._id))
          setShowDeleteModal(false)
          setRecordToDelete(null)
        } else {
          alert("Failed to delete record.")
        }
      } catch (err) {
        alert("Error deleting record.")
      }
    }
  }

  const handleEditChange = (field: string, value: any) => {
    if (editingRecord) {
      setEditingRecord({ ...editingRecord, [field]: value })
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Blood Type",
      "Age",
      "Willing to Donate",
      "Last Donation Date",
      "Student Type",
      "Year",
      "Section",
      "Address",
      "Submitted At",
    ]

    const csvData = filteredRecords.map((record) => [
      record.name,
      record.phone,
      record.bloodType,
      record.age,
      record.willingToDonate ? "Yes" : "No",
      record.lastDonationDate,
      record.studentType === "student" ? "Student" : "Non-Student",
      record.year || "",
      record.section || "",
      record.address || "",
      new Date(record.submittedAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `blood-donation-records-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
        <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-medium">
            Total: {stats.total}
          </span>
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded text-xs font-medium">
            Willing: {stats.willing}
          </span>
          {/* <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded text-xs font-medium">
            Students: {stats.students}
          </span> */}
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-medium">
            Filtered: {filteredRecords.length}
          </span>
        </div>
          </div>
          <div className="flex gap-2">
        <button
          onClick={clearFilters}
          className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
        >
          Clear Filters
        </button>
        <button
          onClick={exportToCSV}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
        >
          📊 Export CSV
        </button>
          </div>
        </div>

        {/* Search and Filters Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
          <input
        type="text"
        placeholder="Search by name, phone, or blood type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
          />

          {/* Filters Dropdown */}
          <details className="w-full md:w-auto">
        <summary className="cursor-pointer px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium select-none">
          Filters
        </summary>
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col gap-2 min-w-[220px] z-10">
          <select
            value={filters.bloodType}
            onChange={(e) => setFilters({ ...filters, bloodType: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Blood Types</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="A?">A?</option>
            <option value="A">A (All)</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="B?">B?</option>
            <option value="B">B (All)</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="AB?">AB?</option>
            <option value="AB">AB (All)</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="O?">O?</option>
            <option value="O">O (All)</option>
          </select>

          <select
            value={filters.donationStatus}
            onChange={(e) => setFilters({ ...filters, donationStatus: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Donation Status</option>
            <option value="willing">Willing to Donate</option>
            <option value="not-willing">Not Willing</option>
          </select>

          <select
            value={filters.studentType}
            onChange={(e) => setFilters({ ...filters, studentType: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Types</option>
            <option value="student">Students</option>
            <option value="not-student">Non-Students</option>
          </select>

          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
          </select>

          <select
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All Dates</option>
            <option value="recent">Recent (&lt; 3 months)</option>
            <option value="eligible">Eligible (&gt; 3 months)</option>
            <option value="long-ago">Long ago (&gt; 1 year)</option>
          </select>
        </div>
          </details>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Willing
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Donation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No records found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{index + 1}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {record.bloodType}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.age}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.willingToDonate ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.willingToDonate ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.lastDonationDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.studentType === "student" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.studentType === "student" ? "Student" : "Non-Student"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.studentType === "student" ? (
                        <div>
                          Year {record.year}
                          {record.section && `, Section ${record.section}`}
                        </div>
                      ) : (
                        <div className="max-w-xs truncate" title={record.address}>
                          {record.address}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Donation Record</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editingRecord.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editingRecord.phone}
                      onChange={(e) => handleEditChange("phone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                    <select
                      value={editingRecord.bloodType}
                      onChange={(e) => handleEditChange("bloodType", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      min="18"
                      max="65"
                      value={editingRecord.age}
                      onChange={(e) => handleEditChange("age", Number.parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingRecord.willingToDonate}
                      onChange={(e) => handleEditChange("willingToDonate", e.target.checked)}
                      className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Willing to donate blood</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date</label>
                  <input
                    type="date"
                    value={editingRecord.lastDonationDate === "Never donated" ? "" : editingRecord.lastDonationDate}
                    onChange={(e) => handleEditChange("lastDonationDate", e.target.value || "Never donated")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editStudentType"
                        value="student"
                        checked={editingRecord.studentType === "student"}
                        onChange={(e) => handleEditChange("studentType", e.target.value)}
                        className="mr-2 text-red-600"
                      />
                      Student
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editStudentType"
                        value="not-student"
                        checked={editingRecord.studentType === "not-student"}
                        onChange={(e) => handleEditChange("studentType", e.target.value)}
                        className="mr-2 text-red-600"
                      />
                      Not a Student
                    </label>
                  </div>
                </div>

                {editingRecord.studentType === "student" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <select
                        value={editingRecord.year || ""}
                        onChange={(e) => handleEditChange("year", Number.parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                      <select
                        value={editingRecord.section || ""}
                        onChange={(e) => handleEditChange("section", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={editingRecord.address || ""}
                      onChange={(e) => handleEditChange("address", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingRecord(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-red-600 text-2xl mr-3">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the donation record for <strong>{recordToDelete.name}</strong>? This
                action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setRecordToDelete(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
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
