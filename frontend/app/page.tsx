"use client"

import { ResumeUpload } from "@/components/resume-upload"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { StarsBackground } from "@/components/ui/stars-background"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 md:p-8 relative">
      <StarsBackground />
      <div className="w-full max-w-4xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">AI Interviewer</h1>
          <p className="text-gray-300 text-lg">Upload your resume to start your personalized interview</p>
        </div>
        <BackgroundGradient containerClassName="w-full">
          <ResumeUpload />
        </BackgroundGradient>
      </div>
    </main>
  )
}

