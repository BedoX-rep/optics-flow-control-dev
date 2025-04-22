
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
import { Phone, FileText, Eye, Plus, Filter } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ReceiptDetailsDialog from '@/components/ReceiptDetailsDialog';
import { Card, CardContent } from '@/components/ui/card';

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

    if (user) {
      fetchReceipts();
    }
  }, [searchTerm, dateFilter]);

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

  const pageActions = (
    <Link to="/new-receipt">
      <Button className="primary-gradient text-white hover:shadow-md transition-shadow">
        <Plus className="h-4 w-4 mr-2" />
        New Receipt
      </Button>
    </Link>
  );

  return (
    <div>
      <PageTitle 
        title="Receipts" 
        subtitle="View and manage prescription receipts" 
        actions={pageActions}
      />
      
      <Card className="mb-6 card-shadow border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Search by client or phone..." 
                className="pl-9 pr-4 py-2 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px] border-gray-200">
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
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto"></div>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No receipts found</h3>
          <p className="text-gray-500 mb-6">Create your first receipt to get started.</p>
          <Link to="/new-receipt">
            <Button className="primary-gradient text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Receipt
            </Button>
          </Link>
        </div>
      ) : (
        <Card className="border border-gray-100 card-shadow overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
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
                  <TableRow key={receipt.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium">{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{receipt.client_name}</TableCell>
                    <TableCell>{receipt.client_phone}</TableCell>
                    <TableCell className="font-medium">{receipt.total.toFixed(2)} DH</TableCell>
                    <TableCell>{receipt.balance.toFixed(2)} DH</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        receipt.delivery_status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {receipt.delivery_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        receipt.montage_status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
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
                        className="hover:bg-gray-100 rounded-full"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
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

