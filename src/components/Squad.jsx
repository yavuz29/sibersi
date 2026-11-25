import {useState} from 'react'
import {FORMATIONS,slots,lineup} from '../engine/matchEngine'
import {Card,K,W} from '../ui'
export default function Squad({me,tac,setTac,ord,renew,release}){
  const [sel,setSel]=useState(null),P=id=>me.players.find(p=>p.id===id),S=slots(tac.form),sl="bg-zinc-800 rounded p-1 text-sm"
  const swap=i=>{if(sel===null)return setSel(i);if(sel!==i){const o=[...ord];[o[sel],o[i]]=[o[i],o[sel]];setTac({...tac,order:o})}setSel(null)}
  const setForm=f=>setTac({...tac,form:f,order:lineup(me,f).map(p=>p.id)})
  const fit=p=>Math.round(p.fit??100)
  const tier=v=>v>=75?'from-yellow-300 to-amber-500':v>=62?'from-slate-200 to-slate-400':'from-orange-300 to-orange-600'
  const chip=i=>{const p=P(ord[i]),bad=i<11&&p.pos!==S[i]
    return <button key={i} onClick={()=>swap(i)} className={`w-[68px] text-center transition ${sel===i?'scale-110 z-10':''}`}>
      <div className={`rounded-lg bg-gradient-to-b ${tier(p.ovr)} text-black px-1 py-1 shadow-lg border-2 ${sel===i?'border-white':bad?'border-red-500':'border-black/30'}`}>
        <div className="flex justify-between items-end leading-none"><b className="text-lg">{Math.round(p.ovr)}</b><span className="text-[9px] font-bold">{p.pos}</span></div>
        <div className="text-[10px] font-semibold truncate">{p.inj?'🤕':''}{p.name.split(' ').pop()}</div></div>
      <div className="h-1 mt-0.5 bg-black/50 rounded"><div className={`h-1 rounded ${fit(p)<60?'bg-red-500':'bg-lime-400'}`} style={{width:fit(p)+'%'}}/></div></button>}
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-1"><select className={sl} value={tac.form} onChange={e=>setForm(e.target.value)}>{FORMATIONS.map(f=><option key={f}>{f}</option>)}</select>
      <select className={sl} value={tac.mentality} onChange={e=>setTac({...tac,mentality:+e.target.value})}>{['Çok defansif','Defansif','Dengeli','Ofansif','Çok ofansif'].map((x,i)=><option key={x} value={i-2}>{x}</option>)}</select>
      {[['press','Baskı',['Yok','Orta','Yüksek']],['pass','Pas',['Kısa','Karışık','Uzun']],['aggr','Agresiflik',['Düşük','Orta','Yüksek']]].map(([k,l,o])=><select key={k} className={sl} value={tac[k]??1} onChange={e=>setTac({...tac,[k]:+e.target.value})}>{o.map((x,i)=><option key={x} value={i}>{l}: {x}</option>)}</select>)}
      <button className="bg-zinc-700 px-2 rounded text-sm" onClick={()=>setForm(tac.form)}>Oto diz</button></div>
    <div className="text-xs text-zinc-400">Bir oyuncuya, sonra başka birine dokun: yer değiştirir (saha ↔ yedek). Kırmızı çerçeve = yanlış mevki. Çubuk = kondisyon.</div>
    <div className="grass relative rounded-2xl p-3 border-2 border-white/70 overflow-hidden min-h-[430px] flex flex-col justify-between"><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 140" preserveAspectRatio="none" fill="none" stroke="white" strokeOpacity=".35" strokeWidth=".6"><rect x="2" y="2" width="96" height="136"/><line x1="2" y1="70" x2="98" y2="70"/><circle cx="50" cy="70" r="12"/><rect x="25" y="2" width="50" height="20"/><rect x="25" y="118" width="50" height="20"/><rect x="38" y="2" width="24" height="8"/><rect x="38" y="130" width="24" height="8"/></svg>
      {['FWD','MID','DEF','GK'].map(pos=><div key={pos} className="flex justify-around relative">{S.map((p,i)=>p===pos&&chip(i))}</div>)}</div>
    <Card><div className="text-sm font-semibold mb-1">Yedekler</div><div className="flex flex-wrap gap-2">{ord.slice(11,18).map((_,i)=>chip(i+11))}</div></Card>
    <div className="space-y-1 text-sm">{ord.map((id,i)=>{const p=P(id);return <div key={id} onClick={()=>swap(i)} className={`flex items-center gap-2 p-1 rounded cursor-pointer ${sel===i?'bg-amber-700':i<11?'bg-zinc-800':'bg-zinc-900'}`}>
      <span className="w-9 text-xs text-zinc-400">{i<11?S[i]:i<18?'YED':'—'}</span><span className="w-9">{p.pos}</span><span className="flex-1 truncate">{p.name} ({p.age}){p.inj?` 🤕${p.inj}h`:''}{p.loanOf!=null?' 🔁':''}</span>
      <span className="w-10 text-xs">{fit(p)}%</span><span className="text-xs text-zinc-400 hidden sm:inline">{p.contract||2}y · {K(W(p))}/hf</span><b className="w-7 text-right">{p.ovr}</b>
      {(p.contract||2)<=1&&<button className="bg-sky-700 px-1 rounded text-xs" onClick={e=>{e.stopPropagation();renew(p)}}>Uzat</button>}
      <button className="px-1 rounded text-xs bg-red-900" onClick={e=>{e.stopPropagation();release(p)}}>✕</button></div>})}</div></div>
}
