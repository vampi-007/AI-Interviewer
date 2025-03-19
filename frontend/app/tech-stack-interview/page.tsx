"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { api } from "@/hooks/use-api"
import { VoiceInterview } from "@/components/voice-interview"
import apiClient from "@/services/api-client"
import { useToast } from "@/hooks/use-toast"


interface TechStack {
    prompt_id: string
    tech_stack: string
    difficulty: "easy" | "medium" | "hard"
}

export interface Prompt {
    content: string
    tech_stack: string
    difficulty: string
    prompt_id: string
    created_at: string
    updated_at: string
}

export default function TechStackSelector() {
    const { toast } = useToast()
    const [techStacks, setTechStacks] = useState<TechStack[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
    const [sessionToken, setSessionToken] = useState<string>("")
    const [promptData, setPromptData] = useState<string | null>(null);
    const [interviewId, setInterviewId] = useState<string | undefined>(undefined);



    useEffect(() => {
        const fetchTechStacks = async () => {
            try {
                setIsLoading(true)
                const response = await api.get("/all-tech-stacks")
                setTechStacks(response.data)
                setError(null)
            } catch (err) {
                console.error("Failed to fetch tech stacks:", err)
                setError("Failed to load tech stacks. Please try again later.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchTechStacks()
    }, [])

    const handleCardClick = async (techStack: TechStack) => {
        setIsLoading(true);

        setSelectedPromptId(techStack.prompt_id);
        try {
            const userId = localStorage.getItem("user_id")

            // Schedule interview with selected resume
            const payload = {
                user_id: userId,
                prompt_id: techStack.prompt_id,
                resume_id: null

            }

            const interviewResponse = await apiClient.post("/schedule", payload);
            const promptRes = await apiClient.get(`/${techStack.prompt_id}`)

            const { message, interview_id, session_token } = interviewResponse.data

            if (message) {
                setSessionToken(session_token)
                setInterviewId(interview_id);
            }

            if (promptRes) {
                setPromptData(promptRes.data.content)
            }
        } catch (error) {
            console.error("Error scheduling interview:", error)
            toast({
                title: "Error",
                description: error?.toString() || "An error occurred during login",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <LoadingState />
    }

    if (error) {
        return <ErrorState message={error} />
    }
    if (selectedPromptId) {
        return <VoiceInterview sessionToken={sessionToken} promptData={promptData} resumeData={null} interviewId={interviewId || ""} />
    }


    return (
        <div className="container mx-auto py-12 px-4 bg-gray-950 min-h-screen text-white">
            <h1 className="text-3xl font-bold text-center mb-8">Choose Your Tech Stack</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {techStacks.map((tech, index) => (
                    <TechStackCard key={index} techStack={tech} onClick={() => handleCardClick(tech)} />
                ))}
            </div>
        </div>
    )
}

function TechStackCard({ techStack, onClick }: { techStack: TechStack; onClick: () => void }) {
    const difficultyColors = {
        easy: "bg-green-900/40 text-green-300 hover:bg-green-900/60 border-green-800",
        medium: "bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60 border-yellow-800",
        hard: "bg-red-900/40 text-red-300 hover:bg-red-900/60 border-red-800",
    }

    return (
        <Card
            className="transition-all duration-300 transform hover:scale-105 cursor-pointer bg-gray-900/70 border-gray-800 hover:border-[#F39C12]"
            onClick={onClick}
        >
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center h-32">
                    <h2 className="text-xl font-semibold text-center mb-2 text-white">{techStack.tech_stack}</h2>
                    <Badge className={`${difficultyColors[techStack.difficulty]} border`}>
                        {techStack.difficulty.charAt(0).toUpperCase() + techStack.difficulty.slice(1)}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    )
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-gray-950 text-white">
            <Loader2 className="h-12 w-12 animate-spin text-[#F39C12] mb-4" />
            <h2 className="text-xl font-medium">Loading tech stacks...</h2>
        </div>
    )
}


function ErrorState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-gray-950 text-white">
            <div className="bg-red-900/20 border border-red-800 text-red-300 p-6 rounded-lg max-w-md">
                <h2 className="text-xl font-medium mb-2">Something went wrong</h2>
                <p>{message}</p>
            </div>
        </div>
    )
}

