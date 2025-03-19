"use client"
import { BackgroundBeams } from "@/components/background-beams";
import InterviewSelection from "@/components/interview-selection";
import { StarsBackground } from "@/components/ui/stars-background";

export default function InterviewType() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-gray-950">
            <StarsBackground />

            <div className="container relative z-10 px-4">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">Choose Type Of Interview</h1>
                <InterviewSelection />
            </div>
            {/* <BackgroundBeams className="opacity-80" /> */}
        </main>
    )
}
