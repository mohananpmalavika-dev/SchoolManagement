import { AutoTimetableGeneratorHub } from '@/components/timetable/AutoTimetableGeneratorHub';

export const metadata = {
  title: 'Constraint-Based Auto-Timetable Generator | Krypton School ERP',
  description:
    '1-Click conflict-free auto timetable generation with teacher workload management and lab room allocation.',
};

export default function TimetablePage() {
  return <AutoTimetableGeneratorHub />;
}