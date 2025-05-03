
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Phone must be at least 8 characters"),
  gender: z.enum(["Mr", "Mme", "Enf"]),
  right_eye_sph: z.string().transform((val) => val === '' ? undefined : parseFloat(val)).optional(),
  right_eye_cyl: z.string().transform((val) => val === '' ? undefined : parseFloat(val)).optional(),
  right_eye_axe: z.union([
    z.string().transform((val) => val === '' ? undefined : parseInt(val)),
    z.number()
  ]).optional(),
  left_eye_sph: z.string().transform((val) => val === '' ? undefined : parseFloat(val)).optional(),
  left_eye_cyl: z.string().transform((val) => val === '' ? undefined : parseFloat(val)).optional(),
  left_eye_axe: z.union([
    z.string().transform((val) => val === '' ? undefined : parseInt(val)),
    z.number()
  ]).optional(),
  Add: z.string().transform((val) => val === '' ? undefined : parseFloat(val)).optional(),
  assurance: z.string().optional(),
  notes: z.string().nullable().optional()
})

interface EditClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientUpdated: (client: { id: string; name: string }) => void
  client: {
    id: string;
    name: string;
    phone: string;
    gender: "Mr" | "Mme" | "Enf";
    right_eye_sph?: number;
    right_eye_cyl?: number;
    right_eye_axe?: number;
    left_eye_sph?: number;
    left_eye_cyl?: number;
    left_eye_axe?: number;
    notes?: string;
  };
}

const EditClientDialog = ({ isOpen, onClose, onClientUpdated, client }: EditClientDialogProps) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [gender, setGender] = useState<"Mr" | "Mme" | "Enf">(client?.gender || "Mr");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || "",
      phone: client?.phone || "",
      gender: client?.gender,
      right_eye_sph: client?.right_eye_sph?.toString() || "",
      right_eye_cyl: client?.right_eye_cyl?.toString() || "",
      right_eye_axe: client?.right_eye_axe,
      left_eye_sph: client?.left_eye_sph?.toString() || "",
      left_eye_cyl: client?.left_eye_cyl?.toString() || "",
      left_eye_axe: client?.left_eye_axe,
      notes: client?.notes || ""
    },
  })

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone,
        gender: client.gender,
        right_eye_sph: client.right_eye_sph !== undefined ? client.right_eye_sph.toString() : "",
        right_eye_cyl: client.right_eye_cyl !== undefined ? client.right_eye_cyl.toString() : "",
        right_eye_axe: client.right_eye_axe,
        left_eye_sph: client.left_eye_sph !== undefined ? client.left_eye_sph.toString() : "",
        left_eye_cyl: client.left_eye_cyl !== undefined ? client.left_eye_cyl.toString() : "",
        left_eye_axe: client.left_eye_axe,
        notes: client.notes || ""
      });
      setGender(client.gender);
    }
  }, [client, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const clientData = {
        user_id: user?.id,
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

      onClientUpdated({
        id: data.id,
        name: data.name,
      })
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mme">Mme</SelectItem>
                      <SelectItem value="Enf">Enf</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Right Eye</h3>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="right_eye_sph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Sph</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(undefined);
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
                        <FormLabel className="text-xs">Cyl</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(undefined);
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
                        <FormLabel className="text-xs">Axe</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Math.round(Number(e.target.value));
                              field.onChange(value);
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
                <h3 className="text-sm font-medium">Left Eye</h3>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="left_eye_sph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Sph</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(undefined);
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
                        <FormLabel className="text-xs">Cyl</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange(undefined);
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
                        <FormLabel className="text-xs">Axe</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Math.round(Number(e.target.value));
                              field.onChange(value);
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
            <FormField
              control={form.control}
              name="Add"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      {...field} 
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(undefined);
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
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Update Client</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditClientDialog
