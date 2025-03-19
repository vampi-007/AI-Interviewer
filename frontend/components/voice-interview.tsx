"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Vapi from "@vapi-ai/web"
import { Mic, MicOff, PhoneOff, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ResumeData } from "@/services/resume-service"
import { cn } from "@/lib/utils"
import apiClient from "@/services/api-client"
import { Prompt } from "@/app/tech-stack-interview/page"
import { ElevenLabsVoice } from "@vapi-ai/web/dist/api"

// Initialize Vapi
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_TOKEN || "")

interface VoiceInterviewProps {
    resumeData?: ResumeData | null
    interviewId: string
    sessionToken: string
    promptData?: string | null
}


export function VoiceInterview({ resumeData, sessionToken, promptData, interviewId }: VoiceInterviewProps) {
    const router = useRouter()
    const [callStatus, setCallStatus] = useState<"inactive" | "loading" | "active">("inactive")
    const [isMuted, setIsMuted] = useState(false)
    const [duration, setDuration] = useState(0)
    const [error, setError] = useState();
    const [sessionValid, setSessionValid] = useState<boolean | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const endingInterviewRef = useRef(false) // New ref to track if we're in the process of ending




    // Validate session on mount using your axios API client.
    useEffect(() => {
        console.log(sessionToken);
        const validateSession = async () => {
            try {

                if (!sessionToken) return
                const response = await apiClient.get(`/validate/${sessionToken}`)
                // If a message exists in the response, assume the session is valid.
                if (response.data.message) {
                    setSessionValid(true)
                } else {
                    setSessionValid(false)
                }
            } catch (error) {
                console.error("Error validating session:", error)
                setSessionValid(false)
            }
        }
        validateSession()
    }, [])

    // Format duration as mm:ss
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    // Start the interview
    const startInterview = async () => {
        setCallStatus("loading")
        let assistantOverrides = {}
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "your-assistant-id"
        try {
            if (resumeData !== null) {
                assistantOverrides = {
                    transcriber: {
                        provider: "deepgram" as const,
                        model: "nova-2",
                        language: "en-US" as const,
                    },
                    recordingEnabled: true,
                    variableValues: {
                        name: resumeData?.name,
                        skills: resumeData?.skills,
                        experience: resumeData?.experiences
                            .map((exp) => `${exp.job_title} at ${exp.company_name} (${exp.start_date} - ${exp.end_date})`)
                            .join(", "),
                        education: Array.isArray(resumeData?.education)
                            ? `${resumeData?.education[0].degree} at ${resumeData?.education[0].institution}`
                            : `${resumeData?.education.degree} at ${resumeData?.education.institution}`,
                        projects: resumeData?.projects.map((proj) => `Project Name: ${proj.name}, Description: ${proj.description}`),
                        sessionToken: sessionToken
                    },
                }


                console.log(assistantOverrides);

                await vapi.start(assistantId, assistantOverrides)

            } else if (promptData !== null) {
                console.log("We have sccessfully moved to prompt Data")
                assistantOverrides = {
                    transcriber: {
                        provider: "deepgram" as const,
                        model: "nova-2",
                        language: "en-US" as const,
                    },
                    recordingEnabled: true,
                    variableValues: {
                        sessionToken: sessionToken
                    },

                }

                console.log(assistantOverrides);

                await vapi.start({
                    model: {
                        provider: "openai",
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `You are an techincal recriter you arer going to conduct techincal interview with following content:
                            ${promptData}`,
                            },
                        ],

                    },
                    voice: {
                        provider: "11labs",
                        model: "eleven_flash_v2_5",
                        voiceId: "burt"
                    } as ElevenLabsVoice,
                    firstMessage: "Hello I am burt I am going to conduct you interview."
                }, assistantOverrides)


            }


            // Start the duration timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error("Failed to start interview:", error)
            setCallStatus("inactive")
        }
    }

    // End the interview
    const endInterview = async () => {
        // Prevent multiple calls to this function
        if (endingInterviewRef.current) return

        endingInterviewRef.current = true
        try {
            setCallStatus("loading")
            vapi.stop()

            // apiClient.post(`/end-interview/${sessionToken}`)

            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            setTimeout(() => {
                router.push(`/interview-summary/${interviewId}`)
            }, 1500)

        }
        catch (err) {
            console.log(err)
        }
    }
    // Handle Vapi's call-end event separately
    const handleVapiCallEnd = () => {
        if (!endingInterviewRef.current) {
            endInterview()
        } else {
            // Call already ending, just perform navigation after delay

            router.push("/interview-summary")

        }
    }

    // Toggle mute
    const toggleMute = () => {
        if (isMuted) {
            vapi.setMuted(false)
        } else {
            vapi.setMuted(true)
        }
        setIsMuted(!isMuted)
    }

    // Set up Vapi event listeners
    useEffect(() => {
        vapi.on("call-start", () => {
            setCallStatus("active")
        })


        if (promptData) {
            vapi.say("Hey I am burt I am your interviewer", false)

        }
        vapi.on("call-end", handleVapiCallEnd)

        vapi.on("error", (e) => {
            setError(e);
            console.error(e);
        });



        return () => {
            vapi.removeAllListeners()
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])


    // If session validation is still in progress, show a loader.
    if (sessionValid === null) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center h-full"
            >
                <h1>Validating Your session</h1>
                <Loader2 className="h-8 w-8 animate-spin text-[#F39C12]" />
            </motion.div>
        )
    }

    // If the session is not valid, show an expired session message and a button to create a new interview.
    if (sessionValid === false) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center h-full"
            >
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <p className="text-gray-300">Session has expired.</p>
                    <Button
                        onClick={() => router.push("/")}
                        className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
                    >
                        Create New Interview
                    </Button>
                </div>
            </motion.div>
        )
    }

    return (

        <div className="flex flex-col h-full">
            {/* Timer (top right) */}
            {callStatus !== "inactive" && (
                <div className="absolute top-8 right-8 flex items-center space-x-2 z-20">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-white font-mono">{formatDuration(duration)}</span>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {callStatus === "inactive" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <p className="text-gray-300 mb-8">Start a new chat to use advanced voice</p>
                        <Button
                            onClick={startInterview}
                            className="bg-white hover:bg-gray-100 text-gray-900 w-16 h-16 rounded-full p-0"
                        >
                            <Mic className="h-8 w-8" />
                        </Button>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center space-y-8">
                        {/* Voice visualization circle */}
                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [1, 0.5, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 bg-white/10 rounded-full"
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [1, 0, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                    delay: 0.5,
                                }}
                                className="absolute inset-0 bg-white/5 rounded-full"
                            />
                            <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center">
                                {callStatus === "loading" ? (
                                    <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
                                ) : (
                                    <div className="text-gray-900 text-lg font-medium">AI</div>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                    "w-12 h-12 rounded-full border-2",
                                    isMuted
                                        ? "border-red-500 bg-red-500/10 hover:bg-red-500/20"
                                        : "border-white/20 bg-white/10 hover:bg-white/20",
                                )}
                                onClick={toggleMute}
                            >
                                {isMuted ? <MicOff className="h-6 w-6 text-red-500" /> : <Mic className="h-6 w-6 text-white" />}
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 rounded-full border-2 border-red-500 bg-red-500/10 hover:bg-red-500/20"
                                onClick={endInterview}
                                disabled={endingInterviewRef.current}

                            >
                                <PhoneOff className="h-6 w-6 text-red-500" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

