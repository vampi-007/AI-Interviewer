import apiClient from "./api-client"

export interface ResumeData {
  name: string
  email: string
  phone_number: string
  skills: string
  education: {
    degree: string
    institution: string
    start_date: string
    end_date: string
  } | Array<{
    degree: string
    institution: string
    start_date: string
    end_date: string
  }>
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

// Function to parse resume using API
export async function parseResume(formData: FormData): Promise<ResumeData> {
  try {
    const response = await apiClient.post<ResumeData>("/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error("Error parsing resume:", error)
    throw error
  }
}

// Function to submit resume data for interview
export async function submitResumeForInterview(resumeData: ResumeData): Promise<{ interviewId: string }> {
  try {
    const user_id = localStorage.getItem("user_id")
    const response = await apiClient.post<{ interviewId: string }>(`/submit/?user_id=${user_id}`, resumeData)
    return response.data
  } catch (error) {
    console.error("Error submitting resume for interview:", error)
    throw error
  }
}

