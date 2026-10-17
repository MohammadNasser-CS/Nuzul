import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LuChevronDown,
  LuGlobe,
  LuHouse,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPlus,
  LuSearch,
  LuShieldCheck,
  LuX,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { useAuth } from '../../hooks/useAuth'
import { useLanguageStore } from '../../store/languageStore'
import { authService } from '../../services/auth'
import { cn, initialOf } from '@/lib/format'
import { LinkButton } from '../ui/Button'

interface NavItem {
  to: string
  label: string
  icon: IconType
  end?: boolean
}

export function Navbar() {
  const { t } = useTranslation()
  const { user, session, clear } = useAuth()
  const { language, setLanguage } = useLanguageStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const role = user?.role ?? null

  // Close menus whenever the route changes (adjust state during render, not in an effect)
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
    setMenuOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the user menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Prevent body scroll behind the mobile drawer
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleSignOut = async (): Promise<void> => {
    await authService.signOut()
    clear()
    navigate('/login')
  }

  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar')

  const items: NavItem[] = [{ to: '/listings', label: t('nav.listings'), icon: LuSearch }]
  if (session && (role === 'STUDENT' || role === 'LANDLORD')) {
    items.push({ to: '/dashboard', label: t('nav.dashboard'), icon: LuLayoutDashboard })
  }
  if (session && role === 'ADMIN') {
    items.push({ to: '/admin/dashboard', label: t('nav.adminPanel'), icon: LuShieldCheck })
  }

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    )

  const displayName = user?.full_name ?? user?.email ?? ''

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-white/85 backdrop-blur-xl transition-shadow',
          scrolled ? 'border-line shadow-soft' : 'border-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="shrink-0" aria-label="Nuzul">
            <img src="/Nuzul_logo_v1_transparent.svg" alt="Nuzul" className="h-9 w-auto" />
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkCls}>
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="ms-auto flex items-center gap-2">
            {role === 'LANDLORD' && (
              <LinkButton
                to="/landlord/add-property"
                variant="accent"
                size="sm"
                className="hidden rounded-full sm:inline-flex"
                leftIcon={<LuPlus className="size-4" />}
              >
                {t('nav.addProperty')}
              </LinkButton>
            )}

            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
              aria-label={t('nav.switchLanguage')}
            >
              <LuGlobe className="size-4" />
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {session ? (
              /* User menu */
              <div ref={menuRef} className="relative hidden md:block">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex h-10 items-center gap-2 rounded-full border border-line bg-white ps-1 pe-3 transition-shadow hover:shadow-soft"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    {initialOf(displayName)}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-semibold text-slate-700">
                    {user?.full_name?.split(' ')[0] ?? displayName}
                  </span>
                  <LuChevronDown className={cn('size-4 text-slate-400 transition-transform', menuOpen && 'rotate-180')} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute end-0 top-12 w-64 origin-top overflow-hidden rounded-2xl border border-line bg-white shadow-lift animate-scale-in"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-bold text-slate-900">{user?.full_name ?? '—'}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                      {role && (
                        <span className="mt-2 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          {t(`enums.role.${role}`)}
                        </span>
                      )}
                    </div>
                    <div className="p-1.5">
                      {items.slice(1).map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <item.icon className="size-4 text-slate-400" />
                          {item.label}
                        </Link>
                      ))}
                      {role === 'LANDLORD' && (
                        <Link
                          to="/landlord/add-property"
                          role="menuitem"
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <LuPlus className="size-4 text-slate-400" />
                          {t('nav.addProperty')}
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        role="menuitem"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LuLogOut className="size-4 rtl:rotate-180" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <NavLink to="/login" className={linkCls}>
                  {t('nav.signIn')}
                </NavLink>
                <LinkButton to="/register" variant="accent" size="sm" className="h-10 rounded-full px-5">
                  {t('nav.getStarted')}
                </LinkButton>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-slate-700 md:hidden"
              aria-label={t('nav.openMenu')}
            >
              <LuMenu className="size-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col bg-white shadow-pop animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <img src="/Nuzul_logo_v1_transparent.svg" alt="Nuzul" className="h-8 w-auto" />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label={t('common.close')}
              >
                <LuX className="size-5" />
              </button>
            </div>

            {session && (
              <div className="flex items-center gap-3 border-b border-line px-4 py-4">
                <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white">
                  {initialOf(displayName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.full_name ?? '—'}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  cn('flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50')
                }
              >
                <LuHouse className="size-5" />
                {t('nav.home')}
              </NavLink>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn('flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50')
                  }
                >
                  <item.icon className="size-5" />
                  {item.label}
                </NavLink>
              ))}
              {role === 'LANDLORD' && (
                <NavLink
                  to="/landlord/add-property"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-accent-700 hover:bg-accent-50"
                >
                  <LuPlus className="size-5" />
                  {t('nav.addProperty')}
                </NavLink>
              )}
              <button
                onClick={toggleLanguage}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LuGlobe className="size-5" />
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>

            <div className="border-t border-line p-4">
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  <LuLogOut className="size-4 rtl:rotate-180" />
                  {t('nav.signOut')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <LinkButton to="/login" variant="outline" block>
                    {t('nav.signIn')}
                  </LinkButton>
                  <LinkButton to="/register" variant="accent" block>
                    {t('nav.getStarted')}
                  </LinkButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
