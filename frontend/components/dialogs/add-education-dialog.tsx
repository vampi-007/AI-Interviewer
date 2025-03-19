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

interface Education {
  degree: string
  institution: string
  start_date: string
  end_date: string
}

interface AddEducationDialogProps {
  onAddEducation: (education: Education) => void
}

export function AddEducationDialog({ onAddEducation }: AddEducationDialogProps) {
  const [education, setEducation] = useState<Education>({
    degree: "",
    institution: "",
    start_date: "",
    end_date: "",
  })
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    if (education.degree && education.institution && education.start_date) {
      onAddEducation(education)
      setEducation({
        degree: "",
        institution: "",
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
          <Plus className="h-4 w-4" /> Add Education
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add Education</DialogTitle>
          <DialogDescription className="text-gray-400">Add your educational background details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Degree"
            value={education.degree}
            onChange={(e) => setEducation({ ...education, degree: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Input
            placeholder="Institution"
            value={education.institution}
            onChange={(e) => setEducation({ ...education, institution: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="month"
              placeholder="Start Date"
              value={education.start_date}
              onChange={(e) => setEducation({ ...education, start_date: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              type="month"
              placeholder="End Date"
              value={education.end_date}
              onChange={(e) => setEducation({ ...education, end_date: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="bg-[#F39C12] hover:bg-[#E67E22] text-white"
            disabled={!education.degree || !education.institution || !education.start_date}
          >
            Add Education
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

