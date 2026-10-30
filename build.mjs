// Génère le site public statique (pages indexables) à partir des livres publiés dans Supabase.
import fs from 'node:fs';import path from 'node:path';
const cfg=fs.existsSync('config.js')?fs.readFileSync('config.js','utf8'):'';
const pick=k=>process.env[k]||(cfg.match(new RegExp(k+':\\s*"([^"]*)"'))||[])[1]||'';
const SB=pick('SUPABASE_URL').replace(/\/$/,''),KEY=pick('SUPABASE_ANON_KEY');
const SITE=(process.env.SITE_URL||process.env.URL||'https://meoart.netlify.app').replace(/\/$/,'');
const OUT='dist',TODAY=new Date().toISOString().slice(0,10);
const KINDS={roman:'Roman',nouvelle:'Nouvelle',poeme:'Poème',pensee:'Pensée'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x';
const jl=o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`;
const js=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const words=t=>(String(t).trim().match(/\S+/g)||[]).length;
const fdate=d=>d?new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'';
const w=(p,t)=>{const f=path.join(OUT,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
async function load(){
  if(process.env.MEO_FIXTURE)return JSON.parse(fs.readFileSync(process.env.MEO_FIXTURE,'utf8'));
  if(process.argv.includes('--empty')||!SB||!KEY){console.warn('Aucune donnée : bibliothèque vide.');return[]}
  const r=await fetch(SB+'/rest/v1/published_books?published=eq.true&select=*&order=published_at.asc',{headers:{apikey:KEY}});
  if(!r.ok)throw new Error('Supabase '+r.status+' '+await r.text()); // échec = le déploiement précédent reste en ligne
  return r.json();
}
const books=await load();
function vid(url){let m;
  if(m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{11})/))return{t:'yt',src:`https://www.youtube-nocookie.com/embed/${m[1]}`};
  if(m=url.match(/tiktok\.com\/.*\/video\/(\d+)/))return{t:'tt',src:`https://www.tiktok.com/embed/v2/${m[1]}`};
  return null}
