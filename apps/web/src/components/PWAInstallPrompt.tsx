'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { useLanguageContext } from '@/contexts/LanguageContext';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  X,
  Zap,
  BellRing,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

const SNOOZE_HOURS = 24;

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, isIOS, showInstallPrompt } = usePWA();
  const { language } = useLanguageContext();

  const [isOpen, setIsOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(true);

  // Check dismissal state and auto-open timer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissedUntil = localStorage.getItem('krypton-pwa-dismissed-until');
    const isSnoozed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);
    setHasDismissed(!!isSnoozed);

    // Auto open after 3 seconds on mobile if not installed and not snoozed
    if (canInstall && !isInstalled && !isSnoozed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  // Listen for global trigger (e.g. from Parent Dashboard "Install App" button)
  useEffect(() => {
    const handleManualOpen = () => {
      setShowIOSGuide(false);
      setIsOpen(true);
    };

    window.addEventListener('open-pwa-install', handleManualOpen);
    return () => window.removeEventListener('open-pwa-install', handleManualOpen);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    try {
      const result = await showInstallPrompt();
      if (result === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      } else if (result === 'manual-ios') {
        setShowIOSGuide(true);
      }
    } catch (e) {
      console.error('Failed to trigger PWA install:', e);
    }
  }, [isIOS, showInstallPrompt]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setShowIOSGuide(false);
    const snoozeTime = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
    localStorage.setItem('krypton-pwa-dismissed-until', snoozeTime.toString());
    setHasDismissed(true);
  }, []);

  // Text content adapted to Malayalam, Hindi, and English
  const content = {
    ml: {
      badge: 'ഔദ്യോഗിക സ്കൂൾ ആപ്പ്',
      title: 'സ്കൂൾ ആപ്പ് ഫോണിൽ ഇൻസ്റ്റാൾ ചെയ്യാം',
      subtitle: 'പ്ലേസ്റ്റോറിൽ തിരയാതെ ഒറ്റ ക്ലിക്കിൽ നിങ്ങളുടെ ഫോണിൽ ആപ്പ് ആയി സേവ് ചെയ്യാം. വേഗത്തിൽ ഫീസടയ്ക്കാനും ലൈവ് സ്കൂൾ അപ്‌ഡേറ്റുകൾ ലഭിക്കാനും സഹായിക്കുന്നു.',
      feature1: 'ഒറ്റ ക്ലിക്കിൽ ഇൻസ്റ്റാൾ',
      feature1Desc: 'ഫോൺ ഹോം സ്ക്രീനിൽ ഡയറക്റ്റ് ഐക്കൺ',
      feature2: 'തത്സമയ അറിയിപ്പുകൾ',
      feature2Desc: 'ഫീസ്, അറ്റൻഡൻസ്, ബസ് ട്രാക്കിംഗ്',
      feature3: 'സ്റ്റോറേജ് ലാഭിക്കാം (< 2MB)',
      feature3Desc: 'ഫോൺ മെമ്മറി ഒട്ടും നഷ്ടപ്പെടില്ല',
      ctaInstall: '📲 സ്കൂൾ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക',
      ctaLater: 'പിന്നീട് ചെയ്യാം',
      floatingBtn: '📲 സ്കൂൾ ആപ്പ്',
      successTitle: 'ആപ്പ് വിജയകരമായി ഇൻസ്റ്റാൾ ചെയ്തു!',
      successDesc: 'നിങ്ങളുടെ ഫോണിന്റെ ആപ്പുകൾക്കിടയിൽ "School App" എന്ന പേരിൽ ഐക്കൺ ലഭ്യമാണ്.',
      iosHeading: 'iPhone / iPad-ൽ എങ്ങനെ സേവ് ചെയ്യാം?',
      iosStep1: 'താഴെയുള്ള "Share" ബട്ടൺ അമർത്തുക',
      iosStep2: 'ലിസ്റ്റിൽ നിന്ന് "Add to Home Screen" (+) തിരഞ്ഞെടുക്കുക',
      iosStep3: 'മുകളിൽ വലതുഭാഗത്തുള്ള "Add" ക്ലിക്ക് ചെയ്യുക',
      iosDone: 'മനസ്സിലായി',
    },
    hi: {
      badge: 'आधिकारिक स्कूल ऐप',
      title: 'स्कूल ऐप फोन में इंस्टॉल करें',
      subtitle: 'प्लेस्टोर पर जाए बिना सिर्फ एक क्लिक में अपने फोन पर ऐप सेव करें। फीस भुगतान और लाइव स्कूल अपडेट के लिए सबसे आसान।',
      feature1: '1-क्लिक इंस्टॉलेशन',
      feature1Desc: 'फोन होम स्क्रीन पर डायरेक्ट आइकन',
      feature2: 'लाइव अपडेट्स',
      feature2Desc: 'फीस, उपस्थिति और बस ट्रैकिंग',
      feature3: 'अल्ट्रा-लाइटवेट (< 2MB)',
      feature3Desc: 'फोन की मेमोरी पर कोई असर नहीं',
      ctaInstall: '📲 स्कूल ऐप इंस्टॉल करें',
      ctaLater: 'बाद में',
      floatingBtn: '📲 स्कूल ऐप',
      successTitle: 'ऐप सफलतापूर्वक इंस्टॉल हो गया!',
      successDesc: 'अब अपने फोन की होम स्क्रीन पर "School App" देखें।',
      iosHeading: 'iPhone / iPad पर कैसे इंस्टॉल करें?',
      iosStep1: 'सफारी ब्राउज़र में नीचे "Share" बटन दबाएं',
      iosStep2: 'मेनू से "Add to Home Screen" (+) चुनें',
      iosStep3: 'ऊपर दाईं ओर "Add" पर टैप करें',
      iosDone: 'समझ गया',
    },
    en: {
      badge: 'Official School Portal',
      title: 'Install School App on Your Phone',
      subtitle: 'No App Store download required. Add directly to your phone screen with 1 click for instant notifications, bus tracking, and faster fee payments.',
      feature1: '1-Click Instant App',
      feature1Desc: 'Saves directly to your mobile app drawer',
      feature2: 'Real-time Updates',
      feature2Desc: 'Fees, attendance, and live bus alerts',
      feature3: 'Ultra Lightweight (< 2MB)',
      feature3Desc: 'Zero phone storage waste',
      ctaInstall: '📲 Install School App',
      ctaLater: 'Maybe Later',
      floatingBtn: '📲 Install School App',
      successTitle: 'App Successfully Installed!',
      successDesc: 'Check your home screen apps for "School App" anytime.',
      iosHeading: 'How to install on iPhone / iPad',
      iosStep1: 'Tap the Share icon at the bottom of Safari',
      iosStep2: 'Scroll down and tap "Add to Home Screen" (+)',
      iosStep3: 'Tap "Add" in the top-right corner',
      iosDone: 'Got It',
    },
  }[language] || {
    badge: 'Official School Portal',
    title: 'Install School App on Your Phone',
    subtitle: 'No App Store download required. Add directly to your phone screen with 1 click for instant notifications, bus tracking, and faster fee payments.',
    feature1: '1-Click Instant App',
    feature1Desc: 'Saves directly to your mobile app drawer',
    feature2: 'Real-time Updates',
    feature2Desc: 'Fees, attendance, and live bus alerts',
    feature3: 'Ultra Lightweight (< 2MB)',
    feature3Desc: 'Zero phone storage waste',
    ctaInstall: '📲 Install School App',
    ctaLater: 'Maybe Later',
    floatingBtn: '📲 Install School App',
    successTitle: 'App Successfully Installed!',
    successDesc: 'Check your home screen apps for "School App" anytime.',
    iosHeading: 'How to install on iPhone / iPad',
    iosStep1: 'Tap the Share icon at the bottom of Safari',
    iosStep2: 'Scroll down and tap "Add to Home Screen" (+)',
    iosStep3: 'Tap "Add" in the top-right corner',
    iosDone: 'Got It',
  };

  // If already installed as a standalone app, don't show prompt or floating button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating Re-Open Button when modal is closed but app is installable */}
      {!isOpen && canInstall && (
        <button
          onClick={() => {
            setShowIOSGuide(false);
            setIsOpen(true);
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-teal-300/40 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 group"
          aria-label={content.ctaInstall}
        >
          <Smartphone size={17} className="text-teal-200 group-hover:rotate-12 transition-transform" />
          <span>{content.floatingBtn}</span>
          <Download size={14} className="text-white/80" />
        </button>
      )}

      {/* Main Install Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click dismisses */}
          <div className="absolute inset-0" onClick={handleDismiss} />

          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 transition-all transform animate-in slide-in-from-bottom duration-300">
            {/* Top decorative header banner */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-5 pt-4 pb-4 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white/90 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center flex-shrink-0">
                  <img
                    src="/krypton-icon.png"
                    alt="School App Icon"
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-300/30 text-[11px] font-medium text-emerald-100">
                    <ShieldCheck size={12} className="text-emerald-300" />
                    <span>{content.badge}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                    Krypton School App
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6">
              {installedSuccess ? (
                /* Success screen */
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {content.successTitle}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                    {content.successDesc}
                  </p>
                </div>
              ) : showIOSGuide ? (
                /* iOS Specific Step-by-Step Instructions */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
                    <Smartphone size={20} />
                    <h4 className="font-bold text-base">{content.iosHeading}</h4>
                  </div>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex-1">
                        <span>{content.iosStep1}</span>
                        <div className="mt-1 flex items-center gap-1.5 text-blue-600 font-medium">
                          <Share size={15} />
                          <span className="text-[11px] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            Share Icon
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex-1">
                        <span>{content.iosStep2}</span>
                        <div className="mt-1 flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                          <PlusSquare size={15} />
                          <span className="text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                            Add to Home Screen
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex-1">
                        <span>{content.iosStep3}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{content.iosDone}</span>
                  </button>
                </div>
              ) : (
                /* Standard Prompt View (Android / Chrome / Edge / Desktop) */
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {content.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {content.subtitle}
                    </p>
                  </div>

                  {/* Benefit highlights */}
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50">
                      <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Zap size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {content.feature1}
                        </strong>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {content.feature1Desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <BellRing size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {content.feature2}
                        </strong>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {content.feature2Desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Sparkles size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {content.feature3}
                        </strong>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {content.feature3Desc}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-teal-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                      <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                      <span>{content.ctaInstall}</span>
                      <ArrowRight size={16} className="text-teal-200 ml-1" />
                    </button>

                    <button
                      onClick={handleDismiss}
                      className="w-full py-2.5 px-4 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors text-center"
                    >
                      {content.ctaLater}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
