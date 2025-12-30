import { nanoid } from 'nanoid'
import type {
  ReconciliationConfig,
  ConfigTemplate,
  FieldMapping,
  ValidationRule,
  ConfigSettings,
} from '@/types/config.types'

const defaultSettings: ConfigSettings = {
  caseSensitive: false,
  trimWhitespace: true,
  ignoreEmptyRows: true,
  dateFormat: 'YYYY-MM-DD',
  currencyFormat: 'USD',
  decimalSeparator: '.',
  thousandsSeparator: ',',
  timezone: 'UTC',
}

// Samsung Template - As specified in requirements
export const samsungTemplate: ReconciliationConfig = {
  id: nanoid(),
  name: 'Samsung Electronics Standard Template',
  description:
    'Pre-configured template for Samsung Electronics quarterly reconciliations with standard field mappings',
  isTemplate: true,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-12-01'),
  mappings: [
    {
      id: nanoid(),
      file1Column: 'Transaction_ID',
      file2Column: 'Reference_Number',
      isPrimaryKey: true,
      dataType: 'string',
      isRequired: true,
      transformFunction: 'trim',
    },
    {
      id: nanoid(),
      file1Column: 'Transaction_Date',
      file2Column: 'Payment_Date',
      isPrimaryKey: false,
      dataType: 'date',
      isRequired: true,
      transformFunction: 'parseDate',
    },
    {
      id: nanoid(),
      file1Column: 'Amount',
      file2Column: 'Payment_Amount',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Vendor_Code',
      file2Column: 'Supplier_ID',
      isPrimaryKey: false,
      dataType: 'string',
      isRequired: true,
      transformFunction: 'toUpperCase',
    },
    {
      id: nanoid(),
      file1Column: 'Description',
      file2Column: 'Payment_Description',
      isPrimaryKey: false,
      dataType: 'string',
      isRequired: false,
      transformFunction: 'trim',
    },
  ],
  validationRules: [
    {
      id: nanoid(),
      name: 'Transaction ID Format',
      field: 'Transaction_ID',
      ruleType: 'pattern',
      config: {
        pattern: '^(TXN|PAY|INV)\\d{6,10}$',
        errorMessage: 'Transaction ID must start with TXN, PAY, or INV followed by 6-10 digits',
      },
      enabled: true,
      severity: 'error',
    },
    {
      id: nanoid(),
      name: 'Amount Range Validation',
      field: 'Amount',
      ruleType: 'numeric_range',
      config: {
        minValue: 0.01,
        maxValue: 1000000,
        errorMessage: 'Amount must be between $0.01 and $1,000,000',
      },
      enabled: true,
      severity: 'error',
    },
    {
      id: nanoid(),
      name: 'Date Format Validation',
      field: 'Transaction_Date',
      ruleType: 'date_format',
      config: {
        dateFormat: 'YYYY-MM-DD',
        errorMessage: 'Date must be in YYYY-MM-DD format',
      },
      enabled: true,
      severity: 'error',
    },
    {
      id: nanoid(),
      name: 'Vendor Code Required',
      field: 'Vendor_Code',
      ruleType: 'required',
      config: {
        allowNull: false,
        errorMessage: 'Vendor Code is required',
      },
      enabled: true,
      severity: 'error',
    },
  ],
  matchingStrategy: 'exact',
  toleranceAmount: 0.01,
  tolerancePercentage: 0.1,
  settings: defaultSettings,
}

// Finance Template
export const financeTemplate: ReconciliationConfig = {
  id: nanoid(),
  name: 'General Finance Reconciliation',
  description: 'Standard template for financial transaction reconciliation',
  isTemplate: true,
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-11-15'),
  mappings: [
    {
      id: nanoid(),
      file1Column: 'Invoice_Number',
      file2Column: 'Invoice_ID',
      isPrimaryKey: true,
      dataType: 'string',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Invoice_Date',
      file2Column: 'Date',
      isPrimaryKey: false,
      dataType: 'date',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Total_Amount',
      file2Column: 'Amount',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Customer_ID',
      file2Column: 'Client_Code',
      isPrimaryKey: false,
      dataType: 'string',
      isRequired: true,
    },
  ],
  validationRules: [
    {
      id: nanoid(),
      name: 'Invoice Number Unique',
      field: 'Invoice_Number',
      ruleType: 'unique_value',
      config: {
        errorMessage: 'Invoice numbers must be unique',
      },
      enabled: true,
      severity: 'error',
    },
    {
      id: nanoid(),
      name: 'Positive Amount',
      field: 'Total_Amount',
      ruleType: 'numeric_range',
      config: {
        minValue: 0.01,
        errorMessage: 'Amount must be positive',
      },
      enabled: true,
      severity: 'error',
    },
  ],
  matchingStrategy: 'exact',
  toleranceAmount: 0.05,
  tolerancePercentage: 0.5,
  settings: defaultSettings,
}

