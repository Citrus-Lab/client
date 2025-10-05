import axios from 'axios'

export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    timeout: 30000, // 30 seconds timeout
    endpoints: {
        chat: '/api/chat',
        models: '/api/models',
        health: '/api/health'
    }
}

// Create axios instance
const apiClient = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`)
        return config
    },
    (error) => {
        console.error('Request error:', error)
        return Promise.reject(error)
    }
)

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}:`, response.status)
        return response
    },
    (error) => {
        console.error('Response error:', error.response?.data || error.message)
        return Promise.reject(error)
    }
)

// API methods
export const api = {
    // Chat endpoint
    chat: async (message, model, mode = 'manual') => {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.chat, {
                message,
                model,
                mode,
                timestamp: new Date().toISOString()
            })
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to send message')
        }
    },

    // Get available models
    getModels: async () => {
        try {
            const response = await apiClient.get(API_CONFIG.endpoints.models)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch models')
        }
    },

    // Health check
    healthCheck: async () => {
        try {
            const response = await apiClient.get(API_CONFIG.endpoints.health)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Backend not available')
        }
    },

    // Template APIs
    templates: {
        // Create new template
        create: async (templateData) => {
            try {
                const response = await apiClient.post('/api/templates', templateData)
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to create template')
            }
        },

        // Get user's templates
        getUserTemplates: async (params = {}) => {
            try {
                const response = await apiClient.get('/api/templates/my-templates', { params })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to fetch templates')
            }
        },

        // Get public templates
        getPublicTemplates: async (params = {}) => {
            try {
                const response = await apiClient.get('/api/templates/public', { params })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to fetch public templates')
            }
        },

        // Get template by ID
        getById: async (id) => {
            try {
                const response = await apiClient.get(`/api/templates/${id}`)
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to fetch template')
            }
        },

        // Update template
        update: async (id, templateData) => {
            try {
                const response = await apiClient.put(`/api/templates/${id}`, templateData)
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to update template')
            }
        },

        // Delete template
        delete: async (id) => {
            try {
                const response = await apiClient.delete(`/api/templates/${id}`)
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to delete template')
            }
        },

        // Use template
        use: async (id) => {
            try {
                const response = await apiClient.post(`/api/templates/${id}/use`)
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to use template')
            }
        },

        // Rate template
        rate: async (id, rating) => {
            try {
                const response = await apiClient.post(`/api/templates/${id}/rate`, { rating })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to rate template')
            }
        },

        // Get categories
        getCategories: async () => {
            try {
                const response = await apiClient.get('/api/templates/categories')
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to fetch categories')
            }
        }
    },

    // Prompt Generator APIs
    promptGenerator: {
        // Generate refined prompt from messy input
        generate: async (originalInput, options = {}) => {
            try {
                const response = await apiClient.post('/api/prompt-generator/generate', {
                    originalInput,
                    ...options
                })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to generate prompt')
            }
        },

        // Get generation history
        getHistory: async (params = {}) => {
            try {
                const response = await apiClient.get('/api/prompt-generator/history', { params })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to fetch generation history')
            }
        },

        // Get generation statistics
        getStats: async () => {
            try {
                const response = await apiClient.get('/api/prompt-generator/stats')
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to fetch generation stats')
            }
        },

        // Rate a generated prompt
        rate: async (id, rating) => {
            try {
                const response = await apiClient.post(`/api/prompt-generator/${id}/rate`, { rating })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to rate generation')
            }
        },

        // Mark generation as used
        markAsUsed: async (id) => {
            try {
                const response = await apiClient.post(`/api/prompt-generator/${id}/use`)
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to mark as used')
            }
        },

        // Save generation as template
        saveAsTemplate: async (id, templateName, isPublic = false) => {
            try {
                const response = await apiClient.post(`/api/prompt-generator/${id}/save-template`, {
                    templateName,
                    isPublic
                })
                return response.data
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Failed to save as template')
            }
        }
    }
}

// Legacy support - keeping the old apiRequest function for compatibility
export const apiRequest = async (endpoint, options = {}) => {
    try {
        const method = options.method?.toLowerCase() || 'get'
        const data = options.body ? JSON.parse(options.body) : undefined

        let response
        if (method === 'post') {
            response = await apiClient.post(endpoint, data)
        } else if (method === 'put') {
            response = await apiClient.put(endpoint, data)
        } else if (method === 'delete') {
            response = await apiClient.delete(endpoint)
        } else {
            response = await apiClient.get(endpoint)
        }

        return response.data
    } catch (error) {
        throw new Error(error.response?.data?.error || error.message)
    }
}

export default apiClient