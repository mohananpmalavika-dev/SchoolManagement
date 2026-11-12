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
  const [selectedLanguage, setSelectedLanguage] = useState<WhatsAppLanguage>('en');
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

  // Feature 1 Handler: Trigger Morning Absentee Broadcast (India Context)
  const handleTriggerAbsenteeBroadcast = (studentId?: string) => {
    if (studentId) {
      whatsAppClient.sendAbsenteeAlert(studentId, selectedLanguage);
      refreshAll();
      notifyUser(
        selectedLanguage === 'hi'
          ? 'अनुपस्थिति सूचना अभिभावक को WhatsApp पर भेजी गई!'
          : selectedLanguage === 'ml'
          ? 'ഹാജരില്ലാത്ത വിവരം രക്ഷിതാവിന് WhatsApp വഴി അയച്ചു!'
          : 'Absence alert sent to parent via WhatsApp!'
      );
    } else {
      const absents = students.filter((s) => s.isAbsentToday);
      absents.forEach((st) => {
        whatsAppClient.sendAbsenteeAlert(st.id, selectedLanguage);
      });
      refreshAll();
      notifyUser(
        selectedLanguage === 'hi'
          ? `${absents.length} अनुपस्थित विद्यार्थियों के अभिभावकों को सूचना प्रसारित!`
          : selectedLanguage === 'ml'
          ? `${absents.length} ഹാജരില്ലാത്ത കുട്ടികളുടെ രക്ഷിതാക്കൾക്ക് സന്ദേശം അയച്ചു!`
          : `Broadcast dispatched to all ${absents.length} absent students' parents!`
      );
    }
  };

  // Feature 2 Handler: Trigger 1-Click UPI / Razorpay Fee Reminders
  const handleTriggerFeeBroadcast = (invoiceId?: string) => {
    if (invoiceId) {
      whatsAppClient.sendFeeReminder(invoiceId, selectedLanguage);
      refreshAll();
      notifyUser(
        selectedLanguage === 'hi'
          ? '1-क्लिक UPI शुल्क भुगतान लिंक WhatsApp पर भेजा गया!'
          : selectedLanguage === 'ml'
          ? '1-ക്ലിക്ക് UPI ഫീസ് പേയ്‌മെന്റ് ലിങ്ക് WhatsApp വഴി അയച്ചു!'
          : '1-Click UPI / Razorpay payment link sent via WhatsApp!'
      );
    } else {
      const pendingInvoices = invoices.filter((i) => i.status !== 'PAID');
      pendingInvoices.forEach((inv) => {
        whatsAppClient.sendFeeReminder(inv.id, selectedLanguage);
      });
      refreshAll();
      notifyUser(
        selectedLanguage === 'hi'
          ? `${pendingInvoices.length} लंबित शुल्क चालानों के UPI भुगतान लिंक भेजे गए!`
          : selectedLanguage === 'ml'
          ? `${pendingInvoices.length} ഫീസ് ഇൻവോയ്സ് UPI പേയ്‌മെന്റ് ലിങ്കുകൾ അയച്ചു!`
          : `${pendingInvoices.length} UPI fee payment invoice reminders dispatched!`
      );
    }
  };

  // Feature 3 Handler: Trigger Digital PDF Delivery
  const handleTriggerPdfDelivery = (docId: string) => {
    whatsAppClient.sendPdfDelivery(docId, selectedLanguage);
    refreshAll();
    notifyUser(
      selectedLanguage === 'hi'
        ? 'सत्यापित डिजिटल PDF दस्तावेज़ WhatsApp पर भेजा गया!'
        : selectedLanguage === 'ml'
        ? 'ഡിജിറ്റൽ വെരിഫൈഡ് PDF ഡോക്യുമെന്റ് WhatsApp വഴി അയച്ചു!'
        : 'Digital verified PDF delivered directly via WhatsApp!'
    );
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
                  Razorpay + NPCI UPI + Meta Cloud API
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-200">
                  <Zap className="w-3.5 h-3.5" /> 98.9% Open Rate in India
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  🇮🇳 India Schools Edition
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                WhatsApp Cloud API &amp; UPI Automation Hub
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1 max-w-2xl">
                Instant parent communication for Indian schools: Morning attendance alerts, 1-Click Razorpay / NPCI UPI fee links, and CBSE/ICSE PDF report cards delivered directly on WhatsApp.
              </p>
            </div>

            {/* Language & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex items-center border border-white/15 text-xs">
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedLanguage === 'en'
                      ? 'bg-[#00A859] text-white shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  🇮🇳 English (EN)
                </button>
                <button
                  onClick={() => setSelectedLanguage('hi')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedLanguage === 'hi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  🇮🇳 हिन्दी (HI)
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

          {/* Quick Metrics Cards (Indian Rupees) */}
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
                <span>UPI / Razorpay Fees Collected</span>
                <CreditCard className="w-4 h-4 text-[#00E575]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                ₹{stats.paymentCollectedAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-300/80">UPI: kryptonfees@icici Live</span>
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
              <span>Automation Controls</span>
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
              <span>Attendance Alerts</span>
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
              <span>UPI &amp; Razorpay</span>
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
              <span>PDF Documents</span>
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
              <span>Razorpay &amp; Cloud API</span>
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
                        1. Instant WhatsApp Absence Alert
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        When a student is marked absent during morning roll call, parents receive an instant WhatsApp alert in English, Hindi, or Malayalam.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
                    {students.filter((s) => s.isAbsentToday).length} Absent Today
                  </span>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Morning Auto-Dispatch Time:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      08:30 AM IST (Daily Roll Call Sync)
                    </span>
                  </div>
                  <p className="text-gray-500">
                    Once the class teacher submits morning attendance, WhatsApp alerts with 1-tap quick-reply options (Medical Leave / Transport Delay / Call Office) are dispatched automatically.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Parent replies update the school register in real time</span>
                  </div>
                  <button
                    onClick={() => handleTriggerAbsenteeBroadcast()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Absence Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Feature 2 Card: 1-Click Fee Payment Link (UPI / Razorpay) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        2. 1-Click UPI &amp; Razorpay Fee Payment Link
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Parents receive a verified Razorpay / UPI payment link inside WhatsApp and settle fees in seconds via Google Pay, PhonePe, Paytm, or BHIM.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                    {invoices.filter((i) => i.status !== 'PAID').length} Pending Invoices
                  </span>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Razorpay &amp; NPCI UPI Gateway:</span>
                    <span className="text-[#00A859] font-bold">
                      UPI: kryptonfees@icici • Webhook Auto-Reconcile
                    </span>
                  </div>
                  <p className="text-gray-500">
                    Without waiting in bank or school office queues, parents pay using any Indian UPI app and receive a signed PDF fee receipt right inside WhatsApp.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Invoices automatically mark as &apos;PAID&apos; on webhook settlement</span>
                  </div>
                  <button
                    onClick={() => handleTriggerFeeBroadcast()}
                    className="flex items-center gap-2 bg-[#00A859] hover:bg-[#008744] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch UPI / Razorpay Links</span>
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
                        3. Digital PDF Delivery (Report Cards &amp; Receipts)
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        CBSE/ICSE report cards, UPI fee receipts, and official school circulars delivered directly in WhatsApp with zero extra app downloads.
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
                          {selectedLanguage === 'ml' ? (doc.summaryMl || doc.summary) : selectedLanguage === 'hi' ? (doc.summaryHi || doc.summary) : doc.summary}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenPdf(doc)}
                          className="text-emerald-700 hover:text-emerald-800 font-medium text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View PDF
                        </button>
                        <button
                          onClick={() => handleTriggerPdfDelivery(doc.id)}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-[10px] px-2 py-1 rounded-lg transition-colors"
                        >
                          Send WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABSENTEE DIRECTORY (INDIA) */}
          {activeTab === 'ABSENTEE' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Daily Absentee Directory (India Schools)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Morning Roll-call Sync with WhatsApp Cloud Messaging (+91 Indian Mobile Format)
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerAbsenteeBroadcast()}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notify All Parents</span>
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
                          Parent: <strong className="text-gray-700">{student.parentName}</strong> • Phone: {student.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {student.isAbsentToday ? (
                        <div className="text-right">
                          <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded text-[11px] border border-red-200">
                            ABSENT ({student.absentReportedTime || '08:15 AM'})
                          </span>
                          <div className="mt-1">
                            <button
                              onClick={() => handleTriggerAbsenteeBroadcast(student.id)}
                              className="text-red-600 hover:text-red-700 font-semibold underline text-[11px]"
                            >
                              Send Alert
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          PRESENT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FEES & UPI / RAZORPAY */}
          {activeTab === 'FEES' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Fee Invoices &amp; 1-Click UPI / Razorpay Links
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Razorpay &amp; NPCI UPI Integration with Live ERP Fee Reconciliation
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerFeeBroadcast()}
                  className="bg-[#00A859] hover:bg-[#008744] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Send All UPI Fee Links</span>
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
                            UPI: {inv.upiId}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5">
                          {selectedLanguage === 'hi' ? (inv.descriptionHi || inv.description) : inv.description}
                        </p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          Parent: {inv.parentName} ({inv.parentPhone}) • Due: {inv.dueDate}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">
                          ₹{inv.amountInr.toLocaleString('en-IN')}
                        </div>
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 bg-[#00A859]/20 text-[#008744] font-bold px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> PAID
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            DUE / PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-gray-500 font-mono">
                        Order: {inv.razorpayOrderId} • NPCI UPI / Razorpay Ready
                      </span>
                      <div className="flex items-center gap-2">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleTriggerFeeBroadcast(inv.id)}
                            className="bg-[#00A859] hover:bg-[#008744] text-white px-3 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Send UPI Link
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const receiptDoc = pdfDocuments.find((d) => d.type === 'FEE_RECEIPT') || pdfDocuments[1];
                            handleOpenPdf(receiptDoc);
                          }}
                          className="text-gray-600 hover:text-gray-900 font-medium text-[11px] border border-gray-200 px-2 py-1 rounded-lg"
                        >
                          View Receipt
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
                    Digital PDF Vault (Report Cards, UPI Receipts, Circulars)
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
                            {doc.titleMl || doc.titleHi || doc.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {selectedLanguage === 'ml' ? (doc.summaryMl || doc.summary) : selectedLanguage === 'hi' ? (doc.summaryHi || doc.summary) : doc.summary}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                            <span>Date: {doc.publishedDate}</span>
                            <span>•</span>
                            <span>Size: {(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span>Pages: {doc.pagesCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenPdf(doc)}
                          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>View PDF</span>
                        </button>
                        <button
                          onClick={() => handleTriggerPdfDelivery(doc.id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: META CLOUD API & RAZORPAY / UPI CONFIG */}
          {activeTab === 'CONFIG' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Razorpay, NPCI UPI &amp; Meta WhatsApp Cloud Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Indian Payment Gateway Settings, Webhook URLs, and UPI Merchant Credentials
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">School Merchant UPI VPA</span>
                  <p className="font-mono font-bold text-gray-900 text-base">kryptonfees@icici</p>
                  <span className="text-[10px] text-[#00A859] font-bold">Razorpay &amp; NPCI UPI Enabled</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">Payment Webhook Callback URL</span>
                  <p className="font-mono text-gray-800 truncate">https://api.kryptonschool.edu.in/api/v1/payments-gateway/webhook</p>
                  <span className="text-[10px] text-[#00A859] font-bold">Instant ERP Ledger Reconcile</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">WhatsApp Business Account (WABA ID)</span>
                  <p className="font-mono font-bold text-gray-900">{config.wabaId}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Meta Verified for India (+91)</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500">Official Sender Number</span>
                  <p className="font-mono font-bold text-gray-900">+91 98470 00111</p>
                  <span className="text-[10px] text-gray-600">WhatsApp Business Line Registered</span>
                </div>
              </div>

              {/* Schedules */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" /> Automated Schedules (IST Asia/Kolkata)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[11px] text-emerald-800 font-medium">Absence Alerts</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">08:30 AM IST Daily</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[11px] text-emerald-800 font-medium">UPI Fee Reminders</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">3 Days Before Due Date</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[11px] text-emerald-800 font-medium">PDF Report Cards</span>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">Instant on Sign-off</p>
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
                Live WhatsApp &amp; UPI Simulator
              </span>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              🇮🇳 India Cloud API
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
            💡 Click <strong>&quot;Pay via UPI / Razorpay&quot;</strong> inside the simulator to test the instant <strong>NPCI UPI PIN prompt</strong> and auto-delivered PDF receipt.
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
