'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Eye,
  Settings,
  ExternalLink,
  Globe,
  Server,
  Check,
  Copy,
  Radio,
  X,
} from 'lucide-react';
import {
  WhatsAppCloudMessage,
  WhatsAppAutomationConfig,
  WhatsAppAutomationStats,
  WhatsAppLanguage,
  WhatsAppGatewayProvider,
  WhatsAppWebLink,
} from '@krypton/types';
import {
  whatsAppClient,
  StudentParentContact,
  FeeInvoiceItem,
  SchoolPdfDocument,
} from '@/lib/whatsapp-client';
import { WhatsAppSmartphoneSimulator } from './WhatsAppSmartphoneSimulator';
import { WhatsAppDocumentViewerModal } from './WhatsAppDocumentViewerModal';

interface BatchWebQueueItem {
  id: string;
  title: string;
  subtitle: string;
  phone: string;
  link: WhatsAppWebLink;
  opened: boolean;
}

const PROVIDER_META: Record<
  WhatsAppGatewayProvider,
  {
    label: string;
    shortLabel: string;
    badge: string;
    costNote: string;
    description: string;
    accent: string;
  }
> = {
  META_CLOUD_API: {
    label: 'Meta WhatsApp Cloud API',
    shortLabel: 'Meta Cloud API',
    badge: 'Official Direct',
    costNote: 'Direct Meta per-conversation pricing',
    description:
      'Official Meta Graph API for real schools: automated server-side alerts, verified green-tick templates & interactive buttons.',
    accent: 'emerald',
  },
  GUPSHUP: {
    label: 'Gupshup WhatsApp API',
    shortLabel: 'Gupshup Enterprise',
    badge: 'India BSP',
    costNote: 'Popular Indian school messaging gateway',
    description:
      'Enterprise Indian WhatsApp Business Solution Provider with high delivery throughput and DLT/template management.',
    accent: 'violet',
  },
  TWILIO: {
    label: 'Twilio WhatsApp Gateway',
    shortLabel: 'Twilio API',
    badge: 'Global Cloud',
    costNote: 'Pay-as-you-go global messaging',
    description:
      'Global programmable WhatsApp gateway with sandbox testing, delivery callbacks, and multi-country support.',
    accent: 'sky',
  },
  WHATSAPP_WEB: {
    label: 'Play-School Zero-Cost Mode (WhatsApp Web)',
    shortLabel: 'WhatsApp Web (Free)',
    badge: '₹0 Free Mode',
    costNote: '100% Free — No API or Meta fees',
    description:
      'Ideal for small play-schools & preschools: opens instant pre-filled WhatsApp Web / App chat links (wa.me) with 1 click.',
    accent: 'amber',
  },
};

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

  // Backend gateway status
  const [backendStatus, setBackendStatus] = useState<{
    checked: boolean;
    reachable: boolean;
    liveGatewayConfigured: boolean;
    activeProvider: WhatsAppGatewayProvider;
    configuredProviders: WhatsAppGatewayProvider[];
    message?: string;
  }>({
    checked: false,
    reachable: false,
    liveGatewayConfigured: false,
    activeProvider: config.activeProvider,
    configuredProviders: ['WHATSAPP_WEB'],
  });

  // Play-School Batch WhatsApp Web Queue Modal
  const [batchWebQueue, setBatchWebQueue] = useState<BatchWebQueueItem[]>([]);
  const [batchQueueTitle, setBatchQueueTitle] = useState<string>('');

  // Live Provider Config Form State
  const [metaAccessToken, setMetaAccessToken] = useState(config.metaConfig?.accessToken || '');
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState(config.metaConfig?.phoneNumberId || config.phoneNumberId || '');
  const [metaWabaId, setMetaWabaId] = useState(config.metaConfig?.wabaId || config.wabaId || '');
  const [metaApiVersion, setMetaApiVersion] = useState(config.metaConfig?.apiVersion || 'v19.0');

  const [gupshupApiKey, setGupshupApiKey] = useState(config.gupshupConfig?.apiKey || '');
  const [gupshupAppName, setGupshupAppName] = useState(config.gupshupConfig?.appName || '');
  const [gupshupSourceNumber, setGupshupSourceNumber] = useState(config.gupshupConfig?.sourceNumber || '919847000111');

  const [twilioAccountSid, setTwilioAccountSid] = useState(config.twilioConfig?.accountSid || '');
  const [twilioAuthToken, setTwilioAuthToken] = useState(config.twilioConfig?.authToken || '');
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState(config.twilioConfig?.whatsappNumber || 'whatsapp:+14155238886');

  const [defaultCountryCode, setDefaultCountryCode] = useState(config.defaultCountryCode || '91');

  // Test Connection State
  const [testPhone, setTestPhone] = useState('+91 98470 34567');
  const [testMessage, setTestMessage] = useState(
    '✅ Krypton School ERP: Test message from Live WhatsApp Gateway!'
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    waLink?: WhatsAppWebLink;
  } | null>(null);

  const isFreeWebMode = config.activeProvider === 'WHATSAPP_WEB';

  const loadBackendStatus = async () => {
    const status = await whatsAppClient.fetchBackendGatewayStatus();
    setBackendStatus({ checked: true, ...status });
  };

  useEffect(() => {
    setConfig(whatsAppClient.getConfig());
    loadBackendStatus();
  }, []);

  const refreshAll = () => {
    setMessages(whatsAppClient.getMessages());
    setStudents(whatsAppClient.getStudents());
    setInvoices(whatsAppClient.getInvoices());
    setPdfDocuments(whatsAppClient.getPdfDocuments());
    setStats(whatsAppClient.getStats());
    setConfig(whatsAppClient.getConfig());
    loadBackendStatus();
  };

  const notifyUser = (msg: string) => {
    setBroadcastNotification(msg);
    setTimeout(() => setBroadcastNotification(null), 4500);
  };

  const handleSelectProvider = (provider: WhatsAppGatewayProvider) => {
    const updated = whatsAppClient.updateConfig({
      activeProvider: provider,
      freePlayschoolMode: provider === 'WHATSAPP_WEB',
    });
    setConfig(updated);
    setTestResult(null);
    notifyUser(
      provider === 'WHATSAPP_WEB'
        ? selectedLanguage === 'ml'
          ? '🎈 സൗജന്യ പ്ലേ-സ്കൂൾ വാട്ട്സ്ആപ്പ് വെബ് മോഡ് ആക്ടീവ് ആക്കി! (Zero API Cost)'
          : '🎈 Play-School Free WhatsApp Web Mode activated! Zero API fees.'
        : `⚡ Active WhatsApp Gateway switched to ${PROVIDER_META[provider].label}`
    );
  };

  const handleSaveProviderConfig = () => {
    const updated = whatsAppClient.updateConfig({
      defaultCountryCode,
      wabaId: metaWabaId || config.wabaId,
      phoneNumberId: metaPhoneNumberId || config.phoneNumberId,
      metaConfig: {
        wabaId: metaWabaId,
        phoneNumberId: metaPhoneNumberId,
        accessToken: metaAccessToken,
        apiVersion: metaApiVersion,
        webhookVerifyToken: config.metaConfig?.webhookVerifyToken || 'krypton_whatsapp_verify_token',
      },
      gupshupConfig: {
        apiKey: gupshupApiKey,
        appName: gupshupAppName,
        sourceNumber: gupshupSourceNumber,
      },
      twilioConfig: {
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
        whatsappNumber: twilioWhatsappNumber,
      },
    });
    setConfig(updated);
    notifyUser(
      selectedLanguage === 'ml'
        ? 'വാട്ട്സ്ആപ്പ് ഗേറ്റ്വേ സെറ്റിംഗ്സ് വിജയകരമായി സേവ് ചെയ്തു!'
        : `Saved ${PROVIDER_META[updated.activeProvider].shortLabel} configuration!`
    );
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    const res = await whatsAppClient.testProviderConnection({
      provider: config.activeProvider,
      testPhone: testPhone.trim() || undefined,
      testMessage: testMessage.trim() || undefined,
      metaAccessToken,
      metaPhoneNumberId,
      metaWabaId,
      metaApiVersion,
      gupshupApiKey,
      gupshupAppName,
      gupshupSourceNumber,
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsappNumber,
    });
    setIsTestingConnection(false);
    setTestResult({
      success: res.success,
      message: res.message,
      waLink: res.waLink,
    });
    if (res.waLink && config.activeProvider === 'WHATSAPP_WEB') {
      window.open(res.waLink.waMeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Direct Play-School WhatsApp Web Launcher
  const openDirectWhatsAppWeb = (link: WhatsAppWebLink, label: string) => {
    window.open(link.waMeUrl, '_blank', 'noopener,noreferrer');
    notifyUser(
      selectedLanguage === 'ml'
        ? `വാട്ട്സ്ആപ്പ് വെബ് തുറന്നു: ${label} (₹0 സൗജന്യ മോഡ്)`
        : `Opened WhatsApp Web chat for ${label} (Zero-Cost Mode)`
    );
  };

  const copyMessageToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notifyUser('Message copied to clipboard!');
    } catch {
      notifyUser('Unable to copy automatically.');
    }
  };

  // Feature 1 Handler: Trigger Morning Absentee Broadcast (Live Gateway OR Play-School WhatsApp Web)
  const handleTriggerAbsenteeBroadcast = async (studentId?: string) => {
    if (studentId) {
      const simMsg = whatsAppClient.sendAbsenteeAlert(studentId, selectedLanguage);
      refreshAll();

      if (isFreeWebMode) {
        const { student, link } = whatsAppClient.getAbsenteeWhatsAppWebLink(studentId, selectedLanguage);
        openDirectWhatsAppWeb(link, `${student.parentName} (${student.name})`);
        return;
      }

      // Attempt live dispatch through backend API if live provider is active
      if (backendStatus.liveGatewayConfigured) {
        const liveRes = await whatsAppClient.dispatchLiveMessage(simMsg.recipientPhone, simMsg.bodyText, {
          provider: config.activeProvider,
        });
        if (liveRes.success) {
          notifyUser(`✅ Live ${PROVIDER_META[config.activeProvider].shortLabel} alert sent to ${simMsg.parentName}!`);
          return;
        }
      }

      notifyUser(
        selectedLanguage === 'hi'
          ? 'अनुपस्थिति सूचना अभिभावक को WhatsApp पर भेजी गई!'
          : selectedLanguage === 'ml'
          ? 'ഹാജരില്ലാത്ത വിവരം രക്ഷിതാവിന് WhatsApp വഴി അയച്ചു!'
          : `Absence alert dispatched (${PROVIDER_META[config.activeProvider].shortLabel})!`
      );
    } else {
      const absents = students.filter((s) => s.isAbsentToday);
      absents.forEach((st) => {
        whatsAppClient.sendAbsenteeAlert(st.id, selectedLanguage);
      });
      refreshAll();

      if (isFreeWebMode) {
        const queue: BatchWebQueueItem[] = absents.map((st) => {
          const { link } = whatsAppClient.getAbsenteeWhatsAppWebLink(st.id, selectedLanguage);
          return {
            id: st.id,
            title: `${st.name} (${st.className})`,
            subtitle: `Parent: ${st.parentName}`,
            phone: link.phone,
            link,
            opened: false,
          };
        });
        setBatchQueueTitle(
          selectedLanguage === 'ml'
            ? `പ്ലേ-സ്കൂൾ സൗജന്യ വാട്ട്സ്ആപ്പ് വെബ് ക്യൂ (${queue.length} കുട്ടികൾ)`
            : `Play-School WhatsApp Web Queue (${queue.length} Absent Students)`
        );
        setBatchWebQueue(queue);
        return;
      }

      notifyUser(
        selectedLanguage === 'hi'
          ? `${absents.length} अनुपस्थित विद्यार्थियों के अभिभावकों को सूचना प्रसारित!`
          : selectedLanguage === 'ml'
          ? `${absents.length} ഹാജരില്ലാത്ത കുട്ടികളുടെ രക്ഷിതാക്കൾക്ക് സന്ദേശം അയച്ചു!`
          : `Broadcast dispatched to ${absents.length} absent students' parents via ${PROVIDER_META[config.activeProvider].shortLabel}!`
      );
    }
  };

  // Feature 2 Handler: Trigger 1-Click Fee Reminders (Live Gateway OR Play-School WhatsApp Web)
  const handleTriggerFeeBroadcast = async (invoiceId?: string) => {
    if (invoiceId) {
      const simMsg = whatsAppClient.sendFeeReminder(invoiceId, selectedLanguage);
      refreshAll();

      if (isFreeWebMode) {
        const { invoice, link } = whatsAppClient.getFeeReminderWhatsAppWebLink(invoiceId, selectedLanguage);
        openDirectWhatsAppWeb(link, `${invoice.parentName} (₹${invoice.amountInr.toLocaleString('en-IN')})`);
        return;
      }

      if (backendStatus.liveGatewayConfigured) {
        const liveRes = await whatsAppClient.dispatchLiveMessage(simMsg.recipientPhone, simMsg.bodyText, {
          provider: config.activeProvider,
        });
        if (liveRes.success) {
          notifyUser(`✅ Live ${PROVIDER_META[config.activeProvider].shortLabel} fee link sent to ${simMsg.parentName}!`);
          return;
        }
      }

      notifyUser(
        selectedLanguage === 'hi'
          ? '1-क्लिक UPI शुल्क भुगतान लिंक WhatsApp पर भेजा गया!'
          : selectedLanguage === 'ml'
          ? '1-ക്ലിക്ക് UPI ഫീസ് പേയ്‌മെന്റ് ലിങ്ക് WhatsApp വഴി അയച്ചു!'
          : `1-Click UPI / Razorpay fee link dispatched (${PROVIDER_META[config.activeProvider].shortLabel})!`
      );
    } else {
      const pendingInvoices = invoices.filter((i) => i.status !== 'PAID');
      pendingInvoices.forEach((inv) => {
        whatsAppClient.sendFeeReminder(inv.id, selectedLanguage);
      });
      refreshAll();

      if (isFreeWebMode) {
        const queue: BatchWebQueueItem[] = pendingInvoices.map((inv) => {
          const { link } = whatsAppClient.getFeeReminderWhatsAppWebLink(inv.id, selectedLanguage);
          return {
            id: inv.id,
            title: `${inv.studentName} • ₹${inv.amountInr.toLocaleString('en-IN')}`,
            subtitle: `Parent: ${inv.parentName} • Inv: ${inv.invoiceNumber}`,
            phone: link.phone,
            link,
            opened: false,
          };
        });
        setBatchQueueTitle(
          selectedLanguage === 'ml'
            ? `സൗജന്യ വാട്ട്സ്ആപ്പ് വെബ് ഫീസ് റിമൈൻഡർ ക്യൂ (${queue.length} ഇൻവോയ്സുകൾ)`
            : `Play-School Fee Reminder WhatsApp Web Queue (${queue.length} Pending Invoices)`
        );
        setBatchWebQueue(queue);
        return;
      }

      notifyUser(
        selectedLanguage === 'hi'
          ? `${pendingInvoices.length} लंबित शुल्क चालानों के UPI भुगतान लिंक भेजे गए!`
          : selectedLanguage === 'ml'
          ? `${pendingInvoices.length} ഫീസ് ഇൻവോയ്സ് UPI പേയ്‌മെന്റ് ലിങ്കുകൾ അയച്ചു!`
          : `${pendingInvoices.length} UPI fee reminders dispatched via ${PROVIDER_META[config.activeProvider].shortLabel}!`
      );
    }
  };

  // Feature 3 Handler: Trigger Digital PDF Delivery
  const handleTriggerPdfDelivery = (docId: string) => {
    whatsAppClient.sendPdfDelivery(docId, selectedLanguage);
    refreshAll();

    if (isFreeWebMode) {
      const { doc, link } = whatsAppClient.getPdfWhatsAppWebLink(docId, selectedLanguage);
      openDirectWhatsAppWeb(link, doc.title);
      return;
    }

    notifyUser(
      selectedLanguage === 'hi'
        ? 'सत्यापित डिजिटल PDF दस्तावेज़ WhatsApp पर भेजा गया!'
        : selectedLanguage === 'ml'
        ? 'ഡിജിറ്റൽ വെരിഫൈഡ് PDF ഡോക്യുമെന്റ് WhatsApp വഴി അയച്ചു!'
        : 'Digital verified PDF delivered directly via WhatsApp!'
    );
  };

  const handleOpenBatchQueueItem = (itemId: string) => {
    const target = batchWebQueue.find((q) => q.id === itemId);
    if (!target) return;
    window.open(target.link.waMeUrl, '_blank', 'noopener,noreferrer');
    setBatchWebQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, opened: true } : item))
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
                  {PROVIDER_META[config.activeProvider].label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-200">
                  <Server className="w-3.5 h-3.5" />
                  {backendStatus.liveGatewayConfigured
                    ? `Live Server Connected (${backendStatus.activeProvider})`
                    : 'Meta / Gupshup / Twilio + Free Web Mode'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  🇮🇳 India Schools &amp; Play-Schools
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Live WhatsApp Business Gateway &amp; Free Web Hub
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1 max-w-2xl">
                Connect live <strong>Meta Cloud API, Gupshup, or Twilio</strong> for automated school messaging — or switch to <strong>Zero-Cost Play-School WhatsApp Web Mode</strong> to open instant pre-filled chat links with zero API charges.
              </p>
            </div>

            {/* Language & Mode Quick Switch */}
            <div className="flex flex-col items-start lg:items-end gap-3">
              {/* Quick Mode Switcher: Live API vs Play-School Free Web Mode */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex items-center gap-1 border border-white/15 text-xs">
                <button
                  onClick={() =>
                    handleSelectProvider(
                      config.activeProvider === 'WHATSAPP_WEB' ? 'META_CLOUD_API' : config.activeProvider
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    !isFreeWebMode
                      ? 'bg-[#00A859] text-white shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Live Gateway API</span>
                </button>
                <button
                  onClick={() => handleSelectProvider('WHATSAPP_WEB')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    isFreeWebMode
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Play-School Free Web (₹0)</span>
                </button>
              </div>

              {/* Language & Refresh */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex items-center border border-white/15 text-xs">
                  <button
                    onClick={() => setSelectedLanguage('en')}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                      selectedLanguage === 'en'
                        ? 'bg-[#00A859] text-white shadow-sm'
                        : 'text-emerald-100 hover:text-white'
                    }`}
                  >
                    🇮🇳 EN
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('hi')}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                      selectedLanguage === 'hi'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-100 hover:text-white'
                    }`}
                  >
                    🇮🇳 हिन्दी
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('ml')}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                      selectedLanguage === 'ml'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-100 hover:text-white'
                    }`}
                  >
                    🌴 മലയാളം
                  </button>
                </div>

                <button
                  onClick={refreshAll}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/15"
                  title="Refresh Status & Analytics"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Mode Contextual Info Strip */}
          {isFreeWebMode ? (
            <div className="mt-5 p-3.5 rounded-2xl bg-amber-400/15 border border-amber-300/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="text-lg">🎈</span>
                <div>
                  <p className="font-bold text-amber-200">
                    {selectedLanguage === 'ml'
                      ? 'ചെറിയ പ്ലേ-സ്കൂളുകൾക്കുള്ള സൗജന്യ വാട്ട്സ്ആപ്പ് വെബ് മോഡ് (₹0 API ചെലവ്)'
                      : 'Zero-Cost Play-School Mode Active (WhatsApp Web / Mobile Click-to-Chat)'}
                  </p>
                  <p className="text-amber-100/90 mt-0.5">
                    {selectedLanguage === 'ml'
                      ? 'പ്രത്യേക API ചാർജുകളോ Meta അപ്രൂവലോ ഇല്ലാതെ, ഒരൊറ്റ ക്ലിക്കിൽ സാധാരണ വാട്ട്സ്ആപ്പ് വെബിൽ മെസേജ് റെഡിയായി തുറന്നു വരും!'
                      : 'No Meta Cloud API fees or monthly BSP charges. Clicking any Send button opens WhatsApp Web / App with the personalized message ready to hit Send.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('CONFIG')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
              >
                Switch to Live API →
              </button>
            </div>
          ) : (
            <div className="mt-5 p-3.5 rounded-2xl bg-emerald-400/10 border border-emerald-300/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#00E575] shrink-0" />
                <div>
                  <span className="font-bold text-emerald-100">
                    Active Live Provider: {PROVIDER_META[config.activeProvider].label}
                  </span>
                  <span className="mx-2 text-emerald-400">•</span>
                  <span className="text-emerald-200/90">
                    {backendStatus.liveGatewayConfigured
                      ? 'Server API keys detected — automated live delivery ready.'
                      : 'Configure your Meta Cloud API, Gupshup, or Twilio keys in Gateway Config to go live.'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('CONFIG')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors"
              >
                Configure Gateway
              </button>
            </div>
          )}

          {/* Quick Metrics Cards (Indian Rupees) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-white/15">
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
                <span>Active Gateway</span>
                <Globe className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-white mt-1 truncate">
                {PROVIDER_META[config.activeProvider].shortLabel}
              </div>
              <span className="text-[11px] text-teal-300/80">
                {PROVIDER_META[config.activeProvider].badge}
              </span>
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

      {/* Play-School Batch WhatsApp Web Queue Panel (when broadcasting in Zero-Cost Mode) */}
      {batchWebQueue.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-950">{batchQueueTitle}</h3>
                  <p className="text-xs text-amber-800">
                    Click each green button below to open the pre-filled message directly in WhatsApp Web / Mobile App ({batchWebQueue.filter((q) => q.opened).length}/{batchWebQueue.length} opened).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBatchWebQueue([])}
                className="p-1.5 rounded-lg hover:bg-amber-200/70 text-amber-900"
                title="Close queue"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {batchWebQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all ${
                    item.opened
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-white border-amber-200 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900">{item.title}</span>
                      {item.opened && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Opened
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-0.5">{item.subtitle}</p>
                    <p className="font-mono text-[11px] text-gray-500 mt-0.5">{item.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBatchQueueItem(item.id)}
                      className="flex-1 bg-[#25D366] hover:bg-[#1fb857] text-slate-950 font-bold text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {item.opened ? 'Open Again' : 'Open WhatsApp Web'}
                      </span>
                    </button>
                    <button
                      onClick={() => copyMessageToClipboard(item.link.previewText)}
                      className="p-2 rounded-lg border border-gray-200 bg-slate-50 hover:bg-slate-100 text-gray-600"
                      title="Copy pre-filled message"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <span>Automation</span>
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
              <span>Fees &amp; UPI</span>
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
              <span>PDFs</span>
            </button>
            <button
              onClick={() => setActiveTab('CONFIG')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'CONFIG'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Live Gateway &amp; Free Web</span>
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
                    <span className="font-semibold text-gray-800">Dispatch Mode:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      {isFreeWebMode
                        ? 'Play-School Zero-Cost WhatsApp Web Queue'
                        : `Automated via ${PROVIDER_META[config.activeProvider].shortLabel} (08:30 AM IST)`}
                    </span>
                  </div>
                  <p className="text-gray-500">
                    {isFreeWebMode
                      ? 'Clicking below builds an instant checklist of WhatsApp Web (wa.me) links for every absent child so teachers can send them for free in seconds.'
                      : 'Once the class teacher submits morning attendance, WhatsApp alerts with 1-tap quick-reply options are dispatched automatically through your live gateway.'}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>English, Malayalam &amp; Hindi templates built in</span>
                  </div>
                  <button
                    onClick={() => handleTriggerAbsenteeBroadcast()}
                    className={`flex items-center gap-2 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all ${
                      isFreeWebMode
                        ? 'bg-[#25D366] hover:bg-[#1fb857] text-slate-950'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isFreeWebMode ? <ExternalLink className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>
                      {isFreeWebMode ? 'Open WhatsApp Web Queue' : 'Send Absence Broadcast'}
                    </span>
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
                    Works in both Live Business API mode and Free Play-School WhatsApp Web mode — UPI payment links are automatically embedded in the message!
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Invoices automatically mark as &apos;PAID&apos; on webhook settlement</span>
                  </div>
                  <button
                    onClick={() => handleTriggerFeeBroadcast()}
                    className={`flex items-center gap-2 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all ${
                      isFreeWebMode
                        ? 'bg-[#25D366] hover:bg-[#1fb857] text-slate-950'
                        : 'bg-[#00A859] hover:bg-[#008744] text-white'
                    }`}
                  >
                    {isFreeWebMode ? <ExternalLink className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>
                      {isFreeWebMode ? 'Open Fee Reminders in WhatsApp Web' : 'Dispatch UPI / Razorpay Links'}
                    </span>
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
                          {selectedLanguage === 'ml'
                            ? doc.summaryMl || doc.summary
                            : selectedLanguage === 'hi'
                            ? doc.summaryHi || doc.summary
                            : doc.summary}
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
                          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-[10px] px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {isFreeWebMode && <ExternalLink className="w-2.5 h-2.5" />}
                          <span>{isFreeWebMode ? 'WhatsApp Web' : 'Send WhatsApp'}</span>
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Daily Absentee Directory (India Schools)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Send via Live Gateway API or open 1-click Free Play-School WhatsApp Web links (+91 format)
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerAbsenteeBroadcast()}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    isFreeWebMode
                      ? 'bg-[#25D366] hover:bg-[#1fb857] text-slate-950'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isFreeWebMode ? <ExternalLink className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isFreeWebMode ? 'Open Free Web Queue' : 'Notify All Parents'}</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          student.isAbsentToday
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {student.isAbsentToday ? (
                        <>
                          <span className="bg-red-50 text-red-700 font-bold px-2 py-1 rounded text-[11px] border border-red-200">
                            ABSENT ({student.absentReportedTime || '08:15 AM'})
                          </span>
                          {/* Always offer instant zero-cost WhatsApp Web link button */}
                          <button
                            onClick={() => {
                              const { link } = whatsAppClient.getAbsenteeWhatsAppWebLink(
                                student.id,
                                selectedLanguage
                              );
                              openDirectWhatsAppWeb(link, `${student.parentName} (${student.name})`);
                            }}
                            className="bg-[#25D366] hover:bg-[#1fb857] text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                            title="Open directly in WhatsApp Web / App (Zero API Cost)"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>WA Web</span>
                          </button>
                          {!isFreeWebMode && (
                            <button
                              onClick={() => handleTriggerAbsenteeBroadcast(student.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>API Alert</span>
                            </button>
                          )}
                        </>
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Fee Invoices &amp; 1-Click UPI / Razorpay Links
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Dispatch via Live Gateway API or open Free Play-School WhatsApp Web links with pre-filled UPI details
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerFeeBroadcast()}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    isFreeWebMode
                      ? 'bg-[#25D366] hover:bg-[#1fb857] text-slate-950'
                      : 'bg-[#00A859] hover:bg-[#008744] text-white'
                  }`}
                >
                  {isFreeWebMode ? <ExternalLink className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                  <span>{isFreeWebMode ? 'Open Free Fee Web Queue' : 'Send All UPI Fee Links'}</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-4 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                          {selectedLanguage === 'hi' ? inv.descriptionHi || inv.description : inv.description}
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

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-gray-500 font-mono">
                        Order: {inv.razorpayOrderId} • NPCI UPI Ready
                      </span>
                      <div className="flex items-center gap-2">
                        {inv.status !== 'PAID' && (
                          <>
                            <button
                              onClick={() => {
                                const { link } = whatsAppClient.getFeeReminderWhatsAppWebLink(
                                  inv.id,
                                  selectedLanguage
                                );
                                openDirectWhatsAppWeb(
                                  link,
                                  `${inv.parentName} (₹${inv.amountInr.toLocaleString('en-IN')})`
                                );
                              }}
                              className="bg-[#25D366] hover:bg-[#1fb857] text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Open fee reminder directly in WhatsApp Web (Free)"
                            >
                              <ExternalLink className="w-3 h-3" /> WA Web (Free)
                            </button>
                            {!isFreeWebMode && (
                              <button
                                onClick={() => handleTriggerFeeBroadcast(inv.id)}
                                className="bg-[#00A859] hover:bg-[#008744] text-white px-3 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" /> API Send
                              </button>
                            )}
                          </>
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
                    Official PDFs Dispatched Directly into WhatsApp Chat or Shared via Free WhatsApp Web Link
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {pdfDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
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
                            {selectedLanguage === 'ml'
                              ? doc.summaryMl || doc.summary
                              : selectedLanguage === 'hi'
                              ? doc.summaryHi || doc.summary
                              : doc.summary}
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

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenPdf(doc)}
                          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>View PDF</span>
                        </button>
                        <button
                          onClick={() => {
                            const { link } = whatsAppClient.getPdfWhatsAppWebLink(doc.id, selectedLanguage);
                            openDirectWhatsAppWeb(link, doc.title);
                          }}
                          className="bg-[#25D366] hover:bg-[#1fb857] text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>WA Web Link</span>
                        </button>
                        {!isFreeWebMode && (
                          <button
                            onClick={() => handleTriggerPdfDelivery(doc.id)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send API</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LIVE WHATSAPP GATEWAY & ZERO-COST PLAY-SCHOOL CONFIGURATION */}
          {activeTab === 'CONFIG' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Live WhatsApp Business Gateway &amp; Play-School Mode Setup
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose a live WhatsApp Business Provider (Meta Cloud API, Gupshup, or Twilio) for real schools, or select Zero-Cost WhatsApp Web mode for small play-schools.
                </p>
              </div>

              {/* 4 Provider Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['META_CLOUD_API', 'GUPSHUP', 'TWILIO', 'WHATSAPP_WEB'] as WhatsAppGatewayProvider[]).map(
                  (providerKey) => {
                    const meta = PROVIDER_META[providerKey];
                    const selected = config.activeProvider === providerKey;
                    const serverReady = backendStatus.configuredProviders.includes(providerKey);

                    return (
                      <button
                        key={providerKey}
                        type="button"
                        onClick={() => handleSelectProvider(providerKey)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all ${
                          selected
                            ? providerKey === 'WHATSAPP_WEB'
                              ? 'border-amber-400 bg-amber-50/70 shadow-sm'
                              : 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                            : 'border-gray-200 bg-slate-50/60 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-gray-900">{meta.shortLabel}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              providerKey === 'WHATSAPP_WEB'
                                ? 'bg-amber-200 text-amber-950'
                                : serverReady
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {providerKey === 'WHATSAPP_WEB'
                              ? '₹0 FREE'
                              : serverReady
                              ? 'SERVER LIVE'
                              : meta.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                          {meta.description}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-800 mt-2">
                          {meta.costNote}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Provider-Specific Credential Forms */}
              {config.activeProvider === 'META_CLOUD_API' && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Meta WhatsApp Cloud API Credentials (Official Graph API)
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-700">
                      graph.facebook.com/{metaApiVersion}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Phone Number ID (`META_WHATSAPP_PHONE_NUMBER_ID`)
                      </label>
                      <input
                        type="text"
                        value={metaPhoneNumberId}
                        onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                        placeholder="e.g. 104829104920192"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        WhatsApp Business Account ID (`META_WHATSAPP_WABA_ID`)
                      </label>
                      <input
                        type="text"
                        value={metaWabaId}
                        onChange={(e) => setMetaWabaId(e.target.value)}
                        placeholder="e.g. 109482716251423"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-gray-700 font-semibold mb-1">
                        Permanent System User Access Token (`META_WHATSAPP_ACCESS_TOKEN`)
                      </label>
                      <input
                        type="password"
                        value={metaAccessToken}
                        onChange={(e) => setMetaAccessToken(e.target.value)}
                        placeholder="EAAGm0PX4ZCpsBA..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Graph API Version
                      </label>
                      <input
                        type="text"
                        value={metaApiVersion}
                        onChange={(e) => setMetaApiVersion(e.target.value)}
                        placeholder="v19.0"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Webhook Callback URL (for Meta Developer Portal)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="https://api.kryptonschool.edu.in/api/v1/whatsapp/webhook"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-100 font-mono text-[11px] text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {config.activeProvider === 'GUPSHUP' && (
                <div className="p-4 bg-violet-50/60 rounded-2xl border border-violet-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-violet-950">
                      Gupshup Enterprise WhatsApp API (India)
                    </h3>
                    <span className="text-[11px] font-mono text-violet-700">api.gupshup.io/wa/api/v1/msg</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Gupshup App Name (`GUPSHUP_APP_NAME`)
                      </label>
                      <input
                        type="text"
                        value={gupshupAppName}
                        onChange={(e) => setGupshupAppName(e.target.value)}
                        placeholder="e.g. KryptonSchoolAlerts"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Registered Source Number (`GUPSHUP_SOURCE_NUMBER`)
                      </label>
                      <input
                        type="text"
                        value={gupshupSourceNumber}
                        onChange={(e) => setGupshupSourceNumber(e.target.value)}
                        placeholder="919847000111"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-gray-700 font-semibold mb-1">
                        Gupshup API Key (`GUPSHUP_API_KEY`)
                      </label>
                      <input
                        type="password"
                        value={gupshupApiKey}
                        onChange={(e) => setGupshupApiKey(e.target.value)}
                        placeholder="Enter Gupshup API Key..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {config.activeProvider === 'TWILIO' && (
                <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-sky-950">
                      Twilio Programmable WhatsApp Gateway
                    </h3>
                    <span className="text-[11px] font-mono text-sky-700">api.twilio.com</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Account SID (`TWILIO_ACCOUNT_SID`)
                      </label>
                      <input
                        type="text"
                        value={twilioAccountSid}
                        onChange={(e) => setTwilioAccountSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        WhatsApp Sender (`TWILIO_WHATSAPP_NUMBER`)
                      </label>
                      <input
                        type="text"
                        value={twilioWhatsappNumber}
                        onChange={(e) => setTwilioWhatsappNumber(e.target.value)}
                        placeholder="whatsapp:+14155238886"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-gray-700 font-semibold mb-1">
                        Auth Token (`TWILIO_AUTH_TOKEN`)
                      </label>
                      <input
                        type="password"
                        value={twilioAuthToken}
                        onChange={(e) => setTwilioAuthToken(e.target.value)}
                        placeholder="Enter Twilio Auth Token..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {config.activeProvider === 'WHATSAPP_WEB' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span>🎈</span> Zero-Cost Play-School Mode (Direct WhatsApp Web / wa.me)
                  </h3>
                  <p className="text-amber-900 leading-relaxed">
                    Perfect for small play-schools, preschools, and daycares. No Meta Business Verification, no API billing, and no monthly gateway fees! Whenever teachers click Send on Attendance Alerts or Fee Reminders, WhatsApp Web (desktop) or the WhatsApp App (mobile) opens directly with the parent&apos;s number and pre-typed Malayalam / English / Hindi message.
                  </p>
                  <div className="max-w-xs">
                    <label className="block text-amber-950 font-semibold mb-1">
                      Default Country Calling Code
                    </label>
                    <input
                      type="text"
                      value={defaultCountryCode}
                      onChange={(e) => setDefaultCountryCode(e.target.value)}
                      placeholder="91"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Save + Live Connection Test Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-gray-900">
                    Test Live Dispatch / Open Test WhatsApp Web Link
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveProviderConfig}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    Save Gateway Config
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-gray-600 font-medium mb-1">
                      Test Recipient Phone (+91...)
                    </label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+91 98470 34567"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 font-medium mb-1">
                      Test Message
                    </label>
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isTestingConnection}
                    onClick={handleTestConnection}
                    className="bg-[#00A859] hover:bg-[#008744] disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    {config.activeProvider === 'WHATSAPP_WEB' ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isTestingConnection
                        ? 'Testing...'
                        : config.activeProvider === 'WHATSAPP_WEB'
                        ? 'Open Instant WhatsApp Web Test'
                        : `Send Live Test via ${PROVIDER_META[config.activeProvider].shortLabel}`}
                    </span>
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Production env vars: <code className="bg-white px-1.5 py-0.5 rounded border">WHATSAPP_PROVIDER</code>
                  </span>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    <span className="font-medium">{testResult.message}</span>
                    {testResult.waLink && (
                      <a
                        href={testResult.waLink.waMeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-[#25D366] text-slate-950 font-bold px-2.5 py-1 rounded-lg"
                      >
                        <ExternalLink className="w-3 h-3" /> Open wa.me
                      </a>
                    )}
                  </div>
                )}
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
                Live WhatsApp &amp; UPI Preview
              </span>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              {PROVIDER_META[config.activeProvider].shortLabel}
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
            💡 Click <strong>&quot;Pay via UPI / Razorpay&quot;</strong> inside the preview to test the <strong>NPCI UPI PIN flow</strong>, or switch to <strong>Play-School Free Web (₹0)</strong> to open real WhatsApp Web links immediately.
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
