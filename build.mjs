// Génère le site public statique (pages indexables par Google/Bing) à partir des livres publiés dans Supabase.
import fs from 'node:fs';import path from 'node:path';
const cfg=fs.existsSync('config.js')?fs.readFileSync('config.js','utf8'):'';
const pick=k=>process.env[k]||(cfg.match(new RegExp(k+':\\s*"([^"]*)"'))||[])[1]||'';
const SB=pick('SUPABASE_URL').replace(/\/$/,''),KEY=pick('SUPABASE_ANON_KEY');
const SITE=(process.env.SITE_URL||process.env.URL||'https://meoart.netlify.app').replace(/\/$/,'');
const OUT='dist',TODAY=new Date().toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x';
const jl=o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`;
const js=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const w=(p,t)=>{const f=path.join(OUT,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
async function load(){
  if(process.env.MEO_FIXTURE)return JSON.parse(fs.readFileSync(process.env.MEO_FIXTURE,'utf8'));
  if(process.argv.includes('--empty')||!SB||!KEY){console.warn('Aucune donnée : bibliothèque vide.');return[]}
  const r=await fetch(SB+'/rest/v1/published_books?published=eq.true&select=*&order=published_at.asc',{headers:{apikey:KEY}});
  if(!r.ok)throw new Error('Supabase '+r.status+' '+await r.text()); // échec = le déploiement précédent reste en ligne
  return r.json();
}
const books=await load();
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
for(const f of ['sw.js','config.js','manifest.webmanifest','icon-192.png','icon-512.png','bm.js','pub.css'])fs.copyFileSync(f,path.join(OUT,f));
w('ecrire/index.html',fs.readFileSync('ecrire/index.html','utf8'));
const page=({t,d,u,body,ld='',img,type='website',noindex})=>`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)}</title><meta name="description" content="${esc(d)}"><link rel="canonical" href="${SITE}${u}"><meta name="robots" content="${noindex?'noindex':'index,follow'}"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}"><meta property="og:type" content="${type}"><meta property="og:url" content="${SITE}${u}">${img?`<meta property="og:image" content="${SITE}${img}">`:''}<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2b2118"><link rel="icon" href="/icon-192.png"><link rel="stylesheet" href="/pub.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Lora:wght@400;600&display=swap">${ld}</head><body><header><a class="brand" href="/">MEOART</a><nav><a href="/">Bibliothèque</a></nav></header><main>${body}</main><footer>© ${new Date().getFullYear()} MEOART · <a href="/ecrire/" rel="nofollow">Espace auteur</a></footer></body></html>`;
const urls=[{u:'/',m:TODAY}],authors={};
for(const b of books){
  const bs=b.slug,bu=`/livre/${bs}/`,chs=[];let n=0;
  (b.data.seasons||[]).forEach(s=>(s.chapters||[]).forEach(c=>{n++;chs.push({n,season:s.title,title:c.title,text:c.text||'',slug:`${n}-${slug(c.title)}`})}));
  const cover=b.cover_b64&&b.cover_b64.startsWith('data:image')?`/covers/${bs}.jpg`:null;
  if(cover)w(cover.slice(1),Buffer.from(b.cover_b64.split(',')[1],'base64'));
  const A=authors[b.author_slug]||(authors[b.author_slug]={name:b.author_name,real:b.real_name,bio:b.bio,books:[]});
  A.real=A.real||b.real_name;A.bio=A.bio||b.bio;A.books.push({...b,cover,bu});
  const au=`/auteur/${b.author_slug}/`,person={'@type':'Person',name:b.author_name,url:SITE+au};
  const desc=(b.summary||`${b.title}, un livre de ${b.author_name}, à lire en ligne sur MEOART.`).replace(/\s+/g,' ').slice(0,160);
  const mod=(b.updated_at||'').slice(0,10)||TODAY;
  let last='';
  const list=chs.map(c=>{let h='';if(c.season!==last){last=c.season;h=`</ul><h2>${esc(c.season)}</h2><ul class="ch">`}return h+`<li><a href="${bu}${c.slug}/">${esc(c.title)}</a></li>`}).join('');
  w(bu.slice(1)+'index.html',page({t:`${b.title} — ${b.author_name} | MEOART`,d:desc,u:bu,img:cover,type:'book',
    ld:jl({'@context':'https://schema.org','@type':'Book',name:b.title,author:person,inLanguage:'fr',url:SITE+bu,description:desc,image:cover?SITE+cover:undefined,datePublished:b.published_at,dateModified:b.updated_at,hasPart:chs.map(c=>({'@type':'Chapter',name:c.title,position:c.n,url:`${SITE}${bu}${c.slug}/`}))}),
    body:`${cover?`<img class="cov" src="${cover}" alt="Couverture de ${esc(b.title)}">`:''}<h1>${esc(b.title)}</h1><p class="by">par <a href="${au}">${esc(b.author_name)}</a></p>${(b.summary||'').split(/\n+/).filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join('')}<ul class="ch">${list}</ul><p class="m">Publié le ${(b.published_at||'').slice(0,10)} · mis à jour le ${mod}</p><script src="/bm.js"></script><script>MEOBM.init(${js(bs)},{pub:true})</script>`}));
  urls.push({u:bu,m:mod});
  chs.forEach((c,i)=>{const cu=`${bu}${c.slug}/`,pv=chs[i-1],nx=chs[i+1],cd=(c.text.replace(/\s+/g,' ').slice(0,155))||`${c.title} — ${b.title}`;
    w(cu.slice(1)+'index.html',page({t:`${c.title} — ${b.title} (${b.author_name}) | MEOART`,d:cd,u:cu,img:cover,type:'article',
      ld:jl({'@context':'https://schema.org','@type':'Chapter',name:c.title,position:c.n,inLanguage:'fr',url:SITE+cu,author:person,isPartOf:{'@type':'Book',name:b.title,url:SITE+bu,author:person}}),
      body:`<p class="m"><a href="${bu}">← ${esc(b.title)}</a> · ${esc(c.season)}</p><h1>${esc(c.title)}</h1><article>${c.text.split(/\n+/).filter(x=>x.trim()).map((x,k)=>`<p id="p${k}" data-c="${c.slug}" data-p="${k}">${esc(x)}</p>`).join('')}</article><div class="nv">${pv?`<a href="${bu}${pv.slug}/">← ${esc(pv.title)}</a>`:'<span></span>'}${nx?`<a href="${bu}${nx.slug}/">${esc(nx.title)} →</a>`:`<a href="${bu}">Retour au livre</a>`}</div><script src="/bm.js"></script><script>MEOBM.init(${js(bs)},{pub:true,title:${js(c.title)}})</script>`}));
    urls.push({u:cu,m:mod})});
}
for(const [as,A] of Object.entries(authors)){const au=`/auteur/${as}/`,d=(A.bio||`Œuvres de ${A.name} publiées sur MEOART.`).replace(/\s+/g,' ').slice(0,160);
  w(au.slice(1)+'index.html',page({t:`${A.name} — auteur | MEOART`,d,u:au,type:'profile',
    ld:jl({'@context':'https://schema.org','@type':'Person',name:A.name,alternateName:A.real||undefined,description:A.bio||undefined,url:SITE+au,mainEntityOf:A.books.map(b=>({'@type':'Book',name:b.title,url:SITE+b.bu}))}),
    body:`<h1>${esc(A.name)}</h1>${A.real?`<p class="by">De son vrai nom : ${esc(A.real)}</p>`:''}${(A.bio||'').split(/\n+/).filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join('')}<h2>Bibliographie</h2><div class="grid">${A.books.map(b=>`<a class="bk" href="${b.bu}">${b.cover?`<img src="${b.cover}" alt="Couverture de ${esc(b.title)}" loading="lazy">`:''}<b>${esc(b.title)}</b></a>`).join('')}</div>`}));
  urls.push({u:au,m:TODAY})}
const all=Object.values(authors).flatMap(a=>a.books);
w('index.html',page({t:'MEOART — Bibliothèque littéraire',d:'Romans, nouvelles et textes littéraires à lire en ligne gratuitement sur MEOART.',u:'/',
  ld:jl({'@context':'https://schema.org','@type':'WebSite',name:'MEOART',url:SITE+'/'}),
  body:`<h1>MEOART</h1><p class="m">Bibliothèque littéraire : romans, nouvelles et textes à lire en ligne.</p>${all.length?`<div class="grid">${all.map(b=>`<a class="bk" href="${b.bu}">${b.cover?`<img src="${b.cover}" alt="Couverture de ${esc(b.title)}" loading="lazy">`:''}<b>${esc(b.title)}</b><span class="m">${esc(b.author_name)}</span></a>`).join('')}</div><h2>Auteurs</h2><ul class="ch">${Object.entries(authors).map(([s,A])=>`<li><a href="/auteur/${s}/">${esc(A.name)}</a></li>`).join('')}</ul>`:'<p>Les premières œuvres arrivent bientôt.</p>'}`}));
w('404.html',page({t:'Page introuvable | MEOART',d:'Page introuvable',u:'/404.html',noindex:true,body:'<h1>Page introuvable</h1><p><a href="/">Retour à la bibliothèque</a></p>'}));
w('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
w('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x=>`<url><loc>${SITE}${x.u}</loc><lastmod>${x.m}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`OK : ${books.length} livre(s), ${urls.length} URL(s).`);
