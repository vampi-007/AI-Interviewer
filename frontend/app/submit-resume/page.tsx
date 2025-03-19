"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { BackgroundGradient } from "@/components/ui/background-gradient"

// Existing dialogs
import { AddSkillDialog } from "@/components/dialogs/add-skill-dialog"
import { AddEducationDialog } from "@/components/dialogs/add-education-dialog"
import { AddExperienceDialog } from "@/components/dialogs/add-experience-dialog"

// New dialogs for editing and projects
import { EditPersonalDetailsDialog } from "@/components/dialogs/edit-personal-details-dialog"
import { EditSkillDialog } from "@/components/dialogs/edit-skill-dialog"
import { EditEducationDialog } from "@/components/dialogs/edit-education-dialog"
import { EditExperienceDialog } from "@/components/dialogs/edit-experience-dialog"
import { AddProjectDialog } from "@/components/dialogs/add-project-dialog"
import { EditProjectDialog } from "@/components/dialogs/edit-project-dialog"

import { useResume } from "@/context/resume-context"
import { submitResumeForInterview } from "@/services/resume-service"
import { useApiPost } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"


export default function InterviewPrep() {
  const { toast } = useToast()

  const { resumeData, setResumeData } = useResume()
  const router = useRouter()
  const { loading: isSubmitting } = useApiPost<{ interviewId: string }>()

  useEffect(() => {
    if (!resumeData) {
      router.push("/")
    }
  }, [resumeData, router])

  // ----- Skill Handlers -----
  const handleAddSkill = (skill: string) => {
    if (resumeData) {
      const updatedData = {
        ...resumeData,
        skills: resumeData.skills ? `${resumeData.skills}, ${skill}` : skill,
      }
      setResumeData(updatedData)
    }
  }
  const handleEditSkill = (updatedSkills: string) => {
    if (resumeData) {
      setResumeData({ ...resumeData, skills: updatedSkills })
    }
  }

  // ----- Education Handlers -----
  const handleAddEducation = (education: {
    degree: string
    institution: string
    start_date: string
    end_date: string
  }) => {
    if (resumeData) {
      // Convert to an array if necessary and add new education.
      const educationArray = Array.isArray(resumeData.education)
        ? resumeData.education
        : [resumeData.education]
      setResumeData({ ...resumeData, education: [...educationArray, education] })
    }
  }
  const handleEditEducation = (
    index: number,
    updatedEducation: {
      degree: string
      institution: string
      start_date: string
      end_date: string
    }
  ) => {
    if (resumeData) {
      const educationArray = Array.isArray(resumeData.education)
        ? resumeData.education
        : [resumeData.education]
      educationArray[index] = updatedEducation
      setResumeData({ ...resumeData, education: educationArray })
    }
  }

  // ----- Experience Handlers -----
  const handleAddExperience = (experience: {
    job_title: string
    company_name: string
    start_date: string
    end_date: string
  }) => {
    if (resumeData) {
      setResumeData({ ...resumeData, experiences: [...resumeData.experiences, experience] })
    }
  }
  const handleEditExperience = (
    index: number,
    updatedExperience: {
      job_title: string
      company_name: string
      start_date: string
      end_date: string
    }
  ) => {
    if (resumeData) {
      const updatedExperiences = [...resumeData.experiences]
      updatedExperiences[index] = updatedExperience
      setResumeData({ ...resumeData, experiences: updatedExperiences })
    }
  }

  // ----- Project Handlers -----
  const handleAddProject = (project: { name: string; description: string }) => {
    if (resumeData) {
      setResumeData({ ...resumeData, projects: [...resumeData.projects, project] })
    }
  }
  const handleEditProject = (
    index: number,
    updatedProject: { name: string; description: string }
  ) => {
    if (resumeData) {
      const updatedProjects = [...resumeData.projects]
      updatedProjects[index] = updatedProject
      setResumeData({ ...resumeData, projects: updatedProjects })
    }
  }

  // ----- Personal Details Handler -----
  const handleEditPersonalDetails = (details: { name: string; email: string; phone_number: string }) => {
    if (resumeData) {
      setResumeData({ ...resumeData, ...details })
    }
  }

  const handleStartInterview = async () => {
    if (!resumeData) return

    try {
      const result = await submitResumeForInterview(resumeData)
      setResumeData({ ...resumeData, resume_id: result.interviewId })
      router.push(`/interview`)
    } catch (error) {
      console.error("Error starting interview:", error)
      toast({
        title: "Error",
        description: error?.toString() || "An error occurred during login",
        variant: "destructive",
      })
    }
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F39C12]" />
      </div>
    )
  }

  // Convert education to an array if it isn't already.
  const educationArray = Array.isArray(resumeData.education)
    ? resumeData.education
    : [resumeData.education]

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Interview Preparation</h1>
          <p className="text-gray-300 text-lg">
            We've analyzed your resume. Feel free to add, modify, or edit any information before starting the interview.
          </p>
        </motion.div>

        <BackgroundGradient containerClassName="w-full mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 md:p-8"
          >
            {/* Personal Details Section */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Hello, {resumeData.name}</h2>
                <div className="mt-2 text-gray-300">
                  <p>
                    <span className="text-[#F39C12]">Email:</span> {resumeData.email}
                  </p>
                  <p>
                    <span className="text-[#F39C12]">Phone:</span> {resumeData.phone_number}
                  </p>
                </div>
              </div>
              <EditPersonalDetailsDialog
                onEdit={handleEditPersonalDetails}
                currentDetails={{
                  name: resumeData.name,
                  email: resumeData.email,
                  phone_number: resumeData.phone_number,
                }}
              />
            </div>

            {/* Skills Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="border border-gray-800 bg-gray-900/50">
                <CardHeader className="bg-gray-900/50 flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Skills</CardTitle>
                  <div className="flex gap-2">
                    <AddSkillDialog onAddSkill={handleAddSkill} />
                    <EditSkillDialog currentSkills={resumeData.skills} onEditSkill={handleEditSkill} />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills &&
                      resumeData.skills.split(", ").map((skill, index) => (
                        <span key={index} className="bg-[#F39C12]/10 text-[#F39C12] px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Education Section */}
              <Card className="border border-gray-800 bg-gray-900/50">
                <CardHeader className="bg-gray-900/50 flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Education</CardTitle>
                  <div className="flex gap-2">
                    <AddEducationDialog onAddEducation={handleAddEducation} />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {educationArray.map((edu, index) => (
                    <div key={index} className="mb-4">
                      <p className="font-medium text-white">{edu.degree}</p>
                      <p className="text-gray-300">{edu.institution}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {edu.start_date} - {edu.end_date}
                      </p>
                      <EditEducationDialog
                        currentEducation={edu}
                        onEditEducation={(updatedEdu) => handleEditEducation(index, updatedEdu)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Experience Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Experience</h3>
                <AddExperienceDialog onAddExperience={handleAddExperience} />
              </div>
              <div className="space-y-4">
                {resumeData.experiences.map((exp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="p-4 border border-gray-800 rounded-lg bg-gray-900/50 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium text-white">{exp.job_title}</h4>
                      <p className="text-[#F39C12]">{exp.company_name}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {exp.start_date} - {exp.end_date}
                      </p>
                    </div>
                    <EditExperienceDialog
                      index={index}
                      currentExperience={exp}
                      onEditExperience={handleEditExperience}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Projects Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Projects</h3>
                <AddProjectDialog onAddProject={handleAddProject} />
              </div>
              <div className="space-y-4">
                {resumeData.projects.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="p-4 border border-gray-800 rounded-lg bg-gray-900/50 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium text-white">{project.name}</h4>
                      <p className="text-gray-300">{project.description}</p>
                    </div>
                    <EditProjectDialog
                      index={index}
                      currentProject={project}
                      onEditProject={handleEditProject}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </BackgroundGradient>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleStartInterview}
            disabled={isSubmitting}
            className="bg-[#F39C12] hover:bg-[#E67E22] text-white px-6 py-6 rounded-md flex items-center gap-2 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Preparing Interview...
              </>
            ) : (
              <>
                Start Interview <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </main>
  )
}
