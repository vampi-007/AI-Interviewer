"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StarsBackground } from "@/components/ui/stars-background"
import { VoiceInterview } from "@/components/voice-interview"
import { Loader2, FileText, Calendar, Award, Briefcase } from "lucide-react"
import apiClient from "@/services/api-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

// Interface for Resume Data
interface ResumeData {
  name: string
  email: string
  phone_number: string
  skills: string
  education: {
    degree: string
    institution: string
    start_date: string
    end_date: string
  }
  projects: Array<{
    name: string
    description: string
  }>
  experiences: Array<{
    job_title: string
    company_name: string
    start_date: string
    end_date: string
  }>
  resume_id?: string
}

interface Resume {
  resume_id: string
  uploaded_at: string
  resume_data: ResumeData
}

interface ResumeResponse {
  user_id: string
  resumes: Resume[]
}

export default function Interview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fetchingResumes, setFetchingResumes] = useState(true)
  const [interviewId, setInterviewId] = useState<string>("")
  const [sessionToken, setSessionToken] = useState<string>("")
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [interviewStarted, setInterviewStarted] = useState(false)

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        // Get user_id from localStorage
        const userId = localStorage.getItem("user_id")

        if (!userId) {
          console.error("No user ID found")
          router.push("/")
          return
        }

        // Fetch all resumes
        const response = await apiClient.get<ResumeResponse>(`/get_user_resumes/${userId}`)

        if (!response.data.resumes || response.data.resumes.length === 0) {
          toast({
            title: "No resumes found",
            description: "Please upload a resume to start an interview",
            variant: "destructive"
          })
          router.push("/upload")
          return
        }

        setResumes(response.data.resumes)
        setFetchingResumes(false)
      } catch (error) {
        console.error("Error fetching resumes:", error)
        toast({
          title: "Error",
          description: "Failed to fetch resumes. Please try again.",
          variant: "destructive"
        })
        router.push("/")
      }
    }

    fetchResumes()
  }, [router])

  const startInterview = async (resume: Resume) => {
    setSelectedResume(resume)
    setLoading(true)

    try {
      const userId = localStorage.getItem("user_id")

      // Schedule interview with selected resume
      const payload = {
        user_id: userId,
        prompt_id: null,
        resume_id: resume.resume_id
      }

      const interviewResponse = await apiClient.post("/schedule", payload)
      const { message, interview_id, session_token } = interviewResponse.data

      if (message) {
        setInterviewId(interview_id)
        setSessionToken(session_token)
        setInterviewStarted(true)
      }
    } catch (error) {
      console.error("Error scheduling interview:", error)
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // Extract skills as array
  const getSkillsArray = (skills: string) => {
    return skills.split(',').map(skill => skill.trim())
  }

  if (fetchingResumes) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        <StarsBackground />
        <div className="text-center z-10">
          <Loader2 className="h-12 w-12 animate-spin text-[#F39C12] mx-auto mb-4" />
          <p className="text-white text-lg">Loading your resumes...</p>
        </div>
      </div>
    )
  }

  if (loading && interviewStarted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        <StarsBackground />
        <div className="text-center z-10">
          <Loader2 className="h-12 w-12 animate-spin text-[#F39C12] mx-auto mb-4" />
          <p className="text-white text-lg">Preparing your interview...</p>
        </div>
      </div>
    )
  }

  if (interviewStarted && selectedResume) {
    return (
      <main className="min-h-screen bg-gray-950 relative overflow-hidden">
        <StarsBackground />
        <div className="relative z-10 h-screen flex flex-col">
          <VoiceInterview
            resumeData={selectedResume.resume_data}
            interviewId={interviewId}
            sessionToken={sessionToken}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 relative overflow-hidden">
      <StarsBackground />
      <div className="container mx-auto py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Select a Resume for Interview</h1>
          <p className="text-gray-300">Choose one of your resumes to start the interview process</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.resume_id} className="bg-gray-900 border-gray-800 hover:border-[#F39C12] transition-all">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#F39C12]" />
                  {resume.resume_data.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Uploaded on {formatDate(resume.uploaded_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {getSkillsArray(resume.resume_data.skills).slice(0, 3).map((skill) => (
                    <Badge key={skill} className="bg-gray-800 hover:bg-gray-700 text-gray-300">{skill}</Badge>
                  ))}
                  {getSkillsArray(resume.resume_data.skills).length > 3 && (
                    <Badge className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                      +{getSkillsArray(resume.resume_data.skills).length - 3} more
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-[#F39C12]" />
                  {resume.resume_data.education.degree}
                </p>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#F39C12]" />
                  {resume.resume_data.experiences.length > 0
                    ? resume.resume_data.experiences[0].job_title
                    : "No experience listed"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-transparent text-white border-gray-700 hover:bg-gray-800 hover:text-white">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{resume.resume_data.name}'s Resume</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        {resume.resume_data.email} • {resume.resume_data.phone_number}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-6 py-4">
                        {/* Skills Section */}
                        <div>
                          <h3 className="text-lg font-medium text-[#F39C12] mb-2">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {getSkillsArray(resume.resume_data.skills).map((skill) => (
                              <Badge key={skill} className="bg-gray-800 hover:bg-gray-700">{skill}</Badge>
                            ))}
                          </div>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Education Section */}
                        <div>
                          <h3 className="text-lg font-medium text-[#F39C12] mb-2">Education</h3>
                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex justify-between mb-1">
                              <h4 className="font-medium">{resume.resume_data.education.degree}</h4>
                              <span className="text-sm text-gray-400">
                                {resume.resume_data.education.start_date} - {resume.resume_data.education.end_date}
                              </span>
                            </div>
                            <p className="text-gray-300">{resume.resume_data.education.institution}</p>
                          </div>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Experience Section */}
                        <div>
                          <h3 className="text-lg font-medium text-[#F39C12] mb-2">Experience</h3>
                          <div className="space-y-4">
                            {resume.resume_data.experiences.map((exp, index) => (
                              <div key={index} className="bg-gray-800 rounded-lg p-4">
                                <div className="flex justify-between mb-1">
                                  <h4 className="font-medium">{exp.job_title}</h4>
                                  <span className="text-sm text-gray-400">
                                    {exp.start_date} - {exp.end_date}
                                  </span>
                                </div>
                                <p className="text-gray-300">{exp.company_name}</p>
                              </div>
                            ))}
                            {resume.resume_data.experiences.length === 0 && (
                              <p className="text-gray-400">No experience listed</p>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Projects Section */}
                        <div>
                          <h3 className="text-lg font-medium text-[#F39C12] mb-2">Projects</h3>
                          <div className="space-y-4">
                            {resume.resume_data.projects.map((project, index) => (
                              <div key={index} className="bg-gray-800 rounded-lg p-4">
                                <h4 className="font-medium mb-1">{project.name}</h4>
                                <p className="text-gray-300 text-sm">{project.description}</p>
                              </div>
                            ))}
                            {resume.resume_data.projects.length === 0 && (
                              <p className="text-gray-400">No projects listed</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    <div className="flex justify-end mt-4">
                      <Button onClick={() => startInterview(resume)} className="bg-[#F39C12] hover:bg-[#E67E22] text-white">
                        Start Interview with this Resume
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => startInterview(resume)}
                  className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
                >
                  Start Interview
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}