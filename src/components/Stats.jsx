import {useState} from 'react'
import {Badge,Card} from '../ui'
import {LEAGUE_NAMES} from '../data/leagues'
export default function Stats({g}){
  const [lg,setLg]=useState(0),all=Object.values(g.stats||{}).filter(x=>!lg||g.teams[x.t].league===lg)
  const top=k=>[...all].filter(x=>x[k]>0).sort((a,b)=>b[k]-a[k]).slice(0,10)
  const List=({k,title})=><Card className="flex-1"><div className="font-semibold mb-1">{title}</div>{top(k).map((x,i)=><div key={i} className="flex text-sm gap-2"><span className="w-5">{i+1}</span><span className="flex-1"><Badge c={g.teams[x.t].color}/>{x.n} <span className="text-zinc-500">({g.teams[x.t].name})</span></span><b>{x[k]}</b></div>)}{!top(k).length&&<div className="text-zinc-500 text-sm">Henüz yok</div>}</Card>
  return <div className="space-y-2"><div className="flex gap-1 flex-wrap">{[0,1,2,3,4].map(l=><button key={l} onClick={()=>setLg(l)} className={`px-2 py-1 rounded text-sm ${lg===l?'bg-emerald-600':'bg-zinc-800'}`}>{l?LEAGUE_NAMES[l]:'Tümü'}</button>)}</div>
    <div className="flex flex-col sm:flex-row gap-2"><List k="g" title="⚽ Gol krallığı"/><List k="a" title="🅰️ Asist krallığı"/></div></div>
}
