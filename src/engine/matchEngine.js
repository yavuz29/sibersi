export function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const FORM={'4-4-2':[1,4,4,2],'4-3-3':[1,4,3,3],'4-2-3-1':[1,4,5,1],'3-5-2':[1,3,5,2],'5-3-2':[1,5,3,2]}
export const FORMATIONS=Object.keys(FORM)
export const slots=f=>FORM[f].flatMap((n,i)=>Array(n).fill(['GK','DEF','MID','FWD'][i]))
const FT=p=>.6+.4*(p.fit??100)/100
export function lineup(team,form='4-4-2',order){
  if(order&&order.length>=11){const S=slots(form);return order.slice(0,11).map((id,i)=>{const p=team.players.find(x=>x.id===id)||team.players[i];return {...p,pos:S[i],ovr:p.ovr*(p.pos===S[i]?1:.8)*(p.inj?.5:1)*FT(p)}})}
  const xi=[],used=new Set()
  ;['GK','DEF','MID','FWD'].forEach((p,i)=>team.players.filter(x=>x.pos===p&&!x.inj).sort((a,b)=>b.ovr*FT(b)-a.ovr*FT(a)).slice(0,FORM[form][i]).forEach(x=>{xi.push({...x,ovr:x.ovr*FT(x)});used.add(x.id)}))
  team.players.filter(x=>!used.has(x.id)).sort((a,b)=>b.ovr-a.ovr).slice(0,11-xi.length).forEach(x=>xi.push({...x,ovr:x.ovr*.8*FT(x)}))
  return xi
}
const avg=a=>a.reduce((s,x)=>s+x.ovr,0)/(a.length||1)
export function power(team,t={}){
  const xi=lineup(team,t.form,t.order),m=t.mentality??0,pr=t.press??0,ag=t.aggr??1,w=[.6,.45,.3][t.pass??1],by=p=>xi.filter(x=>x.pos===p)
  const att=(avg(by('MID'))*w+avg(by('FWD'))*(1-w))*(1+.03*m+.015*pr),def=avg([...by('GK'),...by('DEF')])*(1-.03*m+.01*ag)
  return {att,def,xi,aggr:ag}
}
export function simulate(home,away,r,tH={},tA={},from=1,reds0={h:0,a:0}){
  const H=power(home,tH),A=power(away,tA),ev=[],rd={...reds0};let hg=0,ag=0
  for(let min=from;min<=90;min++){
    if(r()>.075)continue
    const hf=1-.09*rd.h,af=1-.09*rd.a
    const homeAtt=r()<(H.att*hf*1.05)/(H.att*hf*1.05+A.att*af),att=homeAtt?H:A,def=homeAtt?A:H,aF=homeAtt?hf:af,dF=homeAtt?af:hf
    if(r()<Math.min(.5,.2*((att.att*aF)/(def.def*dF))**3)){
      const fw=att.xi.filter(x=>x.pos!=='GK'&&x.pos!=='DEF'),sc=fw[Math.floor(r()*fw.length)]||att.xi[5];let as=att.xi[Math.floor(r()*11)];if(as.id===sc.id)as=null
      homeAtt?hg++:ag++
      ev.push({min,type:'goal',home:homeAtt,pid:sc.id,aid:as?as.id:null,sn:sc.name,an:as?as.name:'',text:`⚽ ${sc.name} (${homeAtt?home.name:away.name}) gol!${as?' Asist: '+as.name:''}`})
    } else if(r()<.05){
      const tk=[...att.xi].sort((a,b)=>b.ovr-a.ovr)[0],ok=r()<.45+.5*tk.ovr/99
      if(ok)homeAtt?hg++:ag++
      ev.push({min,type:ok?'goal':'miss',pen:true,home:homeAtt,pid:tk.id,aid:null,sn:tk.name,an:'',text:ok?`⚽ ${tk.name} penaltıdan gol!`:`❌ ${tk.name} penaltıyı kaçırdı!`})
    } else if(r()<.12*(1+.4*def.aggr)){
      const red=r()<.1;if(red){homeAtt?rd.a++:rd.h++}
      ev.push({min,type:'card',home:homeAtt,red,cardHome:!homeAtt,text:`${red?'🟥':'🟨'} ${def.xi[Math.floor(r()*11)].name} kart gördü${red?' — 10 kişi kaldılar!':''}`})
    }
  }
  return {hg,ag,events:ev,xi:[H.xi.map(x=>x.id),A.xi.map(x=>x.id)]}
}
