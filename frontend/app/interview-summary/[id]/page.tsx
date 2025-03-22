"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowRight } from "lucide-react"
import apiClient from "@/services/api-client"
import { StarsBackground } from "@/components/ui/stars-background"
import { useToast } from "@/hooks/use-toast"


// Define the feedback data type
interface ImprovementArea {
    area: string
    weakness: string
    suggestion: string
}

interface FeedbackData {
    feedback_id: string
    interview_id: string
    overall_score: number
    overall_feedback: string
    strengths: string[]
    improvement_areas: ImprovementArea[]
    next_steps: string[]
    created_at: string
}

export default function InterviewFeedbackPage() {
    const { toast } = useToast()
    const params = useParams();   // returns an object of route segments
    const { id } = params;        // 'id' matches the [id] folder name
    const [feedback, setFeedback] = useState<FeedbackData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                setLoading(true)
                // Use the apiClient to fetch feedback data
                const response = await apiClient.post("/feedback/generate", {
                    interview_id: id,
                })
                setFeedback(response.data)
                setError(null)
            } catch (err) {
                console.error("Error fetching feedback:", err)
                setError("Failed to load feedback data. Please try again later.")
                setFeedback({
                    feedback_id: "ff4ff0ad-0b13-4381-9464-c8681170f2b9",
                    interview_id: "8689f84f-b6e3-417b-9900-cab67b646219",
                    overall_score: 0,
                    overall_feedback:
                        "The interview was extremely brief, lasting only 8 seconds, which did not allow for any meaningful interaction or demonstration of skills. There is a significant need for improvement in engagement and communication.",
                    strengths: [],
                    improvement_areas: [
                        {
                            area: "communication",
                            weakness: "The candidate did not engage in any dialogue during the interview.",
                            suggestion:
                                "Practice initiating conversations and responding to questions to develop a more interactive communication style.",
                        },
                        {
                            area: "confidence",
                            weakness: "The candidate's lack of response suggests a lack of confidence in speaking.",
                            suggestion:
                                "Engage in mock interviews with friends or mentors to build confidence in articulating thoughts.",
                        },
                        {
                            area: "clarity",
                            weakness: "There was no clarity in responses due to the absence of dialogue.",
                            suggestion: "Prepare and practice clear and concise answers to common interview questions.",
                        },
                    ],
                    next_steps: [
                        "Schedule practice interviews with peers or a coach to improve communication skills.",
                        "Research common interview questions and prepare thoughtful responses.",
                        "Record yourself answering questions to identify areas for improvement in delivery and clarity.",
                    ],
                    created_at: "2025-03-18T18:02:28.353085",
                })
                toast({
                    title: "Error",
                    description: error?.toString() || "An error occurred during login",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchFeedback()
        }
    }, [id])

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return `${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Skeleton className="h-12 w-3/4 mb-4 bg-gray-900/70" />
                    <Skeleton className="h-6 w-1/2 mb-8 bg-gray-900/70" />
                    <Skeleton className="h-32 w-full mb-6 bg-gray-900/70" />
                    <Skeleton className="h-8 w-1/3 mb-4 bg-gray-900/70" />
                    <div className="space-y-4 mb-6">
                        <Skeleton className="h-24 w-full bg-gray-900/70" />
                        <Skeleton className="h-24 w-full bg-gray-900/70" />
                        <Skeleton className="h-24 w-full bg-gray-900/70" />
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (error && !feedback) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-400">Error</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // No feedback data
    if (!feedback) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gray-900/70 border border-[#4A6278] rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-[#F39C12] mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-[#F39C12]">No Feedback Available</h3>
                            <p>No feedback data is available for this interview.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
            <StarsBackground />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">Interview Feedback</h1>
                        <p className="text-gray-300 mt-1">Generated on {formatDate(feedback.created_at)}</p>
                    </div>
                    <Badge
                        className="mt-2 md:mt-0 px-4 py-1.5 text-base font-semibold rounded-full bg-[#F39C12] text-white hover:bg-[#E67E22]"
                        variant="default"
                    >
                        Score: {feedback.overall_score}/10
                    </Badge>
                </div>

                {/* Overall Assessment */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Overall Assessment</h2>
                    <p className="text-gray-300 leading-relaxed">{feedback.overall_feedback}</p>
                </section>

                {/* Areas for Improvement */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-6">Areas for Improvement</h2>
                    <div className="space-y-4">
                        {feedback.improvement_areas.map((area, index) => (
                            <Card key={index} className="bg-gray-900/70 border-[#4A6278] overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="border-l-4 border-[#F39C12] p-5">
                                        <div className="flex flex-wrap gap-2 items-center mb-2">
                                            <Badge variant="outline" className="bg-transparent border-[#F39C12] text-[#F39C12] capitalize">
                                                {area.area}
                                            </Badge>
                                            <h3 className="text-lg font-medium">{area.weakness}</h3>
                                        </div>
                                        <div className="flex items-start gap-3 mt-3 text-gray-300">
                                            <ArrowRight className="h-5 w-5 text-[#F39C12] mt-0.5 flex-shrink-0" />
                                            <p>{area.suggestion}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Next Steps */}
                {feedback.next_steps.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Recommended Next Steps</h2>
                        <ul className="space-y-3">
                            {feedback.next_steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-3 text-gray-300">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F39C12]/20 text-[#F39C12] text-sm flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    )
}

