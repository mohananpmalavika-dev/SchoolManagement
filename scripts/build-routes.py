from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
def write(name,content):
 p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content,encoding='utf-8')
def extract(name,start,end):
 s=(root/name).read_text(encoding='utf-8');return json.loads(s.split(start)[1].split(end)[0])
specs=extract('apps/api/src/modules/workspace/records.ts','export const recordSpecs:Record<string,RecordSpec> = ',';\nexport const managers')
admin=extract('apps/api/src/modules/platform/platform.service.ts','const specs:Record<string,RecordSpec> = ',';\n@Injectable')
labels={'admissionNumber':'Admission no.','dateOfBirth':'Date of birth','currentClassId':'Class','admissionDate':'Admission date','staffNumber':'Staff number','userId':'Portal account','academicYearId':'Academic year','schoolId':'Campus','guardianId':'Guardian','studentId':'Student','bookId':'Book','borrowerId':'Student borrower','vehicleId':'Vehicle','invoiceId':'Invoice','termId':'Term','amount':'Amount (KES cents)','fee':'Monthly fee (KES cents)','classId':'Class','subjectId':'Subject','teacherId':'Teacher','dayOfWeek':'Day (1 = Monday)','totalMarks':'Maximum marks','tenantId':'School','planId':'Plan'}
refs={'class':'classes','school':'schools','user':'users','guardian':'guardians','student':'students','academicYear':'years','book':'books','vehicle':'vehicles','invoice':'invoices','term':'terms','subject':'subjects','staff':'staff','tenant':'schools','plan':'plans'}
def label(k):return labels.get(k,re.sub(r'([A-Z])',r' \1',k).capitalize())
def fields(spec,base):
 result=[]
 for key,rule in spec['fields'].items():
  f={'key':key,'label':label(key),'required':rule.endswith('!')};rule=rule.rstrip('!')
  if rule.startswith('ref:'):f['source']=('/workspace/users' if rule=='ref:user' else base+'/'+refs[rule[4:]])
  elif rule.startswith('enum:'):f['options']=rule[5:].split(',')
  elif rule.startswith('int:'):f.update(type='number',min=int(rule.split(':')[1]),max=int(rule.split(':')[2]))
  elif rule in ['email','date','time','password']:f['type']=rule
  elif rule=='long':f['type']='textarea'
  result.append(f)
 return result
columns={
 'students':'name:Student,admissionNumber:Admission no.,className:Class,status:Status:status',
 'guardians':'name:Guardian,phone:Phone,email:Email,userId:Portal account',
 'guardian-links':'guardianName:Guardian,studentName:Student,relationship:Relationship',
 'staff':'name:Staff member,staffNumber:Staff no.,department:Department,position:Position,status:Status:status',
 'years':'name:Year,startDate:Starts:date,endDate:Ends:date,isCurrent:Current',
 'terms':'name:Term,termNumber:Number,startDate:Starts:date,endDate:Ends:date,isCurrent:Current',
 'classes':'name:Class,level:Level,educationLevel:Education level,studentCount:Students',
 'streams':'name:Stream,capacity:Capacity',
 'subjects':'name:Subject,code:Code,educationLevel:Education level',
 'schools':'name:Campus,email:Email,phone:Phone,city:City',
 'books':'title:Title,author:Author,category:Category,quantity:Copies,available:Available',
 'borrowings':'bookTitle:Book,borrowerId:Borrower,dueDate:Due:date,status:Status:status',
 'vehicles':'registrationNumber:Registration,make:Make,capacity:Capacity,status:Status:status',
 'routes':'name:Route,pickupTime:Pickup,dropoffTime:Drop-off,fee:Monthly fee:money',
 'inventory':'name:Item,category:Category,quantity:Quantity,unit:Unit,reorderLevel:Reorder level',
 'events':'title:Event,startDate:Starts:date,endDate:Ends:date,category:Category,location:Location',
 'timetable':'day:Day,startTime:Start,endTime:End,className:Class,subjectName:Subject,teacherName:Teacher,room:Room',
 'invoices':'invoiceNumber:Invoice,studentName:Student,termName:Term,totalAmount:Total:money,balanceAmount:Balance:money,status:Status:status',
 'payments':'receiptNumber:Receipt,reference:Reference,amount:Amount:money,paymentMethod:Method,paymentDate:Date:date',
 'examinations':'name:Assessment,className:Class,termName:Term,startDate:Starts:date,isPublished:Published',
 'tickets':'subject:Subject,description:Description,priority:Priority,status:Status:status,createdAt:Opened:date'
}
titles={'guardian-links':'Family connections','staff':'Staff directory','years':'Academic years','books':'Book catalog','borrowings':'Book loans','events':'School calendar','schools':'Campuses','routes':'Transport routes','payments':'Payment records','tickets':'Support tickets'}
descriptions={'students':'Every student’s journey starts with a place to belong.','guardians':'Keep families connected to their school community.','staff':'The people who make your school run.','books':'Open a world of learning, one book at a time.','invoices':'Clear fee records for a stronger school.','events':'Make space for learning, celebration, and community.','examinations':'Plan assessments and celebrate learning progress.','tickets':'Get help keeping your school moving.'}
def cols(s):
 return [dict(key=v[0],label=v[1],**({'format':v[2]} if len(v)>2 else {})) for v in [x.split(':') for x in s.split(',')]]
