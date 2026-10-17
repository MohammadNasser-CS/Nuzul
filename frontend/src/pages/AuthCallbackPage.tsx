import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { getPostLoginRoute } from '../hooks/useAuth'
import { PageLoader } from '@/components/layout/PageLoader'

export default function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }
      try {
        const res = await authService.getMe()
        setUser(res.data)
        navigate(getPostLoginRoute(res.data), { replace: true })
      } catch {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  return <PageLoader label={t('common.signingIn')} />
}
