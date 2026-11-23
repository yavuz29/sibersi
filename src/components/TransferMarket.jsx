import {useState,useEffect} from 'react'
import {transfer} from '../engine/economy'
import {push,sub} from '../firebase'
const K=n=>Math.round(n/1000)+'K'
export default function Market({g,setG}){
  const me=g.teams[g.me],[mode,setMode]=useState('ai'),[pos,setPos]=useState(''),[fee,setFee]=useState({}),[offers,setOffers]=useState({})
  useEffect(()=>{if(!g.room)return;let un;sub(g.room,'offers',setOffers).then(u=>un=u);return()=>un&&un()},[g.room])
  let rows=[]
  if(mode==='ai')rows=g.teams.filter(t=>!t.human).flatMap(t=>t.players.map(p=>({p,from:t.name,price:p.value})))
  if(mode==='free')rows=g.free.map(p=>({p,from:'Serbest',price:Math.round(p.value*.3)}))
  if(mode==='sell')rows=me.players.map(p=>({p,from:me.name,price:Math.round(p.value*.7)}))
  if(mode==='friends')rows=g.teams.filter(t=>t.human&&t.id!==g.me).flatMap(t=>t.players.map(p=>({p,from:t.name,price:p.value,to:t.id})))
  rows=rows.filter(r=>!pos||r.p.pos===pos).sort((a,b)=>b.p.ovr-a.p.ovr).slice(0,40)
  const go=(pid,to,fee)=>g.room?push(g.room,`transfers/${Date.now().toString(36)}${g.me}${pid}`,{pid,to,fee,week:g.week,season:g.season}):setG(transfer(g,pid,to,fee))
  const act=r=>{
    if(mode==='sell')go(r.p.id,g.teams.find(t=>!t.human).id,r.price)
    else if(mode==='friends'){const id=Date.now().toString(36);push(g.room,`offers/${id}`,{id,from:g.me,to:r.to,pid:r.p.id,fee:+fee[r.p.id]||r.price,pn:r.p.name})}
    else go(r.p.id,g.me,r.price)
  }
  const inc=Object.values(offers).filter(o=>o.to===g.me&&!o.status)
  const answer=(o,ok)=>{const can=ok&&g.teams[o.from].budget>=o.fee;if(can)push(g.room,`transfers/${o.id}`,{pid:o.pid,to:o.from,fee:o.fee,week:g.week,season:g.season});push(g.room,`offers/${o.id}`,{...o,status:can?'ok':'no'})}
  const buy=mode==='ai'||mode==='free'
  return <div className="space-y-2">
    <div>Bütçe: <b>{K(me.budget)}</b> · Kadro {me.players.length}/26{g.room&&' · Online: işlemler hafta geçişinde uygulanır'}</div>
    {inc.map(o=><div key={o.id} className="bg-amber-900/40 p-2 rounded text-sm">{g.teams[o.from].name} → {o.pn} için {K(o.fee)} teklif <button className="bg-emerald-600 px-2 rounded mx-1" onClick={()=>answer(o,true)}>Kabul</button><button className="bg-red-700 px-2 rounded" onClick={()=>answer(o,false)}>Red</button></div>)}
    <div className="flex flex-wrap gap-1">{[['ai','AI kulüpleri'],['free','Serbest'],['sell','Sat'],['friends','Arkadaşlar']].map(([k,l])=>(k!=='friends'||g.room)&&<button key={k} onClick={()=>setMode(k)} className={`px-2 py-1 rounded ${mode===k?'bg-emerald-600':'bg-zinc-700'}`}>{l}</button>)}
      <select className="bg-zinc-800 rounded" value={pos} onChange={e=>setPos(e.target.value)}><option value="">Tümü</option>{['GK','DEF','MID','FWD'].map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="text-sm space-y-1">{rows.map(r=><div key={r.p.id} className="flex items-center gap-2 bg-zinc-900 p-1 rounded"><span className="w-10">{r.p.pos}</span><span className="flex-1">{r.p.name} ({r.p.age}) · {r.from}</span><b>{r.p.ovr}</b>
      {mode==='friends'&&<input className="w-16 bg-zinc-800 rounded" placeholder={K(r.price)} onChange={e=>setFee({...fee,[r.p.id]:e.target.value})}/>}
      <button disabled={buy&&(me.budget<r.price||me.players.length>=26)} className="bg-sky-700 disabled:opacity-30 px-2 rounded" onClick={()=>act(r)}>{mode==='sell'?'Sat':mode==='friends'?'Teklif':'Al'} {mode!=='friends'&&K(r.price)}</button></div>)}</div></div>
}
