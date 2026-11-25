import {useState,useEffect,useRef} from 'react'
import {buildTeams} from '../data/leagues'
import {getCfg,hasEmbedded,saveCfg,joinRoom,watch,push,sub} from '../firebase'
import {Card} from '../ui'
export default function Lobby({onStart,onResume,onTV}){
  const teams=buildTeams().filter(t=>t.league===4)
  const [name,setName]=useState('Menajer'),[team,setTeam]=useState(teams[0].id),[club,setClub]=useState(''),[color,setColor]=useState('#10b981'),[cfg,setCfg]=useState(''),[code,setCode]=useState(''),[players,setPlayers]=useState({}),[rmode,setRmode]=useState('normal'),[err,setErr]=useState('')
  const pl=useRef(),md=useRef('normal');pl.current=players;md.current=rmode
  useEffect(()=>{if(code.length!==4||!getCfg())return;const u=[];watch(code,setPlayers).then(x=>u.push(x))
    sub(code,'mode',v=>setRmode(typeof v==='string'?v:'normal')).then(x=>u.push(x))
    sub(code,'started',v=>{if(v===true&&Object.keys(pl.current).length)onStart(Object.entries(pl.current).map(([id,p])=>({...p,id})),code,md.current==='tv')}).then(x=>u.push(x))
    return()=>u.forEach(f=>f&&f())},[code])
  const join=async()=>{try{if(!await joinRoom(code,name,team,club,color))setErr('Sunucu ayarı yok')}catch(e){setErr(String(e))}}
  const newCode=()=>{const c=Math.random().toString(36).slice(2,6).toUpperCase();setCode(c);push(c,'mode','normal').catch(()=>{})}
  const list=Object.values(players),inp="w-full bg-zinc-800 p-2 rounded"
  return <div className="max-w-xl mx-auto p-4 space-y-3">
    <div className="grass rounded-2xl p-6 text-center border-2 border-white/40 shadow-xl"><div className="text-5xl">⚽</div><h1 className="text-4xl font-extrabold tracking-wide drop-shadow">CYBERFOOT 2026</h1><div className="text-emerald-100 text-sm">4. Ligden Süper Lig'e · 4 kişilik menajerlik</div></div>
    {localStorage['cf-save']&&<button className="w-full bg-amber-600 p-2 rounded" onClick={onResume}>Kayıtlı oyuna devam et</button>}
    <Card className="space-y-2"><input className={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Menajer adı"/>
      <select className={inp} value={team} onChange={e=>setTeam(+e.target.value)}>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <div className="flex gap-2"><input className={inp} value={club} onChange={e=>setClub(e.target.value)} placeholder="Kulüp adı (isteğe bağlı)"/><input type="color" value={color} onChange={e=>setColor(e.target.value)} className="h-10 w-14"/></div>
      <button className="w-full bg-emerald-600 p-2 rounded" onClick={()=>onStart([{name,team,club,color}],null,false)}>Tek kişilik / yerel başla</button></Card>
    <Card className="space-y-2"><div className="font-semibold">👥 Online oda (4 hane kod)</div>
      <div className="flex gap-2"><input className="bg-zinc-800 p-2 rounded w-24 text-center text-lg" maxLength={4} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
        <button className="bg-sky-700 px-3 rounded" onClick={newCode}>Yeni kod</button><button className="bg-sky-700 px-3 rounded" onClick={join}>Odaya gir</button></div>
      <div className="text-xs text-zinc-400">Kodu arkadaşların aynı yere yazar. TV kullanacaksan TV'de çıkan kodu yaz.</div>
      {code.length===4&&<div className="text-sm">{rmode==='tv'?'📺 TV modu: maçlar TV ekranında oynanır':'💻 Normal mod: herkes maçı kendi ekranında izler'}</div>}
      {list.map((p,i)=><div key={i} className="text-sm">{p.name} — {p.club||teams.find(t=>t.id===p.team)?.name}</div>)}
      {list.length>0&&<button className="bg-emerald-600 px-3 py-1 rounded" onClick={()=>push(code,'started',true)}>Herkes için başlat ({list.length}/4)</button>}</Card>
    <Card><div className="font-semibold">📺 TV ekranı</div><div className="text-xs text-zinc-400 mb-2">Televizyonda siteyi aç, bunu seç. Oyuncular telefondan kodla girer, kadroyu telefondan ayarlar; maçlar sadece TV'de oynanır.</div><button className="w-full bg-purple-700 p-2 rounded" onClick={onTV}>Bu cihazı TV yap</button></Card>
    {!hasEmbedded&&<details className="bg-zinc-900 p-3 rounded"><summary>Sunucu Ayarları (sadece kurucu)</summary><div className="text-xs text-zinc-400 mt-1">Config'i proje içindeki src/firebaseConfig.js dosyasına koyarsan bu kutu kaybolur ve kimse ayar girmez.</div>
      <textarea className="w-full h-24 bg-zinc-800 p-2 mt-2 text-xs" value={cfg} onChange={e=>setCfg(e.target.value)}/>
      <button className="bg-sky-700 px-3 py-1 rounded" onClick={()=>{try{saveCfg(cfg);setErr('Kaydedildi')}catch{setErr('Geçersiz config')}}}>Kaydet</button></details>}
    {err&&<div className="text-amber-400 text-sm">{err}</div>}
  </div>
}
