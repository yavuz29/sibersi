import {useState} from 'react'
import {FORMATIONS,slots,lineup} from '../engine/matchEngine'
import {Card,K,W} from '../ui'
export default function Squad({me,tac,setTac,ord,renew,release}){
  const [sel,setSel]=useState(null),P=id=>me.players.find(p=>p.id===id),S=slots(tac.form),sl="bg-zinc-800 rounded p-1 text-sm"
  const swap=i=>{if(sel===null)return setSel(i);if(sel!==i){const o=[...ord];[o[sel],o[i]]=[o[i],o[sel]];setTac({...tac,order:o})}setSel(null)}
  const setForm=f=>setTac({...tac,form:f,order:lineup(me,f).map(p=>p.id)})
  const fit=p=>Math.round(p.fit??100)
  const chip=i=>{const p=P(ord[i]),bad=i<11&&p.pos!==S[i]
    return <button key={i} onClick={()=>swap(i)} className={`w-16 text-center transition ${sel===i?'scale-110':''}`}>
      <div className={`mx-auto w-11 h-11 rounded-full grid place-items-center font-bold text-sm text-white border-2 shadow ${sel===i?'border-amber-300':bad?'border-red-500':'border-white'}`} style={{background:me.color}}>{Math.round(p.ovr)}</div>
      <div className="text-[10px] leading-tight text-white truncate">{p.inj?'🤕':''}{p.name.split(' ').pop()}</div>
      <div className="h-1 bg-black/40 rounded"><div className={`h-1 rounded ${fit(p)<60?'bg-red-500':'bg-lime-400'}`} style={{width:fit(p)+'%'}}/></div></button>}
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-1"><select className={sl} value={tac.form} onChange={e=>setForm(e.target.value)}>{FORMATIONS.map(f=><option key={f}>{f}</option>)}</select>
      <select className={sl} value={tac.mentality} onChange={e=>setTac({...tac,mentality:+e.target.value})}>{['Çok defansif','Defansif','Dengeli','Ofansif','Çok ofansif'].map((x,i)=><option key={x} value={i-2}>{x}</option>)}</select>
      {[['press','Baskı',['Yok','Orta','Yüksek']],['pass','Pas',['Kısa','Karışık','Uzun']],['aggr','Agresiflik',['Düşük','Orta','Yüksek']]].map(([k,l,o])=><select key={k} className={sl} value={tac[k]??1} onChange={e=>setTac({...tac,[k]:+e.target.value})}>{o.map((x,i)=><option key={x} value={i}>{l}: {x}</option>)}</select>)}
      <button className="bg-zinc-700 px-2 rounded text-sm" onClick={()=>setForm(tac.form)}>Oto diz</button></div>
    <div className="text-xs text-zinc-400">Bir oyuncuya, sonra başka birine dokun: yer değiştirir (saha ↔ yedek). Kırmızı çerçeve = yanlış mevki. Çubuk = kondisyon.</div>
    <div className="rounded-2xl p-3 space-y-5 bg-gradient-to-b from-emerald-600 to-emerald-800 border-2 border-white/60">
      {['FWD','MID','DEF','GK'].map(pos=><div key={pos} className="flex justify-around">{S.map((p,i)=>p===pos&&chip(i))}</div>)}</div>
    <Card><div className="text-sm font-semibold mb-1">Yedekler</div><div className="flex flex-wrap gap-2">{ord.slice(11,18).map((_,i)=>chip(i+11))}</div></Card>
    <div className="space-y-1 text-sm">{ord.map((id,i)=>{const p=P(id);return <div key={id} onClick={()=>swap(i)} className={`flex items-center gap-2 p-1 rounded cursor-pointer ${sel===i?'bg-amber-700':i<11?'bg-zinc-800':'bg-zinc-900'}`}>
      <span className="w-9 text-xs text-zinc-400">{i<11?S[i]:i<18?'YED':'—'}</span><span className="w-9">{p.pos}</span><span className="flex-1 truncate">{p.name} ({p.age}){p.inj?` 🤕${p.inj}h`:''}{p.loanOf!=null?' 🔁':''}</span>
      <span className="w-10 text-xs">{fit(p)}%</span><span className="text-xs text-zinc-400 hidden sm:inline">{p.contract||2}y · {K(W(p))}/hf</span><b className="w-7 text-right">{p.ovr}</b>
      {(p.contract||2)<=1&&<button className="bg-sky-700 px-1 rounded text-xs" onClick={e=>{e.stopPropagation();renew(p)}}>Uzat</button>}
      <button className="px-1 rounded text-xs bg-red-900" onClick={e=>{e.stopPropagation();release(p)}}>✕</button></div>})}</div></div>
}
