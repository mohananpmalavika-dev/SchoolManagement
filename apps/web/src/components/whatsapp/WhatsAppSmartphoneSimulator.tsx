'use client';

import React, { useState } from 'react';
import {
  WhatsAppCloudMessage,
  WhatsAppButton,
} from '@krypton/types';
import {
  CheckCheck,
  Check,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Download,
  CreditCard,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  QrCode,
  CheckCircle,
  Smartphone,
  Lock,
} from 'lucide-react';
import { SchoolPdfDocument } from '@/lib/whatsapp-client';

interface WhatsAppSmartphoneSimulatorProps {
  messages: WhatsAppCloudMessage[];
  onButtonClick: (
    messageId: string,
    action: 'LEAVE_REASON' | 'PAY_FEE' | 'ACKNOWLEDGE',
    payloadValue?: string,
  ) => void;
  onOpenPdf: (document: SchoolPdfDocument) => void;
  pdfDocuments: SchoolPdfDocument[];
}

export function WhatsAppSmartphoneSimulator({
  messages,
  onButtonClick,
  onOpenPdf,
  pdfDocuments,
}: WhatsAppSmartphoneSimulatorProps) {
  const [activeMpesaModalMessage, setActiveMpesaModalMessage] = useState<WhatsAppCloudMessage | null>(null);
  const [mpesaPin, setMpesaPin] = useState('1234');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [paymentSuccessNote, setPaymentSuccessNote] = useState<string | null>(null);

  const handleSimulateMpesaPayment = (message: WhatsAppCloudMessage) => {
    setIsProcessingMpesa(true);
    setTimeout(() => {
      setIsProcessingMpesa(false);
      setActiveMpesaModalMessage(null);
      const ref = `QKJ${Math.floor(1000 + Math.random() * 9000)}ABC`;
      setPaymentSuccessNote(`M-Pesa KSh ${message.paymentDetails?.amount.toLocaleString()} Confirmed! (Ref: ${ref})`);
      setTimeout(() => setPaymentSuccessNote(null), 5000);
      onButtonClick(message.id, 'PAY_FEE');
    }, 1400);
  };

  return (
    <div className="relative w-full max-w-[390px] mx-auto bg-slate-900 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50">
      {/* Phone Notch / Dynamic Island */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60 ring-1 ring-blue-700/40"></div>
      </div>

      {/* Screen Frame */}
      <div className="relative w-full h-[710px] bg-[#0b141a] rounded-[34px] overflow-hidden flex flex-col font-sans select-none">
        {/* WhatsApp App Header */}
        <div className="bg-[#1f2c34] text-white pt-8 pb-2.5 px-3 flex items-center justify-between border-b border-[#2a3942] z-20 shadow-md">
          <div className="flex items-center space-x-2">
            <button className="text-slate-400 hover:text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                KAN
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1f2c34]"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-sm leading-tight text-slate-100 truncate max-w-[150px]">
                  Krypton Academy Nairobi
                </span>
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-emerald-500 rounded-full text-white text-[9px] font-bold" title="Meta Verified Business">
                  ✓
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">Official School Account</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <button className="p-1 hover:text-white">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-1 hover:text-white">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-1 hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Banner */}
        <div className="bg-[#182229] py-1.5 px-3 text-center text-[10px] text-amber-200/90 flex items-center justify-center gap-1.5 border-b border-[#222e35]">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Meta Cloud API & Safaricom Daraja Protected</span>
        </div>

        {/* Chat Stream */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0b141a]"
          style={{
            backgroundImage:
              'radial-gradient(#1f2c34 1px, transparent 1px), radial-gradient(#1f2c34 1px, #0b141a 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        >
          {/* Date separator */}
          <div className="flex justify-center my-2">
            <span className="bg-[#182229] text-slate-400 text-[10px] font-medium px-2.5 py-0.5 rounded-md shadow-sm">
              LEO / TODAY
            </span>
          </div>

          {messages.map((msg) => {
            const isAbsentAlert = msg.type === 'ABSENCE_ALERT';
            const isFeeReminder = msg.type === 'FEE_PAYMENT_LINK';
            const isPdf = ['REPORT_CARD_PDF', 'FEE_RECEIPT_PDF', 'SCHOOL_NOTICE_PDF'].includes(msg.type);

            return (
              <div key={msg.id} className="flex flex-col items-start max-w-[94%] animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Bubble Container */}
                <div className="bg-[#202c33] text-slate-100 rounded-2xl rounded-tl-sm p-3 shadow-md border border-[#2a3942]/60 w-full relative">
                  {/* Header Tag */}
                  {msg.headerText && (
                    <div className="pb-1.5 mb-1.5 border-b border-[#2f3f4a] flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 tracking-wide">
                        {msg.headerText}
                      </span>
                      {isAbsentAlert && (
                        <span className="bg-red-500/20 text-red-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                          URGENT
                        </span>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="text-[12.5px] leading-relaxed text-slate-200 whitespace-pre-line">
                    {msg.bodyText}
                  </div>

                  {/* Kenyan M-Pesa Card */}
                  {isFeeReminder && msg.paymentDetails && (
                    <div className="mt-2.5 bg-[#111b21] rounded-xl p-2.5 border border-[#26353d]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Kiasi / Amount:</span>
                        <span className="text-base font-bold text-emerald-400">
                          KSh {msg.paymentDetails.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Paybill: <strong className="text-slate-200">174379</strong></span>
                        <span>A/C: <strong className="text-slate-200">{msg.paymentDetails.invoiceNumber}</strong></span>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-2 pt-2 border-t border-[#26353d] flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Status:</span>
                        {msg.paymentDetails.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> IMELIPWA / PAID (M-Pesa)
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                            Inasubiri Malipo / Pending STK
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Digital PDF Card */}
                  {isPdf && msg.attachment && (
                    <div
                      onClick={() => {
                        const target = pdfDocuments.find((p) => p.id === msg.pdfDetails?.documentId) || pdfDocuments[0];
                        onOpenPdf(target);
                      }}
                      className="mt-2.5 bg-[#111b21] hover:bg-[#15232b] cursor-pointer rounded-xl p-2.5 border border-[#2a3b44] transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-100 truncate">
                            {msg.attachment.filename}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            PDF Document • {(msg.attachment.fileSizeBytes! / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-[#223038] text-[10px] text-emerald-400 font-medium flex items-center justify-between">
                        <span>Bofya kutazama & pakua PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  {/* Footer & Timestamp */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-slate-500">{msg.footerText || 'Krypton Academy Cloud Bot'}</span>
                    <div className="flex items-center space-x-1">
                      <span>{msg.sentAt}</span>
                      {msg.status === 'READ' || msg.status === 'REPLIED' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="w-full mt-1.5 space-y-1">
                    {msg.buttons.map((btn, bIdx) => {
                      if (btn.type === 'URL' && isFeeReminder && msg.paymentDetails?.status !== 'PAID') {
                        return (
                          <button
                            key={bIdx}
                            onClick={() => setActiveMpesaModalMessage(msg)}
                            className="w-full bg-[#00A859] hover:bg-[#008744] active:scale-[0.99] border border-emerald-400/40 rounded-xl py-2 px-3 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-white" />
                            {btn.text}
                          </button>
                        );
                      }

                      if (btn.type === 'URL' && isPdf) {
                        return (
                          <button
                            key={bIdx}
                            onClick={() => {
                              const target = pdfDocuments.find((p) => p.id === msg.pdfDetails?.documentId) || pdfDocuments[0];
                              onOpenPdf(target);
                            }}
                            className="w-full bg-[#1e2a30] hover:bg-[#25353d] border border-[#2b3c46] rounded-xl py-2 px-3 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {btn.text}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={bIdx}
                          onClick={() => {
                            if (btn.payload === 'REASON_SICK') {
                              onButtonClick(msg.id, 'LEAVE_REASON', 'Mtoto ni Mgonjwa (Sick Leave)');
                            } else if (btn.payload === 'REASON_TRAVEL') {
                              onButtonClick(msg.id, 'LEAVE_REASON', 'Kuchelewa kwa Basi (Transport Issue)');
                            } else if (btn.payload === 'ACK_PDF' || btn.payload === 'ACK_REPORT_CARD') {
                              onButtonClick(msg.id, 'ACKNOWLEDGE');
                            } else if (btn.phoneNumber) {
                              alert(`Calling school office: ${btn.phoneNumber}`);
                            }
                          }}
                          className="w-full bg-[#1e2a30] hover:bg-[#283842] active:scale-[0.99] border border-[#2b3c46] rounded-xl py-2 px-3 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          {btn.text}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* WhatsApp Message Input Bar */}
        <div className="bg-[#1f2c34] p-2.5 flex items-center space-x-2 border-t border-[#2a3942] z-20">
          <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-slate-400">
            Andika ujumbe au bonyeza kitufe...
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Kenyan M-Pesa STK Push Modal (Safaricom Daraja Simulation) */}
      {activeMpesaModalMessage && activeMpesaModalMessage.paymentDetails && (
        <div className="absolute inset-0 z-50 bg-black/85 rounded-[44px] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-[#00A859] w-full rounded-2xl p-5 text-white shadow-2xl animate-in zoom-in-95 duration-150 relative overflow-hidden">
            {/* Safaricom Green Accent Bar */}
            <div className="h-1.5 bg-[#00A859] -mt-5 -mx-5 mb-4"></div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#00A859]/20 text-[#00A859] flex items-center justify-center font-black text-xs">
                  M
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-white">Lipa Na M-Pesa Online</h4>
                  <span className="text-[10px] text-emerald-400 font-medium">Safaricom STK Push</span>
                </div>
              </div>
              <button
                onClick={() => setActiveMpesaModalMessage(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Ghairi / Cancel
              </button>
            </div>

            <div className="my-4 text-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Kiasi Kinacholipwa / Amount:</span>
              <div className="text-2xl font-black text-[#00A859] mt-0.5 tracking-tight">
                KSh {activeMpesaModalMessage.paymentDetails.amount.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-slate-300 space-y-0.5">
                <p>Biashara: <strong className="text-white">Krypton Academy Nairobi</strong></p>
                <p>Paybill: <strong className="text-emerald-400 font-mono">174379</strong></p>
                <p>Nambari ya Akaunti: <strong className="text-emerald-400 font-mono">{activeMpesaModalMessage.paymentDetails.invoiceNumber}</strong></p>
              </div>
            </div>

            {/* Simulated USSD PIN Prompt */}
            <div className="mb-4 bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl">
              <label className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Weka PIN ya M-Pesa (Enter M-Pesa PIN):</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={mpesaPin}
                  onChange={(e) => setMpesaPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-emerald-700/60 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                Simu yako ya Safaricom itapokea STK prompt mara moja.
              </p>
            </div>

            {/* STK Push Trigger */}
            <button
              onClick={() => handleSimulateMpesaPayment(activeMpesaModalMessage)}
              disabled={isProcessingMpesa}
              className="w-full bg-[#00A859] hover:bg-[#008744] active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              {isProcessingMpesa ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Inatuma M-Pesa STK Prompt...</span>
                </>
              ) : (
                <>
                  <span>Lipa Sasa / Pay KSh {activeMpesaModalMessage.paymentDetails.amount.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Toast */}
      {paymentSuccessNote && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#00A859] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>{paymentSuccessNote}</span>
        </div>
      )}
    </div>
  );
}
