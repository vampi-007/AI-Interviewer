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

interface Experience {
  job_title: string
  company_name: string
  start_date: string
  end_date: string
}

interface AddExperienceDialogProps {
  onAddExperience: (experience: Experience) => void
}

export function AddExperienceDialog({ onAddExperience }: AddExperienceDialogProps) {
  const [experience, setExperience] = useState<Experience>({
    job_title: "",
    company_name: "",
    start_date: "",
    end_date: "",
  })
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    if (experience.job_title && experience.company_name && experience.start_date) {
      onAddExperience(experience)
      setExperience({
        job_title: "",
        company_name: "",
        start_date: "",
        end_date: "",
      })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Experience
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add Experience</DialogTitle>
          <DialogDescription className="text-gray-400">Add your work experience details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Job Title"
            value={experience.job_title}
            onChange={(e) => setExperience({ ...experience, job_title: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Input
            placeholder="Company Name"
            value={experience.company_name}
            onChange={(e) => setExperience({ ...experience, company_name: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="month"
              placeholder="Start Date"
              value={experience.start_date}
              onChange={(e) => setExperience({ ...experience, start_date: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              type="month"
              placeholder="End Date"
              value={experience.end_date}
              onChange={(e) => setExperience({ ...experience, end_date: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
            disabled={!experience.job_title || !experience.company_name || !experience.start_date}
          >
            Add Experience
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

