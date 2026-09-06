import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

export function getApiErrorMessage(error) {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? error.message
  return 'Something went wrong. Please try again.'
}
