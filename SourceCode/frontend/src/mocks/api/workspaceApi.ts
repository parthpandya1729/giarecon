import { nanoid } from 'nanoid'
import type {
  Workspace,
  CreateWorkspaceInput,
  WorkspaceFilters,
} from '@/types/workspace.types'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types'
import { mockWorkspaces, getWorkspaceById } from '../data/workspaces'

// Simulate network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Simulate random errors (5% failure rate)
const simulateError = () => {
  if (Math.random() < 0.05) {
    throw new Error('Network error: Request failed')
  }
}

// In-memory storage (simulates database)
let workspaces = [...mockWorkspaces]

export const workspaceApi = {
  // Get all workspaces with pagination and filtering
  async getWorkspaces(
    params: PaginationParams & WorkspaceFilters
  ): Promise<ApiResponse<PaginatedResponse<Workspace>>> {
    await delay(250)
    simulateError()

    try {
      let filtered = [...workspaces]

      // Apply filters
      if (params.status && params.status.length > 0) {
        filtered = filtered.filter((ws) => params.status?.includes(ws.status))
      }

      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (ws) =>
            ws.name.toLowerCase().includes(query) ||
            ws.description.toLowerCase().includes(query)
        )
      }

      // Apply sorting
      const sortBy = params.sortBy || 'createdAt'
      const sortOrder = params.sortOrder || 'desc'

      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortBy === 'name') {
          aValue = a.name
          bValue = b.name
        } else if (sortBy === 'createdAt') {
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
        } else if (sortBy === 'lastRunAt') {
          aValue = a.lastRunAt?.getTime() || 0
          bValue = b.lastRunAt?.getTime() || 0
        } else if (sortBy === 'status') {
          aValue = a.status
          bValue = b.status
        } else {
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Apply pagination
      const page = params.page || 1
      const limit = params.limit || 10
      const total = filtered.length
      const totalPages = Math.ceil(total / limit)
      const start = (page - 1) * limit
      const end = start + limit
      const data = filtered.slice(start, end)

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workspaces',
      }
    }
  },

  // Get workspace by ID
  async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    await delay(200)
    simulateError()

    const workspace = workspaces.find((ws) => ws.id === id)

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found',
      }
    }

    return {
      success: true,
      data: workspace,
    }
  },

  // Create new workspace
  async createWorkspace(
    input: CreateWorkspaceInput
  ): Promise<ApiResponse<Workspace>> {
    await delay(400)
    simulateError()

    try {
      const newWorkspace: Workspace = {
        id: nanoid(),
        name: input.name,
        description: input.description,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        configId: input.configName ? nanoid() : undefined,
        stats: {
          totalRecords: 0,
          matched: 0,
          unmatched: 0,
          discrepancies: 0,
          matchPercentage: 0,
        },
      }

      workspaces.unshift(newWorkspace)

      return {
        success: true,
        data: newWorkspace,
        message: 'Workspace created successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create workspace',
      }
    }
  },

  // Update workspace
  async updateWorkspace(
    id: string,
    updates: Partial<Workspace>
  ): Promise<ApiResponse<Workspace>> {
    await delay(350)
    simulateError()

    const index = workspaces.findIndex((ws) => ws.id === id)

    if (index === -1) {
      return {
        success: false,
        error: 'Workspace not found',
      }
    }

    workspaces[index] = {
      ...workspaces[index],
      ...updates,
      updatedAt: new Date(),
    }

    return {
      success: true,
      data: workspaces[index],
      message: 'Workspace updated successfully',
    }
  },

  // Delete workspace
  async deleteWorkspace(id: string): Promise<ApiResponse<void>> {
    await delay(300)
    simulateError()

    const index = workspaces.findIndex((ws) => ws.id === id)

    if (index === -1) {
      return {
        success: false,
        error: 'Workspace not found',
      }
    }

    workspaces.splice(index, 1)

    return {
      success: true,
      message: 'Workspace deleted successfully',
    }
  },

  // Upload file to workspace
  async uploadFile(
    workspaceId: string,
    file: File,
    fileType: 'file1' | 'file2'
  ): Promise<ApiResponse<Workspace>> {
    await delay(1000) // Longer delay for file upload simulation

    const workspace = workspaces.find((ws) => ws.id === workspaceId)

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found',
      }
    }

    // Simulate file parsing to get row count
    const rowCount = Math.floor(Math.random() * 10000) + 1000

    if (!workspace.files) {
      workspace.files = {}
    }

    workspace.files[fileType] = {
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      rowCount,
    }

    workspace.updatedAt = new Date()

    return {
      success: true,
      data: workspace,
      message: `File uploaded successfully. Found ${rowCount} records.`,
    }
  },

  // Run reconciliation on workspace
  async runReconciliation(workspaceId: string): Promise<ApiResponse<Workspace>> {
    await delay(500)
    simulateError()

    const workspace = workspaces.find((ws) => ws.id === workspaceId)

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found',
      }
    }

    if (!workspace.files?.file1 || !workspace.files?.file2) {
      return {
        success: false,
        error: 'Both source and target files must be uploaded before reconciliation',
      }
    }

    // Update workspace to running status
    workspace.status = 'running'
    workspace.updatedAt = new Date()

    // Simulate reconciliation process (in real app, this would be a background job)
    setTimeout(async () => {
      const totalRecords = workspace.files!.file1!.rowCount! || 1000
      const matchedPercent = Math.random() * 0.3 + 0.65 // 65-95%
      const discrepancyPercent = Math.random() * 0.15 + 0.05 // 5-20%

      const matched = Math.floor(totalRecords * matchedPercent)
      const discrepancies = Math.floor(totalRecords * discrepancyPercent)
      const unmatched = totalRecords - matched - discrepancies

      workspace.stats = {
        totalRecords,
        matched,
        unmatched,
        discrepancies,
        matchPercentage: parseFloat(((matched / totalRecords) * 100).toFixed(2)),
        processingTime: Math.floor(Math.random() * 20000) + 3000,
      }

      workspace.status = 'completed'
      workspace.lastRunAt = new Date()
      workspace.updatedAt = new Date()
    }, 3000)

    return {
      success: true,
      data: workspace,
      message: 'Reconciliation started successfully',
    }
  },

  // Get reconciliation status
  async getReconciliationStatus(workspaceId: string): Promise<ApiResponse<Workspace>> {
    await delay(150)

    const workspace = workspaces.find((ws) => ws.id === workspaceId)

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found',
      }
    }

    return {
      success: true,
      data: workspace,
    }
  },
}
