import {useState,useEffect} from 'react'
import {buildTeams,freeAgents} from './data/leagues'
import {newLeagueState} from './engine/season'
import {newCup} from './engine/cup'
import {pid} from './firebase'
import Lobby from './components/Lobby'
import Dashboard from './components/Dashboard'
export default function App(){
  const [g,setG]=useState(null)
  const start=(humans,room)=>{
    const teams=buildTeams().map(t=>{const h=humans.find(x=>x.team===t.id);return h?{...t,human:h.name,name:h.club||t.name,color:h.color||t.color}:t})
    const mine=humans.find(h=>h.id===pid())||humans[0]
    localStorage.removeItem('cf-tac')
    setG({teams,season:1,week:0,room,me:mine.team,humans,results:[],free:freeAgents(),cup:newCup(teams),applied:[],
      leagues:Object.fromEntries([1,2,3,4].map(l=>[l,newLeagueState(teams,l)]))})
  }
  useEffect(()=>{if(g)try{localStorage.setItem('cf-save',JSON.stringify(g))}catch{}},[g])
  return g?<Dashboard g={g} setG={setG}/>:<Lobby onStart={start} onResume={()=>setG(JSON.parse(localStorage['cf-save']))}/>
}
