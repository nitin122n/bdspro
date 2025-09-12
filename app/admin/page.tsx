'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Eye, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  type: string;
  amount: number;
  credit: number;
  debit: number;
  balance: number;
  description: string | null;
  proof_image: string | null;
  status: string;
  timestamp: string;
}

export default function AdminPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/admin/transactions');
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
      } else {
        toast.error('Failed to fetch transactions: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (transactionId: number, action: 'approve' | 'reject') => {
    try {
      setActionLoading(transactionId);
      const response = await fetchWithAuth('/api/admin/transactions', {
        method: 'POST',
        body: JSON.stringify({
          action,
          transaction_id: transactionId
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Transaction ${action}d successfully`);
        fetchTransactions(); // Refresh the list
      } else {
        toast.error(`Failed to ${action} transaction: ` + result.message);
      }
    } catch (error) {
      console.error(`Error ${action}ing transaction:`, error);
      toast.error(`Failed to ${action} transaction`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'verified': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      case 'failed': return 'text-gray-400 bg-gray-400/20';
      case 'cancelled': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <div className="text-white text-xl">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-300 mt-2">Manage transactions and payments</p>
            </div>
            <button
              onClick={fetchTransactions}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white font-medium py-4 px-2">ID</th>
                  <th className="text-left text-white font-medium py-4 px-2">User</th>
                  <th className="text-left text-white font-medium py-4 px-2">Amount</th>
                  <th className="text-left text-white font-medium py-4 px-2">Type</th>
                  <th className="text-left text-white font-medium py-4 px-2">Proof</th>
                  <th className="text-left text-white font-medium py-4 px-2">Status</th>
                  <th className="text-left text-white font-medium py-4 px-2">Date</th>
                  <th className="text-left text-white font-medium py-4 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-8">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/10">
                      <td className="text-white py-4 px-2">#{transaction.id}</td>
                      <td className="text-white py-4 px-2">
                        <div>
                          <div className="font-medium">{transaction.user_name}</div>
                          <div className="text-sm text-gray-400">{transaction.user_email}</div>
                        </div>
                      </td>
                      <td className="text-white py-4 px-2 font-medium">
                        {formatAmount(transaction.amount)}
                      </td>
                      <td className="text-white py-4 px-2">
                        <span className="bg-white/10 px-2 py-1 rounded text-sm">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        {transaction.proof_image ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={transaction.proof_image}
                              alt="Proof"
                              className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(transaction.proof_image!)}
                            />
                            <button
                              onClick={() => setSelectedImage(transaction.proof_image!)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">No proof</div>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="text-gray-400 py-4 px-2 text-sm">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-2">
                          {transaction.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(transaction.id, 'approve')}
                                disabled={actionLoading === transaction.id}
                                className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleAction(transaction.id, 'reject')}
                                disabled={actionLoading === transaction.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {actionLoading === transaction.id && (
                            <RefreshCw className="w-4 h-4 text-white animate-spin" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Proof Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Proof"
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
