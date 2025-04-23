
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
  gender: z.enum(["Mr", "Mme", "Enf"])
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
      gender: "Mr",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const clientData = {
        user_id: user?.id,
        name: values.name,
        phone: values.phone,
        gender: values.gender,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <div className="flex justify-end gap-4">
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
