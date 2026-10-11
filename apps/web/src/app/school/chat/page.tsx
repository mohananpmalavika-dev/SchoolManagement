import { SchoolChatHub } from '@/components/chat/SchoolChatHub';

export const metadata = {
  title: 'Campus Live Chat | HustlerTech School ERP',
  description: 'Real-time collaborative messaging for teachers, parents, and administrative teams.',
};

export default function SchoolChatPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Live School Chat</h1>
          <p className="text-xs text-slate-500">
            Real-time direct messaging, class channels, and staff communications.
          </p>
        </div>
      </div>
      <SchoolChatHub />
    </div>
  );
}
