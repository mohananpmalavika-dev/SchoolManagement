'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  GraduationCap,
  Medal,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import {
  StudentDigitalPortfolio,
  StudentBadge,
  PortfolioAchievement,
  PortfolioProject,
  BadgeCategory,
  BadgeRarity,
} from '@krypton/types';
import { PortfolioStore, BADGE_LIBRARY } from '@/lib/portfolio-client';
import { Button } from '@/components/ui';

interface StudentDigitalPortfolioHubProps {
  portal?: 'student' | 'teacher' | 'dashboard' | 'parent';
  initialStudentId?: string;
}

export function StudentDigitalPortfolioHub({
  portal = 'dashboard',
  initialStudentId = 'std-14',
}: StudentDigitalPortfolioHubProps) {
  const [portfolios, setPortfolios] = useState<StudentDigitalPortfolio[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BADGES' | 'ACHIEVEMENTS' | 'PROJECTS' | 'CERTIFICATES'>('OVERVIEW');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Modals
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedBadgeCode, setSelectedBadgeCode] = useState(BADGE_LIBRARY[0]?.code || '');
  const [badgeCustomReason, setBadgeCustomReason] = useState('');
  const [awardedByTeacher, setAwardedByTeacher] = useState('Senior Faculty In-charge');

  const [isAddAchModalOpen, setIsAddAchModalOpen] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achTitleMl, setAchTitleMl] = useState('');
  const [achCategory, setAchCategory] = useState<any>('ARTS_CULTURE');
  const [achLevel, setAchLevel] = useState<any>('DISTRICT');
  const [achPosition, setAchPosition] = useState<any>('FIRST');
  const [achDesc, setAchDesc] = useState('');
  const [achOrganizer, setAchOrganizer] = useState('');
  const [achYear, setAchYear] = useState('2025-2026');

  const [isAddProjModalOpen, setIsAddProjModalOpen] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projSubject, setProjSubject] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projSkills, setProjSkills] = useState('');
  const [projScore, setProjScore] = useState('A+ (100/100)');
  const [projFeedback, setProjFeedback] = useState('');

  const refreshData = () => {
    const list = PortfolioStore.getPortfolios();
    setPortfolios(list);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activePortfolio =
    portfolios.find((p) => p.studentId === selectedStudentId) || portfolios[0] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleAwardBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !selectedBadgeCode) return;
    const awarded = PortfolioStore.awardBadge(
      activePortfolio.studentId,
      selectedBadgeCode,
      awardedByTeacher,
      badgeCustomReason
    );
    if (awarded) {
      refreshData();
      setIsAwardModalOpen(false);
      setBadgeCustomReason('');
      showToast(`🏆 Badge "${awarded.name}" successfully awarded to ${activePortfolio.name}!`);
    }
  };

  const handleAddAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !achTitle) return;
    const added = PortfolioStore.addAchievement(activePortfolio.studentId, {
      studentId: activePortfolio.studentId,
      title: achTitle,
      titleMl: achTitleMl || achTitle,
      category: achCategory,
      academicYear: achYear,
      date: new Date().toISOString().split('T')[0],
      level: achLevel,
      position: achPosition,
      description: achDesc,
      organizer: achOrganizer || 'School Authority',
      certificateNumber: `ACH-${Date.now().toString().slice(-6)}`,
    });
    if (added) {
      refreshData();
      setIsAddAchModalOpen(false);
      setAchTitle('');
      setAchTitleMl('');
      setAchDesc('');
      showToast(`✨ Achievement "${added.title}" recorded in student digital portfolio!`);
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !projTitle) return;
    const added = PortfolioStore.addProject(activePortfolio.studentId, {
      studentId: activePortfolio.studentId,
      title: projTitle,
      subject: projSubject || 'General Science',
      academicYear: '2025-2026',
      completionDate: new Date().toISOString().split('T')[0],
      description: projDesc,
      skillsAcquired: projSkills.split(',').map((s) => s.trim()).filter(Boolean),
      scoreOrGrade: projScore,
      teacherFeedback: projFeedback || 'Excellent dedication and creative execution.',
      featured: true,
    });
    if (added) {
      refreshData();
      setIsAddProjModalOpen(false);
      setProjTitle('');
      setProjDesc('');
      setProjSkills('');
      showToast(`🚀 Capstone Project "${added.title}" added to showcase!`);
    }
  };

  if (!activePortfolio) {
    return <div className="p-8 text-center text-gray-500">Loading student portfolios...</div>;
  }

  const rarityBadgeClass = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30';
      case 'EPIC':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'RARE':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  const filteredBadges = activePortfolio.badges.filter((b) => {
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-slide-up">
          <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-emerald-300 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header and Student Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
            <Trophy size={15} />
            <span>STUDENT DIGITAL PORTFOLIO & BADGES</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Multi-Year Ledger
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Digital Profile, Achievements & Gamified Badges
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            ഓരോ കുട്ടിയുടെയും കലാ-കായിക നേട്ടങ്ങൾ, പ്രോജക്റ്റുകൾ, ലഭിച്ച സർട്ടിഫിക്കറ്റുകൾ എന്നിവ വർഷങ്ങളോളം സൂക്ഷിക്കുന്ന ഡിജിറ്റൽ പ്രൊഫൈൽ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Student Selector */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <User size={16} className="text-gray-500" />
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
            >
              {portfolios.map((p) => (
                <option key={p.studentId} value={p.studentId}>
                  {p.name} ({p.className})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          {(portal === 'teacher' || portal === 'dashboard') && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Award size={15} />}
                onClick={() => setIsAwardModalOpen(true)}
              >
                Award Badge
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus size={15} />}
                onClick={() => setIsAddAchModalOpen(true)}
              >
                Log Achievement
              </Button>
            </div>
          )}

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Printer size={15} />}
            onClick={() => window.print()}
          >
            Print / Export Portfolio PDF
          </Button>
        </div>
      </div>

      {/* Hero Student Digital Passport Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-400 to-cyan-300 p-1 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center font-bold text-3xl text-amber-300">
                {activePortfolio.name.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                Level {Math.floor(activePortfolio.totalPoints / 100)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {activePortfolio.name}
                </h2>
                <span className="text-sm font-medium text-amber-300/90 font-serif">
                  ({activePortfolio.nameMl})
                </span>
                <span className="px-3 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-400/30">
                  {activePortfolio.className} • Roll #{activePortfolio.rollNo}
                </span>
              </div>

              <p className="text-xs text-indigo-200/80 font-mono mt-1">
                Admission: {activePortfolio.admissionNumber} • Academic Cycle: {activePortfolio.academicYear}
              </p>

              <p className="text-sm text-slate-200 mt-2 max-w-2xl leading-relaxed">
                {activePortfolio.bio}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-amber-200/90 font-medium bg-white/5 w-fit px-3 py-1 rounded-lg border border-white/10">
                <Sparkles size={14} className="text-amber-400" />
                <span>Career Aspiration: {activePortfolio.careerAspirations}</span>
              </div>
            </div>
          </div>

          {/* Gamified Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:w-72 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
                <Medal size={14} />
                <span>Gamified XP</span>
              </div>
              <div className="text-2xl font-black text-white">
                {activePortfolio.totalPoints}{' '}
                <span className="text-xs text-amber-300 font-normal">pts</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold mb-1">
                <ShieldCheck size={14} />
                <span>Attendance</span>
              </div>
              <div className="text-2xl font-black text-white">
                {activePortfolio.attendanceRate}%
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold mb-1">
                <GraduationCap size={14} />
                <span>Average Marks</span>
              </div>
              <div className="text-2xl font-black text-white">
                {activePortfolio.academicAverage}%
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold mb-1">
                <Award size={14} />
                <span>Badges Earned</span>
              </div>
              <div className="text-2xl font-black text-white">
                {activePortfolio.badges.length}{' '}
                <span className="text-xs text-purple-200 font-normal">unlocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Overview & Multi-Year Timeline
        </button>
        <button
          onClick={() => setActiveTab('BADGES')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'BADGES'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Trophy size={16} />
          Digital Badges & Medals ({activePortfolio.badges.length})
        </button>
        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'ACHIEVEMENTS'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Award size={16} />
          Arts & Sports Milestones ({activePortfolio.achievements.length})
        </button>
        <button
          onClick={() => setActiveTab('PROJECTS')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'PROJECTS'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BookOpen size={16} />
          STEM & Capstone Projects ({activePortfolio.projects.length})
        </button>
        <button
          onClick={() => setActiveTab('CERTIFICATES')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'CERTIFICATES'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <CheckCircle2 size={16} />
          Verified Credentials ({activePortfolio.certificates.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & MULTI-YEAR TIMELINE */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Featured Badges Row */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h3 className="font-bold text-gray-900 text-base">Key Badges & Honors</h3>
                </div>
                <button
                  onClick={() => setActiveTab('BADGES')}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View all ({activePortfolio.badges.length}) <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activePortfolio.badges.slice(0, 3).map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200 hover:border-indigo-300 transition-all shadow-sm"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rarityBadgeClass(badge.rarity)}`}>
                        {badge.rarity}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">+{badge.points} XP</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm leading-snug">{badge.name}</h4>
                    <p className="text-[11px] text-amber-900/80 font-medium font-serif mt-0.5">
                      {badge.nameMl}
                    </p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Year Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-base">Multi-Year Chronological Journey</h3>
                </div>
                <span className="text-xs text-gray-500 font-medium">Permanent Record</span>
              </div>

              <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6">
                {activePortfolio.achievements.map((ach) => (
                  <div key={ach.id} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow" />

                    <div className="bg-gray-50 hover:bg-indigo-50/50 p-4 rounded-xl border border-gray-200 transition-all">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-mono font-semibold text-indigo-700">
                          {ach.date} • {ach.academicYear}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                          {ach.level} LEVEL • {ach.position}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">{ach.title}</h4>
                      <p className="text-xs text-amber-900/90 font-serif mt-0.5">{ach.titleMl}</p>
                      <p className="text-xs text-gray-600 mt-2">{ach.description}</p>
                      <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
                        <span>Organized by: {ach.organizer}</span>
                        {ach.isVerified && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Verified by {ach.verifiedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {activePortfolio.projects.map((prj) => (
                  <div key={prj.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-purple-600 shadow" />
                    <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-200 transition-all">
                      <div className="flex items-center justify-between text-xs text-purple-700 mb-1">
                        <span className="font-mono font-semibold">
                          {prj.completionDate} • {prj.academicYear}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold text-[10px]">
                          SCORE: {prj.scoreOrGrade}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Project: {prj.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{prj.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {prj.skillsAcquired.map((s, idx) => (
                          <span key={idx} className="bg-white text-purple-900 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Verified Credentials & Quick Links */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-gray-900 text-base">Verified Credentials</h3>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Tamper-Proof
                </span>
              </div>

              <div className="space-y-3">
                {activePortfolio.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900 leading-tight">{cert.title}</span>
                    </div>
                    {cert.titleMl && (
                      <p className="text-[11px] text-amber-900 font-serif">{cert.titleMl}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-1 border-t border-gray-200/60">
                      <span>Ref: {cert.certNumber}</span>
                      <span>{cert.issueDate}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono truncate" title={cert.verificationHash}>
                      {cert.verificationHash}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href="/dashboard/certificates"
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2.5 rounded-xl transition-colors"
                >
                  <Award size={15} />
                  Certificate & ID Generator Studio →
                </Link>
              </div>
            </div>

            {/* Pedagogical Holistic Rubric Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-6 rounded-2xl border border-indigo-200/80">
              <h4 className="font-bold text-indigo-950 text-sm mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                CBC & Holistic Student Ledger
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                This digital profile unifies academic grading with co-curricular prowess, sports participation, and community leadership over the student's entire school tenure.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Arts & Culture Competency:</span>
                  <span className="font-bold text-emerald-700">Exceeding Expectations</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>STEM Inquiry & Projects:</span>
                  <span className="font-bold text-indigo-700">Meeting Mastery (A+)</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Punctuality & Presence:</span>
                  <span className="font-bold text-purple-700">98.4% Consistent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL BADGES & MEDALS */}
      {activeTab === 'BADGES' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Gamified Badges & Honors Collection</h3>
              <p className="text-xs text-gray-500">
                Recognizing student character, creativity, peer mentorship, and extracurricular brilliance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium">
                <Filter size={14} className="text-gray-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="STEM">STEM & Robotics</option>
                  <option value="ACADEMIC">Academic Excellence</option>
                  <option value="ARTS">Arts & Culture (കലാ)</option>
                  <option value="SPORTS">Sports & Athletics (കായിക)</option>
                  <option value="LEADERSHIP">Leadership & Attendance</option>
                  <option value="COMMUNITY">Community & Ecology</option>
                </select>
              </div>

              {(portal === 'teacher' || portal === 'dashboard') && (
                <Button
                  size="sm"
                  leftIcon={<Award size={15} />}
                  onClick={() => setIsAwardModalOpen(true)}
                >
                  Award Badge
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className="group p-5 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl transform group-hover:scale-110 transition-transform">
                      {badge.icon}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${rarityBadgeClass(badge.rarity)}`}>
                      {badge.rarity}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-base leading-snug">{badge.name}</h4>
                  <p className="text-xs text-amber-900/90 font-serif font-medium mt-0.5">
                    {badge.nameMl}
                  </p>

                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-mono text-indigo-700 font-semibold">+{badge.points} XP</span>
                  <span>Unlocked: {badge.unlockedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ARTS & SPORTS MILESTONES */}
      {activeTab === 'ACHIEVEMENTS' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Arts, Cultural & Athletics Accomplishments (കലാ-കായിക നേട്ടങ്ങൾ)
              </h3>
              <p className="text-xs text-gray-500">
                Official certificates and prizes from Youth Festivals, Sports Meets, and District Olympiads.
              </p>
            </div>

            {(portal === 'teacher' || portal === 'dashboard') && (
              <Button
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={() => setIsAddAchModalOpen(true)}
              >
                Log New Achievement
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {activePortfolio.achievements.map((ach) => (
              <div
                key={ach.id}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Medal size={20} className="text-amber-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{ach.title}</h4>
                      <p className="text-xs text-amber-900 font-serif font-medium">{ach.titleMl}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {ach.position}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {ach.level} LEVEL
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 mt-2">{ach.description}</p>

                <div className="mt-4 pt-3 border-t border-gray-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <span>Organizer: {ach.organizer}</span>
                  <span>Academic Cycle: {ach.academicYear} • Date: {ach.date}</span>
                  {ach.certificateNumber && (
                    <span className="font-mono text-indigo-700 font-medium">
                      Ref: {ach.certificateNumber}
                    </span>
                  )}
                  {ach.isVerified && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Verified by {ach.verifiedBy}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STEM & CAPSTONE PROJECTS */}
      {activeTab === 'PROJECTS' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                STEM & Capstone Projects Showcase (പ്രോജക്റ്റുകൾ)
              </h3>
              <p className="text-xs text-gray-500">
                Working prototypes, software models, science experiments, and research papers.
              </p>
            </div>

            {(portal === 'teacher' || portal === 'dashboard') && (
              <Button
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={() => setIsAddProjModalOpen(true)}
              >
                Add Capstone Project
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activePortfolio.projects.map((prj) => (
              <div
                key={prj.id}
                className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-indigo-300 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-indigo-700 mb-2 font-semibold">
                    <span>{prj.subject}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">
                      {prj.scoreOrGrade}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-base">{prj.title}</h4>
                  {prj.titleMl && (
                    <p className="text-xs text-amber-900 font-serif font-medium mt-0.5">
                      {prj.titleMl}
                    </p>
                  )}

                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{prj.description}</p>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                      Skills Demonstrated:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {prj.skillsAcquired.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-indigo-50 text-indigo-800 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 bg-gray-50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <span className="text-[11px] font-bold text-gray-700 block mb-1">
                    Teacher Feedback & Assessment:
                  </span>
                  <p className="text-xs text-gray-600 italic">"{prj.teacherFeedback}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: VERIFIED CREDENTIALS */}
      {activeTab === 'CERTIFICATES' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Official Certificates & Digital Credentials (ലഭിച്ച സർട്ടിഫിക്കറ്റുകൾ)
            </h3>
            <p className="text-xs text-gray-500">
              Institutionally verified credentials with tamper-proof cryptographic hashes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activePortfolio.certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl border-2 border-emerald-900/20 bg-emerald-50/20 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
                    VERIFIED OFFICIAL
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 text-base">{cert.title}</h4>
                {cert.titleMl && (
                  <p className="text-xs text-amber-900 font-serif font-medium mt-0.5">
                    {cert.titleMl}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-emerald-950/10 space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Certificate No:</span>
                    <span className="font-mono font-bold text-gray-900">{cert.certNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issued On:</span>
                    <span>{cert.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issuing Institution:</span>
                    <span className="font-medium">{cert.issuer}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono truncate pt-1">
                    {cert.verificationHash}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL STUDENT PORTFOLIO RESUME */}
      <section className="hidden print:block p-8 bg-white text-gray-900 font-serif">
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            AL-AMEEN INTERNATIONAL ACADEMY
          </h1>
          <p className="text-xs">Affiliated to Central Board of Secondary Education • Accredited</p>
          <h2 className="text-lg font-bold mt-3 uppercase border-t border-b border-gray-400 py-1">
            Official Student Digital Portfolio & Co-Curricular Ledger
          </h2>
          <div className="flex justify-between text-xs mt-3 font-sans">
            <span><strong>Student Name:</strong> {activePortfolio.name} ({activePortfolio.nameMl})</span>
            <span><strong>Admission No:</strong> {activePortfolio.admissionNumber}</span>
            <span><strong>Class:</strong> {activePortfolio.className}</span>
            <span><strong>Roll No:</strong> {activePortfolio.rollNo}</span>
          </div>
        </div>

        <div className="space-y-6 text-xs font-sans">
          <div>
            <h3 className="font-bold uppercase border-b border-gray-300 pb-1 mb-2">1. Academic & Attendance Standing</h3>
            <p>Attendance Record: {activePortfolio.attendanceRate}% • Overall Examination Average: {activePortfolio.academicAverage}% • Total Points: {activePortfolio.totalPoints} XP</p>
          </div>

          <div>
            <h3 className="font-bold uppercase border-b border-gray-300 pb-1 mb-2">2. Honors & Digital Badges Awarded</h3>
            <ul className="list-disc list-inside space-y-1">
              {activePortfolio.badges.map((b) => (
                <li key={b.id}>
                  <strong>{b.name}</strong> ({b.category}) - {b.description} [Awarded: {b.unlockedAt}]
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold uppercase border-b border-gray-300 pb-1 mb-2">3. Arts, Cultural & Sports Achievements</h3>
            <ul className="list-disc list-inside space-y-1">
              {activePortfolio.achievements.map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong> - {a.position} in {a.level} Level ({a.date}, {a.organizer})
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold uppercase border-b border-gray-300 pb-1 mb-2">4. STEM & Capstone Projects</h3>
            <ul className="list-disc list-inside space-y-1">
              {activePortfolio.projects.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong> ({p.subject}) - Grade: {p.scoreOrGrade}. Skills: {p.skillsAcquired.join(', ')}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-10 flex justify-between items-end border-t border-gray-400 mt-12 text-center">
            <div>
              <p className="border-t border-black pt-1 w-48">Class Teacher Signature</p>
            </div>
            <div>
              <p className="border-t border-black pt-1 w-48">Vice Principal / Exam Head</p>
            </div>
            <div>
              <p className="border-t border-black pt-1 w-48">Principal & School Seal</p>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL 1: AWARD NEW BADGE */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-indigo-700">
                <Trophy size={20} />
                <h3 className="font-bold text-gray-900 text-lg">Award Digital Honor Badge</h3>
              </div>
              <button
                onClick={() => setIsAwardModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAwardBadge} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Recipient Student:
                </label>
                <div className="p-3 bg-gray-50 rounded-xl font-bold text-gray-900 text-sm">
                  {activePortfolio.name} ({activePortfolio.className})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Select Badge from Library:
                </label>
                <select
                  value={selectedBadgeCode}
                  onChange={(e) => setSelectedBadgeCode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {BADGE_LIBRARY.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.icon} {b.name} (+{b.points} XP) • {b.rarity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Specific Reason or Citation (Optional):
                </label>
                <textarea
                  rows={3}
                  value={badgeCustomReason}
                  onChange={(e) => setBadgeCustomReason(e.target.value)}
                  placeholder="e.g. Exhibited extraordinary innovation in district robotics project."
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Awarded By / Signatory:
                </label>
                <input
                  type="text"
                  value={awardedByTeacher}
                  onChange={(e) => setAwardedByTeacher(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => setIsAwardModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" leftIcon={<Sparkles size={16} />}>
                  Award Badge (+XP)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG CO-CURRICULAR ACHIEVEMENT */}
      {isAddAchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-indigo-700">
                <Medal size={20} />
                <h3 className="font-bold text-gray-900 text-lg">Log Arts / Sports Achievement</h3>
              </div>
              <button
                onClick={() => setIsAddAchModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAchievement} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Event / Award Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State School Youth Festival - Mohiniyattam"
                  value={achTitle}
                  onChange={(e) => setAchTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Title in Malayalam (മലയാളം):</label>
                <input
                  type="text"
                  placeholder="e.g. സംസ്ഥാന സ്കൂൾ കലോത്സവം - മോഹിനിയാട്ടം"
                  value={achTitleMl}
                  onChange={(e) => setAchTitleMl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Level:</label>
                  <select
                    value={achLevel}
                    onChange={(e) => setAchLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                  >
                    <option value="SCHOOL">School Level</option>
                    <option value="SUB_DISTRICT">Sub-District Level</option>
                    <option value="DISTRICT">District Level</option>
                    <option value="STATE">State Level</option>
                    <option value="NATIONAL">National Level</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Position / Prize:</label>
                  <select
                    value={achPosition}
                    onChange={(e) => setAchPosition(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                  >
                    <option value="FIRST">1st Prize / A-Grade</option>
                    <option value="SECOND">2nd Prize / Silver</option>
                    <option value="THIRD">3rd Prize / Bronze</option>
                    <option value="PARTICIPATION">Participation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  placeholder="Brief notes about the performance..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Organizing Body:</label>
                <input
                  type="text"
                  placeholder="e.g. General Education Department, Kerala"
                  value={achOrganizer}
                  onChange={(e) => setAchOrganizer(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => setIsAddAchModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary">
                  Save to Portfolio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CAPSTONE PROJECT */}
      {isAddProjModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-indigo-700">
                <BookOpen size={20} />
                <h3 className="font-bold text-gray-900 text-lg">Add STEM / Capstone Project</h3>
              </div>
              <button
                onClick={() => setIsAddProjModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Project Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Solar Powered Weather Station"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Subject / Domain:</label>
                <input
                  type="text"
                  placeholder="e.g. Physics & Embedded Systems"
                  value={projSubject}
                  onChange={(e) => setProjSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Skills Acquired (comma separated):</label>
                <input
                  type="text"
                  placeholder="e.g. Python, Microcontrollers, Circuit Design, Data Analysis"
                  value={projSkills}
                  onChange={(e) => setProjSkills(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Project Description:</label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Detailed overview of technical implementation..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Grade / Score:</label>
                  <input
                    type="text"
                    value={projScore}
                    onChange={(e) => setProjScore(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Teacher Feedback:</label>
                  <input
                    type="text"
                    value={projFeedback}
                    onChange={(e) => setProjFeedback(e.target.value)}
                    placeholder="Commendations..."
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => setIsAddProjModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary">
                  Save Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
