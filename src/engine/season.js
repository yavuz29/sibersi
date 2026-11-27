import {simulate,rng} from './matchEngine'
import {finance,mood,sackCheck} from './economy'
import {toty} from './toty'
import {playerValue} from '../data/leagues'
import {CUP_WEEKS,playCup,newCup} from './cup'
export function roundRobin(ids){
  const n=ids.length,a=[...ids],rounds=[]
  for(let k=0;k<n-1;k++){const rd=[];for(let i=0;i<n/2;i++)rd.push(k%2?[a[n-1-i],a[i]]:[a[i],a[n-1-i]]);rounds.push(rd);a.splice(1,0,a.pop())}
  return [...rounds,...rounds.map(rd=>rd.map(([h,x])=>[x,h]))]
}
export const emptyRow=()=>({p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0})
export function newLeagueState(teams,lg){
  const ids=teams.filter(t=>t.league===lg).map(t=>t.id)
  return {fixtures:roundRobin(ids),table:Object.fromEntries(ids.map(i=>[i,emptyRow()]))}
}
export const sorted=tbl=>Object.entries(tbl).map(([id,r])=>({id:+id,...r})).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)
function apply(tbl,h,a,hg,ag,s=1){
  const u=(id,f,c)=>{const r=tbl[id];r.p+=s;r.gf+=s*f;r.ga+=s*c;f>c?(r.w+=s,r.pts+=3*s):f===c?(r.d+=s,r.pts+=s):r.l+=s}
  u(h,hg,ag);u(a,ag,hg)
}
export function addStats(st,m,s){m.events.forEach(e=>{if(e.type!=='goal')return;const t=e.home?m.h:m.a
  const a=(id,n,k)=>{if(id==null)return;const x=st[id]||(st[id]={n,t,g:0,a:0});x[k]+=s;x.t=t};a(e.pid,e.sn,'g');a(e.aid,e.an,'a')})}
export function liveTable(g,l,min){
  const table=structuredClone(g.leagues[l].table),rs=g.results.filter(r=>r.lg===l)
  rs.forEach(r=>apply(table,r.h,r.a,r.hg,r.ag,-1))
  rs.forEach(r=>{const c=h=>r.events.filter(e=>e.type==='goal'&&e.home===h&&e.min<=min).length;apply(table,r.h,r.a,c(true),c(false))})
  return table
}
export function fixMatch(g,i,res){
  const o=g.results[i],L=g.leagues[o.lg],table=structuredClone(L.table)
  apply(table,o.h,o.a,o.hg,o.ag,-1);apply(table,o.h,o.a,res.hg,res.ag)
  const results=[...g.results];results[i]={...o,...res}
  const stats=structuredClone(g.stats||{});addStats(stats,o,-1);addStats(stats,{...o,...res},1)
  return {...g,results,stats,leagues:{...g.leagues,[o.lg]:{...L,table}}}
}
export function playWeek(g,tactics={}){
  const results=[],leagues={...g.leagues}
  for(const lg of [1,2,3,4]){
    const L=g.leagues[lg],rd=L.fixtures[g.week];if(!rd)continue
    const table=structuredClone(L.table)
    rd.forEach(([h,a],i)=>{const r=rng(g.week*997+lg*31+i+g.season*7)
      const res=simulate(g.teams[h],g.teams[a],r,tactics[h],tactics[a]);apply(table,h,a,res.hg,res.ag);results.push({lg,h,a,...res})})
    leagues[lg]={...L,table}
  }
  const pl=new Set(results.flatMap(m=>m.xi.flat()))
  const teams=g.teams.map(t=>({...t,players:t.players.map(p=>({...p,inj:p.inj?p.inj-1:0,fit:pl.has(p.id)?Math.max(35,(p.fit??100)-8):Math.min(100,(p.fit??100)+18)}))}))
  const stats=structuredClone(g.stats||{});results.forEach(m=>addStats(stats,m,1))
  results.forEach((m,i)=>{const r=rng(g.week*131+i+g.season),t=teams[r()<.5?m.h:m.a];if(r()<.3){const k=Math.floor(r()*t.players.length);t.players[k]={...t.players[k],inj:1+Math.floor(r()*4)}}})
  finance(teams,results);mood(teams,results);sackCheck(teams,g)
  let cup=g.cup
  if(CUP_WEEKS.includes(g.week)&&cup.alive.length>1){cup=playCup({...g,teams});cup.log.at(-1).games.forEach(x=>{if(teams[x.w].human)teams[x.w].budget+=15000*cup.round})}
  return {...g,teams,week:g.week+1,leagues,results,cup,stats}
}
function playoff(g,ids,seed){
  const r=rng(seed),win=(a,b)=>{const m=simulate(g.teams[a],g.teams[b],r);return m.hg>m.ag||(m.hg===m.ag&&r()<.5)?a:b}
  return win(win(ids[0],ids[3]),win(ids[1],ids[2]))
}
export function endSeason(g){
  const move={},tab={}
  for(const l of [1,2,3,4])tab[l]=sorted(g.leagues[l].table).map(x=>x.id)
  const hist=[...(g.hist||[]),{season:g.season,toty:toty(g),champ:Object.fromEntries([1,2,3,4].map(l=>[l,tab[l][0]]))}]
  for(const lg of [2,3,4]){const t=tab[lg];[...t.slice(0,2),playoff(g,t.slice(2,6),g.season*13+lg)].forEach(id=>move[id]=lg-1)}
  for(const lg of [1,2,3])tab[lg].slice(-3).forEach(id=>move[id]=lg+1)
  const gone=[];const teams=g.teams.map(t=>{const r=rng(g.season*77+t.id),base=t.players.reduce((s,p)=>s+p.ovr,0)/t.players.length
    const youth=[0,1].map(k=>({id:100000+g.season*1000+t.id*2+k,name:'Akademi '+(g.season*2+k),pos:['DEF','MID','FWD','GK'][Math.floor(r()*4)],age:16+Math.floor(r()*2),ovr:Math.round(base-12+r()*8),value:50000,contract:3}))
    const src=t.human?t.players.filter(p=>{const k=(p.contract||2)>1;if(!k)gone.push(p);return k}):t.players
    const pl=[...src.map(p=>({...p,contract:t.human?(p.contract||2)-1:((p.contract||2)<=1?3:(p.contract||2)-1),age:p.age+1,inj:0,fit:100,ovr:Math.max(30,Math.min(95,p.ovr+(p.age<22?2:p.age>30?-2:0)))})),...youth].map(p=>({...p,value:playerValue(p)})).sort((a,b)=>b.ovr-a.ovr).slice(0,26)
    return {...t,sacked:false,fanA:Math.round((t.fanA??20)*.6),boardA:Math.round((t.boardA??20)*.6),league:move[t.id]??t.league,players:pl}})
  const loans=teams.flatMap(t=>t.players.filter(p=>p.loanOf!=null).map(p=>({p,from:t.id})))
  loans.forEach(({p,from})=>{teams[from].players=teams[from].players.filter(x=>x.id!==p.id);teams[p.loanOf].players=[...teams[p.loanOf].players,{...p,loanOf:undefined}]})
  return {...g,hist,stats:{},teams,free:[...gone,...g.free].slice(0,60),leagues:Object.fromEntries([1,2,3,4].map(l=>[l,newLeagueState(teams,l)])),week:0,season:g.season+1,results:[],cup:newCup(teams)}
}
