import {useState,useEffect} from 'react'
import {applyOp} from '../engine/economy'
import {rng} from '../engine/matchEngine'
import {push,sub} from '../firebase'
import {K,Badge,Card,Pos,Ovr} from '../ui'
const LG=['Tümü','Süper Lig','2. Lig','3. Lig','4. Lig']
export default function Market({g,setG,notify}){
  const me=g.teams[g.me],ai=g.teams.filter(t=>!t.human),full=me.players.length>=26
  const [mode,setMode]=useState('club'),[f,setF]=useState({pos:'',lg:0,amin:'',amax:'',omin:'',pmax:'',q:'',sort:'ovr'}),[neg,setNeg]=useState(null),[offers,setOffers]=useState({}),[pend,setPend]=useState({}),[fee,setFee]=useState({}),[conf,setConf]=useState(null),[bids,setBids]=useState(null)
  useEffect(()=>{if(!g.room)return;const u=[];sub(g.room,'offers',setOffers).then(x=>u.push(x));sub(g.room,'transfers',setPend).then(x=>u.push(x));return()=>u.forEach(h=>h&&h())},[g.room])
  const nameOf=id=>{for(const t of g.teams){const p=t.players.find(x=>x.id===id);if(p)return p.name}return g.free.find(x=>x.id===id)?.name||'Oyuncu'}
  const mk=(t,p,price,x={})=>({p,tid:t.id,from:t.name,lg:t.league,price,...x})
  let rows=[]
  if(mode==='club')rows=ai.flatMap(t=>t.players.filter(p=>!p.loanOf).map(p=>mk(t,p,p.value)))
  if(mode==='loan')rows=ai.flatMap(t=>[...t.players].sort((a,b)=>b.ovr-a.ovr).slice(6).filter(p=>!p.loanOf).map(p=>mk(t,p,Math.round(p.value*.3))))
  if(mode==='free')rows=g.free.map(p=>({p,tid:-1,from:'Serbest',lg:0,price:Math.round(p.value*.3)}))
  if(mode==='sell')rows=me.players.map(p=>mk(me,p,Math.round(p.value*.6)))
  if(mode==='friends')rows=g.teams.filter(t=>t.human&&t.id!==g.me).flatMap(t=>t.players.map(p=>mk(t,p,p.value,{to:t.id})))
  const has=v=>v!==''
  rows=rows.filter(r=>(!f.pos||r.p.pos===f.pos)&&(!f.lg||r.lg===f.lg)&&(!has(f.amin)||r.p.age>=f.amin)&&(!has(f.amax)||r.p.age<=f.amax)&&(!has(f.omin)||r.p.ovr>=f.omin)&&(!has(f.pmax)||r.price<=f.pmax*1000)&&(!f.q||r.p.name.toLowerCase().includes(f.q.toLowerCase())))
  rows.sort((a,b)=>f.sort==='ovr'?b.p.ovr-a.p.ovr:f.sort==='age'?a.p.age-b.p.age:a.price-b.price)
  const total=rows.length;rows=rows.slice(0,40)
  const logAdd=(n,text)=>({...n,log:[{text,week:g.week,season:g.season},...(g.log||[]).slice(0,29)]})
  const commit=(o,text,type='ok')=>{
    if(g.room){push(g.room,`transfers/${Date.now().toString(36)}${g.me}${o.pid}`,{...o,week:g.week,season:g.season});setG(logAdd(g,'⏳ '+text));notify('⏳ '+text+' — hafta geçişinde uygulanır','wait')}
    else{setG(logAdd(applyOp(g,o),text));notify(text,type)}
  }
  const ask=(title,lines,fn)=>setConf({title,lines,fn})
  const reserve=n=>Math.round(n.r.p.value*(1.05+.25*rng(n.r.p.id*17+g.week*3+g.season)())*(1+.4*Math.max(0,me.league-n.r.lg)))
  const accept=o=>{const p=neg.r.p;if(o>me.budget||full)return;commit({pid:p.id,to:g.me,fee:o},`✅ ${p.name} satın alındı (${K(o)})`);setNeg(null)}
  const offer=()=>{const o=Math.round(+neg.offer*1000),res=reserve(neg)
    if(neg.locked)return
    if(full)return setNeg({...neg,msg:'Kadro dolu (26)'})
    if(o>me.budget)return setNeg({...neg,msg:'Kasan yetmiyor'})
    if(o>=res)return accept(o)
    const t=neg.tries+1
    if(t>=4)return setNeg({...neg,tries:t,locked:true,counter:null,msg:'Kulüp pazarlığı bitirdi, bu hafta teklif kabul etmiyor.'})
    if(o>=res*.88)return setNeg({...neg,tries:t,counter:res,msg:`Kulüp ${K(res)} istiyor.`})
    setNeg({...neg,tries:t,counter:null,msg:'Teklif çok düşük, reddedildi.'})}
  const openBids=r=>{if(me.players.length<=14)return notify('Kadro en az 14 kişi olmalı','bad');const rg=rng(r.p.id*13+g.week*5+g.season*3)
    setBids({r,list:[...ai].sort(()=>rg()-.5).slice(0,3).map(t=>({t,fee:Math.round(r.p.value*(.55+.4*rg()))})).sort((a,b)=>b.fee-a.fee)})}
  const sell=(r,b)=>ask('Satışı onayla',[`${r.p.name} → ${b.t.name}`,`Gelen: ${K(b.fee)} · Kasa ${K(me.budget)} → ${K(me.budget+b.fee)}`],()=>{commit({pid:r.p.id,to:b.t.id,fee:b.fee},`💸 ${r.p.name} satıldı: ${b.t.name} (+${K(b.fee)})`,'sell');setBids(null)})
  const inc=Object.values(offers).filter(o=>o.to===g.me&&!o.status)
  const answer=(o,ok)=>{const can=ok&&g.teams[o.from].budget>=o.fee;if(can)push(g.room,`transfers/${o.id}`,{pid:o.pid,to:o.from,fee:o.fee,week:g.week,season:g.season});push(g.room,`offers/${o.id}`,{...o,status:can?'ok':'no'});notify(can?`✅ ${o.pn} teklifi kabul edildi (hafta geçişinde)`:'Teklif reddedildi',can?'wait':'bad')}
  const act=r=>{const p=r.p
    if(mode==='club')setNeg({r,offer:Math.round(p.value/1000),tries:0,msg:'',counter:null})
    else if(mode==='loan')ask('Kiralama',[`${p.name} · güç ${p.ovr} · ${r.from}`,`Bedel ${K(r.price)} · Kasa ${K(me.budget)} → ${K(me.budget-r.price)}`,'Sezon sonunda kendi kulübüne döner'],()=>commit({op:'loan',pid:p.id,to:g.me,fee:r.price,from:r.tid},`🔁 ${p.name} kiralandı (${K(r.price)})`))
    else if(mode==='free')ask('Serbest oyuncu',[`${p.name} · güç ${p.ovr} · ${p.age} yaş`,`İmza bedeli ${K(r.price)} · Kasa ${K(me.budget)} → ${K(me.budget-r.price)}`],()=>commit({pid:p.id,to:g.me,fee:r.price},`✍️ ${p.name} imzaladı (${K(r.price)})`))
    else if(mode==='sell')openBids(r)
    else{const oid=Date.now().toString(36);push(g.room,`offers/${oid}`,{id:oid,from:g.me,to:r.to,pid:p.id,fee:(+fee[p.id]||r.price/1000)*1000,pn:p.name});notify(`📨 Teklif gönderildi: ${p.name}`,'wait')}}
  const CAP=[0,99,80,72,66],loans=me.players.filter(p=>p.loanOf!=null).length,refuse=r=>r.p.ovr>CAP[me.league]
  const why=r=>mode==='sell'||mode==='friends'?'':full?'Kadro dolu':refuse(r)?'Bu ligde oynamaz':(mode==='loan'&&loans>=2)?'Max 2 kiralık':(mode!=='club'&&me.budget<r.price)?'Kasa yetmez':''
  const lbl={club:'Pazarlık',loan:'Kirala',free:'İmzala',sell:'Teklif iste',friends:'Teklif'}[mode],sl="bg-zinc-800 rounded p-1 text-sm",inp="bg-zinc-800 rounded p-1 w-16 text-sm"
  const set=(k,v)=>setF({...f,[k]:v})
  const mine=Object.entries(pend).filter(([id,t])=>t.week===g.week&&t.season===g.season&&!(g.applied||[]).includes(id)&&(t.to===g.me||me.players.some(p=>p.id===t.pid)))
  return <div className="space-y-2">
    <div className="text-sm flex gap-3"><span>💰 Kasa: <b>{K(me.budget)}</b></span><span>👕 Kadro {me.players.length}/26</span>{g.room&&<span className="text-zinc-400">Online: işlemler hafta geçişinde uygulanır</span>}</div>
    {inc.map(o=><div key={o.id} className="bg-amber-900/40 p-2 rounded text-sm">📨 {g.teams[o.from].name} → {o.pn} için {K(o.fee)} teklif <button className="bg-emerald-600 px-2 rounded mx-1" onClick={()=>answer(o,true)}>Kabul</button><button className="bg-red-700 px-2 rounded" onClick={()=>answer(o,false)}>Red</button></div>)}
    {mine.length>0&&<Card className="text-sm space-y-1"><div className="font-semibold">⏳ Bekleyen işlemler</div>{mine.map(([id,t])=><div key={id}>{t.op==='renew'?'Uzatma':t.op==='loan'?'Kiralama':t.to<0?'Serbest bırakma':t.to===g.me?'Alım':'Satış'}: {nameOf(t.pid)}{t.fee?` · ${K(t.fee)}`:''}</div>)}</Card>}
    {(g.log||[]).length>0&&<Card className="text-sm space-y-0.5"><div className="font-semibold">🧾 Son işlemler</div>{g.log.slice(0,6).map((l,i)=><div key={i} className="text-zinc-300">{l.text} <span className="text-zinc-500 text-xs">S{l.season} H{l.week}</span></div>)}</Card>}
    <div className="flex flex-wrap gap-1">{[['club','Kulüplerden'],['loan','Kiralık'],['free','Serbest'],['sell','Satış'],['friends','Arkadaşlar']].map(([k,l])=>(k!=='friends'||g.room)&&<button key={k} onClick={()=>{setMode(k);setNeg(null);setBids(null)}} className={`px-3 py-1 rounded ${mode===k?'bg-emerald-600':'bg-zinc-800'}`}>{l}</button>)}</div>
    <Card className="flex flex-wrap gap-1 items-center text-xs">
      <input className="bg-zinc-800 rounded p-1 text-sm w-28" placeholder="İsim ara" value={f.q} onChange={e=>set('q',e.target.value)}/>
      <select className={sl} value={f.pos} onChange={e=>set('pos',e.target.value)}><option value="">Mevki</option>{['GK','DEF','MID','FWD'].map(x=><option key={x}>{x}</option>)}</select>
      {mode!=='free'&&mode!=='sell'&&mode!=='friends'&&<select className={sl} value={f.lg} onChange={e=>set('lg',+e.target.value)}>{LG.map((x,i)=><option key={x} value={i}>{x}</option>)}</select>}
      Yaş <input className={inp} type="number" placeholder="min" value={f.amin} onChange={e=>set('amin',e.target.value)}/><input className={inp} type="number" placeholder="max" value={f.amax} onChange={e=>set('amax',e.target.value)}/>
      Güç ≥ <input className={inp} type="number" value={f.omin} onChange={e=>set('omin',e.target.value)}/> Fiyat ≤ <input className={inp} type="number" placeholder="K" value={f.pmax} onChange={e=>set('pmax',e.target.value)}/>
      <select className={sl} value={f.sort} onChange={e=>set('sort',e.target.value)}><option value="ovr">Güç</option><option value="age">Genç</option><option value="price">Ucuz</option></select></Card>
    {neg&&<div className="bg-amber-900/30 border border-amber-700 rounded-xl p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2"><Pos p={neg.r.p.pos}/><Ovr v={neg.r.p.ovr}/><b>{neg.r.p.name}</b> ({neg.r.p.age}) · {neg.r.from} · Değer {K(neg.r.p.value)}</div>
      <div className="flex gap-2 items-center"><input type="number" className="bg-zinc-800 rounded p-1 w-24" value={neg.offer} onChange={e=>setNeg({...neg,offer:e.target.value})}/> K <button className="bg-emerald-600 px-3 py-1 rounded" onClick={offer}>Teklif ver</button><button className="bg-zinc-700 px-3 py-1 rounded" onClick={()=>setNeg(null)}>Vazgeç</button></div>
      {neg.msg&&<div className="text-amber-300">{neg.msg}</div>}
      {neg.counter&&<button className="bg-sky-700 px-3 py-1 rounded" onClick={()=>accept(neg.counter)}>Karşı teklifi kabul et ({K(neg.counter)})</button>}</div>}
    {bids&&<div className="bg-sky-900/30 border border-sky-700 rounded-xl p-3 space-y-2 text-sm"><div className="font-semibold">📨 {bids.r.p.name} için gelen teklifler</div>
      {bids.list.map(b=><div key={b.t.id} className="flex items-center gap-2"><span className="flex-1"><Badge c={b.t.color}/>{b.t.name} · {LG[b.t.league]}</span><b>{K(b.fee)}</b><button className="bg-emerald-600 px-3 py-1 rounded" onClick={()=>sell(bids.r,b)}>Sat</button></div>)}
      <button className="bg-zinc-700 px-3 py-1 rounded" onClick={()=>setBids(null)}>Satmaktan vazgeç</button></div>}
    <div className="text-xs text-zinc-400">{total} sonuç (ilk 40 gösteriliyor)</div>
    <div className="space-y-1 text-sm">{rows.map(r=>{const w=why(r);return <div key={r.p.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg"><Pos p={r.p.pos}/><Ovr v={r.p.ovr}/>
      <span className="flex-1 truncate">{r.p.name} ({r.p.age}) · {r.lg?<Badge c={g.teams[r.tid].color}/>:null}{r.from}{r.lg?` · ${LG[r.lg]}`:''}</span>
      {mode==='friends'&&<input className={inp} placeholder={K(r.price)} onChange={e=>setFee({...fee,[r.p.id]:e.target.value})}/>}
      {w&&<span className="text-[11px] text-red-400">{w}</span>}
      <button disabled={!!w} className="bg-sky-700 disabled:opacity-30 px-2 py-1 rounded" onClick={()=>act(r)}>{lbl}{mode!=='friends'&&mode!=='club'&&mode!=='sell'?' '+K(r.price):''}</button></div>})}</div>
    {conf&&<div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"><div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 max-w-sm w-full space-y-3"><div className="font-bold text-lg">{conf.title}</div>{conf.lines.map((l,i)=><div key={i} className="text-sm text-zinc-300">{l}</div>)}
      <div className="flex gap-2"><button className="flex-1 bg-emerald-600 py-2 rounded-lg font-bold" onClick={()=>{conf.fn();setConf(null)}}>Onayla</button><button className="flex-1 bg-zinc-700 py-2 rounded-lg" onClick={()=>setConf(null)}>Vazgeç</button></div></div></div>}
  </div>
}
