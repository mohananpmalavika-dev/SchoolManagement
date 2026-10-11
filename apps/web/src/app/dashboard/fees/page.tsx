'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  LoadingSpinner,
  Alert,
  Input,
} from '@/components/ui';
import { StudentSelector } from '@/components/StudentSelector';
import { format } from 'date-fns';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string };
  stream: { name: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber: string;
  transactionReference?: string;
}

export default function FeesPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      loadFeeData();
    }
  }, [selectedStudent]);

  const loadFeeData = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError('');

    try {
      const [invoicesData, paymentsData] = await Promise.all([
        api.getStudentInvoices(selectedStudent.id),
        api.getStudentPayments(selectedStudent.id),
      ]);

      setInvoices(invoicesData);
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('Failed to load fee data:', err);
      setError('Failed to load fee information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  // Calculate totals
  const totalFees = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalBalance = totalFees - totalPaid;

  if (!selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentSelector onSelectStudent={setSelectedStudent} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <StudentSelector
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading fee information..." />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="lg">
              <p className="text-sm text-gray-500 mb-2">Total Fees</p>
              <p className="text-3xl font-bold text-gray-900">
                KES {(totalFees / 100).toLocaleString()}
              </p>
            </Card>
            <Card padding="lg">
              <p className="text-sm text-gray-500 mb-2">Amount Paid</p>
              <p className="text-3xl font-bold text-success-600">
                KES {(totalPaid / 100).toLocaleString()}
              </p>
            </Card>
            <Card padding="lg">
              <p className="text-sm text-gray-500 mb-2">Balance Outstanding</p>
              <p
                className={`text-3xl font-bold ${
                  totalBalance > 0 ? 'text-danger-600' : 'text-success-600'
                }`}
              >
                KES {(totalBalance / 100).toLocaleString()}
              </p>
            </Card>
          </div>

          {/* Outstanding Invoices */}
          <Card>
            <CardHeader
              title="Outstanding Invoices"
              subtitle="Invoices awaiting payment"
            />
            <CardContent className="p-0">
              {invoices.filter((inv) => inv.balance > 0).length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {invoices
                    .filter((inv) => inv.balance > 0)
                    .map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        onPay={handlePayInvoice}
                      />
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-success-50 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-success-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">All fees paid!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You have no outstanding invoices
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader
              title="Payment History"
              subtitle="All your past payments"
            />
            <CardContent className="p-0">
              {payments.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <p className="font-medium text-gray-900">
                              KES {(payment.amount / 100).toLocaleString()}
                            </p>
                            <Badge variant="success">{payment.paymentMethod}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')} •
                            Receipt: {payment.receiptNumber}
                          </p>
                          {payment.transactionReference && (
                            <p className="text-xs text-gray-400 mt-1">
                              Ref: {payment.transactionReference}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-gray-500">
                  No payment history available
                </p>
              )}
            </CardContent>
          </Card>

          {/* All Invoices */}
          <Card>
            <CardHeader title="All Invoices" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Invoice
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          KES {(invoice.amount / 100).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          KES {(invoice.paidAmount / 100).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right">
                          <span
                            className={
                              invoice.balance > 0
                                ? 'text-danger-600'
                                : 'text-success-600'
                            }
                          >
                            KES {(invoice.balance / 100).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              invoice.status === 'PAID'
                                ? 'success'
                                : invoice.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {invoice.status.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          student={selectedStudent}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            loadFeeData();
          }}
        />
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  onPay,
}: {
  invoice: Invoice;
  onPay: (invoice: Invoice) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-500">
            Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-lg font-bold text-danger-600">
              KES {(invoice.balance / 100).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              of KES {(invoice.amount / 100).toLocaleString()}
            </p>
          </div>
          <Button size="sm" onClick={() => onPay(invoice)}>
            Pay Now
          </Button>
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
      >
        <span>{showDetails ? 'Hide' : 'Show'} details</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            showDetails ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Invoice Items:</p>
          <div className="space-y-1">
            {invoice.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.description}</span>
                <span className="text-gray-900 font-medium">
                  KES {(item.amount / 100).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PaymentModalProps {
  invoice: Invoice;
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ invoice, student, onClose, onSuccess }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState(invoice.balance);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      // Format phone number (remove spaces, ensure starts with 254)
      let formattedPhone = phoneNumber.replace(/\s/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      await api.initiateSTKPush({
        invoiceId: invoice.id,
        phoneNumber: formattedPhone,
        amount,
      });

      setSuccess(
        'Payment request sent! Please check your phone and enter your M-Pesa PIN to complete the payment.'
      );

      // Close modal after 3 seconds and refresh data
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to initiate payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg animate-fade-in">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Pay with M-Pesa
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 tap-area"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Invoice Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium text-gray-900">
                  {student.firstName} {student.lastName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance Due:</span>
                <span className="font-medium text-danger-600">
                  KES {(invoice.balance / 100).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <Input
              label="M-Pesa Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678"
              required
              helpText="Enter the phone number registered with M-Pesa"
              disabled={isProcessing || !!success}
            />

            <Input
              label="Amount to Pay (KES)"
              type="number"
              value={amount / 100}
              onChange={(e) => setAmount(parseFloat(e.target.value) * 100)}
              min={1}
              max={invoice.balance / 100}
              required
              helpText={`Maximum: KES ${(invoice.balance / 100).toLocaleString()}`}
              disabled={isProcessing || !!success}
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                isLoading={isProcessing}
                disabled={!!success}
              >
                {success ? 'Payment Initiated' : 'Send Payment Request'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You will receive an M-Pesa prompt on your phone. Enter your PIN to
              complete the payment.
            </p>
          </form>
        </Card>
      </div>
    </>
  );
}
