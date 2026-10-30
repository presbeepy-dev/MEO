// Affiche tout de suite, sur l'accueil, les livres publiés depuis le dernier déploiement.
(function(){
var C=window.MEOCFG,known=window.MEOKNOWN||[],g=document.getElementById('newbooks');if(!C||!C.sb||!g)return;
var KIND={roman:'Roman',nouvelle:'Nouvelle',poeme:'Poème',pensee:'Pensée'};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
fetch(C.sb+'/rest/v1/published_books?published=eq.true&select=slug,title,author_name,summary,kind:data-%3E%3Ekind&order=published_at.desc&limit=30',{headers:{apikey:C.key}})
.then(function(r){return r.ok?r.json():[]}).then(function(list){
  var nu=list.filter(function(b){return known.indexOf(b.slug)<0}).slice(0,8);if(!nu.length)return;
  var em=document.getElementById('emptymsg');if(em)em.style.display='none';
  nu.forEach(function(b){var k=KIND[b.kind]?b.kind:'roman',u='/lire/?livre='+encodeURIComponent(b.slug),d=document.createElement('div');
    d.className='item';d.setAttribute('data-c',k);
    d.innerHTML='<a href="'+u+'"><div class="cover"><span class="ct">'+esc(b.title)+'</span></div></a><span class="badge">'+KIND[k]+'</span><h3><a href="'+u+'">'+esc(b.title)+'</a></h3><p>'+esc((b.summary||'').replace(/\s+/g,' ').slice(0,110))+'</p><a class="btn ghost sm" href="'+u+'">Lire</a>';
    g.appendChild(d);
    fetch(C.sb+'/rest/v1/published_books?slug=eq.'+encodeURIComponent(b.slug)+'&select=cover_b64',{headers:{apikey:C.key}}).then(function(r){return r.ok?r.json():[]}).then(function(x){var c=x[0]&&x[0].cover_b64;if(c&&c.indexOf('data:image')===0){var cv=d.querySelector('.cover');cv.innerHTML='<img alt="Couverture de '+esc(b.title)+'" loading="lazy">';cv.firstChild.src=c}}).catch(function(){})});
}).catch(function(){});
})();
