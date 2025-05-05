
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
import { Upload, FileText, AlertCircle, CheckCircle2, Info } from "lucide-react"
import Papa from "papaparse"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImportClientsDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (importedClients: any[]) => void
}

export const ImportClientsDialog = ({ isOpen, onClose, onImport }: ImportClientsDialogProps) => {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [hasHeaders, setHasHeaders] = useState(true)
  const [nameColumn, setNameColumn] = useState("name")
  const [phoneColumn, setPhoneColumn] = useState("phone")
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
    
    // Check if file is CSV
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }
    
    setFile(selectedFile)
    
    // Parse CSV for preview
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
          // Generate column names (Column 0, Column 1, etc.)
          const firstRow = results.data[0] as any
          const columns = Object.keys(firstRow).map((key, index) => `Column ${index}`)
          setAvailableColumns(columns)
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        })
      }
    })
  }

  const validateClients = (clients: any[]) => {
    const errors = []
    
    // Check for missing required fields
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      if (!client.name || client.name.trim() === "") {
        errors.push(`Row ${i + 1}: Missing name`)
      }
      if (!client.phone || client.phone.trim() === "") {
        errors.push(`Row ${i + 1}: Missing phone number`)
      }
    }
    
    return errors
  }
  
  const handleImport = () => {
    if (!file) return
    
    Papa.parse(file, {
      header: hasHeaders,
      skipEmptyLines: true,
      complete: (results) => {
        let clients = results.data.map((row: any) => {
          // Map columns based on user selection
          const clientName = hasHeaders ? row[nameColumn] : row[parseInt(nameColumn.replace("Column ", ""))]
          const clientPhone = hasHeaders ? row[phoneColumn] : row[parseInt(phoneColumn.replace("Column ", ""))]
          
          return {
            name: clientName,
            phone: clientPhone
          }
        })
        
        // Validate clients
        const validationErrors = validateClients(clients)
        if (validationErrors.length > 0) {
          setErrors(validationErrors)
          setStep(3) // Show errors
          return
        }
        
        onImport(clients)
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
  
  const resetDialog = () => {
    setFile(null)
    setPreviewData([])
    setAvailableColumns([])
    setStep(1)
    setErrors([])
  }
  
  const handleClose = () => {
    resetDialog()
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Import your clients from a CSV file. The file should contain at least name and phone columns.
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV file</p>
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {file && (
              <div className="flex items-center p-2 bg-green-50 rounded border border-green-200">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-700 font-medium">{file.name}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Input 
                type="checkbox" 
                id="hasHeaders" 
                className="w-4 h-4" 
                checked={hasHeaders} 
                onChange={(e) => setHasHeaders(e.target.checked)} 
              />
              <label htmlFor="hasHeaders" className="text-sm text-gray-700">
                File has header row
              </label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!file}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>Column Mapping</AlertTitle>
              <AlertDescription className="text-sm">
                Please match the columns from your CSV file to the correct client fields.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name Column (required)
                </label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={nameColumn}
                  onChange={(e) => setNameColumn(e.target.value)}
                >
                  {availableColumns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Column (required)
                </label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={phoneColumn}
                  onChange={(e) => setPhoneColumn(e.target.value)}
                >
                  {availableColumns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="border rounded overflow-x-auto max-h-60">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row: any, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {hasHeaders ? row[nameColumn] : row[parseInt(nameColumn.replace("Column ", ""))]}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {hasHeaders ? row[phoneColumn] : row[parseInt(phoneColumn.replace("Column ", ""))]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleImport}>
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
