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
import { User, Eye, Phone, FileText, Shield, X, Save, Calendar, Hash } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

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
  renewal_times: z.number(),
  optician_prescribed_by: z.string().nullable()
})

interface ClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded?: (client: any) => Promise<void>
  client?: any // If provided, we are in EDIT mode
}

const ClientDialog = ({ isOpen, onClose, onClientAdded, client }: ClientDialogProps) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const isEdit = !!client;

  // Calculate default renewal date (today + 1 year)
  const defaultRenewalDate = new Date();
  defaultRenewalDate.setFullYear(defaultRenewalDate.getFullYear() + 1);
  const defaultRenewalDateString = defaultRenewalDate.toISOString().split('T')[0];

  const [renewalInputType, setRenewalInputType] = useState<"date" | "times">("date");

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
      renewal_times: 0,
      optician_prescribed_by: ""
    },
  })

  // Reset form when client changes (e.g. switching from Add to Edit or between different clients)
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name || "",
        phone: client.phone || "",
        right_eye_sph: client.right_eye_sph || 0,
        right_eye_cyl: client.right_eye_cyl || 0,
        right_eye_axe: client.right_eye_axe || 0,
        left_eye_sph: client.left_eye_sph || 0,
        left_eye_cyl: client.left_eye_cyl || 0,
        left_eye_axe: client.left_eye_axe || 0,
        Add: client.Add || 0,
        assurance: client.assurance || "",
        notes: client.notes || "",
        renewal_date: client.renewal_date || defaultRenewalDateString,
        need_renewal: client.need_renewal || false,
        renewal_times: client.renewal_times || 0,
        optician_prescribed_by: client.optician_prescribed_by || ""
      });
      if (client.renewal_times > 0 && !client.renewal_date) {
        setRenewalInputType("times");
      } else {
        setRenewalInputType("date");
      }
    } else {
      form.reset({
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
        renewal_times: 0,
        optician_prescribed_by: ""
      });
      setRenewalInputType("date");
    }
  }, [client, form, defaultRenewalDateString]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        toast({
          title: t('error'),
          description: t('mustBeLoggedIn'),
          variant: "destructive",
        })
        return;
      }

      const clientPayload = {
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
        renewal_date: renewalInputType === "date" ? values.renewal_date : null,
        need_renewal: isEdit ? values.need_renewal : false,
        renewal_times: renewalInputType === "times" ? values.renewal_times : 0,
        optician_prescribed_by: values.optician_prescribed_by || null,
        is_deleted: false
      };

      let result;
      if (isEdit) {
        const { data, error } = await supabase
          .from('clients')
          .update(clientPayload)
          .eq('id', client.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert(clientPayload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (onClientAdded && result) {
        await onClientAdded(result);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      }

      form.reset();
      onClose();

      toast({
        title: t('success'),
        description: isEdit ? t('clientUpdatedSuccessfully') : t('clientAddedSuccessfully'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('actionFailed'),
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const labelClasses = "text-[11px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1 ml-1 mb-1.5 block";
  const inputBgClasses = "bg-black/[0.04] border-none focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 rounded-[1rem] h-10 transition-all font-bold text-slate-800";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl bg-[#E2E2DE] p-0 overflow-y-auto max-h-[96vh] custom-scrollbar">
        {/* Header - Matching Appointment style but more compact */}
        <DialogHeader className="p-4 pb-5 bg-gradient-to-b from-[#063D31] to-[#042F26] text-white relative rounded-b-[2rem] shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-teal-200/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 mb-1">
              <User className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-black tracking-[0.2em] uppercase leading-none">
              {isEdit ? t('editClient') : t('newClient')}
            </DialogTitle>
            <p className="text-teal-50/70 text-[10px] font-medium tracking-widest uppercase mt-0.5">
              {isEdit ? t('modifyClientDetails') : t('createNewClientRecord')}
            </p>
          </div>
        </DialogHeader>

        <div className="p-6 pt-5 space-y-6 relative z-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Basic Information Section */}
              <div className="space-y-4">
                <Label className={labelClasses}>{t('basicInformation')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('enterClientName')}
                            className={cn(inputBgClasses, "h-12 text-lg")}
                          />
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
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8E8E8A]" />
                            <Input
                              {...field}
                              type="tel"
                              placeholder={t('enterPhoneNumber')}
                              className={cn(inputBgClasses, "pl-12 h-12 text-lg")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Eye Prescription Section */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#063D31]/10 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-[#063D31]" />
                  </div>
                  <Label className={labelClasses + " ml-0 mb-0"}>{t('eyePrescription')}</Label>
                </div>

                <div className="bg-black/[0.03] p-5 rounded-[1.5rem] border border-black/[0.02]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Right Eye */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5">
                        <span className="text-[10px] font-black text-[#063D31] uppercase tracking-[0.2em]">{t('rightEyeShort')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {['sph', 'cyl', 'axe'].map((key) => (
                          <FormField
                            key={`right_eye_${key}`}
                            control={form.control}
                            name={`right_eye_${key}` as any}
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-[9px] font-black text-[#8E8E8A] uppercase text-center block mb-1 tracking-widest">{t(key)}</Label>
                                <FormControl>
                                  <Input {...field} className={cn(inputBgClasses, "text-center font-mono")} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Left Eye */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5">
                        <span className="text-[10px] font-black text-[#063D31] uppercase tracking-[0.2em]">{t('leftEyeShort')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {['sph', 'cyl', 'axe'].map((key) => (
                          <FormField
                            key={`left_eye_${key}`}
                            control={form.control}
                            name={`left_eye_${key}` as any}
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-[9px] font-black text-[#8E8E8A] uppercase text-center block mb-1 tracking-widest">{t(key)}</Label>
                                <FormControl>
                                  <Input {...field} className={cn(inputBgClasses, "text-center font-mono")} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/5 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <FormField
                      control={form.control}
                      name="Add"
                      render={({ field }) => (
                        <FormItem className="max-w-[150px]">
                          <Label className="text-[10px] font-black text-[#5C5C59] uppercase tracking-widest ml-1">{t('addPower')}</Label>
                          <FormControl>
                            <Input {...field} className={cn(inputBgClasses, "text-center")} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="optician_prescribed_by"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-[10px] font-black text-[#5C5C59] uppercase tracking-widest ml-1">{t('opticianPrescribedBy')}</Label>
                          <FormControl>
                            <Input {...field} placeholder={t('enterOpticianName')} className={inputBgClasses} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Additional & Renewal Combined */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Additional Info */}
                <div className="space-y-4">
                  <Label className={labelClasses}>{t('additionalInformation')}</Label>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="assurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#063D31]" />
                              <Input {...field} placeholder={t('enterAssurance')} className={cn(inputBgClasses, "pl-11")} />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#063D31]" />
                              <Input {...field} placeholder={t('enterNotes')} className={cn(inputBgClasses, "pl-11")} />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Renewal Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className={labelClasses + " ml-0 mb-0"}>{t('renewalInformation')}</Label>
                    {isEdit && (
                      <FormField
                        control={form.control}
                        name="need_renewal"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition-all">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-3.5 w-3.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                            </FormControl>
                            <FormLabel className="text-[9px] font-black text-rose-700 uppercase tracking-tighter cursor-pointer">{t('needRenewalField')}</FormLabel>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="bg-[#B5B5B2]/40 p-1.5 rounded-[1.5rem] shadow-inner flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRenewalInputType('date')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                        renewalInputType === 'date' ? "bg-[#063D31] text-white shadow-lg" : "text-[#5C5C59] hover:bg-black/5"
                      )}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {t('customRenewalDate')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewalInputType('times')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                        renewalInputType === 'times' ? "bg-[#063D31] text-white shadow-lg" : "text-[#5C5C59] hover:bg-black/5"
                      )}
                    >
                      <Hash className="h-3.5 w-3.5" />
                      {t('renewalTimes')}
                    </button>
                  </div>

                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    {renewalInputType === "date" ? (
                      <FormField
                        control={form.control}
                        name="renewal_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative group">
                                <Input
                                  {...field}
                                  type="date"
                                  className={cn(inputBgClasses, "appearance-none pr-10")}
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E8A] pointer-events-none" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="renewal_times"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E8A]" />
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  className={cn(inputBgClasses, "pl-11")}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2 rounded-xl font-black uppercase text-xs tracking-[0.2em] text-[#063D31] hover:translate-y-[-2px] transition-all border-b-2 border-[#063D31]"
                >
                  {t('cancel')}
                </button>
                <Button
                  type="submit"
                  className="px-10 h-14 rounded-[2rem] bg-gradient-to-br from-[#063D31] to-[#042F26] text-white font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:shadow-teal-900/40 hover:translate-y-[-2px] transition-all active:scale-95 border-none"
                >
                  <Save className="h-5 w-5 mr-3" />
                  {isEdit ? t('update') : t('create')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClientDialog