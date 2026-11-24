const F={GK:1,DEF:4,MID:4,FWD:2}
export function toty(g){
  const out={}
  for(const lg of [1,2,3,4]){
    const ts=g.teams.filter(t=>t.league===lg),tb=g.leagues[lg].table,mx=Math.max(1,...Object.values(tb).map(r=>r.pts))
    const all=ts.flatMap(t=>t.players.map(p=>{const s=(g.stats||{})[p.id]||{g:0,a:0};return {id:p.id,n:p.name,pos:p.pos,t:t.id,g:s.g,sc:p.ovr+2*s.g+1.5*s.a+5*(tb[t.id].pts/mx)}}))
    out[lg]=Object.entries(F).flatMap(([pos,n])=>all.filter(p=>p.pos===pos).sort((a,b)=>b.sc-a.sc).slice(0,n))
  }
  return out
}
