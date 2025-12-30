import { useState, useRef, DragEvent } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { cn } from '@/shared/utils/cn'
import type { UploadedFile, FileUploadProgress } from '@/types/workspace-create.types'
import { nanoid } from 'nanoid'

interface FileUploadStepProps {
  data: {
    file1?: UploadedFile
    file2?: UploadedFile
  }
  onChange: (data: { file1?: UploadedFile; file2?: UploadedFile }) => void
  onNext: () => void
  onBack: () => void
}

export default function FileUploadStep({ data, onChange, onNext, onBack }: FileUploadStepProps) {
  const [uploadProgress, setUploadProgress] = useState<{
    file1?: FileUploadProgress
    file2?: FileUploadProgress
  }>({})
  const file1InputRef = useRef<HTMLInputElement>(null)
  const file2InputRef = useRef<HTMLInputElement>(null)

  const simulateFileUpload = async (
    file: File,
    fileType: 'file1' | 'file2'
  ): Promise<UploadedFile> => {
    // Simulate upload progress
    setUploadProgress((prev) => ({
      ...prev,
      [fileType]: { fileName: file.name, progress: 0, status: 'uploading' },
    }))

    // Simulate progress
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setUploadProgress((prev) => ({
        ...prev,
        [fileType]: { fileName: file.name, progress: i, status: 'uploading' },
      }))
    }

    // Processing phase
    setUploadProgress((prev) => ({
      ...prev,
      [fileType]: { fileName: file.name, progress: 100, status: 'processing' },
    }))

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock data
    const mockColumns = generateMockColumns(file.name)
    const mockPreview = generateMockPreview(mockColumns)

    setUploadProgress((prev) => ({
      ...prev,
      [fileType]: { fileName: file.name, progress: 100, status: 'complete' },
    }))

    return {
      id: nanoid(),
      name: file.name,
      size: file.size,
      rows: Math.floor(Math.random() * 10000) + 1000,
      columns: mockColumns,
      preview: mockPreview,
    }
  }

  const generateMockColumns = (fileName: string): string[] => {
    const commonColumns = [
      'Transaction_ID',
      'Transaction_Date',
      'Amount',
      'Vendor_Code',
      'Description',
      'Status',
      'Customer_ID',
      'Payment_Method',
      'Invoice_Number',
      'Category',
    ]
    return commonColumns.slice(0, 6 + Math.floor(Math.random() * 4))
  }

  const generateMockPreview = (columns: string[]): Record<string, any>[] => {
    const rows: Record<string, any>[] = []
    for (let i = 0; i < 5; i++) {
      const row: Record<string, any> = {}
      columns.forEach((col) => {
        if (col.toLowerCase().includes('id') || col.toLowerCase().includes('number')) {
          row[col] = `${col.substring(0, 3).toUpperCase()}${1000 + i}`
        } else if (col.toLowerCase().includes('date')) {
          row[col] = new Date(2024, 11, i + 1).toISOString().split('T')[0]
        } else if (col.toLowerCase().includes('amount')) {
          row[col] = (Math.random() * 10000).toFixed(2)
        } else {
          row[col] = `Sample ${col} ${i + 1}`
        }
      })
      rows.push(row)
    }
    return rows
  }

  const handleFileSelect = async (file: File, fileType: 'file1' | 'file2') => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadProgress((prev) => ({
        ...prev,
        [fileType]: {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: 'Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files.',
        },
      }))
      return
    }

    const uploadedFile = await simulateFileUpload(file, fileType)
    onChange({ ...data, [fileType]: uploadedFile })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, fileType: 'file1' | 'file2') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file, fileType)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemoveFile = (fileType: 'file1' | 'file2') => {
    onChange({ ...data, [fileType]: undefined })
    setUploadProgress((prev) => ({ ...prev, [fileType]: undefined }))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isValid = data.file1 && data.file2

  const renderFileUploadZone = (
    fileType: 'file1' | 'file2',
    label: string,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    const uploadedFile = data[fileType]
    const progress = uploadProgress[fileType]

    if (uploadedFile && progress?.status === 'complete') {
      return (
        <Card variant="outlined" className="relative">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-50 rounded-lg">
                  <FileText className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{uploadedFile.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(uploadedFile.size)} • {uploadedFile.rows.toLocaleString()} rows
                    • {uploadedFile.columns.length} columns
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFile(fileType)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Preview (first 5 rows)
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {uploadedFile.columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadedFile.preview.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      {uploadedFile.columns.map((col) => (
                        <td key={col} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )
    }

    if (progress && progress.status !== 'complete') {
      return (
        <Card variant="outlined">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-benow-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{progress.fileName}</h4>
                <p className="text-sm text-gray-500">
                  {progress.status === 'uploading' && `Uploading... ${progress.progress}%`}
                  {progress.status === 'processing' && 'Processing file...'}
                  {progress.status === 'error' && progress.error}
                </p>
              </div>
              {progress.status === 'error' && <AlertCircle className="w-5 h-5 text-error-600" />}
            </div>
            {progress.status === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-benow-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            )}
          </div>
        </Card>
      )
    }

    return (
      <div
        onDrop={(e) => handleDrop(e, fileType)}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-benow-blue-400 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file, fileType)
          }}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-benow-blue-50 rounded-full">
            <Upload className="w-8 h-8 text-benow-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              Drop your {label} here or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">Supports Excel (.xlsx, .xls) and CSV files</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h3>
            <p className="text-sm text-gray-600">
              Upload the two files you want to reconcile
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File 1 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                File 1 (Internal Data) <span className="text-error-600">*</span>
              </label>
              {renderFileUploadZone('file1', 'File 1', file1InputRef)}
            </div>

            {/* File 2 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                File 2 (External Data) <span className="text-error-600">*</span>
              </label>
              {renderFileUploadZone('file2', 'File 2', file2InputRef)}
            </div>
          </div>

          {isValid && (
            <div className="flex items-center gap-2 p-3 bg-success-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success-600" />
              <p className="text-sm text-success-700 font-medium">Both files uploaded successfully</p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="secondary" size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Next: Select Configuration
        </Button>
      </div>
    </div>
  )
}
