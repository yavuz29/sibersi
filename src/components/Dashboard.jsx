import {useState,useEffect,useRef} from 'react'
import {playWeek,endSeason,sorted,fixMatch} from '../engine/season'
import {lineup} from '../engine/matchEngine'
import {transfer,applyOp,sackChance} from '../engine/economy'
import {offers} from '../engine/career'
import {advanceGame} from '../engine/advance'
import {LEAGUE_NAMES} from '../data/leagues'
import {watch,setReady,push,sub,pid} from '../firebase'
import MatchDay from './MatchDay'
import Market from './TransferMarket'
import Squad from './Squad'
import Stats from './Stats'
import {K,W,SP,Badge,Card} from '../ui'
const TABS=[['Maç','⚽'],['Sonuçlar','📋'],['Tablo','🏆'],['Kadro','👕'],['Transfer','💸'],['Finans','💰'],['Kupa','🥇'],['İstatistik','📊'],['Kariyer','🧳'],['Ayarlar','⚙️']]
export default function Dashboard({g,setG}){
  const me=g.teams[g.me],lg=me.league,T=i=>g.teams[i]
  const [tab,setTab]=useState('Maç'),[view,setView]=useState(lg),[ready,setR]=useState({}),[others,setO]=useState({}),[timer,setTimer]=useState(false),[left,setLeft]=useState(90),[fin,setFin]=useState(-1),[took,setTook]=useState(false),[gp,setGp]=useState({}),[hv,setHv]=useState(1),[mute,setMute]=useState(!!localStorage['cf-mute'])
  const [tac,setTac]=useState(()=>{try{const s=JSON.parse(localStorage['cf-tac']);if(s)return s}catch{}return {form:'4-4-2',mentality:0,press:0,pass:1,aggr:1,order:lineup(me).map(p=>p.id)}})
  const ord=[...tac.order.filter(id=>me.players.some(p=>p.id===id)),...me.players.filter(p=>!tac.order.includes(p.id)).map(p=>p.id)]
  const eff={...tac,order:ord},R=useRef(),pend=useRef({});R.current={eff,others,s:g.season,w:g.week}
  const advance=()=>setG(p=>advanceGame(p,pend.current,{...R.current.others,[p.me]:R.current.eff}))
  const press=()=>g.room?setReady(g.room,true):advance()
  const pr=useRef();pr.current=press
  useEffect(()=>{localStorage['cf-tac']=JSON.stringify(eff)})
  const pS=useRef(g.season),pM=useRef(g.me),adv=useRef(-1)
  useEffect(()=>{if(!me.sacked)setTook(false)},[me.sacked])
  useEffect(()=>{if(pS.current!==g.season){pS.current=g.season;setTab('Kariyer')}},[g.season])
  useEffect(()=>{if(pM.current!==g.me){pM.current=g.me;setTac(t=>({...t,order:lineup(me,t.form).map(p=>p.id)}))}},[g.me])
  useEffect(()=>{if(!g.room)return;const u=[];watch(g.room,setR).then(x=>u.push(x));sub(g.room,'tactics',setO).then(x=>u.push(x))
    sub(g.room,'transfers',v=>{pend.current=v}).then(x=>u.push(x))
    sub(g.room,'fixes',fx=>setG(p=>{let n=p;Object.entries(fx).forEach(([k,v])=>{const [s,w,i]=k.split('-').map(Number);if(s===p.season&&w===p.week&&n.results[i]&&n.results[i].v!==v.v)n=fixMatch(n,i,v)});return n})).then(x=>u.push(x))
    sub(g.room,'pause',setGp).then(x=>u.push(x))
    sub(g.room,'done',v=>{if(v[`${R.current.s}-${R.current.w}`])setFin(R.current.w)}).then(x=>u.push(x))
    return()=>u.forEach(f=>f&&f())},[g.room])
  useEffect(()=>{if(g.room)push(g.room,`tactics/${g.me}`,eff)},[tac.form,tac.mentality,tac.press,tac.pass,tac.aggr,ord.join()])
  useEffect(()=>{const v=Object.values(ready),k=g.season*100+g.week;if(g.room&&v.length&&v.every(p=>p.ready)&&adv.current!==k){adv.current=k;advance();setReady(g.room,false)}},[ready])
  useEffect(()=>{setLeft(90);setView(me.league)},[g.week])
  useEffect(()=>{if(!timer)return;const t=setInterval(()=>setLeft(l=>{if(l<=1){pr.current();return 90}return l-1}),1000);return()=>clearInterval(t)},[timer])
  const q=(id,o)=>push(g.room,`transfers/${Date.now().toString(36)}${g.me}${id}`,{...o,week:g.week,season:g.season})
  const renew=p=>{const fee=Math.round(p.value*.1);if(me.budget<fee)return;const o={op:'renew',pid:p.id,to:g.me,fee};g.room?q(p.id,o):setG(applyOp(g,o))}
  const release=p=>me.players.length>14&&(g.room?q(p.id,{pid:p.id,to:-1,fee:0}):setG(transfer(g,p.id,-1,0)))
  const upd=f=>setG({...g,teams:g.teams.map(t=>t.id===g.me?{...t,...f(t)}:t)})
  const take=o=>{const op={op:'switch',from:g.me,to:o.id,name:me.human};if(g.room){q('sw',op);setTook(true)}else setG(applyOp(g,op))}
  const jobs=offers(g),risk=sackChance(me)
  const pkey=`${g.season}-${g.week}`,paused=Object.values(gp).filter(x=>x&&x.on&&x.key===pkey)
  const onPause=(on,min)=>{if(g.room)push(g.room,`pause/${pid()}`,{on,by:me.human,key:pkey,min})}
  const onFix=(k,res)=>{const r2={...res,v:Date.now()};setG(p=>fixMatch(p,k,r2));if(g.room)push(g.room,`fixes/${g.season}-${g.week}-${k}`,r2)}
  const nxt=g.leagues[lg].fixtures[g.week]?.find(([h,a])=>h===g.me||a===g.me)
  const myMs=g.results.map((r,i)=>({r,i})).filter(({r})=>T(r.h).human||T(r.a).human)
  const revealed=!g.results.some(r=>r.h===g.me||r.a===g.me)||fin===g.week
  const tbl=sorted(g.leagues[view].table)
  const Res=l=>revealed?<div className="space-y-1 text-sm">{g.results.filter(r=>r.lg===l).map((r,i)=><div key={i} className="bg-zinc-800/50 rounded px-2 py-1"><div className="flex justify-between"><span><Badge c={T(r.h).color}/>{T(r.h).name}</span><b>{r.hg} - {r.ag}</b><span>{T(r.a).name}<Badge c={T(r.a).color} /></span></div>
    <div className="text-[11px] text-zinc-400">{r.events.filter(e=>e.type==='goal').map(e=>`${e.sn} ${e.min}'`).join(', ')}</div></div>)}</div>
    :<div className="text-zinc-400 text-sm">Sonuçlar senin maçın bitince açılır. <button className="underline" onClick={()=>setFin(g.week)}>Şimdi göster</button></div>
  const exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(g.teams.map(({id,name,color,players})=>({id,name,color,players})),null,1)]));a.download='cyberfoot-yama.json';a.click()}
  const saveExp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(g)]));a.download='cyberfoot-kayit.json';a.click()}
  const loadSave=e=>e.target.files[0]?.text().then(t=>setG(JSON.parse(t)))
  const imp=e=>e.target.files[0]?.text().then(t=>{const d=JSON.parse(t);setG(p=>({...p,teams:p.teams.map(x=>({...x,...(d.find(y=>y.id===x.id)||{})}))}))})
  return <div className="max-w-5xl mx-auto pb-10">
    <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div><div className="font-bold text-lg"><Badge c={me.color} s={16}/>{me.name}</div><div className="text-xs text-zinc-400">{LEAGUE_NAMES[lg]} · Sezon {g.season} · Hf {g.week}/22 · Kasa {K(me.budget)}{nxt&&` · Sıradaki: ${T(nxt[0]).name} - ${T(nxt[1]).name}`}</div></div>
        <div className="flex items-center gap-2">{timer&&<b>⏱{left}</b>}<button className="text-xl" onClick={()=>{mute?localStorage.removeItem('cf-mute'):localStorage['cf-mute']='1';setMute(!mute)}}>{mute?'🔇':'🔊'}</button>
          <button disabled={(me.sacked&&!took)||(g.tv&&g.week>0&&fin!==g.week)} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 px-4 py-2 rounded-lg font-bold" onClick={press}>{g.week>=22?'SEZONU BİTİR':'HAZIR ✅'}</button></div></div>
      <div className="flex flex-wrap gap-1 text-xs">{(g.room?Object.values(ready):[{name:me.human,ready:false}]).map((p,i)=><span key={i} className={`px-2 py-0.5 rounded-full ${p.ready?'bg-emerald-800':'bg-zinc-800'}`}>{p.name}: {p.ready?'Hazır ✅':'Hazırlanıyor ⏳'}</span>)}</div>
      <div className="flex gap-3 text-xs text-zinc-400"><span>😡 Taraftar %{me.fanA??20}</span><span>😠 Yönetim %{me.boardA??20}</span><span className={risk>40?'text-red-400':''}>Kovulma riski %{risk}</span></div>
      <div className="flex gap-1 overflow-x-auto">{TABS.map(([t,i])=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 rounded-lg whitespace-nowrap ${tab===t?'bg-emerald-600':'bg-zinc-800'}`}>{i} {t}</button>)}</div></div>
    <div className="p-2 space-y-3">
    {me.sacked&&<Card className="border-red-600 bg-red-950/40 space-y-2 text-sm"><b>🚨 KOVULDUN!</b> Yönetim seninle yollarını ayırdı. Yeni bir kulüp seç{g.room&&' (online: hafta geçişinde geçerli olur)'}:{jobs.map(o=><div key={o.id} className="flex items-center gap-2"><span className="flex-1"><Badge c={o.color}/>{o.name} · {LEAGUE_NAMES[T(o.id).league]}</span><button disabled={took} className="bg-sky-700 disabled:opacity-30 px-2 py-1 rounded" onClick={()=>take(o)}>Kabul et</button></div>)}</Card>}
    <div className={tab==='Maç'?'space-y-3':'hidden'}>
      {!myMs.length&&<Card>Henüz maç oynanmadı. Kadronu kur, taktiğini ayarla, <b>HAZIR</b>'a bas.{nxt&&<div className="mt-1 text-zinc-400">Sıradaki rakip: <Badge c={T(nxt[0]===g.me?nxt[1]:nxt[0]).color}/>{T(nxt[0]===g.me?nxt[1]:nxt[0]).name}</div>}</Card>}
      {g.tv?(myMs.length>0&&!revealed&&<Card>📺 Maçlar TV'de oynanıyor. Bitince sonuçlar burada açılır.</Card>):myMs.map(({r,i})=><MatchDay key={g.season+'-'+g.week+'-'+r.h} g={g} m={r} idx={i} tac={eff} setTac={setTac} onFix={onFix} onEnd={()=>setFin(g.week)} gpause={paused.length>0} pmin={paused[0]?.min} pby={paused[0]?.by} onPause={onPause} otacs={others}/>)}
      {g.results.length>0&&<Card><div className="font-semibold mb-1">{LEAGUE_NAMES[lg]} sonuçları</div>{Res(lg)}</Card>}</div>
    {tab==='Sonuçlar'&&<div className="space-y-2"><div className="flex gap-1 flex-wrap">{[1,2,3,4].map(l=><button key={l} onClick={()=>setView(l)} className={`px-3 py-1 rounded-lg ${view===l?'bg-emerald-600':'bg-zinc-800'}`}>{LEAGUE_NAMES[l]}</button>)}</div><Card>{g.results.length?Res(view):<span className="text-zinc-400 text-sm">Henüz maç yok.</span>}</Card></div>}
    {tab==='Tablo'&&<div><div className="flex gap-1 mb-2 flex-wrap">{[1,2,3,4].map(l=><button key={l} onClick={()=>setView(l)} className={`px-3 py-1 rounded-lg ${view===l?'bg-emerald-600':'bg-zinc-800'}`}>{LEAGUE_NAMES[l]}</button>)}</div>
      <Card><table className="w-full text-sm"><thead className="text-zinc-500 text-xs"><tr><th>#</th><th className="text-left">Takım</th><th>O</th><th>G-B-M</th><th>AV</th><th>P</th></tr></thead><tbody>{tbl.map((r,i)=><tr key={r.id} className={`${i<2&&view>1?'border-l-4 border-emerald-500':i<6&&view>1&&i>1?'border-l-4 border-yellow-500':i>8&&view<4?'border-l-4 border-red-500':'border-l-4 border-transparent'} ${r.id===g.me?'bg-emerald-900/40':T(r.id).human?'bg-sky-900/40':''}`}><td className="pl-1">{i+1}</td><td><Badge c={T(r.id).color}/>{T(r.id).name}</td><td className="text-center">{r.p}</td><td className="text-center">{r.w}-{r.d}-{r.l}</td><td className="text-center">{r.gf-r.ga}</td><td className="text-center"><b>{r.pts}</b></td></tr>)}</tbody></table>
      <div className="text-xs text-zinc-500 mt-2">🟩 yükselir · 🟨 play-off · 🟥 düşer</div></Card></div>}
    {tab==='Kadro'&&<Squad me={me} tac={tac} setTac={setTac} ord={ord} renew={renew} release={release}/>}
    {tab==='Transfer'&&<Market g={g} setG={setG}/>}
    {tab==='Finans'&&<Card className="space-y-2 text-sm"><div>Kasa: <b>{K(me.budget)}</b> · Sponsor: {K(me.sponsor)}/hf · Maaş: {K(me.players.reduce((s,p)=>s+W(p),0))}/hf</div>
      <div>Bilet fiyatı: <b>{me.price}₺</b> <input type="range" min="5" max="60" value={me.price} onChange={e=>upd(()=>({price:+e.target.value}))}/></div>
      <div>Stadyum: <b>{me.cap}</b> <button disabled={me.budget<150000} className="bg-sky-700 disabled:opacity-30 px-2 rounded" onClick={()=>upd(t=>({cap:t.cap+1000,budget:t.budget-150000}))}>+1000 koltuk (150K)</button></div>
      <div>Sponsor: <button className="bg-sky-700 px-2 rounded mx-1" onClick={()=>upd(()=>({sponsor:SP[lg],winBonus:0}))}>Güvenli ({K(SP[lg])}/hf)</button><button className="bg-sky-700 px-2 rounded" onClick={()=>upd(()=>({sponsor:SP[lg]*.4,winBonus:SP[lg]*1.5}))}>Performans ({K(SP[lg]*.4)}/hf + {K(SP[lg]*1.5)}/galibiyet)</button></div>
      <div className="text-zinc-400">Altyapı: sezon sonunda her takıma 2 genç oyuncu gelir.</div></Card>}
    {tab==='Kupa'&&<Card className="text-sm"><div>Tur {g.cup.round}/6 · Kalan: {g.cup.alive.length} · {g.cup.alive.includes(g.me)?'Kupada ✅':'Elendin ❌'}</div>{g.cup.log.at(-1)?.games.map((x,i)=><div key={i} className={x.h===g.me||x.a===g.me?'text-emerald-400':''}>{T(x.h).name} {x.hg}-{x.ag} {T(x.a).name}</div>)}{g.cup.alive.length===1&&<b>🏆 Şampiyon: {T(g.cup.alive[0]).name}</b>}</Card>}
    {tab==='İstatistik'&&<Stats g={g}/>}
    {tab==='Kariyer'&&<div className="space-y-3">
      <Card className="space-y-2 text-sm"><div className="font-semibold">🧳 {me.human} — {me.name}</div>
        {[['😡 Taraftar öfkesi',me.fanA??20],['😠 Yönetim öfkesi',me.boardA??20]].map(([l,a])=><div key={l}><div className="flex justify-between"><span>{l}</span><b>%{a}</b></div><div className="h-2 bg-zinc-800 rounded"><div className={`h-2 rounded ${a>66?'bg-red-500':a>33?'bg-amber-500':'bg-emerald-500'}`} style={{width:a+'%'}}/></div></div>)}
        <div>Kovulma riski: <b className={risk>40?'text-red-400':''}>%{risk}</b> <span className="text-zinc-500">(haftalık gerçek risk bunun dörtte biri)</span></div>
        <div className="text-xs text-zinc-500">Galibiyet öfkeyi düşürür, mağlubiyet artırır (evde yenilgi daha çok). Kasa eksiye düşerse yönetim daha da sinirlenir.</div></Card>
      <Card className="space-y-1 text-sm"><div className="font-semibold">📨 Teklifler</div>{!jobs.length&&<div className="text-zinc-400">Şu an teklif yok. Üst lig teklifi için: 10 galibiyet veya ilk 2'de olmak. Kötü gidişte alt liglerden teklif gelir.</div>}
        {jobs.map(o=><div key={o.id} className="flex items-center gap-2"><span className="flex-1"><Badge c={o.color}/>{o.name} · {LEAGUE_NAMES[T(o.id).league]} {o.kind==='up'?'⬆️':'⬇️'}</span><button className="bg-sky-700 px-2 py-1 rounded" onClick={()=>take(o)}>{o.kind==='up'?'İstifa et ve geç':'Kabul et'}</button></div>)}</Card>
      <Card className="space-y-2 text-sm"><div className="font-semibold">📜 Sezon geçmişi</div>{!(g.hist||[]).length&&<div className="text-zinc-400">İlk sezon bitince burada şampiyonlar ve sezonun 11'i görünür.</div>}
        {(g.hist||[]).slice().reverse().map(h=><div key={h.season} className="border-t border-zinc-800 pt-2"><b>Sezon {h.season}</b><div className="text-zinc-400">{[1,2,3,4].map(l=>`${LEAGUE_NAMES[l]}: ${T(h.champ[l]).name}`).join(' · ')}</div>
          <div className="flex gap-1 my-1 flex-wrap">{[1,2,3,4].map(l=><button key={l} onClick={()=>setHv(l)} className={`px-2 rounded text-xs ${hv===l?'bg-emerald-600':'bg-zinc-800'}`}>{LEAGUE_NAMES[l]} 11'i</button>)}</div>
          <div className="grid grid-cols-2 gap-x-3 text-xs">{h.toty[hv].map(p=><div key={p.id}><span className="text-zinc-500">{p.pos}</span> {p.n} <span className="text-zinc-500">({T(p.t).name}){p.g?` ⚽${p.g}`:''}</span></div>)}</div></div>)}</Card></div>}
    {tab==='Ayarlar'&&<Card className="space-y-2 text-sm"><label><input type="checkbox" checked={timer} onChange={e=>{setTimer(e.target.checked);setLeft(90)}}/> 90 sn tur sayacı</label>
      <div><button className="bg-zinc-700 px-2 rounded" onClick={exp}>Takım verisini dışa aktar (.json)</button></div><div>Yama yükle: <input type="file" accept=".json" onChange={imp}/></div>
      <div><button className="bg-zinc-700 px-2 rounded" onClick={saveExp}>Kaydı indir</button> Kayıt yükle: <input type="file" accept=".json" onChange={loadSave}/></div>
      <div><button className="bg-red-800 px-2 rounded" onClick={()=>{localStorage.removeItem('cf-save');localStorage.removeItem('cf-tac');location.reload()}}>Yeni oyun (kaydı sil)</button></div></Card>}
    </div></div>
}
