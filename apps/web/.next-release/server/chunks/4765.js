exports.id=4765,exports.ids=[4765],exports.modules={3238:(a,b,c)=>{Promise.resolve().then(c.bind(c,61286))},3523:(a,b,c)=>{"use strict";c.d(b,{BS:()=>g,Br:()=>h,JO:()=>i,ZU:()=>f,u9:()=>e});var d=c(45263);async function e(a,b="English",c){let{data:f}=await d.uE.post("/teacher-ai/copilot-query",{query:a,language:b},{timeout:45e3,signal:c});return f}async function f(a,b){let{data:c}=await d.uE.post("/teacher-ai/lesson-plan",a,{timeout:6e4,signal:b});return c}async function g(a,b){let{data:c}=await d.uE.post("/teacher-ai/scheme-of-work",a,{timeout:6e4,signal:b});return c}async function h(a,b){let{data:c}=await d.uE.post("/teacher-ai/share-to-chat",a,{timeout:3e4,signal:b});return c}async function i(a){let{data:b}=await d.uE.get("/teacher-ai/at-risk",{signal:a});return b}},15138:(a,b,c)=>{Promise.resolve().then(c.bind(c,16473))},16473:(a,b,c)=>{"use strict";c.d(b,{AppShell:()=>d});let d=(0,c(21575).registerClientReference)(function(){throw Error("Attempted to call AppShell() from the server but AppShell is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\SchoolManagement\\apps\\web\\src\\components\\AppShell.tsx","AppShell")},21410:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"circle-question-mark",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],aliases:["help-circle","circle-help"]};e.node;let f=(0,d.A)(e)},23569:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"layers",size:24,node:[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],aliases:["layers-3"]};e.node;let f=(0,d.A)(e)},30889:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"send",size:24,node:[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]};e.node;let f=(0,d.A)(e)},33751:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"clock",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]};e.node;let f=(0,d.A)(e)},34782:(a,b,c)=>{Promise.resolve().then(c.bind(c,58696))},34807:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"file-text",size:24,node:[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]};e.node;let f=(0,d.A)(e)},44976:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"circle-check",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 9-5.5 5.5L8 12",key:"xofnsj"}]],aliases:["check-circle-2"]};e.node;let f=(0,d.A)(e)},49642:(a,b,c)=>{Promise.resolve().then(c.bind(c,91336))},52910:(a,b,c)=>{"use strict";c.d(b,{TG:()=>f,XW:()=>e,gy:()=>h,j$:()=>g,z9:()=>i});var d=c(45263);function e(a){let b=a.response?.data?.message;return Array.isArray(b)?b.join(". "):b||(a instanceof Error&&!("isAxiosError"in a)?a.message:"Could not complete the request. Please try again.")}let f=a=>new Intl.NumberFormat("en-KE",{style:"currency",currency:"KES",maximumFractionDigits:0}).format(a/100),g=a=>a&&!Number.isNaN(new Date(a).getTime())?new Date(a).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):"—";async function h(a,b){let{data:c}=await d.uE.get(a,{params:b});return Array.isArray(c)?c:c.items||c.data||[]}function i(a,b,c){let d=a=>{let b=String(a??"");return/^[=+@\-\t\r]/.test(b)&&(b="'"+b),'"'+b.replaceAll('"','""')+'"'},e=[b.map(a=>d(a.label)).join(","),...c.map(a=>b.map(b=>d(a[b.key])).join(","))].join("\r\n"),f=URL.createObjectURL(new Blob(["\uFEFF"+e],{type:"text/csv;charset=utf-8"})),g=document.createElement("a");g.href=f,g.download=a+".csv",g.click(),URL.revokeObjectURL(f)}},58696:(a,b,c)=>{"use strict";c.d(b,{TeacherAIStudio:()=>d});let d=(0,c(21575).registerClientReference)(function(){throw Error("Attempted to call TeacherAIStudio() from the server but TeacherAIStudio is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\SchoolManagement\\apps\\web\\src\\components\\TeacherAIStudio.tsx","TeacherAIStudio")},61286:(a,b,c)=>{"use strict";c.d(b,{TeacherAIStudio:()=>J});var d=c(39833),e=c(28604),f=c(17924),g=c.n(f),h=c(92442),i=c(38953),j=c(23569),k=c(40314),l=c(21410),m=c(44976),n=c(97735),o=c(11976),p=c(87593),q=c(30889),r=c(33751),s=c(34807),t=c(40660),u=c(45263),v=c(3523),w=c(52910),x=c(46931),y=c(75711),z=c(86943),A=c(81361),B=c(85198);function C(a,b){let c=URL.createObjectURL(new Blob(["\uFEFF"+b],{type:"text/plain;charset=utf-8"})),d=document.createElement("a");d.href=c,d.download=a,d.click(),URL.revokeObjectURL(c)}function D(a){return(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function E(a,b){let c=window.open("","_blank");if(!c)return void window.print();let d=a.questions.reduce((a,b)=>a+b.marks,0),e=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${D(a.title)} - Official Worksheet</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #111827; line-height: 1.45; padding: 20px; max-width: 850px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; }
    .school-title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .school-subtitle { font-size: 11px; font-family: sans-serif; color: #4b5563; margin-top: 2px; }
    .paper-heading { font-size: 16px; font-weight: 700; margin-top: 10px; color: #1e1b4b; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; font-family: sans-serif; border-top: 1px solid #d1d5db; padding-top: 6px; }
    .meta-table td { padding: 4px 6px; }
    .instructions-box { background: #f9fafb; border-left: 3px solid #4f46e5; padding: 8px 12px; margin-bottom: 20px; font-size: 12px; font-family: sans-serif; }
    .question-item { margin-bottom: 18px; page-break-inside: avoid; }
    .q-text { font-size: 13.5px; font-weight: 600; display: flex; justify-content: space-between; }
    .q-marks { font-size: 12px; font-family: monospace; color: #4b5563; font-weight: bold; }
    .options-list { list-style-type: upper-alpha; margin: 6px 0 6px 24px; padding: 0; font-size: 13px; }
    .options-list li { margin-bottom: 4px; }
    .ans-key { margin-top: 8px; padding: 8px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px; font-family: sans-serif; }
    .rubric-container { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; page-break-inside: avoid; font-family: sans-serif; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .rubric-table th, .rubric-table td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; }
    .rubric-table th { background: #f3f4f6; font-weight: 700; }
    .footer-signatures { margin-top: 35px; display: flex; justify-content: space-between; font-size: 12px; font-family: sans-serif; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #111; width: 180px; text-align: center; padding-top: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-title">AL-AMEEN INTERNATIONAL ACADEMY</div>
    <div class="school-subtitle">AFFILIATED TO CBSE / STATE BOARD • DEPARTMENT OF ACADEMIC ASSESSMENT</div>
    <div class="paper-heading">${D(a.title)} ${b?"— TEACHER ANSWER KEY & RUBRICS":"— STUDENT WORKSHEET"}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Student Name:</strong> ____________________________________</td>
        <td><strong>Class:</strong> _____________</td>
        <td><strong>Roll No:</strong> ________</td>
      </tr>
      <tr>
        <td><strong>Date:</strong> ________________________</td>
        <td><strong>Max Marks:</strong> ${d}</td>
        <td><strong>Time Allowed:</strong> 30 Mins</td>
      </tr>
    </table>
  </div>

  <div class="instructions-box">
    <strong>Instructions:</strong> ${D(a.instructions)}
  </div>

  <div class="questions">
    ${a.questions.map((a,c)=>`
      <div class="question-item">
        <div class="q-text">
          <span>${c+1}. ${D(a.question)}</span>
          <span class="q-marks">[${a.marks} Mark${a.marks>1?"s":""}]</span>
        </div>
        ${a.options&&a.options.length?`
          <ol class="options-list">
            ${a.options.map(a=>`<li>${D(a)}</li>`).join("")}
          </ol>
        `:`
          <div style="border-bottom: 1px dashed #9ca3af; height: 35px; margin-top: 8px;"></div>
        `}
        ${b?`
          <div class="ans-key">
            <strong style="color: #065f46;">Correct Answer:</strong> ${D(a.answer)}<br/>
            <span style="color: #047857;"><strong>Pedagogical Explanation:</strong> ${D(a.explanation)}</span>
          </div>
        `:""}
      </div>
    `).join("")}
  </div>

  <div class="rubric-container">
    <div style="font-weight: bold; font-size: 13px; text-transform: uppercase;">Assessment Rubric & Evaluation Standard</div>
    <table class="rubric-table">
      <thead>
        <tr>
          <th>Criterion</th>
          <th>Exceeding Standard (90-100%)</th>
          <th>Meeting Standard (70-89%)</th>
          <th>Approaching Standard (50-69%)</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Concept Clarity</strong></td>
          <td>Flawless recall & understanding of principles</td>
          <td>Accurate recall of syllabus fundamentals</td>
          <td>Partial recall, requires targeted review</td>
          <td>____ / ${Math.round(.4*d)}</td>
        </tr>
        <tr>
          <td><strong>Analytical Reasoning</strong></td>
          <td>Applies rules correctly to solve unfamiliar problems</td>
          <td>Solves standard curriculum questions</td>
          <td>Reasoning errors or incomplete attempts</td>
          <td>____ / ${Math.round(.4*d)}</td>
        </tr>
        <tr>
          <td><strong>Neatness & Precision</strong></td>
          <td>Clear work with complete accuracy</td>
          <td>Minor errors, overall consistent work</td>
          <td>Inconsistent responses</td>
          <td>____ / ${Math.round(.2*d)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-signatures">
    <div class="sig-line">Class Teacher Signature</div>
    <div style="font-size: 13px; font-weight: bold;">Score Obtained: ______ / ${d}</div>
    <div class="sig-line">Head of Department / Examiner</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`;c.document.open(),c.document.write(e),c.document.close()}let F=["English","Malayalam","Swahili"],G=[{key:"CBC",label:"CBC Competency-Based",desc:"Curriculum descriptors (Exceeding, Meeting, Approaching)"},{key:"HOLISTIC",label:"Holistic & Balanced",desc:"Balances academic achievement with social and emotional growth"},{key:"ACADEMIC_RIGOR",label:"Academic Rigor",desc:"Detailed subject mastery, exam trends, and target scores"},{key:"GROWTH_MINDSET",label:"Growth Mindset",desc:"Encouraging, celebrates effort and perseverance"}],H=[{subject:"Integrated Science",topic:"Photosynthesis & Plant Respiration"},{subject:"Mathematics",topic:"Quadratic Equations & Parabolic Graphs"},{subject:"Chemistry",topic:"Acids, Bases, Indicators & Salt Formation"},{subject:"Biology",topic:"Cell Division, Mitosis & Genetic Inheritance"},{subject:"Physics",topic:"Newtonian Motion, Force & Momentum"},{subject:"English",topic:"Argumentative Essay Writing & Persuasive Devices"}],I=[{subject:"Integrated Science",strand:"Living Things and Their Environment",subStrand:"Plant and Animal Adaptations"},{subject:"Mathematics",strand:"Numbers and Operations",subStrand:"Fractions, Decimals and Percentages"},{subject:"Social Studies",strand:"Natural and Built Environment",subStrand:"Weather Systems and Climate Impact"},{subject:"Agriculture & Nutrition",strand:"Conserving Agricultural Environment",subStrand:"Soil Conservation & Water Harvesting"},{subject:"Pre-Technical Studies",strand:"Materials for Production",subStrand:"Metallic and Non-Metallic Materials"},{subject:"Creative Arts & Sports",strand:"Visual Arts and Design",subStrand:"Drawing and Color Application"},{subject:"Kiswahili",strand:"Kusikiliza na Kuzungumza",subStrand:"Mazingira na Uhifadhi"}];function J(){return(0,d.jsx)(z.O,{allowedRoles:[...x.oc,...x.zZ],children:(0,d.jsx)(K,{})})}function K(){let{user:a}=(0,y.A)(),[b,c]=(0,e.useState)(null),[f,z]=(0,e.useState)(null),[J,K]=(0,e.useState)(""),[L,M]=(0,e.useState)(""),[N,O]=(0,e.useState)("English"),[P,Q]=(0,e.useState)("CBC"),[R,S]=(0,e.useState)("scheme-of-work"),[T,U]=(0,e.useState)([]),[V,W]=(0,e.useState)({}),[X,Y]=(0,e.useState)({}),[Z,$]=(0,e.useState)(1),[_,aa]=(0,e.useState)(!1),[ab,ac]=(0,e.useState)(!1),[ad,ae]=(0,e.useState)(""),[af,ag]=(0,e.useState)(""),[ah,ai]=(0,e.useState)(""),[aj,ak]=(0,e.useState)("Integrated Science"),[al,am]=(0,e.useState)("Living Things and Their Environment"),[an,ao]=(0,e.useState)("Plant and Animal Adaptations"),[ap,aq]=(0,e.useState)(1),[ar,as]=(0,e.useState)(10),[at,au]=(0,e.useState)(4),[av,aw]=(0,e.useState)("CBC"),[ax,ay]=(0,e.useState)(null),[az,aA]=(0,e.useState)("Integrated Science"),[aB,aC]=(0,e.useState)("Photosynthesis & Plant Respiration"),[aD,aE]=(0,e.useState)("Living Things and Their Environment"),[aF,aG]=(0,e.useState)("Plant Respiration & Photosynthesis"),[aH,aI]=(0,e.useState)(45),[aJ,aK]=(0,e.useState)("CBC"),[aL,aM]=(0,e.useState)(null),[aN,aO]=(0,e.useState)(!1),[aP,aQ]=(0,e.useState)(null),[aR,aS]=(0,e.useState)(!1),[aT,aU]=(0,e.useState)(null),[aV,aW]=(0,e.useState)(!1),[aX,aY]=(0,e.useState)("Mathematics"),[aZ,a$]=(0,e.useState)("Quadratic Equations"),[a_,a0]=(0,e.useState)("Quadratic equations are second-degree polynomial equations of the form ax^2 + bx + c = 0, where a is non-zero. The roots can be determined using factorization, completing the square, or the quadratic formula x = (-b \xb1 √(b^2 - 4ac)) / (2a). The discriminant D = b^2 - 4ac determines the nature of the roots: if D > 0, there are two distinct real roots; if D = 0, there is one repeated real root; if D < 0, roots are complex. Applications include trajectory modeling, projectile motions, optimization of profit margins, and area maximization problems in geometry."),[a1,a2]=(0,e.useState)("QUIZ"),[a3,a4]=(0,e.useState)("MCQ"),[a5,a6]=(0,e.useState)("STANDARD"),a7=(0,e.useRef)(null),a8=(0,e.useRef)(null),a9=(0,e.useCallback)(async()=>{a8.current?.abort();let a=new AbortController;a8.current=a,ag("");try{let{data:b}=await u.uE.get("/teacher-ai/options",{signal:a.signal});a.signal.aborted||(c(b),K(b.classes[0]?.id??""),M(b.terms.find(a=>a.isCurrent)?.id??b.terms[0]?.id??""))}catch(b){a.signal.aborted||ag((0,w.XW)(b))}},[]),ba=(0,e.useCallback)(async a=>{if(J&&L){aa(!0);try{let{data:b}=await u.uE.get("/teacher-ai/roster",{params:{classId:J,termId:L},signal:a});a?.aborted||(z(b),U(b.students.map(a=>a.id)))}catch(b){a?.aborted||ag((0,w.XW)(b))}finally{a?.aborted||aa(!1)}}},[J,L]),bb=b?.status.configured??!1,bc=async()=>{if(!T.length)return;let a=new AbortController;a7.current=a,ac(!0),ag("");let b=0;try{for(let c=0;c<T.length&&!a.signal.aborted;c+=10){ai(`AI is analyzing evidence & drafting remarks: ${b} of ${T.length} students complete…`);let{data:d}=await u.uE.post("/teacher-ai/remarks",{classId:J,termId:L,language:N,students:T.slice(c,c+10).map(a=>({studentId:a,behaviourObservation:V[a]||void 0}))},{timeout:75e3,signal:a.signal});if(a.signal.aborted)break;Y(a=>({...a,...Object.fromEntries(d.remarks.map(a=>[a.studentId,a]))})),b+=d.remarks.length}a.signal.aborted||ai(`🎉 ${b} personalized ${P} remarks drafted in 1 click! Review, edit as needed, and approve.`)}catch(c){a.signal.aborted||(ag((0,w.XW)(c)),ai(`${b} remarks generated before interruption. Completed drafts are saved below.`))}finally{ac(!1)}},bd=async()=>{ac(!0),ag(""),ai("");try{let{data:a}=await u.uE.post("/teacher-ai/report-cards",{classId:J,termId:L},{timeout:75e3});await ba(),ai(`${a.generated} draft report cards prepared; ${a.skipped} preserved; ${a.errors.length} skipped.`)}catch(a){ag((0,w.XW)(a))}finally{ac(!1)}},be=async a=>{let b=f?.students.find(b=>b.id===a),c=X[a];if(b?.reportCard&&c){ae(a),ag("");try{let{data:d}=await u.uE.post("/teacher-ai/remarks/save",{classId:J,termId:L,studentId:a,reportCardId:b.reportCard.id,expectedUpdatedAt:b.reportCard.updatedAt,remark:c.text});z(b=>b?{...b,students:b.students.map(b=>b.id===a&&b.reportCard?{...b,reportCard:{...b.reportCard,updatedAt:d.updatedAt,comment:d.comment}}:b)}:b),ai(`Reviewed remark saved to ${b.name}'s official report card.`)}catch(a){ag((0,w.XW)(a))}finally{ae("")}}},bf=async()=>{let a=Object.keys(X);if(!a.length||!f)return;ac(!0),ag("");let b=0;try{for(let c of a){let a=f.students.find(a=>a.id===c),d=X[c];a?.reportCard&&d&&"DRAFT"===a.reportCard.status&&(await u.uE.post("/teacher-ai/remarks/save",{classId:J,termId:L,studentId:c,reportCardId:a.reportCard.id,expectedUpdatedAt:a.reportCard.updatedAt,remark:d.text}),b++)}await ba(),ai(`🎉 Approved & saved ${b} personalized remarks to official student report cards in 1 click!`)}catch(a){ag((0,w.XW)(a))}finally{ac(!1)}},bg=async()=>{if(!aj.trim()||!al.trim()||!J)return;let a=new AbortController;a7.current=a,ac(!0),ag(""),ai(""),ay(null);try{let b=await (0,v.BS)({classId:J,subject:aj.trim(),strand:al.trim(),subStrand:an.trim()||void 0,termNumber:ap,weeksCount:ar,lessonsPerWeek:at,curriculum:av,language:N},a.signal);a.signal.aborted||(ay(b),ai("\uD83C\uDF89 Kenyan CBC Scheme of Work successfully created in under 10 seconds! Ready to print PDF or send to chat."))}catch(b){a.signal.aborted||ag((0,w.XW)(b))}finally{ac(!1)}},bh=async()=>{if(!az.trim()||!aB.trim()||!J)return;let a=new AbortController;a7.current=a,ac(!0),ag(""),ai(""),aM(null);try{let b=await (0,v.ZU)({classId:J,subject:az.trim(),chapter:aB.trim(),strand:aD.trim()||void 0,subStrand:aF.trim()||void 0,durationMinutes:aH,curriculum:aJ,language:N},a.signal);a.signal.aborted||(aM(b),ai("✨ Complete 5E Lesson Plan generated in under 10 seconds! Ready to teach, print as PDF or send to chat."))}catch(b){a.signal.aborted||ag((0,w.XW)(b))}finally{ac(!1)}},bi=async a=>{if(!J)return void ag("Please select a class first.");aS(!0),ag("");try{let b=await (0,v.Br)({classId:J,title:a.title,summary:a.title,content:a.content,type:a.type});ai(`🚀 Successfully posted to ${b.channelName}! Learners & parents can immediately see the outcomes and inquiries in chat.`),aO(!1)}catch(a){ag((0,w.XW)(a))}finally{aS(!1)}},bj=async()=>{let a=new AbortController;a7.current=a,ac(!0),ag(""),ai(""),aU(null),aW(!1);try{let{data:b}=await u.uE.post("/teacher-ai/quiz",{classId:J,subject:aX.trim(),chapter:aZ.trim(),sourceText:a_.trim(),language:N,format:a1,questionType:a3,difficulty:a5},{timeout:75e3,signal:a.signal});a.signal.aborted||(aU(b),ai("✨ 10 Objective questions and teacher grading master ready in seconds!"))}catch(b){a.signal.aborted||ag((0,w.XW)(b))}finally{ac(!1)}},bk=f?.students??[],bl=Math.max(1,Math.ceil(bk.length/8)),bm=Math.min(Z,bl),bn=bk.slice((bm-1)*8,8*bm),bo=a&&x.zZ.includes(a.role)?"/school":"/teacher";return(0,d.jsxs)("div",{className:"ai-studio",children:[(0,d.jsxs)("div",{className:"ai-screen content-stack",children:[(0,d.jsx)(A.Av,{eyebrow:"AI & INTELLIGENT ACADEMIC COPILOT",title:"AI Teaching & Academic Studio",description:"Automate term-end report card remarks, generate 5E lesson plans in 10 seconds, and produce printable student worksheets.",actions:(0,d.jsx)("div",{className:"flex items-center gap-2",children:(0,d.jsxs)(g(),{href:"/dashboard/copilot",className:"px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-all flex items-center gap-1.5",children:[(0,d.jsx)(h.A,{size:14}),"Ask ERP Copilot"]})})}),af&&(0,d.jsxs)("div",{className:"state-box",role:"alert",children:[af,!b&&(0,d.jsx)(B.$n,{variant:"outline",size:"sm",onClick:()=>void a9(),children:"Try again"})]}),ah&&(0,d.jsx)("div",{className:"state-box success",role:"status",children:ah}),b?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{className:"analytics-intro",children:[(0,d.jsx)(h.A,{size:25}),(0,d.jsxs)("div",{children:[(0,d.jsx)("strong",{children:bb?"Intelligent Academic Copilot Active":"AI teaching tools need configuration"}),(0,d.jsx)("p",{children:b.status.message}),(0,d.jsx)("small",{children:"Uses real attendance, exam scores, and classroom observations. Review and approve before finalizing report cards."})]})]}),b.classes.length?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{className:"ai-controls panel panel-body",children:[(0,d.jsxs)("label",{className:"field",children:["Class",(0,d.jsx)("select",{"aria-label":"Class",value:J,disabled:ab||!!ad,onChange:a=>K(a.target.value),children:b.classes.map(a=>(0,d.jsx)("option",{value:a.id,children:a.name},a.id))})]}),(0,d.jsxs)("label",{className:"field",children:["Report-card term",(0,d.jsxs)("select",{"aria-label":"Report-card term",value:L,disabled:ab||!!ad,onChange:a=>M(a.target.value),children:[(0,d.jsx)("option",{value:"",children:"Select term"}),b.terms.map(a=>(0,d.jsx)("option",{value:a.id,children:a.name},a.id))]})]}),(0,d.jsxs)("label",{className:"field",children:["Language",(0,d.jsx)("select",{"aria-label":"Language",value:N,disabled:ab,onChange:a=>O(a.target.value),children:F.map(a=>(0,d.jsx)("option",{value:a,children:"Malayalam"===a?"Malayalam (മലയാളം)":a},a))})]})]}),(0,d.jsxs)("div",{className:"section-tabs",role:"group","aria-label":"Teaching tools",children:[(0,d.jsxs)("button",{className:"scheme-of-work"===R?"selected":"","aria-pressed":"scheme-of-work"===R,disabled:ab,onClick:()=>S("scheme-of-work"),children:[(0,d.jsx)(i.A,{size:16,className:"inline mr-2 text-emerald-600"}),"\uD83C\uDDF0\uD83C\uDDEA CBC Scheme of Work (KICD)"]}),(0,d.jsxs)("button",{className:"lesson-plan"===R?"selected":"","aria-pressed":"lesson-plan"===R,disabled:ab,onClick:()=>S("lesson-plan"),children:[(0,d.jsx)(j.A,{size:16,className:"inline mr-2 text-indigo-600"}),"⚡ Daily Lesson Plan (10s)"]}),(0,d.jsxs)("button",{className:"remarks"===R?"selected":"","aria-pressed":"remarks"===R,disabled:ab,onClick:()=>S("remarks"),children:[(0,d.jsx)(k.A,{size:16,className:"inline mr-2 text-blue-600"}),"1-Click Report Card Remarks"]}),(0,d.jsxs)("button",{className:"quiz"===R?"selected":"","aria-pressed":"quiz"===R,disabled:ab,onClick:()=>S("quiz"),children:[(0,d.jsx)(l.A,{size:16,className:"inline mr-2 text-amber-600"}),"Quiz & Worksheet Maker (PDF)"]})]}),"remarks"===R&&(0,d.jsxs)(A.Zk,{title:"AI Automated Report Card Remarks Generator",subtitle:"Analyzes marks, attendance, and behavior in 1 click to produce personalized CBC/curriculum feedback for every student.",children:[(0,d.jsxs)("div",{className:"bg-gray-50 border-b border-gray-200 p-4",children:[(0,d.jsx)("label",{className:"text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2",children:"Pedagogical Feedback Framework:"}),(0,d.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2",children:G.map(a=>(0,d.jsxs)("button",{type:"button",onClick:()=>Q(a.key),className:`p-2.5 rounded-lg border text-left transition-all text-xs ${P===a.key?"bg-indigo-50 border-indigo-400 text-indigo-950 shadow-sm font-semibold":"bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`,children:[(0,d.jsx)("span",{className:"block",children:a.label}),(0,d.jsx)("span",{className:"text-[11px] text-gray-500 font-normal leading-tight block mt-0.5",children:a.desc})]},a.key))})]}),(0,d.jsxs)("div",{className:"panel-body ai-action-row",children:[(0,d.jsxs)(B.$n,{size:"sm",isLoading:ab,disabled:!bb||!T.length||_||!!ad,leftIcon:(0,d.jsx)(h.A,{size:15}),onClick:()=>void bc(),children:["1-Click Generate Selected Remarks (",T.length,")"]}),(0,d.jsxs)(B.$n,{size:"sm",variant:"primary",disabled:ab||!Object.keys(X).length||_||!!ad,leftIcon:(0,d.jsx)(m.A,{size:15}),onClick:()=>void bf(),children:["1-Click Approve & Save All Drafts (",Object.keys(X).length,")"]}),(0,d.jsx)(B.$n,{size:"sm",variant:"outline",disabled:ab||!L||!J||_||!!ad,onClick:()=>void bd(),children:"Prepare Draft Report Cards"}),(0,d.jsx)(B.$n,{size:"sm",variant:"outline",leftIcon:(0,d.jsx)(n.A,{size:15}),disabled:!Object.keys(X).length||ab,onClick:()=>(0,w.z9)("reviewed-student-remarks",[{key:"name",label:"Student Name"},{key:"admission",label:"Admission Number"},{key:"average",label:"Term Average %"},{key:"attendance",label:"Attendance %"},{key:"remark",label:"Personalized Teacher Remark"},{key:"evidence",label:"Factual Evidence"}],(f?.students??[]).filter(a=>X[a.id]).map(a=>({name:a.name,admission:a.admissionNumber,average:null!==a.average?`${a.average}%`:"N/A",attendance:null!==a.attendanceRate?`${a.attendanceRate}%`:"N/A",remark:X[a.id].text,evidence:X[a.id].evidence.join(" | ")}))),children:"Export Drafts CSV"}),(0,d.jsx)(B.$n,{size:"sm",variant:"ghost",disabled:ab||_,onClick:()=>{ag(""),ba()},children:"Reload Roster"})]}),_?(0,d.jsx)("div",{className:"panel-body",role:"status",children:"Loading class evidence…"}):L?bk.length?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{className:"ai-selection",children:[(0,d.jsxs)("label",{children:[(0,d.jsx)("input",{type:"checkbox","aria-label":"Select all students",checked:T.length===bk.length,disabled:ab,onChange:a=>U(a.target.checked?bk.map(a=>a.id):[])})," ","Select all ",bk.length," students"]}),(0,d.jsx)("span",{children:"Saves hours of typing: review and approve with one click."})]}),(0,d.jsx)("div",{className:"ai-remark-list",children:bn.map(a=>(0,d.jsxs)("section",{className:"ai-remark",children:[(0,d.jsxs)("div",{className:"ai-remark-heading",children:[(0,d.jsxs)("label",{children:[(0,d.jsx)("input",{type:"checkbox",checked:T.includes(a.id),"aria-label":`Select ${a.name}`,disabled:ab,onChange:b=>U(c=>b.target.checked?[...c,a.id]:c.filter(b=>b!==a.id))}),(0,d.jsx)("strong",{children:a.name})]}),(0,d.jsx)("span",{className:"pill neutral",children:a.reportCard?.status.replaceAll("_"," ").toLowerCase()??"No report card"})]}),(0,d.jsxs)("p",{className:"muted ai-evidence-summary",children:[a.admissionNumber," \xb7 Term average: ",null===a.average?"No marks":`${a.average}%`," \xb7 Recorded attendance: ",null===a.attendanceRate?"No records":`${a.attendanceRate}% across ${a.attendanceDays} days`]}),(0,d.jsxs)("div",{className:"ai-remark-fields",children:[(0,d.jsxs)("label",{className:"field",children:["Classroom behaviour & observation (optional)",(0,d.jsx)("textarea",{"aria-label":`Behaviour observation for ${a.name}`,maxLength:800,value:V[a.id]||"",disabled:ab,placeholder:"e.g. Shows exceptional teamwork, highly inquisitive during labs, builds confidence in public speaking.",onChange:b=>W(c=>({...c,[a.id]:b.target.value}))})]}),(0,d.jsxs)("label",{className:"field",children:[X[a.id]?"AI Draft Remark (Edit before saving)":"Current Report Card Remark",(0,d.jsx)("textarea",{"aria-label":`Remark for ${a.name}`,maxLength:2e3,disabled:ab||!X[a.id]&&!a.reportCard||ad===a.id,value:X[a.id]?.text??a.reportCard?.comment??"",placeholder:"Click 'Generate Remarks' to create a personalized draft from student evidence.",onChange:b=>Y(c=>({...c,[a.id]:{studentId:a.id,evidence:c[a.id]?.evidence||[],text:b.target.value}}))})]})]}),X[a.id]&&(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("ul",{className:"ai-source-list",children:X[a.id].evidence.map((a,b)=>(0,d.jsx)("li",{children:a},b))}),(0,d.jsxs)("div",{className:"ai-action-row",children:[(0,d.jsx)(B.$n,{size:"sm",isLoading:ad===a.id,disabled:ab||!!ad||a.reportCard?.status!=="DRAFT"||X[a.id].text.trim().length<10,onClick:()=>void be(a.id),children:"Approve & Save Remark"}),a.reportCard?.status!=="DRAFT"&&(0,d.jsx)("span",{className:"muted text-xs",children:a.reportCard?"Approved reports are locked.":"Prepare a draft report card first."})]})]})]},a.id))}),(0,d.jsxs)("div",{className:"table-pagination",children:[(0,d.jsxs)("span",{children:[(bm-1)*8+1,"–",Math.min(8*bm,bk.length)," of ",bk.length," students"]}),(0,d.jsxs)("div",{className:"flex gap-3",children:[(0,d.jsx)(B.$n,{size:"sm",variant:"outline",disabled:1===bm,onClick:()=>$(bm-1),children:"Previous"}),(0,d.jsx)(B.$n,{size:"sm",variant:"outline",disabled:bm>=bl,onClick:()=>$(bm+1),children:"Next"})]})]})]}):(0,d.jsx)(A.pp,{title:"No active students in this class"}):(0,d.jsx)(A.pp,{title:"Select a term",description:"Choose a term to load saved marks and attendance."})]}),"scheme-of-work"===R&&(0,d.jsx)(A.Zk,{title:"\uD83C\uDDF0\uD83C\uDDEA Kenyan CBC / KICD Scheme of Work Generator",subtitle:"Generate a complete termly Scheme of Work matrix compliant with KICD standards in 10 seconds. Includes Strands, Sub-strands, Specific Learning Outcomes, Key Inquiry Questions, Learning Experiences, Resources, and Assessment Rubrics.",children:(0,d.jsxs)("div",{className:"panel-body content-stack",children:[(0,d.jsxs)("div",{className:"bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100",children:[(0,d.jsx)("span",{className:"text-xs font-semibold text-emerald-950 uppercase tracking-wider block mb-2",children:"Quick Kenyan CBC Syllabus Presets:"}),(0,d.jsx)("div",{className:"flex flex-wrap gap-2",children:I.map((a,b)=>(0,d.jsxs)("button",{type:"button",onClick:()=>{ak(a.subject),am(a.strand),ao(a.subStrand)},className:"text-xs bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all",children:[(0,d.jsxs)("strong",{children:[a.subject,":"]})," ",a.strand]},b))})]}),(0,d.jsxs)("div",{className:"form-grid",children:[(0,d.jsxs)("label",{className:"field",children:["Learning Area / Subject",(0,d.jsx)("input",{required:!0,value:aj,disabled:ab,onChange:a=>ak(a.target.value),placeholder:"e.g. Integrated Science, Mathematics, Agriculture & Nutrition"})]}),(0,d.jsxs)("label",{className:"field",children:["Strand (Main Topic Theme)",(0,d.jsx)("input",{required:!0,value:al,disabled:ab,onChange:a=>am(a.target.value),placeholder:"e.g. Living Things, Numbers and Operations, Soil Conservation"})]}),(0,d.jsxs)("label",{className:"field",children:["Sub-Strand (Specific Unit)",(0,d.jsx)("input",{value:an,disabled:ab,onChange:a=>ao(a.target.value),placeholder:"e.g. Plant and Animal Adaptations (Optional)"})]})]}),(0,d.jsxs)("div",{className:"ai-controls",children:[(0,d.jsxs)("label",{className:"field",children:["Term",(0,d.jsxs)("select",{value:ap,disabled:ab,onChange:a=>aq(Number(a.target.value)),children:[(0,d.jsx)("option",{value:1,children:"Term 1 (Opening Term)"}),(0,d.jsx)("option",{value:2,children:"Term 2 (Mid-Year Term)"}),(0,d.jsx)("option",{value:3,children:"Term 3 (Culmination Term)"})]})]}),(0,d.jsxs)("label",{className:"field",children:["Weeks Planned",(0,d.jsxs)("select",{value:ar,disabled:ab,onChange:a=>as(Number(a.target.value)),children:[(0,d.jsx)("option",{value:6,children:"6 Weeks (Short Term)"}),(0,d.jsx)("option",{value:8,children:"8 Weeks"}),(0,d.jsx)("option",{value:10,children:"10 Weeks (Standard KICD Term)"}),(0,d.jsx)("option",{value:12,children:"12 Weeks (Extended Term)"})]})]}),(0,d.jsxs)("label",{className:"field",children:["Lessons / Week",(0,d.jsxs)("select",{value:at,disabled:ab,onChange:a=>au(Number(a.target.value)),children:[(0,d.jsx)("option",{value:3,children:"3 Lessons / Week"}),(0,d.jsx)("option",{value:4,children:"4 Lessons / Week (Standard)"}),(0,d.jsx)("option",{value:5,children:"5 Lessons / Week"})]})]}),(0,d.jsxs)("label",{className:"field",children:["Curriculum Framework",(0,d.jsxs)("select",{value:av,disabled:ab,onChange:a=>aw(a.target.value),children:[(0,d.jsx)("option",{value:"CBC",children:"Kenyan CBC (KICD Framework)"}),(0,d.jsx)("option",{value:"STANDARD",children:"Standard National Curriculum"}),(0,d.jsx)("option",{value:"CAMBRIDGE",children:"Cambridge Lower Secondary"}),(0,d.jsx)("option",{value:"NCERT",children:"NCERT / CBSE Framework"})]})]})]}),(0,d.jsx)("div",{children:(0,d.jsx)(B.$n,{isLoading:ab,disabled:!bb||!J||!aj.trim()||!al.trim(),leftIcon:(0,d.jsx)(o.A,{size:16}),onClick:()=>void bg(),children:"Generate CBC Scheme of Work in 10s"})}),ax&&(0,d.jsxs)("div",{className:"mt-6 border border-emerald-200 rounded-2xl bg-white p-6 shadow-sm space-y-6",children:[(0,d.jsxs)("div",{className:"flex flex-col md:flex-row items-start justify-between border-b pb-4 gap-4",children:[(0,d.jsxs)("div",{children:[(0,d.jsxs)("span",{className:"text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",children:["REPUBLIC OF KENYA \xb7 ",ax.curriculum," \xb7 ",ax.term," (",ax.academicYear,")"]}),(0,d.jsx)("h2",{className:"text-2xl font-bold text-gray-900 mt-2",children:ax.title}),(0,d.jsxs)("p",{className:"text-sm text-gray-600 mt-0.5",children:[(0,d.jsx)("strong",{children:"Strand:"})," ",ax.strand," \xb7 ",(0,d.jsx)("strong",{children:"Level:"})," ",ax.gradeLevel," \xb7 ",(0,d.jsx)("strong",{children:"Total Lessons:"})," ",ax.weeks.length," Lessons Planned"]})]}),(0,d.jsxs)("div",{className:"flex flex-wrap gap-2",children:[(0,d.jsx)(B.$n,{size:"sm",variant:"primary",leftIcon:(0,d.jsx)(p.A,{size:14}),onClick:()=>(function(a){let b=window.open("","_blank");if(!b)return void window.print();let c=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>CBC Scheme of Work - ${D(a.title)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.35; padding: 10px; margin: 0; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; }
    .national-title { font-size: 13px; font-weight: 800; letter-spacing: 1.2px; color: #047857; text-transform: uppercase; }
    .school-title { font-size: 17px; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
    .sow-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-top: 4px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
    .meta-table td { padding: 4px 6px; border: 1px solid #cbd5e1; background: #f8fafc; }
    .competency-box { display: flex; gap: 8px; margin: 8px 0; font-size: 10.5px; }
    .competency-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px 8px; background: #ffffff; }
    .competency-card strong { color: #0f172a; display: block; margin-bottom: 2px; font-size: 10.5px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
    .sow-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    .sow-table th, .sow-table td { border: 1px solid #64748b; padding: 5px 6px; text-align: left; vertical-align: top; }
    .sow-table th { background: #0f172a; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
    .sow-table tr:nth-child(even) { background: #f8fafc; }
    ul { margin: 2px 0 2px 14px; padding: 0; }
    li { margin-bottom: 2px; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 12px; page-break-inside: avoid; }
    .rubric-table th, .rubric-table td { border: 1px solid #94a3b8; padding: 5px 6px; }
    .rubric-table th { background: #f1f5f9; color: #0f172a; font-weight: 700; }
    .footer-signatures { margin-top: 20px; display: flex; justify-content: space-between; font-size: 11px; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #334155; width: 200px; text-align: center; padding-top: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="national-title">REPUBLIC OF KENYA \xb7 MINISTRY OF EDUCATION \xb7 KICD CBC CURRICULUM</div>
    <div class="school-title">OFFICIAL SCHEME OF WORK</div>
    <div class="sow-title">${D(a.title)}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Learning Area / Subject:</strong> ${D(a.subject)}</td>
        <td><strong>Grade Level:</strong> ${D(a.gradeLevel)}</td>
        <td><strong>Strand:</strong> ${D(a.strand)}</td>
      </tr>
      <tr>
        <td><strong>Term & Year:</strong> ${D(a.term)} \xb7 ${D(a.academicYear)}</td>
        <td><strong>Curriculum Standard:</strong> ${D(a.curriculum)} (KICD Compliant)</td>
        <td><strong>Total Lessons Planned:</strong> ${a.weeks.length} Lessons</td>
      </tr>
    </table>
  </div>

  <div class="competency-box">
    <div class="competency-card">
      <strong>🎯 General Learning Outcomes</strong>
      <ul>
        ${a.generalOutcomes.map(a=>`<li>${D(a)}</li>`).join("")}
      </ul>
    </div>
    <div class="competency-card">
      <strong>✨ Core Competencies & Values & PCIs</strong>
      <div><strong>Competencies:</strong> ${D(a.coreCompetencies.join(", "))}</div>
      <div style="margin-top: 3px;"><strong>Values:</strong> ${D(a.values.join(", "))}</div>
      <div style="margin-top: 3px;"><strong>PCIs:</strong> ${D(a.pcis.join(", "))}</div>
    </div>
  </div>

  <table class="sow-table">
    <thead>
      <tr>
        <th style="width: 4%;">Wk</th>
        <th style="width: 4%;">Les</th>
        <th style="width: 14%;">Strand & Sub-Strand</th>
        <th style="width: 22%;">Specific Learning Outcomes (SLOs)</th>
        <th style="width: 14%;">Key Inquiry Questions</th>
        <th style="width: 18%;">Learning Experiences</th>
        <th style="width: 12%;">Resources</th>
        <th style="width: 12%;">Assessment Methods</th>
      </tr>
    </thead>
    <tbody>
      ${a.weeks.map(a=>`
        <tr>
          <td style="text-align: center; font-weight: bold;">${a.week}</td>
          <td style="text-align: center; font-weight: bold;">${a.lessonNumber}</td>
          <td><strong>${D(a.strand)}</strong><br/><span style="color: #475569;">${D(a.subStrand)}</span></td>
          <td>
            <ul>
              ${a.specificLearningOutcomes.map(a=>`<li>${D(a)}</li>`).join("")}
            </ul>
          </td>
          <td>
            <ul>
              ${a.keyInquiryQuestions.map(a=>`<li>${D(a)}</li>`).join("")}
            </ul>
          </td>
          <td>
            <ul>
              ${a.learningExperiences.map(a=>`<li>${D(a)}</li>`).join("")}
            </ul>
          </td>
          <td>${D(a.learningResources.join("; "))}</td>
          <td>${D(a.assessmentMethods.join(", "))}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h4 style="font-size: 11px; text-transform: uppercase; margin-top: 14px; margin-bottom: 4px;">Assessment Rubrics & Mastery Standards (CBC / KNEC Framework)</h4>
  ${a.assessmentRubrics.map(a=>`
    <table class="rubric-table">
      <thead>
        <tr>
          <th colspan="4">Criterion: ${D(a.criterion)}</th>
        </tr>
        <tr>
          <th style="width: 25%;">Exceeding Expectation (Level 4)</th>
          <th style="width: 25%;">Meeting Expectation (Level 3)</th>
          <th style="width: 25%;">Approaching Expectation (Level 2)</th>
          <th style="width: 25%;">Below Expectation (Level 1)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${a.levels.map(a=>`
            <td>
              <strong>${D(a.scoreRange)}:</strong><br/>
              ${D(a.descriptor)}
            </td>
          `).join("")}
        </tr>
      </tbody>
    </table>
  `).join("")}

  <div class="footer-signatures">
    <div class="sig-line">Subject Teacher Signature & Date</div>
    <div class="sig-line">Head of Department (HOD) Approval</div>
    <div class="sig-line">Principal / Headteacher Stamp & Sign</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`;b.document.open(),b.document.write(c),b.document.close()})(ax),children:"Print / Save PDF (Landscape)"}),(0,d.jsx)(B.$n,{size:"sm",variant:"secondary",leftIcon:(0,d.jsx)(q.A,{size:14}),onClick:()=>{let a=`📋 **${ax.title}**

🏛️ **Strand:** ${ax.strand} | **Term:** ${ax.term} (${ax.academicYear})

🎯 **General Outcomes (പഠന ലക്ഷ്യങ്ങൾ):**
${ax.generalOutcomes.map((a,b)=>`${b+1}. ${a}`).join("\n")}

✨ **Core Competencies & Values:** ${ax.coreCompetencies.slice(0,4).join(", ")}

📅 **Weekly Overview:** ${ax.weeks.length} Lessons scheduled. Inquiry tasks and materials will be shared as each unit begins.`;aQ({title:ax.title,content:a,type:"SCHEME_OF_WORK"}),aO(!0)},children:"Share to Class Chat"}),(0,d.jsx)(B.$n,{size:"sm",variant:"outline",leftIcon:(0,d.jsx)(n.A,{size:14}),onClick:()=>C(`${al.toLowerCase().replace(/\\s+/g,"-")}-scheme-of-work.txt`,["REPUBLIC OF KENYA - MINISTRY OF EDUCATION",`KICD CBC SCHEME OF WORK: ${ax.title}`,`Subject: ${ax.subject} | Grade Level: ${ax.gradeLevel} | Term: ${ax.term} | Year: ${ax.academicYear}`,`Curriculum: ${ax.curriculum} | Strand: ${ax.strand}`,"=".repeat(80),"","GENERAL LEARNING OUTCOMES:",...ax.generalOutcomes.map((a,b)=>`  ${b+1}. ${a}`),"","CORE COMPETENCIES & VALUES & PCIS:",...ax.coreCompetencies.map(a=>`  • Competency: ${a}`),...ax.values.map(a=>`  • Value: ${a}`),...ax.pcis.map(a=>`  • PCI: ${a}`),"","WEEKLY SCHEME OF WORK BREAKDOWN:","=".repeat(80),...ax.weeks.flatMap(a=>[`WEEK ${a.week}, LESSON ${a.lessonNumber}: [${a.strand} > ${a.subStrand}]`,"  Specific Learning Outcomes:",...a.specificLearningOutcomes.map(a=>`    - ${a}`),"  Key Inquiry Questions:",...a.keyInquiryQuestions.map(a=>`    ? ${a}`),"  Learning Experiences:",...a.learningExperiences.map(a=>`    * ${a}`),`  Resources: ${a.learningResources.join("; ")}`,`  Assessment Methods: ${a.assessmentMethods.join(", ")}`,`  Teacher Reflection: ${a.reflection||"Reviewed and achieved."}`,"-".repeat(60)]),"","ASSESSMENT RUBRICS (4 LEVELS - KNEC / CBC STANDARD):",...ax.assessmentRubrics.flatMap(a=>[`Criterion: ${a.criterion}`,...a.levels.map(a=>`  [${a.level}] (${a.scoreRange}): ${a.descriptor}`),""])].join("\n")),children:"Download TXT"})]})]}),(0,d.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,d.jsxs)("div",{className:"bg-emerald-50/50 p-4 rounded-xl border border-emerald-100",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2",children:"\uD83C\uDFAF General Learning Outcomes (പഠന ലക്ഷ്യങ്ങൾ)"}),(0,d.jsx)("ul",{className:"text-xs text-gray-800 space-y-1.5 list-disc list-inside",children:ax.generalOutcomes.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]}),(0,d.jsxs)("div",{className:"bg-slate-50 p-4 rounded-xl border border-slate-200",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-slate-800 uppercase tracking-wider mb-2",children:"✨ Core Competencies, Values & PCIs"}),(0,d.jsxs)("div",{className:"space-y-1.5 text-xs text-slate-700",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("strong",{children:"Competencies:"})," ",ax.coreCompetencies.join(", ")]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("strong",{children:"Values:"})," ",ax.values.join(", ")]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("strong",{children:"PCIs:"})," ",ax.pcis.join(", ")]})]})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsxs)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-3",children:["\uD83D\uDCC5 Weekly Scheme Breakdown (",ax.weeks.length," Lessons)"]}),(0,d.jsx)("div",{className:"overflow-x-auto border border-gray-200 rounded-xl",children:(0,d.jsxs)("table",{className:"w-full text-left text-xs border-collapse",children:[(0,d.jsx)("thead",{children:(0,d.jsxs)("tr",{className:"bg-gray-100 text-gray-800 border-b font-semibold",children:[(0,d.jsx)("th",{className:"p-2.5 w-12 text-center",children:"Wk"}),(0,d.jsx)("th",{className:"p-2.5 w-12 text-center",children:"Les"}),(0,d.jsx)("th",{className:"p-2.5 w-44",children:"Sub-Strand"}),(0,d.jsx)("th",{className:"p-2.5 min-w-[200px]",children:"Specific Learning Outcomes (SLOs)"}),(0,d.jsx)("th",{className:"p-2.5 min-w-[160px]",children:"Key Inquiry Questions"}),(0,d.jsx)("th",{className:"p-2.5 min-w-[180px]",children:"Learning Experiences"}),(0,d.jsx)("th",{className:"p-2.5 min-w-[140px]",children:"Resources"}),(0,d.jsx)("th",{className:"p-2.5 min-w-[120px]",children:"Assessment"})]})}),(0,d.jsx)("tbody",{className:"divide-y divide-gray-100",children:ax.weeks.map((a,b)=>(0,d.jsxs)("tr",{className:"hover:bg-gray-50/60 transition-colors",children:[(0,d.jsx)("td",{className:"p-2.5 text-center font-bold text-gray-700",children:a.week}),(0,d.jsx)("td",{className:"p-2.5 text-center font-semibold text-gray-600",children:a.lessonNumber}),(0,d.jsx)("td",{className:"p-2.5 font-medium text-emerald-950",children:a.subStrand}),(0,d.jsx)("td",{className:"p-2.5",children:(0,d.jsx)("ul",{className:"list-disc list-inside space-y-0.5 text-gray-700",children:a.specificLearningOutcomes.map((a,b)=>(0,d.jsx)("li",{children:a},b))})}),(0,d.jsx)("td",{className:"p-2.5 text-indigo-900 italic",children:a.keyInquiryQuestions.map((a,b)=>(0,d.jsxs)("div",{className:"mb-1",children:["? ",a]},b))}),(0,d.jsx)("td",{className:"p-2.5 text-gray-600",children:a.learningExperiences.map((a,b)=>(0,d.jsxs)("div",{className:"mb-0.5",children:["• ",a]},b))}),(0,d.jsx)("td",{className:"p-2.5 text-gray-500 text-[11px]",children:a.learningResources.join("; ")}),(0,d.jsx)("td",{className:"p-2.5 text-gray-600 font-medium",children:a.assessmentMethods.join(", ")})]},b))})]})})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-2",children:"\uD83D\uDCCA CBC / KNEC 4-Level Assessment Rubrics"}),(0,d.jsx)("div",{className:"space-y-3",children:ax.assessmentRubrics.map((a,b)=>(0,d.jsxs)("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[(0,d.jsxs)("div",{className:"bg-gray-100 px-3.5 py-2 font-bold text-xs text-gray-800",children:["Criterion: ",a.criterion]}),(0,d.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-xs",children:a.levels.map((a,b)=>(0,d.jsxs)("div",{className:"p-3 bg-white",children:[(0,d.jsxs)("span",{className:`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${"EXCEEDING"===a.level?"bg-emerald-100 text-emerald-800":"MEETING"===a.level?"bg-blue-100 text-blue-800":"APPROACHING"===a.level?"bg-amber-100 text-amber-800":"bg-rose-100 text-rose-800"}`,children:[a.level," (",a.scoreRange,")"]}),(0,d.jsx)("p",{className:"text-gray-700 text-[11px] leading-relaxed mt-1",children:a.descriptor})]},b))})]},b))})]})]})]})}),"lesson-plan"===R&&(0,d.jsx)(A.Zk,{title:"10-Second AI 5E Lesson Plan Generator",subtitle:"Select subject and topic to generate a comprehensive 5E lesson plan with objectives, inquiry flow, differentiation, and rubrics.",children:(0,d.jsxs)("div",{className:"panel-body content-stack",children:[(0,d.jsxs)("div",{className:"bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100",children:[(0,d.jsx)("span",{className:"text-xs font-semibold text-indigo-950 uppercase tracking-wider block mb-2",children:"Quick Syllabus Chapter Presets:"}),(0,d.jsx)("div",{className:"flex flex-wrap gap-2",children:H.map((a,b)=>(0,d.jsxs)("button",{type:"button",onClick:()=>{aA(a.subject),aC(a.topic)},className:"text-xs bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all",children:[(0,d.jsxs)("strong",{children:[a.subject,":"]})," ",a.topic]},b))})]}),(0,d.jsxs)("div",{className:"form-grid",children:[(0,d.jsxs)("label",{className:"field",children:["Subject",(0,d.jsx)("input",{required:!0,value:az,disabled:ab,onChange:a=>aA(a.target.value),placeholder:"e.g. Integrated Science, Mathematics, Biology"})]}),(0,d.jsxs)("label",{className:"field",children:["Chapter or Topic",(0,d.jsx)("input",{required:!0,value:aB,disabled:ab,onChange:a=>aC(a.target.value),placeholder:"e.g. Photosynthesis, Quadratic Equations"})]})]}),(0,d.jsxs)("div",{className:"ai-controls",children:[(0,d.jsxs)("label",{className:"field",children:["Lesson Duration",(0,d.jsxs)("select",{value:aH,disabled:ab,onChange:a=>aI(Number(a.target.value)),children:[(0,d.jsx)("option",{value:40,children:"40 Minutes (Standard Period)"}),(0,d.jsx)("option",{value:45,children:"45 Minutes (Extended Period)"}),(0,d.jsx)("option",{value:60,children:"60 Minutes (Double Period)"}),(0,d.jsx)("option",{value:80,children:"80 Minutes (Lab Block)"})]})]}),(0,d.jsxs)("label",{className:"field",children:["Curriculum Framework",(0,d.jsxs)("select",{value:aJ,disabled:ab,onChange:a=>aK(a.target.value),children:[(0,d.jsx)("option",{value:"CBC",children:"CBC (Competency-Based Curriculum)"}),(0,d.jsx)("option",{value:"STANDARD",children:"Standard National Curriculum"}),(0,d.jsx)("option",{value:"CAMBRIDGE",children:"Cambridge / IGCSE Framework"}),(0,d.jsx)("option",{value:"NCERT",children:"NCERT / CBSE Curriculum"})]})]})]}),(0,d.jsx)("div",{children:(0,d.jsx)(B.$n,{isLoading:ab,disabled:!bb||!J||!az.trim()||!aB.trim(),leftIcon:(0,d.jsx)(o.A,{size:16}),onClick:()=>void bh(),children:"Generate 5E Lesson Plan in 10s"})}),aL&&(0,d.jsxs)("div",{className:"mt-6 border border-gray-200 rounded-2xl bg-white p-6 shadow-sm space-y-6",children:[(0,d.jsxs)("div",{className:"flex items-start justify-between border-b pb-4",children:[(0,d.jsxs)("div",{children:[(0,d.jsxs)("span",{className:"text-xs font-bold text-primary-600 uppercase tracking-widest",children:["5E INSTRUCTIONAL MODEL \xb7 ",aL.curriculum]}),(0,d.jsx)("h2",{className:"text-2xl font-bold text-gray-900 mt-1",children:aL.title}),(0,d.jsxs)("p",{className:"text-sm text-gray-500",children:[aL.subject," \xb7 ",aL.gradeLevel," \xb7 ",aL.durationMinutes," Minutes"]})]}),(0,d.jsxs)("div",{className:"flex flex-wrap gap-2",children:[(0,d.jsx)(B.$n,{size:"sm",variant:"primary",leftIcon:(0,d.jsx)(p.A,{size:14}),onClick:()=>(function(a){let b=window.open("","_blank");if(!b)return void window.print();let c=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lesson Plan - ${D(a.title)}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #111827; line-height: 1.45; padding: 20px; max-width: 850px; margin: 0 auto; }
    .header { border-bottom: 2px solid #1e1b4b; padding-bottom: 12px; margin-bottom: 18px; text-align: center; }
    .national-tag { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #047857; text-transform: uppercase; font-family: sans-serif; }
    .school-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .lp-title { font-size: 20px; font-weight: 800; color: #312e81; margin-top: 6px; }
    .meta { font-size: 12px; font-family: sans-serif; color: #4b5563; margin-top: 6px; }
    h3 { font-size: 13px; text-transform: uppercase; font-family: sans-serif; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; }
    ul { font-size: 13px; margin: 4px 0 10px 20px; padding: 0; }
    li { margin-bottom: 4px; }
    .step-card { border: 1px solid #e5e7eb; background: #f9fafb; padding: 10px; margin-bottom: 10px; border-radius: 6px; font-size: 12px; font-family: sans-serif; page-break-inside: avoid; }
    .step-card strong { color: #3730a3; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; font-family: sans-serif; page-break-inside: avoid; }
    .rubric-table th, .rubric-table td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; }
    .rubric-table th { background: #f3f4f6; font-weight: 700; }
    .footer-signatures { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; font-family: sans-serif; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #111; width: 180px; text-align: center; padding-top: 4px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="national-tag">KICD CBC STANDARDS \xb7 DAILY LESSON PLAN</div>
    <div class="school-title">AL-AMEEN INTERNATIONAL ACADEMY</div>
    <div class="lp-title">5E INSTRUCTIONAL LESSON PLAN: ${D(a.title)}</div>
    <div class="meta">
      <strong>Subject:</strong> ${D(a.subject)} | <strong>Grade:</strong> ${D(a.gradeLevel)} | <strong>Duration:</strong> ${a.durationMinutes} Mins | <strong>Curriculum:</strong> ${D(a.curriculum)}
      ${a.strand?`<br/><strong>Strand:</strong> ${D(a.strand)} | <strong>Sub-Strand:</strong> ${D(a.subStrand||a.topic)}`:""}
    </div>
  </div>

  <h3>1. Specific Learning Outcomes (SLOs)</h3>
  <ul>
    ${a.learningObjectives.map(a=>`<li>${D(a)}</li>`).join("")}
  </ul>

  <h3>2. Core Competencies & Values & PCIs</h3>
  <ul>
    ${a.coreCompetencies.map(a=>`<li><strong>Competency:</strong> ${D(a)}</li>`).join("")}
    ${a.values?a.values.map(a=>`<li><strong>Value:</strong> ${D(a)}</li>`).join(""):""}
    ${a.pcis?a.pcis.map(a=>`<li><strong>PCI:</strong> ${D(a)}</li>`).join(""):""}
  </ul>

  <h3>3. Key Inquiry Questions & Teaching Aids</h3>
  <div style="font-size: 13px; margin-bottom: 8px;">
    <strong>Inquiry Questions:</strong>
    <ul>
      ${a.keyInquiryQuestions.map(a=>`<li>${D(a)}</li>`).join("")}
    </ul>
    <strong>Materials Needed:</strong> ${D(a.materials.join(", "))}
  </div>

  <h3>4. 5E Instructional Sequence</h3>
  ${a.steps.map(a=>`
    <div class="step-card">
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
        <span><strong>[${D(a.phase)}]</strong> ${D(a.title)}</span>
        <span>${a.durationMinutes} Mins</span>
      </div>
      <div><strong>Teacher Activity:</strong> ${D(a.teacherActivity)}</div>
      <div style="margin-top: 3px;"><strong>Student Activity:</strong> ${D(a.studentActivity)}</div>
      <div style="margin-top: 3px; font-size: 11px; color: #6b7280;"><strong>Resources:</strong> ${D(a.resourcesNeeded.join(", "))}</div>
    </div>
  `).join("")}

  <h3>5. Differentiated Instruction</h3>
  <div style="font-size: 12px; font-family: sans-serif; display: flex; gap: 16px;">
    <div style="flex: 1; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px; border-radius: 6px;">
      <strong style="color: #92400e;">For Struggling Learners:</strong>
      <ul style="margin-top: 4px;">
        ${a.differentiatedInstruction.supportForStruggling.map(a=>`<li>${D(a)}</li>`).join("")}
      </ul>
    </div>
    <div style="flex: 1; background: #ecfdf5; border: 1px solid #d1fae5; padding: 8px; border-radius: 6px;">
      <strong style="color: #065f46;">For Advanced Learners:</strong>
      <ul style="margin-top: 4px;">
        ${a.differentiatedInstruction.extensionForAdvanced.map(a=>`<li>${D(a)}</li>`).join("")}
      </ul>
    </div>
  </div>

  <h3>6. Assessment Rubrics & Criteria (4 Levels - KNEC Standard)</h3>
  ${a.assessmentRubrics.map(a=>`
    <table class="rubric-table" style="margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="4">Criterion: ${D(a.criterion)}</th>
        </tr>
        <tr>
          <th>Exceeding (Level 4)</th>
          <th>Meeting (Level 3)</th>
          <th>Approaching (Level 2)</th>
          <th>Below (Level 1)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${a.levels.map(a=>`
            <td>
              <strong>${D(a.scoreRange)}:</strong><br/>
              ${D(a.descriptor)}
            </td>
          `).join("")}
        </tr>
      </tbody>
    </table>
  `).join("")}

  <h3>7. Homework & Community Service Learning (CSL) Task</h3>
  <p style="font-size: 13px; font-style: italic;">${D(a.homeworkAssignment)}</p>

  ${a.reflectionPrompt?`
    <h3>8. Teacher's Self-Reflection Prompt</h3>
    <p style="font-size: 12px; color: #4b5563; border-left: 3px solid #6366f1; padding-left: 8px;">${D(a.reflectionPrompt)}</p>
  `:""}

  <div class="footer-signatures">
    <div class="sig-line">Subject Teacher Signature</div>
    <div class="sig-line">Senior Teacher / HOD Approval</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`;b.document.open(),b.document.write(c),b.document.close()})(aL),children:"Print / Save PDF Plan"}),(0,d.jsx)(B.$n,{size:"sm",variant:"secondary",leftIcon:(0,d.jsx)(q.A,{size:14}),onClick:()=>{let a=`📚 **${aL.title}**

🎯 **Specific Learning Outcomes (പഠന ലക്ഷ്യങ്ങൾ):**
${aL.learningObjectives.map((a,b)=>`${b+1}. ${a}`).join("\n")}

❓ **Key Inquiry Questions (ഇൻക്വയറി ചോദ്യങ്ങൾ):**
${aL.keyInquiryQuestions.map(a=>`• ${a}`).join("\n")}

📝 **Homework / Inquiry Task:**
${aL.homeworkAssignment}

💡 **Resources Needed:** ${aL.materials.join(", ")}`;aQ({title:aL.title,content:a,type:"LESSON_PLAN"}),aO(!0)},children:"Share to Class Chat"}),(0,d.jsx)(B.$n,{size:"sm",variant:"outline",leftIcon:(0,d.jsx)(n.A,{size:14}),onClick:()=>C(`${aB.toLowerCase().replace(/\s+/g,"-")}-lesson-plan.txt`,[`LESSON PLAN: ${aL.title}`,`Subject: ${aL.subject} | Grade Level: ${aL.gradeLevel} | Duration: ${aL.durationMinutes} mins | Curriculum: ${aL.curriculum}`,"=".repeat(70),"","1. LEARNING OBJECTIVES:",...aL.learningObjectives.map((a,b)=>`  ${b+1}. ${a}`),"","2. CORE COMPETENCIES & VALUES:",...aL.coreCompetencies.map(a=>`  • ${a}`),"","3. KEY INQUIRY QUESTIONS:",...aL.keyInquiryQuestions.map(a=>`  ? ${a}`),"","4. TEACHING AIDS & MATERIALS:",...aL.materials.map(a=>`  - ${a}`),"","5. 5E INSTRUCTIONAL SEQUENCE:",...aL.steps.flatMap(a=>[`  [${a.phase}] ${a.title} (${a.durationMinutes} mins)`,`   Teacher: ${a.teacherActivity}`,`   Student: ${a.studentActivity}`,`   Resources: ${a.resourcesNeeded.join(", ")}`,""]),"6. DIFFERENTIATED LEARNING SUPPORT:","  For Struggling Learners:",...aL.differentiatedInstruction.supportForStruggling.map(a=>`   - ${a}`),"  For Advanced Learners:",...aL.differentiatedInstruction.extensionForAdvanced.map(a=>`   - ${a}`),"","7. ASSESSMENT RUBRIC:",...aL.assessmentRubrics.flatMap(a=>[`  Criterion: ${a.criterion}`,...a.levels.map(a=>`    [${a.level}] (${a.scoreRange}): ${a.descriptor}`),""]),"8. HOMEWORK / EXTENSION TASK:",`  ${aL.homeworkAssignment}`].join("\n")),children:"Download TXT"})]})]}),(0,d.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-xl border border-gray-100",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-gray-700 uppercase tracking-wider mb-2",children:"\uD83C\uDFAF Specific Learning Objectives"}),(0,d.jsx)("ul",{className:"text-sm text-gray-800 space-y-1.5 list-disc list-inside",children:aL.learningObjectives.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]}),(0,d.jsxs)("div",{className:"bg-gray-50 p-4 rounded-xl border border-gray-100",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-gray-700 uppercase tracking-wider mb-2",children:"\uD83D\uDCA1 Core Competencies & Values"}),(0,d.jsx)("ul",{className:"text-sm text-gray-800 space-y-1.5 list-disc list-inside",children:aL.coreCompetencies.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]})]}),(0,d.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,d.jsxs)("div",{className:"p-4 rounded-xl border border-indigo-100 bg-indigo-50/50",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2",children:"❓ Key Inquiry Questions"}),(0,d.jsx)("ul",{className:"text-sm text-indigo-900 space-y-1.5 list-disc list-inside",children:aL.keyInquiryQuestions.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]}),(0,d.jsxs)("div",{className:"p-4 rounded-xl border border-gray-100 bg-gray-50",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-gray-700 uppercase tracking-wider mb-2",children:"\uD83D\uDCE6 Teaching Aids & Resources"}),(0,d.jsx)("ul",{className:"text-sm text-gray-800 space-y-1.5 list-disc list-inside",children:aL.materials.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsxs)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2",children:[(0,d.jsx)(r.A,{size:16,className:"text-primary-600"}),"5E Instructional Phase Breakdown (",aL.durationMinutes," Minutes)"]}),(0,d.jsx)("div",{className:"space-y-3",children:aL.steps.map((a,b)=>(0,d.jsxs)("div",{className:"p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all shadow-sm",children:[(0,d.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,d.jsxs)("div",{className:"flex items-center gap-2",children:[(0,d.jsx)("span",{className:"text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800 font-mono",children:a.phase}),(0,d.jsx)("strong",{className:"text-gray-900 text-sm",children:a.title})]}),(0,d.jsxs)("span",{className:"text-xs font-semibold text-gray-500",children:["⏱ ",a.durationMinutes," mins"]})]}),(0,d.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 mt-2",children:[(0,d.jsxs)("div",{className:"bg-gray-50 p-2.5 rounded-lg border border-gray-100",children:[(0,d.jsx)("span",{className:"font-semibold text-gray-900 block mb-1",children:"Teacher Activity:"}),a.teacherActivity]}),(0,d.jsxs)("div",{className:"bg-gray-50 p-2.5 rounded-lg border border-gray-100",children:[(0,d.jsx)("span",{className:"font-semibold text-gray-900 block mb-1",children:"Student Activity:"}),a.studentActivity]})]})]},b))})]}),(0,d.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,d.jsxs)("div",{className:"p-4 rounded-xl border border-amber-200 bg-amber-50/60",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-amber-900 uppercase tracking-wider mb-2",children:"\uD83E\uDD1D Support for Struggling Learners"}),(0,d.jsx)("ul",{className:"text-xs text-amber-950 space-y-1 list-disc list-inside",children:aL.differentiatedInstruction.supportForStruggling.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]}),(0,d.jsxs)("div",{className:"p-4 rounded-xl border border-emerald-200 bg-emerald-50/60",children:[(0,d.jsx)("h3",{className:"text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2",children:"\uD83D\uDE80 Extension for Advanced Learners"}),(0,d.jsx)("ul",{className:"text-xs text-emerald-950 space-y-1 list-disc list-inside",children:aL.differentiatedInstruction.extensionForAdvanced.map((a,b)=>(0,d.jsx)("li",{children:a},b))})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-3",children:"\uD83D\uDCCA Assessment Rubrics & Evaluation Criteria"}),(0,d.jsx)("div",{className:"space-y-4",children:aL.assessmentRubrics.map((a,b)=>(0,d.jsxs)("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[(0,d.jsxs)("div",{className:"bg-gray-100 px-4 py-2 text-xs font-bold text-gray-800",children:["Criterion: ",a.criterion]}),(0,d.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 text-xs",children:a.levels.map((a,b)=>(0,d.jsxs)("div",{className:"p-3 bg-white",children:[(0,d.jsx)("span",{className:`pill mb-1 inline-block ${"EXCEEDING"===a.level?"":"MEETING"===a.level?"neutral":"APPROACHING"===a.level?"warning":"danger"}`,children:a.level}),(0,d.jsx)("span",{className:"block text-[11px] font-semibold text-gray-500 mb-1",children:a.scoreRange}),(0,d.jsx)("p",{className:"text-gray-700 leading-relaxed",children:a.descriptor})]},b))})]},b))})]}),(0,d.jsxs)("div",{className:"bg-primary-50 p-4 rounded-xl border border-primary-200 text-xs text-primary-950",children:[(0,d.jsx)("strong",{className:"block font-bold text-primary-900 mb-1",children:"\uD83D\uDCDD Homework & Extension Assignment:"}),(0,d.jsx)("p",{children:aL.homeworkAssignment})]})]})]})}),"quiz"===R&&(0,d.jsx)(A.Zk,{title:"10-Second Quiz & Worksheet Maker",subtitle:"Generates 10 objective questions with rubrics and separate teacher answer key, ready to export or print as PDF.",children:(0,d.jsxs)("form",{className:"panel-body content-stack",onSubmit:a=>{a.preventDefault(),bj()},children:[(0,d.jsxs)("div",{className:"form-grid",children:[(0,d.jsxs)("label",{className:"field",children:["Subject",(0,d.jsx)("input",{"aria-label":"Subject",required:!0,minLength:2,maxLength:100,value:aX,disabled:ab,onChange:a=>aY(a.target.value)})]}),(0,d.jsxs)("label",{className:"field",children:["Chapter or topic",(0,d.jsx)("input",{"aria-label":"Chapter or topic",required:!0,minLength:2,maxLength:150,value:aZ,disabled:ab,onChange:a=>a$(a.target.value)})]})]}),(0,d.jsxs)("div",{className:"ai-controls",children:[(0,d.jsxs)("label",{className:"field",children:["Format",(0,d.jsxs)("select",{"aria-label":"Format",value:a1,disabled:ab,onChange:a=>a2(a.target.value),children:[(0,d.jsx)("option",{value:"QUIZ",children:"Quiz"}),(0,d.jsx)("option",{value:"WORKSHEET",children:"Worksheet"}),(0,d.jsx)("option",{value:"QUESTION_PAPER",children:"Question paper"})]})]}),(0,d.jsxs)("label",{className:"field",children:["Question type",(0,d.jsxs)("select",{"aria-label":"Question type",value:a3,disabled:ab,onChange:a=>a4(a.target.value),children:[(0,d.jsx)("option",{value:"MCQ",children:"Multiple choice (MCQs)"}),(0,d.jsx)("option",{value:"SHORT_ANSWER",children:"Short answer"}),(0,d.jsx)("option",{value:"MIXED",children:"Mixed"})]})]}),(0,d.jsxs)("label",{className:"field",children:["Difficulty",(0,d.jsxs)("select",{"aria-label":"Difficulty",value:a5,disabled:ab,onChange:a=>a6(a.target.value),children:[(0,d.jsx)("option",{value:"FOUNDATION",children:"Foundation"}),(0,d.jsx)("option",{value:"STANDARD",children:"Standard"}),(0,d.jsx)("option",{value:"CHALLENGE",children:"Challenge"})]})]})]}),(0,d.jsxs)("label",{className:"field",children:["Chapter or syllabus content",(0,d.jsx)("textarea",{"aria-label":"Chapter or syllabus content",className:"ai-source-input",required:!0,minLength:80,maxLength:2e4,value:a_,disabled:ab,placeholder:"Paste lesson or textbook content. Questions will be strictly grounded in this source.",onChange:a=>a0(a.target.value)}),(0,d.jsxs)("small",{className:"muted",children:[a_.length.toLocaleString()," / 20,000 characters \xb7 minimum 80"]})]}),(0,d.jsx)("div",{children:(0,d.jsx)(B.$n,{type:"submit",isLoading:ab,disabled:!bb||!J,leftIcon:(0,d.jsx)(h.A,{size:16}),children:"Generate 10 Objective Questions"})})]})}),"quiz"===R&&aT&&(0,d.jsx)(A.Zk,{title:aT.title,subtitle:`${aT.questions.length} questions \xb7 ${aT.questions.reduce((a,b)=>a+b.marks,0)} marks \xb7 Formatted Worksheet`,children:(0,d.jsxs)("div",{className:"panel-body content-stack",children:[(0,d.jsx)("p",{className:"text-sm text-gray-700",children:aT.instructions}),aT.warnings.map((a,b)=>(0,d.jsx)("div",{className:"state-box",children:a},b)),(0,d.jsxs)("div",{className:"ai-action-row",children:[(0,d.jsx)(B.$n,{variant:"primary",size:"sm",leftIcon:(0,d.jsx)(s.A,{size:15}),onClick:()=>E(aT,!1),children:"Print / Save PDF Worksheet"}),(0,d.jsx)(B.$n,{variant:"outline",size:"sm",leftIcon:(0,d.jsx)(k.A,{size:15}),onClick:()=>E(aT,!0),children:"Print / Save PDF Teacher Key"}),(0,d.jsx)(B.$n,{variant:"outline",size:"sm",leftIcon:(0,d.jsx)(n.A,{size:15}),onClick:()=>C("student-question-paper.txt",function(a,b=!1){return[a.title,b?"TEACHER ANSWER KEY & RUBRIC":a.instructions,"",...a.questions.map((a,c)=>b?`${c+1}. ${a.answer}
Explanation: ${a.explanation}
Marks: ${a.marks}
`:`${c+1}. ${a.question} (${a.marks} marks)
${a.options.map((a,b)=>`   ${String.fromCharCode(65+b)}. ${a}`).join("\n")}
`)].join("\n")}(aT)),children:"Download Text"}),(0,d.jsxs)("label",{className:"flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer",children:[(0,d.jsx)("input",{type:"checkbox",checked:aV,onChange:a=>aW(a.target.checked)})," ","Show Teacher Answer Key & Explanations"]})]}),(0,d.jsx)("div",{className:"space-y-4 pt-2",children:aT.questions.map((a,b)=>(0,d.jsxs)("article",{className:"ai-question p-4 rounded-xl border border-gray-200 bg-white",children:[(0,d.jsxs)("div",{className:"ai-question-heading flex items-center justify-between mb-2",children:[(0,d.jsxs)("h3",{className:"font-semibold text-gray-900 text-sm",children:[b+1,". ",a.question]}),(0,d.jsxs)("span",{className:"text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded",children:[a.marks," marks"]})]}),a.options.length>0&&(0,d.jsx)("ol",{className:"list-[upper-alpha] list-inside space-y-1 text-xs text-gray-700 my-2 pl-2",children:a.options.map((a,b)=>(0,d.jsx)("li",{className:"leading-relaxed",children:a},b))}),aV&&(0,d.jsxs)("div",{className:"ai-answer mt-3 p-3 bg-emerald-50 rounded-lg text-xs border border-emerald-200",children:[(0,d.jsxs)("strong",{className:"text-emerald-900 block mb-0.5",children:["Correct Answer: ",a.answer]}),(0,d.jsx)("p",{className:"text-emerald-800",children:a.explanation})]})]},b))})]})}),(0,d.jsxs)("div",{className:"ai-action-row muted text-xs pt-4",children:[(0,d.jsx)(g(),{className:"panel-link",href:`${bo}/grades`,children:"Open gradebook →"}),(0,d.jsx)(g(),{className:"panel-link",href:"/dashboard/copilot",children:"Ask ERP Copilot →"}),"/school"===bo&&(0,d.jsx)(g(),{className:"panel-link",href:"/school/report-cards",children:"Report-card approval & publishing →"})]})]}):(0,d.jsx)(A.pp,{title:"No assigned classes",description:"Ask your administrator to link your staff account and timetable assignments."})]}):!af&&(0,d.jsx)("div",{className:"panel panel-body",role:"status",children:"Loading your teaching workspace…"})]}),aT&&(0,d.jsxs)("section",{className:"ai-print-paper hidden print:block",children:[(0,d.jsxs)("div",{className:"border-b-2 border-black pb-4 mb-6",children:[(0,d.jsx)("h1",{className:"text-xl font-bold uppercase",children:aT.title}),(0,d.jsxs)("div",{className:"flex justify-between text-xs mt-3",children:[(0,d.jsx)("span",{children:"Student Name: ____________________________________"}),(0,d.jsx)("span",{children:"Class: __________"}),(0,d.jsx)("span",{children:"Date: __________"}),(0,d.jsxs)("span",{children:["Max Marks: ",aT.questions.reduce((a,b)=>a+b.marks,0)]})]}),(0,d.jsx)("p",{className:"text-xs italic mt-2",children:aT.instructions})]}),(0,d.jsx)("div",{className:"space-y-6",children:aT.questions.map((a,b)=>(0,d.jsxs)("article",{className:"text-xs",children:[(0,d.jsxs)("div",{className:"flex justify-between font-bold mb-1",children:[(0,d.jsxs)("span",{children:[b+1,". ",a.question]}),(0,d.jsxs)("span",{children:["[",a.marks," Marks]"]})]}),a.options.length>0?(0,d.jsx)("ol",{className:"list-[upper-alpha] list-inside space-y-1 ml-4",children:a.options.map((a,b)=>(0,d.jsx)("li",{children:a},b))}):(0,d.jsx)("div",{className:"h-16 border-b border-dashed border-gray-400 mt-2"})]},b))})]}),aL&&(0,d.jsxs)("section",{className:"hidden print:block p-8",children:[(0,d.jsx)("h1",{className:"text-2xl font-bold",children:aL.title}),(0,d.jsxs)("p",{className:"text-sm",children:[aL.subject," \xb7 ",aL.gradeLevel," \xb7 ",aL.durationMinutes," Minutes"]}),(0,d.jsx)("hr",{className:"my-4"}),(0,d.jsx)("h2",{className:"font-bold text-sm uppercase",children:"Learning Objectives:"}),(0,d.jsx)("ul",{className:"list-disc list-inside text-xs mb-4",children:aL.learningObjectives.map((a,b)=>(0,d.jsx)("li",{children:a},b))}),(0,d.jsx)("h2",{className:"font-bold text-sm uppercase",children:"5E Instructional Cycle:"}),aL.steps.map((a,b)=>(0,d.jsxs)("div",{className:"mb-3 text-xs",children:[(0,d.jsxs)("strong",{children:["[",a.phase,"] ",a.title," (",a.durationMinutes," min)"]}),(0,d.jsxs)("p",{children:["Teacher: ",a.teacherActivity]}),(0,d.jsxs)("p",{children:["Student: ",a.studentActivity]})]},b))]}),aN&&aP&&(0,d.jsx)("div",{className:"fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4",children:(0,d.jsxs)("div",{className:"bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200",children:[(0,d.jsxs)("div",{className:"flex items-center justify-between pb-3 border-b",children:[(0,d.jsxs)("div",{className:"flex items-center gap-2",children:[(0,d.jsx)(t.A,{className:"text-primary-600",size:20}),(0,d.jsx)("h3",{className:"font-bold text-gray-900",children:"Share to Class Chat (കുട്ടികൾക്ക് അയക്കുക)"})]}),(0,d.jsx)("button",{onClick:()=>aO(!1),className:"text-gray-400 hover:text-gray-600 font-bold",children:"✕"})]}),(0,d.jsxs)("div",{className:"mt-4 space-y-4",children:[(0,d.jsx)("p",{className:"text-xs text-gray-600",children:"This will post the lesson plan or scheme of work summary, learning outcomes, inquiry questions, and tasks directly into the class chat channel for students and parents to view."}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"text-xs font-semibold text-gray-700 block mb-1",children:"Title"}),(0,d.jsx)("input",{className:"w-full text-sm border rounded-lg p-2.5 bg-gray-50 text-gray-800 font-medium",value:aP.title,onChange:a=>aQ({...aP,title:a.target.value})})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"text-xs font-semibold text-gray-700 block mb-1",children:"Message Preview"}),(0,d.jsx)("textarea",{rows:8,className:"w-full text-xs font-mono border rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-primary-500",value:aP.content,onChange:a=>aQ({...aP,content:a.target.value})})]})]}),(0,d.jsxs)("div",{className:"mt-6 flex justify-end gap-3 pt-3 border-t",children:[(0,d.jsx)(B.$n,{variant:"outline",size:"sm",onClick:()=>aO(!1),disabled:aR,children:"Cancel"}),(0,d.jsx)(B.$n,{variant:"primary",size:"sm",isLoading:aR,leftIcon:(0,d.jsx)(q.A,{size:14}),onClick:()=>void bi(aP),children:"Send to Class Chat Now"})]})]})})]})}},87593:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"printer",size:24,node:[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]};e.node;let f=(0,d.A)(e)},97735:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});var d=c(8369);let e={name:"download",size:24,node:[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]};e.node;let f=(0,d.A)(e)}};