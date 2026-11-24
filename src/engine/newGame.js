import {buildTeams,freeAgents} from '../data/leagues'
import {newLeagueState} from './season'
import {newCup} from './cup'
export function newGame(humans,room,tv,myPid){
  const teams=buildTeams().map(t=>{const h=humans.find(x=>x.team===t.id);return h?{...t,human:h.name,name:h.club||t.name,color:h.color||t.color}:t})
  const mine=humans.find(h=>h.id===myPid)||humans[0]
  return {teams,season:1,week:0,room,tv:!!tv,me:mine.team,humans,results:[],free:freeAgents(),cup:newCup(teams),applied:[],leagues:Object.fromEntries([1,2,3,4].map(l=>[l,newLeagueState(teams,l)]))}
}
