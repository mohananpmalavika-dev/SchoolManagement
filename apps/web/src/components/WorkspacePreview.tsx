import { BookOpen, Check, GraduationCap, MessageSquare, School, Users } from 'lucide-react';

export function WorkspacePreview() {
  const features = [
    { icon: Users, label: 'School teams', detail: 'People, records & daily operations' },
    { icon: GraduationCap, label: 'Teaching & learning', detail: 'Classes, lessons & student progress' },
    { icon: MessageSquare, label: 'Family connections', detail: 'School updates & communication' },
  ];
  return <div className="workspace-preview" aria-hidden="true">
    <div className="preview-topline"><span><School size={17}/>Krypton workspace</span><span className="preview-window-dots"><i/><i/><i/></span></div>
    <div className="preview-content"><div className="preview-navigation"><School size={17}/><Users size={17}/><BookOpen size={17}/><MessageSquare size={17}/></div><div className="preview-overview"><small>ONE CONNECTED SCHOOL</small><h3>A place for everyone.</h3>{features.map(({ icon: Icon, label, detail }) => <div className="preview-feature" key={label}><span><Icon size={17}/></span><div><strong>{label}</strong><small>{detail}</small></div><Check size={14}/></div>)}</div></div>
  </div>;
}
