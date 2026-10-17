import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuShieldCheck } from 'react-icons/lu'

export function Footer({ withBottomBar = false }: { withBottomBar?: boolean }) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className={`mt-20 border-t border-line bg-white ${withBottomBar ? 'pb-20 lg:pb-0' : ''}`}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <img src="/Nuzul_logo_v1_transparent.svg" alt="Nuzul" className="h-10 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">{t('footer.tagline')}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <LuShieldCheck className="size-4" />
            {t('footer.verified')}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">{t('footer.students')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/listings" className="hover:text-brand-600">{t('footer.browse')}</Link></li>
            <li><Link to="/register" className="hover:text-brand-600">{t('footer.createAccount')}</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-600">{t('footer.myInquiries')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">{t('footer.landlords')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/landlord/add-property" className="hover:text-brand-600">{t('footer.listProperty')}</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-600">{t('footer.manageListings')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-400 sm:px-6 lg:px-8">
          © {year} Nuzul · {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
