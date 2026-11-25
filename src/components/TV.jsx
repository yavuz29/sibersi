import {useState,useEffect,useRef} from 'react'
import {newGame} from '../engine/newGame'
import {advanceGame} from '../engine/advance'
import {sorted} from '../engine/season'
import {LEAGUE_NAMES} from '../data/leagues'
import {watch,push,sub} from '../firebase'
import MatchDay from './MatchDay'
import LiveBoard from './LiveBoard'
import {Badge,Card} from '../ui'
export default function TV({onExit}){
  const [code]=useState(()=>Math.random().toString(36).slice(2,6).toUpperCase())
  const [players,setPlayers]=useState({}),[g,setG]=useState(null),[ended,setEnded]=useState({}),[err,setErr]=useState(''),[lm,setLm]=useState(0)
  const pl=useRef({}),pend=useRef({}),oth=useRef({}),adv=useRef(-1),gr=useRef(null);gr.current=g
  useEffect(()=>{const u=[];push(code,'mode','tv').catch(e=>setErr('Firebase ayarı yok: '+e))
    watch(code,p=>{pl.current=p;setPlayers(p)}).then(x=>u.push(x))
    sub(code,'tactics',v=>{oth.current=v}).then(x=>u.push(x))
    sub(code,'transfers',v=>{pend.current=v}).then(x=>u.push(x))
    sub(code,'started',v=>{if(v===true)setG(p=>p||newGame(Object.entries(pl.current).map(([id,x])=>({...x,id})),code,true,null))}).then(x=>u.push(x))
    return()=>u.forEach(f=>f&&f())},[])
  useEffect(()=>{const cur=gr.current;if(!cur)return;const v=Object.values(players),k=cur.season*100+cur.week
    if(v.length&&v.every(p=>p.ready)&&adv.current!==k){adv.current=k;setG(p=>advanceGame(p,pend.current,oth.current))}},[players])
  const T=i=>g.teams[i],key=g?`${g.season}-${g.week}`:''
  const myMs=g?g.results.map((r,i)=>({r,i})).filter(({r})=>T(r.h).human||T(r.a).human):[]
  const allEnded=g&&myMs.length>0&&myMs.every(({r})=>ended[key+'-'+r.h])
  useEffect(()=>{if(allEnded)push(code,`done/${key}`,true).catch(()=>{})},[allEnded,key])
  useEffect(()=>{setLm(0)},[key])
  const chips=Object.values(players),watching=g&&myMs.length>0&&!allEnded
  const top=g?Object.values(g.stats||{}).filter(x=>x.g>0).sort((a,b)=>b.g-a.g).slice(0,5):[]
  return <div className="min-h-screen p-6 space-y-5 text-xl">
    <div className="flex items-center justify-between"><div className="text-3xl font-bold">⚽ Cyberfoot 2026{g&&<span className="text-zinc-400 text-xl"> · Sezon {g.season} · Hafta {g.week}/22</span>}</div><div className="flex items-center gap-3"><span className="bg-purple-800 px-4 py-2 rounded-xl text-3xl tracking-widest">{code}</span><button className="text-sm text-zinc-500" onClick={onExit}>çık</button></div></div>
    {err&&<div className="text-amber-400 text-sm">{err}</div>}
    {!g&&<div className="text-center space-y-4 pt-10"><div className="text-2xl">Telefondan siteyi aç, <b>Online oda</b>'ya şu kodu yaz:</div><div className="text-8xl font-bold tracking-widest text-purple-300">{code}</div>
      <div className="text-zinc-400">Telefonlardan biri "Herkes için başlat"a basınca oyun başlar.</div></div>}
    <div className="flex flex-wrap gap-3">{chips.map((p,i)=><div key={i} className={`px-5 py-3 rounded-2xl ${p.ready?'bg-emerald-700':'bg-zinc-800'}`}><div className="font-bold">{p.club||p.name}</div><div className="text-base">{p.name} · {p.ready?'HAZIR ✅':'Hazırlanıyor ⏳'}</div></div>)}</div>
    {g&&myMs.length===0&&<Card className="text-center text-2xl">Herkes hazır olunca maçlar başlar. Beklenen: {chips.filter(p=>!p.ready).map(p=>p.name).join(', ')||'—'}</Card>}
    {watching&&<div className="grid md:grid-cols-2 gap-4">{myMs.map(({r,i})=><MatchDay key={key+'-'+r.h} g={g} m={r} idx={i} tv onMin={m=>setLm(x=>Math.max(x,m))} onEnd={()=>setEnded(e=>({...e,[key+'-'+r.h]:true}))}/>)}</div>}
    {watching&&<LiveBoard g={g} min={lm}/>}
    {g&&!watching&&g.results.length>0&&<LiveBoard g={g} min={90}/>}
    {g&&!watching&&g.results.length>0&&<div className="grid md:grid-cols-2 gap-4">
      {[...new Set(g.humans.map(h=>T(h.team).league))].map(l=><Card key={l}><div className="font-semibold mb-2">{LEAGUE_NAMES[l]} · Puan durumu</div><table className="w-full text-lg"><tbody>{sorted(g.leagues[l].table).map((r,i)=><tr key={r.id} className={T(r.id).human?'text-emerald-300 font-bold':''}><td>{i+1}</td><td><Badge c={T(r.id).color} s={14}/>{T(r.id).name}</td><td>{r.p}</td><td className="text-right">{r.pts}</td></tr>)}</tbody></table></Card>)}
      <Card><div className="font-semibold mb-2">Bu haftanın sonuçları</div><div className="text-base space-y-1">{g.results.filter(r=>r.lg===T(g.humans[0].team).league).map((r,i)=><div key={i}>{T(r.h).name} <b>{r.hg}-{r.ag}</b> {T(r.a).name}</div>)}</div></Card>
      <Card><div className="font-semibold mb-2">⚽ Gol krallığı</div>{top.map((x,i)=><div key={i}>{i+1}. {x.n} <span className="text-zinc-400">({T(x.t).name})</span> <b>{x.g}</b></div>)}</Card></div>}
  </div>
}
