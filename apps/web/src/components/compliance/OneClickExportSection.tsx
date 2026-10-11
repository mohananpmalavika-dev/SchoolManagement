'use client';

import React, { useState } from 'react';
import { BoardExportTemplate, ExportTemplateType } from '@krypton/types';
import { complianceClient } from '@/lib/compliance-engine-client';
import { ValidationIssuesModal } from './ValidationIssuesModal';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';

interface OneClickExportSectionProps {
  isMalayalam?: boolean;
}

export function OneClickExportSection({ isMalayalam = false }: OneClickExportSectionProps) {
  const [templates] = useState<BoardExportTemplate[]>(() => complianceClient.getTemplates());
  const [selectedTemplateForAudit, setSelectedTemplateForAudit] = useState<BoardExportTemplate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ msg: string; filename: string } | null>(null);

  const handleExport = (template: BoardExportTemplate, format: 'xlsx' | 'csv') => {
    setDownloadingId(`${template.id}-${format}`);
    try {
      const result = complianceClient.exportPortalData(template.id, format);
      setSuccessToast({
        msg: isMalayalam
          ? `${template.portalName} ഫോർമാറ്റിലുള്ള ഫയൽ വിജയകരമായി ഡൗൺലോഡ് ചെയ്തു!`
          : `Successfully exported in official ${template.portalName} format!`,
        filename: result.filename,
      });
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">{successToast.msg}</div>
              <div className="text-xs text-emerald-100 font-mono mt-0.5">{successToast.filename}</div>
            </div>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-white hover:text-emerald-200 text-xs font-semibold px-2 py-1 rounded bg-white/20"
          >
            OK
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isMalayalam ? '1-ക്ലിക്ക് ഗവൺമെന്റ് പോർട്ടൽ എക്സ്പോർട്ട്' : '1-Click Govt & Board Data Sync'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isMalayalam
                ? 'സർക്കാർ വിദ്യാഭ്യാസ പോർട്ടലുകളുടെ കൃത്യമായ മാതൃകയിലുള്ള ഡാറ്റാ എക്സ്പോർട്ട്'
                : '1-Click Official Portal Specification Data Export'}
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              {isMalayalam
                ? 'CBSE OASIS/LOC, സംസ്ഥാന വിദ്യാഭ്യാസ വകുപ്പ് (സമ്പൂർണ്ണ), UDISE+, NEMIS, MOE പോർട്ടലുകൾ ആവശ്യപ്പെടുന്ന അതേ Excel/CSV മാതൃകയിൽ ഒറ്റ ക്ലിക്കിൽ ഡൗൺലോഡ് ചെയ്യാം. മാനുവൽ എൻട്രി പിഴവുകൾ പൂർണ്ണമായും ഒഴിവാക്കാം.'
                : 'Directly downloads pre-validated spreadsheets formatted strictly to CBSE, State Department, UDISE+, NEMIS, and Ministry of Education specifications.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[200px]">
            <div className="text-3xl font-black text-emerald-400">100%</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
              {isMalayalam ? 'പോർട്ടൽ കോംപാറ്റിബിലിറ്റി' : 'Portal Compatibility'}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {isMalayalam ? 'Excel (.xlsx) & CSV റെഡി' : 'Excel (.xlsx) & CSV UTF-8'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Board Export Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const hasErrors = tpl.validationIssuesCount.errors > 0;
          const hasWarnings = tpl.validationIssuesCount.warnings > 0;

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                {/* Board Badge & Score */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      tpl.board === 'CBSE'
                        ? 'bg-blue-100 text-blue-800'
                        : tpl.board === 'STATE_BOARD'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tpl.board === 'UDISE_PLUS'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tpl.board}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-slate-500">Readiness:</span>
                    <span
                      className={`${
                        tpl.complianceScore === 100
                          ? 'text-emerald-600'
                          : tpl.complianceScore > 98
                          ? 'text-indigo-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {tpl.complianceScore}%
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {isMalayalam ? tpl.titleMl : tpl.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {isMalayalam ? tpl.descriptionMl : tpl.description}
                </p>

                {/* Portal Target */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium truncate max-w-[170px]">{tpl.portalName}</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px] font-semibold">
                    {tpl.recordCount} recs
                  </span>
                </div>

                {/* Data Quality Status Button */}
                <button
                  onClick={() => setSelectedTemplateForAudit(tpl)}
                  className="mt-3 w-full py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-1.5">
                    {hasErrors ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    ) : hasWarnings ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="text-slate-700">
                      {hasErrors
                        ? isMalayalam
                          ? `${tpl.validationIssuesCount.errors} പിഴവുകൾ ഉണ്ട്`
                          : `${tpl.validationIssuesCount.errors} Errors Found`
                        : hasWarnings
                        ? isMalayalam
                          ? `${tpl.validationIssuesCount.warnings} മുന്നറിയിപ്പുകൾ`
                          : `${tpl.validationIssuesCount.warnings} Warnings`
                        : isMalayalam
                        ? '100% ഡാറ്റാ വെരിഫൈഡ്'
                        : '100% Data Verified'}
                    </span>
                  </div>
                  <span className="text-indigo-600 text-[11px] font-bold">
                    {isMalayalam ? 'ഓഡിറ്റ് കാണുക' : 'Inspect'}
                  </span>
                </button>
              </div>

              {/* 1-Click Action Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleExport(tpl, 'xlsx')}
                  disabled={downloadingId !== null}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => handleExport(tpl, 'csv')}
                  disabled={downloadingId !== null}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pre-Export Validation Issues Modal */}
      {selectedTemplateForAudit && (
        <ValidationIssuesModal
          template={selectedTemplateForAudit}
          issues={complianceClient.getValidationIssues(selectedTemplateForAudit.id)}
          onClose={() => setSelectedTemplateForAudit(null)}
          onProceedExport={() => handleExport(selectedTemplateForAudit, 'xlsx')}
          isMalayalam={isMalayalam}
        />
      )}
    </div>
  );
}
