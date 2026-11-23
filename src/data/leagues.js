import {rng} from '../engine/matchEngine'
const F=["Ahmet","Mehmet","Emre","Burak","Can","Oğuz","Kerem","Arda","Yusuf","Eren","Deniz","Hakan","Mert","Barış","Tolga","Kaan","Serkan","Umut","Cem","Onur","Diego","Luka","Marco","Joao"]
const L=["Yılmaz","Demir","Kaya","Çelik","Şahin","Aydın","Özdemir","Arslan","Koç","Polat","Kurt","Aksoy","Erdoğan","Güneş","Taş","Silva","Novak","Rossi","Costa"]
export const CITIES=["Adana","Ankara","Antalya","Bursa","Konya","Kayseri","Samsun","Trabzon","Gaziantep","Mersin","Eskişehir","Denizli","Malatya","Sivas","Erzurum","Van","Diyarbakır","Hatay","Manisa","Balıkesir","Kocaeli","Sakarya","Tekirdağ","Edirne","Çorum","Ordu","Giresun","Rize","Zonguldak","Bolu","Afyon","Isparta","Aydın","Muğla","Tokat","Amasya","Elazığ","Batman","Kırıkkale","Karabük","Düzce","Yalova","Bartın","Kırşehir","Niğde","Aksaray","Uşak","Kütahya"]
export const LEAGUE_NAMES=["","Süper Lig","2. Lig","3. Lig","4. Lig"]
const BASE=[0,76,67,59,51], BUDGET=[0,50e6,15e6,5e6,1.5e6]
const POS=['GK','GK','DEF','DEF','DEF','DEF','DEF','DEF','MID','MID','MID','MID','MID','MID','FWD','FWD','FWD','FWD','FWD','MID']
export function buildTeams(seed=2026){
  const r=rng(seed), pick=a=>a[Math.floor(r()*a.length)]
  return CITIES.map((c,i)=>{const lg=Math.floor(i/12)+1
    return {id:i,name:c+'spor',league:lg,budget:BUDGET[lg],cap:[0,20000,10000,5000,3000][lg],price:[0,40,25,18,15][lg],sponsor:[0,150000,50000,15000,5000][lg],human:null,color:'#'+Math.floor(r()*0xffffff).toString(16).padStart(6,'0'),
      players:POS.map((pos,j)=>{const age=16+Math.floor(r()*21),ovr=Math.round(BASE[lg]+(r()-.5)*16)
        return {id:i*100+j,name:pick(F)+' '+pick(L),pos,age,ovr,value:Math.round(ovr**3*(age<25?1.4:1))*10,contract:1+Math.floor(r()*4)}})}})
}

export function freeAgents(seed=7){const r=rng(seed),P=['GK','DEF','DEF','MID','MID','FWD'];return Array.from({length:30},(_,i)=>{const age=18+Math.floor(r()*17),ovr=Math.round(45+r()*22);return {id:90000+i,name:F[Math.floor(r()*F.length)]+' '+L[Math.floor(r()*L.length)],pos:P[i%6],age,ovr,value:Math.round(ovr**3)*10,contract:2}})}
