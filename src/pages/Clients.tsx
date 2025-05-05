
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { ClientCard } from "@/components/ClientCard";
import { SearchInput } from "@/components/SearchInput";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import PageTitle from "@/components/PageTitle";
import EditClientDialog from "@/components/EditClientDialog";
import { ImportClientsDialog } from "@/components/ImportClientsDialog";
import AddClientDialog from "@/components/AddClientDialog";
import { UserPlus, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  right_eye_sph?: number | null;
  right_eye_cyl?: number | null;
  right_eye_axe?: number | null;
  left_eye_sph?: number | null;
  left_eye_cyl?: number | null;
  left_eye_axe?: number | null;
  Add?: number | null;
  receipts?: Array<{
    id: string;
    created_at: string;
    right_eye_sph?: number | null;
    right_eye_cyl?: number | null;
    right_eye_axe?: number | null;
    left_eye_sph?: number | null;
    left_eye_cyl?: number | null;
    left_eye_axe?: number | null;
    total?: number;
    advance_payment?: number;
    balance?: number;
    payment_status?: string;
    is_deleted?: boolean;
  }>;
}

export default function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateClients, setDuplicateClients] = useState<any[]>([]);

  // Fetch clients with their latest receipts
  const fetchClients = async () => {
    setIsLoading(true);
    
    try {
      if (!user) return;
      
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name');

      if (error) {
        throw error;
      }

      // For each client, get their receipts
      const clientsWithReceipts = await Promise.all(
        clientsData.map(async (client) => {
          const { data: receiptsData, error: receiptsError } = await supabase
            .from('receipts')
            .select('*')
            .eq('client_id', client.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });
            
          if (receiptsError) {
            console.error('Error fetching receipts:', receiptsError);
            return { ...client, receipts: [] };
          }
          
          return { ...client, receipts: receiptsData };
        })
      );

      setClients(clientsWithReceipts);
      setFilteredClients(clientsWithReceipts);
    } catch (error: any) {
      toast.error('Error fetching clients: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user exists and clients array is empty
    if (user && clients.length === 0) {
      fetchClients();
    }
  }, [user]);

  // Filter and sort clients based on search term and sort option
  useEffect(() => {
    let filtered = [...clients];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(term) || 
        client.phone.includes(term)
      );
    }
    
    // Sort clients
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'phone') {
        return a.phone.localeCompare(b.phone);
      }
      return 0;
    });
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, sortBy]);

  const handleAddClient = async (name: string, phone: string) => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('clients')
        .insert({ 
          name, 
          phone, 
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new client to the state
      const newClient = { ...data, receipts: [] };
      setClients([...clients, newClient]);
      toast.success('Client added successfully!');
      setIsAddClientOpen(false);
    } catch (error: any) {
      toast.error('Error adding client: ' + error.message);
    }
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
  };

  const handleUpdateClient = async (id: string, name: string, phone: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ name, phone })
        .eq('id', id);

      if (error) throw error;

      // Update the client in the state
      setClients(
        clients.map((client) =>
          client.id === id ? { ...client, name, phone } : client
        )
      );

      toast.success('Client updated successfully!');
      setClientToEdit(null);
    } catch (error: any) {
      toast.error('Error updating client: ' + error.message);
    }
  };

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .eq('id', clientToDelete.id);

      if (error) throw error;

      // Remove the client from the state
      setClients(clients.filter((c) => c.id !== clientToDelete.id));
      toast.success('Client deleted successfully!');
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error: any) {
      toast.error('Error deleting client: ' + error.message);
    }
  };

  const handleImportClients = async (importedClients: any[]) => {
    try {
      if (!user) return;
      
      // Check for duplicates
      const phoneNumbers = new Set(clients.map(client => client.phone));
      const newClients = importedClients.filter(client => !phoneNumbers.has(client.phone));
      
      if (newClients.length === 0) {
        toast.warning("All imported clients already exist in your database");
        setIsImportDialogOpen(false);
        return;
      }
      
      // Add user_id to each client
      const clientsWithUserId = newClients.map(client => ({
        ...client,
        user_id: user.id
      }));
      
      const { data, error } = await supabase
        .from('clients')
        .insert(clientsWithUserId)
        .select();

      if (error) throw error;
      
      toast.success(`${data?.length} clients imported successfully!`);
      fetchClients(); // Refresh clients list
      setIsImportDialogOpen(false);
    } catch (error: any) {
      toast.error(`Error importing clients: ${error.message}`);
    }
  };

  const findDuplicateClients = () => {
    // Group clients by phone number
    const phoneGroups = clients.reduce((groups: any, client) => {
      const phone = client.phone;
      if (!groups[phone]) {
        groups[phone] = [];
      }
      groups[phone].push(client);
      return groups;
    }, {});
    
    // Find groups with more than one client (duplicates)
    const duplicates: any[] = [];
    Object.values(phoneGroups).forEach((group: any) => {
      if (group.length > 1) {
        duplicates.push(...group);
      }
    });
    
    if (duplicates.length === 0) {
      toast.info("No duplicate clients found");
      return;
    }
    
    setDuplicateClients(duplicates);
    setIsDuplicateDialogOpen(true);
  };

  const handleDeleteDuplicates = async () => {
    try {
      // Group by phone number and take the first client from each group
      const phoneGroups: any = {};
      duplicateClients.forEach(client => {
        if (!phoneGroups[client.phone]) {
          phoneGroups[client.phone] = [client];
        } else {
          phoneGroups[client.phone].push(client);
        }
      });
      
      // For each group, keep the first client and mark others as deleted
      const clientsToDelete: string[] = [];
      Object.values(phoneGroups).forEach((group: any) => {
        for (let i = 1; i < group.length; i++) {
          clientsToDelete.push(group[i].id);
        }
      });
      
      if (clientsToDelete.length === 0) {
        toast.info("No duplicates to delete");
        setIsDuplicateDialogOpen(false);
        return;
      }
      
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .in('id', clientsToDelete);

      if (error) throw error;
      
      toast.success(`${clientsToDelete.length} duplicate clients removed`);
      fetchClients(); // Refresh client list
      setIsDuplicateDialogOpen(false);
    } catch (error: any) {
      toast.error(`Error deleting duplicates: ${error.message}`);
    }
  };

  return (
    <div className="container px-4 sm:px-6 max-w-7xl mx-auto py-8 space-y-8">
      <PageTitle title="Clients" />
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-64 md:w-80">
          <SearchInput 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search clients..."
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex gap-2">
            <div className="w-40">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={findDuplicateClients}
              className="flex items-center gap-1"
            >
              Find Duplicates
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Upload size={16} />
              Import
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsAddClientOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 flex items-center gap-1"
            >
              <UserPlus size={16} />
              New Client
            </Button>
          </div>
        </div>
      </div>
      
      {/* Client cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-48"></div>
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onEdit={handleEditClient} 
              onDelete={openDeleteDialog}
              onRefresh={fetchClients}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mb-4 rounded-full bg-teal-100 flex items-center justify-center">
            <UserPlus size={24} className="text-teal-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
          <p className="text-gray-500 max-w-md mb-4">
            {searchTerm 
              ? `No clients match your search "${searchTerm}"`
              : "You haven't added any clients yet. Get started by adding your first client."
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setIsAddClientOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500"
            >
              <UserPlus size={16} className="mr-2" />
              Add Your First Client
            </Button>
          )}
        </div>
      )}
      
      {/* Floating action button */}
      <FloatingActionButton onClick={() => setIsAddClientOpen(true)} />

      {/* Add client dialog */}
      <AddClientDialog 
        isOpen={isAddClientOpen} 
        onClose={() => setIsAddClientOpen(false)} 
        onAddClient={handleAddClient}
      />
      
      {/* Edit client dialog */}
      {clientToEdit && (
        <EditClientDialog 
          client={clientToEdit}
          isOpen={!!clientToEdit}
          onClose={() => setClientToEdit(null)}
          onClientUpdated={handleUpdateClient}
        />
      )}
      
      {/* Import clients dialog */}
      <ImportClientsDialog 
        isOpen={isImportDialogOpen} 
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportClients}
      />
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {clientToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicates dialog */}
      <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Clients Found</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateClients.length > 0 && (
                <>
                  <p className="mb-2">
                    {duplicateClients.length} duplicate clients found with the same phone numbers. 
                    For each duplicate set, the first client will be kept and others marked as deleted.
                  </p>
                  <div className="max-h-60 overflow-y-auto mt-4 border rounded p-2">
                    {duplicateClients.map(client => (
                      <div key={client.id} className="py-1 border-b last:border-0">
                        {client.name} ({client.phone})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDuplicates} className="bg-red-500 hover:bg-red-600">
              Delete Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
