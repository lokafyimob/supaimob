'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CompanyLogoContextType {
  companyLogo: string | null
  setCompanyLogo: (logo: string | null) => void
  isLoading: boolean
}

const CompanyLogoContext = createContext<CompanyLogoContextType | undefined>(undefined)

export function CompanyLogoProvider({ children }: { children: React.ReactNode }) {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const session = useSession()
  const sessionData = session?.data

  useEffect(() => {
    const loadCompanyLogo = async () => {
      if (!sessionData?.user) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.company?.logo) {
            setCompanyLogo(data.company.logo)
          }
        }
      } catch (error) {
        console.error('Error loading company logo:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanyLogo()
  }, [sessionData])

  return (
    <CompanyLogoContext.Provider value={{
      companyLogo,
      setCompanyLogo,
      isLoading
    }}>
      {children}
    </CompanyLogoContext.Provider>
  )
}

export function useCompanyLogo() {
  const context = useContext(CompanyLogoContext)
  if (context === undefined) {
    throw new Error('useCompanyLogo must be used within a CompanyLogoProvider')
  }
  return context
}