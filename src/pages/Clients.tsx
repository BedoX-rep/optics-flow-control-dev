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
import { UserPlus, Upload, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateClients, setDuplicateClients] = useState<any[]>([]);

  const fetchClients = async () => {
    if (!user) return [];

    let query = supabase
      .from('clients')
      .select(`
        *,
        receipts!left(
          id,
          created_at,
          total,
          advance_payment,
          balance,
          payment_status,
          is_deleted,
          receipt_items(*)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order(sortBy === 'name' ? 'name' : sortBy === 'phone' ? 'phone' : 'created_at', { ascending: sortBy === 'recent' ? false : true })
      .range(page * 30, (page * 30) + (page === 0 ? 29 : 69)); // Get 30 initially, then 70 more

    // Apply search filter if exists
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const { data: clientsData, error, count } = await query;

    if (error) throw error;
    return { clients: clientsData || [], hasMore: count ? count > ((page + 1) * 30) : false };
  };

  const [page, setPage] = useState(0);
  const { data: { clients = [], hasMore = false } = {}, isLoading } = useQuery({
    queryKey: ['clients', user?.id, page, searchTerm, sortBy],
    queryKey: ['clients', user?.id],
    queryFn: fetchClients,
    enabled: !!user,
  });

  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

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

  // Function to save all changes
  const handleSaveAllChanges = async () => {
    try {
      // Get all edited clients that need saving
      const editedCards = document.querySelectorAll('[data-is-edited="true"]');
      if (editedCards.length === 0) {
        toast.info("No changes to save");
        return;
      }

      // Save all changes
      const updatePromises = Array.from(editedCards).map(async (card) => {
        const clientId = card.getAttribute('data-client-id');
        if (clientId) {
          // Get input values directly from the card
          const nameInput = card.querySelector('input[name="name"]') as HTMLInputElement;
          const phoneInput = card.querySelector('input[name="phone"]') as HTMLInputElement;
          const rightSphInput = card.querySelector('input[name="right_eye_sph"]') as HTMLInputElement;
          const rightCylInput = card.querySelector('input[name="right_eye_cyl"]') as HTMLInputElement;
          const rightAxeInput = card.querySelector('input[name="right_eye_axe"]') as HTMLInputElement;
          const leftSphInput = card.querySelector('input[name="left_eye_sph"]') as HTMLInputElement;
          const leftCylInput = card.querySelector('input[name="left_eye_cyl"]') as HTMLInputElement;
          const leftAxeInput = card.querySelector('input[name="left_eye_axe"]') as HTMLInputElement;
          const addInput = card.querySelector('input[name="Add"]') as HTMLInputElement;

          const { data, error } = await supabase
            .from('clients')
            .update({
              name: nameInput?.value,
              phone: phoneInput?.value,
              right_eye_sph: rightSphInput?.value ? parseFloat(rightSphInput.value) : null,
              right_eye_cyl: rightCylInput?.value ? parseFloat(rightCylInput.value) : null,
              right_eye_axe: rightAxeInput?.value ? parseInt(rightAxeInput.value) : null,
              left_eye_sph: leftSphInput?.value ? parseFloat(leftSphInput.value) : null,
              left_eye_cyl: leftCylInput?.value ? parseFloat(leftCylInput.value) : null,
              left_eye_axe: leftAxeInput?.value ? parseInt(leftAxeInput.value) : null,
              Add: addInput?.value ? parseFloat(addInput.value) : null
            })
            .eq('id', clientId)
            .select();

          if (error) throw error;
          return data;
        }
      });

      await Promise.all(updatePromises);

      // Clear the edited state of all cards
      editedCards.forEach(card => {
        card.setAttribute('data-is-edited', 'false');
      });

      toast.success(`Saved changes for ${editedCards.length} clients`);
      await queryClient.invalidateQueries(['clients']); // Invalidate clients query
    } catch (error: any) {
      toast.error("Failed to save all changes: " + error.message);
    }
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
    <div className="container px-2 sm:px-4 md:px-6 max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="default"
              onClick={() => setIsAddClientOpen(true)}
              className="bg-black hover:bg-neutral-800 text-white px-6"
            >
              <UserPlus size={18} className="mr-2" />
              New Client
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleSaveAllChanges}
              className="border-neutral-200"
            >
              <Save size={18} className="mr-2" />
              Save All Changes
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search clients..."
            className="w-full sm:w-64"
          />

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="phone">Phone Number</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="default"
              onClick={findDuplicateClients}
              className="text-neutral-600 hover:text-neutral-900"
            >
              Find Duplicates
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={() => setIsImportDialogOpen(true)}
              className="text-neutral-600 hover:text-neutral-900"
            >
              <Upload size={18} className="mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Client cards */}
      {isLoading || !filteredClients ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-neutral-100 rounded animate-pulse" />
                  <div className="h-8 bg-neutral-100 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-neutral-100 rounded animate-pulse" />
                  <div className="h-8 bg-neutral-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 animate-fade-in">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEditClient}
              onDelete={openDeleteDialog}
              onRefresh={fetchClients}
            />
          ))}
          {hasMore && (
            <div className="col-span-full flex justify-center mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage(prev => prev + 1)}
                className="w-full max-w-xs"
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Load More Clients
              </Button>
            </div>
          )}
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