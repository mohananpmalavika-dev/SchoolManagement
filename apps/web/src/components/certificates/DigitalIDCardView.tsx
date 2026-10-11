'use client';

import React, { useState } from 'react';
import { DigitalIDCardData, SchoolCertificateSettings } from '@krypton/types';
import { SchoolCrestLogo } from './SchoolCrestLogo';
import { QRCodeSVG } from '@/components/attendance/QRCodeSVG';
import {
  Phone,
  Droplet,
  MapPin,
  Calendar,
  ShieldCheck,
  RotateCw,
  Bus,
  Sparkles,
} from 'lucide-react';

interface DigitalIDCardViewProps {
  data: DigitalIDCardData;
  settings: SchoolCertificateSettings;
  isMalayalamSubtitles?: boolean;
}

export function DigitalIDCardView({
  data,
  settings,
  isMalayalamSubtitles = true,
}: DigitalIDCardViewProps) {
  const [activeSide, setActiveSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');

  return (
    <div className="space-y-6">
      {/* Controls Bar for ID Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Layout:</span>
          <button
            onClick={() => setOrientation('PORTRAIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              orientation === 'PORTRAIT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vertical (Lanyard Badge)
          </button>
          <button
            onClick={() => setOrientation('LANDSCAPE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              orientation === 'LANDSCAPE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Horizontal (Wallet Card)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View:</span>
          <button
            onClick={() => setActiveSide(activeSide === 'FRONT' ? 'BACK' : 'FRONT')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip to {activeSide === 'FRONT' ? 'Back Side' : 'Front Side'}</span>
          </button>
        </div>
      </div>

      {/* Screen Interactive Card Display */}
      <div className="flex justify-center print:hidden">
        {orientation === 'PORTRAIT' ? (
          <div className="w-[320px] transition-all duration-300">
            {activeSide === 'FRONT' ? (
              <PortraitCardFront data={data} settings={settings} isMalayalamSubtitles={isMalayalamSubtitles} />
            ) : (
              <PortraitCardBack data={data} settings={settings} />
            )}
          </div>
        ) : (
          <div className="w-[520px] transition-all duration-300">
            {activeSide === 'FRONT' ? (
              <LandscapeCardFront data={data} settings={settings} isMalayalamSubtitles={isMalayalamSubtitles} />
            ) : (
              <LandscapeCardBack data={data} settings={settings} />
            )}
          </div>
        )}
      </div>

      {/* Print-Only Dual Side Layout: Prints BOTH Front & Back side-by-side or stacked cleanly! */}
      <div className="hidden print:block font-sans">
        <div className="text-center mb-4 text-xs text-gray-500">
          Official Student Identity Card • Cut along dotted guides and fold or laminate
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="w-[300px]">
            <PortraitCardFront data={data} settings={settings} isMalayalamSubtitles={isMalayalamSubtitles} />
          </div>
          <div className="w-[300px]">
            <PortraitCardBack data={data} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- PORTRAIT FRONT -----------------
export function PortraitCardFront({
  data,
  settings,
  isMalayalamSubtitles,
}: {
  data: DigitalIDCardData;
  settings: SchoolCertificateSettings;
  isMalayalamSubtitles?: boolean;
}) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-indigo-900/40 overflow-hidden relative text-gray-900 select-none">
      {/* Top Lanyard Slot Graphic */}
      <div className="pt-2 pb-1 flex justify-center bg-indigo-950">
        <div className="w-12 h-2.5 rounded-full bg-indigo-900 border border-indigo-700/60 shadow-inner" />
      </div>

      {/* Header Band */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white p-3 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
        <div className="flex items-center justify-center gap-2 mb-1">
          <SchoolCrestLogo size={36} />
          <div className="text-left">
            <h3 className="text-[13px] font-extrabold uppercase tracking-tight leading-tight font-serif text-white">
              {settings.schoolName}
            </h3>
            {isMalayalamSubtitles && (
              <p className="text-[10px] text-amber-200 font-sans font-medium leading-none">
                {settings.schoolNameMl}
              </p>
            )}
          </div>
        </div>
        <div className="text-[9px] text-indigo-200 uppercase tracking-widest font-mono">
          STUDENT IDENTITY CARD • {data.academicYear}
        </div>
      </div>

      {/* Photo & House Ribbon */}
      <div className="p-4 flex flex-col items-center">
        <div className="relative mb-2">
          {/* Student Photo */}
          <div className="w-24 h-28 rounded-xl border-2 border-indigo-600 overflow-hidden shadow-md bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photoUrl}
              alt={data.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* House Ribbon Tag */}
          {data.house && (
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
              <span className="px-2 py-0.5 bg-indigo-700 text-white text-[9px] font-bold uppercase rounded-full shadow tracking-wider">
                {data.house.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Student Name */}
        <h2 className="text-base font-bold text-indigo-950 text-center tracking-tight mt-1">
          {data.fullName}
        </h2>
        {isMalayalamSubtitles && (
          <p className="text-xs text-gray-600 font-sans font-medium -mt-0.5">
            {data.fullNameMl}
          </p>
        )}

        {/* Class Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-full text-xs font-bold mt-1.5">
          <span>{data.currentClass} - Section {data.section}</span>
          <span className="text-indigo-300">•</span>
          <span className="font-mono text-gray-700">Roll #{data.rollNumber}</span>
        </div>

        {/* Student Metadata Table */}
        <div className="w-full grid grid-cols-2 gap-2 mt-3 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Adm No</span>
            <span className="font-mono font-bold text-gray-900">{data.admissionNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Blood Group</span>
            <span className="font-bold text-rose-600 flex items-center gap-0.5">
              <Droplet className="w-3 h-3 fill-rose-600" />
              {data.bloodGroup}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">DOB</span>
            <span className="font-mono text-gray-800">{data.dateOfBirth}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Valid Upto</span>
            <span className="font-mono text-gray-800">{data.validUntil}</span>
          </div>
        </div>

        {/* Live Scannable QR Code */}
        <div className="mt-3 flex flex-col items-center">
          <QRCodeSVG
            value={data.qrPayload}
            size={90}
            className="border-2 border-indigo-900/20 p-1 bg-white rounded-lg shadow-sm"
          />
          <span className="text-[9px] font-mono text-gray-500 tracking-wider mt-1">
            SCAN FOR DIGITAL RECORD
          </span>
        </div>
      </div>

      {/* Bottom Footer Color Stripe */}
      <div className="h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-900" />
    </div>
  );
}

// ----------------- PORTRAIT BACK -----------------
export function PortraitCardBack({
  data,
  settings,
}: {
  data: DigitalIDCardData;
  settings: SchoolCertificateSettings;
}) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-indigo-900/40 overflow-hidden relative text-gray-900 select-none flex flex-col justify-between">
      {/* Top Lanyard Slot Graphic */}
      <div className="pt-2 pb-1 flex justify-center bg-indigo-950">
        <div className="w-12 h-2.5 rounded-full bg-indigo-900 border border-indigo-700/60 shadow-inner" />
      </div>

      <div className="p-4 space-y-3">
        <div className="text-center border-b border-gray-200 pb-2">
          <h4 className="text-xs font-bold text-indigo-950 uppercase font-serif">
            EMERGENCY & VERIFICATION
          </h4>
          <p className="text-[10px] text-gray-500 font-sans">
            Property of {settings.schoolName}
          </p>
        </div>

        {/* Emergency Info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
            <Phone className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-red-800 uppercase block">Emergency Contact</span>
              <span className="font-mono font-bold text-red-950 text-xs">{data.emergencyContact}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
            <Bus className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Transport Route</span>
              <span className="font-semibold text-blue-950 text-xs">{data.busRoute || 'Self Commute'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <MapPin className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-gray-600 uppercase block">Residential Address</span>
              <span className="text-[11px] text-gray-800 leading-tight block">{data.address}</span>
            </div>
          </div>
        </div>

        {/* Card Terms & Conditions */}
        <div className="text-[9px] text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
          <p>• This card is non-transferable and must be worn within school premises and transit buses.</p>
          <p>• If lost, report immediately to the administrative office.</p>
          <p>• If found, kindly return to: {settings.address}.</p>
        </div>

        {/* Principal Digital Signature on Back */}
        <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-gray-500">Helpline: {settings.phone}</div>
            <div className="font-mono text-[9px] text-indigo-900 font-bold">
              ID: {data.cardId}
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <svg viewBox="0 0 120 30" className="w-24 h-6">
              <path
                d="M5 22 C 20 8, 30 5, 45 18 C 55 26, 65 6, 75 14 C 85 20, 95 12, 110 8"
                fill="none"
                stroke="#0f2b5c"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-bold text-gray-900 block leading-none font-serif">
              {settings.principalName}
            </span>
            <span className="text-[8px] text-gray-500 uppercase tracking-wider">Principal</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Color Stripe */}
      <div className="h-2 bg-indigo-950" />
    </div>
  );
}

// ----------------- LANDSCAPE FRONT -----------------
export function LandscapeCardFront({
  data,
  settings,
  isMalayalamSubtitles,
}: {
  data: DigitalIDCardData;
  settings: SchoolCertificateSettings;
  isMalayalamSubtitles?: boolean;
}) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-indigo-900/40 overflow-hidden relative text-gray-900 select-none flex">
      {/* Left Vertical Color Pillar */}
      <div className="w-3 bg-gradient-to-b from-indigo-950 via-indigo-800 to-amber-500 flex-shrink-0" />

      <div className="flex-1 p-4 flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <SchoolCrestLogo size={36} />
            <div>
              <h3 className="text-xs font-extrabold uppercase font-serif text-indigo-950">
                {settings.schoolName}
              </h3>
              {isMalayalamSubtitles && (
                <p className="text-[10px] text-amber-900 font-medium font-sans">
                  {settings.schoolNameMl}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
              {data.academicYear}
            </span>
          </div>
        </div>

        {/* Middle Body */}
        <div className="flex items-center gap-4 py-2">
          {/* Photo */}
          <div className="w-20 h-24 rounded-lg border-2 border-indigo-600 overflow-hidden shadow-sm flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoUrl} alt={data.fullName} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1 text-xs">
            <h2 className="text-base font-bold text-indigo-950 leading-tight">
              {data.fullName}
            </h2>
            <div className="text-indigo-800 font-semibold">
              {data.currentClass} • Section {data.section} (Roll #{data.rollNumber})
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600 pt-1">
              <div>Adm No: <span className="font-mono font-bold text-gray-900">{data.admissionNumber}</span></div>
              <div>Blood: <span className="font-bold text-rose-600">{data.bloodGroup}</span></div>
              <div>DOB: <span className="font-mono text-gray-900">{data.dateOfBirth}</span></div>
              <div>Emg: <span className="font-mono text-gray-900">{data.emergencyContact}</span></div>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center flex-shrink-0">
            <QRCodeSVG value={data.qrPayload} size={76} className="border border-gray-300 p-0.5" />
            <span className="text-[8px] font-mono text-gray-500 mt-0.5">SCAN ME</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-100 pt-1">
          <span>Valid Upto: {data.validUntil}</span>
          <span className="font-bold text-indigo-950 font-serif">{settings.principalName} (Principal)</span>
        </div>
      </div>
    </div>
  );
}

// ----------------- LANDSCAPE BACK -----------------
export function LandscapeCardBack({
  data,
  settings,
}: {
  data: DigitalIDCardData;
  settings: SchoolCertificateSettings;
}) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-indigo-900/40 overflow-hidden relative text-gray-900 select-none p-4 flex flex-col justify-between">
      <div className="border-b border-gray-200 pb-1 flex justify-between items-center">
        <h4 className="text-xs font-bold text-indigo-950 uppercase font-serif">
          STUDENT TRANSPORT & EMERGENCY CARD
        </h4>
        <span className="text-[10px] text-gray-500">{settings.phone}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs py-2">
        <div className="space-y-1 text-[11px]">
          <p><span className="font-bold text-gray-700">Residential Address:</span> {data.address}</p>
          <p><span className="font-bold text-gray-700">Emergency Phone:</span> {data.emergencyContact}</p>
          <p><span className="font-bold text-gray-700">Bus Route:</span> {data.busRoute || 'N/A'}</p>
        </div>

        <div className="text-[9px] text-gray-500 border-l border-gray-200 pl-3 leading-relaxed">
          <p>• If found, return to {settings.schoolName}, {settings.address}.</p>
          <p>• Required for entry to library, labs, and school buses.</p>
          <div className="mt-2 text-right">
            <span className="font-serif font-bold text-indigo-950 block text-[10px]">{settings.principalName}</span>
            <span className="text-[8px] text-gray-400">Digitally Authorized</span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-950 text-white text-[9px] py-1 px-3 rounded text-center tracking-widest font-mono">
        KRYPTON DIGITAL ID SYSTEM • SHA256 VERIFIED
      </div>
    </div>
  );
}
