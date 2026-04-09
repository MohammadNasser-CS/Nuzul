import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import type { CompleteStudentProfilePayload } from "../types";

const DEGREES = ["Diploma", "Bachelor", "Master", "Doctorate"] as const;
const GENDERS = ["MALE", "FEMALE"] as const;
const ROOM_TYPES = [
  { value: "SINGLE", label: "Single", desc: "Private room" },
  { value: "SHARED", label: "Shared", desc: "Shared room" },
  { value: "STUDIO", label: "Studio", desc: "Studio apartment" },
  { value: "NO_PREFERENCE", label: "No preference", desc: "Any type" },
] as const;

export default function StudentInfoPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [form, setForm] = useState<Partial<CompleteStudentProfilePayload>>({
    university_name: "An-Najah National University",
    preferred_room_type: "NO_PREFERENCE",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof CompleteStudentProfilePayload, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic budget validation
    if (
      form.budget_min !== undefined &&
      form.budget_max !== undefined &&
      form.budget_min > form.budget_max
    ) {
      return setError("Minimum budget cannot be greater than maximum budget.");
    }

    setLoading(true);
    try {
      const res = await authService.completeStudentProfile(
        form as CompleteStudentProfilePayload
      );
      setUser(res.data);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-2">
            Step 2 of 2
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Student information
          </h1>
          <p className="text-gray-500 text-sm">
            Help landlords understand who you are and what you're looking for.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date of birth + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of birth <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={form.date_of_birth ?? ""}
                onChange={(e) => set("date_of_birth", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.gender ?? ""}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="" disabled>
                  Select gender
                </option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0) + g.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* University (read-only — only one option) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              University
            </label>
            <input
              type="text"
              readOnly
              value="An-Najah National University"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* College + Degree */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College / Faculty <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.college ?? ""}
                onChange={(e) => set("college", e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.degree ?? ""}
                onChange={(e) => set("degree", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="" disabled>
                  Select degree
                </option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.specialization ?? ""}
              onChange={(e) => set("specialization", e.target.value)}
              placeholder="e.g. Software Engineering"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Budget range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly budget (ILS) <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min={0}
                value={form.budget_min ?? ""}
                onChange={(e) => set("budget_min", Number(e.target.value))}
                placeholder="Min"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-gray-400 text-sm shrink-0">to</span>
              <input
                type="number"
                required
                min={0}
                value={form.budget_max ?? ""}
                onChange={(e) => set("budget_max", Number(e.target.value))}
                placeholder="Max"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Preferred room type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred room type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROOM_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("preferred_room_type", value)}
                  className={`text-left rounded-lg border-2 px-3 py-2.5 text-xs transition-all ${
                    form.preferred_room_type === value
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-gray-800">{label}</p>
                  <p className="text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
          >
            {loading ? "Saving…" : "Complete setup →"}
          </button>
        </form>
      </div>
    </div>
  );
}
