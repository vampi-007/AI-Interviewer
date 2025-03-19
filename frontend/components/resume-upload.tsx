"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileUpload } from "@/components/ui/file-upload"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { parseResume } from "@/services/resume-service"
import { useResume } from "@/context/resume-context"

export function ResumeUpload() {
  const [files, setFiles] = useState<File[]>([])
  const router = useRouter()
  const { setResumeData } = useResume()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles)
    setError(null)
  }

  const handleSubmit = async () => {
    if (files.length > 0) {
      try {
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData()
        formData.append("file", files[0])

        // Real API call using the service
        const data = await parseResume(formData)
        setResumeData(data)
        router.push("/submit-resume")
      } catch (error) {
        console.error("Error uploading resume:", error)
        setError("Failed to process resume. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setError("Please select a file to upload")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold text-[#2C3E50] dark:text-white mb-4">Upload Your Resume</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        We'll analyze your resume to create a personalized interview experience. Supported formats: PDF, DOCX.
      </p>

      <FileUpload onChange={handleFileChange} />

      {error && <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">{error}</div>}

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || isSubmitting}
          className="bg-[#F39C12] hover:bg-[#E67E22] text-white px-6 py-2 rounded-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to Interview"
          )}
        </Button>
      </div>
    </motion.div>
  )
}

