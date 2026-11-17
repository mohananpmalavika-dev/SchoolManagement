import { SchoolChatHub } from '@/components/chat/SchoolChatHub';

export const metadata = {
  title: 'Teacher Chat & Channels | Krypton School ERP',
  description: 'Teacher communication with parents, staff room, and class groups.',
};

export default function TeacherChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty & Parent Chat</h1>
        <p className="text-xs text-slate-500">
          Collaborate with colleagues and communicate securely with parents and guardians.
        </p>
      </div>
      <SchoolChatHub />
    </div>
  );
}
