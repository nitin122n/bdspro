'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';
import { Eye, CheckCircle, XCircle, RefreshCw, AlertCircle, ArrowLeft, Search, Filter, Plus, DollarSign, Hash, Users, BarChart, Settings, CreditCard, FileText } from 'lucide-react';
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
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const loginTime = localStorage.getItem('admin_login_time');
    
    if (!isAuthenticated || !loginTime) {
      router.push('/admin/login');
      return;
    }

    // Check if session is expired (24 hours)
    const now = Date.now();
    const loginTimestamp = parseInt(loginTime);
    if (now - loginTimestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_login_time');
      router.push('/admin/login');
      return;
    }

    fetchTransactions();
  }, [router]);

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

  const logout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    router.push('/admin/login');
  };

  const getStats = () => {
    const total = transactions.length;
    const verified = transactions.filter(t => t.status === 'verified').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const rejected = transactions.filter(t => t.status === 'rejected').length;
    
    return { total, verified, pending, rejected };
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      case 'pending': return 'text-yellow-800 bg-yellow-100';
      case 'verified': return 'text-green-800 bg-green-100';
      case 'rejected': return 'text-red-800 bg-red-100';
      case 'completed': return 'text-blue-800 bg-blue-100';
      case 'failed': return 'text-gray-800 bg-gray-100';
      case 'cancelled': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600 text-xl">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  const stats = getStats();

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600 mt-1">Manage your application</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Transaction Proofs Card */}
            <div 
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentView('transaction-proofs')}
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transaction Proofs</h3>
                  <p className="text-gray-600 text-sm">View and verify payment proofs</p>
                </div>
              </div>
            </div>

            {/* Referral Codes Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 rounded-lg p-3">
                  <Hash className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Referral Codes</h3>
                  <p className="text-gray-600 text-sm">Manage referral codes and tracking</p>
                </div>
              </div>
            </div>

            {/* Deposits Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Deposits</h3>
                  <p className="text-gray-600 text-sm">Manage deposits and payment verification</p>
                </div>
              </div>
            </div>

            {/* Payment Management Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
                  <p className="text-gray-600 text-sm">Verify cryptocurrency payments</p>
                </div>
              </div>
            </div>

            {/* Users Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                  <p className="text-gray-600 text-sm">Manage user accounts (Coming Soon)</p>
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <BarChart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                  <p className="text-gray-600 text-sm">View statistics (Coming Soon)</p>
                </div>
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <p className="text-gray-600 text-sm">System configuration (Coming Soon)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-gray-600">Total Proofs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.verified}</div>
                <div className="text-gray-600">Verified Proofs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-gray-600">Rejected Proofs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'transaction-proofs') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Transaction Proofs</h1>
                  <p className="text-gray-600 mt-1">Review and verify user transaction proofs</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Status Filters */}
              <div className="flex space-x-2">
                {['all', 'pending', 'verified', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or transaction hash..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchTransactions}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transaction proofs found</h3>
                <p className="text-gray-500">No proofs match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">Transaction</th>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">User</th>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">Amount</th>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">Proof</th>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">Status</th>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">Date</th>
                      <th className="text-left text-gray-700 font-medium py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">#{transaction.id}</div>
                              <div className="text-sm text-gray-500 font-mono">
                                {transaction.description?.substring(0, 20)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{transaction.user_name}</div>
                            <div className="text-sm text-gray-500">{transaction.user_email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{formatAmount(transaction.amount)}</div>
                        </td>
                        <td className="py-4 px-6">
                          {transaction.proof_image ? (
                            <div className="flex items-center space-x-2">
                              <img
                                src={transaction.proof_image}
                                alt="Proof"
                                className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(transaction.proof_image!)}
                              />
                              <button
                                onClick={() => setSelectedImage(transaction.proof_image!)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">No proof</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {transaction.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAction(transaction.id, 'approve')}
                                  disabled={actionLoading === transaction.id}
                                  className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleAction(transaction.id, 'reject')}
                                  disabled={actionLoading === transaction.id}
                                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {actionLoading === transaction.id && (
                              <RefreshCw className="w-4 h-4 text-gray-600 animate-spin" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Proof Image</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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

  return null;
}
