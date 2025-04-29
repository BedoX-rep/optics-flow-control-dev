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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Phone must be at least 8 characters"),
  gender: z.enum(["Mr", "Mme", "Enf"]),
  right_eye_sph: z.string().optional(),
  right_eye_cyl: z.string().optional(),
  right_eye_axe: z.string().optional(),
  left_eye_sph: z.string().optional(),
  left_eye_cyl: z.string().optional(),
  left_eye_axe: z.string().optional(),
  Add: z.string().optional(),
  assurance: z.string().optional()
})

interface AddClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: (client: { id: string; name: string }) => void
}

const AddClientDialog = ({ isOpen, onClose, onClientAdded }: AddClientDialogProps) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      gender: undefined,
      Add: "", // Added default value for Add field
      assurance: "", // Added default value for Assurance field
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Fix the clientData by ensuring name is included and not optional
      const clientData = {
        user_id: user?.id,
        name: values.name,
        phone: values.phone,
        gender: values.gender,
        right_eye_sph: values.right_eye_sph ? parseFloat(values.right_eye_sph) : 0,
        right_eye_cyl: values.right_eye_cyl ? parseFloat(values.right_eye_cyl) : 0,
        right_eye_axe: values.right_eye_axe ? parseInt(values.right_eye_axe) : 0,
        left_eye_sph: values.left_eye_sph ? parseFloat(values.left_eye_sph) : 0,
        left_eye_cyl: values.left_eye_cyl ? parseFloat(values.left_eye_cyl) : 0,
        left_eye_axe: values.left_eye_axe ? parseInt(values.left_eye_axe) : 0,
        Add: values.Add ? parseFloat(values.Add) : 0,
        assurance: values.assurance || null
      }

      const { data, error } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Client added successfully",
      })

      onClientAdded({
        id: data.id,
        name: data.name,
        phone: data.phone,
        gender: data.gender
      })
      onClose()
      form.reset()
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
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

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Client</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddClientDialog