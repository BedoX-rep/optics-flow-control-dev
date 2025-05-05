
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Phone must be at least 8 characters"),
})

interface AddClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddClient: (name: string, phone: string) => Promise<void>
  onClientAdded?: (client: any) => Promise<void> // Add optional property for NewReceipt page
}

const AddClientDialog = ({ isOpen, onClose, onAddClient, onClientAdded }: AddClientDialogProps) => {
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) return;

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: values.name,
          phone: values.phone
        })
        .select()
        .single();

      if (error) throw error;
      
      // If onClientAdded is provided (from NewReceipt page), call it with the client
      if (onClientAdded && client) {
        await onClientAdded(client);
      } else {
        // Invalidate the clients query to refresh the list
        await queryClient.invalidateQueries(['clients']);
      }
      
      form.reset();
      onClose();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
