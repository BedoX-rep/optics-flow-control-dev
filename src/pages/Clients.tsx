
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddClientDialog } from '@/components/AddClientDialog';
import { EditClientDialog } from '@/components/EditClientDialog';
import { ClientAvatar } from '@/components/ClientAvatar';
import { PageTitle } from '@/components/PageTitle';
import { useToast } from '@/hooks/use-toast';
import { ImportButton } from '@/components/ImportButton';

export default function Clients() {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (error: any) {
      console.error('Error loading clients: ', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(query.toLowerCase()) ||
      client.phone.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this client?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update the local state to reflect the deletion
      setClients(prevClients => prevClients.filter(client => client.id !== id));
      setFilteredClients(prevClients => prevClients.filter(client => client.id !== id));

      toast({
        description: 'Client deleted successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete client: ${error.message}`,
      });
      console.error('Error deleting client: ', error.message);
    }
  };

  const handleEdit = (client: any) => {
    setCurrentClient(client);
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddSuccess = () => {
    fetchClients();
    setShowAddModal(false);
  };

  const handleEditSuccess = () => {
    fetchClients();
    setShowEditModal(false);
    setCurrentClient(null);
  };

  return (
    <div className="container py-8">
      <PageTitle title="Clients" />
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-auto relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 w-full sm:w-[300px]"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ImportButton onSuccess={fetchClients} />
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Client
          </Button>
        </div>
      </div>

      <Table>
        <TableCaption>{loading ? 'Loading clients...' : 'List of all clients'}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Right Eye</TableHead>
            <TableHead>Left Eye</TableHead>
            <TableHead>Add</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                {loading ? 'Loading clients...' : 'No clients found.'}
              </TableCell>
            </TableRow>
          ) : (
            filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <ClientAvatar name={client.name} />
                    <span className="ml-2">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>
                  {client.right_eye_sph != null ? (
                    <span>
                      SPH: {client.right_eye_sph}, CYL: {client.right_eye_cyl}, AXE:{' '}
                      {client.right_eye_axe}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  {client.left_eye_sph != null ? (
                    <span>
                      SPH: {client.left_eye_sph}, CYL: {client.left_eye_cyl}, AXE:{' '}
                      {client.left_eye_axe}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  {client.Add != null ? (
                    <span>{client.Add}</span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AddClientDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleAddSuccess}
      />

      {currentClient && (
        <EditClientDialog
          open={showEditModal}
          onOpenChange={setShowEditModal}
          client={currentClient}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
