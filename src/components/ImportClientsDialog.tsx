
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, AlertCircle, Info } from "lucide-react"
import Papa from "papaparse"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import * as XLSX from 'xlsx'
import { useLanguage } from '@/components/LanguageProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/AuthProvider'

interface ImportClientsDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (importedClients: any[]) => void
}

const REQUIRED_FIELDS = ['name']
const OPTIONAL_FIELDS = ['phone', 'right_eye_sph', 'right_eye_cyl', 'right_eye_axe', 'left_eye_sph', 'left_eye_cyl', 'left_eye_axe', 'Add']

export const ImportClientsDialog = ({ isOpen, onClose, onImport }: ImportClientsDialogProps) => {
  const { toast } = useToast()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [hasHeaders, setHasHeaders] = useState(true)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) {
      setFile(null)
      setPreviewData([])
      setAvailableColumns([])
      return
    }

    // Check if file is CSV or XLSX
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast({
        title: t('invalidFileType'),
        description: t('pleaseUploadCsvXlsx'),
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    if (selectedFile.name.endsWith('.xlsx')) {
      // Handle XLSX file
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: hasHeaders ? 1 : undefined })

          setPreviewData(jsonData.slice(0, 5)) // Preview first 5 rows

          if (hasHeaders && jsonData.length > 0) {
            setAvailableColumns(Object.keys(jsonData[0]))
          } else if (!hasHeaders && jsonData.length > 0) {
            const firstRow = jsonData[0] as any[]
            setAvailableColumns(firstRow.map((_, index) => `Column ${index + 1}`))
          }
        } catch (error) {
          toast({
            title: t('errorReadingXlsx'),
            description: t('validExcelFile'),
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(selectedFile)
    } else {
      // Handle CSV file
      Papa.parse(selectedFile, {
        header: hasHeaders,
        skipEmptyLines: true,
        preview: 5, // Preview first 5 rows
        complete: (results) => {
          setPreviewData(results.data)

          // Get column names
          if (hasHeaders && results.meta.fields) {
            setAvailableColumns(results.meta.fields)
          } else if (!hasHeaders && results.data.length > 0) {
            const firstRow = results.data[0] as any[]
            setAvailableColumns(firstRow.map((_, index) => `Column ${index + 1}`))
          }
        },
        error: (error) => {
          toast({
            title: t('errorReadingCsv'),
            description: error.message,
            variant: "destructive",
          })
        }
      })
    }
  }

  const handleNext = () => {
    if (!file || availableColumns.length === 0) return

    // Auto-detect column mappings based on common names
    const autoMappings: Record<string, string> = {}

    availableColumns.forEach(col => {
      const lowerCol = col.toLowerCase()
      if (lowerCol.includes('name') || lowerCol.includes('client')) {
        autoMappings.name = col
      } else if (lowerCol.includes('phone') || lowerCol.includes('tel')) {
        autoMappings.phone = col
      } else if (lowerCol.includes('right_eye_sph') || lowerCol.includes('right sph')) {
        autoMappings.right_eye_sph = col
      } else if (lowerCol.includes('right_eye_cyl') || lowerCol.includes('right cyl')) {
        autoMappings.right_eye_cyl = col
      } else if (lowerCol.includes('right_eye_axe') || lowerCol.includes('right axe')) {
        autoMappings.right_eye_axe = col
      } else if (lowerCol.includes('left_eye_sph') || lowerCol.includes('left sph')) {
        autoMappings.left_eye_sph = col
      } else if (lowerCol.includes('left_eye_cyl') || lowerCol.includes('left cyl')) {
        autoMappings.left_eye_cyl = col
      } else if (lowerCol.includes('add') && lowerCol.length <= 5) {
        autoMappings.Add = col
      }
    })

    setColumnMappings(autoMappings)
    setStep(2)
  }

  const validateClients = (clients: any[]) => {
    const errors = []

    // Check for missing required fields (only name is required)
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      if (!client.name || client.name.toString().trim() === "") {
        errors.push(`${t('row')} ${i + 1}: ${t('missingClientName')}`)
      }
    }

    return errors
  }

  const handleImport = () => {
    if (!file) return

    const processData = (data: any[]) => {
      let clients = data.map((row: any, index: number) => {
        const client: any = {}

        // Map required fields
        REQUIRED_FIELDS.forEach(field => {
          const mappedColumn = columnMappings[field]
          if (mappedColumn) {
            client[field] = hasHeaders ? row[mappedColumn] : row[parseInt(mappedColumn.replace("Column ", "")) - 1]
          }
        })

        // Map optional fields
        OPTIONAL_FIELDS.forEach(field => {
          const mappedColumn = columnMappings[field]
          if (mappedColumn) {
            const value = hasHeaders ? row[mappedColumn] : row[parseInt(mappedColumn.replace("Column ", "")) - 1]
            // Handle prescription fields (assign 0 for null/empty values)
            if (field.includes('eye') || field === 'Add') {
              const numValue = value !== undefined && value !== null && value !== "" ? Number(value) : 0
              client[field] = isNaN(numValue) ? 0 : numValue
            }
            // Handle phone field (allow empty values)
            else if (field === 'phone') {
              client[field] = value !== undefined && value !== null ? value : ""
            }
            // Handle other fields
            else if (value !== undefined && value !== null && value !== "") {
              client[field] = value
            }
          }
        })

        return client
      })

      // Validate clients
      const validationErrors = validateClients(clients)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setStep(3) // Show errors
        return
      }

      onImport(clients)
      
      // Invalidate clients cache to refresh the UI
      if (user) {
        queryClient.invalidateQueries(['all-clients', user.id])
      }
      
      resetDialog()
      toast({
        title: t('success'),
        description: `${clients.length} ${t('clientsImportedSuccessfully')}`,
      })
    }

    if (file.name.endsWith('.xlsx')) {
      // Handle XLSX file
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: hasHeaders ? 1 : undefined })
          processData(jsonData)
        } catch (error) {
          toast({
            title: t('errorImportingXlsx'),
            description: t('failedProcessExcel'),
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      // Handle CSV file
      Papa.parse(file, {
        header: hasHeaders,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data)
        },
        error: (error) => {
          toast({
            title: t('errorImportingCsv'),
            description: error.message,
            variant: "destructive",
          })
        }
      })
    }
  }

  const resetDialog = () => {
    setFile(null)
    setPreviewData([])
    setAvailableColumns([])
    setColumnMappings({})
    setStep(1)
    setErrors([])
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('importClients')}</DialogTitle>
          <DialogDescription>
            {t('importClientsDescription')}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasHeaders"
                checked={hasHeaders}
                onCheckedChange={setHasHeaders}
              />
              <Label htmlFor="hasHeaders">{t('firstRowHeaders')}</Label>
            </div>

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">{t('clickToUpload')}</span> {t('dragAndDrop')}
                  </p>
                  <p className="text-xs text-gray-500">{t('csvOrXlsxFile')}</p>
                </div>
                <Input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">{file.name}</span>
                </div>
              </div>
            )}

            {previewData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">{t('previewFirstRows')}</h4>
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {availableColumns.map((col, index) => (
                          <th key={index} className="px-2 py-1 text-left font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t">
                          {availableColumns.map((col, colIndex) => (
                            <td key={colIndex} className="px-2 py-1">
                              {hasHeaders ? row[col] : row[colIndex]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!file || availableColumns.length === 0}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{t('columnMapping')}</AlertTitle>
              <AlertDescription>
                {t('columnMappingDescription')}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">{t('requiredFields')}</h4>
                {REQUIRED_FIELDS.map(field => (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={field} className="text-sm font-medium">
                      {field.charAt(0).toUpperCase() + field.slice(1)} *
                    </Label>
                    <Select
                      value={columnMappings[field] || ""}
                      onValueChange={(value) => setColumnMappings(prev => ({ 
                        ...prev, 
                        [field]: value === "none" ? "" : value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('notMapped')}</SelectItem>
                        {availableColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">{t('optionalFieldsPrescription')}</h4>
                {OPTIONAL_FIELDS.map(field => (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={field} className="text-sm font-medium">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                    </Label>
                    <Select
                      value={columnMappings[field] || ""}
                      onValueChange={(value) => setColumnMappings(prev => ({ 
                        ...prev, 
                        [field]: value === "none" ? "" : value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('notMapped')}</SelectItem>
                        {availableColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t('back')}
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!columnMappings.name}
              >
                {t('importClients')}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('importFailed')}</AlertTitle>
              <AlertDescription>
                {t('fixIssuesAndRetry')}
              </AlertDescription>
            </Alert>

            <div className="max-h-60 overflow-y-auto border rounded p-3">
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    {error}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t('back')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
