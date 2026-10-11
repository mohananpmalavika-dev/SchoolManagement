'use client';

import React, { useState } from 'react';
import { SchoolCertificateSettings } from '@krypton/types';
import { Settings, Save, X, School, UserCheck, Shield } from 'lucide-react';

interface CertificateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolCertificateSettings;
  onSave: (updated: SchoolCertificateSettings) => void;
}

export function CertificateSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: CertificateSettingsModalProps) {
  const [formData, setFormData] = useState<SchoolCertificateSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-blue-900 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-800 border border-indigo-700 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Certificate & Institution Settings</h3>
              <p className="text-xs text-indigo-200">
                സ്കൂൾ വിവരങ്ങളും പ്രിൻസിപ്പലിന്റെ ഡിജിറ്റൽ ഒപ്പും ക്രമീകരിക്കുക
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Institution Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-1">
              <School className="w-4 h-4 text-indigo-600" />
              <span>School Information (സ്കൂൾ വിവരങ്ങൾ)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  School Name (English)
                </label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  School Name (മലയാളം)
                </label>
                <input
                  type="text"
                  value={formData.schoolNameMl}
                  onChange={(e) => setFormData({ ...formData, schoolNameMl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Board Affiliation Line
                </label>
                <input
                  type="text"
                  value={formData.affiliationBoard}
                  onChange={(e) => setFormData({ ...formData, affiliationBoard: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Affiliation Number
                </label>
                <input
                  type="text"
                  value={formData.affiliationNumber}
                  onChange={(e) => setFormData({ ...formData, affiliationNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  School Code
                </label>
                <input
                  type="text"
                  value={formData.schoolCode}
                  onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Campus Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Principal & Digital Signature Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-1">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Principal & Digital Signature (പ്രിൻസിപ്പൽ & ഡിജിറ്റൽ സിഗ്നേച്ചർ)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Principal Full Name
                </label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Academic Degree / Qualifications
                </label>
                <input
                  type="text"
                  value={formData.principalDegree}
                  onChange={(e) => setFormData({ ...formData, principalDegree: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Designation / Title
                </label>
                <input
                  type="text"
                  value={formData.principalTitle}
                  onChange={(e) => setFormData({ ...formData, principalTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="text-xs text-emerald-900">
                    <span className="font-bold block">Cryptographic Digital Signature Enabled</span>
                    Signed using SHA-256 digital stamp with school official seal on every PDF generated.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-1">
              <span>Contact & Online Verification</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Office Phone Numbers
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save School Branding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
