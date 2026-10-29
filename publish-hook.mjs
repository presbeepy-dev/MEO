// Déclenche un déploiement Netlify, réservé aux comptes « publishers » authentifiés. Le Build Hook reste secret (variable d’environnement).
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export default async (req)=>{
  if(req.method!=='POST')return json({error:'Méthode refusée'},405);
  const U=Netlify.env.get('SUPABASE_URL'),K=Netlify.env.get('SUPABASE_ANON_KEY'),H=Netlify.env.get('BUILD_HOOK_URL');
  if(!U||!K||!H)return json({error:'Variables d’environnement manquantes sur Netlify'},500);
  const auth=req.headers.get('authorization')||'';
  const r=await fetch(U+'/auth/v1/user',{headers:{apikey:K,Authorization:auth}});
  if(!r.ok)return json({error:'Non authentifié'},401);
  const u=await r.json();
  const p=await fetch(`${U}/rest/v1/publishers?select=user_id&user_id=eq.${encodeURIComponent(u.id)}`,{headers:{apikey:K,Authorization:auth}});
  const rows=p.ok?await p.json():[];
  if(!rows.length)return json({error:'Compte non autorisé à publier'},403);
  const b=await fetch(H,{method:'POST'});
  return json({ok:b.ok},b.ok?200:502);
};
export const config={path:'/api/publish-hook'};
