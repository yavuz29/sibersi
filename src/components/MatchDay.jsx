import {useState,useEffect} from 'react'
import {simulate,rng} from '../engine/matchEngine'
export default function MatchDay({g,m,idx,tac,setTac,onFix,live}){
  const [min,setMin]=useState(0),[sp,setSp]=useState(2),[pause,setPause]=useState(false),[subs,setSubs]=useState(0),[out,setOut]=useState(0),[inn,setInn]=useState(11)
  useEffect(()=>{setMin(0);setSubs(0);setPause(false)},[g.week,m.h])
  useEffect(()=>{if(pause||min>=90)return;const t=setTimeout(()=>setMin(x=>x+1),400/sp);return()=>clearTimeout(t)},[min,sp,pause])
  const ev=m.events.filter(e=>e.min<=min),G=(e,h)=>e.filter(x=>x.type==='goal'&&x.home===h).length
  const mine=live&&(m.h===g.me||m.a===g.me),P=id=>g.teams[g.me].players.find(p=>p.id===id)
  const apply=nt=>{
    const home=m.h===g.me,r=rng(g.week*7919+min*31+subs),keep=m.events.filter(e=>e.min<=min)
    const res=simulate(g.teams[m.h],g.teams[m.a],r,home?nt:{},home?{}:nt,min+1,{h:keep.filter(e=>e.red&&e.cardHome).length,a:keep.filter(e=>e.red&&!e.cardHome).length})
    setTac(nt);onFix(idx,{hg:G(keep,true)+res.hg,ag:G(keep,false)+res.ag,events:[...keep,...res.events]})
  }
  const sub=()=>{const o=[...tac.order];[o[out],o[inn]]=[o[inn],o[out]];setSubs(subs+1);apply({...tac,order:o})}
  return <div className="bg-zinc-900 p-3 rounded"><div className="flex justify-between"><b>{g.teams[m.h].name} {G(ev,true)}-{G(ev,false)} {g.teams[m.a].name}</b><span>{min}'</span></div>
    <div className="flex gap-1 my-1">{[1,2,4].map(s=><button key={s} onClick={()=>setSp(s)} className={`px-2 rounded ${sp===s?'bg-emerald-600':'bg-zinc-700'}`}>{s}x</button>)}</div>
    <div className="text-sm space-y-0.5 max-h-40 overflow-auto">{ev.map((e,i)=><div key={i}>{e.min}' {e.text}</div>)}</div>
    {mine&&min<90&&<div className="mt-2 text-sm space-y-1 border-t border-zinc-700 pt-2">
      <button className="bg-zinc-700 px-2 rounded" onClick={()=>setPause(!pause)}>{pause?'▶ Devam':'⏸ Duraklat / Taktik'}</button>
      {pause&&<><div>Oyun anlayışı: <select className="bg-zinc-800 rounded" value={tac.mentality} onChange={e=>apply({...tac,mentality:+e.target.value})}>{[-2,-1,0,1,2].map(v=><option key={v} value={v}>{['Çok defansif','Defansif','Dengeli','Ofansif','Çok ofansif'][v+2]}</option>)}</select></div>
        <div>Değişiklik ({subs}/3): <select className="bg-zinc-800 rounded" value={out} onChange={e=>setOut(+e.target.value)}>{tac.order.slice(0,11).map((id,i)=><option key={id} value={i}>{P(id).name}</option>)}</select> → <select className="bg-zinc-800 rounded" value={inn} onChange={e=>setInn(+e.target.value)}>{tac.order.slice(11).map((id,i)=><option key={id} value={i+11}>{P(id).name}</option>)}</select>
        <button disabled={subs>=3} className="bg-sky-700 disabled:opacity-30 px-2 rounded ml-1" onClick={sub}>Değiştir</button></div></>}</div>}</div>
}
