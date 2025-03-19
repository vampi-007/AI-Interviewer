"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import apiClient from "../../../../services/api-client"

interface Prompt {
    prompt_id: string
    content: string
    tech_stack: string
    difficulty: "easy" | "medium" | "hard"
    created_at: string
    updated_at: string
}

export default function EditPromptPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const param = useParams()

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        tech_stack: "",
        difficulty: "",
        content: "",
    })

    useEffect(() => {
        const fetchPrompt = async () => {
            setIsLoading(true)
            try {
                const response = await apiClient.get(`/${param.id}`)
                const data: Prompt = response.data
                setFormData({
                    tech_stack: data.tech_stack,
                    difficulty: data.difficulty,
                    content: data.content,
                })
            } catch (err) {
                if ((err as any).response?.data?.detail) {
                    if (err instanceof Error && (err as any).response?.data?.detail) {
                        setError((err as any).response.data.detail)
                    } else {
                        setError("An error occurred")
                    }
                } else {
                    setError("An error occurred")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchPrompt()
    }, [param.id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await apiClient.put(`/prompts/${param.id}`, formData)

            toast({
                title: "Success",
                description: "Prompt updated successfully",
            })

            router.push(`/prompts/${param.id}`)
        } catch (error) {
            toast({
                title: "Error",
                description: (error as any).response?.data?.detail || "An error occurred",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <Button variant="ghost" onClick={() => router.push("/prompts")} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Prompts
                </Button>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-red-500">{error}</div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <Button variant="ghost" onClick={() => router.push(`/prompts/${param.id}`)} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Prompt Details
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Prompt</CardTitle>
                    <CardDescription>Update the technical interview prompt</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tech_stack">Tech Stack</Label>
                            <Input
                                id="tech_stack"
                                name="tech_stack"
                                placeholder="e.g., React, Node.js, Python"
                                value={formData.tech_stack}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(value) => handleSelectChange("difficulty", value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Prompt Content</Label>
                            <Textarea
                                id="content"
                                name="content"
                                placeholder="Enter the prompt content here..."
                                value={formData.content}
                                onChange={handleChange}
                                rows={8}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => router.push(`/prompts/${param.id}`)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

