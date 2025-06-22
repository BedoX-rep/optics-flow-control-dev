import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/AuthProvider"
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from './LanguageProvider'
import { User, Phone, Eye, FileText, Shield, Check } from "lucide-react"
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  right_eye_sph: z.union([z.string().transform(val => val === '' ? null : parseFloat(val)), z.number()]).nullable(),
  right_eye_cyl: z.union([z.string().transform(val => val === '' ? null : parseFloat(val)), z.number()]).nullable(),
  right_eye_axe: z.union([z.string().transform(val => val === '' ? null : parseInt(val)), z.number()]).nullable(),
  left_eye_sph: z.union([z.string().transform(val => val === '' ? null : parseFloat(val)), z.number()]).nullable(),
  left_eye_cyl: z.union([z.string().transform(val => val === '' ? null : parseFloat(val)), z.number()]).nullable(),
  left_eye_axe: z.union([z.string().transform(val => val === '' ? null : parseInt(val)), z.number()]).nullable(),
  Add: z.union([z.string().transform(val => val === '' ? null : parseFloat(val)), z.number()]).nullable(),
  assurance: z.string().nullable(),
  notes: z.string().nullable()
})

interface AddClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded?: (client: any) => Promise<void>
}

const AddClientDialog = ({ isOpen, onClose, onClientAdded }: AddClientDialogProps) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      right_eye_sph: 0,
      right_eye_cyl: 0,
      right_eye_axe: 0,
      left_eye_sph: 0,
      left_eye_cyl: 0,
      left_eye_axe: 0,
      Add: 0,
      assurance: "",
      notes: ""
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a client",
          variant: "destructive",
        })
        return;
      }

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: values.name,
          phone: values.phone,
          right_eye_sph: values.right_eye_sph,
          right_eye_cyl: values.right_eye_cyl,
          right_eye_axe: values.right_eye_axe,
          left_eye_sph: values.left_eye_sph,
          left_eye_cyl: values.left_eye_cyl,
          left_eye_axe: values.left_eye_axe,
          Add: values.Add,
          assurance: values.assurance || null,
          notes: values.notes || null,
          is_deleted: false
        })
        .select()
        .single();

      if (error) throw error;
      
      if (onClientAdded && client) {
        await onClientAdded(client);
      } else {
        await queryClient.invalidateQueries(['clients']);
      }
      
      form.reset();
      onClose();
      
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="space-y-2 pb-4 border-b relative">
          <DialogTitle className="text-2xl font-semibold text-gray-900 pr-16">
            {t('addClient')}
          </DialogTitle>
          <Button
            type="submit"
            form="client-form"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
            size="sm"
          >
            <Check className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <form id="client-form" className="space-y-6 p-4" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Personal Information */}
            <div className="space-y-4">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                    <User className="h-4 w-4" />
                    {t('personalInformation') || 'Personal Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">{t('clientName')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('enterClientName')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">{t('phoneNumber')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder={t('enterPhoneNumber')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                    <Shield className="h-4 w-4" />
                    {t('additionalInfo') || 'Additional Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="assurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">{t('assurance')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">{t('notes')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Eye Prescription */}
            <div className="space-y-4">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                    <Eye className="h-4 w-4" />
                    {t('eyePrescription') || 'Eye Prescription'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">{t('rightEyeShort')}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="right_eye_sph"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">{t('sph')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="right_eye_cyl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">{t('cyl')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="right_eye_axe"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">{t('axe')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">{t('leftEyeShort')}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="left_eye_sph"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">{t('sph')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="left_eye_cyl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">{t('cyl')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="left_eye_axe"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">{t('axe')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="Add"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Add</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddClientDialog