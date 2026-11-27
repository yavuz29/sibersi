export const K=n=>Math.round(n/1000)+'K'
export const W=p=>Math.round(p.ovr**2*.3)
export const SP=[0,150000,50000,15000,5000]
const SH="M20 2 L37 8 V24 C37 34 29 41 20 44 C11 41 3 34 3 24 V8 Z"
export const Badge=({c,s=12})=><svg width={s} height={s*1.15} viewBox="0 0 40 46" className="inline-block align-middle mr-1"><path d={SH} fill={c} stroke="white" strokeOpacity=".7" strokeWidth="3"/></svg>
export const Crest=({t,s=32})=>{const w=(t.name||'?').split(' ').filter(x=>/^[A-Za-zÇĞİÖŞÜçğıöşü]/.test(x)),i=(w.length>1?w.slice(0,3).map(x=>x[0]).join(''):(w[0]||'?').slice(0,3)).toLocaleUpperCase('tr');return <svg width={s} height={s*1.15} viewBox="0 0 40 46" className="inline-block align-middle"><path d={SH} fill={t.color} stroke="white" strokeWidth="2"/><path d="M20 2 L37 8 V24 C37 34 29 41 20 44 Z" fill="black" opacity=".18"/><text x="20" y="28" textAnchor="middle" fontSize="13" fontWeight="800" fill="white" stroke="black" strokeWidth=".6" paintOrder="stroke">{i}</text></svg>}
export const Card=({children,className=''})=><div className={`bg-gradient-to-b from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-xl p-3 shadow-md ${className}`}>{children}</div>
const PC={GK:'bg-yellow-600',DEF:'bg-sky-600',MID:'bg-emerald-600',FWD:'bg-red-600'}
export const Pos=({p})=><span className={`${PC[p]} text-[10px] font-bold rounded px-1.5 py-0.5 w-9 inline-block text-center`}>{p}</span>
export const Ovr=({v})=><b className={`inline-block w-8 text-center rounded py-0.5 text-sm ${v>=75?'bg-emerald-500 text-black':v>=62?'bg-lime-600':v>=52?'bg-amber-600':'bg-zinc-600'}`}>{Math.round(v)}</b>
