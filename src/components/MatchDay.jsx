import {useState,useEffect} from 'react'
import {simulate,rng} from '../engine/matchEngine'
import {sfx} from '../engine/sound'
import {Badge,Card} from '../ui'
const A=['Çok defansif','Defansif','Dengeli','Ofansif','Çok ofansif']
export default function MatchDay({g,m,idx,tac,setTac,onFix,onEnd,tv,gpause,pmin,pby,onPause,otacs}){
  const mine=!tv&&(m.h===g.me||m.a===g.me),home=m.h===g.me,P=id=>g.teams[g.me].players.find(p=>p.id===id)
  const [min,setMin]=useState(0),[sp,setSp]=useState(2),[pause,setPause]=useState(false),[panel,setPanel]=useState(false),[subs,setSubs]=useState(0),[out,setOut]=useState(0),[inn,setInn]=useState(11),[pen,setPen]=useState(null)
  useEffect(()=>{setMin(0);setSubs(0);setPause(false);setPanel(false);setPen(null)},[g.week,m.h])
  useEffect(()=>{
    if(min>=90){(mine||tv)&&onEnd&&onEnd();return}
    if(pause||pen||gpause)return
    const e=mine&&m.events.find(x=>x.pen&&x.home===home&&!x.decided&&x.min===min+1)
    if(e){setPen(e);onPause&&onPause(true,min);return}
    const t=setTimeout(()=>setMin(x=>x+1),400/sp);return()=>clearTimeout(t)
  },[min,sp,pause,pen,m,gpause])
  useEffect(()=>{if(gpause&&pmin!=null&&min!==pmin)setMin(pmin)},[gpause,pmin])
  useEffect(()=>{if(min===0)return;if(min===90)sfx('whistle');m.events.filter(y=>y.min===min).forEach(y=>sfx(y.type==='goal'?'goal':y.type==='card'?'card':y.type==='miss'?'miss':''))},[min])
  const ev=m.events.filter(e=>e.min<=min),G=(e,h)=>e.filter(x=>x.type==='goal'&&x.home===h).length
  const apply=nt=>{
    const r=rng(g.week*7919+min*31+subs),keep=m.events.filter(e=>e.min<=min),rest=m.events.filter(e=>e.min>min&&e.decided)
    const res=simulate(g.teams[m.h],g.teams[m.a],r,home?nt:(otacs?.[m.h]||{}),home?(otacs?.[m.a]||{}):nt,min+1,{h:keep.filter(e=>e.red&&e.cardHome).length,a:keep.filter(e=>e.red&&!e.cardHome).length})
    const events=[...keep,...res.events];setTac(nt);onFix(idx,{hg:G(events,true),ag:G(events,false),events})
  }
  const decide=tk=>{
    const ok=rng(g.week*1009+tk.id)()<.45+.5*tk.ovr/99
    const ne={...pen,type:ok?'goal':'miss',pid:tk.id,aid:null,sn:tk.name,decided:true,text:ok?`⚽ ${tk.name} penaltıdan gol!`:`❌ ${tk.name} penaltıyı kaçırdı!`}
    const events=m.events.map(x=>x===pen?ne:x);setPen(null);onPause&&onPause(false,min);onFix(idx,{hg:G(events,true),ag:G(events,false),events})
  }
  const sub=()=>{const o=[...tac.order];[o[out],o[inn]]=[o[inn],o[out]];setSubs(subs+1);apply({...tac,order:o})}
  const sel="bg-zinc-800 rounded p-1"
  return <Card className="space-y-2">
    <div className="flex items-center justify-between text-lg"><span><Badge c={g.teams[m.h].color} s={14}/><b>{g.teams[m.h].name}</b></span><b className="bg-black/40 px-3 rounded text-2xl">{G(ev,true)} - {G(ev,false)}</b><span><b>{g.teams[m.a].name}</b><Badge c={g.teams[m.a].color} s={14}/></span></div>
    <div className="h-1 bg-zinc-800 rounded"><div className="h-1 bg-emerald-500 rounded" style={{width:min/.9+'%'}}/></div>
    {gpause&&!pause&&<div className="text-amber-300 text-sm">⏸ {pby||'Biri'} maçı durdurdu, bekleniyor…</div>}
    <div className="flex items-center gap-1 text-sm"><span className="mr-2">{min}'</span>{[1,2,4].map(s=><button key={s} onClick={()=>setSp(s)} className={`px-2 rounded ${sp===s?'bg-emerald-600':'bg-zinc-700'}`}>{s}x</button>)}<button className="px-2 rounded bg-zinc-700" onClick={()=>setMin(90)}>⏭</button>
      {mine&&min<90&&<button className="ml-auto bg-amber-600 px-2 rounded" onClick={()=>{setPanel(!panel);setPause(!panel);onPause&&onPause(!panel,min)}}>⚙ Taktik / Değişiklik</button>}</div>
    <div className="text-sm space-y-0.5 max-h-44 overflow-auto">{[...ev].reverse().map((e,i)=><div key={i} className={e.type==='goal'?'text-emerald-300 font-semibold':'text-zinc-300'}>{e.min}' {e.text}</div>)}</div>
    {pen&&<div className="bg-amber-900/40 border border-amber-600 rounded-lg p-2 text-sm"><b>⚽ PENALTI! Vuracak oyuncuyu seç:</b><div className="grid grid-cols-2 gap-1 mt-1">{tac.order.slice(0,11).map(id=>{const p=P(id);return <button key={id} className="bg-zinc-800 hover:bg-zinc-700 rounded p-1 text-left" onClick={()=>decide(p)}>{p.name} · %{Math.round((.45+.5*p.ovr/99)*100)}</button>})}</div></div>}
    {panel&&mine&&<div className="bg-zinc-800/60 rounded-lg p-2 text-sm space-y-2">
      <div className="flex flex-wrap gap-1"><select className={sel} value={tac.mentality} onChange={e=>apply({...tac,mentality:+e.target.value})}>{A.map((x,i)=><option key={x} value={i-2}>{x}</option>)}</select>
        {[['press','Baskı',['Yok','Orta','Yüksek']],['pass','Pas',['Kısa','Karışık','Uzun']],['aggr','Agresiflik',['Düşük','Orta','Yüksek']]].map(([k,l,o])=><select key={k} className={sel} value={tac[k]??1} onChange={e=>apply({...tac,[k]:+e.target.value})}>{o.map((x,i)=><option key={x} value={i}>{l}: {x}</option>)}</select>)}</div>
      <div>Değişiklik ({subs}/3): <select className={sel} value={out} onChange={e=>setOut(+e.target.value)}>{tac.order.slice(0,11).map((id,i)=><option key={id} value={i}>{P(id).name} ({Math.round(P(id).fit??100)}%)</option>)}</select> → <select className={sel} value={inn} onChange={e=>setInn(+e.target.value)}>{tac.order.slice(11,18).map((id,i)=><option key={id} value={i+11}>{P(id).name} ({P(id).pos})</option>)}</select>
        <button disabled={subs>=3} className="bg-sky-700 disabled:opacity-30 px-2 rounded ml-1" onClick={sub}>Değiştir</button></div>
      <button className="bg-emerald-700 px-3 py-1 rounded" onClick={()=>{setPanel(false);setPause(false);onPause&&onPause(false,min)}}>▶ Maça devam</button></div>}
  </Card>
}
