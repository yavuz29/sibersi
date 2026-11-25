import {useState} from 'react'
import {sorted} from '../engine/season'
import {aiManager} from '../engine/managers'
import {LEAGUE_NAMES} from '../data/leagues'
import {Badge,Card,K} from '../ui'
export default function Managers({g,jobs,take,open,setOpen}){
  const T=i=>g.teams[i],me=T(g.me),[lg,setLg]=useState(me.league),[al,setAl]=useState(me.league)
  const tbl=sorted(g.leagues[lg].table)
  const apply=t=>{if(window.confirm(`${me.name} takımından istifa edip ${t.name} takımına geçmek istiyor musun?`))take({id:t.id,name:t.name})}
  const free=sorted(g.leagues[al].table).filter(r=>!T(r.id).human&&r.id!==g.me)
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><div className="font-semibold text-lg">🧑‍💼 Menajerler</div><button className="bg-red-800 px-3 py-1 rounded" onClick={()=>setOpen(true)}>🚪 İstifa et</button></div>
    <div className="flex gap-1 flex-wrap">{[1,2,3,4].map(l=><button key={l} onClick={()=>setLg(l)} className={`px-3 py-1 rounded-lg ${lg===l?'bg-emerald-600':'bg-zinc-800'}`}>{LEAGUE_NAMES[l]}</button>)}</div>
    <Card><table className="w-full text-sm"><thead className="text-zinc-500 text-xs"><tr><th>#</th><th className="text-left">Kulüp</th><th className="text-left">Menajer</th><th>P</th><th>Kasa</th></tr></thead><tbody>
      {tbl.map((r,i)=>{const t=T(r.id);return <tr key={r.id} className={r.id===g.me?'bg-emerald-900/40':t.human?'bg-sky-900/40':''}><td className="pl-1">{i+1}</td><td><Badge c={t.color}/>{t.name}</td>
        <td>{t.human?<span>👤 <b>{t.human}</b><span className="text-[11px] text-zinc-400"> 😡{t.fanA??20}% 😠{t.boardA??20}%</span></span>:<span className="text-zinc-300">🎽 {aiManager(t.id)}</span>}</td><td className="text-center"><b>{r.pts}</b></td><td className="text-center text-zinc-400">{K(t.budget)}</td></tr>})}</tbody></table>
      <div className="text-xs text-zinc-500 mt-2">👤 insan menajer · 🎽 bilgisayar menajeri</div></Card>
    {open&&<div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-3"><div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 max-w-lg w-full max-h-[85vh] overflow-auto space-y-3">
      <div className="font-bold text-lg">🚪 İstifa et ve yeni kulüp seç</div>
      <div className="text-sm text-zinc-400">Şu an: {me.name} ({LEAGUE_NAMES[me.league]}). İstifa edince seçtiğin kulübe geçersin; yeni kulüpte öfke %25'ten başlar.</div>
      {jobs.length>0&&<div className="space-y-1"><div className="font-semibold text-sm">📨 Gelen teklifler</div>{jobs.map(o=><div key={o.id} className="flex items-center gap-2 text-sm"><span className="flex-1"><Badge c={o.color}/>{o.name} · {LEAGUE_NAMES[T(o.id).league]} {o.kind==='up'?'⬆️':'⬇️'}</span><button className="bg-sky-700 px-2 py-1 rounded" onClick={()=>apply(o)}>Geç</button></div>)}</div>}
      <div className="space-y-1"><div className="font-semibold text-sm">Başvurabileceğin kulüpler (kendi ligin ve altı)</div>
        <div className="flex gap-1 flex-wrap">{[1,2,3,4].filter(l=>l>=me.league).map(l=><button key={l} onClick={()=>setAl(l)} className={`px-2 py-0.5 rounded text-xs ${al===l?'bg-emerald-600':'bg-zinc-800'}`}>{LEAGUE_NAMES[l]}</button>)}</div>
        {!(al>=me.league)&&<div className="text-xs text-zinc-500">Üst lig için teklif beklemelisin.</div>}
        {al>=me.league&&free.map(r=>{const t=T(r.id);return <div key={r.id} className="flex items-center gap-2 text-sm"><span className="flex-1 truncate"><Badge c={t.color}/>{t.name} <span className="text-zinc-500">· {r.pts}p · {K(t.budget)}</span></span><button className="bg-sky-700 px-2 py-1 rounded" onClick={()=>apply(t)}>Başvur</button></div>})}
        <div className="text-xs text-zinc-500">🔒 Üst lig kulüpleri: 10 galibiyet veya ilk 2'de bitirme sonrası teklif gelir.</div></div>
      <button className="w-full bg-zinc-700 py-2 rounded-lg" onClick={()=>setOpen(false)}>Vazgeç</button></div></div>}
  </div>
}