school={}
for key,spec in specs.items():
 school[key]={'title':titles.get(key,key.capitalize()),'description':descriptions.get(key,'Keep your school information organized and up to date.'),'endpoint':'/workspace/'+key,'columns':cols(columns[key]),'fields':fields(spec,'/workspace')}
 if key in ['students','guardians','staff','subjects','schools','books','vehicles','routes','inventory','events']:school[key]['editable']=True
 if key in ['years','terms']:school[key]['action']={'label':'Set current','path':'current'}
 if key=='borrowings':school[key]['action']={'label':'Return','path':'return'}
 if key=='examinations':school[key]['action']={'label':'Publish','path':'publish'}
admincols={'schools':'name:School,subdomain:Subdomain,contactEmail:Contact,status:Status:status,createdAt:Joined:date','users':'name:Person,email:Email,schoolName:School,role:Role,status:Status:status','subscriptions':'schoolName:School,planName:Plan,price:Plan price:money,endDate:Ends:date,status:Status:status','tickets':columns['tickets'],'announcements':'title:Title,status:Status:status,publishedAt:Published:date'}
admins={}
for key,spec in admin.items():
 admins[key]={'title':{'schools':'School communities','users':'People & access','tickets':'Support center','announcements':'Platform announcements'}.get(key,key.capitalize()),'description':'Keep your school communities connected and supported.','endpoint':'/admin/'+key,'columns':cols(admincols[key]),'fields':fields(spec,'/admin'),'editable':key not in ['announcements']}
 if key=='users':
  for f in admins[key]['fields']:
   if f['key']=='tenantId':f['source']='/admin/schools'
 if key=='tickets':admins[key]['createAllowed']=False
 if key=='announcements':admins[key]['action']={'label':'Publish','path':'publish'}
write('apps/web/src/lib/resources.ts',"import type { Column } from '@/components/ResourcePage';\nimport type { Field } from '@/components/RecordModal';\nexport interface ResourceConfig {title:string;description:string;endpoint:string;columns:Column[];fields?:Field[];editable?:boolean;createAllowed?:boolean;action?:{label:string;path:string}}\nexport const schoolResources:Record<string,ResourceConfig>="+json.dumps(school,indent=2)+";\nexport const adminResources:Record<string,ResourceConfig>="+json.dumps(admins,indent=2)+';\n')
write('apps/web/src/components/ResourceTabs.tsx',"""'use client';
import {useState} from 'react';
import {ResourcePage} from './ResourcePage';
import {schoolResources,adminResources} from '@/lib/resources';
export function ResourceTabs({resources,admin=false}:{resources:{key:string;label:string}[];admin?:boolean}){
 const [tab,setTab]=useState(resources[0].key);const config=(admin?adminResources:schoolResources)[tab];
 return <><div className="section-tabs" aria-label="Sections">{resources.map(r=><button key={r.key} className={tab===r.key?'selected':''} aria-pressed={tab===r.key} onClick={()=>setTab(r.key)}>{r.label}</button>)}</div><ResourcePage key={tab} {...config}/></>;
}
""")
for route,key in {'students':'students','staff':'staff','calendar':'events','examinations':'examinations','inventory':'inventory'}.items():
 write('apps/web/src/app/school/'+route+'/page.tsx',"import {ResourcePage} from '@/components/ResourcePage';\nimport {schoolResources} from '@/lib/resources';\nexport default function Page(){return <ResourcePage {...schoolResources['"+key+"']}/>;}")
tabs={'guardians':['guardians','guardian-links'],'academics':['years','terms','classes','streams','subjects','schools'],'fees':['invoices','payments'],'library':['books','borrowings'],'transport':['vehicles','routes'],'timetable':['timetable'],'support':['tickets']}
for route,keys in tabs.items():
 write('apps/web/src/app/school/'+route+'/page.tsx',"import {ResourceTabs} from '@/components/ResourceTabs';\nexport default function Page(){return <ResourceTabs resources={"+json.dumps([{'key':k,'label':school[k]['title']} for k in keys])+"}/>;}")
for route in ['schools','users','subscriptions']:
 write('apps/web/src/app/admin/'+route+'/page.tsx',"import {ResourcePage} from '@/components/ResourcePage';\nimport {adminResources} from '@/lib/resources';\nexport default function Page(){return <ResourcePage {...adminResources['"+route+"']}/>;}")
write('apps/web/src/app/admin/support/page.tsx',"import {ResourceTabs} from '@/components/ResourceTabs';\nexport default function Page(){return <ResourceTabs admin resources={[{key:'tickets',label:'Support tickets'},{key:'announcements',label:'Announcements'}]}/>;}")
write('apps/web/src/app/teacher/timetable/page.tsx',"import {ResourcePage} from '@/components/ResourcePage';\nimport {schoolResources} from '@/lib/resources';\nexport default function Page(){const {fields,action,editable,...config}=schoolResources.timetable;return <ResourcePage {...config} title=\"My schedule\"/>;}")
write('apps/web/src/app/teacher/performance/page.tsx',"import {ResourcePage} from '@/components/ResourcePage';\nexport default function Page(){return <ResourcePage title=\"Learning performance\" description=\"Subject averages based on saved marks in your assigned classes.\" endpoint=\"/workspace/performance\" columns={[{key:'subjectName',label:'Subject'},{key:'average',label:'Average (%)'},{key:'assessments',label:'Grades recorded'}]}/>;}")
