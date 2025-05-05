
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Phone must be at least 8 characters"),
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
  assurance: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
})

interface EditClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientUpdated: (id: string, name: string, phone: string) => void
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
    assurance?: string | null;
  };
}

const EditClientDialog = ({ isOpen, onClose, onClientUpdated, client }: EditClientDialogProps) => {
  const { toast } = useToast()
  const { user } = useAuth()

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
      notes: client?.notes || "",
      assurance: client?.assurance || ""
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
        notes: client.notes || "",
        assurance: client.assurance || ""
      });
    }
  }, [client, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user?.id) return;
      
      const clientData = {
        user_id: user.id,
        ...values
      }

      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', client.id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Client updated successfully",
      })

      onClientUpdated(
        data.id,
        data.name,
        data.phone
      )
      onClose()
      form.reset()
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
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-green-200 focus-visible:ring-green-300" />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" className="border-green-200 focus-visible:ring-green-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Right Eye</h3>
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
                            className="h-8 border-green-200 focus-visible:ring-green-300"
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
                            className="h-8 border-green-200 focus-visible:ring-green-300"
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
                            className="h-8 border-green-200 focus-visible:ring-green-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Left Eye</h3>
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
                            className="h-8 border-green-200 focus-visible:ring-green-300"
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
                            className="h-8 border-green-200 focus-visible:ring-green-300"
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
                            className="h-8 border-green-200 focus-visible:ring-green-300"
                          />
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
                      className="h-8 border-green-200 focus-visible:ring-green-300"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assurance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assurance</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" className="h-8 border-green-200 focus-visible:ring-green-300" />
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
                    <Input {...field} type="text" className="border-green-200 focus-visible:ring-green-300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="border-green-200">
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Update Client</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditClientDialog
