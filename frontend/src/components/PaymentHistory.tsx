/**
 * Payment History Component
 * Displays payment history and fee balance for parents
 */

import React, { useState, useEffect } from 'react';
import { mpesaPaymentService, Payment } from '../services/mpesa-payment.service';
import { Download, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentHistoryProps {
  studentId: number;
  studentName: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  studentId,
  studentName,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<{
    totalPaid: number;
    outstandingBalance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'term1' | 'term2' | 'term3'>('all');

  useEffect(() => {
    loadPaymentHistory();
  }, [studentId]);

  const loadPaymentHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await mpesaPaymentService.getPaymentHistory(studentId, {
        limit: 100,
      });

      if (response.success && response.data) {
        setPayments(response.data.payments);
        setSummary(response.data.summary);
      } else {
        throw new Error('Failed to load payment history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.term.toLowerCase().includes(filter);
  });

  const downloadReceipt = (payment: Payment) => {
    // Generate and download receipt PDF
    const receiptData = {
      studentName,
      amount: payment.amount,
      receiptNumber: payment.receiptNumber,
      date: payment.paymentDate,
      term: payment.term,
      academicYear: payment.academicYear,
    };

    // In production, this would call an API to generate PDF
    console.log('Download receipt:', receiptData);
    alert(`Receipt ${payment.receiptNumber} download started`);
  };

  const getPaymentMethodIcon = (method: string) => {
    return <CreditCard className="w-5 h-5 text-green-600" />;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          statusColors[status as keyof typeof statusColors] || statusColors.pending
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-900">Failed to load payments</p>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <button
            onClick={loadPaymentHistory}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Total Paid</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {mpesaPaymentService.formatAmount(summary.totalPaid)}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-900">Outstanding Balance</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {mpesaPaymentService.formatAmount(summary.outstandingBalance)}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {['all', 'term1', 'term2', 'term3'].map((term) => (
          <button
            key={term}
            onClick={() => setFilter(term as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              filter === term
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {term === 'all' ? 'All Payments' : `Term ${term.slice(-1)}`}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No payments found</p>
            <p className="text-sm mt-1">
              {filter !== 'all'
                ? 'Try selecting a different term'
                : 'No payment history available'}
            </p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getPaymentMethodIcon(payment.paymentMethod)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {mpesaPaymentService.formatAmount(payment.amount)}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {payment.term} • {payment.academicYear}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Receipt: {payment.receiptNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadReceipt(payment)}
                  className="ml-4 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Download Receipt"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredPayments.length > 0 && filteredPayments.length % 10 === 0 && (
        <button
          className="w-full py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          onClick={loadPaymentHistory}
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default PaymentHistory;
