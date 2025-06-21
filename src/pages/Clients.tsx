import React, { useState, useEffect, useMemo } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from '@/components/LanguageProvider';

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

const ITEMS_PER_PAGE = 20;

export default function Clients() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateClients, setDuplicateClients] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0); // Reset to first page when search changes
  }, [debouncedSearchTerm]);

  const fetchAllClients = async () => {
    if (!user) return [];

    const { data: allClients, error } = await supabase
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
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return allClients || [];
  };

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['all-clients', user?.id],
    queryFn: fetchAllClients,
    enabled: !!user,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  // Client-side filtering and pagination
  const filteredClients = useMemo(() => {
    let filtered = [...allClients];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchWords = debouncedSearchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
      filtered = filtered.filter(client => {
        const name = client.name?.toLowerCase() || '';
        const phone = client.phone?.toLowerCase() || '';
        return searchWords.every(word => name.includes(word) || phone.includes(word));
      });
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

    return filtered;
  }, [allClients, debouncedSearchTerm, sortBy]);

  // Client-side pagination
  const paginatedClients = useMemo(() => {
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, page]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

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

      // Update the cache with the new client
      queryClient.setQueryData(['all-clients', user.id], (oldData: Client[] | undefined) => {
        if (!oldData) return [data];
        return [data, ...oldData];
      });

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

      // Invalidate and refetch the cache to ensure consistency
      await queryClient.invalidateQueries(['all-clients', user?.id]);

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

      // Invalidate and refetch the cache to ensure consistency
      await queryClient.invalidateQueries(['all-clients', user?.id]);

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
      const phoneNumbers = new Set(allClients.map(client => client.phone));
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

      // Update the cache with imported clients
      queryClient.setQueryData(['all-clients', user.id], (oldData: Client[] | undefined) => {
        if (!oldData) return data;
        return [...data, ...oldData];
      });

      toast.success(`${data?.length} clients imported successfully!`);
      setIsImportDialogOpen(false);
    } catch (error: any) {
      toast.error(`Error importing clients: ${error.message}`);
    }
  };

  const findDuplicateClients = () => {
    // Group clients by both phone number and name (case-insensitive)
    const clientGroups = allClients.reduce((groups: any, client) => {
      const phone = client.phone?.trim() || '';
      const name = client.name?.trim().toLowerCase() || '';
      const key = `${phone}_${name}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(client);
      return groups;
    }, {});

    // Find groups with more than one client (duplicates)
    const duplicates: any[] = [];
    Object.values(clientGroups).forEach((group: any) => {
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
      await queryClient.invalidateQueries(['all-clients', user?.id]);
    } catch (error: any) {
      toast.error("Failed to save all changes: " + error.message);
    }
  };

  const handleDeleteDuplicates = async () => {
    try {
      // Group by both phone number and name (case-insensitive) and take the first client from each group
      const clientGroups: any = {};
      duplicateClients.forEach(client => {
        const phone = client.phone?.trim() || '';
        const name = client.name?.trim().toLowerCase() || '';
        const key = `${phone}_${name}`;
        
        if (!clientGroups[key]) {
          clientGroups[key] = [client];
        } else {
          clientGroups[key].push(client);
        }
      });

      // For each group, keep the first client and mark others as deleted
      const clientsToDelete: string[] = [];
      Object.values(clientGroups).forEach((group: any) => {
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

      // Invalidate and refetch the cache to ensure consistency
      await queryClient.invalidateQueries(['all-clients', user?.id]);

      toast.success(`${clientsToDelete.length} duplicate clients removed`);
      setIsDuplicateDialogOpen(false);
    } catch (error: any) {
      toast.error(`Error deleting duplicates: ${error.message}`);
    }
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => setIsAddClientOpen(true)}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t('newClient')}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveAllChanges}
            className="rounded-xl border-neutral-200 shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {t('saveAllChanges')}
          </Button>
        </div>
      </div>

      <div className="mb-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t('searchClients')}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 rounded-xl">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t('nameAZ')}</SelectItem>
                <SelectItem value="recent">{t('recentlyAdded')}</SelectItem>
                <SelectItem value="phone">{t('phoneNumber')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              onClick={findDuplicateClients}
              className="text-neutral-600 hover:text-neutral-900 rounded-xl"
            >
              {t('findDuplicates')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsImportDialogOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 rounded-xl"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('import')}
            </Button>
          </div>
        </div>
      </div>

      {/* Client cards */}
      {isLoading ? (
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
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mb-4 rounded-full bg-teal-100 flex items-center justify-center">
            <UserPlus size={24} className="text-teal-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{t('noClientsFound')}</h3>
          <p className="text-gray-500 max-w-md mb-4">
            {searchTerm
              ? t('noClientsMatchSearch')
              : t('noClientsYet')
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsAddClientOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500"
            >
              <UserPlus size={16} className="mr-2" />
              {t('addFirstClient')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 animate-fade-in">
            {paginatedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditClient}
                onDelete={openDeleteDialog}
                onRefresh={() => queryClient.invalidateQueries(['all-clients'])}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                {t('previous')}
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className="w-10 h-8"
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="flex items-center gap-1"
              >
                {t('next')}
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          )}

          {filteredClients.length > 0 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Showing {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, filteredClients.length)} of {filteredClients.length} clients
            </div>
          )}
        </>
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
            <AlertDialogTitle>{t('deleteClient')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmation', { clientName: clientToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-500 hover:bg-red-600">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicates dialog */}
      <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('duplicateClientsFound')}</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateClients.length > 0 && (
                <>
                  <p className="mb-2">
                    Found {duplicateClients.length} duplicate clients with matching names and phone numbers. Would you like to remove the duplicates? (One client from each duplicate group will be kept.)
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
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDuplicates} className="bg-red-500 hover:bg-red-600">
              {t('deleteDuplicates')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}