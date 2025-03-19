"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarsBackground } from "@/components/ui/stars-background"
import { useAuth } from "@/context/auth-context"
import { Clock, BarChart2, Award, Calendar } from "lucide-react"

export default function Dashboard() {
    const { username } = useAuth()

    return (
        <div className="min-h-screen bg-gray-950 relative p-6">
            <StarsBackground />
            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Welcome back, {username || "User"}</h1>
                    <p className="text-gray-400 mt-2">Here's an overview of your interview performance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-400 text-sm font-normal flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-[#F39C12]" />
                                Total Interview Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">2h 15m</p>
                            <p className="text-gray-400 text-sm">Across 5 interviews</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-400 text-sm font-normal flex items-center">
                                <BarChart2 className="h-4 w-4 mr-2 text-[#F39C12]" />
                                Average Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">78%</p>
                            <p className="text-gray-400 text-sm">+5% from last interview</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-400 text-sm font-normal flex items-center">
                                <Award className="h-4 w-4 mr-2 text-[#F39C12]" />
                                Top Skill
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">Communication</p>
                            <p className="text-gray-400 text-sm">92% proficiency</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-400 text-sm font-normal flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-[#F39C12]" />
                                Next Interview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-white">Not Scheduled</p>
                            <p className="text-gray-400 text-sm">Click to schedule</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-white">Recent Interviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-white">Frontend Developer Interview</p>
                                        <p className="text-sm text-gray-400">March 5, 2025 • 35 minutes</p>
                                    </div>
                                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">85% Score</div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-white">React Developer Interview</p>
                                        <p className="text-sm text-gray-400">February 28, 2025 • 42 minutes</p>
                                    </div>
                                    <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">72% Score</div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-white">Full Stack Developer Interview</p>
                                        <p className="text-sm text-gray-400">February 20, 2025 • 58 minutes</p>
                                    </div>
                                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">81% Score</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-white">Areas to Improve</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-400">System Design</span>
                                        <span className="text-sm text-gray-400">65%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-400">Algorithm Knowledge</span>
                                        <span className="text-sm text-gray-400">72%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "72%" }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-400">Specific Examples</span>
                                        <span className="text-sm text-gray-400">68%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

