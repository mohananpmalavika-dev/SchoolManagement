'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  MessageSquare,
  Printer,
  Send,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  AIQuestionPaper,
  AIRemarkResult,
  CBCSchemeOfWorkRequest,
  CBCSchemeOfWorkResponse,
  GeneratedRemark,
  LessonPlanResponse,
  RemarksTone,
  ShareLessonToChatRequest,
  ShareLessonToChatResponse,
  TeacherAIOptions,
  TeacherAIRoster,
  TeachingLanguage,
} from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { generateLessonPlan, generateSchemeOfWork, shareLessonToChat } from '@/lib/copilot-client';
import { exportCsv, messageFor } from '@/lib/workspace';
import { predictiveAnalyticsRoles, teacherRoles } from '@/lib/session';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { EmptyState, PageHeading, Panel } from './WorkspaceUI';
import { Button } from './ui';

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openPrintableWorksheet(paper: AIQuestionPaper, includeAnswerKey: boolean) {
  const win = window.open('', '_blank');
  if (!win) {
    window.print();
    return;
  }
  const totalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(paper.title)} - Official Worksheet</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #111827; line-height: 1.45; padding: 20px; max-width: 850px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; }
    .school-title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .school-subtitle { font-size: 11px; font-family: sans-serif; color: #4b5563; margin-top: 2px; }
    .paper-heading { font-size: 16px; font-weight: 700; margin-top: 10px; color: #1e1b4b; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; font-family: sans-serif; border-top: 1px solid #d1d5db; padding-top: 6px; }
    .meta-table td { padding: 4px 6px; }
    .instructions-box { background: #f9fafb; border-left: 3px solid #4f46e5; padding: 8px 12px; margin-bottom: 20px; font-size: 12px; font-family: sans-serif; }
    .question-item { margin-bottom: 18px; page-break-inside: avoid; }
    .q-text { font-size: 13.5px; font-weight: 600; display: flex; justify-content: space-between; }
    .q-marks { font-size: 12px; font-family: monospace; color: #4b5563; font-weight: bold; }
    .options-list { list-style-type: upper-alpha; margin: 6px 0 6px 24px; padding: 0; font-size: 13px; }
    .options-list li { margin-bottom: 4px; }
    .ans-key { margin-top: 8px; padding: 8px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px; font-family: sans-serif; }
    .rubric-container { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; page-break-inside: avoid; font-family: sans-serif; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .rubric-table th, .rubric-table td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; }
    .rubric-table th { background: #f3f4f6; font-weight: 700; }
    .footer-signatures { margin-top: 35px; display: flex; justify-content: space-between; font-size: 12px; font-family: sans-serif; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #111; width: 180px; text-align: center; padding-top: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-title">AL-AMEEN INTERNATIONAL ACADEMY</div>
    <div class="school-subtitle">AFFILIATED TO CBSE / STATE BOARD • DEPARTMENT OF ACADEMIC ASSESSMENT</div>
    <div class="paper-heading">${escapeHtml(paper.title)} ${includeAnswerKey ? '— TEACHER ANSWER KEY & RUBRICS' : '— STUDENT WORKSHEET'}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Student Name:</strong> ____________________________________</td>
        <td><strong>Class:</strong> _____________</td>
        <td><strong>Roll No:</strong> ________</td>
      </tr>
      <tr>
        <td><strong>Date:</strong> ________________________</td>
        <td><strong>Max Marks:</strong> ${totalMarks}</td>
        <td><strong>Time Allowed:</strong> 30 Mins</td>
      </tr>
    </table>
  </div>

  <div class="instructions-box">
    <strong>Instructions:</strong> ${escapeHtml(paper.instructions)}
  </div>

  <div class="questions">
    ${paper.questions.map((q, idx) => `
      <div class="question-item">
        <div class="q-text">
          <span>${idx + 1}. ${escapeHtml(q.question)}</span>
          <span class="q-marks">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span>
        </div>
        ${q.options && q.options.length ? `
          <ol class="options-list">
            ${q.options.map(opt => `<li>${escapeHtml(opt)}</li>`).join('')}
          </ol>
        ` : `
          <div style="border-bottom: 1px dashed #9ca3af; height: 35px; margin-top: 8px;"></div>
        `}
        ${includeAnswerKey ? `
          <div class="ans-key">
            <strong style="color: #065f46;">Correct Answer:</strong> ${escapeHtml(q.answer)}<br/>
            <span style="color: #047857;"><strong>Pedagogical Explanation:</strong> ${escapeHtml(q.explanation)}</span>
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <div class="rubric-container">
    <div style="font-weight: bold; font-size: 13px; text-transform: uppercase;">Assessment Rubric & Evaluation Standard</div>
    <table class="rubric-table">
      <thead>
        <tr>
          <th>Criterion</th>
          <th>Exceeding Standard (90-100%)</th>
          <th>Meeting Standard (70-89%)</th>
          <th>Approaching Standard (50-69%)</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Concept Clarity</strong></td>
          <td>Flawless recall & understanding of principles</td>
          <td>Accurate recall of syllabus fundamentals</td>
          <td>Partial recall, requires targeted review</td>
          <td>____ / ${Math.round(totalMarks * 0.4)}</td>
        </tr>
        <tr>
          <td><strong>Analytical Reasoning</strong></td>
          <td>Applies rules correctly to solve unfamiliar problems</td>
          <td>Solves standard curriculum questions</td>
          <td>Reasoning errors or incomplete attempts</td>
          <td>____ / ${Math.round(totalMarks * 0.4)}</td>
        </tr>
        <tr>
          <td><strong>Neatness & Precision</strong></td>
          <td>Clear work with complete accuracy</td>
          <td>Minor errors, overall consistent work</td>
          <td>Inconsistent responses</td>
          <td>____ / ${Math.round(totalMarks * 0.2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-signatures">
    <div class="sig-line">Class Teacher Signature</div>
    <div style="font-size: 13px; font-weight: bold;">Score Obtained: ______ / ${totalMarks}</div>
    <div class="sig-line">Head of Department / Examiner</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function openPrintableSchemeOfWork(sow: CBCSchemeOfWorkResponse) {
  const win = window.open('', '_blank');
  if (!win) {
    window.print();
    return;
  }
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>CBC Scheme of Work - ${escapeHtml(sow.title)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.35; padding: 10px; margin: 0; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; }
    .national-title { font-size: 13px; font-weight: 800; letter-spacing: 1.2px; color: #047857; text-transform: uppercase; }
    .school-title { font-size: 17px; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
    .sow-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-top: 4px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
    .meta-table td { padding: 4px 6px; border: 1px solid #cbd5e1; background: #f8fafc; }
    .competency-box { display: flex; gap: 8px; margin: 8px 0; font-size: 10.5px; }
    .competency-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px 8px; background: #ffffff; }
    .competency-card strong { color: #0f172a; display: block; margin-bottom: 2px; font-size: 10.5px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
    .sow-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    .sow-table th, .sow-table td { border: 1px solid #64748b; padding: 5px 6px; text-align: left; vertical-align: top; }
    .sow-table th { background: #0f172a; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
    .sow-table tr:nth-child(even) { background: #f8fafc; }
    ul { margin: 2px 0 2px 14px; padding: 0; }
    li { margin-bottom: 2px; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 12px; page-break-inside: avoid; }
    .rubric-table th, .rubric-table td { border: 1px solid #94a3b8; padding: 5px 6px; }
    .rubric-table th { background: #f1f5f9; color: #0f172a; font-weight: 700; }
    .footer-signatures { margin-top: 20px; display: flex; justify-content: space-between; font-size: 11px; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #334155; width: 200px; text-align: center; padding-top: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="national-title">REPUBLIC OF KENYA · MINISTRY OF EDUCATION · KICD CBC CURRICULUM</div>
    <div class="school-title">OFFICIAL SCHEME OF WORK</div>
    <div class="sow-title">${escapeHtml(sow.title)}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Learning Area / Subject:</strong> ${escapeHtml(sow.subject)}</td>
        <td><strong>Grade Level:</strong> ${escapeHtml(sow.gradeLevel)}</td>
        <td><strong>Strand:</strong> ${escapeHtml(sow.strand)}</td>
      </tr>
      <tr>
        <td><strong>Term & Year:</strong> ${escapeHtml(sow.term)} · ${escapeHtml(sow.academicYear)}</td>
        <td><strong>Curriculum Standard:</strong> ${escapeHtml(sow.curriculum)} (KICD Compliant)</td>
        <td><strong>Total Lessons Planned:</strong> ${sow.weeks.length} Lessons</td>
      </tr>
    </table>
  </div>

  <div class="competency-box">
    <div class="competency-card">
      <strong>🎯 General Learning Outcomes</strong>
      <ul>
        ${sow.generalOutcomes.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
      </ul>
    </div>
    <div class="competency-card">
      <strong>✨ Core Competencies & Values & PCIs</strong>
      <div><strong>Competencies:</strong> ${escapeHtml(sow.coreCompetencies.join(', '))}</div>
      <div style="margin-top: 3px;"><strong>Values:</strong> ${escapeHtml(sow.values.join(', '))}</div>
      <div style="margin-top: 3px;"><strong>PCIs:</strong> ${escapeHtml(sow.pcis.join(', '))}</div>
    </div>
  </div>

  <table class="sow-table">
    <thead>
      <tr>
        <th style="width: 4%;">Wk</th>
        <th style="width: 4%;">Les</th>
        <th style="width: 14%;">Strand & Sub-Strand</th>
        <th style="width: 22%;">Specific Learning Outcomes (SLOs)</th>
        <th style="width: 14%;">Key Inquiry Questions</th>
        <th style="width: 18%;">Learning Experiences</th>
        <th style="width: 12%;">Resources</th>
        <th style="width: 12%;">Assessment Methods</th>
      </tr>
    </thead>
    <tbody>
      ${sow.weeks.map(w => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${w.week}</td>
          <td style="text-align: center; font-weight: bold;">${w.lessonNumber}</td>
          <td><strong>${escapeHtml(w.strand)}</strong><br/><span style="color: #475569;">${escapeHtml(w.subStrand)}</span></td>
          <td>
            <ul>
              ${w.specificLearningOutcomes.map(slo => `<li>${escapeHtml(slo)}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul>
              ${w.keyInquiryQuestions.map(kiq => `<li>${escapeHtml(kiq)}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul>
              ${w.learningExperiences.map(le => `<li>${escapeHtml(le)}</li>`).join('')}
            </ul>
          </td>
          <td>${escapeHtml(w.learningResources.join('; '))}</td>
          <td>${escapeHtml(w.assessmentMethods.join(', '))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h4 style="font-size: 11px; text-transform: uppercase; margin-top: 14px; margin-bottom: 4px;">Assessment Rubrics & Mastery Standards (CBC / KNEC Framework)</h4>
  ${sow.assessmentRubrics.map(r => `
    <table class="rubric-table">
      <thead>
        <tr>
          <th colspan="4">Criterion: ${escapeHtml(r.criterion)}</th>
        </tr>
        <tr>
          <th style="width: 25%;">Exceeding Expectation (Level 4)</th>
          <th style="width: 25%;">Meeting Expectation (Level 3)</th>
          <th style="width: 25%;">Approaching Expectation (Level 2)</th>
          <th style="width: 25%;">Below Expectation (Level 1)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${r.levels.map(l => `
            <td>
              <strong>${escapeHtml(l.scoreRange)}:</strong><br/>
              ${escapeHtml(l.descriptor)}
            </td>
          `).join('')}
        </tr>
      </tbody>
    </table>
  `).join('')}

  <div class="footer-signatures">
    <div class="sig-line">Subject Teacher Signature & Date</div>
    <div class="sig-line">Head of Department (HOD) Approval</div>
    <div class="sig-line">Principal / Headteacher Stamp & Sign</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function schemeOfWorkText(sow: CBCSchemeOfWorkResponse): string {
  return [
    `REPUBLIC OF KENYA - MINISTRY OF EDUCATION`,
    `KICD CBC SCHEME OF WORK: ${sow.title}`,
    `Subject: ${sow.subject} | Grade Level: ${sow.gradeLevel} | Term: ${sow.term} | Year: ${sow.academicYear}`,
    `Curriculum: ${sow.curriculum} | Strand: ${sow.strand}`,
    '='.repeat(80),
    '',
    'GENERAL LEARNING OUTCOMES:',
    ...sow.generalOutcomes.map((o, i) => `  ${i + 1}. ${o}`),
    '',
    'CORE COMPETENCIES & VALUES & PCIS:',
    ...sow.coreCompetencies.map(c => `  • Competency: ${c}`),
    ...sow.values.map(v => `  • Value: ${v}`),
    ...sow.pcis.map(p => `  • PCI: ${p}`),
    '',
    'WEEKLY SCHEME OF WORK BREAKDOWN:',
    '='.repeat(80),
    ...sow.weeks.flatMap(w => [
      `WEEK ${w.week}, LESSON ${w.lessonNumber}: [${w.strand} > ${w.subStrand}]`,
      `  Specific Learning Outcomes:`,
      ...w.specificLearningOutcomes.map(slo => `    - ${slo}`),
      `  Key Inquiry Questions:`,
      ...w.keyInquiryQuestions.map(kiq => `    ? ${kiq}`),
      `  Learning Experiences:`,
      ...w.learningExperiences.map(le => `    * ${le}`),
      `  Resources: ${w.learningResources.join('; ')}`,
      `  Assessment Methods: ${w.assessmentMethods.join(', ')}`,
      `  Teacher Reflection: ${w.reflection || 'Reviewed and achieved.'}`,
      '-'.repeat(60),
    ]),
    '',
    'ASSESSMENT RUBRICS (4 LEVELS - KNEC / CBC STANDARD):',
    ...sow.assessmentRubrics.flatMap(r => [
      `Criterion: ${r.criterion}`,
      ...r.levels.map(l => `  [${l.level}] (${l.scoreRange}): ${l.descriptor}`),
      '',
    ]),
  ].join('\n');
}

function openPrintableLessonPlan(lp: LessonPlanResponse) {
  const win = window.open('', '_blank');
  if (!win) {
    window.print();
    return;
  }
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lesson Plan - ${escapeHtml(lp.title)}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #111827; line-height: 1.45; padding: 20px; max-width: 850px; margin: 0 auto; }
    .header { border-bottom: 2px solid #1e1b4b; padding-bottom: 12px; margin-bottom: 18px; text-align: center; }
    .national-tag { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #047857; text-transform: uppercase; font-family: sans-serif; }
    .school-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .lp-title { font-size: 20px; font-weight: 800; color: #312e81; margin-top: 6px; }
    .meta { font-size: 12px; font-family: sans-serif; color: #4b5563; margin-top: 6px; }
    h3 { font-size: 13px; text-transform: uppercase; font-family: sans-serif; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; }
    ul { font-size: 13px; margin: 4px 0 10px 20px; padding: 0; }
    li { margin-bottom: 4px; }
    .step-card { border: 1px solid #e5e7eb; background: #f9fafb; padding: 10px; margin-bottom: 10px; border-radius: 6px; font-size: 12px; font-family: sans-serif; page-break-inside: avoid; }
    .step-card strong { color: #3730a3; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; font-family: sans-serif; page-break-inside: avoid; }
    .rubric-table th, .rubric-table td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; }
    .rubric-table th { background: #f3f4f6; font-weight: 700; }
    .footer-signatures { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; font-family: sans-serif; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #111; width: 180px; text-align: center; padding-top: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="national-tag">KICD CBC STANDARDS · DAILY LESSON PLAN</div>
    <div class="school-title">AL-AMEEN INTERNATIONAL ACADEMY</div>
    <div class="lp-title">5E INSTRUCTIONAL LESSON PLAN: ${escapeHtml(lp.title)}</div>
    <div class="meta">
      <strong>Subject:</strong> ${escapeHtml(lp.subject)} | <strong>Grade:</strong> ${escapeHtml(lp.gradeLevel)} | <strong>Duration:</strong> ${lp.durationMinutes} Mins | <strong>Curriculum:</strong> ${escapeHtml(lp.curriculum)}
      ${lp.strand ? `<br/><strong>Strand:</strong> ${escapeHtml(lp.strand)} | <strong>Sub-Strand:</strong> ${escapeHtml(lp.subStrand || lp.topic)}` : ''}
    </div>
  </div>

  <h3>1. Specific Learning Outcomes (SLOs)</h3>
  <ul>
    ${lp.learningObjectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
  </ul>

  <h3>2. Core Competencies & Values & PCIs</h3>
  <ul>
    ${lp.coreCompetencies.map(c => `<li><strong>Competency:</strong> ${escapeHtml(c)}</li>`).join('')}
    ${lp.values ? lp.values.map(v => `<li><strong>Value:</strong> ${escapeHtml(v)}</li>`).join('') : ''}
    ${lp.pcis ? lp.pcis.map(p => `<li><strong>PCI:</strong> ${escapeHtml(p)}</li>`).join('') : ''}
  </ul>

  <h3>3. Key Inquiry Questions & Teaching Aids</h3>
  <div style="font-size: 13px; margin-bottom: 8px;">
    <strong>Inquiry Questions:</strong>
    <ul>
      ${lp.keyInquiryQuestions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
    </ul>
    <strong>Materials Needed:</strong> ${escapeHtml(lp.materials.join(', '))}
  </div>

  <h3>4. 5E Instructional Sequence</h3>
  ${lp.steps.map(s => `
    <div class="step-card">
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
        <span><strong>[${escapeHtml(s.phase)}]</strong> ${escapeHtml(s.title)}</span>
        <span>${s.durationMinutes} Mins</span>
      </div>
      <div><strong>Teacher Activity:</strong> ${escapeHtml(s.teacherActivity)}</div>
      <div style="margin-top: 3px;"><strong>Student Activity:</strong> ${escapeHtml(s.studentActivity)}</div>
      <div style="margin-top: 3px; font-size: 11px; color: #6b7280;"><strong>Resources:</strong> ${escapeHtml(s.resourcesNeeded.join(', '))}</div>
    </div>
  `).join('')}

  <h3>5. Differentiated Instruction</h3>
  <div style="font-size: 12px; font-family: sans-serif; display: flex; gap: 16px;">
    <div style="flex: 1; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px; border-radius: 6px;">
      <strong style="color: #92400e;">For Struggling Learners:</strong>
      <ul style="margin-top: 4px;">
        ${lp.differentiatedInstruction.supportForStruggling.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
    </div>
    <div style="flex: 1; background: #ecfdf5; border: 1px solid #d1fae5; padding: 8px; border-radius: 6px;">
      <strong style="color: #065f46;">For Advanced Learners:</strong>
      <ul style="margin-top: 4px;">
        ${lp.differentiatedInstruction.extensionForAdvanced.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
      </ul>
    </div>
  </div>

  <h3>6. Assessment Rubrics & Criteria (4 Levels - KNEC Standard)</h3>
  ${lp.assessmentRubrics.map(r => `
    <table class="rubric-table" style="margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="4">Criterion: ${escapeHtml(r.criterion)}</th>
        </tr>
        <tr>
          <th>Exceeding (Level 4)</th>
          <th>Meeting (Level 3)</th>
          <th>Approaching (Level 2)</th>
          <th>Below (Level 1)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${r.levels.map(l => `
            <td>
              <strong>${escapeHtml(l.scoreRange)}:</strong><br/>
              ${escapeHtml(l.descriptor)}
            </td>
          `).join('')}
        </tr>
      </tbody>
    </table>
  `).join('')}

  <h3>7. Homework & Community Service Learning (CSL) Task</h3>
  <p style="font-size: 13px; font-style: italic;">${escapeHtml(lp.homeworkAssignment)}</p>

  ${lp.reflectionPrompt ? `
    <h3>8. Teacher's Self-Reflection Prompt</h3>
    <p style="font-size: 12px; color: #4b5563; border-left: 3px solid #6366f1; padding-left: 8px;">${escapeHtml(lp.reflectionPrompt)}</p>
  ` : ''}

  <div class="footer-signatures">
    <div class="sig-line">Subject Teacher Signature</div>
    <div class="sig-line">Senior Teacher / HOD Approval</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function paperText(paper: AIQuestionPaper, key = false) {
  return [
    paper.title,
    key ? 'TEACHER ANSWER KEY & RUBRIC' : paper.instructions,
    '',
    ...paper.questions.map((q, i) =>
      key
        ? `${i + 1}. ${q.answer}\nExplanation: ${q.explanation}\nMarks: ${q.marks}\n`
        : `${i + 1}. ${q.question} (${q.marks} marks)\n${q.options.map((o, n) => `   ${String.fromCharCode(65 + n)}. ${o}`).join('\n')}\n`
    ),
  ].join('\n');
}

function lessonPlanText(lp: LessonPlanResponse): string {
  return [
    `LESSON PLAN: ${lp.title}`,
    `Subject: ${lp.subject} | Grade Level: ${lp.gradeLevel} | Duration: ${lp.durationMinutes} mins | Curriculum: ${lp.curriculum}`,
    '='.repeat(70),
    '',
    '1. LEARNING OBJECTIVES:',
    ...lp.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`),
    '',
    '2. CORE COMPETENCIES & VALUES:',
    ...lp.coreCompetencies.map(c => `  • ${c}`),
    '',
    '3. KEY INQUIRY QUESTIONS:',
    ...lp.keyInquiryQuestions.map(q => `  ? ${q}`),
    '',
    '4. TEACHING AIDS & MATERIALS:',
    ...lp.materials.map(m => `  - ${m}`),
    '',
    '5. 5E INSTRUCTIONAL SEQUENCE:',
    ...lp.steps.flatMap(s => [
      `  [${s.phase}] ${s.title} (${s.durationMinutes} mins)`,
      `   Teacher: ${s.teacherActivity}`,
      `   Student: ${s.studentActivity}`,
      `   Resources: ${s.resourcesNeeded.join(', ')}`,
      '',
    ]),
    '6. DIFFERENTIATED LEARNING SUPPORT:',
    '  For Struggling Learners:',
    ...lp.differentiatedInstruction.supportForStruggling.map(s => `   - ${s}`),
    '  For Advanced Learners:',
    ...lp.differentiatedInstruction.extensionForAdvanced.map(e => `   - ${e}`),
    '',
    '7. ASSESSMENT RUBRIC:',
    ...lp.assessmentRubrics.flatMap(r => [
      `  Criterion: ${r.criterion}`,
      ...r.levels.map(l => `    [${l.level}] (${l.scoreRange}): ${l.descriptor}`),
      '',
    ]),
    '8. HOMEWORK / EXTENSION TASK:',
    `  ${lp.homeworkAssignment}`,
  ].join('\n');
}

const languages: TeachingLanguage[] = ['English', 'Malayalam', 'Swahili'];

const TONE_PRESETS: { key: RemarksTone; label: string; desc: string }[] = [
  { key: 'CBC', label: 'CBC Competency-Based', desc: 'Curriculum descriptors (Exceeding, Meeting, Approaching)' },
  { key: 'HOLISTIC', label: 'Holistic & Balanced', desc: 'Balances academic achievement with social and emotional growth' },
  { key: 'ACADEMIC_RIGOR', label: 'Academic Rigor', desc: 'Detailed subject mastery, exam trends, and target scores' },
  { key: 'GROWTH_MINDSET', label: 'Growth Mindset', desc: 'Encouraging, celebrates effort and perseverance' },
];

const SYLLABUS_PRESETS = [
  { subject: 'Integrated Science', topic: 'Photosynthesis & Plant Respiration' },
  { subject: 'Mathematics', topic: 'Quadratic Equations & Parabolic Graphs' },
  { subject: 'Chemistry', topic: 'Acids, Bases, Indicators & Salt Formation' },
  { subject: 'Biology', topic: 'Cell Division, Mitosis & Genetic Inheritance' },
  { subject: 'Physics', topic: 'Newtonian Motion, Force & Momentum' },
  { subject: 'English', topic: 'Argumentative Essay Writing & Persuasive Devices' },
];

const CBC_SCHEME_PRESETS = [
  { subject: 'Integrated Science', strand: 'Living Things and Their Environment', subStrand: 'Plant and Animal Adaptations' },
  { subject: 'Mathematics', strand: 'Numbers and Operations', subStrand: 'Fractions, Decimals and Percentages' },
  { subject: 'Social Studies', strand: 'Natural and Built Environment', subStrand: 'Weather Systems and Climate Impact' },
  { subject: 'Agriculture & Nutrition', strand: 'Conserving Agricultural Environment', subStrand: 'Soil Conservation & Water Harvesting' },
  { subject: 'Pre-Technical Studies', strand: 'Materials for Production', subStrand: 'Metallic and Non-Metallic Materials' },
  { subject: 'Creative Arts & Sports', strand: 'Visual Arts and Design', subStrand: 'Drawing and Color Application' },
  { subject: 'Kiswahili', strand: 'Kusikiliza na Kuzungumza', subStrand: 'Mazingira na Uhifadhi' },
];

export function TeacherAIStudio() {
  return (
    <ProtectedRoute allowedRoles={[...teacherRoles, ...predictiveAnalyticsRoles]}>
      <TeachingTools />
    </ProtectedRoute>
  );
}

function TeachingTools() {
  const { user } = useAuth();
  const [options, setOptions] = useState<TeacherAIOptions | null>(null);
  const [roster, setRoster] = useState<TeacherAIRoster | null>(null);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [language, setLanguage] = useState<TeachingLanguage>('English');
  const [tone, setTone] = useState<RemarksTone>('CBC');
  const [tab, setTab] = useState<'scheme-of-work' | 'lesson-plan' | 'remarks' | 'quiz'>('scheme-of-work');
  const [selected, setSelected] = useState<string[]>([]);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, GeneratedRemark>>({});
  const [page, setPage] = useState(1);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // CBC Scheme of Work state
  const [sowSubject, setSowSubject] = useState('Integrated Science');
  const [sowStrand, setSowStrand] = useState('Living Things and Their Environment');
  const [sowSubStrand, setSowSubStrand] = useState('Plant and Animal Adaptations');
  const [sowTermNumber, setSowTermNumber] = useState(1);
  const [sowWeeksCount, setSowWeeksCount] = useState(10);
  const [sowLessonsPerWeek, setSowLessonsPerWeek] = useState(4);
  const [sowCurriculum, setSowCurriculum] = useState<'CBC' | 'STANDARD' | 'CAMBRIDGE' | 'NCERT'>('CBC');
  const [schemeOfWork, setSchemeOfWork] = useState<CBCSchemeOfWorkResponse | null>(null);

  // Lesson Plan state
  const [lpSubject, setLpSubject] = useState('Integrated Science');
  const [lpChapter, setLpChapter] = useState('Photosynthesis & Plant Respiration');
  const [lpStrand, setLpStrand] = useState('Living Things and Their Environment');
  const [lpSubStrand, setLpSubStrand] = useState('Plant Respiration & Photosynthesis');
  const [lpDuration, setLpDuration] = useState(45);
  const [lpCurriculum, setLpCurriculum] = useState<'CBC' | 'STANDARD' | 'CAMBRIDGE' | 'NCERT'>('CBC');
  const [lessonPlan, setLessonPlan] = useState<LessonPlanResponse | null>(null);

  // Chat sharing state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatPayload, setChatPayload] = useState<{ title: string; content: string; type: 'LESSON_PLAN' | 'SCHEME_OF_WORK' } | null>(null);
  const [sharingChat, setSharingChat] = useState(false);

  // Quiz state
  const [paper, setPaper] = useState<AIQuestionPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('Quadratic Equations');
  const [sourceText, setSourceText] = useState(
    'Quadratic equations are second-degree polynomial equations of the form ax^2 + bx + c = 0, where a is non-zero. ' +
    'The roots can be determined using factorization, completing the square, or the quadratic formula x = (-b ± √(b^2 - 4ac)) / (2a). ' +
    'The discriminant D = b^2 - 4ac determines the nature of the roots: if D > 0, there are two distinct real roots; ' +
    'if D = 0, there is one repeated real root; if D < 0, roots are complex. ' +
    'Applications include trajectory modeling, projectile motions, optimization of profit margins, and area maximization problems in geometry.'
  );
  const [format, setFormat] = useState('QUIZ');
  const [questionType, setQuestionType] = useState('MCQ');
  const [difficulty, setDifficulty] = useState('STANDARD');

  const generation = useRef<AbortController | null>(null);
  const optionsRequest = useRef<AbortController | null>(null);

  const loadOptions = useCallback(async () => {
    optionsRequest.current?.abort();
    const controller = new AbortController();
    optionsRequest.current = controller;
    setError('');
    try {
      const { data } = await apiClient.get<TeacherAIOptions>('/teacher-ai/options', { signal: controller.signal });
      if (!controller.signal.aborted) {
        setOptions(data);
        setClassId(data.classes[0]?.id ?? '');
        setTermId(data.terms.find(t => t.isCurrent)?.id ?? data.terms[0]?.id ?? '');
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    }
  }, []);

  useEffect(() => {
    void loadOptions();
    return () => {
      optionsRequest.current?.abort();
      generation.current?.abort();
    };
  }, [loadOptions]);

  const loadRoster = useCallback(async (signal?: AbortSignal) => {
    if (!classId || !termId) return;
    setRosterLoading(true);
    try {
      const { data } = await apiClient.get<TeacherAIRoster>('/teacher-ai/roster', { params: { classId, termId }, signal });
      if (!signal?.aborted) {
        setRoster(data);
        setSelected(data.students.map(s => s.id));
      }
    } catch (err) {
      if (!signal?.aborted) setError(messageFor(err));
    } finally {
      if (!signal?.aborted) setRosterLoading(false);
    }
  }, [classId, termId]);

  useEffect(() => {
    const controller = new AbortController();
    setRoster(null);
    setDrafts({});
    setObservations({});
    setPaper(null);
    setLessonPlan(null);
    setSelected([]);
    setPage(1);
    setError('');
    setNotice('');
    void loadRoster(controller.signal);
    return () => controller.abort();
  }, [loadRoster]);

  const configured = options?.status.configured ?? false;

  // 1-Click bulk generate remarks
  const generateRemarks = async () => {
    if (!selected.length) return;
    const controller = new AbortController();
    generation.current = controller;
    setBusy(true);
    setError('');
    let completed = 0;

    try {
      for (let i = 0; i < selected.length; i += 10) {
        if (controller.signal.aborted) break;
        setNotice(`AI is analyzing evidence & drafting remarks: ${completed} of ${selected.length} students complete…`);
        const { data } = await apiClient.post<AIRemarkResult>(
          '/teacher-ai/remarks',
          {
            classId,
            termId,
            language,
            students: selected.slice(i, i + 10).map(studentId => ({
              studentId,
              behaviourObservation: observations[studentId] || undefined,
            })),
          },
          { timeout: 75000, signal: controller.signal }
        );
        if (controller.signal.aborted) break;
        setDrafts(current => ({ ...current, ...Object.fromEntries(data.remarks.map(r => [r.studentId, r])) }));
        completed += data.remarks.length;
      }
      if (!controller.signal.aborted) {
        setNotice(`🎉 ${completed} personalized ${tone} remarks drafted in 1 click! Review, edit as needed, and approve.`);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(messageFor(err));
        setNotice(`${completed} remarks generated before interruption. Completed drafts are saved below.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const prepare = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await apiClient.post<{ generated: number; skipped: number; errors: { student: string; error: string }[] }>(
        '/teacher-ai/report-cards',
        { classId, termId },
        { timeout: 75000 }
      );
      await loadRoster();
      setNotice(`${data.generated} draft report cards prepared; ${data.skipped} preserved; ${data.errors.length} skipped.`);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async (id: string) => {
    const student = roster?.students.find(s => s.id === id);
    const draft = drafts[id];
    if (!student?.reportCard || !draft) return;
    setSaving(id);
    setError('');
    try {
      const { data } = await apiClient.post<{ updatedAt: string; comment: string }>('/teacher-ai/remarks/save', {
        classId,
        termId,
        studentId: id,
        reportCardId: student.reportCard.id,
        expectedUpdatedAt: student.reportCard.updatedAt,
        remark: draft.text,
      });
      setRoster(current =>
        current
          ? {
              ...current,
              students: current.students.map(s =>
                s.id === id && s.reportCard ? { ...s, reportCard: { ...s.reportCard, updatedAt: data.updatedAt, comment: data.comment } } : s
              ),
            }
          : current
      );
      setNotice(`Reviewed remark saved to ${student.name}'s official report card.`);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSaving('');
    }
  };

  const saveAllDrafts = async () => {
    const draftKeys = Object.keys(drafts);
    if (!draftKeys.length || !roster) return;
    setBusy(true);
    setError('');
    let savedCount = 0;
    try {
      for (const id of draftKeys) {
        const student = roster.students.find(s => s.id === id);
        const draft = drafts[id];
        if (student?.reportCard && draft && student.reportCard.status === 'DRAFT') {
          await apiClient.post<{ updatedAt: string; comment: string }>('/teacher-ai/remarks/save', {
            classId,
            termId,
            studentId: id,
            reportCardId: student.reportCard.id,
            expectedUpdatedAt: student.reportCard.updatedAt,
            remark: draft.text,
          });
          savedCount++;
        }
      }
      await loadRoster();
      setNotice(`🎉 Approved & saved ${savedCount} personalized remarks to official student report cards in 1 click!`);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  // Scheme of Work Generator
  const handleGenerateSchemeOfWork = async () => {
    if (!sowSubject.trim() || !sowStrand.trim() || !classId) return;
    const controller = new AbortController();
    generation.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    setSchemeOfWork(null);

    try {
      const data = await generateSchemeOfWork(
        {
          classId,
          subject: sowSubject.trim(),
          strand: sowStrand.trim(),
          subStrand: sowSubStrand.trim() || undefined,
          termNumber: sowTermNumber,
          weeksCount: sowWeeksCount,
          lessonsPerWeek: sowLessonsPerWeek,
          curriculum: sowCurriculum,
          language,
        },
        controller.signal
      );
      if (!controller.signal.aborted) {
        setSchemeOfWork(data);
        setNotice('🎉 Kenyan CBC Scheme of Work successfully created in under 10 seconds! Ready to print PDF or send to chat.');
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  // Lesson Plan Generator
  const handleGenerateLessonPlan = async () => {
    if (!lpSubject.trim() || !lpChapter.trim() || !classId) return;
    const controller = new AbortController();
    generation.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    setLessonPlan(null);

    try {
      const data = await generateLessonPlan(
        {
          classId,
          subject: lpSubject.trim(),
          chapter: lpChapter.trim(),
          strand: lpStrand.trim() || undefined,
          subStrand: lpSubStrand.trim() || undefined,
          durationMinutes: lpDuration,
          curriculum: lpCurriculum,
          language,
        },
        controller.signal
      );
      if (!controller.signal.aborted) {
        setLessonPlan(data);
        setNotice('✨ Complete 5E Lesson Plan generated in under 10 seconds! Ready to teach, print as PDF or send to chat.');
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  // Share to Class Chat
  const handleShareToChat = async (payload: { title: string; content: string; type: 'LESSON_PLAN' | 'SCHEME_OF_WORK' }) => {
    if (!classId) {
      setError('Please select a class first.');
      return;
    }
    setSharingChat(true);
    setError('');
    try {
      const res = await shareLessonToChat({
        classId,
        title: payload.title,
        summary: payload.title,
        content: payload.content,
        type: payload.type,
      });
      setNotice(`🚀 Successfully posted to ${res.channelName}! Learners & parents can immediately see the outcomes and inquiries in chat.`);
      setChatModalOpen(false);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSharingChat(false);
    }
  };

  // Quiz Generator
  const generateQuiz = async () => {
    const controller = new AbortController();
    generation.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    setPaper(null);
    setShowAnswers(false);
    try {
      const { data } = await apiClient.post<AIQuestionPaper>(
        '/teacher-ai/quiz',
        {
          classId,
          subject: subject.trim(),
          chapter: chapter.trim(),
          sourceText: sourceText.trim(),
          language,
          format,
          questionType,
          difficulty,
        },
        { timeout: 75000, signal: controller.signal }
      );
      if (!controller.signal.aborted) {
        setPaper(data);
        setNotice('✨ 10 Objective questions and teacher grading master ready in seconds!');
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  const exportRemarks = () =>
    exportCsv(
      'reviewed-student-remarks',
      [
        { key: 'name', label: 'Student Name' },
        { key: 'admission', label: 'Admission Number' },
        { key: 'average', label: 'Term Average %' },
        { key: 'attendance', label: 'Attendance %' },
        { key: 'remark', label: 'Personalized Teacher Remark' },
        { key: 'evidence', label: 'Factual Evidence' },
      ],
      (roster?.students ?? [])
        .filter(s => drafts[s.id])
        .map(s => ({
          name: s.name,
          admission: s.admissionNumber,
          average: s.average !== null ? `${s.average}%` : 'N/A',
          attendance: s.attendanceRate !== null ? `${s.attendanceRate}%` : 'N/A',
          remark: drafts[s.id].text,
          evidence: drafts[s.id].evidence.join(' | '),
        }))
    );

  const students = roster?.students ?? [];
  const pages = Math.max(1, Math.ceil(students.length / 8));
  const currentPage = Math.min(page, pages);
  const visible = students.slice((currentPage - 1) * 8, currentPage * 8);
  const base = user && predictiveAnalyticsRoles.includes(user.role) ? '/school' : '/teacher';

  return (
    <div className="ai-studio">
      <div className="ai-screen content-stack">
        <PageHeading
          eyebrow="AI & INTELLIGENT ACADEMIC COPILOT"
          title="AI Teaching & Academic Studio"
          description="Automate term-end report card remarks, generate 5E lesson plans in 10 seconds, and produce printable student worksheets."
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/copilot"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                Ask ERP Copilot
              </Link>
            </div>
          }
        />

        {error && (
          <div className="state-box" role="alert">
            {error}
            {!options && (
              <Button variant="outline" size="sm" onClick={() => void loadOptions()}>
                Try again
              </Button>
            )}
          </div>
        )}
        {notice && <div className="state-box success" role="status">{notice}</div>}

        {!options ? (
          !error && <div className="panel panel-body" role="status">Loading your teaching workspace…</div>
        ) : (
          <>
            <div className="analytics-intro">
              <Sparkles size={25} />
              <div>
                <strong>
                  {configured ? 'Intelligent Academic Copilot Active' : 'AI teaching tools need configuration'}
                </strong>
                <p>{options.status.message}</p>
                <small>
                  Uses real attendance, exam scores, and classroom observations. Review and approve before finalizing report cards.
                </small>
              </div>
            </div>

            {!options.classes.length ? (
              <EmptyState
                title="No assigned classes"
                description="Ask your administrator to link your staff account and timetable assignments."
              />
            ) : (
              <>
                {/* Global Controls */}
                <div className="ai-controls panel panel-body">
                  <label className="field">
                    Class
                    <select
                      aria-label="Class"
                      value={classId}
                      disabled={busy || !!saving}
                      onChange={e => setClassId(e.target.value)}
                    >
                      {options.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Report-card term
                    <select
                      aria-label="Report-card term"
                      value={termId}
                      disabled={busy || !!saving}
                      onChange={e => setTermId(e.target.value)}
                    >
                      <option value="">Select term</option>
                      {options.terms.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Language
                    <select
                      aria-label="Language"
                      value={language}
                      disabled={busy}
                      onChange={e => setLanguage(e.target.value as TeachingLanguage)}
                    >
                      {languages.map(l => (
                        <option key={l} value={l}>
                          {l === 'Malayalam' ? 'Malayalam (മലയാളം)' : l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Main Tabs */}
                <div className="section-tabs" role="group" aria-label="Teaching tools">
                  <button
                    className={tab === 'scheme-of-work' ? 'selected' : ''}
                    aria-pressed={tab === 'scheme-of-work'}
                    disabled={busy}
                    onClick={() => setTab('scheme-of-work')}
                  >
                    <BookOpen size={16} className="inline mr-2 text-emerald-600" />
                    🇰🇪 CBC Scheme of Work (KICD)
                  </button>
                  <button
                    className={tab === 'lesson-plan' ? 'selected' : ''}
                    aria-pressed={tab === 'lesson-plan'}
                    disabled={busy}
                    onClick={() => setTab('lesson-plan')}
                  >
                    <Layers size={16} className="inline mr-2 text-indigo-600" />
                    ⚡ Daily Lesson Plan (10s)
                  </button>
                  <button
                    className={tab === 'remarks' ? 'selected' : ''}
                    aria-pressed={tab === 'remarks'}
                    disabled={busy}
                    onClick={() => setTab('remarks')}
                  >
                    <FileCheck size={16} className="inline mr-2 text-blue-600" />
                    1-Click Report Card Remarks
                  </button>
                  <button
                    className={tab === 'quiz' ? 'selected' : ''}
                    aria-pressed={tab === 'quiz'}
                    disabled={busy}
                    onClick={() => setTab('quiz')}
                  >
                    <HelpCircle size={16} className="inline mr-2 text-amber-600" />
                    Quiz & Worksheet Maker (PDF)
                  </button>
                </div>

                {/* TAB 1: REPORT CARD REMARKS GENERATOR */}
                {tab === 'remarks' && (
                  <Panel
                    title="AI Automated Report Card Remarks Generator"
                    subtitle="Analyzes marks, attendance, and behavior in 1 click to produce personalized CBC/curriculum feedback for every student."
                  >
                    {/* Tone Selector */}
                    <div className="bg-gray-50 border-b border-gray-200 p-4">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">
                        Pedagogical Feedback Framework:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {TONE_PRESETS.map(t => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setTone(t.key)}
                            className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                              tone === t.key
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-sm font-semibold'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="block">{t.label}</span>
                            <span className="text-[11px] text-gray-500 font-normal leading-tight block mt-0.5">
                              {t.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="panel-body ai-action-row">
                      <Button
                        size="sm"
                        isLoading={busy}
                        disabled={!configured || !selected.length || rosterLoading || !!saving}
                        leftIcon={<Sparkles size={15} />}
                        onClick={() => void generateRemarks()}
                      >
                        1-Click Generate Selected Remarks ({selected.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busy || !Object.keys(drafts).length || rosterLoading || !!saving}
                        leftIcon={<CheckCircle2 size={15} />}
                        onClick={() => void saveAllDrafts()}
                      >
                        1-Click Approve & Save All Drafts ({Object.keys(drafts).length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || !termId || !classId || rosterLoading || !!saving}
                        onClick={() => void prepare()}
                      >
                        Prepare Draft Report Cards
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Download size={15} />}
                        disabled={!Object.keys(drafts).length || busy}
                        onClick={exportRemarks}
                      >
                        Export Drafts CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || rosterLoading}
                        onClick={() => {
                          setError('');
                          void loadRoster();
                        }}
                      >
                        Reload Roster
                      </Button>
                    </div>

                    {rosterLoading ? (
                      <div className="panel-body" role="status">Loading class evidence…</div>
                    ) : !termId ? (
                      <EmptyState title="Select a term" description="Choose a term to load saved marks and attendance." />
                    ) : !students.length ? (
                      <EmptyState title="No active students in this class" />
                    ) : (
                      <>
                        <div className="ai-selection">
                          <label>
                            <input
                              type="checkbox"
                              aria-label="Select all students"
                              checked={selected.length === students.length}
                              disabled={busy}
                              onChange={e => setSelected(e.target.checked ? students.map(s => s.id) : [])}
                            />{' '}
                            Select all {students.length} students
                          </label>
                          <span>Saves hours of typing: review and approve with one click.</span>
                        </div>

                        <div className="ai-remark-list">
                          {visible.map(student => (
                            <section className="ai-remark" key={student.id}>
                              <div className="ai-remark-heading">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(student.id)}
                                    aria-label={`Select ${student.name}`}
                                    disabled={busy}
                                    onChange={e =>
                                      setSelected(current =>
                                        e.target.checked
                                          ? [...current, student.id]
                                          : current.filter(id => id !== student.id)
                                      )
                                    }
                                  />
                                  <strong>{student.name}</strong>
                                </label>
                                <span className="pill neutral">
                                  {student.reportCard?.status.replaceAll('_', ' ').toLowerCase() ?? 'No report card'}
                                </span>
                              </div>

                              <p className="muted ai-evidence-summary">
                                {student.admissionNumber} · Term average: {student.average === null ? 'No marks' : `${student.average}%`} ·
                                Recorded attendance: {student.attendanceRate === null ? 'No records' : `${student.attendanceRate}% across ${student.attendanceDays} days`}
                              </p>

                              <div className="ai-remark-fields">
                                <label className="field">
                                  Classroom behaviour & observation (optional)
                                  <textarea
                                    aria-label={`Behaviour observation for ${student.name}`}
                                    maxLength={800}
                                    value={observations[student.id] || ''}
                                    disabled={busy}
                                    placeholder="e.g. Shows exceptional teamwork, highly inquisitive during labs, builds confidence in public speaking."
                                    onChange={e => setObservations(current => ({ ...current, [student.id]: e.target.value }))}
                                  />
                                </label>
                                <label className="field">
                                  {drafts[student.id] ? 'AI Draft Remark (Edit before saving)' : 'Current Report Card Remark'}
                                  <textarea
                                    aria-label={`Remark for ${student.name}`}
                                    maxLength={2000}
                                    disabled={busy || (!drafts[student.id] && !student.reportCard) || saving === student.id}
                                    value={drafts[student.id]?.text ?? student.reportCard?.comment ?? ''}
                                    placeholder="Click 'Generate Remarks' to create a personalized draft from student evidence."
                                    onChange={e =>
                                      setDrafts(current => ({
                                        ...current,
                                        [student.id]: {
                                          studentId: student.id,
                                          evidence: current[student.id]?.evidence || [],
                                          text: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                              </div>

                              {drafts[student.id] && (
                                <>
                                  <ul className="ai-source-list">
                                    {drafts[student.id].evidence.map((e, i) => (
                                      <li key={i}>{e}</li>
                                    ))}
                                  </ul>
                                  <div className="ai-action-row">
                                    <Button
                                      size="sm"
                                      isLoading={saving === student.id}
                                      disabled={busy || !!saving || student.reportCard?.status !== 'DRAFT' || drafts[student.id].text.trim().length < 10}
                                      onClick={() => void save(student.id)}
                                    >
                                      Approve & Save Remark
                                    </Button>
                                    {student.reportCard?.status !== 'DRAFT' && (
                                      <span className="muted text-xs">
                                        {student.reportCard ? 'Approved reports are locked.' : 'Prepare a draft report card first.'}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </section>
                          ))}
                        </div>

                        <div className="table-pagination">
                          <span>
                            {(currentPage - 1) * 8 + 1}–{Math.min(currentPage * 8, students.length)} of {students.length} students
                          </span>
                          <div className="flex gap-3">
                            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                              Previous
                            </Button>
                            <Button size="sm" variant="outline" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </Panel>
                )}

                {/* TAB 1: CBC SCHEME OF WORK GENERATOR (KICD) */}
                {tab === 'scheme-of-work' && (
                  <Panel
                    title="🇰🇪 Kenyan CBC / KICD Scheme of Work Generator"
                    subtitle="Generate a complete termly Scheme of Work matrix compliant with KICD standards in 10 seconds. Includes Strands, Sub-strands, Specific Learning Outcomes, Key Inquiry Questions, Learning Experiences, Resources, and Assessment Rubrics."
                  >
                    <div className="panel-body content-stack">
                      {/* Presets */}
                      <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                        <span className="text-xs font-semibold text-emerald-950 uppercase tracking-wider block mb-2">
                          Quick Kenyan CBC Syllabus Presets:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {CBC_SCHEME_PRESETS.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSowSubject(p.subject);
                                setSowStrand(p.strand);
                                setSowSubStrand(p.subStrand);
                              }}
                              className="text-xs bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <strong>{p.subject}:</strong> {p.strand}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-grid">
                        <label className="field">
                          Learning Area / Subject
                          <input
                            required
                            value={sowSubject}
                            disabled={busy}
                            onChange={e => setSowSubject(e.target.value)}
                            placeholder="e.g. Integrated Science, Mathematics, Agriculture & Nutrition"
                          />
                        </label>
                        <label className="field">
                          Strand (Main Topic Theme)
                          <input
                            required
                            value={sowStrand}
                            disabled={busy}
                            onChange={e => setSowStrand(e.target.value)}
                            placeholder="e.g. Living Things, Numbers and Operations, Soil Conservation"
                          />
                        </label>
                        <label className="field">
                          Sub-Strand (Specific Unit)
                          <input
                            value={sowSubStrand}
                            disabled={busy}
                            onChange={e => setSowSubStrand(e.target.value)}
                            placeholder="e.g. Plant and Animal Adaptations (Optional)"
                          />
                        </label>
                      </div>

                      <div className="ai-controls">
                        <label className="field">
                          Term
                          <select
                            value={sowTermNumber}
                            disabled={busy}
                            onChange={e => setSowTermNumber(Number(e.target.value))}
                          >
                            <option value={1}>Term 1 (Opening Term)</option>
                            <option value={2}>Term 2 (Mid-Year Term)</option>
                            <option value={3}>Term 3 (Culmination Term)</option>
                          </select>
                        </label>

                        <label className="field">
                          Weeks Planned
                          <select
                            value={sowWeeksCount}
                            disabled={busy}
                            onChange={e => setSowWeeksCount(Number(e.target.value))}
                          >
                            <option value={6}>6 Weeks (Short Term)</option>
                            <option value={8}>8 Weeks</option>
                            <option value={10}>10 Weeks (Standard KICD Term)</option>
                            <option value={12}>12 Weeks (Extended Term)</option>
                          </select>
                        </label>

                        <label className="field">
                          Lessons / Week
                          <select
                            value={sowLessonsPerWeek}
                            disabled={busy}
                            onChange={e => setSowLessonsPerWeek(Number(e.target.value))}
                          >
                            <option value={3}>3 Lessons / Week</option>
                            <option value={4}>4 Lessons / Week (Standard)</option>
                            <option value={5}>5 Lessons / Week</option>
                          </select>
                        </label>

                        <label className="field">
                          Curriculum Framework
                          <select
                            value={sowCurriculum}
                            disabled={busy}
                            onChange={e => setSowCurriculum(e.target.value as any)}
                          >
                            <option value="CBC">Kenyan CBC (KICD Framework)</option>
                            <option value="STANDARD">Standard National Curriculum</option>
                            <option value="CAMBRIDGE">Cambridge Lower Secondary</option>
                            <option value="NCERT">NCERT / CBSE Framework</option>
                          </select>
                        </label>
                      </div>

                      <div>
                        <Button
                          isLoading={busy}
                          disabled={!configured || !classId || !sowSubject.trim() || !sowStrand.trim()}
                          leftIcon={<Zap size={16} />}
                          onClick={() => void handleGenerateSchemeOfWork()}
                        >
                          Generate CBC Scheme of Work in 10s
                        </Button>
                      </div>

                      {/* Generated Scheme of Work Display */}
                      {schemeOfWork && (
                        <div className="mt-6 border border-emerald-200 rounded-2xl bg-white p-6 shadow-sm space-y-6">
                          <div className="flex flex-col md:flex-row items-start justify-between border-b pb-4 gap-4">
                            <div>
                              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                REPUBLIC OF KENYA · {schemeOfWork.curriculum} · {schemeOfWork.term} ({schemeOfWork.academicYear})
                              </span>
                              <h2 className="text-2xl font-bold text-gray-900 mt-2">{schemeOfWork.title}</h2>
                              <p className="text-sm text-gray-600 mt-0.5">
                                <strong>Strand:</strong> {schemeOfWork.strand} · <strong>Level:</strong> {schemeOfWork.gradeLevel} · <strong>Total Lessons:</strong> {schemeOfWork.weeks.length} Lessons Planned
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                leftIcon={<Printer size={14} />}
                                onClick={() => openPrintableSchemeOfWork(schemeOfWork)}
                              >
                                Print / Save PDF (Landscape)
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                leftIcon={<Send size={14} />}
                                onClick={() => {
                                  const sowMsg = `📋 **${schemeOfWork.title}**\n\n🏛️ **Strand:** ${schemeOfWork.strand} | **Term:** ${schemeOfWork.term} (${schemeOfWork.academicYear})\n\n🎯 **General Outcomes (പഠന ലക്ഷ്യങ്ങൾ):**\n${schemeOfWork.generalOutcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n✨ **Core Competencies & Values:** ${schemeOfWork.coreCompetencies.slice(0, 4).join(', ')}\n\n📅 **Weekly Overview:** ${schemeOfWork.weeks.length} Lessons scheduled. Inquiry tasks and materials will be shared as each unit begins.`;
                                  setChatPayload({
                                    title: schemeOfWork.title,
                                    content: sowMsg,
                                    type: 'SCHEME_OF_WORK',
                                  });
                                  setChatModalOpen(true);
                                }}
                              >
                                Share to Class Chat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Download size={14} />}
                                onClick={() => downloadText(`${sowStrand.toLowerCase().replace(/\\s+/g, '-')}-scheme-of-work.txt`, schemeOfWorkText(schemeOfWork))}
                              >
                                Download TXT
                              </Button>
                            </div>
                          </div>

                          {/* General Outcomes & Competencies */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                                🎯 General Learning Outcomes (പഠന ലക്ഷ്യങ്ങൾ)
                              </h3>
                              <ul className="text-xs text-gray-800 space-y-1.5 list-disc list-inside">
                                {schemeOfWork.generalOutcomes.map((obj, i) => (
                                  <li key={i}>{obj}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                ✨ Core Competencies, Values & PCIs
                              </h3>
                              <div className="space-y-1.5 text-xs text-slate-700">
                                <div><strong>Competencies:</strong> {schemeOfWork.coreCompetencies.join(', ')}</div>
                                <div><strong>Values:</strong> {schemeOfWork.values.join(', ')}</div>
                                <div><strong>PCIs:</strong> {schemeOfWork.pcis.join(', ')}</div>
                              </div>
                            </div>
                          </div>

                          {/* Weekly Lessons Table */}
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                              📅 Weekly Scheme Breakdown ({schemeOfWork.weeks.length} Lessons)
                            </h3>
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-gray-100 text-gray-800 border-b font-semibold">
                                    <th className="p-2.5 w-12 text-center">Wk</th>
                                    <th className="p-2.5 w-12 text-center">Les</th>
                                    <th className="p-2.5 w-44">Sub-Strand</th>
                                    <th className="p-2.5 min-w-[200px]">Specific Learning Outcomes (SLOs)</th>
                                    <th className="p-2.5 min-w-[160px]">Key Inquiry Questions</th>
                                    <th className="p-2.5 min-w-[180px]">Learning Experiences</th>
                                    <th className="p-2.5 min-w-[140px]">Resources</th>
                                    <th className="p-2.5 min-w-[120px]">Assessment</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {schemeOfWork.weeks.map((w, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                      <td className="p-2.5 text-center font-bold text-gray-700">{w.week}</td>
                                      <td className="p-2.5 text-center font-semibold text-gray-600">{w.lessonNumber}</td>
                                      <td className="p-2.5 font-medium text-emerald-950">{w.subStrand}</td>
                                      <td className="p-2.5">
                                        <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                                          {w.specificLearningOutcomes.map((slo, sIdx) => (
                                            <li key={sIdx}>{slo}</li>
                                          ))}
                                        </ul>
                                      </td>
                                      <td className="p-2.5 text-indigo-900 italic">
                                        {w.keyInquiryQuestions.map((q, qIdx) => (
                                          <div key={qIdx} className="mb-1">? {q}</div>
                                        ))}
                                      </td>
                                      <td className="p-2.5 text-gray-600">
                                        {w.learningExperiences.map((le, lIdx) => (
                                          <div key={lIdx} className="mb-0.5">• {le}</div>
                                        ))}
                                      </td>
                                      <td className="p-2.5 text-gray-500 text-[11px]">{w.learningResources.join('; ')}</td>
                                      <td className="p-2.5 text-gray-600 font-medium">{w.assessmentMethods.join(', ')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Assessment Rubrics */}
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                              📊 CBC / KNEC 4-Level Assessment Rubrics
                            </h3>
                            <div className="space-y-3">
                              {schemeOfWork.assessmentRubrics.map((r, rIdx) => (
                                <div key={rIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                                  <div className="bg-gray-100 px-3.5 py-2 font-bold text-xs text-gray-800">
                                    Criterion: {r.criterion}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-xs">
                                    {r.levels.map((lvl, lIdx) => (
                                      <div key={lIdx} className="p-3 bg-white">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${
                                          lvl.level === 'EXCEEDING' ? 'bg-emerald-100 text-emerald-800' :
                                          lvl.level === 'MEETING' ? 'bg-blue-100 text-blue-800' :
                                          lvl.level === 'APPROACHING' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          {lvl.level} ({lvl.scoreRange})
                                        </span>
                                        <p className="text-gray-700 text-[11px] leading-relaxed mt-1">{lvl.descriptor}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>
                )}

                {/* TAB 2: LESSON PLAN GENERATOR */}
                {tab === 'lesson-plan' && (
                  <Panel
                    title="10-Second AI 5E Lesson Plan Generator"
                    subtitle="Select subject and topic to generate a comprehensive 5E lesson plan with objectives, inquiry flow, differentiation, and rubrics."
                  >
                    <div className="panel-body content-stack">
                      {/* Topic Presets */}
                      <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                        <span className="text-xs font-semibold text-indigo-950 uppercase tracking-wider block mb-2">
                          Quick Syllabus Chapter Presets:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {SYLLABUS_PRESETS.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setLpSubject(p.subject);
                                setLpChapter(p.topic);
                              }}
                              className="text-xs bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <strong>{p.subject}:</strong> {p.topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-grid">
                        <label className="field">
                          Subject
                          <input
                            required
                            value={lpSubject}
                            disabled={busy}
                            onChange={e => setLpSubject(e.target.value)}
                            placeholder="e.g. Integrated Science, Mathematics, Biology"
                          />
                        </label>
                        <label className="field">
                          Chapter or Topic
                          <input
                            required
                            value={lpChapter}
                            disabled={busy}
                            onChange={e => setLpChapter(e.target.value)}
                            placeholder="e.g. Photosynthesis, Quadratic Equations"
                          />
                        </label>
                      </div>

                      <div className="ai-controls">
                        <label className="field">
                          Lesson Duration
                          <select
                            value={lpDuration}
                            disabled={busy}
                            onChange={e => setLpDuration(Number(e.target.value))}
                          >
                            <option value={40}>40 Minutes (Standard Period)</option>
                            <option value={45}>45 Minutes (Extended Period)</option>
                            <option value={60}>60 Minutes (Double Period)</option>
                            <option value={80}>80 Minutes (Lab Block)</option>
                          </select>
                        </label>

                        <label className="field">
                          Curriculum Framework
                          <select
                            value={lpCurriculum}
                            disabled={busy}
                            onChange={e => setLpCurriculum(e.target.value as any)}
                          >
                            <option value="CBC">CBC (Competency-Based Curriculum)</option>
                            <option value="STANDARD">Standard National Curriculum</option>
                            <option value="CAMBRIDGE">Cambridge / IGCSE Framework</option>
                            <option value="NCERT">NCERT / CBSE Curriculum</option>
                          </select>
                        </label>
                      </div>

                      <div>
                        <Button
                          isLoading={busy}
                          disabled={!configured || !classId || !lpSubject.trim() || !lpChapter.trim()}
                          leftIcon={<Zap size={16} />}
                          onClick={() => void handleGenerateLessonPlan()}
                        >
                          Generate 5E Lesson Plan in 10s
                        </Button>
                      </div>

                      {/* Display Generated Lesson Plan */}
                      {lessonPlan && (
                        <div className="mt-6 border border-gray-200 rounded-2xl bg-white p-6 shadow-sm space-y-6">
                          <div className="flex items-start justify-between border-b pb-4">
                            <div>
                              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                                5E INSTRUCTIONAL MODEL · {lessonPlan.curriculum}
                              </span>
                              <h2 className="text-2xl font-bold text-gray-900 mt-1">{lessonPlan.title}</h2>
                              <p className="text-sm text-gray-500">
                                {lessonPlan.subject} · {lessonPlan.gradeLevel} · {lessonPlan.durationMinutes} Minutes
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                leftIcon={<Printer size={14} />}
                                onClick={() => openPrintableLessonPlan(lessonPlan)}
                              >
                                Print / Save PDF Plan
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                leftIcon={<Send size={14} />}
                                onClick={() => {
                                  const lpMsg = `📚 **${lessonPlan.title}**\n\n🎯 **Specific Learning Outcomes (പഠന ലക്ഷ്യങ്ങൾ):**\n${lessonPlan.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n❓ **Key Inquiry Questions (ഇൻക്വയറി ചോദ്യങ്ങൾ):**\n${lessonPlan.keyInquiryQuestions.map(q => `• ${q}`).join('\n')}\n\n📝 **Homework / Inquiry Task:**\n${lessonPlan.homeworkAssignment}\n\n💡 **Resources Needed:** ${lessonPlan.materials.join(', ')}`;
                                  setChatPayload({
                                    title: lessonPlan.title,
                                    content: lpMsg,
                                    type: 'LESSON_PLAN',
                                  });
                                  setChatModalOpen(true);
                                }}
                              >
                                Share to Class Chat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Download size={14} />}
                                onClick={() => downloadText(`${lpChapter.toLowerCase().replace(/\s+/g, '-')}-lesson-plan.txt`, lessonPlanText(lessonPlan))}
                              >
                                Download TXT
                              </Button>
                            </div>
                          </div>

                          {/* Objectives & Competencies */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                🎯 Specific Learning Objectives
                              </h3>
                              <ul className="text-sm text-gray-800 space-y-1.5 list-disc list-inside">
                                {lessonPlan.learningObjectives.map((obj, i) => (
                                  <li key={i}>{obj}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                💡 Core Competencies & Values
                              </h3>
                              <ul className="text-sm text-gray-800 space-y-1.5 list-disc list-inside">
                                {lessonPlan.coreCompetencies.map((comp, i) => (
                                  <li key={i}>{comp}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Key Inquiry Questions & Teaching Materials */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                                ❓ Key Inquiry Questions
                              </h3>
                              <ul className="text-sm text-indigo-900 space-y-1.5 list-disc list-inside">
                                {lessonPlan.keyInquiryQuestions.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                📦 Teaching Aids & Resources
                              </h3>
                              <ul className="text-sm text-gray-800 space-y-1.5 list-disc list-inside">
                                {lessonPlan.materials.map((mat, i) => (
                                  <li key={i}>{mat}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* 5E Instructional Sequence */}
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Clock size={16} className="text-primary-600" />
                              5E Instructional Phase Breakdown ({lessonPlan.durationMinutes} Minutes)
                            </h3>
                            <div className="space-y-3">
                              {lessonPlan.steps.map((step, idx) => (
                                <div
                                  key={idx}
                                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800 font-mono">
                                        {step.phase}
                                      </span>
                                      <strong className="text-gray-900 text-sm">{step.title}</strong>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500">
                                      ⏱ {step.durationMinutes} mins
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 mt-2">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                      <span className="font-semibold text-gray-900 block mb-1">Teacher Activity:</span>
                                      {step.teacherActivity}
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                      <span className="font-semibold text-gray-900 block mb-1">Student Activity:</span>
                                      {step.studentActivity}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Differentiated Instruction */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                                🤝 Support for Struggling Learners
                              </h3>
                              <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                                {lessonPlan.differentiatedInstruction.supportForStruggling.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                                🚀 Extension for Advanced Learners
                              </h3>
                              <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                                {lessonPlan.differentiatedInstruction.extensionForAdvanced.map((e, i) => (
                                  <li key={i}>{e}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* 4-Level Assessment Rubric */}
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                              📊 Assessment Rubrics & Evaluation Criteria
                            </h3>
                            <div className="space-y-4">
                              {lessonPlan.assessmentRubrics.map((rubric, rIdx) => (
                                <div key={rIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                                  <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-800">
                                    Criterion: {rubric.criterion}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 text-xs">
                                    {rubric.levels.map((lvl, lIdx) => (
                                      <div key={lIdx} className="p-3 bg-white">
                                        <span className={`pill mb-1 inline-block ${
                                          lvl.level === 'EXCEEDING' ? '' : lvl.level === 'MEETING' ? 'neutral' : lvl.level === 'APPROACHING' ? 'warning' : 'danger'
                                        }`}>
                                          {lvl.level}
                                        </span>
                                        <span className="block text-[11px] font-semibold text-gray-500 mb-1">
                                          {lvl.scoreRange}
                                        </span>
                                        <p className="text-gray-700 leading-relaxed">{lvl.descriptor}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Homework Assignment */}
                          <div className="bg-primary-50 p-4 rounded-xl border border-primary-200 text-xs text-primary-950">
                            <strong className="block font-bold text-primary-900 mb-1">
                              📝 Homework & Extension Assignment:
                            </strong>
                            <p>{lessonPlan.homeworkAssignment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>
                )}

                {/* TAB 3: QUIZ & WORKSHEET MAKER */}
                {tab === 'quiz' && (
                  <Panel
                    title="10-Second Quiz & Worksheet Maker"
                    subtitle="Generates 10 objective questions with rubrics and separate teacher answer key, ready to export or print as PDF."
                  >
                    <form
                      className="panel-body content-stack"
                      onSubmit={e => {
                        e.preventDefault();
                        void generateQuiz();
                      }}
                    >
                      <div className="form-grid">
                        <label className="field">
                          Subject
                          <input
                            aria-label="Subject"
                            required
                            minLength={2}
                            maxLength={100}
                            value={subject}
                            disabled={busy}
                            onChange={e => setSubject(e.target.value)}
                          />
                        </label>
                        <label className="field">
                          Chapter or topic
                          <input
                            aria-label="Chapter or topic"
                            required
                            minLength={2}
                            maxLength={150}
                            value={chapter}
                            disabled={busy}
                            onChange={e => setChapter(e.target.value)}
                          />
                        </label>
                      </div>

                      <div className="ai-controls">
                        <label className="field">
                          Format
                          <select
                            aria-label="Format"
                            value={format}
                            disabled={busy}
                            onChange={e => setFormat(e.target.value)}
                          >
                            <option value="QUIZ">Quiz</option>
                            <option value="WORKSHEET">Worksheet</option>
                            <option value="QUESTION_PAPER">Question paper</option>
                          </select>
                        </label>
                        <label className="field">
                          Question type
                          <select
                            aria-label="Question type"
                            value={questionType}
                            disabled={busy}
                            onChange={e => setQuestionType(e.target.value)}
                          >
                            <option value="MCQ">Multiple choice (MCQs)</option>
                            <option value="SHORT_ANSWER">Short answer</option>
                            <option value="MIXED">Mixed</option>
                          </select>
                        </label>
                        <label className="field">
                          Difficulty
                          <select
                            aria-label="Difficulty"
                            value={difficulty}
                            disabled={busy}
                            onChange={e => setDifficulty(e.target.value)}
                          >
                            <option value="FOUNDATION">Foundation</option>
                            <option value="STANDARD">Standard</option>
                            <option value="CHALLENGE">Challenge</option>
                          </select>
                        </label>
                      </div>

                      <label className="field">
                        Chapter or syllabus content
                        <textarea
                          aria-label="Chapter or syllabus content"
                          className="ai-source-input"
                          required
                          minLength={80}
                          maxLength={20000}
                          value={sourceText}
                          disabled={busy}
                          placeholder="Paste lesson or textbook content. Questions will be strictly grounded in this source."
                          onChange={e => setSourceText(e.target.value)}
                        />
                        <small className="muted">
                          {sourceText.length.toLocaleString()} / 20,000 characters · minimum 80
                        </small>
                      </label>

                      <div>
                        <Button
                          type="submit"
                          isLoading={busy}
                          disabled={!configured || !classId}
                          leftIcon={<Sparkles size={16} />}
                        >
                          Generate 10 Objective Questions
                        </Button>
                      </div>
                    </form>
                  </Panel>
                )}

                {tab === 'quiz' && paper && (
                  <Panel
                    title={paper.title}
                    subtitle={`${paper.questions.length} questions · ${paper.questions.reduce((n, q) => n + q.marks, 0)} marks · Formatted Worksheet`}
                  >
                    <div className="panel-body content-stack">
                      <p className="text-sm text-gray-700">{paper.instructions}</p>
                      {paper.warnings.map((warning, i) => (
                        <div key={i} className="state-box">{warning}</div>
                      ))}

                      <div className="ai-action-row">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<FileText size={15} />}
                          onClick={() => openPrintableWorksheet(paper, false)}
                        >
                          Print / Save PDF Worksheet
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<FileCheck size={15} />}
                          onClick={() => openPrintableWorksheet(paper, true)}
                        >
                          Print / Save PDF Teacher Key
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download size={15} />}
                          onClick={() => downloadText('student-question-paper.txt', paperText(paper))}
                        >
                          Download Text
                        </Button>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showAnswers}
                            onChange={e => setShowAnswers(e.target.checked)}
                          />{' '}
                          Show Teacher Answer Key & Explanations
                        </label>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-4 pt-2">
                        {paper.questions.map((q, i) => (
                          <article className="ai-question p-4 rounded-xl border border-gray-200 bg-white" key={i}>
                            <div className="ai-question-heading flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {i + 1}. {q.question}
                              </h3>
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {q.marks} marks
                              </span>
                            </div>

                            {q.options.length > 0 && (
                              <ol className="list-[upper-alpha] list-inside space-y-1 text-xs text-gray-700 my-2 pl-2">
                                {q.options.map((option, oIdx) => (
                                  <li key={oIdx} className="leading-relaxed">
                                    {option}
                                  </li>
                                ))}
                              </ol>
                            )}

                            {showAnswers && (
                              <div className="ai-answer mt-3 p-3 bg-emerald-50 rounded-lg text-xs border border-emerald-200">
                                <strong className="text-emerald-900 block mb-0.5">Correct Answer: {q.answer}</strong>
                                <p className="text-emerald-800">{q.explanation}</p>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  </Panel>
                )}

                <div className="ai-action-row muted text-xs pt-4">
                  <Link className="panel-link" href={`${base}/grades`}>
                    Open gradebook →
                  </Link>
                  <Link className="panel-link" href="/dashboard/copilot">
                    Ask ERP Copilot →
                  </Link>
                  {base === '/school' && (
                    <Link className="panel-link" href="/school/report-cards">
                      Report-card approval & publishing →
                    </Link>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Printable Sheet for Student Questions */}
      {paper && (
        <section className="ai-print-paper hidden print:block">
          <div className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase">{paper.title}</h1>
            <div className="flex justify-between text-xs mt-3">
              <span>Student Name: ____________________________________</span>
              <span>Class: __________</span>
              <span>Date: __________</span>
              <span>Max Marks: {paper.questions.reduce((n, q) => n + q.marks, 0)}</span>
            </div>
            <p className="text-xs italic mt-2">{paper.instructions}</p>
          </div>

          <div className="space-y-6">
            {paper.questions.map((q, i) => (
              <article key={i} className="text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span>{i + 1}. {q.question}</span>
                  <span>[{q.marks} Marks]</span>
                </div>
                {q.options.length > 0 ? (
                  <ol className="list-[upper-alpha] list-inside space-y-1 ml-4">
                    {q.options.map((option, oIdx) => (
                      <li key={oIdx}>{option}</li>
                    ))}
                  </ol>
                ) : (
                  <div className="h-16 border-b border-dashed border-gray-400 mt-2" />
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Printable Sheet for Lesson Plan */}
      {lessonPlan && (
        <section className="hidden print:block p-8">
          <h1 className="text-2xl font-bold">{lessonPlan.title}</h1>
          <p className="text-sm">{lessonPlan.subject} · {lessonPlan.gradeLevel} · {lessonPlan.durationMinutes} Minutes</p>
          <hr className="my-4" />
          <h2 className="font-bold text-sm uppercase">Learning Objectives:</h2>
          <ul className="list-disc list-inside text-xs mb-4">
            {lessonPlan.learningObjectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
          <h2 className="font-bold text-sm uppercase">5E Instructional Cycle:</h2>
          {lessonPlan.steps.map((s, i) => (
            <div key={i} className="mb-3 text-xs">
              <strong>[{s.phase}] {s.title} ({s.durationMinutes} min)</strong>
              <p>Teacher: {s.teacherActivity}</p>
              <p>Student: {s.studentActivity}</p>
            </div>
          ))}
        </section>
      )}

      {/* Class Chat Sharing Modal */}
      {chatModalOpen && chatPayload && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-primary-600" size={20} />
                <h3 className="font-bold text-gray-900">Share to Class Chat (കുട്ടികൾക്ക് അയക്കുക)</h3>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <p className="text-xs text-gray-600">
                This will post the lesson plan or scheme of work summary, learning outcomes, inquiry questions, and tasks directly into the class chat channel for students and parents to view.
              </p>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Title</label>
                <input
                  className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 text-gray-800 font-medium"
                  value={chatPayload.title}
                  onChange={e => setChatPayload({ ...chatPayload, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Message Preview</label>
                <textarea
                  rows={8}
                  className="w-full text-xs font-mono border rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-primary-500"
                  value={chatPayload.content}
                  onChange={e => setChatPayload({ ...chatPayload, content: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setChatModalOpen(false)} disabled={sharingChat}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={sharingChat}
                leftIcon={<Send size={14} />}
                onClick={() => void handleShareToChat(chatPayload)}
              >
                Send to Class Chat Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

