
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client } from '@/integrations/supabase/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  sph_right: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  sph_left: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  cyl_right: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  cyl_left: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  axis_right: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  axis_left: z.number().optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
});

type FormValues = z.infer<typeof formSchema>;

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
      first_name: client?.first_name || '',
      last_name: client?.last_name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      city: client?.city || '',
      notes: client?.notes || '',
      sph_right: client?.sph_right !== undefined ? client.sph_right : undefined,
      sph_left: client?.sph_left !== undefined ? client.sph_left : undefined,
      cyl_right: client?.cyl_right !== undefined ? client.cyl_right : undefined,
      cyl_left: client?.cyl_left !== undefined ? client.cyl_left : undefined,
      axis_right: client?.axis_right !== undefined ? client.axis_right : undefined,
      axis_left: client?.axis_left !== undefined ? client.axis_left : undefined,
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSave({
      ...data,
      // Make sure to convert string values to numbers for these fields
      sph_right: data.sph_right !== undefined ? Number(data.sph_right) : undefined,
      sph_left: data.sph_left !== undefined ? Number(data.sph_left) : undefined,
      cyl_right: data.cyl_right !== undefined ? Number(data.cyl_right) : undefined,
      cyl_left: data.cyl_left !== undefined ? Number(data.cyl_left) : undefined,
      axis_right: data.axis_right !== undefined ? Number(data.axis_right) : undefined,
      axis_left: data.axis_left !== undefined ? Number(data.axis_left) : undefined,
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
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
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
                name="sph_right"
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
                name="sph_left"
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
                name="cyl_right"
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
                name="cyl_left"
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
                name="axis_right"
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
                name="axis_left"
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
