import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LuBuilding2, LuLayoutDashboard, LuMessageSquare, LuShieldCheck, LuUsers } from 'react-icons/lu'
import { cn } from '@/lib/format'

/** Shell for all /admin/* pages: sidebar on desktop, scrollable tab bar on mobile. */
export function AdminLayout() {
  const { t } = useTranslation()

  const links = [
    { to: '/admin/dashboard', label: t('nav.adminDashboard'), icon: LuLayoutDashboard },
    { to: '/admin/properties', label: t('nav.adminProperties'), icon: LuBuilding2 },
    { to: '/admin/inquiries', label: t('nav.inquiries'), icon: LuMessageSquare },
    { to: '/admin/users', label: t('nav.adminUsers'), icon: LuUsers },
  ]

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-lift">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <LuShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t('nav.adminPanel')}</p>
              <p className="text-xs text-brand-100">Nuzul</p>
            </div>
          </div>
          <nav className="space-y-1 rounded-2xl border border-line bg-white p-2 shadow-soft">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                <Icon className="size-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Tab bar (mobile / tablet) */}
        <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
                  isActive ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-slate-600',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
