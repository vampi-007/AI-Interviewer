"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { FileText, Code } from "lucide-react"
import Link from "next/link"

export default function InterviewSelection() {
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Link href="/interview" className="block">
                <Card
                    className={`relative h-80 flex flex-col items-center justify-center p-8 transition-all duration-300 overflow-hidden border-2 ${hoveredCard === "resume"
                        ? "border-[#F39C12] shadow-lg shadow-[#F39C12]/20 scale-[1.02]"
                        : "border-gray-800 shadow-md"
                        }`}
                    onMouseEnter={() => setHoveredCard("resume")}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <div
                        className={`absolute inset-0 bg-gradient-to-br from-gray-900/90 to-gray-800/90 transition-opacity duration-300 ${hoveredCard === "resume" ? "opacity-100" : "opacity-90"
                            }`}
                    />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div
                            className={`mb-6 p-4 rounded-full bg-[#F39C12]/20 transition-all duration-300 ${hoveredCard === "resume" ? "scale-110" : ""
                                }`}
                        >
                            <FileText className="h-12 w-12 text-[#F39C12]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white">Resume Interview</h2>
                        <p className="text-gray-300 max-w-xs">
                            Practice answering questions about your resume, work experience, and career journey.
                        </p>
                    </div>

                    <div
                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#E67E22] to-[#F39C12] transition-all duration-500 ${hoveredCard === "resume" ? "w-full" : "w-0"
                            }`}
                    />
                </Card>
            </Link>

            <Link href="/tech-stack-interview" className="block">
                <Card
                    className={`relative h-80 flex flex-col items-center justify-center p-8 transition-all duration-300 overflow-hidden border-2 ${hoveredCard === "tech"
                        ? "border-[#F39C12] shadow-lg shadow-[#F39C12]/20 scale-[1.02]"
                        : "border-gray-800 shadow-md"
                        }`}
                    onMouseEnter={() => setHoveredCard("tech")}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <div
                        className={`absolute inset-0 bg-gradient-to-br from-gray-900/90 to-gray-800/90 transition-opacity duration-300 ${hoveredCard === "tech" ? "opacity-100" : "opacity-90"
                            }`}
                    />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div
                            className={`mb-6 p-4 rounded-full bg-[#F39C12]/20 transition-all duration-300 ${hoveredCard === "tech" ? "scale-110" : ""
                                }`}
                        >
                            <Code className="h-12 w-12 text-[#F39C12]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white">Tech Stack Interview</h2>
                        <p className="text-gray-300 max-w-xs">
                            Test your knowledge on specific technologies, frameworks, and technical concepts.
                        </p>
                    </div>

                    <div
                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#E67E22] to-[#F39C12] transition-all duration-500 ${hoveredCard === "tech" ? "w-full" : "w-0"
                            }`}
                    />
                </Card>
            </Link>
        </div>
    )
}

