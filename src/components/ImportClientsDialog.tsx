
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

interface ImportClientsDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (importedClients: any[]) => void
}

const REQUIRED_FIELDS = ['name', 'phone']
const OPTIONAL_FIELDS = ['right_eye_sph', 'right_eye_cyl', 'right_eye_axe', 'left_eye_sph', 'left_eye_cyl', 'Add']

export const ImportClientsDialog = ({ isOpen, onClose, onImport }: ImportClientsDialogProps) => {
  const { toast } = useToast()
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
        title: "Invalid file type",
        description: "Please upload a CSV or XLSX file",
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
            title: "Error reading XLSX file",
            description: "Please make sure the file is a valid Excel file",
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
            title: "Error reading CSV file",
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
    
    // Check for missing required fields
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      if (!client.name || client.name.toString().trim() === "") {
        errors.push(`Row ${i + 1}: Missing client name`)
      }
      if (!client.phone || client.phone.toString().trim() === "") {
        errors.push(`Row ${i + 1}: Missing phone number`)
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
            if (value !== undefined && value !== null && value !== "") {
              client[field] = field.includes('eye') || field === 'Add' ? Number(value) : value
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
      resetDialog()
      toast({
        title: "Success",
        description: `${clients.length} client(s) imported successfully`,
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
            title: "Error importing XLSX",
            description: "Failed to process the Excel file",
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
            title: "Error importing CSV",
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
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Import your clients from a CSV or XLSX file. The file should contain at least name and phone columns.
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
              <Label htmlFor="hasHeaders">First row contains column headers</Label>
            </div>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV or XLSX file</p>
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
                <h4 className="font-medium">Preview (first 5 rows):</h4>
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
                Cancel
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!file || availableColumns.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Column Mapping</AlertTitle>
              <AlertDescription>
                Map the columns in your file to client fields. Required fields are marked with *.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Required Fields</h4>
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
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not mapped --</SelectItem>
                        {availableColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">Optional Fields (Prescription)</h4>
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
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not mapped --</SelectItem>
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
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!columnMappings.name || !columnMappings.phone}
              >
                Import Clients
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>
                Please fix the following issues and try again:
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
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
