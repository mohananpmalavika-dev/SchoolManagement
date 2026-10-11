'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  LoadingSpinner,
  Alert,
} from '@/components/ui';
import { StudentSelector } from '@/components/StudentSelector';
import { format } from 'date-fns';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string };
  stream: { name: string };
}

interface Grade {
  id: string;
  marks: number;
  grade: string;
  remarks?: string;
  subject: {
    name: string;
    code: string;
  };
  exam: {
    id: string;
    name: string;
    term: {
      name: string;
      year: number;
    };
  };
}

interface ReportCard {
  id: string;
  status: string;
  overallGrade: string;
  overallPercentage: number;
  position?: number;
  totalStudents?: number;
  teacherComment?: string;
  principalComment?: string;
  exam: {
    name: string;
    term: {
      name: string;
      year: number;
    };
  };
  grades: Array<{
    subject: { name: string };
    marks: number;
    grade: string;
  }>;
  createdAt: string;
}

export default function GradesPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadGradesData();
    }
  }, [selectedStudent]);

  const loadGradesData = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError('');

    try {
      const [gradesData, reportCardsData] = await Promise.all([
        api.getStudentGrades(selectedStudent.id),
        api.getStudentReportCards(selectedStudent.id),
      ]);

      setGrades(gradesData);
      setReportCards(reportCardsData.filter((rc: ReportCard) => rc.status === 'PUBLISHED'));
    } catch (err: any) {
      console.error('Failed to load grades:', err);
      setError('Failed to load grades information');
    } finally {
      setIsLoading(false);
    }
  };

  // Group grades by term
  const gradesByTerm = grades.reduce((acc: Record<string, Grade[]>, grade) => {
    const termKey = `${grade.exam.term.name} ${grade.exam.term.year}`;
    if (!acc[termKey]) {
      acc[termKey] = [];
    }
    acc[termKey].push(grade);
    return acc;
  }, {});

  if (!selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentSelector onSelectStudent={setSelectedStudent} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <StudentSelector
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading grades..." />
        </div>
      ) : (
        <>
          {/* Report Cards Section */}
          {reportCards.length > 0 && (
            <Card>
              <CardHeader
                title="Report Cards"
                subtitle="Download your published report cards"
              />
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportCards.map((reportCard) => (
                    <ReportCardItem
                      key={reportCard.id}
                      reportCard={reportCard}
                      onClick={() => setSelectedReportCard(reportCard)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Grades Summary */}
          {grades.length > 0 && (
            <Card>
              <CardHeader title="Recent Performance" />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Average Grade"
                    value={calculateAverageGrade(grades)}
                    color="primary"
                  />
                  <StatCard
                    label="Highest Score"
                    value={`${Math.max(...grades.map((g) => g.marks))}%`}
                    color="success"
                  />
                  <StatCard
                    label="Lowest Score"
                    value={`${Math.min(...grades.map((g) => g.marks))}%`}
                    color="warning"
                  />
                  <StatCard
                    label="Subjects"
                    value={new Set(grades.map((g) => g.subject.name)).size.toString()}
                    color="info"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grades by Term */}
          {Object.keys(gradesByTerm).length > 0 ? (
            Object.entries(gradesByTerm).map(([term, termGrades]) => (
              <Card key={term}>
                <CardHeader
                  title={term}
                  subtitle={`${termGrades.length} subjects`}
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Subject
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Exam
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Marks
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Grade
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {termGrades.map((grade) => (
                          <tr key={grade.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {grade.subject.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {grade.exam.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span
                                className={`font-semibold ${
                                  grade.marks >= 75
                                    ? 'text-success-600'
                                    : grade.marks >= 50
                                    ? 'text-primary-600'
                                    : 'text-danger-600'
                                }`}
                              >
                                {grade.marks}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <GradeBadge grade={grade.grade} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {grade.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">No grades available yet</p>
                  <p className="text-sm text-gray-500">
                    Grades will appear here once exams are graded and published
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Report Card Detail Modal */}
      {selectedReportCard && (
        <ReportCardModal
          reportCard={selectedReportCard}
          student={selectedStudent}
          onClose={() => setSelectedReportCard(null)}
        />
      )}
    </div>
  );
}

function ReportCardItem({
  reportCard,
  onClick,
}: {
  reportCard: ReportCard;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-primary-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {reportCard.exam.term.name} {reportCard.exam.term.year}
          </h3>
          <p className="text-sm text-gray-600">{reportCard.exam.name}</p>
        </div>
        <Badge variant="success">Published</Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Overall Grade:</span>
          <span className="font-bold text-primary-700">{reportCard.overallGrade}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Percentage:</span>
          <span className="font-semibold text-gray-900">
            {reportCard.overallPercentage.toFixed(1)}%
          </span>
        </div>
        {reportCard.position && reportCard.totalStudents && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Position:</span>
            <span className="font-semibold text-gray-900">
              {reportCard.position} of {reportCard.totalStudents}
            </span>
          </div>
        )}
      </div>

      <button className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors tap-area">
        View Details
      </button>
    </div>
  );
}

function ReportCardModal({
  reportCard,
  student,
  onClose,
}: {
  reportCard: ReportCard;
  student: Student;
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Card className="w-full max-w-4xl animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Report Card
                  </h2>
                  <p className="text-gray-600">
                    {reportCard.exam.term.name} {reportCard.exam.term.year} -{' '}
                    {reportCard.exam.name}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 tap-area"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Student Info */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Student Name</p>
                  <p className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Admission Number</p>
                  <p className="font-medium text-gray-900">
                    {student.admissionNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Class</p>
                  <p className="font-medium text-gray-900">
                    {student.class.name} {student.stream.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Overall Grade</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {reportCard.overallGrade}
                  </p>
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Subject Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Marks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportCard.grades.map((grade, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {grade.subject.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-semibold">
                          {grade.marks}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <GradeBadge grade={grade.grade} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        Overall
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                        {reportCard.overallPercentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold text-primary-600">
                          {reportCard.overallGrade}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Comments */}
              {(reportCard.teacherComment || reportCard.principalComment) && (
                <div className="mt-6 space-y-4">
                  {reportCard.teacherComment && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Class Teacher's Comment:
                      </p>
                      <p className="text-sm text-blue-800">
                        {reportCard.teacherComment}
                      </p>
                    </div>
                  )}
                  {reportCard.principalComment && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900 mb-2">
                        Principal's Comment:
                      </p>
                      <p className="text-sm text-green-800">
                        {reportCard.principalComment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <Button variant="outline" fullWidth onClick={onClose}>
                Close
              </Button>
              <Button fullWidth>
                Download PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    info: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-xs font-medium mb-1 opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const variants: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    A: 'success',
    B: 'info',
    C: 'warning',
    D: 'danger',
    E: 'danger',
  };

  return (
    <Badge variant={variants[grade] || 'default'} size="sm">
      {grade}
    </Badge>
  );
}

function calculateAverageGrade(grades: Grade[]): string {
  if (grades.length === 0) return '-';
  const average = grades.reduce((sum, g) => sum + g.marks, 0) / grades.length;
  
  if (average >= 80) return 'A';
  if (average >= 70) return 'B';
  if (average >= 60) return 'C';
  if (average >= 50) return 'D';
  return 'E';
}
