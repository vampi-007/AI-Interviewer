"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Plus } from "lucide-react"

interface AddSkillDialogProps {
  onAddSkill: (skill: string) => void
}

export function AddSkillDialog({ onAddSkill }: AddSkillDialogProps) {
  const [newSkill, setNewSkill] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim())
      setNewSkill("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Skill</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new skill to your profile. This will be used to personalize your interview.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Enter skill (e.g., React, Python, AWS)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
            disabled={!newSkill.trim()}
          >
            Add Skill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

