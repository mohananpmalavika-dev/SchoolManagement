'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp,
  CreditCard,
  FileText,
  AlertTriangle,
  UserX,
  Send,
  Download,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  CheckCheck,
  FileCheck,
  Calendar,
  Layers,
  Settings,
  QrCode,
  DollarSign,
  Share2,
} from 'lucide-react';
import {
  WhatsAppCloudMessage,
  WhatsAppAutomationConfig,
  WhatsAppAutomationStats,
  WhatsAppLanguage,
} from '@krypton/types';
import {
  whatsAppClient,
  StudentParentContact,
  FeeInvoiceItem,
  SchoolPdfDocument,
} from '@/lib/whatsapp-client';
import { WhatsAppSmartphoneSimulator } from './WhatsAppSmartphoneSimulator';
import { WhatsAppDocumentViewerModal } from './WhatsAppDocumentViewerModal';

export function WhatsAppAutomationHub() {
  const [messages, setMessages] = useState<WhatsAppCloudMessage[]>(whatsAppClient.getMessages());
  const [students, setStudents] = useState<StudentParentContact[]>(whatsAppClient.getStudents());
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>(whatsAppClient.getInvoices());
  const [pdfDocuments, setPdfDocuments] = useState<SchoolPdfDocument[]>(whatsAppClient.getPdfDocuments());
  const [stats, setStats] = useState<WhatsAppAutomationStats>(whatsAppClient.getStats());
  const [config, setConfig] = useState<WhatsAppAutomationConfig>(whatsAppClient.getConfig());

  // UI state
  const [activeTab, setActiveTab] = useState<'AUTOMATION' | 'ABSENTEE' | 'FEES' | 'DOCUMENTS' | 'CONFIG'>('AUTOMATION');
  const [selectedLanguage, setSelectedLanguage] = useState<WhatsAppLanguage>('sw');
  const [activeDocumentForModal, setActiveDocumentForModal] = useState<SchoolPdfDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [broadcastNotification, setBroadcastNotification] = useState<string | null>(null);

  const refreshAll = () => {
    setMessages(whatsAppClient.getMessages());
    setStudents(whatsAppClient.getStudents());
    setInvoices(whatsAppClient.getInvoices());
    setPdfDocuments(whatsAppClient.getPdfDocuments());
    setStats(whatsAppClient.getStats());
    setConfig(whatsAppClient.getConfig());
  };

  const notifyUser = (msg: string) => {
    setBroadcastNotification(msg);
    setTimeout(() => setBroadcastNotification(null), 4000);
  };

  // Feature 1 Handler: Trigger Morning Absentee Broadcast (Kenya Context)
  const handleTriggerAbsenteeBroadcast = (studentId?: string) => {
    if (studentId) {
      whatsAppClient.sendAbsenteeAlert(studentId, selectedLanguage);
      refreshAll();
      notifyUser(selectedLanguage === 'sw' ? 'Arifa ya kutohudhuria imetumwa WhatsApp kwa mzazi!' : 'Absence alert sent to parent via WhatsApp!');
    } else {
      const absents = students.filter((s) => s.isAbsentToday);
      absents.forEach((st) => {
        whatsAppClient.sendAbsenteeAlert(st.id, selectedLanguage);
      });
      refreshAll();
      notifyUser(
        selectedLanguage === 'sw'
          ? `Arifa zimetumwa kwa wazazi wote wa wanafunzi ${absents.length} ambao hawajahudhuria!`
          : `Broadcast dispatched to all ${absents.length} absent students' parents!`,
      );
    }
  };

  // Feature 2 Handler: Trigger 1-Click M-Pesa Fee Reminders
  const handleTriggerFeeBroadcast = (invoiceId?: string) => {
    if (invoiceId) {
      whatsAppClient.sendFeeReminder(invoiceId, selectedLanguage);
      refreshAll();
      notifyUser(selectedLanguage === 'sw' ? 'Kiungo cha Lipa Na M-Pesa kimetumwa WhatsApp!' : '1-Click M-Pesa payment link sent via WhatsApp!');
    } else {
      const pendingInvoices = invoices.filter((i) => i.status !== 'PAID');
      pendingInvoices.forEach((inv) => {
        whatsAppClient.sendFeeReminder(inv.id, selectedLanguage);
      });
      refreshAll();
      notifyUser(
        selectedLanguage === 'sw'
          ? `Viungo vya ankara za M-Pesa ${pendingInvoices.length} vimetumwa kwa wazazi!`
          : `${pendingInvoices.length} M-Pesa payment invoice reminders dispatched!`,
      );
    }
  };

  // Feature 3 Handler: Trigger Digital PDF Delivery
  const handleTriggerPdfDelivery = (docId: string) => {
    whatsAppClient.sendPdfDelivery(docId, selectedLanguage);
    refreshAll();
    notifyUser(selectedLanguage === 'sw' ? 'Waraka rasmi wa PDF umetumwa moja kwa moja WhatsApp!' : 'Digital verified PDF delivered directly via WhatsApp!');
  };

  // Simulator Interaction Callback
  const handleSimulatorButtonClick = (
    messageId: string,
    action: 'LEAVE_REASON' | 'PAY_FEE' | 'ACKNOWLEDGE',
    payloadValue?: string,
  ) => {
    const res = whatsAppClient.simulateParentAction(messageId, action, payloadValue);
    refreshAll();
    if (res.feedbackMessage) {
      notifyUser(res.feedbackMessage);
    }
  };

  const handleOpenPdf = (doc: SchoolPdfDocument) => {
    setActiveDocumentForModal(doc);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Banner & Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="studio-banner bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#00A859]/10 skew-x-12 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00A859]/25 text-[#00E575] border border-[#00A859]/40">
                  <span className="w-2 h-2 rounded-full bg-[#00A859] animate-pulse"></span>
                  Safaricom M-Pesa (Daraja API) + Meta Cloud API
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-200">
                  <Zap className="w-3.5 h-3.5" /> 98.9% Open Rate in Kenya
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  🇰🇪 Kenya Schools Edition
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                WhatsApp Cloud API & M-Pesa Automation Hub
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1 max-w-2xl">
                Mfumo wa mawasiliano ya haraka kwa wazazi nchini Kenya: Arifa za papo hapo za mahudhurio, Lipa Na M-Pesa STK Push, na utoaji wa kadi za ripoti za PDF moja kwa moja WhatsApp.
              </p>
            </div>

            {/* Language & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex items-center border border-white/15 text-xs">
                <button
                  onClick={() => setSelectedLanguage('sw')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedLanguage === 'sw'
                      ? 'bg-[#00A859] text-white shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  🇰🇪 Kiswahili (SW)
                </button>
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedLanguage === 'en'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  🇬🇧 English (EN)
                </button>
                <button
                  onClick={() => setSelectedLanguage('ml')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedLanguage === 'ml'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  🌴 മലയാളം (ML)
                </button>
              </div>

              <button
                onClick={refreshAll}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors border border-white/15"
                title="Refresh Analytics"
              >
                <RefreshCw className="w-4 h-4 text-emerald-200" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards (Kenyan Shillings) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>WhatsApp Open Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {stats.openRatePercentage}%
              </div>
              <span className="text-[11px] text-emerald-300/80">vs. 19% standard SMS</span>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>Avg Read Time</span>
                <Clock className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                &lt; {stats.avgReadTimeMinutes} Mins
              </div>
              <span className="text-[11px] text-teal-300/80">Immediate attention</span>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>M-Pesa Fees Collected</span>
                <CreditCard className="w-4 h-4 text-[#00E575]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                KSh {stats.paymentCollectedAmount.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-300/80">Paybill 174379 Live</span>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>PDF Direct Downloads</span>
                <Download className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {stats.pdfDownloadsCount} PDFs
              </div>
              <span className="text-[11px] text-sky-300/80">Zero app install required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Live Simulator */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Tabs & Feature Control Panels */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200/80">
            <button
              onClick={() => setActiveTab('AUTOMATION')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'AUTOMATION'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Kituo cha Otomatiki / Controls</span>
            </button>
            <button
              onClick={() => setActiveTab('ABSENTEE')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'ABSENTEE'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>Mahudhurio / Absentee</span>
            </button>
            <button
              onClick={() => setActiveTab('FEES')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'FEES'
                  ? 'bg-[#00A859] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Lipa Na M-Pesa</span>
            </button>
            <button
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'DOCUMENTS'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Nyaraka za PDF</span>
            </button>
            <button
              onClick={() => setActiveTab('CONFIG')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'CONFIG'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Daraja & Cloud API</span>
            </button>
          </div>

          {/* TAB 1: AUTOMATION COMMAND CENTER */}
          {activeTab === 'AUTOMATION' && (
            <div className="space-y-6">
              {/* Feature 1 Card: Instant Absentee Notification */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        1. Instant WhatsApp Absence Alert (Arifa ya Mahudhurio)
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Mwanafunzi asipofika shuleni, wazazi hupokea ujumbe wa WhatsApp papo hapo asubuhi.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
                    {students.filter((s) => s.isAbsentToday).length} Hawajahudhuria Leo (Absent)
                  </span>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Saa ya Otomatiki ya Asubuhi:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      08:30 AM (Daily Roll Call Sync)
                    </span>
                  </div>
                  <p className="text-gray-500">
                    Mara tu mwalimu anapokamilisha mahudhurio ya darasa, ujumbe wenye vitufe vya jibu la haraka (Ugonjwa / Usafiri / Piga Simu Shuleni) hutumwa kwa wazazi moja kwa moja.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mzazi anapojibu, sajili ya shule inasasishwa mara moja</span>
                  </div>
                  <button
                    onClick={() => handleTriggerAbsenteeBroadcast()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tuma Arifa za Mahudhurio / Send Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Feature 2 Card: 1-Click Fee Payment Link (M-Pesa STK Push) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        2. 1-Click M-Pesa STK Push Payment (Lipa Na M-Pesa)
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Ankara inapofika tarehe ya malipo, mzazi hupokea kiungo cha M-Pesa WhatsApp. Akibofya, simu yake inapokea STK prompt na kulipa kwa sekunde chache.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                    {invoices.filter((i) => i.status !== 'PAID').length} Ankara Zinazosubiri
                  </span>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Safaricom Daraja Gateway:</span>
                    <span className="text-[#00A859] font-bold">
                      Paybill: 174379 • STK Push & C2B Auto-Reconcile
                    </span>
                  </div>
                  <p className="text-gray-500">
                    Bila kuingia kwenye benki au foleni ya shule, mzazi anathibitisha malipo kupitia PIN ya M-Pesa kwenye simu yake. Risiti ya kidijitali hutumwa WhatsApp mara moja.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Malipo yakifanyika, ankara inasasishwa kuwa &apos;PAID&apos; papo hapo</span>
                  </div>
                  <button
                    onClick={() => handleTriggerFeeBroadcast()}
                    className="flex items-center gap-2 bg-[#00A859] hover:bg-[#008744] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tuma Viungo vya M-Pesa / Dispatch STK Push</span>
                  </button>
                </div>
              </div>

              {/* Feature 3 Card: Digital PDF Delivery */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        3. Digital PDF Delivery (Utoaji wa Nyaraka za PDF)
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Kadi za ripoti za mitihani, risiti za M-Pesa, na waraka rasmi wa shule zinapakuliwa moja kwa moja WhatsApp bila kupakua programu nyingine.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full font-semibold">
                    {pdfDocuments.length} Verified PDFs
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pdfDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800 truncate">
                            {doc.title.split(':')[0]}
                          </span>
                          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border text-gray-600">
                            PDF
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                          {doc.summarySw}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenPdf(doc)}
                          className="text-emerald-700 hover:text-emerald-800 font-medium text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Tazama / View
                        </button>
                        <button
                          onClick={() => handleTriggerPdfDelivery(doc.id)}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-[10px] px-2 py-1 rounded-lg transition-colors"
                        >
                          Tuma WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABSENTEE DIRECTORY (KENYA) */}
          {activeTab === 'ABSENTEE' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Orodha ya Wanafunzi Wasiohudhuria Leo (Kenya Absentees)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Morning Roll-call Sync with WhatsApp Cloud Messaging (+254 Phone Format)
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerAbsenteeBroadcast()}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Arifu Wazazi Wote / Notify All</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="py-3.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                          student.isAbsentToday
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {student.name}
                          </span>
                          <span className="text-gray-500 font-mono text-[11px]">
                            {student.className} • Roll: {student.rollNumber}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-0.5">
                          Mzazi: <strong className="text-gray-700">{student.parentName}</strong> • Simu: {student.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {student.isAbsentToday ? (
                        <div className="text-right">
                          <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded text-[11px] border border-red-200">
                            HAJAHUDHURIA ({student.absentReportedTime || '08:15 AM'})
                          </span>
                          <div className="mt-1">
                            <button
                              onClick={() => handleTriggerAbsenteeBroadcast(student.id)}
                              className="text-red-600 hover:text-red-700 font-semibold underline text-[11px]"
                            >
                              Tuma Arifa / Send Alert
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          AMEHUDHURIA / PRESENT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FEES & LIPA NA M-PESA */}
          {activeTab === 'FEES' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Ankara za Ada na Viungo vya Lipa Na M-Pesa (Kenya Invoices)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Safaricom Daraja STK Push Integration with Live ERP Fee Reconciliation
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerFeeBroadcast()}
                  className="bg-[#00A859] hover:bg-[#008744] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tuma Ankara Zote za M-Pesa</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-4 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {inv.studentName}
                          </span>
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-emerald-700 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Paybill: {inv.mpesaPaybill}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5">
                          {inv.descriptionSw}
                        </p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          Mzazi: {inv.parentName} ({inv.parentPhone}) • Mwisho: {inv.dueDate}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">
                          KSh {inv.amountKsh.toLocaleString()}
                        </div>
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 bg-[#00A859]/20 text-[#008744] font-bold px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> IMELIPWA / PAID
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            INASUBIRI / DUE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-gray-500 font-mono">
                        Akaunti: {inv.mpesaAccountNumber} • Safaricom STK Ready
                      </span>
                      <div className="flex items-center gap-2">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleTriggerFeeBroadcast(inv.id)}
                            className="bg-[#00A859] hover:bg-[#008744] text-white px-3 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Tuma M-Pesa STK
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const receiptDoc = pdfDocuments.find((d) => d.type === 'FEE_RECEIPT') || pdfDocuments[1];
                            handleOpenPdf(receiptDoc);
                          }}
                          className="text-gray-600 hover:text-gray-900 font-medium text-[11px] border border-gray-200 px-2 py-1 rounded-lg"
                        >
                          Tazama Risiti
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DIGITAL PDF VAULT */}
          {activeTab === 'DOCUMENTS' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Hifadhi ya Nyaraka za PDF (Kadi za Ripoti, Risiti za M-Pesa, Waraka)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Official PDFs Dispatched Directly into WhatsApp Chat
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {pdfDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-gray-900">
                              {doc.title}
                            </h3>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                              {doc.type}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800 font-medium mt-0.5">
                            {doc.titleSw}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {doc.summarySw}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                            <span>Tarehe: {doc.publishedDate}</span>
                            <span>•</span>
                            <span>Ukubwa: {(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span>Kurasa: {doc.pagesCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenPdf(doc)}
                          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>Tazama / View</span>
                        </button>
                        <button
                          onClick={() => handleTriggerPdfDelivery(doc.id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Tuma WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: META CLOUD API & DARAJA M-PESA CONFIG */}
          {activeTab === 'CONFIG' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Safaricom Daraja API & Meta WhatsApp Cloud Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kenya Payment Gateway Settings, Webhook URLs, and STK Push Passkeys
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">Safaricom Business Shortcode / Paybill</span>
                  <p className="font-mono font-bold text-gray-900 text-base">174379</p>
                  <span className="text-[10px] text-[#00A859] font-bold">Lipa Na M-Pesa Online Enabled</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">M-Pesa STK Callback URL</span>
                  <p className="font-mono text-gray-800 truncate">https://api.kryptonschool.co.ke/api/v1/mpesa/stk-push/callback</p>
                  <span className="text-[10px] text-[#00A859] font-bold">Instant ERP Ledger Reconcile</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">WhatsApp Business Account (WABA ID)</span>
                  <p className="font-mono font-bold text-gray-900">{config.wabaId}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Meta Verified for Kenya (+254)</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">Official Sender Number</span>
                  <p className="font-mono font-bold text-gray-900">+254 712 000 111</p>
                  <span className="text-[10px] text-gray-600">Safaricom Line Registered</span>
                </div>
              </div>

              {/* Schedules */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" /> Ratiba ya Kiotomatiki (Automated Schedules)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[11px] text-emerald-800 font-medium">Arifa ya Mahudhurio</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">08:30 AM Kila Siku</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[11px] text-emerald-800 font-medium">Kikumbusho cha Ada (M-Pesa)</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">Siku 3 Kabla ya Mwisho</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[11px] text-emerald-800 font-medium">Kadi ya Ripoti ya PDF</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">Papo hapo mwalimu akisaini</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Interactive Smartphone WhatsApp Simulator */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-xs uppercase tracking-wider text-gray-700">
                Live WhatsApp & M-Pesa Simulator
              </span>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              🇰🇪 Safaricom Kenya
            </span>
          </div>

          {/* Smartphone Mockup */}
          <WhatsAppSmartphoneSimulator
            messages={messages}
            onButtonClick={handleSimulatorButtonClick}
            onOpenPdf={handleOpenPdf}
            pdfDocuments={pdfDocuments}
          />
          <p className="text-[11px] text-gray-500 mt-2 text-center max-w-xs">
            💡 Bonyeza kitufe cha <strong>&quot;Lipa via M-Pesa&quot;</strong> kupokea mfano wa <strong>Safaricom STK PIN prompt</strong> na uone utoaji wa risiti ya kidijitali.
          </p>
        </div>
      </div>

      {/* High Fidelity PDF Viewer Modal */}
      <WhatsAppDocumentViewerModal
        document={activeDocumentForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Broadcast Toast Notification */}
      {broadcastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00A859] animate-pulse"></div>
          <span>{broadcastNotification}</span>
        </div>
      )}
    </div>
  );
}
