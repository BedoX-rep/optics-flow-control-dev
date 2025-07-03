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
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/AuthProvider"
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from './LanguageProvider'
import { User, Eye, Phone, FileText, Shield, X, Save, Calendar } from 'lucide-react'

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
  notes: z.string().nullable(),
  renewal_date: z.string().nullable(),
  need_renewal: z.boolean(),
  renewal_times: z.number()
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

  // Calculate default renewal date (today + 1.5 years)
  const defaultRenewalDate = new Date();
  defaultRenewalDate.setMonth(defaultRenewalDate.getMonth() + 18);
  const defaultRenewalDateString = defaultRenewalDate.toISOString().split('T')[0];

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
      notes: "",
      renewal_date: defaultRenewalDateString,
      need_renewal: false,
      renewal_times: 0
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
          renewal_date: values.renewal_date || null,
          need_renewal: values.need_renewal,
          renewal_times: values.renewal_times,
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

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px] bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 shadow-xl">
        <DialogHeader className="relative pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-light text-teal-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              {t('addClient')}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-teal-600 hover:text-teal-800 hover:bg-teal-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent mt-4"></div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-teal-100">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-teal-600" />
                <h3 className="text-lg font-medium text-teal-800">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium">{t('clientName')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t('enterClientName')} 
                          className="border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80"
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {t('phoneNumber')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel" 
                          placeholder={t('enterPhoneNumber')} 
                          className="border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80"
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Eye Prescription */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-teal-100">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-teal-600" />
                <h3 className="text-lg font-medium text-teal-800">Eye Prescription</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Right Eye */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-teal-100">
                    <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                    <h4 className="font-medium text-teal-700">{t('rightEyeShort')}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="right_eye_sph"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-teal-600">{t('sph')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text" 
                              className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80 text-center" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="right_eye_cyl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-teal-600">{t('cyl')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text" 
                              className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80 text-center" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="right_eye_axe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-teal-600">{t('axe')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text" 
                              className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80 text-center" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Left Eye */}
                <div className="space-y-4 relative">
                  <div className="flex items-center gap-2 pb-2 border-b border-teal-100">
                    <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                    <h4 className="font-medium text-teal-700">{t('leftEyeShort')}</h4>
                    <Button 
                      type="submit"
                      size="icon"
                      className="bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 w-10 absolute"
                      style={{ right: '-30px' }}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="left_eye_sph"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-teal-600">{t('sph')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text" 
                              className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80 text-center" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="left_eye_cyl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-teal-600">{t('cyl')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text" 
                              className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80 text-center" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="left_eye_axe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-teal-600">{t('axe')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text" 
                              className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80 text-center" 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Add Power */}
              <div className="mt-6 max-w-xs">
                <FormField
                  control={form.control}
                  name="Add"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium">Add Power</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          className="h-9 border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-teal-100">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-teal-600" />
                <h3 className="text-lg font-medium text-teal-800">Additional Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        {t('assurance')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          className="border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium">{t('notes')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          className="border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Renewal Information */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-teal-100">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-teal-600" />
                <h3 className="text-lg font-medium text-teal-800">Renewal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="renewal_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium">Renewal Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date" 
                          className="border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="need_renewal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-teal-300"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-teal-700 font-medium">Need Renewal</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="renewal_times"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-teal-700 font-medium">Renewal Times</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0"
                          className="border-teal-200 focus:border-teal-400 focus:ring-teal-200 bg-white/80"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>


          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddClientDialog