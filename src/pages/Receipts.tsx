
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash, Search, Eye, Plus, FileText } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

// Interface for receipts based on the database schema
interface Receipt {
  id: string;
  client_id: string | null;
  client_name?: string; // We'll fetch this separately
  created_at: string;
  total: number;
  subtotal: number;
  tax: number;
  discount_amount: number | null;
  delivery_status: string;
}

const Receipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch receipts for the current user
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('receipts')
          .select(`
            id, 
            client_id, 
            created_at, 
            total, 
            subtotal, 
            tax, 
            discount_amount, 
            delivery_status
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (receiptsError) throw receiptsError;

        // Fetch client names
        const clientIds = receiptsData.map(receipt => receipt.client_id).filter(Boolean);
        let clientNames: {[key: string]: string} = {};

        if (clientIds.length > 0) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', clientIds);

          if (clientError) throw clientError;

          clientNames = clientData.reduce((acc, client) => {
            acc[client.id] = client.name;
            return acc;
          }, {});
        }

        // Attach client names to receipts
        const receiptsWithClientNames = receiptsData.map(receipt => ({
          ...receipt,
          client_name: receipt.client_id ? clientNames[receipt.client_id] || 'Unknown Client' : 'No Client'
        }));

        setReceipts(receiptsWithClientNames);
      } catch (error) {
        console.error('Error fetching receipts:', error);
        toast({
          title: "Error",
          description: "Failed to load receipts. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, [user, toast]);

  const handleDeleteReceipt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReceipts(receipts.filter(receipt => receipt.id !== id));
      
      toast({
        title: "Receipt Deleted",
        description: "The receipt has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: "Failed to delete receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredReceipts = receipts.filter(receipt => 
    (receipt.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (dateFilter === 'all' || 
     new Date(receipt.created_at).toLocaleDateString() === dateFilter)
  );

  return (
    <div>
      <PageTitle title="Receipts" subtitle="View and manage prescription receipts" />
      
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by client or ID..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {/* You might want to dynamically generate these based on actual receipt dates */}
              {Array.from(new Set(receipts.map(r => new Date(r.created_at).toLocaleDateString())))
                .map(date => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <Link to="/new-receipt">
          <Button className="bg-optics-600 hover:bg-optics-700">
            <FileText className="h-4 w-4 mr-2" />
            New Receipt
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-6">Loading receipts...</div>
      ) : filteredReceipts.length === 0 ? (
        <div className="text-center py-6">No receipts found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.id}</TableCell>
                  <TableCell>{receipt.client_name}</TableCell>
                  <TableCell>{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{receipt.total.toFixed(2)} DH</TableCell>
                  <TableCell>{receipt.subtotal.toFixed(2)} DH</TableCell>
                  <TableCell>{receipt.tax.toFixed(2)} DH</TableCell>
                  <TableCell>
                    {receipt.discount_amount 
                      ? `${receipt.discount_amount.toFixed(2)} DH` 
                      : '0 DH'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      receipt.delivery_status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receipt.delivery_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {/* View receipt details */}}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {/* Edit receipt */}}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteReceipt(receipt.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Receipts;
