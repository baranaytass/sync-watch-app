/**
 * Unified API utility for consistent authentication across the application
 * Handles both cookie-based and token-based authentication automatically
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('onrender.com') || window.location.hostname === 'staysync.baranaytas.com' 
    ? 'https://sync-watch-backend.onrender.com' 
    : 'http://localhost:3000')

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  timeout?: number
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    error: string
    message: string
  }
}

/**
 * Creates authenticated request headers with fallback strategy:
 * 1. Try Authorization header from localStorage (production compatible)
 * 2. Fall back to cookie authentication (local development)
 */
function createAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Try JWT token from localStorage first (production compatibility)
  const authToken = localStorage.getItem('auth_token')
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  return headers
}

/**
 * Unified API request function with consistent authentication
 * @param endpoint - API endpoint (without base URL)
 * @param options - Request options
 * @returns Promise with typed response
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers: customHeaders = {}, timeout = 30000 } = options
  
  const url = `${API_BASE_URL}${endpoint}`
  const authHeaders = createAuthHeaders()
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      ...authHeaders,
      ...customHeaders,
    },
    credentials: 'include', // Always include for cookie fallback
  }
  
  if (method !== 'GET') {
    // Always include body for non-GET requests to satisfy Content-Type: application/json
    const requestBody = body || {}
    requestOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result: ApiResponse<T> = await response.json()
    return result
    
  } catch (error) {
    console.error(`API Request Failed [${method} ${endpoint}]:`, error)
    throw error
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
    
  put: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
    
  delete: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Debug logging utility
 */
export function logApiCall(endpoint: string, method: string, hasAuthToken: boolean) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 API Call: ${method} ${endpoint}`, { hasAuthToken })
  }
}