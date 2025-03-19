"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

import ReactMarkdown from "react-markdown"
import { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import apiClient from "@/services/api-client"
import { convertJsonToPromptString } from "./generate-prompt-dialog"
import JSON5 from 'json5';


interface Prompt {
    prompt_id: string
    content: string
    tech_stack: string
    difficulty: "easy" | "medium" | "hard"
    created_at: string
    updated_at: string
}

interface ViewPromptModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    promptId?: string
    onEdit: (promptId: string) => void
    onDelete: (promptId: string) => void
}

export function ViewPromptModal({ open, onOpenChange, promptId, onEdit, onDelete }: ViewPromptModalProps) {
    const [prompt, setPrompt] = useState<Prompt | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open || !promptId) return

        const fetchPrompt = async () => {
            setIsLoading(true)
            try {
                const response = await apiClient.get(`/${promptId}`)
                console.log(response.data.content);
                setPrompt(response.data)
                setError(null)
            } catch (err) {
                if (err instanceof Error && (err as any).response?.data?.detail) {
                    setError((err as any).response.data.detail)
                } else {
                    setError("An error occurred")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchPrompt()
    }, [promptId, open])

    // Get difficulty badge color
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case "easy":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            case "medium":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
            case "hard":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {isLoading ? (
                        <DialogTitle>Loading prompt...</DialogTitle>
                    ) : error ? (
                        <DialogTitle className="text-red-500">{error}</DialogTitle>
                    ) : prompt ? (
                        <div className="flex justify-between items-center">
                            <DialogTitle className="text-2xl">{prompt.tech_stack} Prompt</DialogTitle>
                            <Badge className={getDifficultyColor(prompt.difficulty)}>
                                {prompt.difficulty.charAt(0).toUpperCase() + prompt.difficulty.slice(1)}
                            </Badge>
                        </div>
                    ) : null}
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39C12]"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 p-4">{error}</div>
                ) : prompt ? (
                    <>
                        <CardContent className="p-0">
                            <div className="p-4 bg-gray-800 rounded-md">
                                <div className="prose dark:prose-invert max-w-none">

                                    {convertJsonToPromptString(JSON5.parse(prompt.content))}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between px-0 pb-0">
                            <div className="text-sm text-gray-400">
                                Created: {new Date(prompt.created_at).toLocaleDateString()}
                                <br />
                                Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => onEdit(prompt.prompt_id)}
                                    className="border-gray-700 hover:bg-gray-800"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => onDelete(prompt.prompt_id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </CardFooter>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}