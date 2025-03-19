"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { login, register } from "@/services/auth-service"
import Cookies from "js-cookie"

interface AuthState {
  userId: string | null
  username: string | null
  email: string | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

interface AuthContextType {
  userId: string | null
  username: string | null
  email: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    username: null,
    email: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const authToken = Cookies.get("auth_token")
    const userId = Cookies.get("user_id")
    const username = Cookies.get("username")
    const email = Cookies.get("email")

    if (authToken && userId) {
      setAuthState({
        userId,
        username: username || null,
        email: email || null,
        accessToken: authToken,
        refreshToken: Cookies.get("refresh_token") || null,
        isAuthenticated: true,
      })
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {

      const response = await login(email, password)
      console.log(response);
      // Set cookies with appropriate expiry
      Cookies.set("auth_token", response.access_token, { expires: 7 }) // 7 days
      Cookies.set("refresh_token", response.refresh_token, { expires: 30 }) // 30 days
      Cookies.set("email", email)
      Cookies.set("username", email.split("@")[0])

      localStorage.setItem("auth_token", response.access_token)
      localStorage.setItem("user_id", response.user_id)

      const newAuthState = {
        userId: response.user_id,
        username: email.split("@")[0],
        email,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
      }

      setAuthState(newAuthState)

      // Redirect to the resume upload page instead of interview-prep
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await register(username, email, password)

      // Store user_id for later use
      localStorage.setItem("userId", response.user_id)

      // After successful registration, redirect to login
      router.push("/auth/login")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear auth state
    setAuthState({
      userId: null,
      username: null,
      email: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })

    // Clear all cookies
    Cookies.remove("auth_token")
    Cookies.remove("refresh_token")
    Cookies.remove("user_id")
    Cookies.remove("email")
    Cookies.remove("username")

    // Clear localStorage
    localStorage.removeItem("userId")

    router.push("/auth/login")
  }

  return (
    <AuthContext.Provider
      value={{
        userId: authState.userId,
        username: authState.username,
        email: authState.email,
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

