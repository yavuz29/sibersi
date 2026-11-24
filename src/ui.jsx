export const K=n=>Math.round(n/1000)+'K'
export const W=p=>Math.round(p.ovr**2*.3)
export const SP=[0,150000,50000,15000,5000]
export const Badge=({c,s=12})=><i style={{background:c,width:s,height:s}} className="inline-block rounded-full mr-1 align-middle ring-1 ring-white/30"/>
export const Card=({children,className=''})=><div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-3 ${className}`}>{children}</div>
