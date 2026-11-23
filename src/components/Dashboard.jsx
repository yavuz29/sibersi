import {useState,useEffect,useRef} from 'react'
import {playWeek,endSeason,sorted,fixMatch} from '../engine/season'
import {FORMATIONS,lineup,slots} from '../engine/matchEngine'
import {transfer,applyOp} from '../engine/economy'
import {LEAGUE_NAMES} from '../data/leagues'
import {watch,setReady,push,sub} from '../firebase'
import MatchDay from './MatchDay'
import Market from './TransferMarket'
const TABS=['Maçlar','Tablo','Kadro','Transfer','Finans','Kupa','Ayarlar'],K=n=>Math.round(n/1000)+'K',SP=[0,150000,50000,15000,5000],W=p=>Math.round(p.ovr**2*.3)
export default function Dashboard({g,setG}){
  const me=g.teams[g.me],lg=me.league
  const [tab,setTab]=useState('Maçlar'),[view,setView]=useState(lg),[sel,setSel]=useState(null),[ready,setR]=useState({}),[others,setO]=useState({}),[timer,setTimer]=useState(false),[left,setLeft]=useState(90)
  const [tac,setTac]=useState(()=>{try{const s=JSON.parse(localStorage['cf-tac']);if(s)return s}catch{}return {form:'4-4-2',mentality:0,press:0,pass:1,aggr:1,order:lineup(me).map(p=>p.id)}})
  const ord=[...tac.order.filter(id=>me.players.some(p=>p.id===id)),...me.players.filter(p=>!tac.order.includes(p.id)).map(p=>p.id)]
  const eff={...tac,order:ord},R=useRef(),pend=useRef({});R.current={eff,others}
  const advance=()=>setG(p=>{let n=p
    if(p.room)Object.entries(pend.current).filter(([id,t])=>t.week===p.week&&t.season===p.season&&!(n.applied||[]).includes(id)).sort(([a],[b])=>a<b?-1:1).forEach(([id,t])=>{n=applyOp({...n,applied:[...(n.applied||[]),id]},t)})
    return n.week>=22?endSeason(n):playWeek(n,{...R.current.others,[p.me]:R.current.eff})})
  const press=()=>g.room?setReady(g.room,true):advance()
  const pr=useRef();pr.current=press
  useEffect(()=>{localStorage['cf-tac']=JSON.stringify(eff)})
  useEffect(()=>{if(!g.room)return;const u=[];watch(g.room,setR).then(x=>u.push(x));sub(g.room,'tactics',setO).then(x=>u.push(x))
    sub(g.room,'transfers',v=>{pend.current=v}).then(x=>u.push(x))
    return()=>u.forEach(f=>f&&f())},[g.room])
  useEffect(()=>{if(g.room)push(g.room,`tactics/${g.me}`,eff)},[tac.form,tac.mentality,tac.press,tac.pass,tac.aggr,ord.join()])
  useEffect(()=>{const v=Object.values(ready);if(g.room&&v.length&&v.every(p=>p.ready)){advance();setReady(g.room,false)}},[ready])
  useEffect(()=>{setLeft(90);setView(me.league)},[g.week])
  useEffect(()=>{if(!timer)return;const t=setInterval(()=>setLeft(l=>{if(l<=1){pr.current();return 90}return l-1}),1000);return()=>clearInterval(t)},[timer])
  const setForm=f=>setTac({...tac,form:f,order:lineup(me,f).map(p=>p.id)})
  const swap=i=>{if(sel===null)return setSel(i);const o=[...ord];[o[sel],o[i]]=[o[i],o[sel]];setTac({...tac,order:o});setSel(null)}
  const upd=f=>setG({...g,teams:g.teams.map(t=>t.id===g.me?{...t,...f(t)}:t)})
  const q=o=>push(g.room,`transfers/${Date.now().toString(36)}${g.me}${o.pid}`,{...o,week:g.week,season:g.season})
  const renew=p=>{const fee=Math.round(p.value*.1);if(me.budget<fee)return;g.room?q({op:'renew',pid:p.id,to:g.me,fee}):setG(applyOp(g,{op:'renew',pid:p.id,to:g.me,fee}))}
  const release=p=>me.players.length>14&&(g.room?q({pid:p.id,to:-1,fee:0}):setG(transfer(g,p.id,-1,0)))
  const nxt=g.leagues[lg].fixtures[g.week]?.find(([h,a])=>h===g.me||a===g.me)
  const myMs=g.results.map((r,i)=>({r,i})).filter(({r})=>g.teams[r.h].human||g.teams[r.a].human)
  const S=slots(tac.form),tbl=sorted(g.leagues[view].table)
  const exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(g.teams.map(({id,name,color,players})=>({id,name,color,players})),null,1)]));a.download='cyberfoot-yama.json';a.click()}
  const saveExp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(g)]));a.download='cyberfoot-kayit.json';a.click()}
  const loadSave=e=>e.target.files[0]?.text().then(t=>setG(JSON.parse(t)))
  const imp=e=>e.target.files[0]?.text().then(t=>{const d=JSON.parse(t);setG(p=>({...p,teams:p.teams.map(x=>({...x,...(d.find(y=>y.id===x.id)||{})}))}))})
  return <div className="max-w-4xl mx-auto p-2 space-y-2">
    <div className="flex flex-wrap gap-2 text-sm bg-zinc-900 p-2 rounded">{(g.room?Object.values(ready):[{name:me.human,ready:false}]).map((p,i)=><span key={i}>[{p.name}: {p.ready?'Hazır ✅':'Hazırlanıyor ⏳'}]</span>)}{timer&&<b className="ml-auto">⏱ {left}s</b>}</div>
    <div className="flex justify-between items-center gap-2"><div><i style={{background:me.color}} className="inline-block w-3 h-3 rounded-full mr-1"/><b>{me.name}</b> · {LEAGUE_NAMES[lg]} · Sezon {g.season} · Hafta {g.week}/22<div className="text-xs text-zinc-400">{nxt?`Sıradaki: ${g.teams[nxt[0]].name} - ${g.teams[nxt[1]].name}`:'Sezon bitti'} · Kasa {K(me.budget)}</div></div>
      <button className="bg-emerald-600 px-4 py-2 rounded" onClick={press}>{g.week>=22?'Sezonu bitir':'HAZIR'}</button></div>
    <div className="flex gap-1 overflow-auto">{TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 rounded ${tab===t?'bg-emerald-600':'bg-zinc-800'}`}>{t}</button>)}</div>
    {tab==='Maçlar'&&<div className="space-y-2">{myMs.map(({r,i})=><MatchDay key={g.week+'-'+r.h} g={g} m={r} idx={i} live={!g.room} tac={eff} setTac={setTac} onFix={(k,res)=>setG(p=>fixMatch(p,k,res))}/>)}<div className="text-sm">{g.results.filter(r=>r.lg===lg).map((r,i)=><div key={i}>{g.teams[r.h].name} {r.hg}-{r.ag} {g.teams[r.a].name}</div>)}</div></div>}
    {tab==='Tablo'&&<div><div className="flex gap-1 mb-1">{[1,2,3,4].map(l=><button key={l} onClick={()=>setView(l)} className={`px-2 rounded ${view===l?'bg-emerald-600':'bg-zinc-700'}`}>{LEAGUE_NAMES[l]}</button>)}</div>
      <table className="w-full text-sm"><tbody>{tbl.map((r,i)=><tr key={r.id} className={`${i<2&&view>1?'border-l-4 border-emerald-500':i<6&&view>1&&i>1?'border-l-4 border-yellow-500':i>8&&view<4?'border-l-4 border-red-500':''} ${r.id===g.me?'bg-emerald-900/50':g.teams[r.id].human?'bg-sky-900/40':''}`}><td className="pl-1">{i+1}</td><td><i style={{background:g.teams[r.id].color}} className="inline-block w-3 h-3 rounded-full mr-1"/>{g.teams[r.id].name}</td><td>{r.p}</td><td>{r.w}-{r.d}-{r.l}</td><td>{r.gf-r.ga}</td><td><b>{r.pts}</b></td></tr>)}</tbody></table></div>}
    {tab==='Kadro'&&<div className="space-y-1"><div className="flex gap-2"><select className="bg-zinc-800 p-1 rounded" value={tac.form} onChange={e=>setForm(e.target.value)}>{FORMATIONS.map(f=><option key={f}>{f}</option>)}</select>
      <select className="bg-zinc-800 p-1 rounded" value={tac.mentality} onChange={e=>setTac({...tac,mentality:+e.target.value})}>{[-2,-1,0,1,2].map(m=><option key={m} value={m}>{['Çok defansif','Defansif','Dengeli','Ofansif','Çok ofansif'][m+2]}</option>)}</select>
      <button className="bg-zinc-700 px-2 rounded" onClick={()=>setForm(tac.form)}>Oto diz</button>{[['press','Baskı',['Yok','Orta','Yüksek']],['pass','Pas',['Kısa','Karışık','Uzun']],['aggr','Agresiflik',['Düşük','Orta','Yüksek']]].map(([k,l,o])=><select key={k} className="bg-zinc-800 p-1 rounded" value={tac[k]??1} onChange={e=>setTac({...tac,[k]:+e.target.value})}>{o.map((x,i)=><option key={x} value={i}>{l}: {x}</option>)}</select>)}</div><div className="text-xs text-zinc-400">İki oyuncuya sırayla dokun: yer değiştirir. İlk 11 sahaya çıkar.</div>
      {ord.map((id,i)=>{const p=me.players.find(x=>x.id===id);return <div key={id} onClick={()=>swap(i)} className={`flex gap-2 text-sm p-1 rounded cursor-pointer ${sel===i?'bg-amber-700':i<11?'bg-zinc-800':'bg-zinc-900'}`}><span className="w-8">{i<11?S[i]:'YED'}</span><span className={`w-8 ${i<11&&p.pos!==S[i]?'text-red-400':''}`}>{p.pos}</span><span className="flex-1">{p.name} ({p.age}){p.inj?` 🤕${p.inj}h`:''}</span><span className="text-xs text-zinc-400">{p.contract||2}y · {K(W(p))}/hf</span><b>{p.ovr}</b>{(p.contract||2)<=1&&<button className="bg-sky-700 px-1 rounded text-xs" onClick={e=>{e.stopPropagation();renew(p)}}>Uzat {K(p.value*.1)}</button>}<button className="text-xs px-1 rounded bg-red-900" onClick={e=>{e.stopPropagation();release(p)}}>✕</button></div>})}</div>}
    {tab==='Transfer'&&<Market g={g} setG={setG}/>}
    {tab==='Finans'&&<div className="space-y-2 text-sm"><div>Kasa: <b>{K(me.budget)}</b> · Haftalık sponsor: {K(me.sponsor)} · Maaş: {K(me.players.reduce((s,p)=>s+W(p),0))}/hf</div>
      <div>Bilet fiyatı: <b>{me.price}₺</b> <input type="range" min="5" max="60" value={me.price} onChange={e=>upd(()=>({price:+e.target.value}))}/> (pahalı bilet doluluğu düşürür)</div>
      <div>Stadyum kapasitesi: <b>{me.cap}</b> <button disabled={me.budget<150000} className="bg-sky-700 disabled:opacity-30 px-2 rounded" onClick={()=>upd(t=>({cap:t.cap+1000,budget:t.budget-150000}))}>+1000 koltuk (150K)</button></div>
      <div>Sponsor: <button className="bg-sky-700 px-2 rounded mx-1" onClick={()=>upd(()=>({sponsor:SP[lg],winBonus:0}))}>Güvenli ({K(SP[lg])}/hf)</button><button className="bg-sky-700 px-2 rounded" onClick={()=>upd(()=>({sponsor:SP[lg]*.4,winBonus:SP[lg]*1.5}))}>Performans ({K(SP[lg]*.4)}/hf + {K(SP[lg]*1.5)}/galibiyet)</button></div><div>Altyapı: sezon sonunda her takıma 2 genç oyuncu gelir.</div></div>}
    {tab==='Kupa'&&<div className="text-sm"><div>Tur {g.cup.round}/6 · Kalan takım: {g.cup.alive.length} · {g.cup.alive.includes(g.me)?'Kupada ✅':'Elendin ❌'}</div>{g.cup.log.at(-1)?.games.map((x,i)=><div key={i} className={x.h===g.me||x.a===g.me?'text-emerald-400':''}>{g.teams[x.h].name} {x.hg}-{x.ag} {g.teams[x.a].name}</div>)}{g.cup.alive.length===1&&<b>🏆 Kupa şampiyonu: {g.teams[g.cup.alive[0]].name}</b>}</div>}
    {tab==='Ayarlar'&&<div className="space-y-2 text-sm"><label><input type="checkbox" checked={timer} onChange={e=>{setTimer(e.target.checked);setLeft(90)}}/> 90 sn tur sayacı</label>
      <div><button className="bg-zinc-700 px-2 rounded" onClick={exp}>Takım/oyuncu verisini dışa aktar (.json)</button></div><div>Yama yükle: <input type="file" accept=".json" onChange={imp}/></div><div><button className="bg-red-800 px-2 rounded" onClick={()=>{localStorage.removeItem('cf-save');localStorage.removeItem('cf-tac');location.reload()}}>Yeni oyun (kaydı sil)</button></div><div><button className="bg-zinc-700 px-2 rounded" onClick={saveExp}>Kaydı indir (.json)</button> Kayıt yükle: <input type="file" accept=".json" onChange={loadSave}/></div></div>}
  </div>
}
