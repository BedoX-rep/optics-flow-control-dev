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
import { Phone, FileText, Eye } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ReceiptDetailsDialog from '@/components/ReceiptDetailsDialog';

interface Receipt {
  id: string;
  client_id: string | null;
  client_name?: string;
  client_phone?: string;
  created_at: string;
  total: number;
  delivery_status: string;
  montage_status: string;
  balance: number;
}

const Receipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch receipts with client information
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('receipts')
          .select(`
            *,
            clients (
              name,
              phone
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (receiptsError) throw receiptsError;

        // Transform the data to include client information
        const formattedReceipts = receiptsData.map(receipt => ({
          ...receipt,
          client_name: receipt.clients?.name || 'No Client',
          client_phone: receipt.clients?.phone || 'N/A'
        }));

        setReceipts(formattedReceipts);
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
     receipt.client_phone?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (dateFilter === 'all' || 
     new Date(receipt.created_at).toLocaleDateString() === dateFilter)
  );

  return (
    <div>
      <PageTitle title="Receipts" subtitle="View and manage prescription receipts" />
      
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative w-64">
            <Phone className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by client or phone..." 
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
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Montage Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{receipt.client_name}</TableCell>
                  <TableCell>{receipt.client_phone}</TableCell>
                  <TableCell>{receipt.total.toFixed(2)} DH</TableCell>
                  <TableCell>{receipt.balance.toFixed(2)} DH</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      receipt.delivery_status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receipt.delivery_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      receipt.montage_status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receipt.montage_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedReceipt(receipt)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReceiptDetailsDialog
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default Receipts;
