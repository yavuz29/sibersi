import {useState,useEffect} from 'react'
import {pid} from './firebase'
import {newGame} from './engine/newGame'
import Lobby from './components/Lobby'
import Dashboard from './components/Dashboard'
import TV from './components/TV'
export default function App(){
  const [g,setG]=useState(null),[tv,setTv]=useState(false)
  const start=(humans,room,isTv)=>{localStorage.removeItem('cf-tac');setG(newGame(humans,room,isTv,pid()))}
  useEffect(()=>{if(g)try{localStorage.setItem('cf-save',JSON.stringify(g))}catch{}},[g])
  if(tv)return <TV onExit={()=>setTv(false)}/>
  return g?<Dashboard g={g} setG={setG}/>:<Lobby onStart={start} onTV={()=>setTv(true)} onResume={()=>setG(JSON.parse(localStorage['cf-save']))}/>
}
