import{_ as Re}from"./COWfak2L.js";import{_ as ie}from"./Cws21wEs.js";import{_ as pe}from"./BVugTcRl.js";import{A as _e,a as be,B as ve,d as R,b as de,r as C,C as me,n as S,f as x,h as a,g as e,j as t,i as X,w as c,l as k,m as ce,_ as ue,k as M,F as oe,p as ne,t as U,s as re,q as Q,e as J,v as Ee,x as Ne,o as ke,D as we,u as Ie,E as Oe}from"#entry";import{_ as fe}from"./B89Qzdga.js";import{_ as ge,a as $e}from"./C7QMc5iL.js";import{a as Ce,_ as Fe}from"./Dk7VJQAl.js";import{_ as qe}from"./DRGFzCUJ.js";import{a as xe,_ as ye}from"./B8kQMdkV.js";import{u as Be}from"./Dcf2bR3w.js";import{u as He}from"./DWWd6TDK.js";import{u as Ve}from"./D9bTrlNW.js";import"./D2CnTIBc.js";const Ge={__name:"ParametresTachesPrint",props:{taches:{type:Array,required:!0},profils:{type:Array,default:()=>[]}},setup(I,{expose:v}){const w=I,T=m=>{if(m==null)return"—";const A=Math.abs(m);return`${m<0?"J+":"J-"}${A}`};return v({printTaches:()=>{const m=window.open("","_blank");if(!m){alert("Veuillez autoriser les popups pour imprimer");return}const A=new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),z=[...w.taches].sort((r,p)=>p.delais-r.delais),u=z.length,n=z.filter(r=>r.rp1===1).length,f=new Set(z.map(r=>r.categorie)).size,_=w.profils.map(r=>`<th class="col-profil">${r.label}</th>`).join(""),g=z.map((r,p)=>{const P=w.profils.map(o=>`<td class="profil-cell">${r.tache_profil?.includes(o.id)?'<span class="check">✓</span>':'<span class="uncheck">—</span>'}</td>`).join("");return`
    <tr class="${p%2===0?"even":"odd"}">
      <td class="delay-cell">
        <span class="delay-badge ${r.delais<0?"delay-after":"delay-before"}">${T(r.delais)}</span>
      </td>
      <td class="task-name">${r.tache||"—"}</td>
      <td class="category-cell">
        <span class="category-badge">${r.categorie||"Sans catégorie"}</span>
      </td>
      <td class="reference-cell">
        ${r.opt_delais===1?'<span class="ref-badge ref-end"><span class="ref-icon">◀</span><span class="ref-text">Fin</span></span>':'<span class="ref-badge ref-start"><span class="ref-icon">▶</span><span class="ref-text">Début</span></span>'}
      </td>
      <td class="rp1-cell">
        ${r.rp1===1?'<span class="rp1-badge">RP1</span>':'<span class="rp1-empty">—</span>'}
      </td>
      ${P}
    </tr>
  `}).join(""),$=`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Liste des Tâches - H00</title>
      <style>
        @font-face {
          font-family: 'Pacifico';
          src: url('/fonts/Pacifico.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @page {
          size: landscape;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.3;
          color: #1a1a1a;
          background: white;
          padding: 10mm;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 3px solid #2563eb;
        }
        
        .header-left h1 {
          font-family: 'Pacifico', cursive;
          font-size: 24pt;
          font-weight: 400;
          color: #1e3a5f;
          margin-bottom: 2px;
        }
        
        .header-left h1 .drop-cap {
          font-size: 38pt;
          line-height: 0.8;
          float: left;
          margin-right: 2px;
          color: #2563eb;
        }
        
        .header-left .subtitle {
          font-size: 10pt;
          color: #64748b;
        }
        
        .header-right {
          text-align: right;
          display: flex;
          align-items: center;
        }
        
        .header-right .logo {
          font-size: 12pt;
          font-weight: 700;
          color: #374151;
          letter-spacing: -0.5px;
        }
        
        .summary {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 6px;
          padding: 10px 15px;
          margin-bottom: 15px;
          display: flex;
          gap: 20px;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        
        .summary-item .label {
          font-size: 7pt;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-item .value {
          font-size: 14pt;
          font-weight: 700;
          color: #1e3a5f;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        
        thead {
          background: #1e3a5f;
        }
        
        th {
          padding: 8px 5px;
          text-align: left;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          font-size: 6pt;
          letter-spacing: 0.4px;
        }
        
        td {
          padding: 6px 5px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        
        tr.odd {
          background: #fafbfc;
        }
        
        tr.even {
          background: white;
        }
        
        .col-delay { width: 6%; text-align: center; }
        .col-task { }
        .col-category { width: 12%; }
        .col-ref { width: 8%; }
        .col-rp1 { width: 5%; text-align: center; }
        .col-profil { width: 6%; text-align: center; }
        
        .task-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 8pt;
        }
        
        .delay-cell {
          text-align: center;
        }
        
        .delay-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 700;
          font-size: 7pt;
          font-family: 'Consolas', 'Monaco', monospace;
          white-space: nowrap;
        }
        
        .delay-before {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .delay-after {
          background: #dcfce7;
          color: #15803d;
        }
        
        .category-cell {
        }
        
        .category-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 7pt;
          font-weight: 500;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          text-align: center;
          white-space: nowrap;
        }
        
        .reference-cell {
        }
        
        .ref-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7pt;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .ref-icon {
          font-size: 5pt;
        }
        
        .ref-text {
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        
        .ref-start {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #7dd3fc;
        }
        
        .ref-end {
          background: #fce7f3;
          color: #be185d;
          border: 1px solid #f9a8d4;
        }
        
        .rp1-cell {
          text-align: center;
        }
        
        .rp1-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 6pt;
          font-weight: 700;
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fcd34d;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        
        .rp1-empty {
          color: #cbd5e1;
          font-size: 9pt;
        }
        
        .profil-cell {
          text-align: center;
        }
        
        .check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 9pt;
          font-weight: 700;
        }
        
        .uncheck {
          color: #e2e8f0;
          font-size: 9pt;
        }
        
        .footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 7pt;
          color: #94a3b8;
        }
        
        @media print {
          body {
            padding: 5mm;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1><span class="drop-cap">L</span>iste des Tâches</h1>
          <div class="subtitle">Référentiel des tâches et délais</div>
        </div>
        <div class="header-right">
          <div class="logo">H00 Travaux</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <span class="label">Total tâches</span>
          <span class="value">${u}</span>
        </div>
        <div class="summary-item">
          <span class="label">Catégories</span>
          <span class="value">${f}</span>
        </div>
        <div class="summary-item">
          <span class="label">Tâches RP1</span>
          <span class="value">${n}</span>
        </div>
        <div class="summary-item">
          <span class="label">Profils</span>
          <span class="value">${w.profils.length}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="col-delay">Délai</th>
            <th class="col-task">Tâche</th>
            <th class="col-category">Catégorie</th>
            <th class="col-ref">Réf.</th>
            <th class="col-rp1">RP1</th>
            ${_}
          </tr>
        </thead>
        <tbody>
          ${g}
        </tbody>
      </table>
      
      <div class="footer">
        Document généré le ${A} — H00 Gestion de chantiers
      </div>
    </body>
    </html>
  `;m.document.write($),m.document.close(),m.onload=()=>{m.print()}}}),(m,A)=>null}},Se=()=>{const I=_e(),{addToast:v}=be(),w=ve("categories_list",()=>[]),T=async()=>{try{const{data:u,error:n}=await I.from("categories").select("idcategories, name").order("name",{ascending:!0});if(n)throw console.error("Erreur Supabase:",n),n;u&&Array.isArray(u)?w.value=u.map(f=>({id:f.idcategories,name:f.name})):w.value=[]}catch(u){console.error("Erreur lors du chargement des catégories:",u),w.value=[],v({title:"Problème lors du chargement des catégories",message:u.message||"La table categories n'existe peut-être pas encore.",type:"Error"})}},D=async u=>{try{const{data:n,error:f}=await I.from("categories").insert({name:u}).select().single();if(f)throw f;return await T(),v({title:"Catégorie créée",message:`La catégorie "${u}" a été créée avec succès.`,type:"Success"}),n}catch(n){return v({title:"Erreur",message:n.message||"Impossible de créer la catégorie",type:"Error"}),null}},m=async(u,n)=>{try{const{error:f}=await I.from("categories").update({name:n}).eq("idcategories",u);if(f)throw f;return await T(),v({title:"Catégorie modifiée",message:"La catégorie a été modifiée avec succès.",type:"Success"}),!0}catch(f){return v({title:"Erreur",message:f.message||"Impossible de modifier la catégorie",type:"Error"}),!1}},A=async u=>{try{const{error:n}=await I.from("categories").delete().eq("idcategories",u);if(n)throw n;return await T(),v({title:"Catégorie supprimée",message:"La catégorie a été supprimée avec succès.",type:"Success"}),!0}catch(n){return v({title:"Erreur",message:n.message||"Impossible de supprimer la catégorie",type:"Error"}),!1}},z=R(()=>[...w.value].sort((u,n)=>u.name.localeCompare(n.name)));return{categories:w,categoriesSorted:z,getCategories:T,createCategory:D,updateCategory:m,deleteCategory:A}},Ae=()=>{const I=_e(),{addToast:v}=be(),w=ve("profilTaches",()=>[]);return{getAllProfilTache:async()=>{try{const{data:D,error:m}=await I.from("profil").select("*").order("num_profil",{ascending:!0});if(m)throw m;w.value=D.map(A=>({id:A.num_profil,label:A.name_profil}))}catch(D){v({title:"Problème lors du chargement des profils",message:D.message,type:"Error"})}},profilTaches:w}},Je={class:"flex h-full w-full flex-col gap-4 overflow-hidden"},Xe={class:"flex w-full flex-col items-center justify-between gap-4 sm:flex-row"},We={class:"flex items-center gap-3"},Ye={class:"flex items-center gap-2"},Ke={class:"flex items-center gap-2"},Qe={class:"flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"},Ze={class:"flex-1 overflow-auto"},et={class:"w-full text-sm"},tt={class:"divide-y divide-gray-100 dark:divide-gray-800"},lt=["onClick"],at={class:"px-4 py-3"},st={class:"flex items-start gap-3"},rt={class:"bg-primary-100 dark:bg-primary-900/30 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"},ot={class:"flex min-w-0 flex-col"},nt={class:"line-clamp-2 font-medium text-gray-900 dark:text-white"},it={class:"mt-1 text-xs text-gray-500 md:hidden dark:text-gray-400"},dt={class:"hidden px-4 py-3 md:table-cell"},ct={class:"inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"},ut={class:"px-4 py-3 text-center"},pt={class:"hidden px-4 py-3 text-center lg:table-cell"},mt={key:0,class:"inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},ft={key:1,class:"text-xs text-gray-400 dark:text-gray-500"},gt={class:"px-4 py-3 text-center"},xt={class:"flex items-center justify-center gap-1"},yt=["onClick"],ht=["onClick"],_t={key:0},bt={colspan:"5",class:"px-4 py-8 text-center text-gray-500 dark:text-gray-400"},vt={class:"text-center"},kt={class:"bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"},wt={class:"text-xl font-semibold text-gray-900 dark:text-white"},$t={key:0,class:"mt-1 text-sm text-gray-500 dark:text-gray-400"},Ct={class:"flex flex-col gap-1.5"},Vt={class:"flex flex-col gap-1.5"},St={class:"flex flex-col gap-1.5"},At={class:"flex flex-col gap-1.5"},Tt={key:0,class:"flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"},Pt={class:"flex flex-col gap-1.5"},Ut={class:"flex flex-col gap-1.5"},zt={class:"grid grid-cols-2 gap-3"},Lt={class:"flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"},Mt={class:"text-center"},Dt={class:"mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"},jt={class:"text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300"},Rt={class:"font-semibold text-gray-900 dark:text-white"},Et={class:"flex justify-end gap-3"},Nt={__name:"ParametresTaches",async setup(I){let v,w;const{taches:T,getTaches:D,createTache:m,updateTache:A,deleteTache:z}=Be(),{categories:u,getCategories:n}=Se(),{profilTaches:f,getAllProfilTache:_}=Ae(),{setLoader:g}=de(),$=C(""),r=C(!1),p=C(null),P=C(!1),o=C({}),O=C(null),F=C(!1),y=C(null),i=C(!1),N=R(()=>{if(!$.value)return T.value;const b=$.value.toLowerCase();return T.value.filter(l=>l.tache?.toLowerCase().includes(b)||l.categorie?.toLowerCase().includes(b))}),q=[{id:0,label:"Par rapport au début des travaux"},{id:1,label:"Par rapport à la fin des travaux"}],B=R({get:()=>o.value.rp1===1,set:b=>{o.value.rp1=b?1:0}}),j=b=>o.value.tache_profil?.includes(b)||!1,d=(b,l)=>{o.value.tache_profil||(o.value.tache_profil=[]);const Z=o.value.tache_profil.indexOf(b);l&&Z===-1?o.value.tache_profil.push(b):!l&&Z>-1&&o.value.tache_profil.splice(Z,1)},ee=R(()=>u.value.map(b=>({id:b.id,label:b.name}))),V=R(()=>o.value.tache&&o.value.tache.trim().length>0&&o.value.id_categories&&o.value.delais!==null&&o.value.delais!==void 0),s=b=>{if(b==null)return"—";const l=Math.abs(b);return`${b<0?"J+":"J-"}${l}`},H=b=>{b&&(o.value={...b},O.value={...b},P.value=!1,r.value=!0)},le=()=>{o.value={tache:"",id_categories:null,delais:0,tache_profil:[],opt_delais:0,rp1:0},O.value=null,P.value=!0,r.value=!0},E=()=>{r.value=!1,o.value={},O.value=null,P.value=!1},G=async()=>{if(V.value){g(!0);try{P.value?await m({tache:o.value.tache.trim(),id_categories:o.value.id_categories,delais:parseInt(o.value.delais),tache_profil:o.value.tache_profil||[],opt_delais:o.value.opt_delais||0,rp1:o.value.rp1||0}):await A(o.value.id,{tache:o.value.tache.trim(),id_categories:o.value.id_categories,delais:parseInt(o.value.delais),tache_profil:o.value.tache_profil||[],opt_delais:o.value.opt_delais,rp1:o.value.rp1},O.value),E()}finally{g(!1)}}},W=b=>{b?.id&&(y.value=b,F.value=!0)},L=async()=>{if(y.value?.id){i.value=!0;try{await z(y.value.id),F.value=!1,y.value=null,E()}finally{i.value=!1}}},Y=()=>{y.value=null},ae=()=>{p.value?.printTaches()};g(!0);try{[v,w]=me(()=>Promise.all([D(),n(),_()])),await v,w()}finally{g(!1)}return(b,l)=>{const Z=ie,Te=pe,K=ce,te=ue,he=fe,Pe=ge,Ue=Ce,ze=qe,Le=xe,Me=ye,De=$e,je=Ge;return x(),S("div",Je,[a(Z,{title:"Paramètres Tâches",description:"Gestion des tâches et de leurs délais"}),e("div",Xe,[a(Te,{modelValue:t($),"onUpdate:modelValue":l[0]||(l[0]=h=>X($)?$.value=h:null),class:"w-full max-w-md",placeholder:"Rechercher une tâche ..."},null,8,["modelValue"]),e("div",We,[a(te,{theme:"secondary",type:"button",onClick:ae},{default:c(()=>[e("span",Ye,[a(K,{name:"lucide:printer",size:"18"}),l[8]||(l[8]=k(" Imprimer ",-1))])]),_:1}),a(te,{theme:"primary",type:"button",onClick:le},{default:c(()=>[e("span",Ke,[a(K,{name:"lucide:plus",size:"18"}),l[9]||(l[9]=k(" Ajouter ",-1))])]),_:1})])]),e("div",Qe,[e("div",Ze,[e("table",et,[l[11]||(l[11]=e("thead",{class:"sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"},[e("tr",null,[e("th",{class:"px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"},"Tâche"),e("th",{class:"hidden px-4 py-3 text-left font-semibold text-gray-700 md:table-cell dark:text-gray-200"}," Catégorie "),e("th",{class:"w-24 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200"},"Délai"),e("th",{class:"hidden w-24 px-4 py-3 text-center font-semibold text-gray-700 lg:table-cell dark:text-gray-200"}," RP1 "),e("th",{class:"w-24 px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200"},"Actions")])],-1)),e("tbody",tt,[(x(!0),S(oe,null,ne(t(N),h=>(x(),S("tr",{key:h.id,class:"cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",onClick:se=>H(h)},[e("td",at,[e("div",st,[e("div",rt,[a(K,{name:"lucide:clipboard-list",size:"16",class:"text-primary-500"})]),e("div",ot,[e("span",nt,U(h.tache||"—"),1),e("span",it,U(h.categorie||"Sans catégorie"),1)])])]),e("td",dt,[e("span",ct,U(h.categorie||"Sans catégorie"),1)]),e("td",ut,[e("span",{class:re(["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",h.delais<0?"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"])},U(s(h.delais)),3)]),e("td",pt,[h.rp1===1?(x(),S("span",mt," RP1 ")):(x(),S("span",ft,"—"))]),e("td",gt,[e("div",xt,[e("button",{class:"rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",onClick:Q(se=>H(h),["stop"]),title:"Modifier"},[a(K,{name:"lucide:pencil",class:"hover:text-primary-500 h-4 w-4 text-gray-500"})],8,yt),e("button",{class:"rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20",onClick:Q(se=>W(h),["stop"]),title:"Supprimer"},[a(K,{name:"lucide:trash-2",class:"h-4 w-4 text-gray-500 hover:text-red-500"})],8,ht)])])],8,lt))),128)),t(N).length===0?(x(),S("tr",_t,[e("td",bt,[a(K,{name:"lucide:clipboard-x",class:"mx-auto mb-2 h-8 w-8 opacity-50"}),l[10]||(l[10]=e("p",null,"Aucune tâche trouvée",-1))])])):M("",!0)])])])]),a(Me,{sideModal:t(r),closeSideModal:E},{default:c(()=>[t(r)?(x(),J(Le,{key:0,closeSideModal:E},{header:c(()=>[e("div",vt,[e("div",kt,[a(K,{name:t(P)?"lucide:clipboard-plus":"lucide:clipboard-edit",size:"28",class:"text-primary-500"},null,8,["name"])]),e("h2",wt,U(t(P)?"Nouvelle tâche":"Modifier la tâche"),1),t(P)?M("",!0):(x(),S("p",$t,"ID: "+U(t(o).id),1))])]),default:c(()=>[e("form",{onSubmit:Q(G,["prevent"]),class:"flex w-full flex-col gap-5"},[e("div",Ct,[l[12]||(l[12]=e("label",{class:"text-sm font-medium text-gray-700 dark:text-gray-300"},[k(" Nom de la tâche "),e("span",{class:"text-red-500"},"*")],-1)),Ee(e("textarea",{"onUpdate:modelValue":l[1]||(l[1]=h=>t(o).tache=h),rows:"3",class:"focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white",placeholder:"Description de la tâche..."},null,512),[[Ne,t(o).tache]])]),e("div",Vt,[l[13]||(l[13]=e("label",{class:"text-sm font-medium text-gray-700 dark:text-gray-300"},[k(" Catégorie "),e("span",{class:"text-red-500"},"*")],-1)),a(he,{modelValue:t(o).id_categories,"onUpdate:modelValue":l[2]||(l[2]=h=>t(o).id_categories=h),options:t(ee),placeholder:"Sélectionner une catégorie..."},null,8,["modelValue","options"])]),e("div",St,[l[14]||(l[14]=e("label",{class:"text-sm font-medium text-gray-700 dark:text-gray-300"},[k(" Délai (en jours) "),e("span",{class:"text-red-500"},"*")],-1)),a(Pe,{name:"delais",type:"number",placeholder:"Ex: 30, -15...",modelValue:t(o).delais,"onUpdate:modelValue":l[3]||(l[3]=h=>t(o).delais=h)},null,8,["modelValue"]),l[15]||(l[15]=e("p",{class:"text-xs text-gray-500 dark:text-gray-400"}," Valeur positive = avant la date de référence (J-X), négative = après (J+X) ",-1))]),e("div",At,[l[17]||(l[17]=e("label",{class:"text-sm font-medium text-gray-700 dark:text-gray-300"},"Date de référence",-1)),a(he,{modelValue:t(o).opt_delais,"onUpdate:modelValue":l[4]||(l[4]=h=>t(o).opt_delais=h),options:q,placeholder:"Sélectionner..."},null,8,["modelValue"]),t(P)?M("",!0):(x(),S("p",Tt,[a(K,{name:"lucide:alert-triangle",class:"h-3 w-3"}),l[16]||(l[16]=k(" Modifier cette valeur mettra à jour les prévisions existantes ",-1))]))]),e("div",Pt,[l[18]||(l[18]=e("label",{class:"text-sm font-medium text-gray-700 dark:text-gray-300"},"Tâche RP1",-1)),a(Ue,{modelValue:t(B),"onUpdate:modelValue":l[5]||(l[5]=h=>X(B)?B.value=h:null),label:"Activer pour les tâches RP1"},null,8,["modelValue"])]),e("div",Ut,[l[19]||(l[19]=e("label",{class:"text-sm font-medium text-gray-700 dark:text-gray-300"},"Profils concernés",-1)),e("div",zt,[(x(!0),S(oe,null,ne(t(f),h=>(x(),J(ze,{key:h.id,label:h.label,"model-value":j(h.id),"onUpdate:modelValue":se=>d(h.id,se)},null,8,["label","model-value","onUpdate:modelValue"]))),128))])])],32)]),footer:c(()=>[e("div",Lt,[a(te,{theme:"cancel",type:"button",onClick:E},{default:c(()=>[...l[20]||(l[20]=[k("Annuler",-1)])]),_:1}),a(te,{validated:t(V),onClick:G},{default:c(()=>[k(U(t(P)?"Créer":"Enregistrer"),1)]),_:1},8,["validated"])])]),_:1})):M("",!0)]),_:1},8,["sideModal"]),a(De,{modelValue:t(F),"onUpdate:modelValue":l[7]||(l[7]=h=>X(F)?F.value=h:null),size:"md",persistent:t(i),onClose:Y},{header:c(()=>[e("div",Mt,[e("div",Dt,[a(K,{name:"lucide:triangle-alert",size:"28",class:"text-red-600 dark:text-red-400"})]),l[21]||(l[21]=e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white"},"Supprimer une tâche",-1))])]),default:c(()=>[e("p",jt,[l[22]||(l[22]=k(" Êtes-vous sûr de vouloir supprimer la tâche ",-1)),e("span",Rt," « "+U(t(y)?.tache?.substring(0,50)||"")+U(t(y)?.tache?.length>50?"...":"")+" » ",1),l[23]||(l[23]=k(" ? Cette action est irréversible. ",-1))])]),footer:c(()=>[e("div",Et,[a(te,{theme:"cancel",type:"button",validated:!t(i),onClick:l[6]||(l[6]=h=>F.value=!1)},{default:c(()=>[...l[24]||(l[24]=[k("Annuler",-1)])]),_:1},8,["validated"]),a(te,{theme:"delete",type:"button",loading:t(i),onClick:L},{default:c(()=>[...l[25]||(l[25]=[k("Supprimer",-1)])]),_:1},8,["loading"])])]),_:1},8,["modelValue","persistent"]),a(je,{ref_key:"printComponentRef",ref:p,taches:t(T),profils:t(f)},null,8,["taches","profils"])])}}},It={class:"flex flex-col w-full h-full gap-4 overflow-hidden"},Ot={class:"flex flex-col sm:flex-row gap-4 items-center justify-between w-full"},Ft={class:"flex items-center gap-2"},qt={class:"flex flex-col w-full flex-1 min-h-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"},Bt={class:"overflow-auto flex-1"},Ht={class:"w-full text-sm"},Gt={class:"divide-y divide-gray-100 dark:divide-gray-800"},Jt=["onClick"],Xt={class:"px-4 py-3"},Wt={class:"flex items-center gap-3"},Yt={class:"w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"},Kt={class:"font-medium text-gray-900 dark:text-white"},Qt={class:"px-4 py-3 text-center"},Zt={class:"flex items-center justify-center gap-1"},el=["onClick"],tl=["onClick"],ll={key:0},al={colspan:"2",class:"px-4 py-8 text-center text-gray-500 dark:text-gray-400"},sl={class:"text-center"},rl={class:"w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"},ol={class:"text-xl font-semibold text-gray-900 dark:text-white"},nl={key:0,class:"text-sm text-gray-500 dark:text-gray-400 mt-1"},il={class:"flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"},dl={class:"text-center"},cl={class:"w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"},ul={class:"text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed"},pl={class:"font-semibold text-gray-900 dark:text-white"},ml={class:"flex gap-3 justify-end"},fl={__name:"ParametresCategories",async setup(I){let v,w;const{categories:T,getCategories:D,createCategory:m,updateCategory:A,deleteCategory:z}=Se(),{setLoader:u}=de(),n=C(""),f=C(!1),_=C(!1),g=C({}),$=C(!1),r=C(null),p=C(!1),P=R(()=>{if(!n.value)return T.value;const j=n.value.toLowerCase();return T.value.filter(d=>d.name?.toLowerCase().includes(j))}),o=R(()=>g.value.name&&g.value.name.trim().length>0),O=j=>{j&&(g.value={...j},_.value=!1,f.value=!0)},F=()=>{g.value={name:""},_.value=!0,f.value=!0},y=()=>{f.value=!1,g.value={},_.value=!1},i=async()=>{if(o.value){u(!0);try{_.value?await m(g.value.name.trim()):await A(g.value.id,g.value.name.trim()),y()}finally{u(!1)}}},N=j=>{j?.id&&(r.value=j,$.value=!0)},q=async()=>{if(r.value?.id){p.value=!0;try{await z(r.value.id),$.value=!1,r.value=null}finally{p.value=!1}}},B=()=>{r.value=null};u(!0);try{[v,w]=me(()=>D()),await v,w()}finally{u(!1)}return(j,d)=>{const ee=ie,V=pe,s=ce,H=ue,le=ge,E=xe,G=ye,W=$e;return x(),S("div",It,[a(ee,{title:"Paramètres Catégories",description:"Gestion des catégories de tâches"}),e("div",Ot,[a(V,{modelValue:t(n),"onUpdate:modelValue":d[0]||(d[0]=L=>X(n)?n.value=L:null),class:"w-full max-w-md",placeholder:"Rechercher une catégorie ..."},null,8,["modelValue"]),a(H,{theme:"primary",type:"button",onClick:F},{default:c(()=>[e("span",Ft,[a(s,{name:"lucide:plus",size:"18"}),d[4]||(d[4]=k(" Ajouter ",-1))])]),_:1})]),e("div",qt,[e("div",Bt,[e("table",Ht,[d[6]||(d[6]=e("thead",{class:"bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"},[e("tr",null,[e("th",{class:"px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"},"Nom de la catégorie"),e("th",{class:"px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 w-24"},"Actions")])],-1)),e("tbody",Gt,[(x(!0),S(oe,null,ne(t(P),L=>(x(),S("tr",{key:L.id,class:"hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors",onClick:Y=>O(L)},[e("td",Xt,[e("div",Wt,[e("div",Yt,[a(s,{name:"lucide:folder",size:"16",class:"text-primary-500"})]),e("span",Kt,U(L.name||"—"),1)])]),e("td",Qt,[e("div",Zt,[e("button",{class:"p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",onClick:Q(Y=>O(L),["stop"]),title:"Modifier"},[a(s,{name:"lucide:pencil",class:"w-4 h-4 text-gray-500 hover:text-primary-500"})],8,el),e("button",{class:"p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",onClick:Q(Y=>N(L),["stop"]),title:"Supprimer"},[a(s,{name:"lucide:trash-2",class:"w-4 h-4 text-gray-500 hover:text-red-500"})],8,tl)])])],8,Jt))),128)),t(P).length===0?(x(),S("tr",ll,[e("td",al,[a(s,{name:"lucide:folder-x",class:"w-8 h-8 mx-auto mb-2 opacity-50"}),d[5]||(d[5]=e("p",null,"Aucune catégorie trouvée",-1))])])):M("",!0)])])])]),a(G,{sideModal:t(f),closeSideModal:y},{default:c(()=>[t(f)?(x(),J(E,{key:0,closeSideModal:y},{header:c(()=>[e("div",sl,[e("div",rl,[a(s,{name:t(_)?"lucide:folder-plus":"lucide:folder-edit",size:"28",class:"text-primary-500"},null,8,["name"])]),e("h2",ol,U(t(_)?"Nouvelle catégorie":"Modifier la catégorie"),1),t(_)?M("",!0):(x(),S("p",nl," ID: "+U(t(g).id),1))])]),default:c(()=>[e("form",{onSubmit:Q(i,["prevent"]),class:"flex flex-col gap-5 w-full"},[a(le,{name:"name",title:"Nom de la catégorie",placeholder:"Ex: Technique, Ressources, Matières...",modelValue:t(g).name,"onUpdate:modelValue":d[1]||(d[1]=L=>t(g).name=L)},null,8,["modelValue"]),d[7]||(d[7]=e("p",{class:"text-xs text-gray-500 dark:text-gray-400"}," Le nom de la catégorie sera utilisé pour organiser et filtrer les tâches. ",-1))],32)]),footer:c(()=>[e("div",il,[a(H,{theme:"cancel",type:"button",onClick:y},{default:c(()=>[...d[8]||(d[8]=[k("Annuler",-1)])]),_:1}),a(H,{validated:t(o),onClick:i},{default:c(()=>[k(U(t(_)?"Créer":"Enregistrer"),1)]),_:1},8,["validated"])])]),_:1})):M("",!0)]),_:1},8,["sideModal"]),a(W,{modelValue:t($),"onUpdate:modelValue":d[3]||(d[3]=L=>X($)?$.value=L:null),size:"md",persistent:t(p),onClose:B},{header:c(()=>[e("div",dl,[e("div",cl,[a(s,{name:"lucide:triangle-alert",size:"28",class:"text-red-600 dark:text-red-400"})]),d[9]||(d[9]=e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white"},"Supprimer une catégorie",-1))])]),default:c(()=>[e("p",ul,[d[10]||(d[10]=k(" Êtes-vous sûr de vouloir supprimer la catégorie ",-1)),e("span",pl,"« "+U(t(r)?.name||"")+" »",1),d[11]||(d[11]=k(" ? Cette action est irréversible. ",-1))])]),footer:c(()=>[e("div",ml,[a(H,{theme:"cancel",type:"button",validated:!t(p),onClick:d[2]||(d[2]=L=>$.value=!1)},{default:c(()=>[...d[12]||(d[12]=[k("Annuler",-1)])]),_:1},8,["validated"]),a(H,{theme:"delete",type:"button",loading:t(p),onClick:q},{default:c(()=>[...d[13]||(d[13]=[k("Supprimer",-1)])]),_:1},8,["loading"])])]),_:1},8,["modelValue","persistent"])])}}},gl={class:"flex flex-col w-full h-full gap-6"},xl={class:"bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"},yl={class:"flex items-center gap-2 mb-4"},hl={class:"flex flex-col sm:flex-row gap-3"},_l={class:"flex-1"},bl={key:0,class:"text-sm text-gray-400 dark:text-gray-500 mt-2 italic"},vl={class:"bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"},kl={class:"flex items-center gap-2 mb-4"},wl={class:"flex flex-col sm:flex-row gap-3"},$l={class:"flex-1"},Cl={key:0,class:"text-sm text-gray-400 dark:text-gray-500 mt-2 italic"},Vl={class:"bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-red-200 dark:border-red-900/30"},Sl={class:"flex items-center gap-2 mb-4"},Al={class:"flex flex-col sm:flex-row gap-3"},Tl={class:"flex-1"},Pl={key:0,class:"text-sm text-gray-400 dark:text-gray-500 mt-2 italic"},Ul={__name:"ParametresChantiers",setup(I){const{getChantiers:v,getChantiersEtat2:w,getChantiersEtat1:T,getChantiersEtat0:D,getChantiersTermines:m,passerChantier:A,terminerChantier:z,supprimerChantier:u}=He(),{setLoader:n}=de(),f=C(null),_=C(null),g=C(null),$=y=>{if(!y)return"";const i=[];return y.compte&&i.push(y.compte),y.name&&i.push(y.name),y.ligne&&i.push(y.ligne),i.length>0?i.join(" - "):`Chantier #${y.id}`},r=R(()=>w.value.map(y=>({id:y.id,label:$(y)}))),p=R(()=>{const y=D.value.map(N=>({id:N.id,label:`[RLT] ${$(N)}`})),i=T.value.map(N=>({id:N.id,label:`[Externe] ${$(N)}`}));return[...y,...i]}),P=R(()=>m.value.map(y=>({id:y.id,label:$(y)}))),o=async()=>{if(f.value){n(!0);try{await A(f.value),f.value=null}finally{n(!1)}}},O=async()=>{if(_.value){n(!0);try{await z(_.value),_.value=null}finally{n(!1)}}},F=async()=>{if(g.value){n(!0);try{await u(g.value),g.value=null}finally{n(!1)}}};return ke(async()=>{n(!0);try{await v()}finally{n(!1)}}),(y,i)=>{const N=ie,q=ce,B=fe,j=ue;return x(),S("div",gl,[a(N,{title:"Paramètres Chantiers",description:"Gestion des chantiers"}),e("div",xl,[e("div",yl,[a(q,{name:"lucide:arrow-right-circle",class:"w-5 h-5 text-primary-500"}),i[3]||(i[3]=e("h3",{class:"text-lg font-semibold text-gray-800 dark:text-gray-200"},"Passer un chantier au RLT",-1))]),i[5]||(i[5]=e("p",{class:"text-sm text-gray-500 dark:text-gray-400 mb-4"}," Sélectionnez un chantier en cours (Pré-op) pour le passer au statut RLT. ",-1)),e("div",hl,[e("div",_l,[a(B,{modelValue:t(f),"onUpdate:modelValue":i[0]||(i[0]=d=>X(f)?f.value=d:null),options:t(r),placeholder:"Sélectionner un chantier en cours...",nullable:""},null,8,["modelValue","options"])]),a(j,{validated:!!t(f),theme:"primary",type:"button",onClick:o},{default:c(()=>[...i[4]||(i[4]=[k("Passer au RLT",-1)])]),_:1},8,["validated"])]),t(r).length===0?(x(),S("p",bl," Aucun chantier en cours disponible. ")):M("",!0)]),e("div",vl,[e("div",kl,[a(q,{name:"lucide:check-circle",class:"w-5 h-5 text-green-500"}),i[6]||(i[6]=e("h3",{class:"text-lg font-semibold text-gray-800 dark:text-gray-200"},"Terminer un chantier",-1))]),i[8]||(i[8]=e("p",{class:"text-sm text-gray-500 dark:text-gray-400 mb-4"}," Sélectionnez un chantier RLT ou externe pour le marquer comme terminé. ",-1)),e("div",wl,[e("div",$l,[a(B,{modelValue:t(_),"onUpdate:modelValue":i[1]||(i[1]=d=>X(_)?_.value=d:null),options:t(p),placeholder:"Sélectionner un chantier RLT ou externe...",nullable:""},null,8,["modelValue","options"])]),a(j,{validated:!!t(_),theme:"secondary",type:"button",onClick:O},{default:c(()=>[...i[7]||(i[7]=[k("Terminer",-1)])]),_:1},8,["validated"])]),t(p).length===0?(x(),S("p",Cl," Aucun chantier RLT ou externe disponible. ")):M("",!0)]),e("div",Vl,[e("div",Sl,[a(q,{name:"lucide:trash-2",class:"w-5 h-5 text-red-500"}),i[9]||(i[9]=e("h3",{class:"text-lg font-semibold text-gray-800 dark:text-gray-200"},"Supprimer un chantier",-1))]),i[11]||(i[11]=e("p",{class:"text-sm text-gray-500 dark:text-gray-400 mb-4"}," Sélectionnez un chantier terminé pour le supprimer définitivement. ",-1)),e("div",Al,[e("div",Tl,[a(B,{modelValue:t(g),"onUpdate:modelValue":i[2]||(i[2]=d=>X(g)?g.value=d:null),options:t(P),placeholder:"Sélectionner un chantier terminé...",nullable:""},null,8,["modelValue","options"])]),a(j,{validated:!!t(g),theme:"delete",type:"button",onClick:F},{default:c(()=>[...i[10]||(i[10]=[k("Supprimer",-1)])]),_:1},8,["validated"])]),t(P).length===0?(x(),S("p",Pl," Aucun chantier terminé disponible. ")):M("",!0)])])}}},zl={class:"flex flex-col w-full h-full gap-4"},Ll={class:"flex flex-col lg:flex-row gap-4 items-center w-full justify-between"},Ml={class:"flex items-center gap-2"},Dl={class:"flex flex-col w-full h-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"},jl={class:"overflow-x-auto"},Rl={class:"w-full text-sm"},El={class:"divide-y divide-gray-100 dark:divide-gray-800"},Nl=["onClick"],Il={class:"px-4 py-3"},Ol={class:"flex flex-col"},Fl={class:"font-medium text-gray-900 dark:text-white"},ql={class:"text-xs text-gray-500 dark:text-gray-400"},Bl={class:"px-4 py-3 text-gray-700 dark:text-gray-300"},Hl={class:"px-4 py-3 text-center"},Gl={class:"px-4 py-3 text-center"},Jl={class:"px-4 py-3 text-center"},Xl={key:0},Wl={colspan:"5",class:"px-4 py-8 text-center text-gray-500 dark:text-gray-400"},Yl={class:"text-center"},Kl={class:"w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"},Ql={class:"text-sm text-gray-500 dark:text-gray-400 mt-1"},Zl={class:"grid grid-cols-1 md:grid-cols-2 gap-4"},ea={class:"flex flex-col gap-4 pt-2"},ta={class:"flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"},la={class:"text-center"},aa={class:"w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"},sa={class:"grid grid-cols-1 md:grid-cols-2 gap-4"},ra={class:"flex flex-col gap-4 pt-2"},oa={class:"p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"},na={class:"flex items-start gap-2"},ia={class:"flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"},da={__name:"ParametresUtilisateurs",async setup(I){let v,w;const{getAllUsers:T,updateUser:D,createUser:m,users:A}=we(),{getAllProfilTache:z,profilTaches:u}=Ae(),{setLoader:n}=de(),{isSuperAdmin:f}=Ve(),_=C(""),g=C(!1),$=C(!1),r=C({}),p=C({email:"",nom:"",prenom:"",profils:-1,role:0,pre_op:!1,ref_du_rdu:!1}),P=R(()=>{const V=[{id:0,label:"Aucun"},{id:1,label:"Admin"}];return f.value&&V.push({id:2,label:"SuperAdmin"}),V}),o=R(()=>{if(!_.value)return A.value;const V=_.value.toLowerCase();return A.value.filter(s=>s.nom?.toLowerCase().includes(V)||s.prenom?.toLowerCase().includes(V)||s.email?.toLowerCase().includes(V)||s.profil_name?.toLowerCase().includes(V))}),O=V=>{switch(V){case 2:return"SuperAdmin";case 1:return"Admin";default:return"Aucun"}},F=V=>{switch(V){case 2:return"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";case 1:return"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";default:return"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}},y=R(()=>!0),i=R(()=>p.value.email&&p.value.email.includes("@")),N=V=>{V&&(r.value={...V,role:V.role??0,pre_op:V.pre_op??!1,ref_du_rdu:V.ref_du_rdu??!1},g.value=!0)},q=()=>{g.value=!1,r.value={}},B=async()=>{n(!0);try{await D(r.value),q()}finally{n(!1)}},j=()=>{p.value={email:"",nom:"",prenom:"",profils:-1,role:0,pre_op:!1,ref_du_rdu:!1},$.value=!0},d=()=>{$.value=!1,p.value={email:"",nom:"",prenom:"",profils:-1,role:0,pre_op:!1,ref_du_rdu:!1}},ee=async()=>{n(!0);try{await m(p.value)&&d()}finally{n(!1)}};n(!0);try{[v,w]=me(()=>Promise.all([T(),z()])),await v,w()}finally{n(!1)}return(V,s)=>{const H=ie,le=pe,E=ce,G=ue,W=ge,L=fe,Y=Ce,ae=xe,b=ye;return x(),S("div",zl,[a(H,{title:"Paramètres Utilisateurs",description:"Gestion des utilisateurs et de leurs permissions"}),e("div",Ll,[a(le,{modelValue:t(_),"onUpdate:modelValue":s[0]||(s[0]=l=>X(_)?_.value=l:null),class:"w-full max-w-md",size:"lg",placeholder:"Rechercher un utilisateur ..."},null,8,["modelValue"]),a(G,{theme:"primary",onClick:j},{default:c(()=>[e("span",Ml,[a(E,{name:"lucide:user-plus",size:"18"}),s[14]||(s[14]=k(" Ajouter un utilisateur ",-1))])]),_:1})]),e("div",Dl,[e("div",jl,[e("table",Rl,[s[16]||(s[16]=e("thead",{class:"bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"},[e("tr",null,[e("th",{class:"px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"},"Utilisateur"),e("th",{class:"px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"},"Profil"),e("th",{class:"px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200"},"Rôle"),e("th",{class:"px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200"},"Pré-Op"),e("th",{class:"px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200"},"RDU")])],-1)),e("tbody",El,[(x(!0),S(oe,null,ne(t(o),l=>(x(),S("tr",{key:l.id,class:"hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors",onClick:Z=>N(l)},[e("td",Il,[e("div",Ol,[e("span",Fl,U(l.nom||"—")+" "+U(l.prenom||""),1),e("span",ql,U(l.email||"—"),1)])]),e("td",Bl,U(l.profil_name||"—"),1),e("td",Hl,[e("span",{class:re(["inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",F(l.role)])},U(O(l.role)),3)]),e("td",Gl,[a(E,{name:l.pre_op?"lucide:check-circle":"lucide:x-circle",class:re(l.pre_op?"text-green-500":"text-gray-300 dark:text-gray-600"),size:"18"},null,8,["name","class"])]),e("td",Jl,[a(E,{name:l.ref_du_rdu?"lucide:check-circle":"lucide:x-circle",class:re(l.ref_du_rdu?"text-green-500":"text-gray-300 dark:text-gray-600"),size:"18"},null,8,["name","class"])])],8,Nl))),128)),t(o).length===0?(x(),S("tr",Xl,[e("td",Wl,[a(E,{name:"lucide:users",class:"w-8 h-8 mx-auto mb-2 opacity-50"}),s[15]||(s[15]=e("p",null,"Aucun utilisateur trouvé",-1))])])):M("",!0)])])])]),a(b,{sideModal:t(g),closeSideModal:q},{default:c(()=>[t(g)?(x(),J(ae,{key:0,closeSideModal:q},{header:c(()=>[e("div",Yl,[e("div",Kl,[a(E,{name:"lucide:user-cog",size:"28",class:"text-primary-500"})]),s[17]||(s[17]=e("h2",{class:"text-xl font-semibold text-gray-900 dark:text-white"},"Modifier l'utilisateur",-1)),e("p",Ql,U(t(r).email),1)])]),default:c(()=>[e("form",{onSubmit:Q(B,["prevent"]),class:"flex flex-col gap-5 w-full"},[e("div",Zl,[a(W,{name:"nom",title:"Nom",placeholder:"Nom de l'utilisateur",modelValue:t(r).nom,"onUpdate:modelValue":s[1]||(s[1]=l=>t(r).nom=l)},null,8,["modelValue"]),a(W,{name:"prenom",title:"Prénom",placeholder:"Prénom de l'utilisateur",modelValue:t(r).prenom,"onUpdate:modelValue":s[2]||(s[2]=l=>t(r).prenom=l)},null,8,["modelValue"])]),a(L,{name:"profil",title:"Profil",modelValue:t(r).profils,"onUpdate:modelValue":s[3]||(s[3]=l=>t(r).profils=l),options:t(u),placeholder:"Aucun profil"},null,8,["modelValue","options"]),a(L,{name:"role",title:"Rôle",modelValue:t(r).role,"onUpdate:modelValue":s[4]||(s[4]=l=>t(r).role=l),options:t(P)},null,8,["modelValue","options"]),e("div",ea,[a(Y,{modelValue:t(r).pre_op,"onUpdate:modelValue":s[5]||(s[5]=l=>t(r).pre_op=l),name:"pre_op",label:"Pré-Op"},null,8,["modelValue"]),a(Y,{modelValue:t(r).ref_du_rdu,"onUpdate:modelValue":s[6]||(s[6]=l=>t(r).ref_du_rdu=l),name:"ref_du_rdu",label:"Référent du RDU"},null,8,["modelValue"])])],32)]),footer:c(()=>[e("div",ta,[a(G,{theme:"cancel",type:"button",onClick:q},{default:c(()=>[...s[18]||(s[18]=[k("Annuler",-1)])]),_:1}),a(G,{validated:t(y),onClick:B},{default:c(()=>[...s[19]||(s[19]=[k("Enregistrer",-1)])]),_:1},8,["validated"])])]),_:1})):M("",!0)]),_:1},8,["sideModal"]),a(b,{sideModal:t($),closeSideModal:d},{default:c(()=>[t($)?(x(),J(ae,{key:0,closeSideModal:d},{header:c(()=>[e("div",la,[e("div",aa,[a(E,{name:"lucide:user-plus",size:"28",class:"text-green-500"})]),s[20]||(s[20]=e("h2",{class:"text-xl font-semibold text-gray-900 dark:text-white"},"Ajouter un utilisateur",-1)),s[21]||(s[21]=e("p",{class:"text-sm text-gray-500 dark:text-gray-400 mt-1"},"L'utilisateur pourra se connecter avec son compte SNCF",-1))])]),default:c(()=>[e("form",{onSubmit:Q(ee,["prevent"]),class:"flex flex-col gap-5 w-full"},[a(W,{name:"email",title:"Email SNCF",placeholder:"prenom.nom@sncf.fr",modelValue:t(p).email,"onUpdate:modelValue":s[7]||(s[7]=l=>t(p).email=l),required:""},null,8,["modelValue"]),e("div",sa,[a(W,{name:"nom",title:"Nom",placeholder:"Nom de l'utilisateur",modelValue:t(p).nom,"onUpdate:modelValue":s[8]||(s[8]=l=>t(p).nom=l)},null,8,["modelValue"]),a(W,{name:"prenom",title:"Prénom",placeholder:"Prénom de l'utilisateur",modelValue:t(p).prenom,"onUpdate:modelValue":s[9]||(s[9]=l=>t(p).prenom=l)},null,8,["modelValue"])]),a(L,{name:"profil",title:"Profil",modelValue:t(p).profils,"onUpdate:modelValue":s[10]||(s[10]=l=>t(p).profils=l),options:t(u),placeholder:"Aucun profil"},null,8,["modelValue","options"]),a(L,{name:"role",title:"Rôle",modelValue:t(p).role,"onUpdate:modelValue":s[11]||(s[11]=l=>t(p).role=l),options:t(P)},null,8,["modelValue","options"]),e("div",ra,[a(Y,{modelValue:t(p).pre_op,"onUpdate:modelValue":s[12]||(s[12]=l=>t(p).pre_op=l),name:"new_pre_op",label:"Pré-Op"},null,8,["modelValue"]),a(Y,{modelValue:t(p).ref_du_rdu,"onUpdate:modelValue":s[13]||(s[13]=l=>t(p).ref_du_rdu=l),name:"new_ref_du_rdu",label:"Référent du RDU"},null,8,["modelValue"])]),e("div",oa,[e("div",na,[a(E,{name:"lucide:info",size:"16",class:"text-blue-500 mt-0.5"}),s[22]||(s[22]=e("p",{class:"text-xs text-blue-700 dark:text-blue-300"}," L'utilisateur sera automatiquement lié à son compte lors de sa première connexion via OIDC SNCF. ",-1))])])],32)]),footer:c(()=>[e("div",ia,[a(G,{theme:"cancel",type:"button",onClick:d},{default:c(()=>[...s[23]||(s[23]=[k("Annuler",-1)])]),_:1}),a(G,{validated:t(i),onClick:ee},{default:c(()=>[...s[24]||(s[24]=[k("Créer l'utilisateur",-1)])]),_:1},8,["validated"])])]),_:1})):M("",!0)]),_:1},8,["sideModal"])])}}},ca={key:4,class:"flex items-center justify-center min-h-[400px]"},$a={__name:"parametres",setup(I){Ie({title:"H00 - Paramètres",description:"Paramètres de l'application"});const{isSuperAdmin:v}=Ve(),{getAllUsers:w,users:T}=we();ke(async()=>{await w()});const D=R(()=>T.value?.length||0),m=C(1),A=R(()=>[{label:"Tâches",icon:"i-lucide-clipboard-list",value:1,requiresSuperAdmin:!0},{label:"Catégories",icon:"i-lucide-folder-tree",value:2,requiresSuperAdmin:!0},{label:"Chantiers",icon:"i-lucide-building-2",value:3,requiresSuperAdmin:!1},{label:"Utilisateurs",icon:"i-lucide-users",value:4,badge:D.value>0?D.value.toString():void 0,requiresSuperAdmin:!1}].filter(u=>u.requiresSuperAdmin?v.value:!0));return Oe(A,z=>{const u=z.map(n=>n.value);u.includes(m.value)||(m.value=u[0]||1)},{immediate:!0}),(z,u)=>{const n=Re,f=Nt,_=fl,g=Ul,$=da,r=Fe;return x(),J(r,null,{sidebar:c(()=>[a(n,{modelValue:t(m),"onUpdate:modelValue":u[0]||(u[0]=p=>X(m)?m.value=p:null),items:t(A),title:"Sommaire"},null,8,["modelValue","items"])]),default:c(()=>[t(m)===1&&t(v)?(x(),J(f,{key:0})):M("",!0),t(m)===2&&t(v)?(x(),J(_,{key:1})):M("",!0),t(m)===3?(x(),J(g,{key:2})):M("",!0),t(m)===4?(x(),J($,{key:3})):M("",!0),(t(m)===1||t(m)===2)&&!t(v)?(x(),S("div",ca,[...u[1]||(u[1]=[e("div",{class:"text-center space-y-4"},[e("div",{class:"text-4xl"},"🔒"),e("h2",{class:"text-xl font-semibold"},"Accès restreint"),e("p",{class:"text-muted"},"Vous devez être super administrateur pour accéder à cette section.")],-1)])])):M("",!0)]),_:1})}}};export{$a as default};
