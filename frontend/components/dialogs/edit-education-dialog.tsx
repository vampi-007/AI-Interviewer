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

interface Education {
    degree: string;
    institution: string;
    start_date: string;
    end_date: string;
}

interface EditEducationDialogProps {
    currentEducation: Education;
    onEditEducation: (education: Education) => void;
}

export function EditEducationDialog({ currentEducation, onEditEducation }: EditEducationDialogProps) {
    const [open, setOpen] = useState(false);
    const [degree, setDegree] = useState(currentEducation.degree);
    const [institution, setInstitution] = useState(currentEducation.institution);
    const [startDate, setStartDate] = useState(currentEducation.start_date);
    const [endDate, setEndDate] = useState(currentEducation.end_date);

    const handleSubmit = () => {
        onEditEducation({ degree, institution, start_date: startDate, end_date: endDate });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Education</DialogTitle>
                    <DialogDescription>Update your education details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="degree">Degree</Label>
                        <Input id="degree" value={degree} onChange={(e) => setDegree(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="institution">Institution</Label>
                        <Input id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} />
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
