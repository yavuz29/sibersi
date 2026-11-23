export function transfer(g,pid,to,fee){
  const teams=g.teams.map(t=>({...t}));let free=g.free,p
  for(const t of teams){const x=t.players.find(y=>y.id===pid);if(x){p=x;t.players=t.players.filter(y=>y.id!==pid);t.budget+=fee}}
  if(!p){p=free.find(y=>y.id===pid);if(!p)return g;free=free.filter(y=>y.id!==pid)}
  if(to<0)return {...g,teams,free:[p,...free]}
  const T=teams.find(t=>t.id===to);T.players=[...T.players,p];T.budget-=fee
  return {...g,teams,free}
}
export function finance(teams,results){
  teams.forEach(t=>{if(t.human)t.budget+=t.sponsor-Math.round(t.players.reduce((s,p)=>s+p.ovr**2,0)*.3)})
  results.forEach(m=>{const w=m.hg>m.ag?teams[m.h]:m.hg<m.ag?teams[m.a]:null;if(w&&w.human)w.budget+=w.winBonus||0;const h=teams[m.h];if(h.human)h.budget+=Math.round(h.cap*Math.max(.15,Math.min(1,.9-h.price/60))*h.price)})
}
export function applyOp(g,t){
  if(t.op==='renew')return {...g,teams:g.teams.map(x=>x.id===t.to?{...x,budget:x.budget-t.fee,players:x.players.map(p=>p.id===t.pid?{...p,contract:(p.contract||2)+2}:p)}:x)}
  return transfer(g,t.pid,t.to,t.fee)
}
