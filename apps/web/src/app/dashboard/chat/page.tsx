import { SchoolChatHub } from '@/components/chat/SchoolChatHub';

export const metadata = {
  title: 'Family Chat & Parent Forum | Krypton School ERP',
  description: 'Connect directly with teachers, school staff, and the parent community.',
};

export default function ParentChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Family & Teacher Chat</h1>
        <p className="text-xs text-slate-500">
          Direct messaging with your children’s teachers, administration, and parent forums.
        </p>
      </div>
      <SchoolChatHub />
    </div>
  );
}
