import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";

type Role = "STUDENT" | "LANDLORD";

export default function RoleSelectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return setError(t('onboarding.role.selectRoleError'));
    setError(null);
    setLoading(true);

    try {
      const res = await authService.completeProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        role: selectedRole,
      });
      setUser(res.data);
      if (selectedRole === "STUDENT") {
        navigate("/student-info", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? t('onboarding.role.genericError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-2">
            {t('onboarding.step1of2')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('onboarding.role.title')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('onboarding.role.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.role.fullName')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('onboarding.role.fullNamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.role.phoneNumber')} <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('onboarding.role.phonePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('onboarding.role.iAmA')} <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Student card */}
              <button
                type="button"
                onClick={() => setSelectedRole("STUDENT")}
                className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                  selectedRole === "STUDENT"
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                {selectedRole === "STUDENT" && (
                  <span className="absolute top-3 end-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <div className="text-2xl mb-2">🎓</div>
                <p className="font-semibold text-gray-900 text-sm">{t('onboarding.role.student')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('onboarding.role.studentDesc')}</p>
              </button>

              {/* Landlord card */}
              <button
                type="button"
                onClick={() => setSelectedRole("LANDLORD")}
                className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                  selectedRole === "LANDLORD"
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                {selectedRole === "LANDLORD" && (
                  <span className="absolute top-3 end-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <div className="text-2xl mb-2">🏠</div>
                <p className="font-semibold text-gray-900 text-sm">{t('onboarding.role.landlord')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('onboarding.role.landlordDesc')}</p>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRole}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading
              ? t('onboarding.role.saving')
              : selectedRole === "STUDENT"
              ? t('onboarding.role.continueStudent')
              : t('onboarding.role.completeSetup')}
          </button>
        </form>
      </div>
    </div>
  );
}