// Inventory Template
export const inventoryTemplate: ReconciliationConfig = {
  id: nanoid(),
  name: 'Inventory Reconciliation Template',
  description: 'Template for reconciling inventory counts and stock movements',
  isTemplate: true,
  createdAt: new Date('2024-03-10'),
  updatedAt: new Date('2024-12-05'),
  mappings: [
    {
      id: nanoid(),
      file1Column: 'SKU',
      file2Column: 'Product_Code',
      isPrimaryKey: true,
      dataType: 'string',
      isRequired: true,
      transformFunction: 'toUpperCase',
    },
    {
      id: nanoid(),
      file1Column: 'Quantity_On_Hand',
      file2Column: 'Stock_Count',
      isPrimaryKey: false,
      dataType: 'number',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Location',
      file2Column: 'Warehouse_Code',
      isPrimaryKey: false,
      dataType: 'string',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Last_Updated',
      file2Column: 'Count_Date',
      isPrimaryKey: false,
      dataType: 'date',
      isRequired: false,
    },
  ],
  validationRules: [
    {
      id: nanoid(),
      name: 'SKU Format',
      field: 'SKU',
      ruleType: 'pattern',
      config: {
        pattern: '^[A-Z0-9]{6,12}$',
        errorMessage: 'SKU must be 6-12 alphanumeric characters',
      },
      enabled: true,
      severity: 'error',
    },
    {
      id: nanoid(),
      name: 'Non-negative Quantity',
      field: 'Quantity_On_Hand',
      ruleType: 'numeric_range',
      config: {
        minValue: 0,
        errorMessage: 'Quantity cannot be negative',
      },
      enabled: true,
      severity: 'error',
    },
  ],
  matchingStrategy: 'exact',
  toleranceAmount: 1,
  tolerancePercentage: 2,
  settings: defaultSettings,
}

// HR Payroll Template
export const hrPayrollTemplate: ReconciliationConfig = {
  id: nanoid(),
  name: 'HR Payroll Reconciliation',
  description: 'Template for reconciling payroll records and bank transactions',
  isTemplate: true,
  createdAt: new Date('2024-04-20'),
  updatedAt: new Date('2024-10-30'),
  mappings: [
    {
      id: nanoid(),
      file1Column: 'Employee_ID',
      file2Column: 'EMP_NUM',
      isPrimaryKey: true,
      dataType: 'string',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Pay_Period',
      file2Column: 'Period_End_Date',
      isPrimaryKey: false,
      dataType: 'date',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Gross_Pay',
      file2Column: 'Total_Earnings',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Net_Pay',
      file2Column: 'Take_Home',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: true,
    },
  ],
  validationRules: [
    {
      id: nanoid(),
      name: 'Employee ID Format',
      field: 'Employee_ID',
      ruleType: 'pattern',
      config: {
        pattern: '^EMP\\d{5}$',
        errorMessage: 'Employee ID must start with EMP followed by 5 digits',
      },
      enabled: true,
      severity: 'error',
    },
    {
      id: nanoid(),
      name: 'Net Pay Validation',
      field: 'Net_Pay',
      ruleType: 'expression',
      config: {
        expression: 'Net_Pay <= Gross_Pay',
        errorMessage: 'Net Pay cannot exceed Gross Pay',
      },
      enabled: true,
      severity: 'error',
    },
  ],
  matchingStrategy: 'exact',
  toleranceAmount: 0.01,
  tolerancePercentage: 0,
  settings: defaultSettings,
}

