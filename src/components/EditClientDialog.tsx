
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tables } from '@/integrations/supabase/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  right_eye_sph: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  left_eye_sph: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  right_eye_cyl: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  left_eye_cyl: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  right_eye_axe: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  left_eye_axe: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
});

type FormValues = z.infer<typeof formSchema>;

// Use the Tables type from Supabase types
type Client = Tables<'clients'>;

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSave: (data: Partial<Client>) => void;
  isLoading?: boolean;
}

const EditClientDialog: React.FC<EditClientDialogProps> = ({
  open,
  onOpenChange,
  client,
  onSave,
  isLoading = false,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || '',
      phone: client?.phone || '',
      // These fields don't exist in the Client type but are in our form
      // Initialize them as empty strings since they're optional
      email: '',
      address: '',
      city: '',
      notes: client?.notes || '',
      right_eye_sph: client?.right_eye_sph !== undefined ? client.right_eye_sph : undefined,
      left_eye_sph: client?.left_eye_sph !== undefined ? client.left_eye_sph : undefined,
      right_eye_cyl: client?.right_eye_cyl !== undefined ? client.right_eye_cyl : undefined,
      left_eye_cyl: client?.left_eye_cyl !== undefined ? client.left_eye_cyl : undefined,
      right_eye_axe: client?.right_eye_axe !== undefined ? client.right_eye_axe : undefined,
      left_eye_axe: client?.left_eye_axe !== undefined ? client.left_eye_axe : undefined,
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSave({
      name: data.name,
      phone: data.phone,
      notes: data.notes,
      // Only include eye prescription fields if they're defined
      right_eye_sph: data.right_eye_sph !== undefined ? Number(data.right_eye_sph) : undefined,
      left_eye_sph: data.left_eye_sph !== undefined ? Number(data.left_eye_sph) : undefined,
      right_eye_cyl: data.right_eye_cyl !== undefined ? Number(data.right_eye_cyl) : undefined,
      left_eye_cyl: data.left_eye_cyl !== undefined ? Number(data.left_eye_cyl) : undefined,
      right_eye_axe: data.right_eye_axe !== undefined ? Number(data.right_eye_axe) : undefined,
      left_eye_axe: data.left_eye_axe !== undefined ? Number(data.left_eye_axe) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prescription Information */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="font-medium text-sm mb-2">Prescription Information</h3>
              </div>
              <FormField
                control={form.control}
                name="right_eye_sph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPH Right</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.25"
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="left_eye_sph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPH Left</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.25"
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                    <FormLabel>CYL Right</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.25"
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                    <FormLabel>CYL Left</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.25"
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                    <FormLabel>AXIS Right</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                    <FormLabel>AXIS Left</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
