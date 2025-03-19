"use client"

import { useState, useEffect, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeletePromptDialog } from "@/components/delete-prompt-dialog"
import apiClient from "../../../services/api-client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"


interface Prompt {
    prompt_id: string
    content: string
    tech_stack: string
    difficulty: "easy" | "medium" | "hard"
    created_at: string
    updated_at: string
}

export default function PromptDetailsPage({ params }: { params: { id: string } }) {
    const param = useParams()

    const router = useRouter()
    const [prompt, setPrompt] = useState<Prompt | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    useEffect(() => {
        if (!param.id) return // ✅ Avoid fetching if `params.id` is undefined

        const fetchPrompt = async () => {
            setIsLoading(true)
            try {
                const response = await apiClient.get(`/${param.id}`)
                setPrompt(response.data)
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
    }, [param.id])

    const handleDeletePrompt = async () => {
        try {
            await apiClient.delete(`/${param.id}`)
            router.push("/prompts")
        } catch (err) {
            if (err instanceof Error && (err as any).response?.data?.detail) {
                setError((err as any).response.data.detail)
            } else {
                setError("An error occurred while deleting")
            }
        }
    }

    // Get difficulty badge color
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
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

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    if (error || !prompt) {
        return (
            <div className="container mx-auto py-6">
                <Button variant="ghost" onClick={() => router.push("/prompts")} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Prompts
                </Button>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-red-500">{error || "Prompt not found"}</div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <Button variant="ghost" onClick={() => router.push("/prompts")} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Prompts
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{prompt.tech_stack} Prompt</CardTitle>
                            <CardDescription>Created on {new Date(prompt.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                        <Badge className={getDifficultyColor(prompt.difficulty)}>
                            {prompt.difficulty.charAt(0).toUpperCase() + prompt.difficulty.slice(1)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-md">
                        <div className="prose dark:prose-invert">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }: { node?: any, inline?: boolean, className?: string, children?: React.ReactNode }) {
                                        return !inline ? (
                                            <SyntaxHighlighter
                                                style={dracula}
                                                language="javascript"
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                }}
                            >
                                {prompt.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                        Last updated: {new Date(prompt.updated_at).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push(`/prompts/${prompt.prompt_id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Delete Confirmation Dialog */}
            <DeletePromptDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                promptId={prompt.prompt_id}
                onConfirm={handleDeletePrompt}
            />
        </div>
    )
}

