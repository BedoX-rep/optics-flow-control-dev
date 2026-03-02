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
import { UserPlus, Upload, ChevronDown, Save, Users, RefreshCw, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from '@/components/LanguageProvider';
import ClientsHero from '@/components/clients/ClientsHero';
import { Search } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  is_favorite?: boolean;
  right_eye_sph?: number | null;
  right_eye_cyl?: number | null;
  right_eye_axe?: number | null;
  left_eye_sph?: number | null;
  left_eye_cyl?: number | null;
  left_eye_axe?: number | null;
  Add?: number | null;
  need_renewal?: boolean;
  renewal_date?: string | null;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [renewalFilter, setRenewalFilter] = useState<string>('all');
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateClients, setDuplicateClients] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0); // Reset to first page when search or filter changes
  }, [debouncedSearchTerm, renewalFilter]);

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
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out deleted receipts from the client data
    return (allClients || []).map(client => ({
      ...client,
      receipts: (client.receipts || []).filter(receipt => !receipt.is_deleted)
    }));
  };

  const { data: allClients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['all-clients', user?.id],
    queryFn: fetchAllClients,
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
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

    // Apply renewal filter
    if (renewalFilter === 'need_renewal') {
      filtered = filtered.filter(client => client.need_renewal === true);
    } else if (renewalFilter === 'favorites') {
      filtered = filtered.filter(client => client.is_favorite === true);
    }

    // Sort clients by latest added (created_at desc)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [allClients, debouncedSearchTerm, renewalFilter]);

  const renewalCount = useMemo(() => allClients.filter(c => c.need_renewal).length, [allClients]);
  const favoritesCount = useMemo(() => allClients.filter(c => c.is_favorite).length, [allClients]);
  const [hasEditedClients, setHasEditedClients] = useState(false);

  // Monitor DOM for edited cards (since cards handle their own local state)
  useEffect(() => {
    const interval = setInterval(() => {
      const editedCards = document.querySelectorAll('[data-is-edited="true"]');
      setHasEditedClients(editedCards.length > 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Client-side pagination
  const paginatedClients = useMemo(() => {
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, page]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

  const handleAddClient = async (newClient: any) => {
    // Update the cache with the new client
    queryClient.setQueryData(['all-clients', user?.id], (oldData: Client[] | undefined) => {
      if (!oldData) return [newClient];
      return [newClient, ...oldData];
    });
    setIsAddClientOpen(false);
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
      await queryClient.invalidateQueries({ queryKey: ['all-clients', user?.id] });

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

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .eq('id', clientToDelete.id);

      if (error) throw error;

      // Invalidate and refetch the cache to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['all-clients', user?.id] });

      toast.success(t('clientDeletedSuccessfully') || 'Client deleted successfully!');
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error: any) {
      toast.error(t('errorDeletingClient') || 'Error deleting client: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportClients = async (importedClients: any[]) => {
    try {
      if (!user) return;

      // Check for duplicates - only check phone numbers that are not null/empty
      const existingPhones = new Set(
        allClients
          .map(client => client.phone)
          .filter(phone => phone && phone.trim() !== "")
      );

      const newClients = importedClients.filter(client => {
        // If client has no phone or empty phone, always allow import
        if (!client.phone || client.phone.trim() === "") {
          return true;
        }
        // If client has phone, check if it's not already in the database
        return !existingPhones.has(client.phone);
      });

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
      await queryClient.invalidateQueries({ queryKey: ['all-clients', user?.id] });
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
      await queryClient.invalidateQueries({ queryKey: ['all-clients', user?.id] });

      toast.success(`${clientsToDelete.length} duplicate clients removed`);
      setIsDuplicateDialogOpen(false);
    } catch (error: any) {
      toast.error(`Error deleting duplicates: ${error.message}`);
    }
  };

  // Check and process client renewals on page mount
  useEffect(() => {
    const checkClientRenewals = async () => {
      if (!user || !allClients.length) return;

      try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // Find clients that need renewal marking (renewal date has passed and not already marked)
        const clientsToUpdate = allClients.filter(client =>
          client.renewal_date &&
          client.renewal_date <= todayString &&
          !client.need_renewal
        );

        if (clientsToUpdate.length === 0) {
          return;
        }

        console.log(`Found ${clientsToUpdate.length} clients to mark for renewal`);

        // Update clients to mark them as needing renewal
        for (const client of clientsToUpdate) {
          const { error } = await supabase
            .from('clients')
            .update({ need_renewal: true })
            .eq('id', client.id)
            .eq('user_id', user.id);

          if (error) {
            console.error(`Error updating client ${client.id}:`, error);
          } else {
            console.log(`Successfully marked client ${client.name} for renewal`);
          }
        }

        if (clientsToUpdate.length > 0) {
          toast.success(`${clientsToUpdate.length} client(s) have been marked for renewal.`);
          // Refresh the clients list
          queryClient.invalidateQueries({ queryKey: ['all-clients', user.id] });
        }
      } catch (error) {
        console.error('Error checking client renewals:', error);
        toast.error("Failed to check client renewals");
      }
    };

    checkClientRenewals();
  }, [user, allClients, toast, queryClient]);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden animate-in fade-in duration-700">
      <ClientsHero
        onNewClient={() => setIsAddClientOpen(true)}
        onImport={() => setIsImportDialogOpen(true)}
        onFindDuplicates={findDuplicateClients}
        onSaveAll={handleSaveAllChanges}
        hasEditedClients={hasEditedClients}
        clientsCount={allClients.length}
        renewalCount={renewalCount}
        favoritesCount={favoritesCount}
      />

      <div className="w-full px-6 lg:px-10 relative z-20">
        <div className="mb-10 p-3 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center flex-1 min-w-[300px] px-5 py-3 bg-slate-50/50 shadow-inner rounded-2xl border border-slate-100/50 group focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
              <Search className="h-5 w-5 text-teal-600 mr-3 transition-transform group-focus-within:scale-110" />
              <input
                type="text"
                placeholder={t('searchClients')}
                className="bg-transparent border-none text-sm font-black text-slate-700 focus:ring-0 w-full outline-none placeholder:text-slate-400/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100/50">
                <Select value={renewalFilter} onValueChange={setRenewalFilter}>
                  <SelectTrigger className="premium-filter-select w-[180px] bg-transparent border-none shadow-none focus:ring-0 font-bold text-slate-600">
                    <SelectValue placeholder={t('allClients')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-teal-500" />
                        <span>{t('allClients')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="need_renewal">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-amber-500" />
                        <span>{t('needRenewal')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="favorites">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-rose-500" />
                        <span>{t('favorites')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {paginatedClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={handleEditClient}
                  onDelete={openDeleteDialog}
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ['all-clients', user?.id] })}
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
          onClientAdded={handleAddClient}
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
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setClientToDelete(null);
          }}
          onConfirm={handleDeleteClient}
          title={t('deleteClient')}
          message={t('deleteConfirmation')?.replace('{clientName}', clientToDelete?.name || '') || `Are you sure you want to delete "${clientToDelete?.name}"? This action cannot be undone.`}
          itemName={clientToDelete?.name}
          isDeleting={isDeleting}
        />

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
    </div>
  );
}