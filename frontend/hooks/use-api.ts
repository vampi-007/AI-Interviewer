"use client"

import { useState } from "react"
import axios from "axios"

// Create an axios instance with default config
const baseURL = "http://localhost:8000"
export const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Create an authenticated API instance
export const createAuthenticatedApi = () => {
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  return axios.create({
    baseURL: baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  })
}

// Get the authenticated API instance
export const getAuthApi = () => {
  return createAuthenticatedApi()
}

interface UseApiOptions<T> {
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

// Generic fetch hook for GET requests
export function useApiGet<T>(url: string, options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | undefined>(options.initialData)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<T>(url)
      setData(response.data)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, refetch: fetchData }
}

// Hook for authenticated GET requests
export function useAuthApiGet<T>(url: string, options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | undefined>(options.initialData)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const authApi = getAuthApi()
      const response = await authApi.get<T>(url)
      setData(response.data)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, refetch: fetchData }
}

// Hook for POST requests
export function useApiPost<T, D = any>() {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const postData = async (url: string, postData: D, options: UseApiOptions<T> = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post<T>(url, postData)
      setData(response.data)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, postData }
}

// Hook for authenticated POST requests
export function useAuthApiPost<T, D = any>() {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const postData = async (url: string, postData: D, options: UseApiOptions<T> = {}) => {
    setLoading(true)
    setError(null)

    try {
      const authApi = getAuthApi()
      const response = await authApi.post<T>(url, postData)
      setData(response.data)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, postData }
}

// Hook for form data POST requests (file uploads)
export function useApiFormPost<T>() {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const postFormData = async (url: string, formData: FormData, options: UseApiOptions<T> = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post<T>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setData(response.data)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, postFormData }
}

// Hook for authenticated form data POST requests
export function useAuthApiFormPost<T>() {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const postFormData = async (url: string, formData: FormData, options: UseApiOptions<T> = {}) => {
    setLoading(true)
    setError(null)

    try {
      const authApi = getAuthApi()
      const response = await authApi.post<T>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setData(response.data)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      if (options.onError) {
        options.onError(error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, postFormData }
}