// Sales Template
export const salesTemplate: ReconciliationConfig = {
  id: nanoid(),
  name: 'Sales Order Reconciliation',
  description: 'Template for reconciling sales orders with shipments and invoices',
  isTemplate: true,
  createdAt: new Date('2024-05-15'),
  updatedAt: new Date('2024-11-20'),
  mappings: [
    {
      id: nanoid(),
      file1Column: 'Order_Number',
      file2Column: 'SO_Number',
      isPrimaryKey: true,
      dataType: 'string',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Order_Date',
      file2Column: 'Created_Date',
      isPrimaryKey: false,
      dataType: 'date',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Order_Total',
      file2Column: 'Invoice_Amount',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Customer_Name',
      file2Column: 'Client_Name',
      isPrimaryKey: false,
      dataType: 'string',
      isRequired: true,
      transformFunction: 'trim',
    },
  ],
  validationRules: [
    {
      id: nanoid(),
      name: 'Order Number Format',
      field: 'Order_Number',
      ruleType: 'pattern',
      config: {
        pattern: '^SO\\d{8}$',
        errorMessage: 'Order Number must start with SO followed by 8 digits',
      },
      enabled: true,
      severity: 'error',
    },
  ],
  matchingStrategy: 'fuzzy',
  fuzzyThreshold: 0.85,
  toleranceAmount: 1.0,
  tolerancePercentage: 1.0,
  settings: defaultSettings,
}

// Bank Reconciliation Template
export const bankReconciliationTemplate: ReconciliationConfig = {
  id: nanoid(),
  name: 'Bank Statement Reconciliation',
  description: 'Template for reconciling internal records with bank statements',
  isTemplate: true,
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-12-10'),
  mappings: [
    {
      id: nanoid(),
      file1Column: 'Transaction_Reference',
      file2Column: 'Bank_Ref',
      isPrimaryKey: true,
      dataType: 'string',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Value_Date',
      file2Column: 'Transaction_Date',
      isPrimaryKey: false,
      dataType: 'date',
      isRequired: true,
    },
    {
      id: nanoid(),
      file1Column: 'Debit_Amount',
      file2Column: 'Withdrawal',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: false,
    },
    {
      id: nanoid(),
      file1Column: 'Credit_Amount',
      file2Column: 'Deposit',
      isPrimaryKey: false,
      dataType: 'currency',
      isRequired: false,
    },
  ],
  validationRules: [
    {
      id: nanoid(),
      name: 'Reference Number Length',
      field: 'Transaction_Reference',
      ruleType: 'length',
      config: {
        minLength: 10,
        maxLength: 20,
        errorMessage: 'Reference number must be 10-20 characters',
      },
      enabled: true,
      severity: 'warning',
    },
  ],
  matchingStrategy: 'exact',
  toleranceAmount: 0.01,
  tolerancePercentage: 0,
  settings: defaultSettings,
}

export const mockConfigs: ReconciliationConfig[] = [
  samsungTemplate,
  financeTemplate,
  inventoryTemplate,
  hrPayrollTemplate,
  salesTemplate,
  bankReconciliationTemplate,
]

export const mockConfigTemplates: ConfigTemplate[] = [
  {
    id: samsungTemplate.id,
    name: samsungTemplate.name,
    description: samsungTemplate.description || '',
    category: 'custom',
    config: samsungTemplate,
    usageCount: 45,
  },
  {
    id: financeTemplate.id,
    name: financeTemplate.name,
    description: financeTemplate.description || '',
    category: 'finance',
    config: financeTemplate,
    usageCount: 123,
  },
  {
    id: inventoryTemplate.id,
    name: inventoryTemplate.name,
    description: inventoryTemplate.description || '',
    category: 'inventory',
    config: inventoryTemplate,
    usageCount: 67,
  },
  {
    id: hrPayrollTemplate.id,
    name: hrPayrollTemplate.name,
    description: hrPayrollTemplate.description || '',
    category: 'hr',
    config: hrPayrollTemplate,
    usageCount: 89,
  },
  {
    id: salesTemplate.id,
    name: salesTemplate.name,
    description: salesTemplate.description || '',
    category: 'sales',
    config: salesTemplate,
    usageCount: 156,
  },
  {
    id: bankReconciliationTemplate.id,
    name: bankReconciliationTemplate.name,
    description: bankReconciliationTemplate.description || '',
    category: 'finance',
    config: bankReconciliationTemplate,
    usageCount: 234,
  },
]

export function getConfigById(id: string): ReconciliationConfig | undefined {
  return mockConfigs.find((config) => config.id === id)
}

export function getTemplatesByCategory(category: string): ConfigTemplate[] {
  return mockConfigTemplates.filter((template) => template.category === category)
}
