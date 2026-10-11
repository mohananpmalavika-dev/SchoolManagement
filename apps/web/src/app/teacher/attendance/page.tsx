'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge, Button, LoadingSpinner, Alert } from '@/components/ui';
import { format } from 'date-fns';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  stream: string;
  students: Student[];
}

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [period, setPeriod] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass, selectedDate]);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockClasses = [
        {
          id: '1',
          name: 'Grade 5',
          stream: 'A',
          students: generateMockStudents(32, '5A'),
        },
        {
          id: '2',
          name: 'Grade 5',
          stream: 'B',
          students: generateMockStudents(30, '5B'),
        },
        {
          id: '3',
          name: 'Grade 6',
          stream: 'A',
          students: generateMockStudents(28, '6A'),
        },
      ];

      setClasses(mockClasses);
      if (mockClasses.length > 0) {
        setSelectedClass(mockClasses[0].id);
      }
    } catch (err: any) {
      setError('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    const classInfo = classes.find((c) => c.id === selectedClass);
    if (!classInfo) return;

    setStudents(classInfo.students);

    // Initialize attendance records
    const initialAttendance: Record<string, AttendanceRecord> = {};
    classInfo.students.forEach((student) => {
      initialAttendance[student.id] = {
        studentId: student.id,
        status: 'PRESENT',
      };
    });
    setAttendance(initialAttendance);
  };

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceRecord['status']) => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      updated[student.id] = {
        studentId: student.id,
        status,
      };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Mock API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const records = Object.values(attendance);
      console.log('Saving attendance:', {
        classId: selectedClass,
        date: selectedDate,
        period,
        records,
      });

      setSuccess(`Attendance saved successfully for ${students.length} students!`);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate stats
  const stats = {
    present: Object.values(attendance).filter((a) => a.status === 'PRESENT').length,
    absent: Object.values(attendance).filter((a) => a.status === 'ABSENT').length,
    late: Object.values(attendance).filter((a) => a.status === 'LATE').length,
    excused: Object.values(attendance).filter((a) => a.status === 'EXCUSED').length,
  };

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading classes..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">Record student attendance for today</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    {cls.name} {cls.stream} ({cls.students.length} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions
              </label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="flex-1"
                >
                  All Present
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present" value={stats.present} color="green" />
        <StatCard label="Absent" value={stats.absent} color="red" />
        <StatCard label="Late" value={stats.late} color="orange" />
        <StatCard label="Excused" value={stats.excused} color="gray" />
      </div>

      {/* Student List */}
      {selectedClassInfo && (
        <Card>
          <CardHeader
            title={`${selectedClassInfo.name} ${selectedClassInfo.stream}`}
            subtitle={`${students.length} students • ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`}
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Remarks
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <StatusButton
                            status="PRESENT"
                            isSelected={attendance[student.id]?.status === 'PRESENT'}
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                          />
                          <StatusButton
                            status="ABSENT"
                            isSelected={attendance[student.id]?.status === 'ABSENT'}
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                          />
                          <StatusButton
                            status="LATE"
                            isSelected={attendance[student.id]?.status === 'LATE'}
                            onClick={() => handleStatusChange(student.id, 'LATE')}
                          />
                          <StatusButton
                            status="EXCUSED"
                            isSelected={attendance[student.id]?.status === 'EXCUSED'}
                            onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={attendance[student.id]?.remarks || ''}
                          onChange={(e) =>
                            handleRemarksChange(student.id, e.target.value)
                          }
                          placeholder="Optional remarks"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
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
            {isSaving ? 'Saving...' : `Save Attendance (${students.length} students)`}
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusButton({
  status,
  isSelected,
  onClick,
}: {
  status: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config: Record<
    string,
    { label: string; color: string; activeColor: string }
  > = {
    PRESENT: {
      label: 'P',
      color: 'text-gray-400 hover:text-green-600',
      activeColor: 'bg-green-600 text-white',
    },
    ABSENT: {
      label: 'A',
      color: 'text-gray-400 hover:text-red-600',
      activeColor: 'bg-red-600 text-white',
    },
    LATE: {
      label: 'L',
      color: 'text-gray-400 hover:text-orange-600',
      activeColor: 'bg-orange-600 text-white',
    },
    EXCUSED: {
      label: 'E',
      color: 'text-gray-400 hover:text-gray-600',
      activeColor: 'bg-gray-600 text-white',
    },
  };

  const { label, color, activeColor } = config[status];

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-md font-semibold text-sm transition-colors ${
        isSelected ? activeColor : `border border-gray-300 ${color}`
      }`}
      title={status}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colors[color]}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
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
    'James',
    'Grace',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Kamau',
    'Wanjiku',
    'Ochieng',
    'Akinyi',
    'Mutua',
    'Mwangi',
    'Omondi',
    'Njeri',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `${classCode}-${i + 1}`,
    admissionNumber: `ADM-2024-${classCode}-${String(i + 1).padStart(3, '0')}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
  }));
}
