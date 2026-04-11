import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import type { CompleteStudentProfilePayload } from "../types";

const DEGREES = ["Diploma", "Bachelor", "Master", "Doctorate"] as const;
const GENDERS = ["MALE", "FEMALE"] as const;
const ROOM_TYPE_VALUES = ["SINGLE", "SHARED", "STUDIO", "NO_PREFERENCE"] as const;

export default function StudentInfoPage() {
  const { t } = useTranslation()
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

    if (
      form.budget_min !== undefined &&
      form.budget_max !== undefined &&
      form.budget_min > form.budget_max
    ) {
      return setError(t('onboarding.student.budgetError'));
    }

    setLoading(true);
    try {
      const res = await authService.completeStudentProfile(
        form as CompleteStudentProfilePayload
      );
      setUser(res.data);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? t('onboarding.student.genericError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-2">
            {t('onboarding.step2of2')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('onboarding.student.title')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('onboarding.student.subtitle')}
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
                {t('onboarding.student.dateOfBirth')} <span className="text-red-400">*</span>
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
                {t('onboarding.student.gender')} <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.gender ?? ""}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="" disabled>{t('onboarding.student.selectGender')}</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {t(`enums.gender.${g}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* University (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('onboarding.student.university')}
            </label>
            <input
              type="text"
              readOnly
              value={t('enums.university.An-Najah National University')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* College + Degree */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.student.college')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.college ?? ""}
                onChange={(e) => set("college", e.target.value)}
                placeholder={t('onboarding.student.collegePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.student.degree')} <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.degree ?? ""}
                onChange={(e) => set("degree", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="" disabled>{t('onboarding.student.selectDegree')}</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {t(`enums.degree.${d}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('onboarding.student.specialization')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.specialization ?? ""}
              onChange={(e) => set("specialization", e.target.value)}
              placeholder={t('onboarding.student.specializationPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Budget range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('onboarding.student.budget')} <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min={0}
                value={form.budget_min ?? ""}
                onChange={(e) => set("budget_min", Number(e.target.value))}
                placeholder={t('onboarding.student.budgetMin')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-gray-400 text-sm shrink-0">{t('onboarding.student.to')}</span>
              <input
                type="number"
                required
                min={0}
                value={form.budget_max ?? ""}
                onChange={(e) => set("budget_max", Number(e.target.value))}
                placeholder={t('onboarding.student.budgetMax')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Preferred room type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.student.preferredRoomType')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROOM_TYPE_VALUES.map((value) => (
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
                  <p className="font-semibold text-gray-800">{t(`enums.preferredRoomType.${value}`)}</p>
                  <p className="text-gray-400 mt-0.5">{t(`enums.preferredRoomTypeDesc.${value}`)}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
          >
            {loading ? t('onboarding.student.saving') : t('onboarding.student.completeSetup')}
          </button>
        </form>
      </div>
    </div>
  );
}
