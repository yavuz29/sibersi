import {useState} from 'react'
import {LEAGUE_NAMES} from '../data/leagues'
import {sorted,liveTable} from '../engine/season'
import {Badge,Card} from '../ui'
export default function LiveBoard({g,min,start}){
  const [lg,setLg]=useState(start||g.teams[g.me].league),T=i=>g.teams[i]
  const rs=g.results.filter(r=>r.lg===lg),sc=(r,h)=>r.events.filter(e=>e.type==='goal'&&e.home===h&&e.min<=min).length
  const tb=sorted(liveTable(g,lg,min)),done=min>=90
  return <Card className="space-y-2">
    <div className="flex items-center justify-between"><div className="font-semibold">{done?'🏁 Maç sonu':<span><span className="text-red-500 animate-pulse">●</span> CANLI {min}'</span>}</div>
      <div className="flex gap-1 flex-wrap">{[1,2,3,4].map(l=><button key={l} onClick={()=>setLg(l)} className={`px-2 py-0.5 rounded text-xs ${lg===l?'bg-emerald-600':'bg-zinc-800'}`}>{LEAGUE_NAMES[l]}</button>)}</div></div>
    <div className="grid md:grid-cols-2 gap-2">
      <div className="space-y-1">{rs.map((r,i)=>{const hot=r.events.some(e=>e.type==='goal'&&e.min<=min&&e.min>min-3&&!done)
        return <div key={i} className={`rounded-lg px-2 py-1 text-sm ${hot?'bg-amber-700/50 animate-pulse':T(r.h).human||T(r.a).human?'bg-sky-900/40':'bg-zinc-800/50'}`}>
          <div className="flex justify-between items-center"><span className="flex-1 truncate"><Badge c={T(r.h).color}/>{T(r.h).name}</span><b className="px-2 bg-black/40 rounded">{sc(r,true)} - {sc(r,false)}</b><span className="flex-1 text-right truncate">{T(r.a).name}<Badge c={T(r.a).color}/></span></div>
          <div className="text-[11px] text-zinc-400">{r.events.filter(e=>e.type==='goal'&&e.min<=min).map(e=>`⚽${e.sn} ${e.min}'`).join('  ')}</div></div>})}</div>
      <table className="w-full text-xs self-start"><thead className="text-zinc-500"><tr><th>#</th><th className="text-left">Canlı tablo</th><th>O</th><th>AV</th><th>P</th></tr></thead><tbody>{tb.map((r,i)=><tr key={r.id} className={`${i<2&&lg>1?'border-l-4 border-emerald-500':i<6&&lg>1&&i>1?'border-l-4 border-yellow-500':i>8&&lg<4?'border-l-4 border-red-500':'border-l-4 border-transparent'} ${r.id===g.me?'bg-emerald-900/40':T(r.id).human?'bg-sky-900/40':''}`}><td className="pl-1">{i+1}</td><td><Badge c={T(r.id).color}/>{T(r.id).name}</td><td className="text-center">{r.p}</td><td className="text-center">{r.gf-r.ga}</td><td className="text-center"><b>{r.pts}</b></td></tr>)}</tbody></table></div></Card>
}
