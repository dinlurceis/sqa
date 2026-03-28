import { useEffect, useState } from 'react'
import { supportApi } from '@/lib/api'

export const useTickets = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await supportApi.listTickets()
      if (res.success) setTickets(res.data || [])
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  return { tickets, loading, error, fetch }
}
