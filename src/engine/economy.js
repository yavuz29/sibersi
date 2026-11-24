import {rng} from './matchEngine'
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
  if(t.op==='loan'){const n=transfer(g,t.pid,t.to,t.fee);return {...n,teams:n.teams.map(x=>x.id===t.to?{...x,players:x.players.map(p=>p.id===t.pid?{...p,loanOf:t.from}:p)}:x)}}
  if(t.op==='switch')return {...g,teams:g.teams.map(x=>x.id===t.from?{...x,human:null,sacked:false}:x.id===t.to?{...x,human:t.name,sacked:false,fanA:25,boardA:25}:x),me:g.me===t.from?t.to:g.me}
  return transfer(g,t.pid,t.to,t.fee)
}
const cl=v=>Math.max(0,Math.min(100,v))
export function mood(teams,results){
  results.forEach(m=>{[[m.h,m.hg,m.ag,1],[m.a,m.ag,m.hg,0]].forEach(([id,f,c,home])=>{const t=teams[id];if(!t.human)return
    const d=f>c?[-8,-6]:f===c?[2,2]:[home?14:10,home?10:7]
    t.fanA=cl((t.fanA??20)+d[0]);t.boardA=cl((t.boardA??20)+d[1]+(t.budget<0?3:0))})})
}
export const sackChance=t=>Math.min(90,Math.max(0,Math.round(((t.boardA??20)*.6+(t.fanA??20)*.4-50)*1.6)))
export function sackCheck(teams,g){
  teams.forEach(t=>{if(t.human&&!t.sacked&&g.week>=4&&rng(g.week*77+g.season*13+t.id)()*100<sackChance(t)/4)t.sacked=true})
}
