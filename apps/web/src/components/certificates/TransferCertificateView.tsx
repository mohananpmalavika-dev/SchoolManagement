'use client';

import React from 'react';
import { TransferCertificateData, SchoolCertificateSettings } from '@krypton/types';
import { SchoolCrestLogo } from './SchoolCrestLogo';
import { PrincipalDigitalSignature } from './PrincipalDigitalSignature';
import { QRCodeSVG } from '@/components/attendance/QRCodeSVG';

interface TransferCertificateViewProps {
  data: TransferCertificateData;
  settings: SchoolCertificateSettings;
  isMalayalamSubtitles?: boolean;
}

export function TransferCertificateView({
  data,
  settings,
  isMalayalamSubtitles = true,
}: TransferCertificateViewProps) {
  return (
    <div className="bg-white text-gray-900 shadow-2xl rounded-sm border border-amber-900/20 max-w-[850px] mx-auto p-8 sm:p-12 print:p-6 print:shadow-none print:border-none print:max-w-none print:w-full relative overflow-hidden font-serif">
      {/* Ornate Certificate Outer Border */}
      <div className="absolute inset-3 border-2 border-amber-700/60 pointer-events-none rounded-sm" />
      <div className="absolute inset-4 border border-amber-600/30 pointer-events-none rounded-sm" />

      {/* Subtle Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <SchoolCrestLogo size={420} />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center pb-4 border-b-2 border-amber-800/40 mb-5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="w-20 h-20 flex items-center justify-center">
              <SchoolCrestLogo size={74} />
            </div>

            <div className="flex-1 text-center">
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
                {settings.address} | Ph: {settings.phone} | Email: {settings.email}
              </p>
            </div>

            {/* Verification QR Code in Top Right */}
            <div className="flex flex-col items-center">
              <QRCodeSVG
                value={data.verificationUrl}
                size={70}
                className="border border-gray-300 p-0.5 bg-white"
              />
              <span className="text-[9px] text-gray-500 font-sans mt-0.5">Scan to Verify</span>
            </div>
          </div>

          {/* Certificate Title Banner */}
          <div className="mt-3 inline-block bg-gradient-to-r from-amber-900/10 via-amber-800/20 to-amber-900/10 px-8 py-1.5 border-y-2 border-amber-800/40">
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-amber-950 font-serif">
              TRANSFER CERTIFICATE
            </h2>
            {isMalayalamSubtitles && (
              <p className="text-xs font-sans text-amber-900 font-medium">
                ട്രാൻസ്ഫർ സർട്ടിഫിക്കറ്റ്
              </p>
            )}
          </div>

          {/* Meta Info Row */}
          <div className="flex justify-between items-center text-xs font-sans text-gray-700 mt-3 px-2">
            <div>
              <span className="font-semibold text-gray-900">Book No / പുസ്തക നമ്പർ:</span>{' '}
              <span className="font-mono">{data.bookNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">TC No / ടി.സി. നമ്പർ:</span>{' '}
              <span className="font-mono font-bold text-indigo-900">{data.tcNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Admission No:</span>{' '}
              <span className="font-mono font-bold text-gray-950">{data.admissionNumber}</span>
            </div>
          </div>
        </div>

        {/* Certificate Table Details */}
        <div className="border border-gray-300 rounded-sm text-xs font-sans divide-y divide-gray-200">
          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">1.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Name of Pupil <span className="text-[11px] text-gray-500">(വിദ്യാർത്ഥിയുടെ പേര്)</span>
            </div>
            <div className="col-span-5 font-bold text-gray-950 text-sm">
              {data.studentName} {isMalayalamSubtitles && <span className="text-xs font-normal text-gray-700">({data.studentNameMl})</span>}
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">2.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Mother&apos;s Name <span className="text-[11px] text-gray-500">(മാതാവിന്റെ പേര്)</span>
            </div>
            <div className="col-span-5 font-semibold text-gray-900">{data.motherName}</div>
          </div>

          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">3.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Father&apos;s / Guardian&apos;s Name <span className="text-[11px] text-gray-500">(പിതാവിന്റെ പേര്)</span>
            </div>
            <div className="col-span-5 font-semibold text-gray-900">{data.fatherName}</div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">4.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Nationality & Religion <span className="text-[11px] text-gray-500">(ദേശീയത & മതം)</span>
            </div>
            <div className="col-span-5 font-medium text-gray-900">
              {data.nationality} | {data.religionAndCaste}
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">5.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Date of Birth (in Christian Era) <br />
              <span className="text-[11px] text-gray-500">(ജനനത്തീയതി - അക്കത്തിലും വാക്കിലും)</span>
            </div>
            <div className="col-span-5">
              <div className="font-bold text-gray-900 font-mono">{data.dateOfBirth}</div>
              <div className="text-[11px] text-gray-600 italic font-serif">({data.dateOfBirthWords})</div>
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">6.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Date of First Admission & Class <span className="text-[11px] text-gray-500">(സ്കൂളിൽ ചേർന്ന തീയതി & ക്ലാസ്)</span>
            </div>
            <div className="col-span-5 font-medium text-gray-900">
              {data.dateOfFirstAdmission} ({data.classFirstAdmitted})
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">7.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Class in which Pupil Last Studied <span className="text-[11px] text-gray-500">(അവസാനം പഠിച്ച ക്ലാസ്)</span>
            </div>
            <div className="col-span-5 font-bold text-indigo-950">
              {data.classLastStudied} ({data.classLastStudiedWords})
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">8.</div>
            <div className="col-span-6 font-medium text-gray-800">
              School / Board Annual Examination Status
            </div>
            <div className="col-span-5 font-medium text-emerald-800">
              {data.schoolBoardExamStatus}
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">9.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Whether Qualified for Promotion to Higher Class
            </div>
            <div className="col-span-5 font-semibold text-gray-900">
              {data.qualifiedForPromotion ? 'YES' : 'NO'} - {data.promotedToClass}
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">10.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Month Upto Which Pupil Paid School Dues
            </div>
            <div className="col-span-5 font-medium text-gray-900">{data.duesPaidUpto}</div>
          </div>

          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">11.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Total Working Days & Days Present
            </div>
            <div className="col-span-5 font-medium text-gray-900">
              {data.attendedWorkingDays} days present out of {data.totalWorkingDays} working days ({Math.round((data.attendedWorkingDays / data.totalWorkingDays) * 100)}% attendance)
            </div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">12.</div>
            <div className="col-span-6 font-medium text-gray-800">
              General Conduct & Character <span className="text-[11px] text-gray-500">(സ്വഭാവം)</span>
            </div>
            <div className="col-span-5 font-bold text-emerald-700">{data.generalConduct}</div>
          </div>

          <div className="grid grid-cols-12 p-2 bg-gray-50/70 items-center">
            <div className="col-span-1 font-bold text-gray-600">13.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Reason for Leaving the School <span className="text-[11px] text-gray-500">(പഠനം നിർത്താനുള്ള കാരണം)</span>
            </div>
            <div className="col-span-5 font-medium text-gray-900">{data.reasonForLeaving}</div>
          </div>

          <div className="grid grid-cols-12 p-2 items-center">
            <div className="col-span-1 font-bold text-gray-600">14.</div>
            <div className="col-span-6 font-medium text-gray-800">
              Date of Issue of Certificate <span className="text-[11px] text-gray-500">(സർട്ടിഫിക്കറ്റ് നൽകിയ തീയതി)</span>
            </div>
            <div className="col-span-5 font-medium text-gray-900 font-mono">{data.dateOfIssue}</div>
          </div>
        </div>

        {/* Remarks Box */}
        {data.remarks && (
          <div className="mt-4 p-2.5 bg-amber-50/50 border border-amber-200 rounded text-xs text-amber-950 font-sans">
            <span className="font-bold">Remarks:</span> {data.remarks}
          </div>
        )}

        {/* Signatures & Seal Section */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex items-end justify-between">
          <div className="text-left font-sans text-xs">
            <div className="h-10 border-b border-gray-400 w-36 mb-1 flex items-end">
              <span className="text-gray-400 text-[10px] italic">Verified By Clerk</span>
            </div>
            <p className="font-semibold text-gray-700">Class Teacher / Clerk</p>
            <p className="text-[10px] text-gray-500">Prepared & Checked</p>
          </div>

          <div className="flex-1 px-4">
            <PrincipalDigitalSignature
              principalName={settings.principalName}
              principalTitle={settings.principalTitle}
              principalDegree={settings.principalDegree}
              issueDate={data.dateOfIssue}
              verificationHash={data.verificationHash}
              showSeal={true}
            />
          </div>
        </div>

        {/* Footer Verification Notice */}
        <div className="mt-6 text-center text-[10px] text-gray-500 font-sans border-t border-gray-200/80 pt-2 flex items-center justify-between">
          <span>This is a 1-Click Computer Generated Digital Document with Cryptographic Verification.</span>
          <span className="font-mono text-gray-600 font-semibold">Ref: {data.verificationHash}</span>
        </div>
      </div>
    </div>
  );
}
