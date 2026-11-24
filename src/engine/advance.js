import {playWeek,endSeason} from './season'
import {applyOp} from './economy'
export function advanceGame(p,pend,tactics){
  let n=p
  if(p.room)Object.entries(pend||{}).filter(([id,t])=>t.week===p.week&&t.season===p.season&&!(n.applied||[]).includes(id)).sort(([a],[b])=>a<b?-1:1).forEach(([id,t])=>{n=applyOp({...n,applied:[...(n.applied||[]),id]},t)})
  return n.week>=22?endSeason(n):playWeek(n,tactics)
}
