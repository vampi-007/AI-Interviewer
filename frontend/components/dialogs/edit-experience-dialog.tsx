"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Experience {
    job_title: string;
    company_name: string;
    start_date: string;
    end_date: string;
}

interface EditExperienceDialogProps {
    index: number;
    currentExperience: Experience;
    onEditExperience: (index: number, updatedExperience: Experience) => void;
}

export function EditExperienceDialog({ index, currentExperience, onEditExperience }: EditExperienceDialogProps) {
    const [open, setOpen] = useState(false);
    const [jobTitle, setJobTitle] = useState(currentExperience.job_title);
    const [companyName, setCompanyName] = useState(currentExperience.company_name);
    const [startDate, setStartDate] = useState(currentExperience.start_date);
    const [endDate, setEndDate] = useState(currentExperience.end_date);

    const handleSubmit = () => {
        onEditExperience(index, {
            job_title: jobTitle,
            company_name: companyName,
            start_date: startDate,
            end_date: endDate,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Experience</DialogTitle>
                    <DialogDescription>Update your experience details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input id="job_title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input id="company_name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input id="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="end_date">End Date</Label>
                        <Input id="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
