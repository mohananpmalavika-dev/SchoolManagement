import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCheck, ClipboardCheck, Clock3, GraduationCap, Library, Sparkles, Zap } from 'lucide-react';
import { dateLabel } from '@/lib/workspace';
import { EnergyArtwork } from './EnergyArtwork';
import { EmptyState, Panel, StatCard } from './WorkspaceUI';

interface StudentHomeProps {
  profile: { firstName: string; class?: { name: string }; school: string };
  data: {
    attendance: { totalDays: number; attendanceRate: number };
    todaySchedule: { id: string; subject: string; teacher: string; room?: string; startTime: string; endTime: string }[];
    pendingAssignments: { id: string; title: string; subject: string; dueDate: string }[];
    recentGrades: { id: string; subject: string; exam: string; score: number; total: number; grade?: string }[];
    announcements: { id: string; title: string; date: string; category?: string }[];
  };
}

const shortcuts = [
  { href: 'assignments', title: 'Get things done', caption: 'Homework & submissions', icon: ClipboardCheck, tone: 'lilac' },
  { href: 'quizzes', title: 'Challenge yourself', caption: 'Put your learning to the test', icon: Zap, tone: 'peach' },
  { href: 'materials', title: 'Find your next idea', caption: 'Notes & learning resources', icon: Library, tone: 'mint' },
  { href: 'portfolio', title: 'Make it yours', caption: 'Your work, your story', icon: GraduationCap, tone: 'blue' },
];

export function StudentHome({ profile, data }: StudentHomeProps) {
  const next = data.pendingAssignments[0];
  return <div className="student-home">
    <section className="learning-hero" aria-label="Your learning day">
      <div className="learning-hero-copy">
        <span className="learning-kicker"><Sparkles size={14}/> A LITTLE CURIOSITY. A LOT OF POSSIBILITY.</span>
        <h2>Hey {profile.firstName},<br/>let’s make today <em>count.</em></h2>
        <p>{profile.class?.name || 'Your learning journey'} <span>·</span> {profile.school}</p>
        <Link className="learning-primary" href="/student/assignments">Let’s get learning <ArrowRight size={17}/></Link>
      </div>
      <EnergyArtwork/>
      <div className="learning-focus">
        <span className="focus-label"><span className="focus-dot"/>{next ? 'A GOOD PLACE TO START' : 'ROOM FOR SOMETHING NEW'}</span>
        <span className="focus-icon">{next ? <BookOpen size={23}/> : <CheckCheck size={23}/>}</span>
        <h3>{next ? next.title : 'All caught up!'}</h3>
        <p>{next ? next.subject : 'No pending assignments on your dashboard. Explore something that sparks your curiosity.'}</p>
        {next && <span className="focus-due"><Clock3 size={13}/>Due {dateLabel(next.dueDate)}</span>}
        <Link href={next ? '/student/assignments' : '/student/materials'}>{next ? 'View assignment' : 'Explore resources'}<ArrowUpRight size={16}/></Link>
      </div>
    </section>

    <div className="student-stats metric-grid" aria-label="Your learning at a glance">
      <StatCard label="Showing up" value={data.attendance.totalDays ? data.attendance.attendanceRate + '%' : '—'} note={data.attendance.totalDays ? data.attendance.totalDays + ' school days recorded' : 'Attendance will appear here'} icon={ClipboardCheck}/>
      <StatCard label="On your schedule" value={data.todaySchedule.length} note="Lessons in today’s timetable" icon={CalendarDays}/>
      <StatCard label="Next assignments" value={data.pendingAssignments.length} note="Latest pending tasks shown below" icon={BookOpen}/>
      <StatCard label="Fresh results" value={data.recentGrades.length} note="Recently published assessments" icon={GraduationCap}/>
    </div>

    <section className="student-explore" aria-label="Learning shortcuts">
      <div className="student-section-heading"><h2>Your space. Your next move.</h2><span>A little progress, every day.</span></div>
      <nav className="student-shortcuts">{shortcuts.map(({ href, title, caption, icon: Icon, tone }) => <Link key={href} href={'/student/' + href} className={'student-shortcut ' + tone}><span className="shortcut-symbol"><Icon size={22} strokeWidth={1.7}/></span><ArrowUpRight size={17}/><strong>{title}</strong><small>{caption}</small></Link>)}</nav>
    </section>

    <div className="student-learning-grid">
      <div className="content-stack">
        <Panel title="Today’s lessons" subtitle="A little structure for a big day" href="/student/timetable">
          {data.todaySchedule.length ? <ol className="lesson-list">{data.todaySchedule.map((lesson, index) => <li key={lesson.id} className="student-lesson"><div className="lesson-time"><strong>{lesson.startTime}</strong><span>{lesson.endTime}</span></div><span className={'lesson-number tone-' + index % 4}>{String(index + 1).padStart(2, '0')}</span><div className="lesson-detail"><h3>{lesson.subject}</h3><p>{lesson.teacher}{lesson.room ? ' · ' + lesson.room : ''}</p></div><BookOpen className="lesson-book" size={18}/></li>)}</ol> : <EmptyState title="No lessons scheduled today" description="A little breathing room. Your full week is in My schedule."/>}
        </Panel>
        <Panel title="Your next assignments" subtitle="One step at a time. You’ve got this." href="/student/assignments">
          {data.pendingAssignments.length ? <div className="student-task-list">{data.pendingAssignments.map(item => <Link key={item.id} href="/student/assignments" className="student-task"><span className="task-symbol"><ClipboardCheck size={18}/></span><div><strong>{item.title}</strong><p>{item.subject} <span>·</span> Due {dateLabel(item.dueDate)}</p></div><ArrowUpRight size={17}/></Link>)}</div> : <EmptyState title="Everything handed in? Nice work." description="New assignments from your teachers will appear here."/>}
        </Panel>
      </div>
      <div className="content-stack">
        <Panel title="Your latest progress" subtitle="Every step forward matters" href="/student/grades">
          {data.recentGrades.length ? <div className="student-results">{data.recentGrades.map(result => <div key={result.id} className="student-result"><span className="result-symbol"><GraduationCap size={18}/></span><div><strong>{result.subject}</strong><p>{result.exam}</p></div><span className="result-score">{result.score}<small> / {result.total}</small></span></div>)}</div> : <EmptyState title="Your story is still unfolding" description="Published assessment results will appear here."/>}
        </Panel>
        <Panel title="Around your school" subtitle="Good things to look forward to">
          {data.announcements.length ? <div className="student-events">{data.announcements.map(event => <div key={event.id} className="student-event"><CalendarDays size={19}/><div><strong>{event.title}</strong><time>{dateLabel(event.date)}</time></div></div>)}</div> : <EmptyState title="Watch this space" description="School events and important dates will appear here."/>}
        </Panel>
        <Link href="/student/library" className="student-library"><span><Library size={26}/></span><div><small>THERE’S A WHOLE WORLD OUT THERE</small><strong>Your next adventure<br/>could be a book.</strong><p>Explore your school library <ArrowRight size={15}/></p></div></Link>
      </div>
    </div>
  </div>;
}
