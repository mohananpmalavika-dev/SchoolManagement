'use client';

import React, { useState } from 'react';
import {
  AdmissionApplication,
  AdmissionDocuments,
  CreateAdmissionInput,
} from '@krypton/types';
import { admissionsClient } from '@/lib/admissions-client';

const GRADE_OPTIONS = [
  'Pre-KG / Play School',
  'Kindergarten (LKG & UKG)',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 - Science (PCMC)',
  'Grade 11 - Science (PCMB)',
  'Grade 11 - Commerce & Finance',
  'Grade 11 - Humanities & Arts',
  'Grade 12',
];

const BLOOD_GROUPS = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];

export function OnlineAdmissionPortal() {
  const [activeTab, setActiveTab] = useState<'APPLY' | 'TRACK'>('APPLY');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Student
    firstName: '',
    lastName: '',
    fullNameMl: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '',
    applyingForGrade: 'Grade 1',
    bloodGroup: 'B+ve',
    previousSchool: '',
    nationality: 'Indian',
    religion: 'Hindu',
    casteCategory: 'General',
    medicalNotes: '',

    // Parent
    fatherName: '',
    motherName: '',
    guardianName: '',
    email: '',
    phone: '',
    whatsappPhone: '',
    occupation: '',
    address: '',
    city: 'Kochi',
    pincode: '682030',

    // Preferences
    transportRequired: true,
    hostelRequired: false,
    siblingEnrolled: false,
    siblingDetails: '',
    leadSource: 'WEBSITE_PORTAL' as any,
    notes: '',
  });

  // Document Uploads State
  const [documents, setDocuments] = useState<AdmissionDocuments>({
    birthCertificateUrl: '',
    birthCertificateFileName: '',
    studentPhotoUrl: '',
    studentPhotoFileName: '',
    previousMarksheetUrl: '',
    previousMarksheetFileName: '',
  });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedApp, setTrackedApp] = useState<AdmissionApplication | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Age calculation helper
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      years--;
    }
    return `${years} Years`;
  };

  // Mock document upload handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setDocuments((prev) => ({
          ...prev,
          studentPhotoUrl: uploadEvent.target?.result as string,
          studentPhotoFileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBirthCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setDocuments((prev) => ({
          ...prev,
          birthCertificateUrl: uploadEvent.target?.result as string,
          birthCertificateFileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarksheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setDocuments((prev) => ({
          ...prev,
          previousMarksheetUrl: uploadEvent.target?.result as string,
          previousMarksheetFileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required / പേര് നൽകുക';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required / ജനനതീയതി നൽകുക';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!formData.fatherName.trim() && !formData.motherName.trim()) {
      errors.fatherName = 'Father or Mother name is required';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.whatsappPhone.trim()) errors.whatsappPhone = 'WhatsApp number is required for instant updates';
    if (!formData.address.trim()) errors.address = 'Residential address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (!documents.studentPhotoUrl) {
      errors.photo = 'Student passport photo is required / കുട്ടിയുടെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക';
    }
    if (!documents.birthCertificateUrl) {
      errors.birthCert = 'Birth certificate is required / ജനന സർട്ടിഫിക്കറ്റ് അപ്‌ലോഡ് ചെയ്യുക';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      alert('Please accept the parent declaration before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const payload: CreateAdmissionInput = {
        student: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          fullName,
          fullNameMl: formData.fullNameMl.trim() || undefined,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          applyingForGrade: formData.applyingForGrade,
          bloodGroup: formData.bloodGroup,
          previousSchool: formData.previousSchool.trim() || undefined,
          nationality: formData.nationality,
          religion: formData.religion || undefined,
          casteCategory: formData.casteCategory || undefined,
          medicalNotes: formData.medicalNotes.trim() || undefined,
        },
        parent: {
          fatherName: formData.fatherName.trim(),
          motherName: formData.motherName.trim(),
          guardianName: formData.guardianName.trim() || undefined,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          whatsappPhone: formData.whatsappPhone.trim(),
          occupation: formData.occupation.trim() || undefined,
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
        },
        documents,
        transportRequired: formData.transportRequired,
        hostelRequired: formData.hostelRequired,
        siblingEnrolled: formData.siblingEnrolled,
        siblingDetails: formData.siblingDetails.trim() || undefined,
        leadSource: 'WEBSITE_PORTAL',
        priority: 'MEDIUM',
        notes: formData.notes.trim() || undefined,
      };

      const result = admissionsClient.createApplication(payload);
      setSubmittedApp(result);
    } catch (err) {
      console.error(err);
      alert('Error saving application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    const found = admissionsClient.getApplicationById(trackQuery.trim());
    if (found) {
      setTrackedApp(found);
    } else {
      // search by phone or name
      const results = admissionsClient.getApplications({ search: trackQuery.trim() });
      setTrackedApp(results[0] || null);
    }
    setTrackSearched(true);
  };

  const resetForm = () => {
    setSubmittedApp(null);
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      fullNameMl: '',
      gender: 'Male',
      dateOfBirth: '',
      applyingForGrade: 'Grade 1',
      bloodGroup: 'B+ve',
      previousSchool: '',
      nationality: 'Indian',
      religion: 'Hindu',
      casteCategory: 'General',
      medicalNotes: '',
      fatherName: '',
      motherName: '',
      guardianName: '',
      email: '',
      phone: '',
      whatsappPhone: '',
      occupation: '',
      address: '',
      city: 'Kochi',
      pincode: '682030',
      transportRequired: true,
      hostelRequired: false,
      siblingEnrolled: false,
      siblingDetails: '',
      leadSource: 'WEBSITE_PORTAL',
      notes: '',
    });
    setDocuments({
      birthCertificateUrl: '',
      birthCertificateFileName: '',
      studentPhotoUrl: '',
      studentPhotoFileName: '',
      previousMarksheetUrl: '',
      previousMarksheetFileName: '',
    });
    setConsentChecked(false);
  };

  return (
    <div className="min-w-full bg-slate-50 min-h-screen text-slate-800">
      {/* Hero Banner with School Identity */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-3 shadow-inner">
                <svg className="w-10 h-10 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                </svg>
              </div>
              <div>
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-medium mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Admissions Open 2026-2027 • അഡ്മിഷൻ ആരംഭിച്ചു</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Krypton International Public School
                </h1>
                <p className="text-indigo-200 text-sm mt-0.5 font-medium">
                  ക്രിപ്റ്റൺ ഇന്റർനാഷണൽ പബ്ലിക് സ്കൂൾ • Affiliated to CBSE New Delhi
                </p>
              </div>
            </div>

            {/* Navigation Switcher */}
            <div className="flex items-center bg-indigo-950/60 p-1.5 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setActiveTab('APPLY')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
                  activeTab === 'APPLY'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>New Online Application (പുതിയ അപേക്ഷ)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TRACK')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${
                  activeTab === 'TRACK'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Track Status (അപേക്ഷ പരിശോധിക്കുക)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ======================================================== */}
        {/* TAB 1: NEW APPLICATION FORM                             */}
        {/* ======================================================== */}
        {activeTab === 'APPLY' && (
          <div>
            {submittedApp ? (
              /* Success Confirmation Card */
              <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden text-center p-8 sm:p-12 animate-fade-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md ring-8 ring-emerald-50">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-200">
                  Submission Successful • അപേക്ഷ ലഭിച്ചു
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  Online Admission Application Submitted!
                </h2>
                <p className="text-slate-600 max-w-xl mx-auto mt-2 text-sm sm:text-base">
                  Thank you! Your child&apos;s application has been registered with our Admissions Committee. You will receive an SMS and WhatsApp update shortly.
                </p>

                {/* Application Details Summary Slip */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-lg mx-auto my-6 text-left shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Application Reference No</span>
                    <span className="text-lg font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {submittedApp.applicationNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-500 block">Student Name:</span>
                      <strong className="text-slate-800">{submittedApp.student.fullName}</strong>
                      {submittedApp.student.fullNameMl && (
                        <div className="text-slate-600 font-medium">{submittedApp.student.fullNameMl}</div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Applied Grade:</span>
                      <strong className="text-slate-800">{submittedApp.student.applyingForGrade}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Parent / Guardian:</span>
                      <span className="text-slate-800">{submittedApp.parent.fatherName || submittedApp.parent.motherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">WhatsApp Phone:</span>
                      <span className="text-slate-800">{submittedApp.parent.whatsappPhone}</span>
                    </div>
                    <div className="col-span-2 bg-white p-2.5 rounded border border-slate-200 text-xs text-slate-600">
                      📎 <strong>Uploaded Documents:</strong> Birth Certificate & Passport Photo verified.
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <a
                    href={admissionsClient.generateWhatsAppUrl(submittedApp, 'INTERVIEW')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all text-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.588-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.173.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.102-.115.433-.505.549-.679.116-.173.231-.144.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
                    </svg>
                    <span>Send WhatsApp Confirmation (വാട്സ്ആപ്പ് സന്ദേശം)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Receipt / Acknowledgment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTrackQuery(submittedApp.applicationNumber);
                      setTrackedApp(submittedApp);
                      setTrackSearched(true);
                      setActiveTab('TRACK');
                    }}
                    className="inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-5 py-2.5 rounded-xl border border-indigo-200 transition-all text-sm"
                  >
                    <span>Live Tracking Timeline ➔</span>
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Submit another application / പുതിയ മറ്റൊരു അപേക്ഷ നൽകുക
                  </button>
                </div>
              </div>
            ) : (
              /* Multistep Form Card */
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
                {/* Stepper Header */}
                <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                        {currentStep}
                      </span>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {currentStep === 1 && 'Step 1: Student Information (വിദ്യാർത്ഥിയുടെ വിവരങ്ങൾ)'}
                          {currentStep === 2 && 'Step 2: Parent & Residential Details (രക്ഷിതാവിന്റെ വിവരങ്ങൾ)'}
                          {currentStep === 3 && 'Step 3: Document Uploads (ജനന സർട്ടിഫിക്കറ്റ് & ഫോട്ടോ)'}
                          {currentStep === 4 && 'Step 4: Preferences & Declaration (സ്ഥിരീകരണം)'}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {currentStep === 1 && 'Basic credentials, grade selection, and previous school background.'}
                          {currentStep === 2 && 'Parent contacts, residential address, and WhatsApp notification mobile.'}
                          {currentStep === 3 && 'Upload student passport photo & birth certificate for verification.'}
                          {currentStep === 4 && 'Transport bus requirement, sibling discount, and declaration.'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-400">
                      Step {currentStep} of 4
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                  {/* STEP 1: STUDENT INFORMATION */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            First Name (പേര്) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Aarav"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {formErrors.firstName && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Last Name / Surname <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Nair"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          {formErrors.lastName && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Full Name in Malayalam (മലയാളത്തിൽ പേര്)
                          </label>
                          <input
                            type="text"
                            placeholder="ഉദാ: ആരവ് നായർ"
                            value={formData.fullNameMl}
                            onChange={(e) => setFormData({ ...formData, fullNameMl: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Gender (ലിംഗം) <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Male', 'Female', 'Other'] as const).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: g })}
                                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                                  formData.gender === g
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Date of Birth (ജനനതീയതി) <span className="text-red-500">*</span>
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="date"
                              required
                              value={formData.dateOfBirth}
                              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {formData.dateOfBirth && (
                              <span className="self-center whitespace-nowrap bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-2 rounded-lg font-semibold">
                                {calculateAge(formData.dateOfBirth)}
                              </span>
                            )}
                          </div>
                          {formErrors.dateOfBirth && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Applying For Class / Grade <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.applyingForGrade}
                            onChange={(e) => setFormData({ ...formData, applyingForGrade: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white"
                          >
                            {GRADE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Blood Group (രക്തഗ്രൂപ്പ്)
                          </label>
                          <select
                            value={formData.bloodGroup}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                          >
                            {BLOOD_GROUPS.map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Previous School Name (മുൻപ് പഠിച്ച സ്കൂൾ)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Cochin Montessori / None"
                            value={formData.previousSchool}
                            onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (validateStep1()) setCurrentStep(2);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center space-x-2"
                        >
                          <span>Next: Parent Details (അടുത്തത്)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PARENT & RESIDENTIAL DETAILS */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Father&apos;s Full Name (പിതാവിന്റെ പേര്)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Rajesh Nair"
                            value={formData.fatherName}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Mother&apos;s Full Name (മാതാവിന്റെ പേര്)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Deepa Nair"
                            value={formData.motherName}
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Parent Contact Phone (ഫോൺ) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98471 22334"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          {formErrors.phone && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            WhatsApp Mobile Number (വാട്സ്ആപ്പ് നമ്പർ) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              placeholder="+91 98471 22334"
                              value={formData.whatsappPhone}
                              onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-medium flex items-center space-x-1">
                              <span>💬 Direct Updates</span>
                            </span>
                          </div>
                          {formErrors.whatsappPhone && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.whatsappPhone}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Email Address (ഇമെയിൽ)
                          </label>
                          <input
                            type="email"
                            placeholder="parent@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Parent Occupation / Profession (തൊഴിൽ)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Software Engineer / Govt Officer / Doctor"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Residential Address (മേൽവിലാസം) <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            required
                            placeholder="House / Flat name, Street, Landmark..."
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            City / District (നഗരം)
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Pincode (പിൻകോഡ്)
                          </label>
                          <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                        >
                          ← Back to Student Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (validateStep2()) setCurrentStep(3);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center space-x-2"
                        >
                          <span>Next: Upload Documents (ഡോക്യുമെന്റുകൾ)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: DOCUMENT UPLOADS */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs sm:text-sm text-amber-900">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <strong>Important Document Guidelines (പ്രധാന നിർദ്ദേശങ്ങൾ):</strong>
                          <p className="mt-0.5 text-amber-800">
                            Please upload a clear passport photo of the student and official birth certificate issued by the Registrar of Births. (Accepted formats: PNG, JPG, or PDF up to 5MB).
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Student Passport Photo */}
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-all bg-slate-50/50">
                          <label className="block text-sm font-bold text-slate-800 mb-1">
                            1. Student Passport Photo <span className="text-red-500">*</span>
                          </label>
                          <span className="text-xs text-slate-500 block mb-4">
                            കുട്ടിയുടെ പാസ്‌പോർട്ട് സൈസ് ഫോട്ടോ
                          </span>

                          {documents.studentPhotoUrl ? (
                            <div className="flex flex-col items-center">
                              <div className="w-28 h-32 rounded-xl overflow-hidden shadow-md border-2 border-white ring-2 ring-blue-500 mb-3 bg-white">
                                <img
                                  src={documents.studentPhotoUrl}
                                  alt="Student Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                ✓ {documents.studentPhotoFileName || 'Photo Uploaded'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDocuments((prev) => ({
                                    ...prev,
                                    studentPhotoUrl: '',
                                    studentPhotoFileName: '',
                                  }))
                                }
                                className="text-xs text-red-600 hover:text-red-700 mt-2 font-medium"
                              >
                                Change / Remove Photo
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <label className="cursor-pointer inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm">
                                <span>Browse & Upload Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                />
                              </label>
                              <p className="text-[11px] text-slate-400 mt-2">White background recommended</p>
                            </div>
                          )}
                          {formErrors.photo && (
                            <p className="text-red-500 text-xs mt-2">{formErrors.photo}</p>
                          )}
                        </div>

                        {/* 2. Birth Certificate */}
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-all bg-slate-50/50">
                          <label className="block text-sm font-bold text-slate-800 mb-1">
                            2. Birth Certificate (ജനന സർട്ടിഫിക്കറ്റ്) <span className="text-red-500">*</span>
                          </label>
                          <span className="text-xs text-slate-500 block mb-4">
                            Official Birth Certificate PDF or Scanned Photo
                          </span>

                          {documents.birthCertificateUrl ? (
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                ✓ {documents.birthCertificateFileName || 'Birth_Certificate.pdf'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDocuments((prev) => ({
                                    ...prev,
                                    birthCertificateUrl: '',
                                    birthCertificateFileName: '',
                                  }))
                                }
                                className="text-xs text-red-600 hover:text-red-700 mt-2 font-medium"
                              >
                                Replace File
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <label className="cursor-pointer inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm">
                                <span>Upload Birth Certificate (PDF/Image)</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={handleBirthCertUpload}
                                />
                              </label>
                              <p className="text-[11px] text-slate-400 mt-2">Municipal / Panchayat issued copy</p>
                            </div>
                          )}
                          {formErrors.birthCert && (
                            <p className="text-red-500 text-xs mt-2">{formErrors.birthCert}</p>
                          )}
                        </div>

                        {/* 3. Optional Previous Academic Records */}
                        <div className="md:col-span-2 border border-slate-200 rounded-xl p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <strong className="text-sm text-slate-800 block">
                              3. Previous Academic Records / Transfer Certificate (Optional)
                            </strong>
                            <span className="text-xs text-slate-500">
                              മുൻ ക്ലാസിലെ മാർക്ക് ലിസ്റ്റ് / TC (ബാധകമാണെങ്കിൽ മാത്രം)
                            </span>
                          </div>
                          <div>
                            {documents.previousMarksheetUrl ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-emerald-700 font-medium">
                                  ✓ {documents.previousMarksheetFileName || 'Uploaded'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDocuments((prev) => ({
                                      ...prev,
                                      previousMarksheetUrl: '',
                                      previousMarksheetFileName: '',
                                    }))
                                  }
                                  className="text-xs text-red-500"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 inline-block">
                                <span>+ Attach Academic File</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  onChange={handleMarksheetUpload}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                        >
                          ← Back to Parent Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (validateStep3()) setCurrentStep(4);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center space-x-2"
                        >
                          <span>Next: Preferences & Submit (അടുത്തത്)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: PREFERENCES & LEGAL DECLARATION */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Facility Preferences */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          School Amenities & Special Requirements (സൗകര്യങ്ങൾ)
                        </h3>

                        <div className="flex items-center justify-between py-2 border-b border-slate-200">
                          <div>
                            <span className="text-sm font-semibold text-slate-800 block">
                              School Bus Transportation Required (സ്കൂൾ ബസ് സൗകര്യം വേണമോ?)
                            </span>
                            <span className="text-xs text-slate-500">
                              Fleet equipped with real-time GPS tracking and CCTV.
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.transportRequired}
                              onChange={(e) => setFormData({ ...formData, transportRequired: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-200">
                          <div>
                            <span className="text-sm font-semibold text-slate-800 block">
                              Sibling Already Studying at Krypton (സഹോദരൻ/സഹോദരി ഇവിടെ പഠിക്കുന്നുണ്ടോ?)
                            </span>
                            <span className="text-xs text-slate-500">
                              Eligible for sibling concession on term tuition fees.
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.siblingEnrolled}
                              onChange={(e) => setFormData({ ...formData, siblingEnrolled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {formData.siblingEnrolled && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                              Sibling Name & Current Grade
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Adithya Varma (Grade 8)"
                              value={formData.siblingDetails}
                              onChange={(e) => setFormData({ ...formData, siblingDetails: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Any Additional Notes / Special Interests / Talents
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Fond of arts/music, allergy to peanuts, etc."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                      </div>

                      {/* Parent Legal Declaration */}
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentChecked}
                            onChange={(e) => setConsentChecked(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-1"
                          />
                          <span className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                            <strong>Parent / Guardian Declaration (രക്ഷിതാവിന്റെ സാക്ഷ്യപത്രം):</strong> I hereby declare that the information provided above is true and accurate to the best of my knowledge. I understand that admission is subject to seat availability, document verification, and performance in the student assessment/interview.
                          </span>
                        </label>
                      </div>

                      {/* Submit & Back */}
                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                        >
                          ← Back to Documents
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !consentChecked}
                          className={`font-semibold px-8 py-3 rounded-xl shadow-lg transition-all text-sm flex items-center space-x-2 ${
                            consentChecked && !isSubmitting
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isSubmitting ? (
                            <span>Submitting Application...</span>
                          ) : (
                            <>
                              <span>Submit Online Application (അപേക്ഷ സമർപ്പിക്കുക)</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: APPLICATION TRACKING LOOKUP                      */}
        {/* ======================================================== */}
        {activeTab === 'TRACK' && (
          <div className="space-y-8 animate-fade-in">
            {/* Search Box */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Track Admission Status (അഡ്മിഷൻ നില പരിശോധിക്കുക)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Enter your Application Reference Number (e.g. <code>APP-2026-0801</code>) or registered phone number.
              </p>

              <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter Application ID (e.g. APP-2026-0801 or Phone number)"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all text-sm whitespace-nowrap"
                >
                  Search Application
                </button>
              </form>

              {/* Sample quick buttons for demo */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Quick demo lookups:</span>
                {['APP-2026-0801', 'APP-2026-0803', 'APP-2026-0804', 'APP-2026-0805', 'APP-2026-0806'].map(
                  (code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setTrackQuery(code);
                        const found = admissionsClient.getApplicationById(code);
                        setTrackedApp(found || null);
                        setTrackSearched(true);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
                    >
                      {code}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tracking Result View */}
            {trackSearched && (
              <div>
                {trackedApp ? (
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                            Application No:
                          </span>
                          <span className="font-mono text-base font-bold bg-white/10 px-2.5 py-0.5 rounded text-white border border-white/20">
                            {trackedApp.applicationNumber}
                          </span>
                          <span className="text-xs text-indigo-200">
                            ({trackedApp.academicYear})
                          </span>
                        </div>
                        <h3 className="text-2xl font-extrabold mt-1">
                          {trackedApp.student.fullName}
                          {trackedApp.student.fullNameMl && (
                            <span className="text-lg font-normal text-indigo-200 ml-2">
                              ({trackedApp.student.fullNameMl})
                            </span>
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                          Applied Grade: <strong>{trackedApp.student.applyingForGrade}</strong> • Parent: {trackedApp.parent.fatherName || trackedApp.parent.motherName} ({trackedApp.parent.phone})
                        </p>
                      </div>

                      <div className="self-start sm:self-auto text-right">
                        <span className="text-xs text-indigo-200 uppercase tracking-wider block">Current Status</span>
                        <span className="inline-block mt-1 px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-bold text-xs shadow">
                          {trackedApp.stage.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Visual 5-Stage Pipeline Tracker */}
                    <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 text-center sm:text-left">
                        Admission Pipeline Progression (ഘട്ടങ്ങൾ)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
                        {[
                          {
                            key: 'INQUIRY_RECEIVED',
                            label: '1. Inquiry Received',
                            sub: 'അപേക്ഷ ലഭിച്ചു',
                            icon: '📥',
                          },
                          {
                            key: 'INTERVIEW_SCHEDULED',
                            label: '2. Interview Scheduled',
                            sub: 'അഭിമുഖം നിശ്ചയിച്ചു',
                            icon: '🗓️',
                          },
                          {
                            key: 'ACCEPTED',
                            label: '3. Seat Accepted',
                            sub: 'അംഗീകരിച്ചു',
                            icon: '🎯',
                          },
                          {
                            key: 'FEE_PAID',
                            label: '4. Fee Paid',
                            sub: 'ഫീസ് അടച്ചു',
                            icon: '💳',
                          },
                          {
                            key: 'ADMITTED',
                            label: '5. Officially Admitted',
                            sub: 'ഔദ്യോഗികമായി ചേർത്തു',
                            icon: '🎓',
                          },
                        ].map((step, idx) => {
                          const stagesOrder = [
                            'INQUIRY_RECEIVED',
                            'INTERVIEW_SCHEDULED',
                            'ACCEPTED',
                            'FEE_PAID',
                            'ADMITTED',
                          ];
                          const currentIndex = stagesOrder.indexOf(trackedApp.stage);
                          const isPassed = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;

                          return (
                            <div
                              key={step.key}
                              className={`p-4 rounded-xl border text-center transition-all ${
                                isCurrent
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100'
                                  : isPassed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-white text-slate-400 border-slate-200 opacity-60'
                              }`}
                            >
                              <div className="text-2xl mb-1">{step.icon}</div>
                              <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                                {step.label}
                              </div>
                              <div className={`text-[11px] mt-0.5 ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                                {step.sub}
                              </div>
                              {isPassed && !isCurrent && (
                                <span className="inline-block mt-2 text-[10px] bg-emerald-200 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  ✓ Cleared
                                </span>
                              )}
                              {isCurrent && (
                                <span className="inline-block mt-2 text-[10px] bg-white text-blue-700 font-bold px-1.5 py-0.5 rounded shadow-sm">
                                  ● Active Stage
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specific Stage Insight Card */}
                    <div className="p-6 sm:p-8 space-y-6">
                      {/* Interview details if exists */}
                      {trackedApp.interview && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm mb-2">
                            <span>🗓️</span>
                            <span>Interview & Assessment Details:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                            <div>
                              <span className="text-slate-500 block">Date & Time:</span>
                              <strong>{trackedApp.interview.scheduledDate} at {trackedApp.interview.scheduledTime}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Interviewer:</span>
                              <strong>{trackedApp.interview.interviewerName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Venue / Link:</span>
                              <strong>{trackedApp.interview.venueOrLink}</strong>
                            </div>
                          </div>
                          {trackedApp.interview.notes && (
                            <p className="text-xs text-indigo-800 mt-3 pt-2 border-t border-indigo-200">
                              <em>Notes:</em> {trackedApp.interview.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Payment details if exists */}
                      {trackedApp.payment && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm mb-2">
                            <span>💳</span>
                            <span>Admission Fee Payment Cleared:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                            <div>
                              <span className="text-slate-500 block">Amount Paid:</span>
                              <strong className="text-emerald-700 text-base">₹{trackedApp.payment.amount.toLocaleString('en-IN')}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Receipt Number:</span>
                              <strong>{trackedApp.payment.receiptNumber}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Payment Mode:</span>
                              <strong>{trackedApp.payment.paymentMethod} ({trackedApp.payment.transactionId})</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Official Enrollment if Admitted */}
                      {trackedApp.enrollment && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-purple-950">
                          <div className="flex items-center space-x-2 font-bold text-base mb-2">
                            <span>🎓</span>
                            <span>Official Student Enrollment Completed!</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                            <div>
                              <span className="text-purple-600 block">Official Admission No:</span>
                              <strong className="text-lg font-mono text-purple-900">{trackedApp.enrollment.officialAdmissionNumber}</strong>
                            </div>
                            <div>
                              <span className="text-purple-600 block">Class & Section:</span>
                              <strong>Class {trackedApp.enrollment.assignedClass} - Sec {trackedApp.enrollment.assignedSection}</strong>
                            </div>
                            <div>
                              <span className="text-purple-600 block">Roll Number:</span>
                              <strong>{trackedApp.enrollment.rollNumber}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Audit Timeline */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                          Application Activity Timeline (നാൾവഴി)
                        </h4>
                        <div className="space-y-3">
                          {trackedApp.timeline.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <strong className="text-slate-800">{item.title}</strong>
                                  <span className="text-slate-400">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-slate-600 mt-0.5">{item.description}</p>
                                <span className="text-[10px] text-slate-400">Updated by: {item.actor}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-12 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Application Found</h3>
                    <p className="text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                      Could not find an application matching &quot;{trackQuery}&quot;. Please verify your reference number or phone number.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
