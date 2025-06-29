import type React from "react"
import { useState } from "react"
import {host} from "../host"



const UserForm: React.FC<{}> = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bloodType: "",
    bloodRh: "+",
    age: "",
    willingToDonate: false,
    hasRecentlyDonated: false, // Add this new field
    lastDonationDate: "",
    studentType: "student" as "student" | "not-student",
    year: "",
    section: "",
    address: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bloodTypes = ["A", "B", "AB", "O"]
  const years = [1, 2, 3, 4, 5]
  const sections = ["A", "B", "C"]
  console.log(host)
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.bloodType) newErrors.bloodType = "Blood type is required"
    if (!formData.age || Number.parseInt(formData.age) < 18 || Number.parseInt(formData.age) > 65) {
      newErrors.age = "Age must be between 18 and 65"
    }
    if (formData.hasRecentlyDonated && !formData.lastDonationDate) {
      newErrors.lastDonationDate = "Last donation date is required"
    }

    if (formData.studentType === "student" && !formData.year) {
      newErrors.year = "Year is required for students"
    }

    if (formData.studentType === "not-student" && !formData.address.trim()) {
      newErrors.address = "Address is required for non-students"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (!validateForm()) return

    const record = {
        name: formData.name,
        phone: formData.phone,
        bloodType: `${formData.bloodType}${formData.bloodRh}`,
        age: Number.parseInt(formData.age),
        willingToDonate: formData.willingToDonate,
        lastDonationDate: formData.hasRecentlyDonated ? formData.lastDonationDate : "Never donated",
        studentType: formData.studentType,
        ...(formData.studentType === "student"
            ? {
                    year: Number.parseInt(formData.year),
                    section: formData.section || undefined,
                }
            : { address: formData.address }),
    }

    try {
        await fetch(`${host}/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
        })
        setIsSubmitted(true)
        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false)
            setFormData({
                name: "",
                phone: "",
                bloodType: "",
                bloodRh: "+",
                age: "",
                willingToDonate: false,
                hasRecentlyDonated: false,
                lastDonationDate: "",
                studentType: "student",
                year: "",
                section: "",
                address: "",
            })
        }, 3000)
        setIsSubmitting(false)
    } catch (error) {
        setErrors({ submit: "Failed to submit. Please try again." })
        setIsSubmitting(false)
    }
}

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
          <p className="text-green-700">Your donation information has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Blood Donation Registration</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your phone number"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Blood Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type *</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.bloodType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Blood Type</option>
                  {bloodTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bloodRh"
                    value="+"
                    checked={formData.bloodRh === "+"}
                    onChange={(e) => setFormData({ ...formData, bloodRh: e.target.value })}
                    className="mr-2 text-red-600"
                  />
                  Positive (+)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bloodRh"
                    value="-"
                    checked={formData.bloodRh === "-"}
                    onChange={(e) => setFormData({ ...formData, bloodRh: e.target.value })}
                    className="mr-2 text-red-600"
                  />
                  Negative (-)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bloodRh"
                    value="?"
                    checked={formData.bloodRh === "unknown"}
                    onChange={(e) => setFormData({ ...formData, bloodRh: e.target.value })}
                    className="mr-2 text-red-600"
                  />
                  Unknown
                </label>
              </div>
            </div>
            {errors.bloodType && <p className="text-red-500 text-sm mt-1">{errors.bloodType}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
            <input
              type="number"
              min="18"
              max="65"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.age ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your age"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Willing to Donate */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.willingToDonate}
                onChange={(e) => setFormData({ ...formData, willingToDonate: e.target.checked })}
                className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">I am willing to donate blood</span>
            </label>
          </div>

          {/* Recent Donation Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Have you donated blood recently? *</label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasRecentlyDonated"
                  value="yes"
                  checked={formData.hasRecentlyDonated === true}
                  onChange={() => setFormData({ ...formData, hasRecentlyDonated: true })}
                  className="mr-2 text-red-600"
                />
                Yes, I have donated recently
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasRecentlyDonated"
                  value="no"
                  checked={formData.hasRecentlyDonated === false}
                  onChange={() => setFormData({ ...formData, hasRecentlyDonated: false, lastDonationDate: "" })}
                  className="mr-2 text-red-600"
                />
                No, I haven't donated recently
              </label>
            </div>
          </div>

          {/* Last Donation Date - Only show if recently donated */}
          {formData.hasRecentlyDonated && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Donation Date *</label>
              <input
                type="date"
                value={formData.lastDonationDate}
                onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.lastDonationDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.lastDonationDate && <p className="text-red-500 text-sm mt-1">{errors.lastDonationDate}</p>}
            </div>
          )}

          {/* Student Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Status *</label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="studentType"
                  value="student"
                  checked={formData.studentType === "student"}
                  onChange={(e) =>
                    setFormData({ ...formData, studentType: e.target.value as "student" | "not-student" })
                  }
                  className="mr-2 text-red-600"
                />
                Student
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="studentType"
                  value="not-student"
                  checked={formData.studentType === "not-student"}
                  onChange={(e) =>
                    setFormData({ ...formData, studentType: e.target.value as "student" | "not-student" })
                  }
                  className="mr-2 text-red-600"
                />
                Not a Student
              </label>
            </div>
          </div>

          {/* Student Fields */}
          {formData.studentType === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.year ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section (Optional)</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Non-Student Fields */}
          {formData.studentType === "not-student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          )}

          {/* Submit Button */}
            <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            >
            {isSubmitting ? "Submitting, please wait..." : "Submit Registration"}
            </button>
        </form>
      </div>
    </div>
  )
}

export default UserForm
