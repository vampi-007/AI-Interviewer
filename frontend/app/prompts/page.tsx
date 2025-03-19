"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusCircle, Filter, Trash2, Edit, Eye, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { DeletePromptDialog } from "@/components/delete-prompt-dialog"
import { GeneratePromptDialog } from "@/components/generate-prompt-dialog"
import { PromptModal } from "@/components/PromptModal"
import { ViewPromptModal } from "@/components/ViewPromptModal" // Import the new ViewPromptModal component
import apiClient from "../../services/api-client"
import { useToast } from "@/hooks/use-toast"


// Types based on your API
interface Prompt {
    prompt_id: string
    content: string
    tech_stack: string
    difficulty: "easy" | "medium" | "hard"
    created_at: string
    updated_at: string
}

export default function PromptsPage() {
    const { toast } = useToast()

    const router = useRouter()
    const searchParams = useSearchParams()

    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [techStackFilter, setTechStackFilter] = useState<string>("")
    const [difficultyFilter, setDifficultyFilter] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
    const [promptToDelete, setPromptToDelete] = useState<string | null>(null)
    const [uniqueTechStacks, setUniqueTechStacks] = useState<string[]>([])

    // State for prompt modals
    const [promptModalOpen, setPromptModalOpen] = useState(false)
    const [promptModalMode, setPromptModalMode] = useState<"create" | "edit">("create")
    const [promptToEdit, setPromptToEdit] = useState<string | null>(null)

    // New state for view prompt modal
    const [viewPromptModalOpen, setViewPromptModalOpen] = useState(false)
    const [viewPromptId, setViewPromptId] = useState<string | null>(null)

    // Fetch prompts
    useEffect(() => {
        const fetchPrompts = async () => {
            setIsLoading(true)
            try {
                // Ensure skip and limit are integers
                const skip = Math.max(0, Number.parseInt(String((page - 1) * limit), 10))
                const limitValue = Math.min(1000, Math.max(1, Number.parseInt(String(limit), 10))) // Ensuring within range

                // Construct query parameters properly for FastAPI
                const params: Record<string, string | number> = { skip, limit: limitValue }

                let url = "/"

                // Add filters if they exist
                if (techStackFilter && difficultyFilter) {
                    url = "/tech-stack"
                    params.tech_stack = techStackFilter
                    params.difficulty = difficultyFilter
                }

                // Send request to FastAPI
                const response = await apiClient.get(url, { params })
                setPrompts(response.data)

                // Extract unique tech stacks for filter dropdown
                const techStacks = [...new Set(response.data.map((prompt: Prompt) => prompt.tech_stack))] as string[]
                setUniqueTechStacks(techStacks)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
                toast({
                    title: "Error",
                    description: err?.toString() || "An error occurred during login",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchPrompts()
    }, [page, limit, techStackFilter, difficultyFilter])

    // Filter prompts by search query
    const filteredPrompts = prompts.filter(
        (prompt) =>
            prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prompt.tech_stack.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Handle prompt deletion
    const handleDeletePrompt = async (promptId: string) => {
        try {
            const response = await apiClient.delete(`/${promptId}`)

            // Remove the deleted prompt from the state
            setPrompts(prompts.filter((prompt) => prompt.prompt_id !== promptId))
            setDeleteDialogOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred while deleting")
        }
    }

    // Handle modal opening for create/edit
    const openCreateModal = () => {
        setPromptModalMode("create")
        setPromptToEdit(null)
        setPromptModalOpen(true)
    }

    const openEditModal = (promptId: string) => {
        setPromptModalMode("edit")
        setPromptToEdit(promptId)
        setPromptModalOpen(true)
    }

    // NEW: Handle opening the view modal
    const openViewModal = (promptId: string) => {
        setViewPromptId(promptId)
        setViewPromptModalOpen(true)
    }

    // Handle prompt success (create/edit)
    const handlePromptSuccess = (prompt: Prompt) => {
        if (promptModalMode === "create") {
            // Add new prompt to the top of the list
            setPrompts([prompt, ...prompts])
        } else {
            // Update the edited prompt in the list
            setPrompts(prompts.map(p =>
                p.prompt_id === prompt.prompt_id ? prompt : p
            ))
        }
    }

    const clearFilters = () => {
        setTechStackFilter("")
        setDifficultyFilter("")
        setSearchQuery("")
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

    return (
        <div className="container mx-auto py-6 bg-gray-950 min-h-screen text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Prompts Management</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate AI Prompt
                    </Button>
                    <Button onClick={openCreateModal} className="bg-[#F39C12] hover:bg-[#E67E22] text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Prompt
                    </Button>
                </div>
            </div>

            <Card className="mb-6 bg-gray-900/70 border-gray-800">
                <CardHeader>
                    <CardTitle>Filter Prompts</CardTitle>
                    <CardDescription className="text-gray-400">
                        Filter prompts by tech stack, difficulty, or search for specific content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Select value={techStackFilter} onValueChange={setTechStackFilter}>
                                <SelectTrigger className="bg-gray-800 border-gray-700">
                                    <SelectValue placeholder="Select Tech Stack" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    {uniqueTechStacks.map((tech) => (
                                        <SelectItem key={tech} value={tech}>
                                            {tech}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                <SelectTrigger className="bg-gray-800 border-gray-700">
                                    <SelectValue placeholder="Select Difficulty" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Input
                                placeholder="Search prompts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-800 border-gray-700"
                            />
                        </div>
                        <Button
                            onClick={clearFilters}
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-900/70 border-gray-800">
                <CardHeader>
                    <CardTitle>Prompts</CardTitle>
                    <CardDescription className="text-gray-400">Manage your technical interview prompts</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39C12]"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-4">{error}</div>
                    ) : filteredPrompts.length === 0 ? (
                        <div className="text-center p-4">
                            <p className="text-gray-400">No prompts found. Create a new prompt or adjust your filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-800">
                                            <TableHead>Tech Stack</TableHead>
                                            <TableHead>Difficulty</TableHead>
                                            <TableHead className="w-[40%]">Content</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPrompts.map((prompt) => (
                                            <TableRow key={prompt.prompt_id} className="border-gray-800">
                                                <TableCell className="font-medium">{prompt.tech_stack}</TableCell>
                                                <TableCell>
                                                    <Badge className={getDifficultyColor(prompt.difficulty)}>
                                                        {prompt.difficulty.charAt(0).toUpperCase() + prompt.difficulty.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {prompt.content.length > 100 ? `${prompt.content.substring(0, 100)}...` : prompt.content}
                                                </TableCell>
                                                <TableCell>{new Date(prompt.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="hover:bg-gray-800">
                                                                <span className="sr-only">Open menu</span>
                                                                <Filter className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                                            <DropdownMenuItem
                                                                onClick={() => openViewModal(prompt.prompt_id)}
                                                                className="hover:bg-gray-700"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openEditModal(prompt.prompt_id)}
                                                                className="hover:bg-gray-700"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setPromptToDelete(prompt.prompt_id)
                                                                    setDeleteDialogOpen(true)
                                                                }}
                                                                className="text-red-400 hover:bg-gray-700 hover:text-red-300"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            {page === 1 ? (
                                                <PaginationLink isActive={false} className="text-gray-500">
                                                    Previous
                                                </PaginationLink>
                                            ) : (
                                                <PaginationLink onClick={() => setPage(page - 1)} className="text-gray-300 hover:text-white">
                                                    Previous
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationLink isActive className="bg-[#F39C12] text-white">
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationLink onClick={() => setPage(page + 1)} className="text-gray-300 hover:text-white">
                                                Next
                                            </PaginationLink>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Prompt Modal (Create/Edit) */}
            <PromptModal
                open={promptModalOpen}
                onOpenChange={setPromptModalOpen}
                mode={promptModalMode}
                promptId={promptToEdit || undefined}
                onSuccess={handlePromptSuccess}
            />

            {/* NEW: View Prompt Modal */}
            <ViewPromptModal
                open={viewPromptModalOpen}
                onOpenChange={setViewPromptModalOpen}
                promptId={viewPromptId || undefined}
                onEdit={(id) => {
                    setViewPromptModalOpen(false);
                    openEditModal(id);
                }}
                onDelete={(id) => {
                    setViewPromptModalOpen(false);
                    setPromptToDelete(id);
                    setDeleteDialogOpen(true);
                }}
            />

            {/* Delete Confirmation Dialog */}
            <DeletePromptDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                promptId={promptToDelete}
                onConfirm={() => promptToDelete && handleDeletePrompt(promptToDelete)}
            />

            {/* Generate AI Prompt Dialog */}
            <GeneratePromptDialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
                onSuccess={(newPrompt) => {
                    setPrompts([newPrompt, ...prompts])
                    setGenerateDialogOpen(false)
                }}
            />
        </div>
    )
}