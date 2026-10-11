'use client';

import React from 'react';
import { BonafideCertificateData, SchoolCertificateSettings } from '@krypton/types';
import { SchoolCrestLogo } from './SchoolCrestLogo';
import { PrincipalDigitalSignature } from './PrincipalDigitalSignature';
import { QRCodeSVG } from '@/components/attendance/QRCodeSVG';

interface BonafideCertificateViewProps {
  data: BonafideCertificateData;
  settings: SchoolCertificateSettings;
  isMalayalamSubtitles?: boolean;
}

export function BonafideCertificateView({
  data,
  settings,
  isMalayalamSubtitles = true,
}: BonafideCertificateViewProps) {
  return (
    <div className="bg-white text-gray-900 shadow-2xl rounded-sm border border-indigo-900/20 max-w-[850px] mx-auto p-10 sm:p-14 print:p-8 print:shadow-none print:border-none print:max-w-none print:w-full relative overflow-hidden font-serif">
      {/* Decorative Guilloche Border */}
      <div className="absolute inset-3 border-2 border-indigo-900/60 pointer-events-none rounded-sm" />
      <div className="absolute inset-4 border border-amber-500/50 pointer-events-none rounded-sm" />
      <div className="absolute inset-6 border border-dashed border-gray-300 pointer-events-none rounded-sm" />

      {/* Decorative Corner Ornaments */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-600 pointer-events-none" />

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <SchoolCrestLogo size={420} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pb-5 mb-8">
          <div className="flex justify-center mb-3">
            <SchoolCrestLogo size={82} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-indigo-950 font-serif">
            {settings.schoolName}
          </h1>
          {isMalayalamSubtitles && (
            <p className="text-sm font-sans font-medium text-amber-900/90 mt-0.5">
              {settings.schoolNameMl}
            </p>
          )}

          <p className="text-xs text-gray-700 font-sans tracking-tight mt-1 font-semibold">
            {settings.affiliationBoard}
          </p>
          <p className="text-[11px] text-gray-600 font-sans">
            {settings.address}
          </p>

          <div className="flex justify-between items-center text-xs font-sans text-gray-600 border-t border-b border-indigo-950/20 py-2 mt-4 px-2">
            <div>
              <span className="font-semibold text-gray-800">Ref No:</span>{' '}
              <span className="font-mono font-bold text-indigo-900">{data.certNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Date of Issue:</span>{' '}
              <span className="font-mono">{data.issueDate}</span>
            </div>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-indigo-950 uppercase font-serif px-6 py-1 border-b-2 border-amber-500">
              BONAFIDE CERTIFICATE
            </h2>
            {isMalayalamSubtitles && (
              <p className="text-xs font-sans text-amber-900 font-semibold mt-1">
                ബോണഫൈഡ് സർട്ടിഫിക്കറ്റ്
              </p>
            )}
          </div>
        </div>

        {/* Certificate Body Paragraph */}
        <div className="text-base sm:text-lg leading-relaxed text-gray-800 space-y-6 text-justify px-4">
          <p>
            This is to certify that{' '}
            <span className="font-bold text-indigo-950 border-b border-dotted border-gray-600 px-1 inline-block">
              {data.studentName}
            </span>
            {isMalayalamSubtitles && (
              <span className="text-sm font-sans text-gray-700 font-normal">
                {' '}({data.studentNameMl})
              </span>
            )}
            , son / daughter of{' '}
            <span className="font-semibold text-gray-950 border-b border-dotted border-gray-600 px-1 inline-block">
              Mr. {data.fatherName} & Mrs. {data.motherName}
            </span>
            , holding Admission Number{' '}
            <span className="font-mono font-bold text-indigo-900 border-b border-dotted border-gray-600 px-1 inline-block">
              {data.admissionNumber}
            </span>
            , is a bonafide student of this institution.
          </p>

          <p>
            He / She is presently studying in{' '}
            <span className="font-bold text-gray-950 border-b border-dotted border-gray-600 px-1 inline-block">
              {data.currentClass} (Section {data.section})
            </span>{' '}
            during the Academic Year{' '}
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-600 px-1 inline-block">
              {data.academicYear}
            </span>
            . According to the school admission register, his / her recorded Date of Birth is{' '}
            <span className="font-mono font-bold text-gray-950 border-b border-dotted border-gray-600 px-1 inline-block">
              {data.dateOfBirth}
            </span>
            .
          </p>

          {/* Purpose Box */}
          <div className="p-4 bg-indigo-50/60 border-l-4 border-indigo-700 rounded-r text-sm font-sans text-gray-800 my-4">
            <span className="font-bold text-indigo-950 block mb-1">
              Purpose of Certification:
            </span>
            This certificate is issued on the request of the parent / guardian for{' '}
            <span className="font-semibold text-indigo-900 underline decoration-indigo-300">
              {data.purposeDescription}
            </span>
            .
          </div>

          <p>
            To the best of our knowledge, {data.studentName} maintains{' '}
            <span className="font-semibold text-emerald-800">{data.conduct}</span>.
          </p>
        </div>

        {/* Bottom Section: QR and Digital Signature */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-end justify-between px-2">
          {/* QR Code */}
          <div className="flex items-center gap-3">
            <QRCodeSVG
              value={data.verificationUrl}
              size={85}
              className="border border-gray-300 p-1 bg-white"
            />
            <div className="text-[11px] font-sans text-gray-600">
              <p className="font-bold text-indigo-950">DIGITAL VERIFICATION</p>
              <p>Scan to verify authenticity</p>
              <p className="font-mono text-[9px] text-gray-500 mt-1">Hash: {data.verificationHash}</p>
            </div>
          </div>

          {/* Principal Signature & Seal */}
          <PrincipalDigitalSignature
            principalName={settings.principalName}
            principalTitle={settings.principalTitle}
            principalDegree={settings.principalDegree}
            issueDate={data.issueDate}
            verificationHash={data.verificationHash}
            showSeal={true}
          />
        </div>

        {/* Bottom micro notice */}
        <div className="mt-8 text-center text-[10px] text-gray-500 font-sans border-t border-gray-200 pt-2">
          Official Digital Document generated by Krypton School Management ERP. Valid with digital signature and school seal.
        </div>
      </div>
    </div>
  );
}
