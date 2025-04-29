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
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { ClientAvatar } from '@/components/ClientAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import AddClientDialog from '@/components/AddClientDialog';
import EditClientDialog from '@/components/EditClientDialog';

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
  Add?: number;
  notes?: string;
  favorite?: boolean;
  created_at?: string;
  is_deleted?: boolean;
  last_prescription_update?: string;
  assurance?: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Client } | null>(null);
  const [cellEditValue, setCellEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
      return;
    }

    setClients((data || []) as Client[]);
    setIsLoading(false);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
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

  const startInlineEdit = (client: Client, field: keyof Client) => {
    setEditingCell({ id: client.id, field });
    setCellEditValue(String(client[field] ?? ''));
  };

  const endInlineEdit = async (client: Client) => {
    if (!editingCell || !user) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('clients')
        .update({ [editingCell.field]: cellEditValue })
        .eq('id', client.id);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === client.id ? { ...c, [editingCell.field]: cellEditValue } : c
      ));
      toast({ title: "Updated", description: "Client updated successfully" });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update client",
        variant: "destructive"
      });
    } finally {
      setEditingCell(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100svh-68px)]" style={{
      width: "100%",
      paddingLeft: "1rem",
      paddingRight: "1rem",
      paddingTop: "1.5rem",
      transition: "all 0.2s ease",
      minHeight: "calc(100svh - 68px)",
    }}>
      <div className="flex flex-col gap-4 mb-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              className="!px-5 !py-2.5 rounded-full font-semibold bg-black text-white hover:bg-neutral-800 border border-black shadow flex items-center"
              onClick={() => setIsOpen(true)}
            >
              <span className="mr-2 flex items-center"><Plus size={18} /></span>
              Add Client
            </Button>

            <div className="flex flex-col items-start gap-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[1.35rem] leading-none font-bold text-black">{clients.length}</span>
                <span className="text-gray-400 text-xs font-medium font-inter">clients</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="border border-black/15 px-1.5 py-0.5 rounded-full bg-white font-medium text-xs text-black/70">
                  This Month: {clients.filter(client => {
                    const clientDate = new Date(client.created_at || '');
                    const now = new Date();
                    return clientDate.getMonth() === now.getMonth() && 
                           clientDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
                <span className="border border-black/15 px-1.5 py-0.5 rounded-full bg-white font-medium text-xs text-black/70">
                  Favorites: {clients.filter(client => client.favorite).length}
                </span>
              </div>
            </div>
          </div>
            
          <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 6.5L7.5 3.5M7.5 3.5L10.5 6.5M7.5 3.5V11.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    How to Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>How to Import Clients</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p>Create a CSV file with the following columns:</p>
                    <code className="block bg-gray-100 p-3 rounded text-sm">
                      Name,Phone,right_eye_sph,right_eye_cyl,right_eye_axe,left_eye_sph,left_eye_cyl,left_eye_axe
                    </code>
                    <p>Example row:</p>
                    <code className="block bg-gray-100 p-3 rounded text-sm">
                      John Doe,+1234567890,-1.25,-0.50,180,+2.00,-0.75,90
                    </code>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Name: Required</li>
                      <li>Phone: Optional</li>
                      <li>right_eye_sph: Optional, decimal number (e.g., -1.25, +2.00)</li>
                      <li>left_eye_sph: Optional, decimal number (e.g., -1.25, +2.00)</li>
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <input
                  type="file"
                  id="fileInput"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;

                    try {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const csv = event.target?.result;
                        if (typeof csv !== 'string') return;

                        const rows = csv.split('\n').map(row => row.split(','));
                        const headers = rows[0].map(h => h.trim());
                        
                        if (!headers.includes('Name')) {
                          toast({
                            title: "Error",
                            description: "File must contain 'Name' column",
                            variant: "destructive",
                          });
                          return;
                        }

                        const nameIndex = headers.indexOf('Name');
                        const phoneIndex = headers.indexOf('Phone');
                        const rightEyeSphIndex = headers.indexOf('right_eye_sph');
                        const rightEyeCylIndex = headers.indexOf('right_eye_cyl');
                        const rightEyeAxeIndex = headers.indexOf('right_eye_axe');
                        const leftEyeSphIndex = headers.indexOf('left_eye_sph');
                        const leftEyeCylIndex = headers.indexOf('left_eye_cyl');
                        const leftEyeAxeIndex = headers.indexOf('left_eye_axe');
                        
                        const clients = rows.slice(1, 51).map(row => ({
                          user_id: user.id,
                          name: row[nameIndex]?.trim() || '',
                          phone: phoneIndex !== -1 ? row[phoneIndex]?.trim() : '',
                          right_eye_sph: rightEyeSphIndex !== -1 ? parseFloat(row[rightEyeSphIndex]) || 0 : 0,
                          right_eye_cyl: rightEyeCylIndex !== -1 ? parseFloat(row[rightEyeCylIndex]) || 0 : 0,
                          right_eye_axe: rightEyeAxeIndex !== -1 ? parseFloat(row[rightEyeAxeIndex]) || 0 : 0,
                          left_eye_sph: leftEyeSphIndex !== -1 ? parseFloat(row[leftEyeSphIndex]) || 0 : 0,
                          left_eye_cyl: leftEyeCylIndex !== -1 ? parseFloat(row[leftEyeCylIndex]) || 0 : 0,
                          left_eye_axe: leftEyeAxeIndex !== -1 ? parseFloat(row[leftEyeAxeIndex]) || 0 : 0,
                        })).filter(client => client.name);

                        if (clients.length === 0) {
                          toast({
                            title: "Error",
                            description: "No valid clients found in file",
                            variant: "destructive",
                          });
                          return;
                        }

                        const { error } = await supabase
                          .from('clients')
                          .insert(clients);

                        if (error) throw error;

                        toast({
                          title: "Success",
                          description: `${clients.length} clients imported successfully`,
                        });
                        
                        fetchClients();
                      };
                      reader.readAsText(file);
                    } catch (error) {
                      console.error('Error importing clients:', error);
                      toast({
                        title: "Error",
                        description: "Failed to import clients",
                        variant: "destructive",
                      });
                    }
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                  Import
                </Button>
                <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 w-48">
                  CSV columns must be "Name" and "Phone". Max 50 rows per import.
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-0.5 min-w-[130px]">
              <div className="flex items-baseline gap-1">
                <span className="text-[1.35rem] leading-none font-bold text-black">{clients.length}</span>
                <span className="text-gray-400 text-xs font-medium font-inter">clients</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="border border-black/15 px-1.5 py-0.5 rounded-full bg-white font-medium text-xs text-black/70">
                  This Month: {clients.filter(client => {
                    const clientDate = new Date(client.created_at || '');
                    const now = new Date();
                    return clientDate.getMonth() === now.getMonth() && 
                           clientDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
                <span className="border border-black/15 px-1.5 py-0.5 rounded-full bg-white font-medium text-xs text-black/70">
                  Favorites: {clients.filter(client => client.favorite).length}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search clients..."
            className="pl-9 pr-2 bg-white border border-neutral-200 rounded-lg font-inter h-9 text-sm focus:ring-2 focus:ring-black focus:border-black w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col">
        <div className="w-full h-full flex-grow bg-white rounded-xl border border-neutral-200 shadow-sm overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-neutral-100 bg-[#f6f6f7] sticky top-0 z-10">
                <TableHead className="text-black text-xs font-semibold w-[200px]">Client Info</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[120px]">Right Eye</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[120px]">Left Eye</TableHead>
                <TableHead className="text-black text-xs font-semibold w-14">Add</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[120px]">Assurance</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[120px]">Created At</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[120px]">Last Updated</TableHead>
                <TableHead className="text-black text-xs font-semibold">Notes</TableHead>
                <TableHead className="text-right text-black text-xs font-semibold w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 animate-pulse">
                    <div className="h-6 w-1/2 bg-[#F7FAFC] rounded mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-neutral-400 font-medium">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-[#FAFAFA] transition-all group rounded-lg">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <ClientAvatar gender={client.gender} name={client.name} className="w-11 h-11" />
                        <div className="flex flex-col gap-1">
                          {editingCell?.id === client.id && editingCell.field === "name" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(client)}
                              onKeyDown={e => e.key === 'Enter' && endInlineEdit(client)}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="font-semibold text-black hover:underline cursor-pointer"
                              onClick={() => startInlineEdit(client, "name")}
                              tabIndex={0}
                              title="Edit"
                            >{client.name}</span>
                          )}
                          {editingCell?.id === client.id && editingCell.field === "phone" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(client)}
                              onKeyDown={e => e.key === 'Enter' && endInlineEdit(client)}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="text-sm text-gray-500 hover:underline cursor-pointer flex items-center gap-1.5"
                              onClick={() => startInlineEdit(client, "phone")}
                              tabIndex={0}
                              title="Edit"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {(client.right_eye_sph !== null && client.right_eye_sph !== undefined) ? 
                        <div className="bg-[#1e7575] text-[#F0F0F0] px-3 py-1.5 rounded-md text-sm font-medium inline-block">
                          <span className="whitespace-nowrap">
                            {client.right_eye_sph === 0 && client.right_eye_cyl === 0 ? 'Plan' :
                              client.right_eye_cyl === 0 ? client.right_eye_sph :
                              client.right_eye_sph === 0 ? `(${client.right_eye_cyl} a ${client.right_eye_axe}°)` :
                              `${client.right_eye_sph} (${client.right_eye_cyl} a ${client.right_eye_axe}°)`
                            }
                          </span>
                        </div>
                        : '-'}
                    </TableCell>
                    <TableCell className="py-3">
                      {(client.left_eye_sph !== null && client.left_eye_sph !== undefined) ? 
                        <div className="bg-[#1e7575] text-[#F0F0F0] px-3 py-1.5 rounded-md text-sm font-medium inline-block">
                          <span className="whitespace-nowrap">
                            {client.left_eye_sph === 0 && client.left_eye_cyl === 0 ? 'Plan' :
                              client.left_eye_cyl === 0 ? client.left_eye_sph :
                              client.left_eye_sph === 0 ? `(${client.left_eye_cyl} a ${client.left_eye_axe}°)` :
                              `${client.left_eye_sph} (${client.left_eye_cyl} a ${client.left_eye_axe}°)`
                            }
                          </span>
                        </div>
                        : '-'}
                    </TableCell>
                    <TableCell className="py-3">
                      {client.Add ? 
                        <div className="bg-[#1e7575] text-[#F0F0F0] px-3 py-1.5 rounded-md text-sm font-medium inline-block">
                          {client.Add}
                        </div>
                        : '-'}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`${client.assurance ? "border rounded-full py-1 px-2.5 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-700" : "text-neutral-400"}`}>
                        {client.assurance || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-neutral-600 text-xs">
                        {client.created_at 
                          ? new Date(client.created_at).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-neutral-600 text-xs">
                        {client.last_prescription_update 
                          ? new Date(client.last_prescription_update).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      {editingCell?.id === client.id && editingCell.field === "notes" ? (
                        <input
                          type="text"
                          className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(client)}
                          onKeyDown={e => e.key === 'Enter' && endInlineEdit(client)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="hover:underline cursor-pointer text-neutral-500"
                          onClick={() => startInlineEdit(client, "notes")}
                        >
                          {client.notes || 'Écrivez ici vos observations ou rappels !'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-black/10"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newFavorite = !client.favorite;
                            const { error } = await supabase
                              .from('clients')
                              .update({ favorite: newFavorite })
                              .eq('id', client.id);

                            if (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update favorite status",
                                variant: "destructive",
                              });
                              return;
                            }

                            setClients(clients.map(c => 
                              c.id === client.id ? {...c, favorite: newFavorite} : c
                            ));
                          }}
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill={client.favorite ? "#FFD700" : "none"}
                            stroke={client.favorite ? "#FFD700" : "currentColor"}
                            strokeWidth="2"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-black/10"
                          onClick={() => {
                            setEditingClient(client);
                            setIsOpen(true);
                          }}
                        >
                          <Pencil size={16} className="text-black" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-[#222]/10"
                          onClick={() => handleDeleteClient(client.id)}
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

      {editingClient ? (
        <EditClientDialog
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setEditingClient(null);
          }}
          onClientUpdated={() => {
            fetchClients();
            setIsOpen(false);
            setEditingClient(null);
          }}
          client={editingClient}
        />
      ) : (
        <AddClientDialog
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          onClientAdded={(client) => {
            fetchClients();
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Clients;