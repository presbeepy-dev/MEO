(function(){var K,o={},bar,pan,on=0,tm;
function ld(){try{return JSON.parse(localStorage.getItem('meobm:'+K))||{marks:[]}}catch(e){return{marks:[]}}}
function sv(d){try{localStorage.setItem('meobm:'+K,JSON.stringify(d))}catch(e){}}
function ps(){return[].slice.call(document.querySelectorAll('p[data-p]'))}
function cur(){var a=ps();for(var i=0;i<a.length;i++)if(a[i].getBoundingClientRect().bottom>90)return a[i];return a[0]}
function find(c,p){return ps().filter(function(e){return e.dataset.c===c&&e.dataset.p===p})[0]}
function lab(c){return o.title||(o.label&&o.label(c))||''}
function jump(c,p){var e=find(c,p);if(e){e.scrollIntoView({block:'start'});e.classList.add('meobm-f');setTimeout(function(){e.classList.remove('meobm-f')},1800);if(pan)pan.hidden=true}else if(o.url)location.href=o.url(c,p);else if(o.pub)location.href='/livre/'+K+'/'+c+'/#p'+p}
function mk(t,x,f){var e=document.createElement(t);if(x)e.textContent=x;if(f)e.onclick=f;return e}
function draw(){pan.innerHTML='';var d=ld();pan.appendChild(mk('b','Marque-pages'));
 if(d.last)pan.appendChild(mk('button','▶ Reprendre : '+(d.last.t||'dernière lecture'),function(){jump(d.last.c,d.last.p)}));
 if(!d.marks.length)pan.appendChild(mk('p','Aucun marque-page pour l’instant.'));
 d.marks.forEach(function(m,i){var r=document.createElement('div');r.className='meobm-r';r.appendChild(mk('button','🔖 '+(m.t||'')+' — '+m.x,function(){jump(m.c,m.p)}));r.appendChild(mk('button','✕',function(){var d2=ld();d2.marks.splice(i,1);sv(d2);draw()}));pan.appendChild(r)})}
function add(){var e=cur();if(!e)return;var d=ld();d.marks.unshift({c:e.dataset.c,p:e.dataset.p,t:lab(e.dataset.c),x:e.textContent.slice(0,60)+'…',d:Date.now()});d.marks=d.marks.slice(0,50);sv(d);var b=this,t=b.textContent;b.textContent='✔ Marqué';setTimeout(function(){b.textContent=t},1200)}
function onS(){clearTimeout(tm);tm=setTimeout(function(){var e=cur();if(!e)return;var d=ld();d.last={c:e.dataset.c,p:e.dataset.p,t:lab(e.dataset.c)};sv(d)},500)}
window.MEOBM={init:function(k,opt){this.off();K=k;o=opt||{};
 if(!document.getElementById('meobm-css')){var s=document.createElement('style');s.id='meobm-css';s.textContent='.meobm{position:fixed;left:0;right:0;bottom:0;display:flex;gap:.5rem;justify-content:center;padding:.5rem .5rem calc(.5rem + env(safe-area-inset-bottom,0px));background:var(--bg,#f7f1e6);border-top:1px solid var(--line,#e3d6c0);z-index:40}.meobm button,.meobm-p button{font:inherit;min-height:44px;padding:.4rem .9rem;border-radius:10px;border:1px solid var(--line,#e3d6c0);background:var(--card,#fffaf0);color:var(--ink,#2b2118);cursor:pointer}.meobm-p{position:fixed;left:.5rem;right:.5rem;bottom:calc(4.2rem + env(safe-area-inset-bottom,0px));max-height:55vh;overflow:auto;background:var(--card,#fffaf0);color:var(--ink,#2b2118);border:1px solid var(--line,#e3d6c0);border-radius:14px;padding:.8rem;z-index:41}.meobm-r{display:flex;gap:.4rem;margin:.3rem 0}.meobm-r button:first-child{flex:1;text-align:left}.meobm-f{background:#f3c969;color:#000}';document.head.appendChild(s)}
 bar=document.createElement('div');bar.className='meobm';
 if(ps().length)bar.appendChild(mk('button','🔖 Marquer ici',add));
 bar.appendChild(mk('button','📑 Marque-pages',function(){draw();pan.hidden=!pan.hidden}));
 pan=document.createElement('div');pan.className='meobm-p';pan.hidden=true;
 document.body.appendChild(bar);document.body.appendChild(pan);addEventListener('scroll',onS,{passive:true});on=1;
 if(location.hash&&/^#p\d+$/.test(location.hash)){var h=document.getElementById(location.hash.slice(1));if(h)h.scrollIntoView()}},
 off:function(){if(!on)return;on=0;removeEventListener('scroll',onS);if(bar)bar.remove();if(pan)pan.remove()}};
})();
