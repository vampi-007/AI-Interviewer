"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, User, Briefcase, Edit2, AlertCircle, Calendar, Lock, Key, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import apiClient from "@/services/api-client"
import { useToast } from "@/hooks/use-toast"


interface UserData {
    user_id: string
    username: string
    email: string
    role: string
}

export default function ProfilePage() {
    const { toast } = useToast()
    const [userInfo, setUserInfo] = useState<UserData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(false)
    const [passwordResetSuccess, setPasswordResetSuccess] = useState<boolean>(false)

    // Password reset form state
    const [currentPassword, setCurrentPassword] = useState<string>("")
    const [newPassword, setNewPassword] = useState<string>("")
    const [confirmPassword, setConfirmPassword] = useState<string>("")
    const [passwordError, setPasswordError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get userId from localStorage - ensure this runs only on client side
                const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null

                if (!userId) {
                    setError("User ID not found. Please log in again.")
                    setLoading(false)
                    return
                }

                const response = await apiClient.get(`/users/${userId}`)
                setUserInfo(response.data)
            } catch (err) {
                console.error(err)
                setError("Failed to load user information. Please try again later.")
                toast({
                    title: "Error",
                    description: err?.toString() || "An error occurred during login",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchUserInfo()
    }, [])

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase()
    }

    // Role badge color based on role
    const getRoleBadgeColor = (role: string) => {
        const roleMap: Record<string, string> = {
            administrator:
                "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 dark:from-purple-950 dark:to-purple-900 dark:text-purple-300",
            moderator:
                "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-950 dark:to-blue-900 dark:text-blue-300",
            editor:
                "bg-gradient-to-r from-green-50 to-green-100 text-green-700 dark:from-green-950 dark:to-green-900 dark:text-green-300",
            user: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 dark:from-gray-900 dark:to-gray-800 dark:text-gray-300",
        }

        return (
            roleMap[role?.toLowerCase()] ||
            "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 dark:from-gray-900 dark:to-gray-800 dark:text-gray-300"
        )
    }

    const handleResetPassword = async () => {
        // Validate passwords
        setPasswordError(null)

        if (!currentPassword) {
            setPasswordError("Current password is required")
            return
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters")
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match")
            return
        }

        try {
            const token = localStorage.getItem("auth_token")
            console.log(token)
            const response = await apiClient.post(`/reset-pass-profile?token=${token}&current_password=${currentPassword}&new_password=${newPassword}`)
            console.log(response)
            if (response.data) {

                setPasswordResetSuccess(true)

            }
            // Simulate API call

            // Show success message

            // Reset form
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")

            // Close dialog after 2 seconds
            setTimeout(() => {
                setIsResetPasswordOpen(false)
                setPasswordResetSuccess(false)
            }, 2000)
        } catch (err) {
            console.error(err)
            setPasswordError("Failed to reset password. Please try again.")
            toast({
                title: "Error",
                description: err?.toString() || "An error occurred during login",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header Banner */}
            <div className="w-full h-64 bg-gradient-to-r from-indigo-400 to-blue-500 dark:from-indigo-900 dark:to-blue-800 relative">
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1600')] bg-cover bg-center opacity-10"></div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Profile Section */}
                <div className="relative -mt-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Avatar and Basic Info */}
                        <div className="bg-white dark:bg-slate-900 shadow-lg rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950 h-24"></div>
                            <div className="px-6 pb-6 relative">
                                {/* Avatar */}
                                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 ring-4 ring-white dark:ring-slate-800 rounded-full">
                                    {loading ? (
                                        <Skeleton className="h-32 w-32 rounded-full" />
                                    ) : (
                                        <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-800 shadow-md">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/micah/svg?seed=${userInfo?.username}`}
                                                alt={userInfo?.username}
                                            />
                                            <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-400 to-blue-500 text-white">
                                                {userInfo?.username ? getInitials(userInfo.username) : "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                {/* Basic Info */}
                                <div className="mt-20 text-center space-y-3">
                                    {loading ? (
                                        <>
                                            <Skeleton className="h-8 w-3/4 mx-auto" />
                                            <Skeleton className="h-4 w-1/2 mx-auto" />
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                                {userInfo?.username}
                                            </h1>
                                            <Badge
                                                variant="outline"
                                                className={`${getRoleBadgeColor(userInfo?.role || "user")} border-0 font-medium`}
                                            >
                                                {userInfo?.role}
                                            </Badge>
                                        </>
                                    )}
                                </div>

                                {/* User Actions */}
                                <div className="mt-6 space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start group transition-all duration-300"
                                        onClick={() => setIsResetPasswordOpen(true)}
                                    >
                                        <Lock className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                                        Reset Password
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start group transition-all duration-300"
                                        onClick={() => setIsEditing(!isEditing)}
                                    >
                                        <Edit2 className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                                        Edit Profile
                                    </Button>
                                </div>

                                {/* Membership Info */}
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Calendar className="h-4 w-4" />
                                    <span>Member since {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Detailed Info */}
                        <div className="bg-white dark:bg-slate-900 shadow-lg rounded-xl p-6 lg:col-span-2">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Profile Information</h2>
                            </div>

                            {/* User Details */}
                            {loading ? (
                                <div className="space-y-6">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* User ID */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-all duration-300 hover:shadow-md">
                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-300">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">User ID</p>
                                                <p className="font-medium text-lg">{userInfo?.user_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-all duration-300 hover:shadow-md">
                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-300">
                                                <Mail className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
                                                <p className="font-medium text-lg">{userInfo?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-all duration-300 hover:shadow-md">
                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-300">
                                                <Briefcase className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</p>
                                                <p className="font-medium text-lg">{userInfo?.role}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Status */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 transition-all duration-300 hover:shadow-md">
                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-300">
                                                <Key className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</p>
                                                <p className="font-medium text-lg">Active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Section */}
                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Recent Activity</h3>

                                {loading ? (
                                    <div className="space-y-3">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                        <p className="text-center text-slate-500 dark:text-slate-400 py-6">No recent activity to display</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and a new password to update your account.
                        </DialogDescription>
                    </DialogHeader>

                    {passwordResetSuccess ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-medium">Password Updated Successfully</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Your password has been changed. You'll be redirected shortly.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 py-2">
                                {passwordError && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{passwordError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter your new password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your new password"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex space-x-2 sm:justify-end">
                                <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleResetPassword}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Update Password
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

