// Lecture immédiate d'un livre publié : lit Supabase à l'ouverture, sans déploiement. Page non indexée (noindex).
(function(){
var C=window.MEOCFG||{},q=new URLSearchParams(location.search),slug=q.get('livre'),ci=parseInt(q.get('c')||'0',10),root=document.getElementById('lv');
var KIND={roman:'Roman',nouvelle:'Nouvelle',poeme:'Poème',pensee:'Pensée'};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function sl(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x'}
function fd(d){try{return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}catch(e){return''}}
function words(t){return(String(t).trim().match(/\S+/g)||[]).length}
function msg(h){root.innerHTML=h}
if(!root)return;
if(!slug||!C.sb){msg('<h1>Lecture</h1><p class="m" style="margin-top:1rem">Aucun livre indiqué. <a href="/" style="color:var(--acc)">Retour à la bibliothèque</a></p>');return}
fetch(C.sb+'/rest/v1/published_books?slug=eq.'+encodeURIComponent(slug)+'&published=eq.true&select=*',{headers:{apikey:C.key}}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(rows){
  var b=rows[0];
  if(!b){msg('<h1>Livre introuvable</h1><p class="m" style="margin-top:1rem">Ce livre n’est pas ou plus publié. <a href="/" style="color:var(--acc)">Retour à la bibliothèque</a></p>');return}
  var chs=[],n=0;((b.data&&b.data.seasons)||[]).forEach(function(s){(s.chapters||[]).forEach(function(c){n++;chs.push({n:n,season:s.title,title:c.title,text:c.text||'',guest:(c.guest||'').trim(),slug:n+'-'+sl(c.title)})})});
  var base='/lire/?livre='+encodeURIComponent(slug),kind=KIND[b.data&&b.data.kind]?b.data.kind:'roman',cover=(b.cover_b64&&b.cover_b64.indexOf('data:image')===0)?b.cover_b64:'';
  document.title=b.title+' — '+b.author_name+' | MEOART';
  if(!ci||!chs[ci-1]){
    document.body.dataset.back='/';
    var last='',list=chs.map(function(c){var h='';if(c.season!==last){last=c.season;h='</ul><h3 style="margin-top:1.6rem">'+esc(c.season)+'</h3><ul class="ch">'}return h+'<li><a href="'+base+'&c='+c.n+'">'+esc(c.title)+'</a>'+(c.guest?' <span class="m">· avec '+esc(c.guest)+'</span>':'')+' <span class="m">· '+Math.max(1,Math.round(words(c.text)/200))+' min</span></li>'}).join('');
    msg('<div class="bookhead"><div class="cover">'+(cover?'<img src="'+cover+'" alt="Couverture de '+esc(b.title)+'">':'<span class="ct">'+esc(b.title)+'</span>')+'</div><div><span class="badge">'+KIND[kind]+'</span><h1>'+esc(b.title)+'</h1><p class="by">par '+esc(b.author_name)+'</p>'+(b.summary||'').split(/\n+/).filter(Boolean).map(function(x){return'<p style="margin-bottom:.8rem">'+esc(x)+'</p>'}).join('')+(chs[0]?'<div class="actions" style="margin-top:18px"><a class="btn" href="'+base+'&c=1">Commencer la lecture</a></div>':'')+'<p class="m" style="margin-top:14px">Publié le '+fd(b.published_at)+' · mis à jour le '+fd(b.updated_at)+'</p></div></div><h2 style="margin-top:2.4rem">Chapitres</h2><ul class="ch">'+list+'</ul>');
    if(window.MEOBM)MEOBM.init(slug,{url:function(c,p){return base+'&c='+parseInt(c,10)+'#p'+p}});
    return}
  var c=chs[ci-1],pv=chs[ci-2],nx=chs[ci];
  document.body.dataset.back=base;
  msg('<p class="m"><a href="'+base+'" style="color:var(--acc)">← '+esc(b.title)+'</a> · '+esc(c.season)+'</p><h1 style="font-size:clamp(30px,6vw,52px);margin:10px 0 24px">'+esc(c.title)+'</h1>'+(c.guest?'<p class="by" style="margin:-10px 0 20px">Par '+esc(b.author_name)+' feat. '+esc(c.guest)+'</p>':'')+'<div class="reader"><article data-title="'+esc(c.title)+'" data-book="'+esc(b.title)+'" data-author="'+esc(b.author_name)+'">'+c.text.split(/\n+/).filter(function(x){return x.trim()}).map(function(x,k){return'<p id="p'+k+'" data-c="'+c.slug+'" data-p="'+k+'">'+esc(x)+'</p>'}).join('')+'</article></div><div class="nv">'+(pv?'<a class="btn ghost sm" rel="prev" href="'+base+'&c='+pv.n+'">← '+esc(pv.title)+'</a>':'<span></span>')+(nx?'<a class="btn sm" rel="next" href="'+base+'&c='+nx.n+'">'+esc(nx.title)+' →</a>':'<a class="btn sm" href="'+base+'">Retour au livre</a>')+'</div>');
  if(window.MEOREADER&&MEOREADER.mount)MEOREADER.mount();
  if(window.MEOBM)MEOBM.init(slug,{title:c.title,url:function(cc,p){return base+'&c='+parseInt(cc,10)+'#p'+p}});
}).catch(function(){msg('<p class="m">Impossible de charger ce livre pour le moment. Réessayez plus tard.</p>')});
})();
