
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter client name" />
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
                      <Input {...field} type="tel" placeholder="Enter phone number" />
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
                        <FormLabel className="text-xs">CYL</FormLabel>
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
                        <FormLabel className="text-xs">AXE</FormLabel>
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
                <h3 className="text-sm font-medium">Left Eye</h3>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="left_eye_sph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">SPH</FormLabel>
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
                        <FormLabel className="text-xs">CYL</FormLabel>
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
                        <FormLabel className="text-xs">AXE</FormLabel>
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
                  <FormLabel>Add</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" className="h-8" />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                form.reset()
                onClose()
              }}>
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
