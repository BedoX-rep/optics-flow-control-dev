
import React, { useState } from 'react';
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

// Dummy data
const initialReceipts = [
  { 
    id: '#R8994FD', 
    client: 'Ahmed Ahmed', 
    date: '04/10/2023', 
    time: '12:38 PM', 
    total: 900.00, 
    discount: 0, 
    subtotal: 900.00, 
    payment: 'CASH',
    status: 'PAID',
    delivery: 'Completed' 
  },
  { 
    id: '#R237DAB', 
    client: 'Adam Salem', 
    date: '04/10/2023', 
    time: '02:30 PM', 
    total: 650.00, 
    discount: 0, 
    subtotal: 650.00, 
    payment: 'CARD',
    status: 'PAID',
    delivery: 'Completed' 
  },
  { 
    id: '#R937F83', 
    client: 'Sara Ahmed', 
    date: '04/11/2023', 
    time: '10:27 AM', 
    total: 750.00, 
    discount: 0, 
    subtotal: 750.00, 
    payment: 'CASH',
    status: 'PAID',
    delivery: 'Processing' 
  },
];

const Receipts = () => {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const filteredReceipts = receipts.filter(receipt => 
    (receipt.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (dateFilter === 'all' || dateFilter === receipt.date)
  );

  const handleDeleteReceipt = (id: string) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id));
  };

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
              <SelectItem value="04/10/2023">04/10/2023</SelectItem>
              <SelectItem value="04/11/2023">04/11/2023</SelectItem>
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
      
      <div className="bg-white rounded-lg shadow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.id}</TableCell>
                <TableCell>{receipt.client}</TableCell>
                <TableCell>{receipt.date}</TableCell>
                <TableCell>{receipt.time}</TableCell>
                <TableCell>{receipt.total.toFixed(2)} DH</TableCell>
                <TableCell>{receipt.discount.toFixed(2)} DH</TableCell>
                <TableCell>{receipt.subtotal.toFixed(2)} DH</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    receipt.payment === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {receipt.payment}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    receipt.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {receipt.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    receipt.delivery === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {receipt.delivery}
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
    </div>
  );
};

export default Receipts;
