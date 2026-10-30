// Lecture audio (voix choisies, volume, vitesse), surlignage + défilement, commandes de l’appareil (Media Session), raccourcis clavier, thème.
(function(){
var TTS=window.speechSynthesis,K='meo-tts',S={rate:1,pitch:1,vol:1,voice:'',size:19};
try{Object.assign(S,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
var items=[],i=0,T=0,playing=false,meta={},hi=null,panel=null,aud=null,wl=null,onState=function(){};
function voices(){return TTS?TTS.getVoices():[]}
function frVoices(){var fr=voices().filter(function(x){return(x.lang||'').toLowerCase().indexOf('fr')===0});var q=function(x){return /natural|online|neural|premium|enhanced|google/i.test(x.name)?0:1};fr.sort(function(a,b){return q(a)-q(b)||a.name.localeCompare(b.name)});return fr}
function pick(){var v=voices(),f=null;for(var k=0;k<v.length;k++)if(v[k].name===S.voice)f=v[k];return f||frVoices()[0]||null}
function chunks(t){var s=t.replace(/\s+/g,' ').trim().match(/[^.!?…»”]+[.!?…»”]*\s*/g)||[t],out=[],c='';
 s.forEach(function(x){x=x.trim();if(!x)return;if(c&&(c+' '+x).length>200){out.push(c);c=x}else c=c?c+' '+x:x});if(c)out.push(c);
 var r=[];out.forEach(function(x){while(x.length>220){var j=x.lastIndexOf(' ',220);if(j<60)j=220;r.push(x.slice(0,j));x=x.slice(j).trim()}if(x)r.push(x)});return r}
function clear(){if(hi){hi.classList.remove('rd-on');hi=null}}
function mark(el){clear();if(!el)return;el.classList.add('rd-on');hi=el;var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;el.scrollIntoView({block:'center',behavior:rm?'auto':'smooth'})}
function audio(on){try{if(!aud){var n=8000,b=new Uint8Array(44+n),d=new DataView(b.buffer),q;function w(o,s){for(var z=0;z<s.length;z++)b[o+z]=s.charCodeAt(z)}
 w(0,'RIFF');d.setUint32(4,36+n,true);w(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,8000,true);d.setUint32(28,8000,true);d.setUint16(32,1,true);d.setUint16(34,8,true);w(36,'data');d.setUint32(40,n,true);for(q=44;q<44+n;q++)b[q]=128;
 aud=new Audio(URL.createObjectURL(new Blob([b],{type:'audio/wav'})));aud.loop=true;aud.volume=.01}
 if(on)aud.play().catch(function(){});else aud.pause()}catch(e){}}
function wake(on){try{if(on&&navigator.wakeLock){navigator.wakeLock.request('screen').then(function(l){wl=l}).catch(function(){})}else if(wl){wl.release();wl=null}}catch(e){}}
function ms(){if(!('mediaSession' in navigator))return;try{var m=navigator.mediaSession;
 m.metadata=new MediaMetadata({title:meta.title||'Lecture',artist:meta.author||'',album:meta.book||'MEOART',artwork:meta.cover?[{src:meta.cover,sizes:'480x720',type:'image/jpeg'}]:[]});
 m.setActionHandler('play',resume);m.setActionHandler('pause',pause);m.setActionHandler('stop',stop);
 m.setActionHandler('previoustrack',function(){skip(-1)});m.setActionHandler('nexttrack',function(){skip(1)})}catch(e){}}
function state(){try{if('mediaSession' in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused'}catch(e){}onState()}
function halt(){T++;if(TTS)TTS.cancel();playing=false;audio(false);wake(false)}
function run(from){if(!TTS||!items.length)return;halt();i=Math.max(0,from||0);playing=true;var my=++T;audio(true);wake(true);ms();state();
 setTimeout(function item(){if(my!==T)return;
  if(i>=items.length){playing=false;i=0;clear();audio(false);wake(false);state();return}
  var it=items[i];mark(it.el);var cs=chunks(it.text),k=0;
  (function ch(){if(my!==T)return;if(k>=cs.length){i++;item();return}
   var u=new SpeechSynthesisUtterance(cs[k++]);u.lang='fr-FR';var v=pick();if(v){u.voice=v;u.lang=v.lang}u.rate=S.rate;u.pitch=S.pitch;u.volume=S.vol;
   u.onend=ch;u.onerror=function(e){if(my===T&&e.error!=='canceled'&&e.error!=='interrupted')ch()};TTS.speak(u)})()},60)}
function pause(){if(!playing)return;halt();state()}
function resume(){if(items.length)run(i)}
function stop(){halt();i=0;clear();state()}
function skip(d){if(items.length)run(Math.max(0,Math.min(items.length-1,i+d)))}
function soft(){if(playing)run(i)}
function speakTexts(parts,m){meta=m||{};items=parts.join('\n').split(/\n+/).filter(function(x){return x.trim()}).map(function(x){return{text:x}});run(0)}
function speakEls(els,m,from){meta=m||{};items=els.map(function(e){return{text:e.textContent,el:e}});run(from||0)}
function closeSettings(){if(panel){panel.remove();panel=null;return true}return false}
function settings(){if(closeSettings())return;if(!TTS)return;
 panel=document.createElement('div');panel.className='rd-pn';
 panel.innerHTML='<b>Voix et lecture</b><button id="rdx" style="float:right" aria-label="Fermer">✕</button><label>Voix</label><select id="rdvs"></select><label>Vitesse : <span id="rdr"></span></label><input id="rdrr" type="range" min=".6" max="1.6" step=".1"><label>Hauteur : <span id="rdp2"></span></label><input id="rdpp" type="range" min=".6" max="1.4" step=".1"><label>Volume : <span id="rdv2"></span></label><input id="rdvv" type="range" min="0" max="1" step=".05"><div style="margin-top:.8rem"><button id="rdtest">▶ Tester la voix</button></div><small>Les voix « Natural », « Online » ou « Google » sont en général plus naturelles. Vous pouvez en ajouter dans les réglages de votre appareil (voix, synthèse vocale). Les touches de volume et les commandes multimédia de l’appareil fonctionnent aussi.</small>';
 document.body.appendChild(panel);var $=function(x){return panel.querySelector(x)};
 function fill(){var sel=$('#rdvs');if(!sel)return;sel.innerHTML='';var fr=frVoices(),all=voices(),cur=S.voice||(pick()||{}).name;
  function add(l,label){if(!l.length)return;var g=document.createElement('optgroup');g.label=label;l.forEach(function(v){var o=document.createElement('option');o.value=v.name;o.textContent=v.name+' ('+v.lang+')';if(v.name===cur)o.selected=true;g.appendChild(o)});sel.appendChild(g)}
  add(fr,'Français');add(all.filter(function(v){return fr.indexOf(v)<0}),'Autres langues');if(!all.length)sel.innerHTML='<option>Aucune voix détectée</option>'}
 fill();TTS.onvoiceschanged=fill;
 function lab(){$('#rdr').textContent='×'+S.rate;$('#rdp2').textContent=S.pitch;$('#rdv2').textContent=Math.round(S.vol*100)+' %'}
 $('#rdrr').value=S.rate;$('#rdpp').value=S.pitch;$('#rdvv').value=S.vol;lab();
 $('#rdx').onclick=closeSettings;
 $('#rdvs').onchange=function(e){S.voice=e.target.value;save();soft()};
 [['#rdrr','rate'],['#rdpp','pitch'],['#rdvv','vol']].forEach(function(p){var el=$(p[0]);el.oninput=function(){S[p[1]]=+el.value;lab()};el.onchange=function(){save();soft()}});
 $('#rdtest').onclick=function(){pause();TTS.cancel();var u=new SpeechSynthesisUtterance('Bonjour, voici la voix choisie pour votre lecture.');var v=pick();u.lang='fr-FR';if(v){u.voice=v;u.lang=v.lang}u.rate=S.rate;u.pitch=S.pitch;u.volume=S.vol;TTS.speak(u)}}
function css(){if(document.getElementById('rd-css'))return;var s=document.createElement('style');s.id='rd-css';
 s.textContent='.rdbar{position:sticky;top:0;z-index:30;display:flex;flex-wrap:wrap;gap:.4rem;padding:.5rem 0;background:var(--bg,#f7f1e6);border-bottom:1px solid var(--line,#e3d6c0);margin-bottom:1rem}.rdbar button,.rd-pn button,.rdt{font:inherit;min-height:44px;min-width:44px;padding:.3rem .8rem;border-radius:10px;border:1px solid var(--line,#e3d6c0);background:var(--card,#fffaf0);color:var(--ink,#2b2118);cursor:pointer}.rdbar .main{background:var(--acc,#a4532b);color:#fff;border-color:transparent}.rd-on{background:rgba(224,164,88,.25);border-radius:6px;box-shadow:0 0 0 6px rgba(224,164,88,.25)}.rd-pn{position:fixed;z-index:60;top:4rem;right:.5rem;width:min(92vw,360px);max-height:80vh;overflow:auto;background:var(--card,#fffaf0);color:var(--ink,#2b2118);border:1px solid var(--line,#e3d6c0);border-radius:14px;padding:1rem;box-shadow:0 10px 40px rgba(0,0,0,.4)}.rd-pn label{display:block;margin:.6rem 0 .2rem;font-size:.9rem}.rd-pn select,.rd-pn input[type=range]{width:100%}.rd-pn select{min-height:44px;font:inherit;background:var(--bg,#fff);color:inherit;border-radius:8px;border:1px solid var(--line,#ccc)}.rd-pn small{color:var(--mut,#7a6a58);display:block;margin-top:.8rem}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}';
 document.head.appendChild(s)}
function mount(){css();
 var hd=document.querySelector('nav .right')||document.querySelector('header nav');
 if(hd&&!document.getElementById('rdth')){var b=document.createElement('button');b.id='rdth';b.className='rdt';b.textContent='◐';b.setAttribute('aria-label','Thème clair ou sombre');
  b.onclick=function(){var r=document.documentElement,c=r.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=c==='dark'?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('meo-theme',n)}catch(e){}};hd.appendChild(b)}
 var a=document.querySelector('article');if(!a||document.querySelector('.rdbar'))return;
 var ps=[].slice.call(a.querySelectorAll('p'));meta={title:a.dataset.title,book:a.dataset.book,author:a.dataset.author,cover:a.dataset.cover};
 document.documentElement.style.setProperty('--fs',S.size+'px');
 var bar=document.createElement('div');bar.className='rdbar';
 bar.innerHTML='<button class="main" id="rdp">▶ Écouter</button><button id="rds" aria-label="Arrêter">⏹</button><button id="rdv">⚙ Voix</button><button id="rda" aria-label="Texte plus petit">A−</button><button id="rdb" aria-label="Texte plus grand">A+</button>';
 a.parentNode.insertBefore(bar,a);
 function first(){for(var k=0;k<ps.length;k++)if(ps[k].getBoundingClientRect().bottom>90)return k;return 0}
 function toggle(){if(playing)pause();else if(items.length&&i>0)resume();else speakEls(ps,meta,first())}
 onState=function(){var m=document.getElementById('rdp');if(m)m.textContent=playing?'⏸ Pause':(i>0?'▶ Reprendre':'▶ Écouter')};
 document.getElementById('rdp').onclick=toggle;document.getElementById('rds').onclick=stop;document.getElementById('rdv').onclick=settings;
 function sz(d){S.size=Math.max(15,Math.min(34,S.size+d));save();document.documentElement.style.setProperty('--fs',S.size+'px')}
 document.getElementById('rda').onclick=function(){sz(-2)};document.getElementById('rdb').onclick=function(){sz(2)};
 ps.forEach(function(p,k){p.addEventListener('dblclick',function(){speakEls(ps,meta,k)})});
 window.MEOTOGGLE=toggle}
document.addEventListener('keydown',function(e){if(e.ctrlKey||e.metaKey||e.altKey)return;var t=e.target,tag=t&&t.tagName;if(/INPUT|TEXTAREA|SELECT/.test(tag))return;
 var back=document.body&&document.body.dataset&&document.body.dataset.back;if(!back)return;
 if(e.key==='Escape'){if(!closeSettings())location.href=back;return}
 if(!document.querySelector('article'))return;
 if(e.key===' '&&tag!=='BUTTON'&&tag!=='A'){e.preventDefault();if(window.MEOTOGGLE)window.MEOTOGGLE()}
 else if(e.key==='ArrowLeft'){var l=document.querySelector('a[rel=prev]');if(l)location.href=l.href}
 else if(e.key==='ArrowRight'){var n=document.querySelector('a[rel=next]');if(n)location.href=n.href}});
addEventListener('pagehide',function(){if(TTS)TTS.cancel()});
window.MEOREADER={speakTexts:speakTexts,speakEls:speakEls,pause:pause,resume:resume,stop:stop,settings:settings,closeSettings:closeSettings,mount:mount,set:function(o){Object.assign(S,o);save();soft()},get:function(){return S}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
