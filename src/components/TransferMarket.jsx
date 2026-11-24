import {useState,useEffect} from 'react'
import {applyOp} from '../engine/economy'
import {rng} from '../engine/matchEngine'
import {push,sub} from '../firebase'
import {K,Badge,Card} from '../ui'
const LG=['Tümü','Süper Lig','2. Lig','3. Lig','4. Lig']
export default function Market({g,setG}){
  const me=g.teams[g.me],ai=g.teams.filter(t=>!t.human),full=me.players.length>=26
  const [mode,setMode]=useState('club'),[f,setF]=useState({pos:'',lg:0,amin:'',amax:'',omin:'',pmax:'',q:'',sort:'ovr'}),[neg,setNeg]=useState(null),[offers,setOffers]=useState({}),[fee,setFee]=useState({})
  useEffect(()=>{if(!g.room)return;let un;sub(g.room,'offers',setOffers).then(u=>un=u);return()=>un&&un()},[g.room])
  const mk=(t,p,price,x={})=>({p,tid:t.id,from:t.name,lg:t.league,price,...x})
  let rows=[]
  if(mode==='club')rows=ai.flatMap(t=>t.players.filter(p=>!p.loanOf).map(p=>mk(t,p,p.value)))
  if(mode==='loan')rows=ai.flatMap(t=>t.players.filter(p=>!p.loanOf).map(p=>mk(t,p,Math.round(p.value*.15))))
  if(mode==='free')rows=g.free.map(p=>({p,tid:-1,from:'Serbest',lg:0,price:Math.round(p.value*.3)}))
  if(mode==='sell')rows=me.players.map(p=>mk(me,p,Math.round(p.value*.7)))
  if(mode==='friends')rows=g.teams.filter(t=>t.human&&t.id!==g.me).flatMap(t=>t.players.map(p=>mk(t,p,p.value,{to:t.id})))
  const has=v=>v!==''
  rows=rows.filter(r=>(!f.pos||r.p.pos===f.pos)&&(!f.lg||r.lg===f.lg)&&(!has(f.amin)||r.p.age>=f.amin)&&(!has(f.amax)||r.p.age<=f.amax)&&(!has(f.omin)||r.p.ovr>=f.omin)&&(!has(f.pmax)||r.price<=f.pmax*1000)&&(!f.q||r.p.name.toLowerCase().includes(f.q.toLowerCase())))
  rows.sort((a,b)=>f.sort==='ovr'?b.p.ovr-a.p.ovr:f.sort==='age'?a.p.age-b.p.age:a.price-b.price)
  const total=rows.length;rows=rows.slice(0,40)
  const doOp=o=>g.room?push(g.room,`transfers/${Date.now().toString(36)}${g.me}${o.pid}`,{...o,week:g.week,season:g.season}):setG(applyOp(g,o))
  const reserve=n=>Math.round(n.r.p.value*(1.05+.25*rng(n.r.p.id*17+g.week*3+g.season)()))
  const accept=o=>{if(o>me.budget||full)return;doOp({pid:neg.r.p.id,to:g.me,fee:o});setNeg(null)}
  const offer=()=>{const o=Math.round(+neg.offer*1000),res=reserve(neg)
    if(neg.locked)return
    if(full)return setNeg({...neg,msg:'Kadro dolu (26)'})
    if(o>me.budget)return setNeg({...neg,msg:'Kasan yetmiyor'})
    if(o>=res)return accept(o)
    const t=neg.tries+1
    if(t>=4)return setNeg({...neg,tries:t,locked:true,counter:null,msg:'Kulüp pazarlığı bitirdi, bu hafta teklif kabul etmiyor.'})
    if(o>=res*.88)return setNeg({...neg,tries:t,counter:res,msg:`Kulüp ${K(res)} istiyor.`})
    setNeg({...neg,tries:t,counter:null,msg:'Teklif çok düşük, reddedildi.'})}
  const inc=Object.values(offers).filter(o=>o.to===g.me&&!o.status)
  const answer=(o,ok)=>{const can=ok&&g.teams[o.from].budget>=o.fee;if(can)push(g.room,`transfers/${o.id}`,{pid:o.pid,to:o.from,fee:o.fee,week:g.week,season:g.season});push(g.room,`offers/${o.id}`,{...o,status:can?'ok':'no'})}
  const act=r=>{const id=r.p.id
    if(mode==='club')setNeg({r,offer:Math.round(id&&r.p.value/1000),tries:0,msg:'',counter:null})
    else if(mode==='loan')doOp({op:'loan',pid:id,to:g.me,fee:r.price,from:r.tid})
    else if(mode==='sell')doOp({pid:id,to:ai[0].id,fee:r.price})
    else if(mode==='friends'){const oid=Date.now().toString(36);push(g.room,`offers/${oid}`,{id:oid,from:g.me,to:r.to,pid:id,fee:(+fee[id]||r.price/1000)*1000,pn:r.p.name})}
    else doOp({pid:id,to:g.me,fee:r.price})}
  const lbl={club:'Pazarlık',loan:'Kirala',free:'İmzala',sell:'Sat',friends:'Teklif'}[mode],sl="bg-zinc-800 rounded p-1 text-sm",inp="bg-zinc-800 rounded p-1 w-16 text-sm"
  const set=(k,v)=>setF({...f,[k]:v})
  return <div className="space-y-2">
    <div className="text-sm">Kasa: <b>{K(me.budget)}</b> · Kadro {me.players.length}/26{g.room&&' · Online: işlemler hafta geçişinde uygulanır'}</div>
    {inc.map(o=><div key={o.id} className="bg-amber-900/40 p-2 rounded text-sm">{g.teams[o.from].name} → {o.pn} için {K(o.fee)} teklif <button className="bg-emerald-600 px-2 rounded mx-1" onClick={()=>answer(o,true)}>Kabul</button><button className="bg-red-700 px-2 rounded" onClick={()=>answer(o,false)}>Red</button></div>)}
    <div className="flex flex-wrap gap-1">{[['club','Kulüplerden'],['loan','Kiralık'],['free','Serbest'],['sell','Satış'],['friends','Arkadaşlar']].map(([k,l])=>(k!=='friends'||g.room)&&<button key={k} onClick={()=>{setMode(k);setNeg(null)}} className={`px-3 py-1 rounded ${mode===k?'bg-emerald-600':'bg-zinc-800'}`}>{l}</button>)}</div>
    <Card className="flex flex-wrap gap-1 items-center text-xs">
      <input className="bg-zinc-800 rounded p-1 text-sm w-28" placeholder="İsim ara" value={f.q} onChange={e=>set('q',e.target.value)}/>
      <select className={sl} value={f.pos} onChange={e=>set('pos',e.target.value)}><option value="">Mevki</option>{['GK','DEF','MID','FWD'].map(x=><option key={x}>{x}</option>)}</select>
      {mode!=='free'&&mode!=='sell'&&mode!=='friends'&&<select className={sl} value={f.lg} onChange={e=>set('lg',+e.target.value)}>{LG.map((x,i)=><option key={x} value={i}>{x}</option>)}</select>}
      Yaş <input className={inp} type="number" placeholder="min" value={f.amin} onChange={e=>set('amin',e.target.value)}/><input className={inp} type="number" placeholder="max" value={f.amax} onChange={e=>set('amax',e.target.value)}/>
      Güç ≥ <input className={inp} type="number" value={f.omin} onChange={e=>set('omin',e.target.value)}/> Fiyat ≤ <input className={inp} type="number" placeholder="K" value={f.pmax} onChange={e=>set('pmax',e.target.value)}/>
      <select className={sl} value={f.sort} onChange={e=>set('sort',e.target.value)}><option value="ovr">Güç</option><option value="age">Genç</option><option value="price">Ucuz</option></select></Card>
    {neg&&<div className="bg-amber-900/30 border border-amber-700 rounded-xl p-3 space-y-2 text-sm">
      <div><b>{neg.r.p.name}</b> ({neg.r.p.pos}, {neg.r.p.age} yaş, güç {neg.r.p.ovr}) · {neg.r.from} · Piyasa değeri {K(neg.r.p.value)}</div>
      <div className="flex gap-2 items-center"><input type="number" className="bg-zinc-800 rounded p-1 w-24" value={neg.offer} onChange={e=>setNeg({...neg,offer:e.target.value})}/> K <button className="bg-emerald-600 px-3 py-1 rounded" onClick={offer}>Teklif ver</button><button className="bg-zinc-700 px-3 py-1 rounded" onClick={()=>setNeg(null)}>Vazgeç</button></div>
      {neg.msg&&<div className="text-amber-300">{neg.msg}</div>}
      {neg.counter&&<button className="bg-sky-700 px-3 py-1 rounded" onClick={()=>accept(neg.counter)}>Karşı teklifi kabul et ({K(neg.counter)})</button>}</div>}
    <div className="text-xs text-zinc-400">{total} sonuç (ilk 40 gösteriliyor)</div>
    <div className="space-y-1 text-sm">{rows.map(r=><div key={r.p.id} className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg"><span className="w-9 text-xs text-zinc-400">{r.p.pos}</span>
      <span className="flex-1 truncate">{r.p.name} ({r.p.age}) · {r.lg?<Badge c={g.teams[r.tid].color}/>:null}{r.from}{r.lg?` · ${LG[r.lg]}`:''}</span><b className="w-7 text-right">{r.p.ovr}</b>
      {mode==='friends'&&<input className={inp} placeholder={K(r.price)} onChange={e=>setFee({...fee,[r.p.id]:e.target.value})}/>}
      <button disabled={(mode==='club'||mode==='loan'||mode==='free')&&(full||(mode!=='club'&&me.budget<r.price))} className="bg-sky-700 disabled:opacity-30 px-2 py-1 rounded" onClick={()=>act(r)}>{lbl}{mode!=='friends'&&mode!=='club'?' '+K(r.price):''}</button></div>)}</div></div>
}
