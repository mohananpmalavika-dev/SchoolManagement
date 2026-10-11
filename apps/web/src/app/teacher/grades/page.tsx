'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button, LoadingSpinner, Alert, Badge } from '@/components/ui';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

interface GradeEntry {
  studentId: string;
  marks: number | null;
  grade?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  stream: string;
  subject: string;
  students: Student[];
}

interface Exam {
  id: string;
  name: string;
  term: string;
  maxMarks: number;
}

export default function TeacherGradesPage() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockClasses = [
        {
          id: '1',
          name: 'Grade 5',
          stream: 'A',
          subject: 'Mathematics',
          students: generateMockStudents(32, '5A'),
        },
        {
          id: '2',
          name: 'Grade 5',
          stream: 'B',
          subject: 'Mathematics',
          students: generateMockStudents(30, '5B'),
        },
      ];

      const mockExams = [
        { id: '1', name: 'Mid-Term Exam', term: 'Term 1 2024', maxMarks: 100 },
        { id: '2', name: 'End-Term Exam', term: 'Term 1 2024', maxMarks: 100 },
        { id: '3', name: 'CAT 1', term: 'Term 1 2024', maxMarks: 50 },
      ];

      setClasses(mockClasses);
      setExams(mockExams);
      
      if (mockClasses.length > 0) setSelectedClass(mockClasses[0].id);
      if (mockExams.length > 0) setSelectedExam(mockExams[0].id);
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = () => {
    const classInfo = classes.find((c) => c.id === selectedClass);
    if (!classInfo) return;

    setStudents(classInfo.students);

    // Initialize grade entries
    const initialGrades: Record<string, GradeEntry> = {};
    classInfo.students.forEach((student) => {
      initialGrades[student.id] = {
        studentId: student.id,
        marks: null,
      };
    });
    setGrades(initialGrades);
  };

  const handleMarksChange = (studentId: string, value: string) => {
    const marks = value === '' ? null : Number(value);
    const exam = exams.find((e) => e.id === selectedExam);
    
    if (marks !== null && exam && marks > exam.maxMarks) {
      return; // Don't allow marks greater than max
    }

    const grade = marks !== null ? calculateGrade(marks) : undefined;

    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        marks,
        grade,
      },
    }));
  };

  const calculateGrade = (marks: number): string => {
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    return 'E';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validate all entries
      const entries = Object.values(grades);
      const invalidEntries = entries.filter(
        (entry) => entry.marks === null || entry.marks < 0
      );

      if (invalidEntries.length > 0) {
        setError(`Please enter valid marks for all ${students.length} students`);
        setIsSaving(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Saving grades:', {
        classId: selectedClass,
        examId: selectedExam,
        grades: entries,
      });

      setSuccess(`Grades saved successfully for ${students.length} students!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save grades. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkEntry = () => {
    const input = prompt('Enter marks for all students (comma-separated):');
    if (!input) return;

    const marksArray = input.split(',').map((m) => m.trim());
    
    if (marksArray.length !== students.length) {
      alert(`Please enter exactly ${students.length} marks`);
      return;
    }

    const updated = { ...grades };
    students.forEach((student, index) => {
      const marks = Number(marksArray[index]);
      if (!isNaN(marks)) {
        updated[student.id] = {
          studentId: student.id,
          marks,
          grade: calculateGrade(marks),
        };
      }
    });

    setGrades(updated);
  };

  // Calculate stats
  const enteredCount = Object.values(grades).filter((g) => g.marks !== null).length;
  const avgMarks = Object.values(grades).reduce((sum, g) => sum + (g.marks || 0), 0) / (enteredCount || 1);
  const highestMarks = Math.max(...Object.values(grades).map((g) => g.marks || 0));

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);
  const selectedExamInfo = exams.find((e) => e.id === selectedExam);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Grades</h1>
          <p className="text-gray-600 mt-1">Record student examination marks</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.stream} - {cls.subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.term})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <Button
                variant="outline"
                onClick={handleBulkEntry}
                fullWidth
              >
                Bulk Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="lg">
          <p className="text-sm text-gray-500 mb-1">Entered</p>
          <p className="text-3xl font-bold text-gray-900">
            {enteredCount}/{students.length}
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-sm text-gray-500 mb-1">Average</p>
          <p className="text-3xl font-bold text-indigo-600">
            {avgMarks.toFixed(1)}%
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-sm text-gray-500 mb-1">Highest</p>
          <p className="text-3xl font-bold text-green-600">{highestMarks}%</p>
        </Card>
        <Card padding="lg">
          <p className="text-sm text-gray-500 mb-1">Max Marks</p>
          <p className="text-3xl font-bold text-gray-900">
            {selectedExamInfo?.maxMarks || 0}
          </p>
        </Card>
      </div>

      {/* Grade Entry Table */}
      {selectedClassInfo && selectedExamInfo && (
        <Card>
          <CardHeader
            title={`${selectedClassInfo.name} ${selectedClassInfo.stream} - ${selectedClassInfo.subject}`}
            subtitle={`${selectedExamInfo.name} (Max: ${selectedExamInfo.maxMarks} marks)`}
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Admission No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Marks (out of {selectedExamInfo.maxMarks})
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {student.admissionNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-700 font-medium text-sm">
                              {student.firstName.charAt(0)}
                              {student.lastName.charAt(0)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={selectedExamInfo.maxMarks}
                          value={grades[student.id]?.marks ?? ''}
                          onChange={(e) =>
                            handleMarksChange(student.id, e.target.value)
                          }
                          className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {grades[student.id]?.grade ? (
                          <GradeBadge grade={grades[student.id].grade!} />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={loadStudents}>
            Reset
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {isSaving
              ? 'Saving...'
              : `Save Grades (${enteredCount}/${students.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const variants: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    A: 'success',
    B: 'info',
    C: 'warning',
    D: 'warning',
    E: 'danger',
  };

  return (
    <Badge variant={variants[grade] || 'default'} size="sm">
      {grade}
    </Badge>
  );
}

function generateMockStudents(count: number, classCode: string): Student[] {
  const firstNames = [
    'John',
    'Mary',
    'Peter',
    'Jane',
    'David',
    'Sarah',
    'Michael',
    'Emily',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Kamau',
    'Wanjiku',
    'Ochieng',
    'Akinyi',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `${classCode}-${i + 1}`,
    admissionNumber: `ADM-2024-${classCode}-${String(i + 1).padStart(3, '0')}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
  }));
}
