"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import apiClient from "../services/api-client"

interface GeneratePromptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (newPrompt: any) => void
}

interface Section {
    part: string;
    question: string;
    follow_up_questions: string[];
}

interface EvaluationCriteria {
    [key: string]: string;
}

interface Content {
    title: string;
    sections: Section[];
    evaluation_criteria: EvaluationCriteria;
}

export function convertJsonToPromptString(content: Content): string {
    let promptString = `Title: ${content.title}\n\n`;

    // Convert sections into text
    content.sections.forEach((section) => {
        promptString += `${section.part}\n`;
        promptString += `Question: ${section.question}\n`;
        if (section.follow_up_questions && section.follow_up_questions.length > 0) {
            promptString += `Follow up questions: ${section.follow_up_questions.join(", ")}\n`;
        }
        promptString += "\n";
    });

    // Convert evaluation criteria into text
    promptString += "Evaluation Criteria:\n";
    for (const [key, value] of Object.entries(content.evaluation_criteria)) {
        // Optional: transform key from snake_case to more readable format
        const formattedKey = key.replace(/_/g, " ");
        promptString += `${formattedKey}: ${value}\n`;
    }

    return promptString;
}




export function GeneratePromptDialog({ open, onOpenChange, onSuccess }: GeneratePromptDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [techStack, setTechStack] = useState("")
    const [difficulty, setDifficulty] = useState("MEDIUM")

    const handleGenerate = async () => {
        if (!techStack) {
            toast({
                title: "Error",
                description: "Please enter a tech stack",
                variant: "destructive",
            })
            return
        }

        setIsGenerating(true)
        try {
            const response = await apiClient.post(
                `/generate-and-store?tech_stack=${techStack}&difficulty=${difficulty}`,
            )

            toast({
                title: "Success",
                description: "AI prompt generated successfully",
            })

            onSuccess({
                prompt_id: response.data.prompt_id,
                content: convertJsonToPromptString(response.data.content),
                tech_stack: techStack,
                difficulty: difficulty.toLowerCase(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.detail || "An error occurred",
                variant: "destructive",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate AI Prompt</DialogTitle>
                    <DialogDescription>Generate a new technical interview prompt using AI</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="tech-stack">Tech Stack</Label>
                        <Input
                            id="tech-stack"
                            placeholder="e.g., React, Node.js, Python"
                            value={techStack}
                            onChange={(e) => setTechStack(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EASY">Easy</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HARD">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                Generating...
                            </>
                        ) : (
                            "Generate Prompt"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

