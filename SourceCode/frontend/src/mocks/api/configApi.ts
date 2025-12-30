import { nanoid } from 'nanoid'
import type {
  ReconciliationConfig,
  CreateConfigInput,
  ConfigFilters,
  ConfigTemplate,
  FieldMappingValidation,
} from '@/types/config.types'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types'
import { mockConfigs, mockConfigTemplates, getConfigById } from '../data/configs'

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const simulateError = () => {
  if (Math.random() < 0.05) {
    throw new Error('Network error: Request failed')
  }
}

// In-memory storage
let configs = [...mockConfigs]
let templates = [...mockConfigTemplates]

export const configApi = {
  // Get all configs with pagination and filtering
  async getConfigs(
    params: PaginationParams & ConfigFilters
  ): Promise<ApiResponse<PaginatedResponse<ReconciliationConfig>>> {
    await delay(250)
    simulateError()

    try {
      let filtered = [...configs]

      // Apply filters
      if (params.isTemplate !== undefined) {
        filtered = filtered.filter((config) => config.isTemplate === params.isTemplate)
      }

      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (config) =>
            config.name.toLowerCase().includes(query) ||
            config.description?.toLowerCase().includes(query)
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
      const limit = params.limit || 20
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
        error: error instanceof Error ? error.message : 'Failed to fetch configs',
      }
    }
  },

  // Get config by ID
  async getConfig(id: string): Promise<ApiResponse<ReconciliationConfig>> {
    await delay(200)
    simulateError()

    const config = configs.find((c) => c.id === id)

    if (!config) {
      return {
        success: false,
        error: 'Configuration not found',
      }
    }

    return {
      success: true,
      data: config,
    }
  },

  // Get config templates
  async getTemplates(
    category?: string
  ): Promise<ApiResponse<ConfigTemplate[]>> {
    await delay(250)
    simulateError()

    let filtered = [...templates]

    if (category) {
      filtered = filtered.filter((template) => template.category === category)
    }

    // Sort by usage count
    filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))

    return {
      success: true,
      data: filtered,
    }
  },

  // Create new config
  async createConfig(
    input: CreateConfigInput
  ): Promise<ApiResponse<ReconciliationConfig>> {
    await delay(400)
    simulateError()

    try {
      const newConfig: ReconciliationConfig = {
        id: nanoid(),
        name: input.name,
        description: input.description,
        isTemplate: input.isTemplate,
        mappings: input.mappings.map((m) => ({ ...m, id: nanoid() })),
        validationRules: input.validationRules.map((r) => ({ ...r, id: nanoid() })),
        matchingStrategy: input.matchingStrategy,
        fuzzyThreshold: input.fuzzyThreshold,
        toleranceAmount: input.toleranceAmount,
        tolerancePercentage: input.tolerancePercentage,
        settings: input.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      configs.unshift(newConfig)

      if (input.isTemplate) {
        const newTemplate: ConfigTemplate = {
          id: newConfig.id,
          name: newConfig.name,
          description: newConfig.description || '',
          category: 'custom',
          config: newConfig,
          usageCount: 0,
        }
        templates.unshift(newTemplate)
      }

      return {
        success: true,
        data: newConfig,
        message: 'Configuration created successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create config',
      }
    }
  },

  // Update config
  async updateConfig(
    id: string,
    updates: Partial<ReconciliationConfig>
  ): Promise<ApiResponse<ReconciliationConfig>> {
    await delay(350)
    simulateError()

    const index = configs.findIndex((c) => c.id === id)

    if (index === -1) {
      return {
        success: false,
        error: 'Configuration not found',
      }
    }

    configs[index] = {
      ...configs[index],
      ...updates,
      updatedAt: new Date(),
    }

    // Update template if it's a template
    if (configs[index].isTemplate) {
      const templateIndex = templates.findIndex((t) => t.id === id)
      if (templateIndex !== -1) {
        templates[templateIndex].config = configs[index]
        templates[templateIndex].name = configs[index].name
        templates[templateIndex].description = configs[index].description || ''
      }
    }

    return {
      success: true,
      data: configs[index],
      message: 'Configuration updated successfully',
    }
  },

  // Delete config
  async deleteConfig(id: string): Promise<ApiResponse<void>> {
    await delay(300)
    simulateError()

    const index = configs.findIndex((c) => c.id === id)

    if (index === -1) {
      return {
        success: false,
        error: 'Configuration not found',
      }
    }

    // Remove from configs
    const config = configs[index]
    configs.splice(index, 1)

    // Remove from templates if it's a template
    if (config.isTemplate) {
      const templateIndex = templates.findIndex((t) => t.id === id)
      if (templateIndex !== -1) {
        templates.splice(templateIndex, 1)
      }
    }

    return {
      success: true,
      message: 'Configuration deleted successfully',
    }
  },

  // Validate field mappings
  async validateMappings(
    mappings: ReconciliationConfig['mappings'],
    file1Columns: string[],
    file2Columns: string[]
  ): Promise<ApiResponse<FieldMappingValidation>> {
    await delay(200)

    const validation: FieldMappingValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      unmappedColumns: {
        file1: [],
        file2: [],
      },
      duplicateMappings: [],
    }

    // Check for primary key
    const primaryKeys = mappings.filter((m) => m.isPrimaryKey)
    if (primaryKeys.length === 0) {
      validation.errors.push('At least one primary key mapping is required')
      validation.isValid = false
    } else if (primaryKeys.length > 1) {
      validation.warnings.push('Multiple primary keys defined - only one is recommended')
    }

    // Check for duplicate mappings
    const seenFile1: Set<string> = new Set()
    const seenFile2: Set<string> = new Set()

    mappings.forEach((mapping) => {
      if (seenFile1.has(mapping.file1Column)) {
        validation.duplicateMappings.push(mapping.file1Column)
        validation.errors.push(
          `Duplicate mapping for file1 column: ${mapping.file1Column}`
        )
        validation.isValid = false
      }
      seenFile1.add(mapping.file1Column)

      if (seenFile2.has(mapping.file2Column)) {
        validation.duplicateMappings.push(mapping.file2Column)
        validation.errors.push(
          `Duplicate mapping for file2 column: ${mapping.file2Column}`
        )
        validation.isValid = false
      }
      seenFile2.add(mapping.file2Column)
    })

    // Check for unmapped columns
    validation.unmappedColumns.file1 = file1Columns.filter((col) => !seenFile1.has(col))
    validation.unmappedColumns.file2 = file2Columns.filter((col) => !seenFile2.has(col))

    if (validation.unmappedColumns.file1.length > 0) {
      validation.warnings.push(
        `${validation.unmappedColumns.file1.length} unmapped columns in file 1`
      )
    }

    if (validation.unmappedColumns.file2.length > 0) {
      validation.warnings.push(
        `${validation.unmappedColumns.file2.length} unmapped columns in file 2`
      )
    }

    return {
      success: true,
      data: validation,
    }
  },

  // Clone config from template
  async cloneConfig(
    templateId: string,
    newName: string
  ): Promise<ApiResponse<ReconciliationConfig>> {
    await delay(300)
    simulateError()

    const template = templates.find((t) => t.id === templateId)

    if (!template) {
      return {
        success: false,
        error: 'Template not found',
      }
    }

    const clonedConfig: ReconciliationConfig = {
      ...template.config,
      id: nanoid(),
      name: newName,
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    configs.unshift(clonedConfig)

    // Increment usage count
    template.usageCount = (template.usageCount || 0) + 1

    return {
      success: true,
      data: clonedConfig,
      message: 'Configuration cloned successfully',
    }
  },

  // Test config against sample data
  async testConfig(
    configId: string,
    sampleFile1Data: Record<string, any>[],
    sampleFile2Data: Record<string, any>[]
  ): Promise<ApiResponse<any>> {
    await delay(500)
    simulateError()

    const config = configs.find((c) => c.id === configId)

    if (!config) {
      return {
        success: false,
        error: 'Configuration not found',
      }
    }

    // Simulate config testing
    const testResults = {
      mappingsApplied: config.mappings.length,
      validationsPassed: Math.floor(Math.random() * config.validationRules.length),
      validationsFailed:
        config.validationRules.length -
        Math.floor(Math.random() * config.validationRules.length),
      sampleMatches: Math.floor(Math.random() * 20) + 5,
      estimatedMatchRate: Math.random() * 30 + 60, // 60-90%
    }

    return {
      success: true,
      data: testResults,
      message: 'Configuration test completed',
    }
  },
}
