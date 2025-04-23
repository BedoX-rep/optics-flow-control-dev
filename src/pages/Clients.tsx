import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientAvatar } from '@/components/ClientAvatar';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface Client {
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
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<{ name: string; phone: string; gender: "Mr" | "Mme" | "Enf"; right_eye_sph?: number; right_eye_cyl?: number; right_eye_axe?: number; left_eye_sph?: number; left_eye_cyl?: number; left_eye_axe?: number }>({ 
    name: '', 
    phone: '', 
    gender: 'Mr' 
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
      return;
    }

    setClients(data || []);
  };

  const handleAddClient = async () => {
    if (!user || !newClient.name || !newClient.phone) return;

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: newClient.name,
            phone: newClient.phone,
            gender: newClient.gender,
            right_eye_sph: newClient.right_eye_sph,
            right_eye_cyl: newClient.right_eye_cyl,
            right_eye_axe: newClient.right_eye_axe,
            left_eye_sph: newClient.left_eye_sph,
            left_eye_cyl: newClient.left_eye_cyl,
            left_eye_axe: newClient.left_eye_axe,
          })
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({
            name: newClient.name,
            phone: newClient.phone,
            gender: newClient.gender, 
            user_id: user.id,
            right_eye_sph: newClient.right_eye_sph,
            right_eye_cyl: newClient.right_eye_cyl,
            right_eye_axe: newClient.right_eye_axe,
            left_eye_sph: newClient.left_eye_sph,
            left_eye_cyl: newClient.left_eye_cyl,
            left_eye_axe: newClient.left_eye_axe,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client added successfully",
        });
      }

      setNewClient({ name: '', phone: '', gender: 'Mr' }); 
      setEditingClient(null);
      setIsOpen(false);
      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setNewClient({ ...client });
    setIsOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div>
      <PageTitle title="Clients" subtitle="Manage your client directory" />

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
          <Input 
            type="text" 
            placeholder="Search clients..."
            className="pl-9 pr-2 bg-white border border-neutral-200 rounded-lg h-9 text-sm focus:ring-2 focus:ring-black focus:border-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="!px-5 !py-2.5 rounded-full font-semibold bg-black text-white hover:bg-neutral-800 border border-black shadow flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  className="col-span-3"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={newClient.gender}
                  onValueChange={(value) => setNewClient({ ...newClient, gender: value })}
                >
                  <SelectTrigger id="gender" className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Enf">Enf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Add input fields for eye prescription */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="right_eye_sph" className="text-right">Right Eye SPH</Label>
                <Input
                  id="right_eye_sph"
                  type="number"
                  className="col-span-3"
                  value={newClient.right_eye_sph || ''}
                  onChange={(e) => setNewClient({ ...newClient, right_eye_sph: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="right_eye_cyl" className="text-right">Right Eye CYL</Label>
                <Input
                  id="right_eye_cyl"
                  type="number"
                  className="col-span-3"
                  value={newClient.right_eye_cyl || ''}
                  onChange={(e) => setNewClient({ ...newClient, right_eye_cyl: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="right_eye_axe" className="text-right">Right Eye AXE</Label>
                <Input
                  id="right_eye_axe"
                  type="number"
                  className="col-span-3"
                  value={newClient.right_eye_axe || ''}
                  onChange={(e) => setNewClient({ ...newClient, right_eye_axe: parseInt(e.target.value, 10) || undefined })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="left_eye_sph" className="text-right">Left Eye SPH</Label>
                <Input
                  id="left_eye_sph"
                  type="number"
                  className="col-span-3"
                  value={newClient.left_eye_sph || ''}
                  onChange={(e) => setNewClient({ ...newClient, left_eye_sph: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="left_eye_cyl" className="text-right">Left Eye CYL</Label>
                <Input
                  id="left_eye_cyl"
                  type="number"
                  className="col-span-3"
                  value={newClient.left_eye_cyl || ''}
                  onChange={(e) => setNewClient({ ...newClient, left_eye_cyl: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="left_eye_axe" className="text-right">Left Eye AXE</Label>
                <Input
                  id="left_eye_axe"
                  type="number"
                  className="col-span-3"
                  value={newClient.left_eye_axe || ''}
                  onChange={(e) => setNewClient({ ...newClient, left_eye_axe: parseInt(e.target.value, 10) || undefined })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setEditingClient(null);
                  setNewClient({ name: '', phone: '', gender: 'Mr' }); 
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-black hover:bg-neutral-800 text-white"
                onClick={handleAddClient}
              >
                {editingClient ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-neutral-100 bg-[#f6f6f7] sticky top-0 z-10">
              <TableHead className="text-black text-xs font-semibold text-center" colSpan={2}>Client Name</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Phone Number</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Right Eye SPH</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Right Eye CYL</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Right Eye AXE</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Left Eye SPH</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Left Eye CYL</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Left Eye AXE</TableHead>
              <TableHead className="text-black text-xs font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-neutral-400 font-medium">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-[#FAFAFA] transition-all group rounded-lg">
                  <TableCell className="py-3 pr-0">
                    <div className="flex items-center gap-2">
                      <ClientAvatar gender={client.gender} name={client.name} />
                      <span className="font-medium text-black">{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 pl-0 hidden">
                  </TableCell>
                  <TableCell className="py-3 text-center">{client.phone}</TableCell>
                  <TableCell className="py-3 text-center">{client.right_eye_sph || '-'}</TableCell>
                  <TableCell className="py-3 text-center">{client.right_eye_cyl || '-'}</TableCell>
                  <TableCell className="py-3 text-center">{client.right_eye_axe || '-'}</TableCell>
                  <TableCell className="py-3 text-center">{client.left_eye_sph || '-'}</TableCell>
                  <TableCell className="py-3 text-center">{client.left_eye_cyl || '-'}</TableCell>
                  <TableCell className="py-3 text-center">{client.left_eye_axe || '-'}</TableCell>
                  <TableCell className="py-3 text-center">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="hover:bg-black/10"
                        onClick={() => handleEditClient(client)}
                        aria-label="Edit"
                      >
                        <Pencil size={16} className="text-black" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="hover:bg-[#222]/10"
                        onClick={() => handleDeleteClient(client.id)}
                        aria-label="Delete"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clients;