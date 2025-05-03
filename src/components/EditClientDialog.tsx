import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from 'react-hook-form';
import { Client } from '@/types';
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateClient } from '@/lib/api';

const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  address: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
  vision_left: z.number().optional(),
  vision_right: z.number().optional(),
  sphere_left: z.number().optional(),
  sphere_right: z.number().optional(),
  cylinder_left: z.number().optional(),
  cylinder_right: z.number().optional(),
  axis_left: z.number().optional(),
  axis_right: z.number().optional(),
  add_left: z.number().optional(),
  add_right: z.number().optional(),
  bc_left: z.number().optional(),
  bc_right: z.number().optional(),
  diameter_left: z.number().optional(),
  diameter_right: z.number().optional(),
});

interface EditClientDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  client: Client | null;
}

const EditClientDialog: React.FC<EditClientDialogProps> = ({ open, setOpen, client }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      birth_date: '',
      gender: '',
      occupation: '',
      notes: '',
      vision_left: 0,
      vision_right: 0,
      sphere_left: 0,
      sphere_right: 0,
      cylinder_left: 0,
      cylinder_right: 0,
      axis_left: 0,
      axis_right: 0,
      add_left: 0,
      add_right: 0,
      bc_left: 0,
      bc_right: 0,
      diameter_left: 0,
      diameter_right: 0,
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address || '',
        birth_date: client.birth_date || '',
        gender: client.gender || '',
        occupation: client.occupation || '',
        notes: client.notes || '',
        vision_left: typeof client.vision_left === 'number' ? client.vision_left : 0,
        vision_right: typeof client.vision_right === 'number' ? client.vision_right : 0,
        sphere_left: typeof client.sphere_left === 'number' ? client.sphere_left : 0,
        sphere_right: typeof client.sphere_right === 'number' ? client.sphere_right : 0,
        cylinder_left: typeof client.cylinder_left === 'number' ? client.cylinder_left : 0,
        cylinder_right: typeof client.cylinder_right === 'number' ? client.cylinder_right : 0,
        axis_left: typeof client.axis_left === 'number' ? client.axis_left : 0,
        axis_right: typeof client.axis_right === 'number' ? client.axis_right : 0,
        add_left: typeof client.add_left === 'number' ? client.add_left : 0,
        add_right: typeof client.add_right === 'number' ? client.add_right : 0,
        bc_left: typeof client.bc_left === 'number' ? client.bc_left : 0,
        bc_right: typeof client.bc_right === 'number' ? client.bc_right : 0,
        diameter_left: typeof client.diameter_left === 'number' ?  client.diameter_left : 0,
        diameter_right: typeof client.diameter_right === 'number' ? client.diameter_right : 0,
      });
    }
  }, [client, form]);

  const { mutate: updateClientMutate } = useMutation(updateClient, {
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      toast({
        title: "Success",
        description: "Client updated successfully.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update client. ${error}`,
        variant: "destructive"
      });
    },
    onMutate: async () => {
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: z.infer<typeof clientSchema>) => {
    const parsedValues = {
      ...values,
      id: client?.id,
      vision_left: parseFloat(values.vision_left?.toString() || '0'),
      vision_right: parseFloat(values.vision_right?.toString() || '0'),
      sphere_left: parseFloat(values.sphere_left?.toString() || '0'),
      sphere_right: parseFloat(values.sphere_right?.toString() || '0'),
      cylinder_left: parseFloat(values.cylinder_left?.toString() || '0'),
      cylinder_right: parseFloat(values.cylinder_right?.toString() || '0'),
      axis_left: parseFloat(values.axis_left?.toString() || '0'),
      axis_right: parseFloat(values.axis_right?.toString() || '0'),
      add_left: parseFloat(values.add_left?.toString() || '0'),
      add_right: parseFloat(values.add_right?.toString() || '0'),
      bc_left: parseFloat(values.bc_left?.toString() || '0'),
      bc_right: parseFloat(values.bc_right?.toString() || '0'),
      diameter_left: parseFloat(values.diameter_left?.toString() || '0'),
      diameter_right: parseFloat(values.diameter_right?.toString() || '0'),
    };
    updateClientMutate(parsedValues);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Make changes to your client here. Click save when you're done.
          </DialogDescription>
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
                    <Input placeholder="Client Name" {...field} />
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
                    <Input placeholder="mail@example.com" {...field} />
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
                    <Input placeholder="Phone Number" {...field} />
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
                    <Input placeholder="Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormControl>
                      <Input placeholder="Gender" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input placeholder="Occupation" {...field} />
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
                    <Input placeholder="Notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="vision_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vision Left</FormLabel>
                    <FormControl>
                      <Input placeholder="Vision Left" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vision_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vision Right</FormLabel>
                    <FormControl>
                      <Input placeholder="Vision Right" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sphere_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sphere Left</FormLabel>
                    <FormControl>
                      <Input placeholder="Sphere Left" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sphere_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sphere Right</FormLabel>
                    <FormControl>
                      <Input placeholder="Sphere Right" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="cylinder_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cylinder Left</FormLabel>
                    <FormControl>
                      <Input placeholder="Cylinder Left" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cylinder_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cylinder Right</FormLabel>
                    <FormControl>
                      <Input placeholder="Cylinder Right" type="number" {...field} />
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
                    <FormLabel>Axis Left</FormLabel>
                    <FormControl>
                      <Input placeholder="Axis Left" type="number" {...field} />
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
                    <FormLabel>Axis Right</FormLabel>
                    <FormControl>
                      <Input placeholder="Axis Right" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="add_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add Left</FormLabel>
                    <FormControl>
                      <Input placeholder="Add Left" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="add_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add Right</FormLabel>
                    <FormControl>
                      <Input placeholder="Add Right" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bc_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BC Left</FormLabel>
                    <FormControl>
                      <Input placeholder="BC Left" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bc_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BC Right</FormLabel>
                    <FormControl>
                      <Input placeholder="BC Right" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="diameter_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diameter Left</FormLabel>
                    <FormControl>
                      <Input placeholder="Diameter Left" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diameter_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diameter Right</FormLabel>
                    <FormControl>
                      <Input placeholder="Diameter Right" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Client"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
