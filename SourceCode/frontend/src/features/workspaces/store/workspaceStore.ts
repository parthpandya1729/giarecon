import { create } from 'zustand'
import type { Workspace, CreateWorkspaceInput, WorkspaceFilters } from '@/types/workspace.types'
import type { PaginationParams } from '@/types/common.types'
import { workspaceApi } from '@/mocks/api/workspaceApi'

interface WorkspaceState {
  // State
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  isLoading: boolean
  error: string | null
  totalWorkspaces: number
  currentPage: number
  totalPages: number
  filters: WorkspaceFilters

  // Actions
  loadWorkspaces: (params?: PaginationParams & WorkspaceFilters) => Promise<void>
  loadWorkspace: (id: string) => Promise<void>
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace | null>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  uploadFile: (workspaceId: string, file: File, fileType: 'file1' | 'file2') => Promise<void>
  runReconciliation: (workspaceId: string) => Promise<void>
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setFilters: (filters: WorkspaceFilters) => void
  clearError: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial state
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,
  totalWorkspaces: 0,
  currentPage: 1,
  totalPages: 1,
  filters: {},

  // Load workspaces with pagination and filters
  loadWorkspaces: async (params) => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.getWorkspaces({
        page: params?.page || get().currentPage,
        limit: params?.limit || 10,
        ...get().filters,
        ...params,
      })

      if (response.success && response.data) {
        set({
          workspaces: response.data.data,
          totalWorkspaces: response.data.total,
          currentPage: response.data.page,
          totalPages: response.data.totalPages,
        })
      } else {
        set({ error: response.error || 'Failed to load workspaces' })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load workspaces',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Load single workspace
  loadWorkspace: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.getWorkspace(id)

      if (response.success && response.data) {
        set({ currentWorkspace: response.data })
      } else {
        set({ error: response.error || 'Failed to load workspace' })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load workspace',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Create new workspace
  createWorkspace: async (input: CreateWorkspaceInput) => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.createWorkspace(input)

      if (response.success && response.data) {
        // Add to workspaces list
        set((state) => ({
          workspaces: [response.data!, ...state.workspaces],
          totalWorkspaces: state.totalWorkspaces + 1,
        }))

        return response.data
      } else {
        set({ error: response.error || 'Failed to create workspace' })
        return null
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create workspace',
      })
      return null
    } finally {
      set({ isLoading: false })
    }
  },

  // Update workspace
  updateWorkspace: async (id: string, updates: Partial<Workspace>) => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.updateWorkspace(id, updates)

      if (response.success && response.data) {
        // Update in list
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? response.data! : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === id
              ? response.data!
              : state.currentWorkspace,
        }))
      } else {
        set({ error: response.error || 'Failed to update workspace' })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update workspace',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Delete workspace
  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.deleteWorkspace(id)

      if (response.success) {
        // Remove from list
        set((state) => ({
          workspaces: state.workspaces.filter((ws) => ws.id !== id),
          totalWorkspaces: state.totalWorkspaces - 1,
          currentWorkspace:
            state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        }))
      } else {
        set({ error: response.error || 'Failed to delete workspace' })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete workspace',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Upload file
  uploadFile: async (workspaceId: string, file: File, fileType: 'file1' | 'file2') => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.uploadFile(workspaceId, file, fileType)

      if (response.success && response.data) {
        // Update workspace in list
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? response.data! : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? response.data!
              : state.currentWorkspace,
        }))
      } else {
        set({ error: response.error || 'Failed to upload file' })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload file',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Run reconciliation
  runReconciliation: async (workspaceId: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await workspaceApi.runReconciliation(workspaceId)

      if (response.success && response.data) {
        // Update workspace status
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? response.data! : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? response.data!
              : state.currentWorkspace,
        }))

        // Poll for status updates (simulated)
        const pollStatus = async () => {
          const statusResponse = await workspaceApi.getReconciliationStatus(workspaceId)

          if (statusResponse.success && statusResponse.data) {
            set((state) => ({
              workspaces: state.workspaces.map((ws) =>
                ws.id === workspaceId ? statusResponse.data! : ws
              ),
              currentWorkspace:
                state.currentWorkspace?.id === workspaceId
                  ? statusResponse.data!
                  : state.currentWorkspace,
            }))

            // Continue polling if still running
            if (statusResponse.data.status === 'running') {
              setTimeout(pollStatus, 2000)
            }
          }
        }

        // Start polling
        setTimeout(pollStatus, 2000)
      } else {
        set({ error: response.error || 'Failed to run reconciliation' })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to run reconciliation',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Set current workspace
  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace })
  },

  // Set filters
  setFilters: (filters: WorkspaceFilters) => {
    set({ filters })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))
