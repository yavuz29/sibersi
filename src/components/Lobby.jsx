import {useState,useEffect,useRef} from 'react'
import {buildTeams} from '../data/leagues'
import {getCfg,saveCfg,joinRoom,watch,push,sub} from '../firebase'
export default function Lobby({onStart,onResume}){
  const teams=buildTeams().filter(t=>t.league===4)
  const [name,setName]=useState('Menajer'),[team,setTeam]=useState(teams[0].id),[club,setClub]=useState(''),[color,setColor]=useState('#10b981'),[cfg,setCfg]=useState(''),[code,setCode]=useState(''),[players,setPlayers]=useState({}),[err,setErr]=useState('')
  const pl=useRef();pl.current=players
  useEffect(()=>{if(code.length!==4||!getCfg())return;const u=[];watch(code,setPlayers).then(x=>u.push(x))
    sub(code,'started',v=>{if(v===true&&Object.keys(pl.current).length)onStart(Object.entries(pl.current).map(([id,p])=>({...p,id})),code)}).then(x=>u.push(x))
    return()=>u.forEach(f=>f&&f())},[code])
  const online=async()=>{try{if(!await joinRoom(code,name,team,club,color))setErr('Önce Firebase ayarını kaydedin')}catch(e){setErr(String(e))}}
  const list=Object.values(players)
  return <div className="max-w-xl mx-auto p-4 space-y-3">
    <h1 className="text-2xl font-bold">⚽ Cyberfoot 2026</h1>
    {localStorage['cf-save']&&<button className="w-full bg-amber-600 p-2 rounded" onClick={onResume}>Kayıtlı oyuna devam et</button>}
    <input className="w-full bg-zinc-800 p-2 rounded" value={name} onChange={e=>setName(e.target.value)} placeholder="Menajer adı"/>
    <select className="w-full bg-zinc-800 p-2 rounded" value={team} onChange={e=>setTeam(+e.target.value)}>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
    <div className="flex gap-2"><input className="flex-1 bg-zinc-800 p-2 rounded" value={club} onChange={e=>setClub(e.target.value)} placeholder="Kulüp adı (isteğe bağlı)"/><input type="color" value={color} onChange={e=>setColor(e.target.value)} className="h-10 w-14"/></div>
    <button className="w-full bg-emerald-600 p-2 rounded" onClick={()=>onStart([{name,team,club,color}],null)}>Tek kişilik / yerel başla</button>
    <details className="bg-zinc-900 p-3 rounded"><summary>Sunucu Ayarları (Firebase)</summary>
      <textarea className="w-full h-28 bg-zinc-800 p-2 mt-2 text-xs" placeholder="firebaseConfig" value={cfg} onChange={e=>setCfg(e.target.value)}/>
      <button className="bg-sky-700 px-3 py-1 rounded" onClick={()=>{try{saveCfg(cfg);setErr('Kaydedildi')}catch{setErr('Geçersiz config')}}}>Kaydet</button></details>
    <div className="bg-zinc-900 p-3 rounded space-y-2"><div>Online oda (4 hane kod)</div>
      <div className="flex gap-2"><input className="bg-zinc-800 p-2 rounded w-24" maxLength={4} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <button className="bg-sky-700 px-3 rounded" onClick={()=>setCode(Math.random().toString(36).slice(2,6).toUpperCase())}>Yeni kod</button>
      <button className="bg-sky-700 px-3 rounded" onClick={online}>Odaya gir</button></div>
      {list.map((p,i)=><div key={i}>{p.name} — {p.club||teams.find(t=>t.id===p.team)?.name}</div>)}
      {list.length>0&&<button className="bg-emerald-600 px-3 py-1 rounded" onClick={()=>push(code,'started',true)}>Herkes için başlat ({list.length}/4)</button>}</div>
    {err&&<div className="text-amber-400 text-sm">{err}</div>}
  </div>
}
