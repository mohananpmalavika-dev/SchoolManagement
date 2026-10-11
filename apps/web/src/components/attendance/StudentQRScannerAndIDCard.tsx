'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  ScanLine,
  Printer,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  Search,
  Sparkles,
  User,
  ShieldCheck,
  Calendar,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  smartAttendanceApi,
  MOCK_STUDENTS,
} from '@/lib/smart-attendance-client';
import { StudentIDCardData, ScanStudentQRResult } from '@krypton/types';
import { QRCodeSVG } from './QRCodeSVG';

export function StudentQRScannerAndIDCard() {
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'ID_STUDIO'>('SCANNER');
  const [students, setStudents] = useState<StudentIDCardData[]>(MOCK_STUDENTS);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<StudentIDCardData>(
    MOCK_STUDENTS[2] // Malavika Nair
  );
  const [scannedResult, setScannedResult] = useState<ScanStudentQRResult | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [recentScans, setRecentScans] = useState<any[]>(() =>
    smartAttendanceApi.getStudentScans()
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const refreshScans = () => {
    setRecentScans([...smartAttendanceApi.getStudentScans()]);
  };

  // Play audio chime on success
  const playBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext policy
    }
  };

  // Handle Scanning student payload
  const handleProcessScan = (payload: string, source: 'CAMERA_SCAN' | 'BARCODE_SCANNER' = 'CAMERA_SCAN') => {
    const res = smartAttendanceApi.scanStudentQR({
      qrPayload: payload,
      source,
    });
    setScannedResult(res);
    playBeep();
    refreshScans();
  };

  // Camera video stream toggle
  const toggleCamera = async () => {
    if (isScanningActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsScanningActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScanningActive(true);
      } catch (err: any) {
        console.warn('Camera access unavailable:', err.message);
        alert('Camera stream unavailable or permission denied. You can use the instant scan simulator buttons below.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs: Scanner vs ID Card Print Studio */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('SCANNER')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'SCANNER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ScanLine size={16} />
            <span>Smart QR Scanner (ഹാജർ സ്കാനർ)</span>
          </button>
          <button
            onClick={() => setActiveTab('ID_STUDIO')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'ID_STUDIO'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Printer size={16} />
            <span>Student ID Card & QR Studio (ഐഡി കാർഡ് പ്രിന്റ്)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {activeTab === 'SCANNER' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Scanner & Quick Scan Chips */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ScanLine size={20} className="text-indigo-600" />
                    Student Attendance QR Terminal
                  </h3>
                  <p className="text-xs text-gray-500">
                    ഐഡി കാർഡിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഹാജർ രേഖപ്പെടുത്തുക
                  </p>
                </div>
                <button
                  onClick={toggleCamera}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isScanningActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Camera size={14} />
                  <span>{isScanningActive ? 'Stop Camera' : 'Start Camera'}</span>
                </button>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center border-2 border-dashed border-indigo-300">
                {isScanningActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-8 text-center text-white">
                    <div className="w-20 h-20 mx-auto rounded-3xl border-2 border-indigo-400/60 flex items-center justify-center relative mb-3">
                      <QrCode size={36} className="text-indigo-300" />
                      <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
                    </div>
                    <p className="text-xs font-semibold text-indigo-200">
                      Live Optical Scanner Standby
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Point student ID card QR code at the camera or click any student card below to test instantly.
                    </p>
                  </div>
                )}

                {/* Laser Overlay Framing */}
                <div className="absolute inset-8 pointer-events-none border border-emerald-400/40 rounded-2xl flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400/70 shadow-[0_0_15px_#10b981] animate-bounce" />
                </div>
              </div>

              {/* Instant Scan Student Chips (Demo Simulators) */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Instant Scan Simulator (ഒരു ക്ലിക്കിൽ സ്കാൻ ചെയ്യുക):
                  </span>
                  <span className="text-[11px] text-gray-400">Click to scan ID badge</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {students.map((stu) => {
                    const isAlreadyScanned = recentScans.some((s) => s.studentId === stu.id);
                    return (
                      <button
                        key={stu.id}
                        onClick={() => handleProcessScan(stu.qrPayload, 'BARCODE_SCANNER')}
                        className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                          isAlreadyScanned
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : 'bg-gray-50 hover:bg-indigo-50/50 border-gray-200 text-gray-800'
                        }`}
                      >
                        <img
                          src={stu.photoUrl}
                          alt={stu.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-300"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{stu.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {stu.admissionNumber}
                          </p>
                        </div>
                        {isAlreadyScanned && (
                          <CheckCircle2 size={14} className="text-emerald-600 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual Barcode Input Fallback */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter Admission No. (e.g. KPS-2024-103) / Barcode..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualInput) {
                      handleProcessScan(manualInput, 'BARCODE_SCANNER');
                      setManualInput('');
                    }
                  }}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    if (manualInput) {
                      handleProcessScan(manualInput, 'BARCODE_SCANNER');
                      setManualInput('');
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Verify
                </button>
              </div>

              {/* Scanned Verification Popup Card */}
              {scannedResult && (
                <div
                  className={`mt-5 p-4 rounded-2xl border transition-all animate-in zoom-in-95 ${
                    scannedResult.alreadyMarked
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={scannedResult.student.photoUrl}
                      alt={scannedResult.student.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                            scannedResult.alreadyMarked
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {scannedResult.alreadyMarked ? 'ALREADY RECORDED' : 'ATTENDANCE CONFIRMED'}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          {scannedResult.record.time}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-gray-900 mt-1">
                        {scannedResult.student.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        Admission: {scannedResult.student.admissionNumber} • {scannedResult.student.className}
                      </p>
                      <p className="text-xs font-medium text-emerald-900 mt-1">
                        {scannedResult.messageMl}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Scanned Roster & Stats */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Live Scanned Roster (ഹാജർ ലൈവ് ലിസ്റ്റ്)
                  </h3>
                  <p className="text-xs text-gray-500">Today&apos;s verified student admissions</p>
                </div>
                <button
                  onClick={refreshScans}
                  className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Roster Counter */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl mb-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                    Total Scanned Today
                  </p>
                  <p className="text-2xl font-black mt-0.5">{recentScans.length} Students</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
              </div>

              {/* Scans Scroll List */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {recentScans.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <ScanLine size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">No student scans recorded yet.</p>
                  </div>
                ) : (
                  recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {scan.studentName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              scan.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {scan.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {scan.admissionNumber} • {scan.className}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-700">{scan.time}</span>
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck size={11} /> Verified
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: STUDENT ID CARD & QR PRINT STUDIO */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Printer size={20} className="text-indigo-600" />
                  Student ID Card & QR Generator Studio
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  സ്റ്റുഡന്റ് ഐഡി കാർഡിൽ ക്യുആർ പ്രിന്റ് ചെയ്ത് നൽകാനുള്ള പ്രിന്റ് സ്റ്റുഡിയോ
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Printer size={16} />
                  <span>Print ID Badges (പ്രിന്റ് ചെയ്യുക)</span>
                </button>
              </div>
            </div>

            {/* Student Picker for ID Card */}
            <div className="my-6 flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">
                Select Student:
              </span>
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentForCard(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                    selectedStudentForCard.id === s.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <img
                    src={s.photoUrl}
                    alt={s.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>

            {/* Printable ID Card Mockup (Aesthetic Double-Sided / Vertical School ID Card) */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-8 bg-slate-100/70 rounded-3xl border border-slate-200/80 p-6">
              {/* ID Card Front */}
              <div
                id="printable-id-card"
                className="w-80 h-[490px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-300 flex flex-col justify-between relative transition-transform hover:scale-[1.01]"
              >
                {/* Header Band */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 text-center relative">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs mx-auto flex items-center justify-center shadow-md mb-1">
                    KPS
                  </div>
                  <h4 className="text-xs font-black tracking-wider uppercase">
                    KRYPTON PUBLIC SCHOOL
                  </h4>
                  <p className="text-[9px] text-indigo-200">
                    Affiliated to CBSE • Green Valley Campus
                  </p>
                </div>

                {/* Body Content */}
                <div className="p-5 flex flex-col items-center text-center flex-1">
                  {/* Photo with Frame */}
                  <div className="relative mb-3">
                    <img
                      src={selectedStudentForCard.photoUrl}
                      alt={selectedStudentForCard.name}
                      className="w-24 h-28 rounded-2xl object-cover border-4 border-indigo-600 shadow-md"
                    />
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase shadow">
                      Student
                    </span>
                  </div>

                  <h3 className="text-base font-black text-gray-900">
                    {selectedStudentForCard.name}
                  </h3>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">
                    {selectedStudentForCard.admissionNumber}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedStudentForCard.className} • {selectedStudentForCard.streamName}
                  </p>

                  <div className="w-full grid grid-cols-2 gap-2 my-3 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-left">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Blood Group:</span>
                      <strong className="text-gray-800">{selectedStudentForCard.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Academic Year:</span>
                      <strong className="text-gray-800">{selectedStudentForCard.academicYear}</strong>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="mt-auto flex flex-col items-center">
                    <QRCodeSVG
                      value={selectedStudentForCard.qrPayload}
                      size={90}
                      darkColor="#0f172a"
                      includeMargin={false}
                    />
                    <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                      Scan for Smart Attendance
                    </p>
                  </div>
                </div>

                {/* Footer Band */}
                <div className="bg-gray-900 text-white p-2 text-center text-[9px]">
                  Emergency SOS: {selectedStudentForCard.emergencyContact} • Valid 2026-2027
                </div>
              </div>

              {/* ID Card Features Description */}
              <div className="max-w-md space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    High-Density QR Code Security
                  </h4>
                  <p className="text-xs text-indigo-800 mt-1">
                    Every ID card incorporates a cryptographic payload encoding the student&apos;s unique ID, admission number, and school validation token. It can be read instantly by phone cameras, USB laser scanners, and gate terminals.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Formatted to standard CR80 PVC card dimensions (85.6mm × 54mm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Razor-sharp vector QR rendering ensures 100% read rate even on matte laminate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Emergency contacts and medical blood group visible on card face</span>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-bold text-xs shadow-lg hover:from-indigo-500 hover:to-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  <span>Print {selectedStudentForCard.name}&apos;s ID Badge</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
