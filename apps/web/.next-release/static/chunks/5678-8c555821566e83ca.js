(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5678],{952:(e,t,s)=>{"use strict";s.d(t,{BS:()=>n,Br:()=>l,JO:()=>o,ZU:()=>r,u9:()=>i});var a=s(9171);async function i(e,t="English",s){let{data:r}=await a.uE.post("/teacher-ai/copilot-query",{query:e,language:t},{timeout:45e3,signal:s});return r}async function r(e,t){let{data:s}=await a.uE.post("/teacher-ai/lesson-plan",e,{timeout:6e4,signal:t});return s}async function n(e,t){let{data:s}=await a.uE.post("/teacher-ai/scheme-of-work",e,{timeout:6e4,signal:t});return s}async function l(e,t){let{data:s}=await a.uE.post("/teacher-ai/share-to-chat",e,{timeout:3e4,signal:t});return s}async function o(e){let{data:t}=await a.uE.get("/teacher-ai/at-risk",{signal:e});return t}},1161:(e,t,s)=>{"use strict";function a(){for(var e,t,s=0,a="",i=arguments.length;s<i;s++)(e=arguments[s])&&(t=function e(t){var s,a,i="";if("string"==typeof t||"number"==typeof t)i+=t;else if("object"==typeof t)if(Array.isArray(t)){var r=t.length;for(s=0;s<r;s++)t[s]&&(a=e(t[s]))&&(i&&(i+=" "),i+=a)}else for(a in t)t[a]&&(i&&(i+=" "),i+=a);return i}(e))&&(a&&(a+=" "),a+=t);return a}s.d(t,{$:()=>a})},1426:(e,t,s)=>{Promise.resolve().then(s.bind(s,8356))},2488:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"circle-check",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 9-5.5 5.5L8 12",key:"xofnsj"}]],aliases:["check-circle-2"]};i.node;let r=(0,a.A)(i)},2705:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"file-check",size:24,node:[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"m9 15 2 2 4-4",key:"1grp1n"}]]};i.node;let r=(0,a.A)(i)},2815:(e,t,s)=>{"use strict";s.d(t,{O:()=>d});var a=s(4915),i=s(9027),r=s(8339),n=s(4849),l=s(4736),o=s(3541);function d({children:e,allowedRoles:t}){let{user:s,isLoading:c}=(0,n.A)(),p=(0,r.useRouter)(),m=!!s&&(!t||t.includes(s.role));return((0,i.useEffect)(()=>{c||s?c||!s||m||p.replace((0,o.tu)(s.role)):p.replace("/login")},[c,s,m,p]),c)?(0,a.jsx)(l.DP,{}):m?(0,a.jsx)(a.Fragment,{children:e}):null}},3159:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"download",size:24,node:[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]};i.node;let r=(0,a.A)(i)},3367:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"book-open",size:24,node:[["path",{d:"M12 5v16",key:"1f6ucr"}],["path",{d:"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",key:"1fyvmf"}]]};i.node;let r=(0,a.A)(i)},4413:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"arrow-up-right",size:24,node:[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]};i.node;let r=(0,a.A)(i)},4849:(e,t,s)=>{"use strict";s.d(t,{A:()=>c,AuthProvider:()=>d});var a=s(4915),i=s(9027),r=s(8339),n=s(9171),l=s(3541);let o=(0,i.createContext)(void 0);function d({children:e}){let[t,s]=(0,i.useState)(null),[c,p]=(0,i.useState)(!0),m=(0,r.useRouter)(),u=async()=>{if(!localStorage.getItem("accessToken"))return void s(null);let{data:e}=await n.uE.get("/auth/me");s(e),localStorage.setItem("user",JSON.stringify(e))};(0,i.useEffect)(()=>{"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>void 0),u().catch(()=>{(0,l.q7)(),s(null)}).finally(()=>p(!1))},[]);let x=e=>{if(!e.accessToken||!e.refreshToken||!e.user?.role)throw Error("Invalid sign-in response. Please try again.");localStorage.setItem("accessToken",e.accessToken),localStorage.setItem("refreshToken",e.refreshToken),localStorage.setItem("user",JSON.stringify(e.user)),s(e.user),m.replace((0,l.tu)(e.user.role))},h=async(e,t)=>{let s=await n.FH.login(e.trim(),t);return s.requiresMfa?s.mfaSessionToken:(x(s),null)},g=async(e,t)=>{x((await n.uE.post("/auth/mfa/verify-login",{mfaSessionToken:e,code:t.trim()})).data)},b=async()=>{try{await n.FH.logout()}finally{(0,l.q7)(),s(null),m.replace("/login")}};return(0,a.jsx)(o.Provider,{value:{user:t,isLoading:c,isAuthenticated:!!t,login:h,verifyMfa:g,logout:b,refreshUser:u},children:e})}function c(){let e=(0,i.useContext)(o);if(!e)throw Error("AuthProvider is required");return e}},5303:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"inbox",size:24,node:[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]};i.node;let r=(0,a.A)(i)},5989:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"clock",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]};i.node;let r=(0,a.A)(i)},6689:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"file-text",size:24,node:[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]};i.node;let r=(0,a.A)(i)},6882:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"circle-question-mark",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],aliases:["help-circle","circle-help"]};i.node;let r=(0,a.A)(i)},7421:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"send",size:24,node:[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]};i.node;let r=(0,a.A)(i)},7626:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"zap",size:24,node:[["path",{d:"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z",key:"1v7up4"}]]};i.node;let r=(0,a.A)(i)},7912:(e,t,s)=>{"use strict";s.d(t,{TG:()=>r,XW:()=>i,gy:()=>l,j$:()=>n,z9:()=>o});var a=s(9171);function i(e){let t=e.response?.data?.message;return Array.isArray(t)?t.join(". "):t||(e instanceof Error&&!("isAxiosError"in e)?e.message:"Could not complete the request. Please try again.")}let r=e=>new Intl.NumberFormat("en-KE",{style:"currency",currency:"KES",maximumFractionDigits:0}).format(e/100),n=e=>e&&!Number.isNaN(new Date(e).getTime())?new Date(e).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"}):"—";async function l(e,t){let{data:s}=await a.uE.get(e,{params:t});return Array.isArray(s)?s:s.items||s.data||[]}function o(e,t,s){let a=e=>{let t=String(e??"");return/^[=+@\-\t\r]/.test(t)&&(t="'"+t),'"'+t.replaceAll('"','""')+'"'},i=[t.map(e=>a(e.label)).join(","),...s.map(e=>t.map(t=>a(e[t.key])).join(","))].join("\r\n"),r=URL.createObjectURL(new Blob(["\uFEFF"+i],{type:"text/csv;charset=utf-8"})),n=document.createElement("a");n.href=r,n.download=e+".csv",n.click(),URL.revokeObjectURL(r)}},8339:(e,t,s)=>{"use strict";var a=s(155);s.o(a,"usePathname")&&s.d(t,{usePathname:function(){return a.usePathname}}),s.o(a,"useRouter")&&s.d(t,{useRouter:function(){return a.useRouter}})},8356:(e,t,s)=>{"use strict";s.d(t,{TeacherAIStudio:()=>T});var a=s(4915),i=s(9027),r=s(7662),n=s.n(r),l=s(9686),o=s(3367),d=s(9457),c=s(2705),p=s(6882),m=s(2488),u=s(3159),x=s(7626),h=s(8387),g=s(7421),b=s(5989),f=s(6689),v=s(8976),j=s(9171),y=s(952),k=s(7912),N=s(3541),C=s(4849),w=s(2815),S=s(4387),A=s(4736);function $(e,t){let s=URL.createObjectURL(new Blob(["\uFEFF"+t],{type:"text/plain;charset=utf-8"})),a=document.createElement("a");a.href=s,a.download=e,a.click(),URL.revokeObjectURL(s)}function E(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function _(e,t){let s=window.open("","_blank");if(!s)return void window.print();let a=e.questions.reduce((e,t)=>e+t.marks,0),i=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${E(e.title)} - Official Worksheet</title>
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
    <div class="paper-heading">${E(e.title)} ${t?"— TEACHER ANSWER KEY & RUBRICS":"— STUDENT WORKSHEET"}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Student Name:</strong> ____________________________________</td>
        <td><strong>Class:</strong> _____________</td>
        <td><strong>Roll No:</strong> ________</td>
      </tr>
      <tr>
        <td><strong>Date:</strong> ________________________</td>
        <td><strong>Max Marks:</strong> ${a}</td>
        <td><strong>Time Allowed:</strong> 30 Mins</td>
      </tr>
    </table>
  </div>

  <div class="instructions-box">
    <strong>Instructions:</strong> ${E(e.instructions)}
  </div>

  <div class="questions">
    ${e.questions.map((e,s)=>`
      <div class="question-item">
        <div class="q-text">
          <span>${s+1}. ${E(e.question)}</span>
          <span class="q-marks">[${e.marks} Mark${e.marks>1?"s":""}]</span>
        </div>
        ${e.options&&e.options.length?`
          <ol class="options-list">
            ${e.options.map(e=>`<li>${E(e)}</li>`).join("")}
          </ol>
        `:`
          <div style="border-bottom: 1px dashed #9ca3af; height: 35px; margin-top: 8px;"></div>
        `}
        ${t?`
          <div class="ans-key">
            <strong style="color: #065f46;">Correct Answer:</strong> ${E(e.answer)}<br/>
            <span style="color: #047857;"><strong>Pedagogical Explanation:</strong> ${E(e.explanation)}</span>
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
          <td>____ / ${Math.round(.4*a)}</td>
        </tr>
        <tr>
          <td><strong>Analytical Reasoning</strong></td>
          <td>Applies rules correctly to solve unfamiliar problems</td>
          <td>Solves standard curriculum questions</td>
          <td>Reasoning errors or incomplete attempts</td>
          <td>____ / ${Math.round(.4*a)}</td>
        </tr>
        <tr>
          <td><strong>Neatness & Precision</strong></td>
          <td>Clear work with complete accuracy</td>
          <td>Minor errors, overall consistent work</td>
          <td>Inconsistent responses</td>
          <td>____ / ${Math.round(.2*a)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-signatures">
    <div class="sig-line">Class Teacher Signature</div>
    <div style="font-size: 13px; font-weight: bold;">Score Obtained: ______ / ${a}</div>
    <div class="sig-line">Head of Department / Examiner</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`;s.document.open(),s.document.write(i),s.document.close()}let I=["English","Malayalam","Swahili"],R=[{key:"CBC",label:"CBC Competency-Based",desc:"Curriculum descriptors (Exceeding, Meeting, Approaching)"},{key:"HOLISTIC",label:"Holistic & Balanced",desc:"Balances academic achievement with social and emotional growth"},{key:"ACADEMIC_RIGOR",label:"Academic Rigor",desc:"Detailed subject mastery, exam trends, and target scores"},{key:"GROWTH_MINDSET",label:"Growth Mindset",desc:"Encouraging, celebrates effort and perseverance"}],L=[{subject:"Integrated Science",topic:"Photosynthesis & Plant Respiration"},{subject:"Mathematics",topic:"Quadratic Equations & Parabolic Graphs"},{subject:"Chemistry",topic:"Acids, Bases, Indicators & Salt Formation"},{subject:"Biology",topic:"Cell Division, Mitosis & Genetic Inheritance"},{subject:"Physics",topic:"Newtonian Motion, Force & Momentum"},{subject:"English",topic:"Argumentative Essay Writing & Persuasive Devices"}],z=[{subject:"Integrated Science",strand:"Living Things and Their Environment",subStrand:"Plant and Animal Adaptations"},{subject:"Mathematics",strand:"Numbers and Operations",subStrand:"Fractions, Decimals and Percentages"},{subject:"Social Studies",strand:"Natural and Built Environment",subStrand:"Weather Systems and Climate Impact"},{subject:"Agriculture & Nutrition",strand:"Conserving Agricultural Environment",subStrand:"Soil Conservation & Water Harvesting"},{subject:"Pre-Technical Studies",strand:"Materials for Production",subStrand:"Metallic and Non-Metallic Materials"},{subject:"Creative Arts & Sports",strand:"Visual Arts and Design",subStrand:"Drawing and Color Application"},{subject:"Kiswahili",strand:"Kusikiliza na Kuzungumza",subStrand:"Mazingira na Uhifadhi"}];function T(){return(0,a.jsx)(w.O,{allowedRoles:[...N.oc,...N.zZ],children:(0,a.jsx)(M,{})})}function M(){let{user:e}=(0,C.A)(),[t,s]=(0,i.useState)(null),[r,w]=(0,i.useState)(null),[T,M]=(0,i.useState)(""),[O,P]=(0,i.useState)(""),[D,q]=(0,i.useState)("English"),[F,B]=(0,i.useState)("CBC"),[W,K]=(0,i.useState)("scheme-of-work"),[U,G]=(0,i.useState)([]),[H,Q]=(0,i.useState)({}),[Y,V]=(0,i.useState)({}),[X,Z]=(0,i.useState)(1),[J,ee]=(0,i.useState)(!1),[et,es]=(0,i.useState)(!1),[ea,ei]=(0,i.useState)(""),[er,en]=(0,i.useState)(""),[el,eo]=(0,i.useState)(""),[ed,ec]=(0,i.useState)("Integrated Science"),[ep,em]=(0,i.useState)("Living Things and Their Environment"),[eu,ex]=(0,i.useState)("Plant and Animal Adaptations"),[eh,eg]=(0,i.useState)(1),[eb,ef]=(0,i.useState)(10),[ev,ej]=(0,i.useState)(4),[ey,ek]=(0,i.useState)("CBC"),[eN,eC]=(0,i.useState)(null),[ew,eS]=(0,i.useState)("Integrated Science"),[eA,e$]=(0,i.useState)("Photosynthesis & Plant Respiration"),[eE,e_]=(0,i.useState)("Living Things and Their Environment"),[eI,eR]=(0,i.useState)("Plant Respiration & Photosynthesis"),[eL,ez]=(0,i.useState)(45),[eT,eM]=(0,i.useState)("CBC"),[eO,eP]=(0,i.useState)(null),[eD,eq]=(0,i.useState)(!1),[eF,eB]=(0,i.useState)(null),[eW,eK]=(0,i.useState)(!1),[eU,eG]=(0,i.useState)(null),[eH,eQ]=(0,i.useState)(!1),[eY,eV]=(0,i.useState)("Mathematics"),[eX,eZ]=(0,i.useState)("Quadratic Equations"),[eJ,e0]=(0,i.useState)("Quadratic equations are second-degree polynomial equations of the form ax^2 + bx + c = 0, where a is non-zero. The roots can be determined using factorization, completing the square, or the quadratic formula x = (-b \xb1 √(b^2 - 4ac)) / (2a). The discriminant D = b^2 - 4ac determines the nature of the roots: if D > 0, there are two distinct real roots; if D = 0, there is one repeated real root; if D < 0, roots are complex. Applications include trajectory modeling, projectile motions, optimization of profit margins, and area maximization problems in geometry."),[e1,e2]=(0,i.useState)("QUIZ"),[e5,e4]=(0,i.useState)("MCQ"),[e3,e6]=(0,i.useState)("STANDARD"),e8=(0,i.useRef)(null),e7=(0,i.useRef)(null),e9=(0,i.useCallback)(async()=>{e7.current?.abort();let e=new AbortController;e7.current=e,en("");try{let{data:t}=await j.uE.get("/teacher-ai/options",{signal:e.signal});e.signal.aborted||(s(t),M(t.classes[0]?.id??""),P(t.terms.find(e=>e.isCurrent)?.id??t.terms[0]?.id??""))}catch(t){e.signal.aborted||en((0,k.XW)(t))}},[]);(0,i.useEffect)(()=>(e9(),()=>{e7.current?.abort(),e8.current?.abort()}),[e9]);let te=(0,i.useCallback)(async e=>{if(T&&O){ee(!0);try{let{data:t}=await j.uE.get("/teacher-ai/roster",{params:{classId:T,termId:O},signal:e});e?.aborted||(w(t),G(t.students.map(e=>e.id)))}catch(t){e?.aborted||en((0,k.XW)(t))}finally{e?.aborted||ee(!1)}}},[T,O]);(0,i.useEffect)(()=>{let e=new AbortController;return w(null),V({}),Q({}),eG(null),eP(null),G([]),Z(1),en(""),eo(""),te(e.signal),()=>e.abort()},[te]);let tt=t?.status.configured??!1,ts=async()=>{if(!U.length)return;let e=new AbortController;e8.current=e,es(!0),en("");let t=0;try{for(let s=0;s<U.length&&!e.signal.aborted;s+=10){eo(`AI is analyzing evidence & drafting remarks: ${t} of ${U.length} students complete…`);let{data:a}=await j.uE.post("/teacher-ai/remarks",{classId:T,termId:O,language:D,students:U.slice(s,s+10).map(e=>({studentId:e,behaviourObservation:H[e]||void 0}))},{timeout:75e3,signal:e.signal});if(e.signal.aborted)break;V(e=>({...e,...Object.fromEntries(a.remarks.map(e=>[e.studentId,e]))})),t+=a.remarks.length}e.signal.aborted||eo(`🎉 ${t} personalized ${F} remarks drafted in 1 click! Review, edit as needed, and approve.`)}catch(s){e.signal.aborted||(en((0,k.XW)(s)),eo(`${t} remarks generated before interruption. Completed drafts are saved below.`))}finally{es(!1)}},ta=async()=>{es(!0),en(""),eo("");try{let{data:e}=await j.uE.post("/teacher-ai/report-cards",{classId:T,termId:O},{timeout:75e3});await te(),eo(`${e.generated} draft report cards prepared; ${e.skipped} preserved; ${e.errors.length} skipped.`)}catch(e){en((0,k.XW)(e))}finally{es(!1)}},ti=async e=>{let t=r?.students.find(t=>t.id===e),s=Y[e];if(t?.reportCard&&s){ei(e),en("");try{let{data:a}=await j.uE.post("/teacher-ai/remarks/save",{classId:T,termId:O,studentId:e,reportCardId:t.reportCard.id,expectedUpdatedAt:t.reportCard.updatedAt,remark:s.text});w(t=>t?{...t,students:t.students.map(t=>t.id===e&&t.reportCard?{...t,reportCard:{...t.reportCard,updatedAt:a.updatedAt,comment:a.comment}}:t)}:t),eo(`Reviewed remark saved to ${t.name}'s official report card.`)}catch(e){en((0,k.XW)(e))}finally{ei("")}}},tr=async()=>{let e=Object.keys(Y);if(!e.length||!r)return;es(!0),en("");let t=0;try{for(let s of e){let e=r.students.find(e=>e.id===s),a=Y[s];e?.reportCard&&a&&"DRAFT"===e.reportCard.status&&(await j.uE.post("/teacher-ai/remarks/save",{classId:T,termId:O,studentId:s,reportCardId:e.reportCard.id,expectedUpdatedAt:e.reportCard.updatedAt,remark:a.text}),t++)}await te(),eo(`🎉 Approved & saved ${t} personalized remarks to official student report cards in 1 click!`)}catch(e){en((0,k.XW)(e))}finally{es(!1)}},tn=async()=>{if(!ed.trim()||!ep.trim()||!T)return;let e=new AbortController;e8.current=e,es(!0),en(""),eo(""),eC(null);try{let t=await (0,y.BS)({classId:T,subject:ed.trim(),strand:ep.trim(),subStrand:eu.trim()||void 0,termNumber:eh,weeksCount:eb,lessonsPerWeek:ev,curriculum:ey,language:D},e.signal);e.signal.aborted||(eC(t),eo("\uD83C\uDF89 Kenyan CBC Scheme of Work successfully created in under 10 seconds! Ready to print PDF or send to chat."))}catch(t){e.signal.aborted||en((0,k.XW)(t))}finally{es(!1)}},tl=async()=>{if(!ew.trim()||!eA.trim()||!T)return;let e=new AbortController;e8.current=e,es(!0),en(""),eo(""),eP(null);try{let t=await (0,y.ZU)({classId:T,subject:ew.trim(),chapter:eA.trim(),strand:eE.trim()||void 0,subStrand:eI.trim()||void 0,durationMinutes:eL,curriculum:eT,language:D},e.signal);e.signal.aborted||(eP(t),eo("✨ Complete 5E Lesson Plan generated in under 10 seconds! Ready to teach, print as PDF or send to chat."))}catch(t){e.signal.aborted||en((0,k.XW)(t))}finally{es(!1)}},to=async e=>{if(!T)return void en("Please select a class first.");eK(!0),en("");try{let t=await (0,y.Br)({classId:T,title:e.title,summary:e.title,content:e.content,type:e.type});eo(`🚀 Successfully posted to ${t.channelName}! Learners & parents can immediately see the outcomes and inquiries in chat.`),eq(!1)}catch(e){en((0,k.XW)(e))}finally{eK(!1)}},td=async()=>{let e=new AbortController;e8.current=e,es(!0),en(""),eo(""),eG(null),eQ(!1);try{let{data:t}=await j.uE.post("/teacher-ai/quiz",{classId:T,subject:eY.trim(),chapter:eX.trim(),sourceText:eJ.trim(),language:D,format:e1,questionType:e5,difficulty:e3},{timeout:75e3,signal:e.signal});e.signal.aborted||(eG(t),eo("✨ 10 Objective questions and teacher grading master ready in seconds!"))}catch(t){e.signal.aborted||en((0,k.XW)(t))}finally{es(!1)}},tc=r?.students??[],tp=Math.max(1,Math.ceil(tc.length/8)),tm=Math.min(X,tp),tu=tc.slice((tm-1)*8,8*tm),tx=e&&N.zZ.includes(e.role)?"/school":"/teacher";return(0,a.jsxs)("div",{className:"ai-studio",children:[(0,a.jsxs)("div",{className:"ai-screen content-stack",children:[(0,a.jsx)(S.Av,{eyebrow:"AI & INTELLIGENT ACADEMIC COPILOT",title:"AI Teaching & Academic Studio",description:"Automate term-end report card remarks, generate 5E lesson plans in 10 seconds, and produce printable student worksheets.",actions:(0,a.jsx)("div",{className:"flex items-center gap-2",children:(0,a.jsxs)(n(),{href:"/dashboard/copilot",className:"px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-all flex items-center gap-1.5",children:[(0,a.jsx)(l.A,{size:14}),"Ask ERP Copilot"]})})}),er&&(0,a.jsxs)("div",{className:"state-box",role:"alert",children:[er,!t&&(0,a.jsx)(A.$n,{variant:"outline",size:"sm",onClick:()=>void e9(),children:"Try again"})]}),el&&(0,a.jsx)("div",{className:"state-box success",role:"status",children:el}),t?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"analytics-intro",children:[(0,a.jsx)(l.A,{size:25}),(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:tt?"Intelligent Academic Copilot Active":"AI teaching tools need configuration"}),(0,a.jsx)("p",{children:t.status.message}),(0,a.jsx)("small",{children:"Uses real attendance, exam scores, and classroom observations. Review and approve before finalizing report cards."})]})]}),t.classes.length?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"ai-controls panel panel-body",children:[(0,a.jsxs)("label",{className:"field",children:["Class",(0,a.jsx)("select",{"aria-label":"Class",value:T,disabled:et||!!ea,onChange:e=>M(e.target.value),children:t.classes.map(e=>(0,a.jsx)("option",{value:e.id,children:e.name},e.id))})]}),(0,a.jsxs)("label",{className:"field",children:["Report-card term",(0,a.jsxs)("select",{"aria-label":"Report-card term",value:O,disabled:et||!!ea,onChange:e=>P(e.target.value),children:[(0,a.jsx)("option",{value:"",children:"Select term"}),t.terms.map(e=>(0,a.jsx)("option",{value:e.id,children:e.name},e.id))]})]}),(0,a.jsxs)("label",{className:"field",children:["Language",(0,a.jsx)("select",{"aria-label":"Language",value:D,disabled:et,onChange:e=>q(e.target.value),children:I.map(e=>(0,a.jsx)("option",{value:e,children:"Malayalam"===e?"Malayalam (മലയാളം)":e},e))})]})]}),(0,a.jsxs)("div",{className:"section-tabs",role:"group","aria-label":"Teaching tools",children:[(0,a.jsxs)("button",{className:"scheme-of-work"===W?"selected":"","aria-pressed":"scheme-of-work"===W,disabled:et,onClick:()=>K("scheme-of-work"),children:[(0,a.jsx)(o.A,{size:16,className:"inline mr-2 text-emerald-600"}),"\uD83C\uDDF0\uD83C\uDDEA CBC Scheme of Work (KICD)"]}),(0,a.jsxs)("button",{className:"lesson-plan"===W?"selected":"","aria-pressed":"lesson-plan"===W,disabled:et,onClick:()=>K("lesson-plan"),children:[(0,a.jsx)(d.A,{size:16,className:"inline mr-2 text-indigo-600"}),"⚡ Daily Lesson Plan (10s)"]}),(0,a.jsxs)("button",{className:"remarks"===W?"selected":"","aria-pressed":"remarks"===W,disabled:et,onClick:()=>K("remarks"),children:[(0,a.jsx)(c.A,{size:16,className:"inline mr-2 text-blue-600"}),"1-Click Report Card Remarks"]}),(0,a.jsxs)("button",{className:"quiz"===W?"selected":"","aria-pressed":"quiz"===W,disabled:et,onClick:()=>K("quiz"),children:[(0,a.jsx)(p.A,{size:16,className:"inline mr-2 text-amber-600"}),"Quiz & Worksheet Maker (PDF)"]})]}),"remarks"===W&&(0,a.jsxs)(S.Zk,{title:"AI Automated Report Card Remarks Generator",subtitle:"Analyzes marks, attendance, and behavior in 1 click to produce personalized CBC/curriculum feedback for every student.",children:[(0,a.jsxs)("div",{className:"bg-gray-50 border-b border-gray-200 p-4",children:[(0,a.jsx)("label",{className:"text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2",children:"Pedagogical Feedback Framework:"}),(0,a.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2",children:R.map(e=>(0,a.jsxs)("button",{type:"button",onClick:()=>B(e.key),className:`p-2.5 rounded-lg border text-left transition-all text-xs ${F===e.key?"bg-indigo-50 border-indigo-400 text-indigo-950 shadow-sm font-semibold":"bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`,children:[(0,a.jsx)("span",{className:"block",children:e.label}),(0,a.jsx)("span",{className:"text-[11px] text-gray-500 font-normal leading-tight block mt-0.5",children:e.desc})]},e.key))})]}),(0,a.jsxs)("div",{className:"panel-body ai-action-row",children:[(0,a.jsxs)(A.$n,{size:"sm",isLoading:et,disabled:!tt||!U.length||J||!!ea,leftIcon:(0,a.jsx)(l.A,{size:15}),onClick:()=>void ts(),children:["1-Click Generate Selected Remarks (",U.length,")"]}),(0,a.jsxs)(A.$n,{size:"sm",variant:"primary",disabled:et||!Object.keys(Y).length||J||!!ea,leftIcon:(0,a.jsx)(m.A,{size:15}),onClick:()=>void tr(),children:["1-Click Approve & Save All Drafts (",Object.keys(Y).length,")"]}),(0,a.jsx)(A.$n,{size:"sm",variant:"outline",disabled:et||!O||!T||J||!!ea,onClick:()=>void ta(),children:"Prepare Draft Report Cards"}),(0,a.jsx)(A.$n,{size:"sm",variant:"outline",leftIcon:(0,a.jsx)(u.A,{size:15}),disabled:!Object.keys(Y).length||et,onClick:()=>(0,k.z9)("reviewed-student-remarks",[{key:"name",label:"Student Name"},{key:"admission",label:"Admission Number"},{key:"average",label:"Term Average %"},{key:"attendance",label:"Attendance %"},{key:"remark",label:"Personalized Teacher Remark"},{key:"evidence",label:"Factual Evidence"}],(r?.students??[]).filter(e=>Y[e.id]).map(e=>({name:e.name,admission:e.admissionNumber,average:null!==e.average?`${e.average}%`:"N/A",attendance:null!==e.attendanceRate?`${e.attendanceRate}%`:"N/A",remark:Y[e.id].text,evidence:Y[e.id].evidence.join(" | ")}))),children:"Export Drafts CSV"}),(0,a.jsx)(A.$n,{size:"sm",variant:"ghost",disabled:et||J,onClick:()=>{en(""),te()},children:"Reload Roster"})]}),J?(0,a.jsx)("div",{className:"panel-body",role:"status",children:"Loading class evidence…"}):O?tc.length?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"ai-selection",children:[(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"checkbox","aria-label":"Select all students",checked:U.length===tc.length,disabled:et,onChange:e=>G(e.target.checked?tc.map(e=>e.id):[])})," ","Select all ",tc.length," students"]}),(0,a.jsx)("span",{children:"Saves hours of typing: review and approve with one click."})]}),(0,a.jsx)("div",{className:"ai-remark-list",children:tu.map(e=>(0,a.jsxs)("section",{className:"ai-remark",children:[(0,a.jsxs)("div",{className:"ai-remark-heading",children:[(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"checkbox",checked:U.includes(e.id),"aria-label":`Select ${e.name}`,disabled:et,onChange:t=>G(s=>t.target.checked?[...s,e.id]:s.filter(t=>t!==e.id))}),(0,a.jsx)("strong",{children:e.name})]}),(0,a.jsx)("span",{className:"pill neutral",children:e.reportCard?.status.replaceAll("_"," ").toLowerCase()??"No report card"})]}),(0,a.jsxs)("p",{className:"muted ai-evidence-summary",children:[e.admissionNumber," \xb7 Term average: ",null===e.average?"No marks":`${e.average}%`," \xb7 Recorded attendance: ",null===e.attendanceRate?"No records":`${e.attendanceRate}% across ${e.attendanceDays} days`]}),(0,a.jsxs)("div",{className:"ai-remark-fields",children:[(0,a.jsxs)("label",{className:"field",children:["Classroom behaviour & observation (optional)",(0,a.jsx)("textarea",{"aria-label":`Behaviour observation for ${e.name}`,maxLength:800,value:H[e.id]||"",disabled:et,placeholder:"e.g. Shows exceptional teamwork, highly inquisitive during labs, builds confidence in public speaking.",onChange:t=>Q(s=>({...s,[e.id]:t.target.value}))})]}),(0,a.jsxs)("label",{className:"field",children:[Y[e.id]?"AI Draft Remark (Edit before saving)":"Current Report Card Remark",(0,a.jsx)("textarea",{"aria-label":`Remark for ${e.name}`,maxLength:2e3,disabled:et||!Y[e.id]&&!e.reportCard||ea===e.id,value:Y[e.id]?.text??e.reportCard?.comment??"",placeholder:"Click 'Generate Remarks' to create a personalized draft from student evidence.",onChange:t=>V(s=>({...s,[e.id]:{studentId:e.id,evidence:s[e.id]?.evidence||[],text:t.target.value}}))})]})]}),Y[e.id]&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("ul",{className:"ai-source-list",children:Y[e.id].evidence.map((e,t)=>(0,a.jsx)("li",{children:e},t))}),(0,a.jsxs)("div",{className:"ai-action-row",children:[(0,a.jsx)(A.$n,{size:"sm",isLoading:ea===e.id,disabled:et||!!ea||e.reportCard?.status!=="DRAFT"||Y[e.id].text.trim().length<10,onClick:()=>void ti(e.id),children:"Approve & Save Remark"}),e.reportCard?.status!=="DRAFT"&&(0,a.jsx)("span",{className:"muted text-xs",children:e.reportCard?"Approved reports are locked.":"Prepare a draft report card first."})]})]})]},e.id))}),(0,a.jsxs)("div",{className:"table-pagination",children:[(0,a.jsxs)("span",{children:[(tm-1)*8+1,"–",Math.min(8*tm,tc.length)," of ",tc.length," students"]}),(0,a.jsxs)("div",{className:"flex gap-3",children:[(0,a.jsx)(A.$n,{size:"sm",variant:"outline",disabled:1===tm,onClick:()=>Z(tm-1),children:"Previous"}),(0,a.jsx)(A.$n,{size:"sm",variant:"outline",disabled:tm>=tp,onClick:()=>Z(tm+1),children:"Next"})]})]})]}):(0,a.jsx)(S.pp,{title:"No active students in this class"}):(0,a.jsx)(S.pp,{title:"Select a term",description:"Choose a term to load saved marks and attendance."})]}),"scheme-of-work"===W&&(0,a.jsx)(S.Zk,{title:"\uD83C\uDDF0\uD83C\uDDEA Kenyan CBC / KICD Scheme of Work Generator",subtitle:"Generate a complete termly Scheme of Work matrix compliant with KICD standards in 10 seconds. Includes Strands, Sub-strands, Specific Learning Outcomes, Key Inquiry Questions, Learning Experiences, Resources, and Assessment Rubrics.",children:(0,a.jsxs)("div",{className:"panel-body content-stack",children:[(0,a.jsxs)("div",{className:"bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100",children:[(0,a.jsx)("span",{className:"text-xs font-semibold text-emerald-950 uppercase tracking-wider block mb-2",children:"Quick Kenyan CBC Syllabus Presets:"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-2",children:z.map((e,t)=>(0,a.jsxs)("button",{type:"button",onClick:()=>{ec(e.subject),em(e.strand),ex(e.subStrand)},className:"text-xs bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all",children:[(0,a.jsxs)("strong",{children:[e.subject,":"]})," ",e.strand]},t))})]}),(0,a.jsxs)("div",{className:"form-grid",children:[(0,a.jsxs)("label",{className:"field",children:["Learning Area / Subject",(0,a.jsx)("input",{required:!0,value:ed,disabled:et,onChange:e=>ec(e.target.value),placeholder:"e.g. Integrated Science, Mathematics, Agriculture & Nutrition"})]}),(0,a.jsxs)("label",{className:"field",children:["Strand (Main Topic Theme)",(0,a.jsx)("input",{required:!0,value:ep,disabled:et,onChange:e=>em(e.target.value),placeholder:"e.g. Living Things, Numbers and Operations, Soil Conservation"})]}),(0,a.jsxs)("label",{className:"field",children:["Sub-Strand (Specific Unit)",(0,a.jsx)("input",{value:eu,disabled:et,onChange:e=>ex(e.target.value),placeholder:"e.g. Plant and Animal Adaptations (Optional)"})]})]}),(0,a.jsxs)("div",{className:"ai-controls",children:[(0,a.jsxs)("label",{className:"field",children:["Term",(0,a.jsxs)("select",{value:eh,disabled:et,onChange:e=>eg(Number(e.target.value)),children:[(0,a.jsx)("option",{value:1,children:"Term 1 (Opening Term)"}),(0,a.jsx)("option",{value:2,children:"Term 2 (Mid-Year Term)"}),(0,a.jsx)("option",{value:3,children:"Term 3 (Culmination Term)"})]})]}),(0,a.jsxs)("label",{className:"field",children:["Weeks Planned",(0,a.jsxs)("select",{value:eb,disabled:et,onChange:e=>ef(Number(e.target.value)),children:[(0,a.jsx)("option",{value:6,children:"6 Weeks (Short Term)"}),(0,a.jsx)("option",{value:8,children:"8 Weeks"}),(0,a.jsx)("option",{value:10,children:"10 Weeks (Standard KICD Term)"}),(0,a.jsx)("option",{value:12,children:"12 Weeks (Extended Term)"})]})]}),(0,a.jsxs)("label",{className:"field",children:["Lessons / Week",(0,a.jsxs)("select",{value:ev,disabled:et,onChange:e=>ej(Number(e.target.value)),children:[(0,a.jsx)("option",{value:3,children:"3 Lessons / Week"}),(0,a.jsx)("option",{value:4,children:"4 Lessons / Week (Standard)"}),(0,a.jsx)("option",{value:5,children:"5 Lessons / Week"})]})]}),(0,a.jsxs)("label",{className:"field",children:["Curriculum Framework",(0,a.jsxs)("select",{value:ey,disabled:et,onChange:e=>ek(e.target.value),children:[(0,a.jsx)("option",{value:"CBC",children:"Kenyan CBC (KICD Framework)"}),(0,a.jsx)("option",{value:"STANDARD",children:"Standard National Curriculum"}),(0,a.jsx)("option",{value:"CAMBRIDGE",children:"Cambridge Lower Secondary"}),(0,a.jsx)("option",{value:"NCERT",children:"NCERT / CBSE Framework"})]})]})]}),(0,a.jsx)("div",{children:(0,a.jsx)(A.$n,{isLoading:et,disabled:!tt||!T||!ed.trim()||!ep.trim(),leftIcon:(0,a.jsx)(x.A,{size:16}),onClick:()=>void tn(),children:"Generate CBC Scheme of Work in 10s"})}),eN&&(0,a.jsxs)("div",{className:"mt-6 border border-emerald-200 rounded-2xl bg-white p-6 shadow-sm space-y-6",children:[(0,a.jsxs)("div",{className:"flex flex-col md:flex-row items-start justify-between border-b pb-4 gap-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("span",{className:"text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",children:["REPUBLIC OF KENYA \xb7 ",eN.curriculum," \xb7 ",eN.term," (",eN.academicYear,")"]}),(0,a.jsx)("h2",{className:"text-2xl font-bold text-gray-900 mt-2",children:eN.title}),(0,a.jsxs)("p",{className:"text-sm text-gray-600 mt-0.5",children:[(0,a.jsx)("strong",{children:"Strand:"})," ",eN.strand," \xb7 ",(0,a.jsx)("strong",{children:"Level:"})," ",eN.gradeLevel," \xb7 ",(0,a.jsx)("strong",{children:"Total Lessons:"})," ",eN.weeks.length," Lessons Planned"]})]}),(0,a.jsxs)("div",{className:"flex flex-wrap gap-2",children:[(0,a.jsx)(A.$n,{size:"sm",variant:"primary",leftIcon:(0,a.jsx)(h.A,{size:14}),onClick:()=>(function(e){let t=window.open("","_blank");if(!t)return void window.print();let s=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>CBC Scheme of Work - ${E(e.title)}</title>
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
    <div class="sow-title">${E(e.title)}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Learning Area / Subject:</strong> ${E(e.subject)}</td>
        <td><strong>Grade Level:</strong> ${E(e.gradeLevel)}</td>
        <td><strong>Strand:</strong> ${E(e.strand)}</td>
      </tr>
      <tr>
        <td><strong>Term & Year:</strong> ${E(e.term)} \xb7 ${E(e.academicYear)}</td>
        <td><strong>Curriculum Standard:</strong> ${E(e.curriculum)} (KICD Compliant)</td>
        <td><strong>Total Lessons Planned:</strong> ${e.weeks.length} Lessons</td>
      </tr>
    </table>
  </div>

  <div class="competency-box">
    <div class="competency-card">
      <strong>🎯 General Learning Outcomes</strong>
      <ul>
        ${e.generalOutcomes.map(e=>`<li>${E(e)}</li>`).join("")}
      </ul>
    </div>
    <div class="competency-card">
      <strong>✨ Core Competencies & Values & PCIs</strong>
      <div><strong>Competencies:</strong> ${E(e.coreCompetencies.join(", "))}</div>
      <div style="margin-top: 3px;"><strong>Values:</strong> ${E(e.values.join(", "))}</div>
      <div style="margin-top: 3px;"><strong>PCIs:</strong> ${E(e.pcis.join(", "))}</div>
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
      ${e.weeks.map(e=>`
        <tr>
          <td style="text-align: center; font-weight: bold;">${e.week}</td>
          <td style="text-align: center; font-weight: bold;">${e.lessonNumber}</td>
          <td><strong>${E(e.strand)}</strong><br/><span style="color: #475569;">${E(e.subStrand)}</span></td>
          <td>
            <ul>
              ${e.specificLearningOutcomes.map(e=>`<li>${E(e)}</li>`).join("")}
            </ul>
          </td>
          <td>
            <ul>
              ${e.keyInquiryQuestions.map(e=>`<li>${E(e)}</li>`).join("")}
            </ul>
          </td>
          <td>
            <ul>
              ${e.learningExperiences.map(e=>`<li>${E(e)}</li>`).join("")}
            </ul>
          </td>
          <td>${E(e.learningResources.join("; "))}</td>
          <td>${E(e.assessmentMethods.join(", "))}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h4 style="font-size: 11px; text-transform: uppercase; margin-top: 14px; margin-bottom: 4px;">Assessment Rubrics & Mastery Standards (CBC / KNEC Framework)</h4>
  ${e.assessmentRubrics.map(e=>`
    <table class="rubric-table">
      <thead>
        <tr>
          <th colspan="4">Criterion: ${E(e.criterion)}</th>
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
          ${e.levels.map(e=>`
            <td>
              <strong>${E(e.scoreRange)}:</strong><br/>
              ${E(e.descriptor)}
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
</html>`;t.document.open(),t.document.write(s),t.document.close()})(eN),children:"Print / Save PDF (Landscape)"}),(0,a.jsx)(A.$n,{size:"sm",variant:"secondary",leftIcon:(0,a.jsx)(g.A,{size:14}),onClick:()=>{let e=`📋 **${eN.title}**

🏛️ **Strand:** ${eN.strand} | **Term:** ${eN.term} (${eN.academicYear})

🎯 **General Outcomes (പഠന ലക്ഷ്യങ്ങൾ):**
${eN.generalOutcomes.map((e,t)=>`${t+1}. ${e}`).join("\n")}

✨ **Core Competencies & Values:** ${eN.coreCompetencies.slice(0,4).join(", ")}

📅 **Weekly Overview:** ${eN.weeks.length} Lessons scheduled. Inquiry tasks and materials will be shared as each unit begins.`;eB({title:eN.title,content:e,type:"SCHEME_OF_WORK"}),eq(!0)},children:"Share to Class Chat"}),(0,a.jsx)(A.$n,{size:"sm",variant:"outline",leftIcon:(0,a.jsx)(u.A,{size:14}),onClick:()=>$(`${ep.toLowerCase().replace(/\\s+/g,"-")}-scheme-of-work.txt`,["REPUBLIC OF KENYA - MINISTRY OF EDUCATION",`KICD CBC SCHEME OF WORK: ${eN.title}`,`Subject: ${eN.subject} | Grade Level: ${eN.gradeLevel} | Term: ${eN.term} | Year: ${eN.academicYear}`,`Curriculum: ${eN.curriculum} | Strand: ${eN.strand}`,"=".repeat(80),"","GENERAL LEARNING OUTCOMES:",...eN.generalOutcomes.map((e,t)=>`  ${t+1}. ${e}`),"","CORE COMPETENCIES & VALUES & PCIS:",...eN.coreCompetencies.map(e=>`  • Competency: ${e}`),...eN.values.map(e=>`  • Value: ${e}`),...eN.pcis.map(e=>`  • PCI: ${e}`),"","WEEKLY SCHEME OF WORK BREAKDOWN:","=".repeat(80),...eN.weeks.flatMap(e=>[`WEEK ${e.week}, LESSON ${e.lessonNumber}: [${e.strand} > ${e.subStrand}]`,"  Specific Learning Outcomes:",...e.specificLearningOutcomes.map(e=>`    - ${e}`),"  Key Inquiry Questions:",...e.keyInquiryQuestions.map(e=>`    ? ${e}`),"  Learning Experiences:",...e.learningExperiences.map(e=>`    * ${e}`),`  Resources: ${e.learningResources.join("; ")}`,`  Assessment Methods: ${e.assessmentMethods.join(", ")}`,`  Teacher Reflection: ${e.reflection||"Reviewed and achieved."}`,"-".repeat(60)]),"","ASSESSMENT RUBRICS (4 LEVELS - KNEC / CBC STANDARD):",...eN.assessmentRubrics.flatMap(e=>[`Criterion: ${e.criterion}`,...e.levels.map(e=>`  [${e.level}] (${e.scoreRange}): ${e.descriptor}`),""])].join("\n")),children:"Download TXT"})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{className:"bg-emerald-50/50 p-4 rounded-xl border border-emerald-100",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2",children:"\uD83C\uDFAF General Learning Outcomes (പഠന ലക്ഷ്യങ്ങൾ)"}),(0,a.jsx)("ul",{className:"text-xs text-gray-800 space-y-1.5 list-disc list-inside",children:eN.generalOutcomes.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]}),(0,a.jsxs)("div",{className:"bg-slate-50 p-4 rounded-xl border border-slate-200",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-slate-800 uppercase tracking-wider mb-2",children:"✨ Core Competencies, Values & PCIs"}),(0,a.jsxs)("div",{className:"space-y-1.5 text-xs text-slate-700",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:"Competencies:"})," ",eN.coreCompetencies.join(", ")]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:"Values:"})," ",eN.values.join(", ")]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("strong",{children:"PCIs:"})," ",eN.pcis.join(", ")]})]})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-3",children:["\uD83D\uDCC5 Weekly Scheme Breakdown (",eN.weeks.length," Lessons)"]}),(0,a.jsx)("div",{className:"overflow-x-auto border border-gray-200 rounded-xl",children:(0,a.jsxs)("table",{className:"w-full text-left text-xs border-collapse",children:[(0,a.jsx)("thead",{children:(0,a.jsxs)("tr",{className:"bg-gray-100 text-gray-800 border-b font-semibold",children:[(0,a.jsx)("th",{className:"p-2.5 w-12 text-center",children:"Wk"}),(0,a.jsx)("th",{className:"p-2.5 w-12 text-center",children:"Les"}),(0,a.jsx)("th",{className:"p-2.5 w-44",children:"Sub-Strand"}),(0,a.jsx)("th",{className:"p-2.5 min-w-[200px]",children:"Specific Learning Outcomes (SLOs)"}),(0,a.jsx)("th",{className:"p-2.5 min-w-[160px]",children:"Key Inquiry Questions"}),(0,a.jsx)("th",{className:"p-2.5 min-w-[180px]",children:"Learning Experiences"}),(0,a.jsx)("th",{className:"p-2.5 min-w-[140px]",children:"Resources"}),(0,a.jsx)("th",{className:"p-2.5 min-w-[120px]",children:"Assessment"})]})}),(0,a.jsx)("tbody",{className:"divide-y divide-gray-100",children:eN.weeks.map((e,t)=>(0,a.jsxs)("tr",{className:"hover:bg-gray-50/60 transition-colors",children:[(0,a.jsx)("td",{className:"p-2.5 text-center font-bold text-gray-700",children:e.week}),(0,a.jsx)("td",{className:"p-2.5 text-center font-semibold text-gray-600",children:e.lessonNumber}),(0,a.jsx)("td",{className:"p-2.5 font-medium text-emerald-950",children:e.subStrand}),(0,a.jsx)("td",{className:"p-2.5",children:(0,a.jsx)("ul",{className:"list-disc list-inside space-y-0.5 text-gray-700",children:e.specificLearningOutcomes.map((e,t)=>(0,a.jsx)("li",{children:e},t))})}),(0,a.jsx)("td",{className:"p-2.5 text-indigo-900 italic",children:e.keyInquiryQuestions.map((e,t)=>(0,a.jsxs)("div",{className:"mb-1",children:["? ",e]},t))}),(0,a.jsx)("td",{className:"p-2.5 text-gray-600",children:e.learningExperiences.map((e,t)=>(0,a.jsxs)("div",{className:"mb-0.5",children:["• ",e]},t))}),(0,a.jsx)("td",{className:"p-2.5 text-gray-500 text-[11px]",children:e.learningResources.join("; ")}),(0,a.jsx)("td",{className:"p-2.5 text-gray-600 font-medium",children:e.assessmentMethods.join(", ")})]},t))})]})})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-2",children:"\uD83D\uDCCA CBC / KNEC 4-Level Assessment Rubrics"}),(0,a.jsx)("div",{className:"space-y-3",children:eN.assessmentRubrics.map((e,t)=>(0,a.jsxs)("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[(0,a.jsxs)("div",{className:"bg-gray-100 px-3.5 py-2 font-bold text-xs text-gray-800",children:["Criterion: ",e.criterion]}),(0,a.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-xs",children:e.levels.map((e,t)=>(0,a.jsxs)("div",{className:"p-3 bg-white",children:[(0,a.jsxs)("span",{className:`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${"EXCEEDING"===e.level?"bg-emerald-100 text-emerald-800":"MEETING"===e.level?"bg-blue-100 text-blue-800":"APPROACHING"===e.level?"bg-amber-100 text-amber-800":"bg-rose-100 text-rose-800"}`,children:[e.level," (",e.scoreRange,")"]}),(0,a.jsx)("p",{className:"text-gray-700 text-[11px] leading-relaxed mt-1",children:e.descriptor})]},t))})]},t))})]})]})]})}),"lesson-plan"===W&&(0,a.jsx)(S.Zk,{title:"10-Second AI 5E Lesson Plan Generator",subtitle:"Select subject and topic to generate a comprehensive 5E lesson plan with objectives, inquiry flow, differentiation, and rubrics.",children:(0,a.jsxs)("div",{className:"panel-body content-stack",children:[(0,a.jsxs)("div",{className:"bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100",children:[(0,a.jsx)("span",{className:"text-xs font-semibold text-indigo-950 uppercase tracking-wider block mb-2",children:"Quick Syllabus Chapter Presets:"}),(0,a.jsx)("div",{className:"flex flex-wrap gap-2",children:L.map((e,t)=>(0,a.jsxs)("button",{type:"button",onClick:()=>{eS(e.subject),e$(e.topic)},className:"text-xs bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all",children:[(0,a.jsxs)("strong",{children:[e.subject,":"]})," ",e.topic]},t))})]}),(0,a.jsxs)("div",{className:"form-grid",children:[(0,a.jsxs)("label",{className:"field",children:["Subject",(0,a.jsx)("input",{required:!0,value:ew,disabled:et,onChange:e=>eS(e.target.value),placeholder:"e.g. Integrated Science, Mathematics, Biology"})]}),(0,a.jsxs)("label",{className:"field",children:["Chapter or Topic",(0,a.jsx)("input",{required:!0,value:eA,disabled:et,onChange:e=>e$(e.target.value),placeholder:"e.g. Photosynthesis, Quadratic Equations"})]})]}),(0,a.jsxs)("div",{className:"ai-controls",children:[(0,a.jsxs)("label",{className:"field",children:["Lesson Duration",(0,a.jsxs)("select",{value:eL,disabled:et,onChange:e=>ez(Number(e.target.value)),children:[(0,a.jsx)("option",{value:40,children:"40 Minutes (Standard Period)"}),(0,a.jsx)("option",{value:45,children:"45 Minutes (Extended Period)"}),(0,a.jsx)("option",{value:60,children:"60 Minutes (Double Period)"}),(0,a.jsx)("option",{value:80,children:"80 Minutes (Lab Block)"})]})]}),(0,a.jsxs)("label",{className:"field",children:["Curriculum Framework",(0,a.jsxs)("select",{value:eT,disabled:et,onChange:e=>eM(e.target.value),children:[(0,a.jsx)("option",{value:"CBC",children:"CBC (Competency-Based Curriculum)"}),(0,a.jsx)("option",{value:"STANDARD",children:"Standard National Curriculum"}),(0,a.jsx)("option",{value:"CAMBRIDGE",children:"Cambridge / IGCSE Framework"}),(0,a.jsx)("option",{value:"NCERT",children:"NCERT / CBSE Curriculum"})]})]})]}),(0,a.jsx)("div",{children:(0,a.jsx)(A.$n,{isLoading:et,disabled:!tt||!T||!ew.trim()||!eA.trim(),leftIcon:(0,a.jsx)(x.A,{size:16}),onClick:()=>void tl(),children:"Generate 5E Lesson Plan in 10s"})}),eO&&(0,a.jsxs)("div",{className:"mt-6 border border-gray-200 rounded-2xl bg-white p-6 shadow-sm space-y-6",children:[(0,a.jsxs)("div",{className:"flex items-start justify-between border-b pb-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("span",{className:"text-xs font-bold text-primary-600 uppercase tracking-widest",children:["5E INSTRUCTIONAL MODEL \xb7 ",eO.curriculum]}),(0,a.jsx)("h2",{className:"text-2xl font-bold text-gray-900 mt-1",children:eO.title}),(0,a.jsxs)("p",{className:"text-sm text-gray-500",children:[eO.subject," \xb7 ",eO.gradeLevel," \xb7 ",eO.durationMinutes," Minutes"]})]}),(0,a.jsxs)("div",{className:"flex flex-wrap gap-2",children:[(0,a.jsx)(A.$n,{size:"sm",variant:"primary",leftIcon:(0,a.jsx)(h.A,{size:14}),onClick:()=>(function(e){let t=window.open("","_blank");if(!t)return void window.print();let s=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lesson Plan - ${E(e.title)}</title>
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
    <div class="lp-title">5E INSTRUCTIONAL LESSON PLAN: ${E(e.title)}</div>
    <div class="meta">
      <strong>Subject:</strong> ${E(e.subject)} | <strong>Grade:</strong> ${E(e.gradeLevel)} | <strong>Duration:</strong> ${e.durationMinutes} Mins | <strong>Curriculum:</strong> ${E(e.curriculum)}
      ${e.strand?`<br/><strong>Strand:</strong> ${E(e.strand)} | <strong>Sub-Strand:</strong> ${E(e.subStrand||e.topic)}`:""}
    </div>
  </div>

  <h3>1. Specific Learning Outcomes (SLOs)</h3>
  <ul>
    ${e.learningObjectives.map(e=>`<li>${E(e)}</li>`).join("")}
  </ul>

  <h3>2. Core Competencies & Values & PCIs</h3>
  <ul>
    ${e.coreCompetencies.map(e=>`<li><strong>Competency:</strong> ${E(e)}</li>`).join("")}
    ${e.values?e.values.map(e=>`<li><strong>Value:</strong> ${E(e)}</li>`).join(""):""}
    ${e.pcis?e.pcis.map(e=>`<li><strong>PCI:</strong> ${E(e)}</li>`).join(""):""}
  </ul>

  <h3>3. Key Inquiry Questions & Teaching Aids</h3>
  <div style="font-size: 13px; margin-bottom: 8px;">
    <strong>Inquiry Questions:</strong>
    <ul>
      ${e.keyInquiryQuestions.map(e=>`<li>${E(e)}</li>`).join("")}
    </ul>
    <strong>Materials Needed:</strong> ${E(e.materials.join(", "))}
  </div>

  <h3>4. 5E Instructional Sequence</h3>
  ${e.steps.map(e=>`
    <div class="step-card">
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
        <span><strong>[${E(e.phase)}]</strong> ${E(e.title)}</span>
        <span>${e.durationMinutes} Mins</span>
      </div>
      <div><strong>Teacher Activity:</strong> ${E(e.teacherActivity)}</div>
      <div style="margin-top: 3px;"><strong>Student Activity:</strong> ${E(e.studentActivity)}</div>
      <div style="margin-top: 3px; font-size: 11px; color: #6b7280;"><strong>Resources:</strong> ${E(e.resourcesNeeded.join(", "))}</div>
    </div>
  `).join("")}

  <h3>5. Differentiated Instruction</h3>
  <div style="font-size: 12px; font-family: sans-serif; display: flex; gap: 16px;">
    <div style="flex: 1; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px; border-radius: 6px;">
      <strong style="color: #92400e;">For Struggling Learners:</strong>
      <ul style="margin-top: 4px;">
        ${e.differentiatedInstruction.supportForStruggling.map(e=>`<li>${E(e)}</li>`).join("")}
      </ul>
    </div>
    <div style="flex: 1; background: #ecfdf5; border: 1px solid #d1fae5; padding: 8px; border-radius: 6px;">
      <strong style="color: #065f46;">For Advanced Learners:</strong>
      <ul style="margin-top: 4px;">
        ${e.differentiatedInstruction.extensionForAdvanced.map(e=>`<li>${E(e)}</li>`).join("")}
      </ul>
    </div>
  </div>

  <h3>6. Assessment Rubrics & Criteria (4 Levels - KNEC Standard)</h3>
  ${e.assessmentRubrics.map(e=>`
    <table class="rubric-table" style="margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="4">Criterion: ${E(e.criterion)}</th>
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
          ${e.levels.map(e=>`
            <td>
              <strong>${E(e.scoreRange)}:</strong><br/>
              ${E(e.descriptor)}
            </td>
          `).join("")}
        </tr>
      </tbody>
    </table>
  `).join("")}

  <h3>7. Homework & Community Service Learning (CSL) Task</h3>
  <p style="font-size: 13px; font-style: italic;">${E(e.homeworkAssignment)}</p>

  ${e.reflectionPrompt?`
    <h3>8. Teacher's Self-Reflection Prompt</h3>
    <p style="font-size: 12px; color: #4b5563; border-left: 3px solid #6366f1; padding-left: 8px;">${E(e.reflectionPrompt)}</p>
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
</html>`;t.document.open(),t.document.write(s),t.document.close()})(eO),children:"Print / Save PDF Plan"}),(0,a.jsx)(A.$n,{size:"sm",variant:"secondary",leftIcon:(0,a.jsx)(g.A,{size:14}),onClick:()=>{let e=`📚 **${eO.title}**

🎯 **Specific Learning Outcomes (പഠന ലക്ഷ്യങ്ങൾ):**
${eO.learningObjectives.map((e,t)=>`${t+1}. ${e}`).join("\n")}

❓ **Key Inquiry Questions (ഇൻക്വയറി ചോദ്യങ്ങൾ):**
${eO.keyInquiryQuestions.map(e=>`• ${e}`).join("\n")}

📝 **Homework / Inquiry Task:**
${eO.homeworkAssignment}

💡 **Resources Needed:** ${eO.materials.join(", ")}`;eB({title:eO.title,content:e,type:"LESSON_PLAN"}),eq(!0)},children:"Share to Class Chat"}),(0,a.jsx)(A.$n,{size:"sm",variant:"outline",leftIcon:(0,a.jsx)(u.A,{size:14}),onClick:()=>$(`${eA.toLowerCase().replace(/\s+/g,"-")}-lesson-plan.txt`,[`LESSON PLAN: ${eO.title}`,`Subject: ${eO.subject} | Grade Level: ${eO.gradeLevel} | Duration: ${eO.durationMinutes} mins | Curriculum: ${eO.curriculum}`,"=".repeat(70),"","1. LEARNING OBJECTIVES:",...eO.learningObjectives.map((e,t)=>`  ${t+1}. ${e}`),"","2. CORE COMPETENCIES & VALUES:",...eO.coreCompetencies.map(e=>`  • ${e}`),"","3. KEY INQUIRY QUESTIONS:",...eO.keyInquiryQuestions.map(e=>`  ? ${e}`),"","4. TEACHING AIDS & MATERIALS:",...eO.materials.map(e=>`  - ${e}`),"","5. 5E INSTRUCTIONAL SEQUENCE:",...eO.steps.flatMap(e=>[`  [${e.phase}] ${e.title} (${e.durationMinutes} mins)`,`   Teacher: ${e.teacherActivity}`,`   Student: ${e.studentActivity}`,`   Resources: ${e.resourcesNeeded.join(", ")}`,""]),"6. DIFFERENTIATED LEARNING SUPPORT:","  For Struggling Learners:",...eO.differentiatedInstruction.supportForStruggling.map(e=>`   - ${e}`),"  For Advanced Learners:",...eO.differentiatedInstruction.extensionForAdvanced.map(e=>`   - ${e}`),"","7. ASSESSMENT RUBRIC:",...eO.assessmentRubrics.flatMap(e=>[`  Criterion: ${e.criterion}`,...e.levels.map(e=>`    [${e.level}] (${e.scoreRange}): ${e.descriptor}`),""]),"8. HOMEWORK / EXTENSION TASK:",`  ${eO.homeworkAssignment}`].join("\n")),children:"Download TXT"})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{className:"bg-gray-50 p-4 rounded-xl border border-gray-100",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-gray-700 uppercase tracking-wider mb-2",children:"\uD83C\uDFAF Specific Learning Objectives"}),(0,a.jsx)("ul",{className:"text-sm text-gray-800 space-y-1.5 list-disc list-inside",children:eO.learningObjectives.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]}),(0,a.jsxs)("div",{className:"bg-gray-50 p-4 rounded-xl border border-gray-100",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-gray-700 uppercase tracking-wider mb-2",children:"\uD83D\uDCA1 Core Competencies & Values"}),(0,a.jsx)("ul",{className:"text-sm text-gray-800 space-y-1.5 list-disc list-inside",children:eO.coreCompetencies.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{className:"p-4 rounded-xl border border-indigo-100 bg-indigo-50/50",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2",children:"❓ Key Inquiry Questions"}),(0,a.jsx)("ul",{className:"text-sm text-indigo-900 space-y-1.5 list-disc list-inside",children:eO.keyInquiryQuestions.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]}),(0,a.jsxs)("div",{className:"p-4 rounded-xl border border-gray-100 bg-gray-50",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-gray-700 uppercase tracking-wider mb-2",children:"\uD83D\uDCE6 Teaching Aids & Resources"}),(0,a.jsx)("ul",{className:"text-sm text-gray-800 space-y-1.5 list-disc list-inside",children:eO.materials.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2",children:[(0,a.jsx)(b.A,{size:16,className:"text-primary-600"}),"5E Instructional Phase Breakdown (",eO.durationMinutes," Minutes)"]}),(0,a.jsx)("div",{className:"space-y-3",children:eO.steps.map((e,t)=>(0,a.jsxs)("div",{className:"p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("span",{className:"text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800 font-mono",children:e.phase}),(0,a.jsx)("strong",{className:"text-gray-900 text-sm",children:e.title})]}),(0,a.jsxs)("span",{className:"text-xs font-semibold text-gray-500",children:["⏱ ",e.durationMinutes," mins"]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 mt-2",children:[(0,a.jsxs)("div",{className:"bg-gray-50 p-2.5 rounded-lg border border-gray-100",children:[(0,a.jsx)("span",{className:"font-semibold text-gray-900 block mb-1",children:"Teacher Activity:"}),e.teacherActivity]}),(0,a.jsxs)("div",{className:"bg-gray-50 p-2.5 rounded-lg border border-gray-100",children:[(0,a.jsx)("span",{className:"font-semibold text-gray-900 block mb-1",children:"Student Activity:"}),e.studentActivity]})]})]},t))})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{className:"p-4 rounded-xl border border-amber-200 bg-amber-50/60",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-amber-900 uppercase tracking-wider mb-2",children:"\uD83E\uDD1D Support for Struggling Learners"}),(0,a.jsx)("ul",{className:"text-xs text-amber-950 space-y-1 list-disc list-inside",children:eO.differentiatedInstruction.supportForStruggling.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]}),(0,a.jsxs)("div",{className:"p-4 rounded-xl border border-emerald-200 bg-emerald-50/60",children:[(0,a.jsx)("h3",{className:"text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2",children:"\uD83D\uDE80 Extension for Advanced Learners"}),(0,a.jsx)("ul",{className:"text-xs text-emerald-950 space-y-1 list-disc list-inside",children:eO.differentiatedInstruction.extensionForAdvanced.map((e,t)=>(0,a.jsx)("li",{children:e},t))})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("h3",{className:"text-sm font-bold text-gray-900 uppercase tracking-wider mb-3",children:"\uD83D\uDCCA Assessment Rubrics & Evaluation Criteria"}),(0,a.jsx)("div",{className:"space-y-4",children:eO.assessmentRubrics.map((e,t)=>(0,a.jsxs)("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[(0,a.jsxs)("div",{className:"bg-gray-100 px-4 py-2 text-xs font-bold text-gray-800",children:["Criterion: ",e.criterion]}),(0,a.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 text-xs",children:e.levels.map((e,t)=>(0,a.jsxs)("div",{className:"p-3 bg-white",children:[(0,a.jsx)("span",{className:`pill mb-1 inline-block ${"EXCEEDING"===e.level?"":"MEETING"===e.level?"neutral":"APPROACHING"===e.level?"warning":"danger"}`,children:e.level}),(0,a.jsx)("span",{className:"block text-[11px] font-semibold text-gray-500 mb-1",children:e.scoreRange}),(0,a.jsx)("p",{className:"text-gray-700 leading-relaxed",children:e.descriptor})]},t))})]},t))})]}),(0,a.jsxs)("div",{className:"bg-primary-50 p-4 rounded-xl border border-primary-200 text-xs text-primary-950",children:[(0,a.jsx)("strong",{className:"block font-bold text-primary-900 mb-1",children:"\uD83D\uDCDD Homework & Extension Assignment:"}),(0,a.jsx)("p",{children:eO.homeworkAssignment})]})]})]})}),"quiz"===W&&(0,a.jsx)(S.Zk,{title:"10-Second Quiz & Worksheet Maker",subtitle:"Generates 10 objective questions with rubrics and separate teacher answer key, ready to export or print as PDF.",children:(0,a.jsxs)("form",{className:"panel-body content-stack",onSubmit:e=>{e.preventDefault(),td()},children:[(0,a.jsxs)("div",{className:"form-grid",children:[(0,a.jsxs)("label",{className:"field",children:["Subject",(0,a.jsx)("input",{"aria-label":"Subject",required:!0,minLength:2,maxLength:100,value:eY,disabled:et,onChange:e=>eV(e.target.value)})]}),(0,a.jsxs)("label",{className:"field",children:["Chapter or topic",(0,a.jsx)("input",{"aria-label":"Chapter or topic",required:!0,minLength:2,maxLength:150,value:eX,disabled:et,onChange:e=>eZ(e.target.value)})]})]}),(0,a.jsxs)("div",{className:"ai-controls",children:[(0,a.jsxs)("label",{className:"field",children:["Format",(0,a.jsxs)("select",{"aria-label":"Format",value:e1,disabled:et,onChange:e=>e2(e.target.value),children:[(0,a.jsx)("option",{value:"QUIZ",children:"Quiz"}),(0,a.jsx)("option",{value:"WORKSHEET",children:"Worksheet"}),(0,a.jsx)("option",{value:"QUESTION_PAPER",children:"Question paper"})]})]}),(0,a.jsxs)("label",{className:"field",children:["Question type",(0,a.jsxs)("select",{"aria-label":"Question type",value:e5,disabled:et,onChange:e=>e4(e.target.value),children:[(0,a.jsx)("option",{value:"MCQ",children:"Multiple choice (MCQs)"}),(0,a.jsx)("option",{value:"SHORT_ANSWER",children:"Short answer"}),(0,a.jsx)("option",{value:"MIXED",children:"Mixed"})]})]}),(0,a.jsxs)("label",{className:"field",children:["Difficulty",(0,a.jsxs)("select",{"aria-label":"Difficulty",value:e3,disabled:et,onChange:e=>e6(e.target.value),children:[(0,a.jsx)("option",{value:"FOUNDATION",children:"Foundation"}),(0,a.jsx)("option",{value:"STANDARD",children:"Standard"}),(0,a.jsx)("option",{value:"CHALLENGE",children:"Challenge"})]})]})]}),(0,a.jsxs)("label",{className:"field",children:["Chapter or syllabus content",(0,a.jsx)("textarea",{"aria-label":"Chapter or syllabus content",className:"ai-source-input",required:!0,minLength:80,maxLength:2e4,value:eJ,disabled:et,placeholder:"Paste lesson or textbook content. Questions will be strictly grounded in this source.",onChange:e=>e0(e.target.value)}),(0,a.jsxs)("small",{className:"muted",children:[eJ.length.toLocaleString()," / 20,000 characters \xb7 minimum 80"]})]}),(0,a.jsx)("div",{children:(0,a.jsx)(A.$n,{type:"submit",isLoading:et,disabled:!tt||!T,leftIcon:(0,a.jsx)(l.A,{size:16}),children:"Generate 10 Objective Questions"})})]})}),"quiz"===W&&eU&&(0,a.jsx)(S.Zk,{title:eU.title,subtitle:`${eU.questions.length} questions \xb7 ${eU.questions.reduce((e,t)=>e+t.marks,0)} marks \xb7 Formatted Worksheet`,children:(0,a.jsxs)("div",{className:"panel-body content-stack",children:[(0,a.jsx)("p",{className:"text-sm text-gray-700",children:eU.instructions}),eU.warnings.map((e,t)=>(0,a.jsx)("div",{className:"state-box",children:e},t)),(0,a.jsxs)("div",{className:"ai-action-row",children:[(0,a.jsx)(A.$n,{variant:"primary",size:"sm",leftIcon:(0,a.jsx)(f.A,{size:15}),onClick:()=>_(eU,!1),children:"Print / Save PDF Worksheet"}),(0,a.jsx)(A.$n,{variant:"outline",size:"sm",leftIcon:(0,a.jsx)(c.A,{size:15}),onClick:()=>_(eU,!0),children:"Print / Save PDF Teacher Key"}),(0,a.jsx)(A.$n,{variant:"outline",size:"sm",leftIcon:(0,a.jsx)(u.A,{size:15}),onClick:()=>$("student-question-paper.txt",function(e,t=!1){return[e.title,t?"TEACHER ANSWER KEY & RUBRIC":e.instructions,"",...e.questions.map((e,s)=>t?`${s+1}. ${e.answer}
Explanation: ${e.explanation}
Marks: ${e.marks}
`:`${s+1}. ${e.question} (${e.marks} marks)
${e.options.map((e,t)=>`   ${String.fromCharCode(65+t)}. ${e}`).join("\n")}
`)].join("\n")}(eU)),children:"Download Text"}),(0,a.jsxs)("label",{className:"flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer",children:[(0,a.jsx)("input",{type:"checkbox",checked:eH,onChange:e=>eQ(e.target.checked)})," ","Show Teacher Answer Key & Explanations"]})]}),(0,a.jsx)("div",{className:"space-y-4 pt-2",children:eU.questions.map((e,t)=>(0,a.jsxs)("article",{className:"ai-question p-4 rounded-xl border border-gray-200 bg-white",children:[(0,a.jsxs)("div",{className:"ai-question-heading flex items-center justify-between mb-2",children:[(0,a.jsxs)("h3",{className:"font-semibold text-gray-900 text-sm",children:[t+1,". ",e.question]}),(0,a.jsxs)("span",{className:"text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded",children:[e.marks," marks"]})]}),e.options.length>0&&(0,a.jsx)("ol",{className:"list-[upper-alpha] list-inside space-y-1 text-xs text-gray-700 my-2 pl-2",children:e.options.map((e,t)=>(0,a.jsx)("li",{className:"leading-relaxed",children:e},t))}),eH&&(0,a.jsxs)("div",{className:"ai-answer mt-3 p-3 bg-emerald-50 rounded-lg text-xs border border-emerald-200",children:[(0,a.jsxs)("strong",{className:"text-emerald-900 block mb-0.5",children:["Correct Answer: ",e.answer]}),(0,a.jsx)("p",{className:"text-emerald-800",children:e.explanation})]})]},t))})]})}),(0,a.jsxs)("div",{className:"ai-action-row muted text-xs pt-4",children:[(0,a.jsx)(n(),{className:"panel-link",href:`${tx}/grades`,children:"Open gradebook →"}),(0,a.jsx)(n(),{className:"panel-link",href:"/dashboard/copilot",children:"Ask ERP Copilot →"}),"/school"===tx&&(0,a.jsx)(n(),{className:"panel-link",href:"/school/report-cards",children:"Report-card approval & publishing →"})]})]}):(0,a.jsx)(S.pp,{title:"No assigned classes",description:"Ask your administrator to link your staff account and timetable assignments."})]}):!er&&(0,a.jsx)("div",{className:"panel panel-body",role:"status",children:"Loading your teaching workspace…"})]}),eU&&(0,a.jsxs)("section",{className:"ai-print-paper hidden print:block",children:[(0,a.jsxs)("div",{className:"border-b-2 border-black pb-4 mb-6",children:[(0,a.jsx)("h1",{className:"text-xl font-bold uppercase",children:eU.title}),(0,a.jsxs)("div",{className:"flex justify-between text-xs mt-3",children:[(0,a.jsx)("span",{children:"Student Name: ____________________________________"}),(0,a.jsx)("span",{children:"Class: __________"}),(0,a.jsx)("span",{children:"Date: __________"}),(0,a.jsxs)("span",{children:["Max Marks: ",eU.questions.reduce((e,t)=>e+t.marks,0)]})]}),(0,a.jsx)("p",{className:"text-xs italic mt-2",children:eU.instructions})]}),(0,a.jsx)("div",{className:"space-y-6",children:eU.questions.map((e,t)=>(0,a.jsxs)("article",{className:"text-xs",children:[(0,a.jsxs)("div",{className:"flex justify-between font-bold mb-1",children:[(0,a.jsxs)("span",{children:[t+1,". ",e.question]}),(0,a.jsxs)("span",{children:["[",e.marks," Marks]"]})]}),e.options.length>0?(0,a.jsx)("ol",{className:"list-[upper-alpha] list-inside space-y-1 ml-4",children:e.options.map((e,t)=>(0,a.jsx)("li",{children:e},t))}):(0,a.jsx)("div",{className:"h-16 border-b border-dashed border-gray-400 mt-2"})]},t))})]}),eO&&(0,a.jsxs)("section",{className:"hidden print:block p-8",children:[(0,a.jsx)("h1",{className:"text-2xl font-bold",children:eO.title}),(0,a.jsxs)("p",{className:"text-sm",children:[eO.subject," \xb7 ",eO.gradeLevel," \xb7 ",eO.durationMinutes," Minutes"]}),(0,a.jsx)("hr",{className:"my-4"}),(0,a.jsx)("h2",{className:"font-bold text-sm uppercase",children:"Learning Objectives:"}),(0,a.jsx)("ul",{className:"list-disc list-inside text-xs mb-4",children:eO.learningObjectives.map((e,t)=>(0,a.jsx)("li",{children:e},t))}),(0,a.jsx)("h2",{className:"font-bold text-sm uppercase",children:"5E Instructional Cycle:"}),eO.steps.map((e,t)=>(0,a.jsxs)("div",{className:"mb-3 text-xs",children:[(0,a.jsxs)("strong",{children:["[",e.phase,"] ",e.title," (",e.durationMinutes," min)"]}),(0,a.jsxs)("p",{children:["Teacher: ",e.teacherActivity]}),(0,a.jsxs)("p",{children:["Student: ",e.studentActivity]})]},t))]}),eD&&eF&&(0,a.jsx)("div",{className:"fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4",children:(0,a.jsxs)("div",{className:"bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between pb-3 border-b",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(v.A,{className:"text-primary-600",size:20}),(0,a.jsx)("h3",{className:"font-bold text-gray-900",children:"Share to Class Chat (കുട്ടികൾക്ക് അയക്കുക)"})]}),(0,a.jsx)("button",{onClick:()=>eq(!1),className:"text-gray-400 hover:text-gray-600 font-bold",children:"✕"})]}),(0,a.jsxs)("div",{className:"mt-4 space-y-4",children:[(0,a.jsx)("p",{className:"text-xs text-gray-600",children:"This will post the lesson plan or scheme of work summary, learning outcomes, inquiry questions, and tasks directly into the class chat channel for students and parents to view."}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"text-xs font-semibold text-gray-700 block mb-1",children:"Title"}),(0,a.jsx)("input",{className:"w-full text-sm border rounded-lg p-2.5 bg-gray-50 text-gray-800 font-medium",value:eF.title,onChange:e=>eB({...eF,title:e.target.value})})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"text-xs font-semibold text-gray-700 block mb-1",children:"Message Preview"}),(0,a.jsx)("textarea",{rows:8,className:"w-full text-xs font-mono border rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-primary-500",value:eF.content,onChange:e=>eB({...eF,content:e.target.value})})]})]}),(0,a.jsxs)("div",{className:"mt-6 flex justify-end gap-3 pt-3 border-t",children:[(0,a.jsx)(A.$n,{variant:"outline",size:"sm",onClick:()=>eq(!1),disabled:eW,children:"Cancel"}),(0,a.jsx)(A.$n,{variant:"primary",size:"sm",isLoading:eW,leftIcon:(0,a.jsx)(g.A,{size:14}),onClick:()=>void to(eF),children:"Send to Class Chat Now"})]})]})})]})}},8387:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"printer",size:24,node:[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]};i.node;let r=(0,a.A)(i)},8976:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"message-square",size:24,node:[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]]};i.node;let r=(0,a.A)(i)},9457:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"layers",size:24,node:[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],aliases:["layers-3"]};i.node;let r=(0,a.A)(i)},9686:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var a=s(1363);let i={name:"sparkles",size:24,node:[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],aliases:["stars"]};i.node;let r=(0,a.A)(i)}}]);