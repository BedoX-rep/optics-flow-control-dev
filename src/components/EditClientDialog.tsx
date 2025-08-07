
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
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  right_eye_sph: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number()
  ]).nullable(),
  right_eye_cyl: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number()
  ]).nullable(),
  right_eye_axe: z.union([
    z.string().transform((val) => val === '' ? null : parseInt(val)),
    z.number()
  ]).nullable(),
  left_eye_sph: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number()
  ]).nullable(),
  left_eye_cyl: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number()
  ]).nullable(),
  left_eye_axe: z.union([
    z.string().transform((val) => val === '' ? null : parseInt(val)),
    z.number()
  ]).nullable(),
  Add: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number()
  ]).nullable(),
  pd_distance: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number()
  ]).nullable(),
  assurance: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  renewal_date: z.string().nullable().optional(),
  need_renewal: z.boolean().optional(),
  renewal_times: z.number().optional(),
  store_prescription: z.boolean().optional(),
  optician_prescribed_by: z.string().nullable().optional()
})

interface EditClientDialogProps {
  isOpen: boolean
  onClose: () => void
  client: {
    id: string;
    name: string;
    phone: string;
    right_eye_sph?: number | null;
    right_eye_cyl?: number | null;
    right_eye_axe?: number | null;
    left_eye_sph?: number | null;
    left_eye_cyl?: number | null;
    left_eye_axe?: number | null;
    notes?: string | null;
    Add?: number | null;
    pd_distance?: number | null;
    assurance?: string | null;
    renewal_date?: string | null;
    need_renewal?: boolean;
    renewal_times?: number | null;
    store_prescription?: boolean;
    optician_prescribed_by?: string | null;
  };
}

