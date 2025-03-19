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

interface EditPersonalDetailsDialogProps {
    currentDetails: {
        name: string;
        email: string;
        phone_number: string;
    };
    onEdit: (details: { name: string; email: string; phone_number: string }) => void;
}

export function EditPersonalDetailsDialog({ currentDetails, onEdit }: EditPersonalDetailsDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentDetails.name);
    const [email, setEmail] = useState(currentDetails.email);
    const [phone, setPhone] = useState(currentDetails.phone_number);

    const handleSubmit = () => {
        onEdit({ name, email, phone_number: phone });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Personal Details</DialogTitle>
                    <DialogDescription>Update your name, email, and phone number.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
