import {simulate,rng} from './matchEngine'
export const CUP_WEEKS=[2,5,8,11,14,17]
export const newCup=teams=>({alive:teams.map(t=>t.id),round:0,log:[]})
export function playCup(g){
  const c=g.cup,r=rng(g.season*5000+c.round),a=[...c.alive].sort(()=>r()-.5),next=[],games=[]
  if(a.length%2){a.sort((x,y)=>g.teams[x].league-g.teams[y].league);next.push(a.shift())}
  for(let i=0;i<a.length;i+=2){const m=simulate(g.teams[a[i]],g.teams[a[i+1]],r),w=m.hg>m.ag||(m.hg===m.ag&&r()<.5)?a[i]:a[i+1];next.push(w);games.push({h:a[i],a:a[i+1],hg:m.hg,ag:m.ag,w})}
  return {alive:next,round:c.round+1,log:[...c.log,{round:c.round+1,games}]}
}
