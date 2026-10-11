'use client';

import React from 'react';
import { StudentCertificateProfile, SchoolCertificateSettings } from '@krypton/types';
import { certificateApi } from '@/lib/certificate-client';
import { PortraitCardFront, PortraitCardBack } from './DigitalIDCardView';

interface BatchIDCardsSheetProps {
  students: StudentCertificateProfile[];
  settings: SchoolCertificateSettings;
  side: 'FRONT' | 'BACK' | 'BOTH';
  isMalayalamSubtitles?: boolean;
}

export function BatchIDCardsSheet({
  students,
  settings,
  side,
  isMalayalamSubtitles = true,
}: BatchIDCardsSheetProps) {
  return (
    <div className="bg-white p-4">
      <div className="hidden print:block text-center mb-6 text-xs text-gray-500 font-sans border-b border-gray-300 pb-2">
        <p className="font-bold text-gray-900 text-sm">
          {settings.schoolName} — BATCH STUDENT ID CARD PRINT SHEET ({students.length} CARDS)
        </p>
        <p>A4 Grid Layout • Standard Card Size (54mm x 86mm) • Ready for Cutting & Laminating</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 gap-6 print:gap-4 justify-items-center">
        {students.map((student) => {
          const cardData = certificateApi.generateIDCard(student.id);

          return (
            <div key={student.id} className="w-[280px] break-inside-avoid print:w-[270px]">
              {side === 'FRONT' && (
                <PortraitCardFront
                  data={cardData}
                  settings={settings}
                  isMalayalamSubtitles={isMalayalamSubtitles}
                />
              )}
              {side === 'BACK' && (
                <PortraitCardBack
                  data={cardData}
                  settings={settings}
                />
              )}
              {side === 'BOTH' && (
                <div className="space-y-3">
                  <PortraitCardFront
                    data={cardData}
                    settings={settings}
                    isMalayalamSubtitles={isMalayalamSubtitles}
                  />
                  <PortraitCardBack
                    data={cardData}
                    settings={settings}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
