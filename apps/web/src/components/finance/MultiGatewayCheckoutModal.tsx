'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  Globe,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Lock,
  Building,
  RefreshCw,
} from 'lucide-react';
import {
  PaymentGatewayType,
  CurrencyCode,
} from '@krypton/types';
import {
  financeClient,
  DemoInvoice,
  SUPPORTED_CURRENCIES,
} from '@/lib/finance-client';
import { QRCodeSVG } from '@/components/attendance/QRCodeSVG';
import { SchoolCrestLogo } from '@/components/certificates/SchoolCrestLogo';

interface MultiGatewayCheckoutModalProps {
  invoice: DemoInvoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (updatedInvoice: DemoInvoice) => void;
}

export function MultiGatewayCheckoutModal({
  invoice,
  isOpen,
  onClose,
  onPaymentComplete,
}: MultiGatewayCheckoutModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('UPI');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('INR');
  const [payerName, setPayerName] = useState(invoice.guardianName);
  const [payerEmail, setPayerEmail] = useState(invoice.guardianEmail);
  const [payerPhone, setPayerPhone] = useState(invoice.guardianPhone);

  // Gateway specific states
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [upiId, setUpiId] = useState('parent@okhdfcbank');
  const [mpesaPhone, setMpesaPhone] = useState('+254 712 345678');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    transactionReference: string;
    timestamp: string;
    amountPaid: number;
    currency: CurrencyCode;
    gateway: PaymentGatewayType;
  } | null>(null);

  if (!isOpen) return null;

  const currentCurrencyConfig = SUPPORTED_CURRENCIES[selectedCurrency];
  // Calculate converted amount if switched currency
  const convertedAmount =
    selectedCurrency === 'INR'
      ? invoice.balanceAmount
      : Math.round(
          (invoice.balanceAmount * SUPPORTED_CURRENCIES.INR.exchangeRateToUSD) /
            currentCurrencyConfig.exchangeRateToUSD
        );

  const handlePayNow = async () => {
    setIsProcessing(true);
    setProcessingStep(`Connecting to ${selectedGateway} secure payment network...`);

    try {
      if (selectedGateway === 'MPESA') {
        setProcessingStep('Sending STK Push prompt to M-Pesa handset...');
        await new Promise((r) => setTimeout(r, 1200));
        setProcessingStep('Waiting for M-Pesa PIN authorization...');
        await new Promise((r) => setTimeout(r, 1000));
      } else if (selectedGateway === 'STRIPE' || selectedGateway === 'CARD') {
        setProcessingStep('Validating 3D-Secure 2.0 Strong Customer Authentication...');
        await new Promise((r) => setTimeout(r, 1500));
      } else if (selectedGateway === 'UPI') {
        setProcessingStep('Verifying Virtual Payment Address (NPCI UPI Network)...');
        await new Promise((r) => setTimeout(r, 1400));
      } else if (selectedGateway === 'PAYPAL') {
        setProcessingStep('Authorizing international PayPal wallet token...');
        await new Promise((r) => setTimeout(r, 1300));
      }

      setProcessingStep('Finalizing transaction & updating ledger...');
      await new Promise((r) => setTimeout(r, 600));

      const result = await financeClient.processPayment({
        invoiceId: invoice.id,
        amount: invoice.balanceAmount,
        gateway: selectedGateway,
        currency: selectedCurrency,
        payerDetails: {
          payerName,
          email: payerEmail,
          phone: payerPhone,
          cardNumberMasked: cardNumber,
          upiId,
          mpesaPhone,
        },
      });

      setReceiptData({
        receiptNumber: result.receiptNumber,
        transactionReference: result.transactionReference,
        timestamp: result.timestamp,
        amountPaid: invoice.balanceAmount,
        currency: selectedCurrency,
        gateway: selectedGateway,
      });

      onPaymentComplete(result.invoice);
    } catch (err) {
      console.error(err);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <SchoolCrestLogo size={42} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Krypton Global Checkout</h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
                  PCI-DSS Level 1 Secure
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Multi-Gateway Education Fee Portal • Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {receiptData ? (
            /* SUCCESS RECEIPT VIEW */
            <div className="space-y-6 animate-scaleUp">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Payment Successfully Settled!</h2>
                <p className="text-sm text-slate-500">
                  Your official school fee receipt has been recorded and cryptographically stamped.
                </p>
              </div>

              {/* Printable Official Receipt Slip */}
              <div
                id="official-receipt-print"
                className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 relative"
              >
                {/* Watermark Crest */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <SchoolCrestLogo size={280} />
                </div>

                <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <SchoolCrestLogo size={52} />
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">KRYPTON INTERNATIONAL ACADEMY</h4>
                      <p className="text-xs text-slate-500">Affiliated to State & CBSE Boards • School Code: KRY-4801</p>
                      <p className="text-xs text-slate-400">Main Campus, Education City • accounts@kryptonschool.edu</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-mono">
                      OFFICIAL RECEIPT
                    </span>
                    <p className="text-xs font-mono text-slate-500 mt-1">Receipt: {receiptData.receiptNumber}</p>
                    <p className="text-xs text-slate-400">{new Date(receiptData.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-6 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">STUDENT NAME</span>
                    <span className="font-bold text-slate-800 text-sm">{invoice.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">ADMISSION NO</span>
                    <span className="font-semibold text-slate-700">{invoice.admissionNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">GRADE & TERM</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.grade} • {invoice.term}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">GUARDIAN</span>
                    <span className="font-semibold text-slate-700">{payerName}</span>
                  </div>
                </div>

                <table className="w-full text-xs mb-4">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-500 text-left">
                      <th className="py-2">Fee Head</th>
                      <th className="py-2">Term Description</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 font-medium text-slate-700">Tuition & Curriculum Fee</td>
                      <td className="py-2 text-slate-500">Academic Term 2</td>
                      <td className="py-2 text-right font-mono">₹{invoice.tuitionFee.toLocaleString()}</td>
                    </tr>
                    {invoice.activityFee > 0 && (
                      <tr>
                        <td className="py-2 font-medium text-slate-700">Co-Curricular & Lab Activities</td>
                        <td className="py-2 text-slate-500">Term 2 Labs & Library</td>
                        <td className="py-2 text-right font-mono">₹{invoice.activityFee.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.transportFee > 0 && (
                      <tr>
                        <td className="py-2 font-medium text-slate-700">School Transport Facility</td>
                        <td className="py-2 text-slate-500">Route Bus Fee</td>
                        <td className="py-2 text-right font-mono">₹{invoice.transportFee.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.concessionApplied > 0 && (
                      <tr className="text-emerald-700 bg-emerald-50/50">
                        <td className="py-2 font-medium">Concession / Sibling Waiver</td>
                        <td className="py-2">{invoice.concessionNote || 'Scholarship Waiver'}</td>
                        <td className="py-2 text-right font-mono">-₹{invoice.concessionApplied.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.lateFee > 0 && (
                      <tr className="text-amber-700">
                        <td className="py-2 font-medium">Late Payment Fee Escalation</td>
                        <td className="py-2">Overdue Dunning Penalty</td>
                        <td className="py-2 text-right font-mono">+₹{invoice.lateFee.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-800 text-slate-900 font-bold">
                      <td colSpan={2} className="py-3 text-sm">
                        TOTAL AMOUNT SETTLED
                      </td>
                      <td className="py-3 text-right text-base font-mono text-emerald-700">
                        ₹{receiptData.amountPaid.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer with Verification QR & Signature */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <QRCodeSVG
                      value={`KRYPTON:RCP:${receiptData.receiptNumber}:${receiptData.transactionReference}:${receiptData.amountPaid}`}
                      size={60}
                      className="border border-slate-300 p-1 bg-white rounded"
                    />
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p className="font-semibold text-slate-700">Gateway: {receiptData.gateway}</p>
                      <p className="font-mono text-slate-400">Ref: {receiptData.transactionReference}</p>
                      <p className="text-emerald-600 flex items-center gap-1 font-medium">
                        <ShieldCheck size={12} /> Stamped by Krypton Treasury Engine
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="w-28 border-b border-slate-400 mb-1 inline-block"></div>
                    <p className="text-[11px] font-semibold text-slate-700">Authorized Bursar</p>
                    <p className="text-[10px] text-slate-400">Finance & Accounts Division</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2 transition"
                >
                  <Printer size={16} /> Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 shadow-md transition"
                >
                  <CheckCircle2 size={16} /> Return to Finance Hub
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Fee Breakdown & Currency */}
              <div className="md:col-span-5 space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                    INVOICE SUMMARY
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                      <span>{invoice.studentName}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">
                        {invoice.grade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">Inv: {invoice.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">{invoice.term}</p>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Tuition Fee:</span>
                        <span className="font-mono">₹{invoice.tuitionFee.toLocaleString()}</span>
                      </div>
                      {invoice.activityFee > 0 && (
                        <div className="flex justify-between">
                          <span>Activity & Lab:</span>
                          <span className="font-mono">₹{invoice.activityFee.toLocaleString()}</span>
                        </div>
                      )}
                      {invoice.transportFee > 0 && (
                        <div className="flex justify-between">
                          <span>Transport:</span>
                          <span className="font-mono">₹{invoice.transportFee.toLocaleString()}</span>
                        </div>
                      )}
                      {invoice.concessionApplied > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Concession Waiver:</span>
                          <span className="font-mono">-₹{invoice.concessionApplied.toLocaleString()}</span>
                        </div>
                      )}
                      {invoice.lateFee > 0 && (
                        <div className="flex justify-between text-amber-600 font-medium">
                          <span>Accrued Late Fee:</span>
                          <span className="font-mono">+₹{invoice.lateFee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-sm">Balance Due:</span>
                      <span className="font-mono font-bold text-indigo-700 text-lg">
                        {currentCurrencyConfig.symbol}
                        {convertedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multi-Currency Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span>Pay in Currency:</span>
                    <span className="text-[11px] text-slate-400">Live FX Converted</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setSelectedCurrency(cur)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition ${
                          selectedCurrency === cur
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payer Details */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    PAYER CONTACT
                  </h4>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Notification Phone (SMS/WhatsApp)</label>
                    <input
                      type="text"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Gateway Options & Payment Form */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    SELECT PAYMENT GATEWAY
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* UPI */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('UPI')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left relative ${
                        selectedGateway === 'UPI'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <QrCode className="text-indigo-600" size={24} />
                      <span className="text-xs font-bold">UPI / Instant QR</span>
                      <span className="text-[10px] text-slate-500 text-center">GPay, PhonePe, Paytm</span>
                      {selectedGateway === 'UPI' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </button>

                    {/* M-PESA */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('MPESA')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left relative ${
                        selectedGateway === 'MPESA'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Smartphone className="text-emerald-600" size={24} />
                      <span className="text-xs font-bold">M-Pesa STK Push</span>
                      <span className="text-[10px] text-slate-500 text-center">Mobile Money Africa</span>
                      {selectedGateway === 'MPESA' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </button>

                    {/* Stripe / Cards */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('STRIPE')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left relative ${
                        selectedGateway === 'STRIPE'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <CreditCard className="text-blue-600" size={24} />
                      <span className="text-xs font-bold">Stripe / Cards</span>
                      <span className="text-[10px] text-slate-500 text-center">Visa, Mastercard, Amex</span>
                      {selectedGateway === 'STRIPE' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </button>

                    {/* PayPal */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('PAYPAL')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left relative ${
                        selectedGateway === 'PAYPAL'
                          ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Globe className="text-amber-600" size={24} />
                      <span className="text-xs font-bold">PayPal Global</span>
                      <span className="text-[10px] text-slate-500 text-center">International Parents</span>
                      {selectedGateway === 'PAYPAL' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600" />
                      )}
                    </button>

                    {/* NetBanking */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('NET_BANKING')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left relative ${
                        selectedGateway === 'NET_BANKING'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Building className="text-purple-600" size={24} />
                      <span className="text-xs font-bold">Net Banking</span>
                      <span className="text-[10px] text-slate-500 text-center">50+ Major Banks</span>
                      {selectedGateway === 'NET_BANKING' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Gateway Specific Input UI */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
                  {/* UPI Gateway Details */}
                  {selectedGateway === 'UPI' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <QRCodeSVG
                          value={`upi://pay?pa=kryptonschool@hdfcbank&pn=KryptonInternationalAcademy&am=${convertedAmount}&cu=INR&tn=Fee-${invoice.invoiceNumber}`}
                          size={110}
                          className="p-1 border border-slate-200 rounded-lg shadow-sm"
                        />
                        <div className="text-xs space-y-1 text-center sm:text-left">
                          <span className="font-bold text-slate-800 text-sm block">
                            Scan with Any UPI App
                          </span>
                          <p className="text-slate-500">
                            Scan this QR using Google Pay, PhonePe, Paytm, or BHIM to pay instantly.
                          </p>
                          <div className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded font-mono font-medium">
                            <span>VPA: kryptonfees@hdfcbank</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Or Enter UPI ID / VPA
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@okhdfcbank"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* M-PESA Gateway Details */}
                  {selectedGateway === 'MPESA' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                        <Smartphone size={18} className="shrink-0" />
                        <p>
                          Enter your Safaricom M-Pesa mobile number below. You will receive an instant STK Push prompt on your phone to enter your M-Pesa PIN.
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Safaricom Mobile Number
                        </label>
                        <input
                          type="text"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="+254 7XX XXXXXX"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Stripe / Card Details */}
                  {(selectedGateway === 'STRIPE' || selectedGateway === 'CARD') && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full text-xs px-3 py-2 pl-9 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                          <CreditCard className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">CVV / CVC</label>
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            maxLength={4}
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PayPal Details */}
                  {selectedGateway === 'PAYPAL' && (
                    <div className="text-xs text-slate-600 space-y-2 p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                      <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <Globe size={16} /> PayPal International Checkout
                      </p>
                      <p>
                        Supports over 200 countries and 25 currencies. You will be redirected to PayPal's secure authentication terminal to complete the authorization.
                      </p>
                    </div>
                  )}

                  {/* Net Banking Details */}
                  {selectedGateway === 'NET_BANKING' && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Select Your Bank
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option>State Bank of India</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Federal Bank</option>
                        <option>Canara Bank</option>
                        <option>Punjab National Bank</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handlePayNow}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        <span>{processingStep}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>
                          Pay {currentCurrencyConfig.symbol}
                          {convertedAmount.toLocaleString()} via {selectedGateway}
                        </span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    256-bit Bank Grade SSL Encryption • Automated Instant Receipt Issued
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
