'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestPage() {
  useEffect(() => {
    const supabase = createClient()

    const test = async () => {
      const { data, error } = await supabase.from('decks').select('*')

      console.log('DATA:', data)
      console.log('ERROR:', error)
    }

    test()
  }, [])

  return <div>Check console for Supabase test</div>
}
