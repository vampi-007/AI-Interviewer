import apiClient from "./api-client"

export interface RegisterResponse {
  hashed_password: string
  role: string
  email: string
  username: string
  user_id: string
  is_active: boolean
  created_at: string
  refresh_token: string | null
}

export interface AuthResponse {
  user_id: string
  access_token: string
  refresh_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try { 
    const response = await apiClient.post<AuthResponse>("/login", { email, password })
    return response.data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function register(username: string, email: string, password: string): Promise<RegisterResponse> {
  try {
    const response = await apiClient.post<RegisterResponse>("/register", { username, email, password })
    return response.data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

