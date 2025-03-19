"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import apiClient from "@/services/api-client"

interface Prompt {
    prompt_id: string
    content: string
    tech_stack: string
    difficulty: "easy" | "medium" | "hard"
    created_at: string
    updated_at: string
}

interface PromptModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "create" | "edit"
    promptId?: string
    onSuccess: (prompt: Prompt) => void
}

export function PromptModal({ open, onOpenChange, mode, promptId, onSuccess }: PromptModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        tech_stack: "",
        difficulty: "",
        content: "",
    })

    // Fetch prompt data if in edit mode
    useEffect(() => {
        if (mode === "edit" && promptId && open) {
            const fetchPrompt = async () => {
                setIsLoading(true)
                try {
                    const response = await apiClient.get(`/${promptId}`)
                    const data: Prompt = response.data
                    setFormData({
                        tech_stack: data.tech_stack,
                        difficulty: data.difficulty,
                        content: data.content,
                    })
                } catch (err) {
                    if ((err as any).response?.data?.detail) {
                        setError((err as any).response.data.detail)
                    } else {
                        setError("An error occurred")
                    }
                } finally {
                    setIsLoading(false)
                }
            }

            fetchPrompt()
        } else if (mode === "create" && open) {
            // Reset form when opening in create mode
            setFormData({
                tech_stack: "",
                difficulty: "",
                content: "",
            })
        }
    }, [mode, promptId, open])

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
            let response

            if (mode === "create") {
                response = await apiClient.post("/self-creation", JSON.stringify(formData))
                toast({
                    title: "Success",
                    description: "Prompt created successfully",
                })
            } else {
                response = await apiClient.put(`/prompts/${promptId}`, formData)
                toast({
                    title: "Success",
                    description: "Prompt updated successfully",
                })
            }

            onSuccess(response.data)
            onOpenChange(false)
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create New Prompt" : "Edit Prompt"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {mode === "create"
                            ? "Add a new technical interview prompt to the database"
                            : "Update the technical interview prompt"}
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39C12]"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">{error}</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tech_stack">Tech Stack</Label>
                            <Input
                                id="tech_stack"
                                name="tech_stack"
                                placeholder="e.g., React, Node.js, Python"
                                value={formData.tech_stack}
                                onChange={handleChange}
                                required
                                className="bg-gray-800 border-gray-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(value) => handleSelectChange("difficulty", value)}
                                required
                            >
                                <SelectTrigger className="bg-gray-800 border-gray-700">
                                    <SelectValue placeholder="Select difficulty level" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
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
                                rows={6}
                                required
                                className="bg-gray-800 border-gray-700"
                            />
                        </div>

                        <DialogFooter className="flex justify-between mt-6">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {mode === "create" ? "Save Prompt" : "Save Changes"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}