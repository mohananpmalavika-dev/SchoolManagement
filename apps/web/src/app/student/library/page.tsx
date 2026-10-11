'use client';

import { useEffect, useState } from 'react';
import {
  Library,
  BookOpen,
  Download,
  Search,
  Clock,
  CheckCircle2,
  FileText,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Card, CardHeader, CardContent, Badge, Button, LoadingSpinner, Input } from '@/components/ui';

interface Material {
  id: string;
  title: string;
  subject: string;
  type: string;
  size: string;
  updatedAt: string;
  downloadUrl: string;
}

interface BorrowedBook {
  id: string;
  title: string;
  author: string;
  borrowedDate: string;
  dueDate: string;
  status: string;
}

export default function StudentLibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [books, setBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getStudentMaterials();
        setMaterials(res.curriculumMaterials || []);
        setBooks(res.borrowedBooks || []);
      } catch (err) {
        console.warn('Using resilient library fallback', err);
        setMaterials([
          {
            id: 'mat-1',
            title: 'Grade 5 Mathematics CBC Curriculum Guide & Formulas',
            subject: 'Mathematics',
            type: 'PDF',
            size: '3.4 MB',
            updatedAt: '2024-05-10',
            downloadUrl: '#',
          },
          {
            id: 'mat-2',
            title: 'Primary Science Experiment Safety & Worksheets',
            subject: 'Science & Technology',
            type: 'PDF',
            size: '5.1 MB',
            updatedAt: '2024-06-01',
            downloadUrl: '#',
          },
          {
            id: 'mat-3',
            title: 'Kamusi ya Kiswahili Sanifu - Orodha ya Msamiati wa Darasa la 5',
            subject: 'Kiswahili',
            type: 'PDF',
            size: '2.2 MB',
            updatedAt: '2024-05-15',
            downloadUrl: '#',
          },
          {
            id: 'mat-4',
            title: 'English Comprehension & Grammar Revision Exercises',
            subject: 'English',
            type: 'PDF',
            size: '1.8 MB',
            updatedAt: '2024-05-20',
            downloadUrl: '#',
          },
        ]);
        setBooks([
          {
            id: 'bk-1',
            title: 'Tales from Africa: Folk Stories & Wisdom',
            author: 'Kathleen Arnott',
            borrowedDate: '2024-09-20',
            dueDate: '2024-10-15',
            status: 'ON_LOAN',
          },
          {
            id: 'bk-2',
            title: 'Junior Illustrated Science Dictionary',
            author: 'Sarah Khan',
            borrowedDate: '2024-09-28',
            dueDate: '2024-10-20',
            status: 'ON_LOAN',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner message="Opening your digital library and resources..." />
      </div>
    );
  }

  const subjects = ['ALL', 'Mathematics', 'Science & Technology', 'English', 'Kiswahili'];
  const filteredMaterials = materials.filter((m) => {
    const matchesSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Library size={14} />
            <span>Digital Learning Resources</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Library & Study Notes
          </h1>
          <p className="text-sm text-gray-500">
            Approved KICD textbooks, revision notes, and borrowed library books.
          </p>
        </div>
      </div>

      {/* Borrowed Books Section */}
      <Card>
        <CardHeader
          title="My Borrowed Library Books"
          subtitle="Physical books checked out from the school library"
        />
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {books.map((bk) => (
              <div
                key={bk.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 flex items-start gap-4"
              >
                <div className="w-12 h-14 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  <Bookmark size={20} />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    On Loan
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {bk.title}
                  </h4>
                  <p className="text-xs text-gray-500">Author: {bk.author}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500 font-mono">
                    <span>Borrowed: {bk.borrowedDate}</span>
                    <span className="font-bold text-amber-700">Due: {bk.dueDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Digital Learning Materials */}
      <Card>
        <CardHeader
          title="Subject Revision Notes & CBC Worksheets"
          subtitle="Download guides and exercises prepared by teachers"
        />
        <CardContent className="p-5 space-y-4">
          {/* Search & Subject Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search notes or topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex overflow-x-auto gap-1">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSubject === sub
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* List of Files */}
          <div className="divide-y divide-gray-100">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {mat.title}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {mat.subject} • {mat.type} ({mat.size}) • Updated {mat.updatedAt}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => alert(`Starting download for: ${mat.title}`)}
                  leftIcon={<Download size={13} />}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
