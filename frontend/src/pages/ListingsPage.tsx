// TODO (frontend dev): Build the full listings UI here.
// The data layer is already wired up — just call propertiesService.list()

import { useEffect, useState } from 'react'
import { propertiesService } from '../services/properties'
import type { Property } from '../types'

export default function ListingsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    propertiesService
      .list({ available_only: true })
      .then((res) => setProperties(res.data))
      .catch(() => setError('Failed to load listings.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading listings…</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Available listings</h1>

      {properties.length === 0 ? (
        <p className="text-gray-500">No listings available right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-4" />
              )}
              <h2 className="font-semibold text-gray-900">{p.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{p.address}, {p.city}</p>
              <p className="text-brand-600 font-bold mt-3">₪{p.price_per_month} / month</p>
              <p className="text-xs text-gray-400 mt-1">{p.rooms} room{p.rooms > 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
