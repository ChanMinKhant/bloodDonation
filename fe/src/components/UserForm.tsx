import type React from "react"
import { useState } from "react"
import { host } from "../host"
import { useToast } from "../context/ToastContext"
import { CheckCircle2, Heart, Sparkles, Clock, Check } from "lucide-react"

const UserForm: React.FC<{}> = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bloodType: "",
    bloodRh: "+",
    age: "",
    willingToDonate: false,
    hasRecentlyDonated: false,
    lastDonationDate: "",
    studentType: "student" as "student" | "not-student",
    year: "",
    section: "",
    address: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const bloodTypes = ["A", "B", "AB", "O"]
  const years = [1, 2, 3, 4, 5]
  const sections = ["A", "B", "C"]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Full name is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.bloodType) newErrors.bloodType = "Blood type is required"
    
    const parsedAge = Number.parseInt(formData.age)
    if (!formData.age || isNaN(parsedAge) || parsedAge < 18 || parsedAge > 65) {
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
    if (!validateForm()) {
      showToast("Please correct the validation errors in the form", "error")
      return
    }

    setIsSubmitting(true)
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
      const res = await fetch(`${host}/api/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      })

      if (res.ok) {
        setIsSubmitted(true)
        showToast("Registration submitted successfully. Thank you!", "success")
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
        }, 4000)
      } else {
        const errData = await res.json()
        const errMsg = errData.message || "Failed to submit registration"
        showToast(errMsg, "error")
        setErrors({ submit: errMsg })
      }
    } catch (error) {
      showToast("Failed to connect to the server. Please try again.", "error")
      setErrors({ submit: "Failed to submit. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Hero & Slogans (Professional, clean layout, no cheesy gradients) */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-[11px] font-bold uppercase tracking-wider border border-red-100">
              <Heart className="h-3.5 w-3.5 fill-red-500 stroke-red-500" />
              Community Support
            </div>
            
            {/* Myanmar Slogan Header */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              "သင်လှူဒါန်းတဲ့ သွေးတစ်စက်၊ သူတစ်ပါးအတွက် မျှော်လင့်ချက်"
            </h2>
            
            <p className="text-slate-500 text-sm leading-relaxed">
              သွေးလှူဒါန်းခြင်းသည် လူသားချင်းစာနာမှုအရှိဆုံး အပြုအမူတစ်ခုဖြစ်ပြီး လူတစ်ယောက်၏အသက်ကို ပြန်လည်ဆန်းသစ်ပေးနိုင်ပါသည်။ သင်၏သေးငယ်သောအလှူသည် အခြားသူများအတွက် ကြီးမားသောပြောင်းလဲမှု ဖြစ်စေပါသည်။
            </p>
          </div>

          {/* Core Benefits list with clean SVG checkmarks */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              သွေးလှူခြင်း၏ ကောင်းကျိုးများ
            </h3>
            <ul className="space-y-3">
              {[
                "လူသားတစ်ဦး၏ အသက်ကို ကိုယ်တိုင်ကယ်ဆယ်နိုင်ခြင်း",
                "ခန္ဓာကိုယ်အတွင်း သွေးသစ်ထုတ်လုပ်မှုကို လှုံ့ဆော်ပေးခြင်း",
                "နှလုံးနှင့် သွေးကြောစနစ်ကို ကျန်းမာစေခြင်း",
                "အခမဲ့ အခြေခံကျန်းမာရေး စစ်ဆေးခွင့် ရရှိခြင်း"
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <span className="bg-emerald-50 text-emerald-600 rounded-full p-0.5 shrink-0 mt-0.5 border border-emerald-100">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Micro Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-black text-slate-800 flex items-center justify-center gap-1">
                <Clock className="h-5 w-5 text-red-500" />
                ၁၅ မိနစ်
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">ပျှမ်းမျှ သွေးလှူချိန်</p>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-black text-slate-800 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ၃ ဦး
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">ကယ်တင်နိုင်သောလူဦးရေ</p>
            </div>
          </div>
        </div>

        {/* Right Column: Donation Form Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 transition-all">
          {isSubmitted ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl shadow-sm border border-emerald-100 animate-slide-in">
                ✓
              </div>
              <h2 className="text-2xl font-black text-slate-800">ကျေးဇူးတင်ရှိပါသည်</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                သင်၏ သွေးလှူဒါန်းရန် စာရင်းသွင်းမှု အောင်မြင်ပါသည်။ သွေးလှူဒါန်းရန် လိုအပ်သည့်အချိန်တွင် ဆက်သွယ်ပေးပါမည်။
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-850">သွေးလှူဒါန်းရန် စာရင်းသွင်းရန်</h3>
                <p className="text-slate-400 text-xs mt-1">ကျေးဇူးပြု၍ လိုအပ်သောအချက်အလက်များကို မှန်ကန်စွာဖြည့်စွက်ပေးပါ။</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">အမည် (Full Name) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all text-sm ${
                    errors.name ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="ဦး/ဒေါ် အမည်အပြည့်အစုံ ဖြည့်ပေးပါ"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ဖုန်းနံပါတ် (Phone Number) *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all text-sm ${
                    errors.phone ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="ဆက်သွယ်ရန် ဖုန်းနံပါတ်"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Blood Type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">သွေးအုပ်စု (Blood Type) *</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-full sm:flex-1">
                    <select
                      value={formData.bloodType}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none bg-white text-sm ${
                        errors.bloodType ? "border-red-500" : "border-slate-200"
                      }`}
                    >
                      <option value="">သွေးအုပ်စု ရွေးချယ်ပါ</option>
                      {bloodTypes.map((type) => (
                        <option key={type} value={type}>
                          Type {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 px-2 py-1">
                    {["+", "-", "?"].map((rh) => (
                      <label key={rh} className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="bloodRh"
                          value={rh}
                          checked={formData.bloodRh === rh}
                          onChange={(e) => setFormData({ ...formData, bloodRh: e.target.value })}
                          className="text-red-600 focus:ring-red-500 h-4 w-4 border-slate-350"
                        />
                        {rh === "+" ? "Rh (+)" : rh === "-" ? "Rh (-)" : "မသိပါ"}
                      </label>
                    ))}
                  </div>
                </div>
                {errors.bloodType && <p className="text-red-500 text-xs mt-1">{errors.bloodType}</p>}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">အသက် (Age) *</label>
                <input
                  type="number"
                  min="18"
                  max="65"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all text-sm ${
                    errors.age ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="အလှူရှင် အသက် (၁၈ မှ ၆၅ နှစ်အတွင်း)"
                />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>

              {/* Willing to Donate */}
              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="willingToDonate"
                  checked={formData.willingToDonate}
                  onChange={(e) => setFormData({ ...formData, willingToDonate: e.target.checked })}
                  className="h-4.5 w-4.5 text-red-600 border-slate-350 focus:ring-red-500 rounded-lg"
                />
                <label htmlFor="willingToDonate" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  လိုအပ်ပါက သွေးလာရောက်လှူဒါန်းရန် အဆင်ပြေပါသည်
                </label>
              </div>

              {/* Recent Donation Status */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">မကြာသေးမီက သွေးလှူဒါန်းထားခြင်း ရှိပါသလား။ *</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="hasRecentlyDonated"
                      value="yes"
                      checked={formData.hasRecentlyDonated === true}
                      onChange={() => setFormData({ ...formData, hasRecentlyDonated: true })}
                      className="text-red-600 focus:ring-red-500 h-4 w-4 border-slate-350"
                    />
                    ရှိခဲ့ပါသည်
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="hasRecentlyDonated"
                      value="no"
                      checked={formData.hasRecentlyDonated === false}
                      onChange={() => setFormData({ ...formData, hasRecentlyDonated: false, lastDonationDate: "" })}
                      className="text-red-600 focus:ring-red-500 h-4 w-4 border-slate-350"
                    />
                    မလှူဖူးပါ / မရှိပါ
                  </label>
                </div>
              </div>

              {/* Last Donation Date */}
              {formData.hasRecentlyDonated && (
                <div className="animate-slide-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">နောက်ဆုံးသွေးလှူခဲ့သည့်ရက်စွဲ *</label>
                  <input
                    type="date"
                    value={formData.lastDonationDate}
                    onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all text-sm ${
                      errors.lastDonationDate ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                  {errors.lastDonationDate && <p className="text-red-500 text-xs mt-1">{errors.lastDonationDate}</p>}
                </div>
              )}

              {/* Student Status */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ကျောင်းသား/သူ ဖြစ်ပါသလား။ *</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="studentType"
                      value="student"
                      checked={formData.studentType === "student"}
                      onChange={(e) =>
                        setFormData({ ...formData, studentType: e.target.value as "student" | "not-student" })
                      }
                      className="text-red-600 focus:ring-red-500 h-4 w-4 border-slate-350"
                    />
                    ကျောင်းသား/သူ ဖြစ်ပါသည်
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="studentType"
                      value="not-student"
                      checked={formData.studentType === "not-student"}
                      onChange={(e) =>
                        setFormData({ ...formData, studentType: e.target.value as "student" | "not-student" })
                      }
                      className="text-red-600 focus:ring-red-500 h-4 w-4 border-slate-350"
                    />
                    အခြား / ကျောင်းသားမဟုတ်ပါ
                  </label>
                </div>
              </div>

              {/* Student Fields */}
              {formData.studentType === "student" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">တက်ရောက်နေသည့်နှစ် (Year) *</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none bg-white text-sm ${
                        errors.year ? "border-red-500" : "border-slate-200"
                      }`}
                    >
                      <option value="">တက်ရောက်နေသည့်နှစ် ရွေးချယ်ပါ</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </select>
                    {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">အခန်း (Section) - ရွေးချယ်နိုင်သည်</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none bg-white text-sm"
                    >
                      <option value="">အခန်း ရွေးချယ်ပါ</option>
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
                <div className="animate-slide-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">နေရပ်လိပ်စာ (Address) *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all text-sm ${
                      errors.address ? "border-red-500" : "border-slate-200"
                    }`}
                    placeholder="မြို့နယ်၊ လမ်း၊ အိမ်နံပါတ် အပြည့်အစုံ ဖြည့်ပေးပါ"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all text-sm shadow-md shadow-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "မှတ်တမ်းတင်နေပါသည်..." : "စာရင်းသွင်းမှု တင်သွင်းမည်"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

export default UserForm
