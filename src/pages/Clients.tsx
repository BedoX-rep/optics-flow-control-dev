
import React, { useState } from 'react';
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
import { Plus, Pencil, Trash, Search, Eye } from 'lucide-react';
import PageTitle from '@/components/PageTitle';

// Dummy data
const initialClients = [
  { id: '1', name: 'AHMED KORDALI', phone: '0677738343' },
  { id: '2', name: 'FLAURENT LAMBI', phone: '0670348458' },
  { id: '3', name: 'ABD RAHIM NAKHMAL', phone: '0771673388' },
  { id: '4', name: 'ABD ALLAH DHIOT', phone: '0644042983' },
  { id: '5', name: 'ABD AZIZ DIHAJ', phone: '0670075148' },
];

const Clients = () => {
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<null | { 
    id: string; 
    name: string; 
    phone: string 
  }>(null);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleAddClient = () => {
    if (newClient.name && newClient.phone) {
      if (editingClient) {
        // Update existing client
        setClients(clients.map(c => 
          c.id === editingClient.id ? { ...c, ...newClient } : c
        ));
      } else {
        // Add new client
        setClients([...clients, { 
          id: (clients.length + 1).toString(),
          ...newClient
        }]);
      }
      setNewClient({ name: '', phone: '' });
      setEditingClient(null);
      setIsOpen(false);
    }
  };

  const handleEditClient = (client: typeof clients[0]) => {
    setEditingClient(client);
    setNewClient({ name: client.name, phone: client.phone });
    setIsOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(client => client.id !== id));
  };

  return (
    <div>
      <PageTitle title="Clients" subtitle="Manage your client directory" />
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-optics-600 hover:bg-optics-700">
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
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setEditingClient(null);
                  setNewClient({ name: '', phone: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-optics-600 hover:bg-optics-700"
                onClick={handleAddClient}
              >
                {editingClient ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditClient(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {/* View client details */}}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clients;