const EditClientDialog = ({ isOpen, onClose, client }: EditClientDialogProps) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const { t } = useLanguage()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || "",
      phone: client?.phone || "",
      right_eye_sph: client?.right_eye_sph !== undefined && client?.right_eye_sph !== null ? client.right_eye_sph : null,
      right_eye_cyl: client?.right_eye_cyl !== undefined && client?.right_eye_cyl !== null ? client.right_eye_cyl : null,
      right_eye_axe: client?.right_eye_axe !== undefined && client?.right_eye_axe !== null ? client.right_eye_axe : null,
      left_eye_sph: client?.left_eye_sph !== undefined && client?.left_eye_sph !== null ? client.left_eye_sph : null,
      left_eye_cyl: client?.left_eye_cyl !== undefined && client?.left_eye_cyl !== null ? client.left_eye_cyl : null,
      left_eye_axe: client?.left_eye_axe !== undefined && client?.left_eye_axe !== null ? client.left_eye_axe : null,
      Add: client?.Add !== undefined && client?.Add !== null ? client.Add : null,
      pd_distance: client?.pd_distance !== undefined && client?.pd_distance !== null ? client.pd_distance : null,
      notes: client?.notes || "",
      assurance: client?.assurance || "",
      renewal_date: client?.renewal_date || "",
      need_renewal: client?.need_renewal || false,
      renewal_times: client?.renewal_times || 0,
      store_prescription: client?.store_prescription || false,
      optician_prescribed_by: client?.optician_prescribed_by || ""
    },
  })

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone,
        right_eye_sph: client.right_eye_sph !== undefined && client.right_eye_sph !== null ? client.right_eye_sph : null,
        right_eye_cyl: client.right_eye_cyl !== undefined && client.right_eye_cyl !== null ? client.right_eye_cyl : null,
        right_eye_axe: client.right_eye_axe !== undefined && client.right_eye_axe !== null ? client.right_eye_axe : null,
        left_eye_sph: client.left_eye_sph !== undefined && client.left_eye_sph !== null ? client.left_eye_sph : null,
        left_eye_cyl: client.left_eye_cyl !== undefined && client.left_eye_cyl !== null ? client.left_eye_cyl : null,
        left_eye_axe: client.left_eye_axe !== undefined && client.left_eye_axe !== null ? client.left_eye_axe : null,
        Add: client.Add !== undefined && client.Add !== null ? client.Add : null,
        pd_distance: client.pd_distance !== undefined && client.pd_distance !== null ? client.pd_distance : null,
        notes: client.notes || "",
        assurance: client.assurance || "",
        renewal_date: client.renewal_date || "",
        need_renewal: client.need_renewal || false,
        renewal_times: client.renewal_times || 0,
        store_prescription: client.store_prescription || false,
        optician_prescribed_by: client.optician_prescribed_by || ""
      });
    }
  }, [client, form]);

  const queryClient = useQueryClient();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to update a client",
          variant: "destructive",
        })
        return;
      }
      
      const clientData = {
        name: values.name,
        phone: values.phone,
        right_eye_sph: values.right_eye_sph,
        right_eye_cyl: values.right_eye_cyl,
        right_eye_axe: values.right_eye_axe,
        left_eye_sph: values.left_eye_sph,
        left_eye_cyl: values.left_eye_cyl,
        left_eye_axe: values.left_eye_axe,
        Add: values.Add,
        pd_distance: values.pd_distance,
        assurance: values.assurance || null,
        notes: values.notes || null,
        renewal_date: values.renewal_date || null,
        need_renewal: values.need_renewal,
        renewal_times: values.renewal_times,
        store_prescription: values.store_prescription,
        optician_prescribed_by: values.optician_prescribed_by || null
      }

      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', client.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['all-clients', user.id] });
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });

      onClose();
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>{t('editClient')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>{t('phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('rightEyeShort')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="right_eye_sph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">SPH</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            value={field.value !== null ? field.value : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(null);
                                return;
                              }
                              if (/^-?\d*\.?\d*$/.test(value)) {
                                field.onChange(value);
                              }
                            }}
                            className="h-8"
                          />
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
                        <FormLabel className="text-xs">CYL</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            value={field.value !== null ? field.value : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(null);
                                return;
                              }
                              if (/^-?\d*\.?\d*$/.test(value)) {
                                field.onChange(value);
                              }
                            }}
                            className="h-8"
                          />
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
                        <FormLabel className="text-xs">AXE</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            value={field.value !== null ? field.value : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(null);
                                return;
                              }
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                field.onChange(numValue);
                              }
                            }} 
                            className="h-8"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('leftEyeShort')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="left_eye_sph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">SPH</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            value={field.value !== null ? field.value : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(null);
                                return;
                              }
                              if (/^-?\d*\.?\d*$/.test(value)) {
                                field.onChange(value);
                              }
                            }}
                            className="h-8"
                          />
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
                        <FormLabel className="text-xs">CYL</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            value={field.value !== null ? field.value : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(null);
                                return;
                              }
                              if (/^-?\d*\.?\d*$/.test(value)) {
                                field.onChange(value);
                              }
                            }}
                            className="h-8"
                          />
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
                        <FormLabel className="text-xs">AXE</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            value={field.value !== null ? field.value : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(null);
                                return;
                              }
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                field.onChange(numValue);
                              }
                            }} 
                            className="h-8"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="Add"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        value={field.value !== null ? field.value : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange(null);
                            return;
                          }
                          if (/^-?\d*\.?\d*$/.test(value)) {
                            field.onChange(value);
                          }
                        }}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pd_distance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pdDistance') || 'PD Distance'}</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        value={field.value !== null ? field.value : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange(null);
                            return;
                          }
                          if (/^-?\d*\.?\d*$/.test(value)) {
                            field.onChange(value);
                          }
                        }}
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="text-md font-medium">{t('prescriptionStorage')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="store_prescription"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('storePrescription')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="optician_prescribed_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('opticianPrescribedBy')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="assurance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assurance</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" className="h-8" />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 mt-6">
              <h3 className="text-md font-medium">{t('renewalInformation')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="renewal_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('renewalDate')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
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
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('needRenewalField')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="renewal_times"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('renewalTimes')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="submit">{t('updateClient')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditClientDialog
