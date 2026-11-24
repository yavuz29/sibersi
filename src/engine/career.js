import {rng} from './matchEngine'
import {sorted} from './season'
import {sackChance} from './economy'
export function offers(g){
  const me=g.teams[g.me],lg=me.league,L=g.leagues[lg],res=[]
  const rank=sorted(L.table).findIndex(x=>x.id===g.me)+1,w=L.table[g.me].w
  const r=rng(g.season*31+lg+Math.floor(g.week/4)+g.me)
  const pick=l=>g.teams.filter(x=>x.league===l&&!x.human&&x.id!==g.me).sort(()=>r()-.5).slice(0,2)
  if(lg>1&&(w>=10||(g.week>=10&&rank<=2)))pick(lg-1).forEach(x=>res.push({id:x.id,name:x.name,color:x.color,kind:'up'}))
  if(sackChance(me)>=20||me.sacked)pick(Math.min(4,lg+1)).forEach(x=>res.push({id:x.id,name:x.name,color:x.color,kind:'down'}))
  return res
}
