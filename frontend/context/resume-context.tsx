"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ResumeData } from "@/services/resume-service"

interface ResumeContextType {
  resumeData: ResumeData | null
  setResumeData: (data: ResumeData) => void
  clearResumeData: () => void
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined)

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)

  const clearResumeData = () => {
    setResumeData(null)
  }

  return (
    <ResumeContext.Provider value={{ resumeData, setResumeData, clearResumeData }}>{children}</ResumeContext.Provider>
  )
}

export function useResume() {
  const context = useContext(ResumeContext)
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider")
  }
  return context
}

