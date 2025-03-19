import axios from "axios"

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL 

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90000,
})

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        // window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient

