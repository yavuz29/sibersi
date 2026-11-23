let db,fb
export const getCfg=()=>{try{return JSON.parse(localStorage.getItem('fbcfg'))}catch{return null}}
export const saveCfg=t=>{const o=new Function('return ('+t.replace(/^[^{]*/,'').replace(/[;\s]*$/,'')+')')();localStorage.setItem('fbcfg',JSON.stringify(o))}
export const pid=()=>localStorage.pid||(localStorage.pid=Math.random().toString(36).slice(2,8))
async function init(){
  if(db)return db;const c=getCfg();if(!c)return null
  const a=await import('firebase/app');fb=await import('firebase/database');db=fb.getDatabase(a.initializeApp(c));return db
}
export async function joinRoom(code,name,team,club,color){const d=await init();if(!d)return false
  await fb.update(fb.ref(d,`rooms/${code}/players/${pid()}`),{name,team,club,color,ready:false});return true}
export async function setReady(code,ready){const d=await init();d&&fb.update(fb.ref(d,`rooms/${code}/players/${pid()}`),{ready})}
export async function watch(code,cb){const d=await init();if(!d)return()=>{};return fb.onValue(fb.ref(d,`rooms/${code}/players`),s=>cb(s.val()||{}))}
export async function push(code,path,val){await init();return fb.set(fb.ref(db,`rooms/${code}/${path}`),val)}
export async function sub(code,path,cb){await init();return fb.onValue(fb.ref(db,`rooms/${code}/${path}`),s=>cb(s.val()||{}))}