const vsrc=books.slice().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).map(b=>b.data&&b.data.videos).find(Boolean)||'';
const vs=vsrc.split(/\n+/).map(l=>{const [t,...u]=l.split('|');const url=(u.length?u.join('|'):t).trim();return{title:u.length?t.trim():'',url,v:vid(url)}}).filter(x=>/^https?:\/\//.test(x.url));
const NEWS=!!(SB&&KEY),CONTACT=process.env.CONTACT_EMAIL||'';
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
for(const f of ['sw.js','config.js','manifest.webmanifest','icon-192.png','icon-512.png','bm.js','pub.css','reader.js'])fs.copyFileSync(f,path.join(OUT,f));
w('ecrire/index.html',fs.readFileSync(fs.existsSync('app.html')?'app.html':'ecrire/index.html','utf8'));
const page=({t,d,u,body,ld='',img,type='website',noindex,back})=>`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)}</title><meta name="description" content="${esc(d)}"><link rel="canonical" href="${SITE}${u}"><meta name="robots" content="${noindex?'noindex':'index,follow'}"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}"><meta property="og:type" content="${type}"><meta property="og:url" content="${SITE}${u}">${img?`<meta property="og:image" content="${SITE}${img}">`:''}<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#07070b"><link rel="icon" href="/icon-192.png"><link rel="stylesheet" href="/pub.css"><script>try{var t=localStorage.getItem('meo-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add('js')</script><script src="/reader.js" defer></script>${process.env.GOOGLE_VERIFY?`<meta name="google-site-verification" content="${esc(process.env.GOOGLE_VERIFY)}">`:''}${process.env.BING_VERIFY?`<meta name="msvalidate.01" content="${esc(process.env.BING_VERIFY)}">`:''}${ld}</head><body${back?` data-back="${esc(back)}"`:''}><nav><a class="brand" href="/">MEOART</a><div class="links"><a href="/#oeuvres">Œuvres</a><a href="/#recents">Derniers textes</a><a href="/#apropos">À propos</a>${vs.length?'<a href="/#videos">Vidéos</a>':''}${NEWS?'<a href="/#newsletter">Newsletter</a>':''}</div><div class="right"></div></nav>${body}<footer class="serif">MEOART · © ${new Date().getFullYear()} Tous droits réservés · <a href="/ecrire/" rel="nofollow">Espace auteur</a></footer><script>if(window.IntersectionObserver){var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting)x.target.classList.add('in')})},{threshold:.12});[].forEach.call(document.querySelectorAll('.reveal'),function(el){io.observe(el)})}else{[].forEach.call(document.querySelectorAll('.reveal'),function(el){el.classList.add('in')})}</script></body></html>`;
const urls=[{u:'/',m:TODAY}],authors={},recents=[];
const card=b=>`<div class="item reveal" data-c="${b.kind}"><a href="${b.bu}"><div class="cover">${b.cover?`<img src="${b.cover}" alt="Couverture de ${esc(b.title)}" loading="lazy">`:`<span class="ct">${esc(b.title)}</span>`}</div></a><span class="badge">${KINDS[b.kind]}</span><h3><a href="${b.bu}">${esc(b.title)}</a></h3><p>${esc((b.summary||'').replace(/\s+/g,' ').slice(0,110))}</p><a class="btn ghost sm" href="${b.bu}">Lire</a></div>`;
for(const b of books){
  const bs=b.slug,bu=`/livre/${bs}/`,chs=[];let n=0;
  const kind=KINDS[b.data&&b.data.kind]?b.data.kind:'roman';
  (b.data.seasons||[]).forEach(s=>(s.chapters||[]).forEach(c=>{n++;chs.push({n,season:s.title,title:c.title,text:c.text||'',slug:`${n}-${slug(c.title)}`})}));
  const cover=b.cover_b64&&b.cover_b64.startsWith('data:image')?`/covers/${bs}.jpg`:null;
  if(cover)w(cover.slice(1),Buffer.from(b.cover_b64.split(',')[1],'base64'));
  const A=authors[b.author_slug]||(authors[b.author_slug]={name:b.author_name,real:b.real_name,bio:b.bio,books:[]});
  A.real=A.real||b.real_name;A.bio=A.bio||b.bio;const B={...b,kind,cover,bu};A.books.push(B);
  chs.forEach(c=>recents.push({b:B,c,date:b.updated_at||b.published_at,cu:`${bu}${c.slug}/`}));
  const au=`/auteur/${b.author_slug}/`,person={'@type':'Person',name:b.author_name,url:SITE+au};
  const desc=(b.summary||`${b.title}, ${KINDS[kind].toLowerCase()} de ${b.author_name}, à lire en ligne sur MEOART.`).replace(/\s+/g,' ').slice(0,160);
  const mod=(b.updated_at||'').slice(0,10)||TODAY;
  let last='';
  const list=chs.map(c=>{let h='';if(c.season!==last){last=c.season;h=`</ul><h3 style="margin-top:1.6rem">${esc(c.season)}</h3><ul class="ch">`}return h+`<li><a href="${bu}${c.slug}/">${esc(c.title)}</a> <span class="m">· ${Math.max(1,Math.round(words(c.text)/200))} min</span></li>`}).join('');
  w(bu.slice(1)+'index.html',page({t:`${b.title} — ${b.author_name} | MEOART`,d:desc,u:bu,img:cover,type:'book',back:'/',
    ld:jl({'@context':'https://schema.org','@type':'Book',name:b.title,genre:KINDS[kind],author:person,inLanguage:'fr',url:SITE+bu,description:desc,image:cover?SITE+cover:undefined,datePublished:b.published_at,dateModified:b.updated_at,hasPart:chs.map(c=>({'@type':'Chapter',name:c.title,position:c.n,url:`${SITE}${bu}${c.slug}/`}))}),
    body:`<main class="wrap"><div class="bookhead"><div class="cover">${cover?`<img src="${cover}" alt="Couverture de ${esc(b.title)}">`:`<span class="ct">${esc(b.title)}</span>`}</div><div><span class="badge">${KINDS[kind]}</span><h1>${esc(b.title)}</h1><p class="by">par <a href="${au}" style="color:var(--acc)">${esc(b.author_name)}</a></p>${(b.summary||'').split(/\n+/).filter(Boolean).map(x=>`<p style="margin-bottom:.8rem">${esc(x)}</p>`).join('')}${chs[0]?`<div class="actions" style="margin-top:18px"><a class="btn" href="${bu}${chs[0].slug}/">Commencer la lecture</a></div>`:''}<p class="m" style="margin-top:14px">Publié le ${fdate(b.published_at)} · mis à jour le ${fdate(b.updated_at)}</p></div></div><h2 style="margin-top:2.4rem">Chapitres</h2><ul class="ch">${list}</ul></main><script src="/bm.js"></script><script>MEOBM.init(${js(bs)},{pub:true})</script>`}));
  urls.push({u:bu,m:mod});
  chs.forEach((c,i)=>{const cu=`${bu}${c.slug}/`,pv=chs[i-1],nx=chs[i+1],cd=(c.text.replace(/\s+/g,' ').slice(0,155))||`${c.title} — ${b.title}`;
    w(cu.slice(1)+'index.html',page({t:`${c.title} — ${b.title} (${b.author_name}) | MEOART`,d:cd,u:cu,img:cover,type:'article',back:bu,
      ld:jl({'@context':'https://schema.org','@type':'Chapter',name:c.title,position:c.n,inLanguage:'fr',url:SITE+cu,author:person,isPartOf:{'@type':'Book',name:b.title,url:SITE+bu,author:person}}),
      body:`<main class="wrap"><p class="m"><a href="${bu}" style="color:var(--acc)">← ${esc(b.title)}</a> · ${esc(c.season)}</p><h1 style="font-size:clamp(30px,6vw,52px);margin:10px 0 24px">${esc(c.title)}</h1><div class="reader"><article data-title="${esc(c.title)}" data-book="${esc(b.title)}" data-author="${esc(b.author_name)}"${cover?` data-cover="${cover}"`:''}>${c.text.split(/\n+/).filter(x=>x.trim()).map((x,k)=>`<p id="p${k}" data-c="${c.slug}" data-p="${k}">${esc(x)}</p>`).join('')}</article></div><div class="nv">${pv?`<a class="btn ghost sm" rel="prev" href="${bu}${pv.slug}/">← ${esc(pv.title)}</a>`:'<span></span>'}${nx?`<a class="btn sm" rel="next" href="${bu}${nx.slug}/">${esc(nx.title)} →</a>`:`<a class="btn sm" href="${bu}">Retour au livre</a>`}</div></main><script src="/bm.js"></script><script>MEOBM.init(${js(bs)},{pub:true,title:${js(c.title)}})</script>`}));
    urls.push({u:cu,m:mod})});
}
for(const [as,A] of Object.entries(authors)){const au=`/auteur/${as}/`,d=(A.bio||`Œuvres de ${A.name} publiées sur MEOART.`).replace(/\s+/g,' ').slice(0,160);
  w(au.slice(1)+'index.html',page({t:`${A.name} — auteur | MEOART`,d,u:au,type:'profile',back:'/',
    ld:jl({'@context':'https://schema.org','@type':'Person',name:A.name,alternateName:A.real||undefined,description:A.bio||undefined,url:SITE+au,mainEntityOf:A.books.map(b=>({'@type':'Book',name:b.title,url:SITE+b.bu}))}),
    body:`<main class="wrap"><span class="tag">Auteur</span><h1>${esc(A.name)}</h1>${A.real?`<p class="by" style="margin-top:10px">De son vrai nom : ${esc(A.real)}</p>`:''}<div style="max-width:640px;margin-top:18px">${(A.bio||'').split(/\n+/).filter(Boolean).map(x=>`<p style="margin-bottom:.8rem;color:var(--mut)">${esc(x)}</p>`).join('')}</div><h2 style="margin-top:2.4rem">Bibliographie</h2><div class="books">${A.books.map(card).join('')}</div></main>`}));
  urls.push({u:au,m:TODAY})}
const all=Object.values(authors).flatMap(a=>a.books),AL=Object.entries(authors),kinds=[...new Set(all.map(b=>b.kind))];
const solo=AL.length===1?AL[0][1]:null,first=all[all.length-1];
recents.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const vsection=vs.length?`<section id="videos" class="reveal"><span class="tag">Vidéos</span><h2>Voir et écouter.</h2><div class="vids">${vs.map(x=>x.v?`<div class="vid ${x.v.t}"><iframe src="${esc(x.v.src)}" title="${esc(x.title||'Vidéo')}" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>${x.title?`<p class="m">${esc(x.title)}</p>`:''}</div>`:`<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener nofollow">▶ ${esc(x.title||x.url)}</a>`).join('')}</div></section>`:'';
const nsection=NEWS?`<section id="newsletter" class="news reveal"><span class="tag">Newsletter</span><h2>Reçois les nouveaux textes en premier.</h2><p class="lead" style="margin:auto">Un e-mail quand une œuvre est publiée. Pas de spam, aucun compte à créer.</p><form id="nf"><input type="email" id="ne" placeholder="ton@email.com" required maxlength="254" autocomplete="email" aria-label="Adresse e-mail"><input type="text" id="nh" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="btn">Je m’abonne</button></form><p class="m" id="nm"></p><p class="m">En t’abonnant, tu acceptes de recevoir un e-mail à chaque nouvelle publication. ${CONTACT?`Désinscription : écris à ${esc(CONTACT)}.`:'Désinscription possible à tout moment sur simple demande.'}</p></section><script>(function(){var f=document.getElementById('nf');if(!f)return;f.onsubmit=function(e){e.preventDefault();var m=document.getElementById('nm');if(document.getElementById('nh').value)return;var em=document.getElementById('ne').value.trim().toLowerCase();m.textContent='Envoi…';fetch(${js(SB)}+'/rest/v1/subscribers',{method:'POST',headers:{apikey:${js(KEY)},'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({email:em})}).then(function(r){if(r.ok||r.status===409){f.style.display='none';m.textContent='Merci, c’est noté !'}else m.textContent='Impossible pour le moment, réessaie plus tard.'}).catch(function(){m.textContent='Connexion impossible, réessaie plus tard.'})}})()</script>`:'';
w('index.html',page({t:solo?`${solo.name} — romans et textes à lire en ligne | MEOART`:'MEOART — Bibliothèque littéraire',d:solo&&solo.bio?solo.bio.replace(/\s+/g,' ').slice(0,160):'Romans, nouvelles, poèmes et textes à lire en ligne gratuitement sur MEOART.',u:'/',
  ld:jl({'@context':'https://schema.org','@type':'WebSite',name:'MEOART',url:SITE+'/'}),
  body:`<header class="hero"><span class="tag">${kinds.length?kinds.map(k=>KINDS[k]+'s').join(' · '):'Bibliothèque littéraire'}</span><h1>${esc(solo?solo.name:'MEOART')}</h1><p class="lead">${esc(solo&&solo.bio?solo.bio.replace(/\s+/g,' ').slice(0,180):'Romans, nouvelles, poèmes et textes à lire en ligne.')}</p><div class="actions">${first?`<a class="btn" href="${first.bu}">Lire</a>`:''}<a class="btn ghost" href="#oeuvres">Voir les œuvres</a></div></header>
  <section id="oeuvres" class="reveal"><span class="tag">Les œuvres</span><h2>Tout ce qui est publié.</h2>${kinds.length>1?`<div class="filters" id="filters"><button class="chip on" data-f="all">Tout</button>${kinds.map(k=>`<button class="chip" data-f="${k}">${KINDS[k]}s</button>`).join('')}</div>`:''}${all.length?`<div class="books">${all.slice().reverse().map(card).join('')}</div>`:'<p class="m">Les premières œuvres arrivent bientôt.</p>'}</section>
  ${recents.length?`<section id="recents" class="reveal"><span class="tag">Derniers textes</span><h2>Fraîchement publiés.</h2><div class="list">${recents.slice(0,6).map(r=>`<div class="row"><div><h3>${esc(r.c.title)}</h3><small>${esc(r.b.title)} · ${KINDS[r.b.kind]} · ${fdate(r.date)} · ${Math.max(1,Math.round(words(r.c.text)/200))} min de lecture</small></div><a class="btn ghost sm" href="${r.cu}">Lire</a></div>`).join('')}</div></section>`:''}
  ${AL.length?`<section id="apropos" class="reveal"><span class="tag">À propos</span>${AL.map(([s,A])=>`<h2>${esc(A.name)}</h2>${A.real?`<p class="m">De son vrai nom : ${esc(A.real)}</p>`:''}<div style="max-width:640px">${(A.bio||'').split(/\n+/).filter(Boolean).map(x=>`<p style="margin:.6rem 0;color:var(--mut)">${esc(x)}</p>`).join('')}</div><p style="margin-top:1rem"><a class="btn ghost sm" href="/auteur/${s}/">Page de l’auteur</a></p>`).join('')}</section>`:''}
  ${vsection}${nsection}<script>(function(){var f=document.getElementById('filters');if(!f)return;f.onclick=function(e){var k=e.target.dataset.f;if(!k)return;[].forEach.call(f.children,function(c){c.classList.toggle('on',c===e.target)});[].forEach.call(document.querySelectorAll('.books .item'),function(i){i.style.display=(k==='all'||i.dataset.c===k)?'':'none'})}})()</script>`}));
w('404.html',page({t:'Page introuvable | MEOART',d:'Page introuvable',u:'/404.html',noindex:true,body:'<main class="wrap"><h1>Page introuvable</h1><p style="margin-top:1rem"><a class="btn" href="/">Retour à la bibliothèque</a></p></main>'}));
w('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
w('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x=>`<url><loc>${SITE}${x.u}</loc><lastmod>${x.m}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`OK : ${books.length} livre(s), ${urls.length} URL(s).`);
