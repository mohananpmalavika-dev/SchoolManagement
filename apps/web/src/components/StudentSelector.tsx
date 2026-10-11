'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, LoadingSpinner, Alert } from '@/components/ui';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string };
  stream: { name: string };
}

interface StudentSelectorProps {
  selectedStudent?: Student | null;
  onSelectStudent: (student: Student) => void;
}

export function StudentSelector({
  selectedStudent,
  onSelectStudent,
}: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSelector, setShowSelector] = useState(!selectedStudent);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await api.getMyChildren();
      setStudents(data);

      // Auto-select if only one child
      if (data.length === 1 && !selectedStudent) {
        onSelectStudent(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
      setError('Failed to load student information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner message="Loading students..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  if (students.length === 0) {
    return (
      <Alert variant="warning">
        No students found. Please contact school administration.
      </Alert>
    );
  }

  // If student selected and not showing selector, show compact view
  if (selectedStudent && !showSelector) {
    return (
      <Card padding="sm">
        <button
          onClick={() => setShowSelector(true)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors tap-area"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold">
                {selectedStudent.firstName.charAt(0)}
                {selectedStudent.lastName.charAt(0)}
              </span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {selectedStudent.class.name} {selectedStudent.stream.name}
              </p>
            </div>
          </div>
          {students.length > 1 && (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12M8 12h12m-12 5h12M4 7h.01M4 12h.01M4 17h.01"
              />
            </svg>
          )}
        </button>
      </Card>
    );
  }

  // Show full selector
  return (
    <Card>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Select Student</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose a student to view their information
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => {
              onSelectStudent(student);
              setShowSelector(false);
            }}
            className={`w-full flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors tap-area ${
              selectedStudent?.id === student.id ? 'bg-primary-50' : ''
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedStudent?.id === student.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              <span className="text-lg font-semibold">
                {student.firstName.charAt(0)}
                {student.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {student.class.name} {student.stream.name} •{' '}
                {student.admissionNumber}
              </p>
            </div>
            {selectedStudent?.id === student.id && (
              <svg
                className="w-6 h-6 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
