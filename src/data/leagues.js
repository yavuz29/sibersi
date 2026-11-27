import {rng} from '../engine/matchEngine'
import raw from './players.csv?raw'
const F=["Ahmet","Mehmet","Emre","Burak","Can","Oğuz","Kerem","Arda","Yusuf","Eren","Deniz","Hakan","Mert","Barış","Tolga","Kaan","Serkan","Umut","Cem","Onur","Diego","Luka","Marco","Joao"]
const L=["Yılmaz","Demir","Kaya","Çelik","Şahin","Aydın","Özdemir","Arslan","Koç","Polat","Kurt","Aksoy","Erdoğan","Güneş","Taş","Silva","Novak","Rossi","Costa"]
export const TEAMS=["Galatasaray","Trabzonspor","Beşiktaş","Amed","Kasımpaşa","Fenerbahçe","Başakşehir","Kocaelispor","Göztepe","Rizespor","Çorum","Gençlerbirliği",
"Bursaspor","Kayserispor","Iğdır FK","Batman Petrolspor","Keçiörengücü","Mardin Büyükşehir","Bodrumspor","Erokspor","Karagümrük","Antalyaspor","Ümraniyespor","Muğlaspor",
"Muş 1984","Elazığspor","Aliağa","Güzide Gebze Spor","İnegöl Kafkas","Şanlıurfaspor","Çorluspor 1947","Erbaaspor","Sebat Gençlik Spor","68 Aksarayspor","Menemen Belediyespor","Isparta 32",
"Küçükçekmece Sinopspor","Etimesgut","Bursa Yıldırımspor","Silivrispor","Beykoz İshaklı Spor","Gemlik Sümerbey","Yalova Yeşilova Spor","Galata","Bulvarspor","İnkılapspor","Çankaya FK","Kestel Çilekspor"]
export const LEAGUE_NAMES=["","Süper Lig","2. Lig","3. Lig","4. Lig"]
const COL={Galatasaray:'#E30613',Trabzonspor:'#7A1F3D',Beşiktaş:'#2b2b2b',Amed:'#0B6B3A',Kasımpaşa:'#1D3A8A',Fenerbahçe:'#0A2A6B',Başakşehir:'#F26B21',Kocaelispor:'#1B7A3E',Göztepe:'#E5B80B',Rizespor:'#00843D',Çorum:'#C8102E',Gençlerbirliği:'#D4001A',Bursaspor:'#00843D',Kayserispor:'#E30613',Antalyaspor:'#D4001A',Karagümrük:'#B91C1C'}
const STR1=[6,3,5,-3,-2,6,1,-4,1,-1,-5,-3]
const BASE=[0,76,67,59,51],BUDGET=[0,50e6,15e6,5e6,1.5e6]
const POS=['GK','GK','DEF','DEF','DEF','DEF','DEF','DEF','MID','MID','MID','MID','MID','MID','FWD','FWD','FWD','FWD','FWD','MID']
export const playerValue=p=>Math.round(15000*Math.exp((p.ovr-40)*.12)*(p.age<=21?1.5:p.age<=25?1.2:p.age>=31?.55:1)/1000)*1000
const norm=s=>s.toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşıöç]/g,'')
const PM={GK:'GK',KL:'GK',DEF:'DEF',DF:'DEF',MID:'MID',OS:'MID',FWD:'FWD',FV:'FWD',ST:'FWD'}
function realPlayers(){
  const map={}
  raw.split(/\r?\n/).forEach(l=>{l=l.trim();if(!l||l.startsWith('#'))return;const c=l.split(/[;\t,]/).map(x=>x.trim());if(['takım','takim'].includes(norm(c[0])))return
    const pos=PM[(c[2]||'').toUpperCase()],ovr=+c[4];if(!pos||!ovr)return;(map[norm(c[0])]||(map[norm(c[0])]=[])).push({name:c[1],pos,age:+c[3]||25,ovr,value:+c[5]||0})})
  return map
}
export function buildTeams(seed=2026){
  const r=rng(seed),pick=a=>a[Math.floor(r()*a.length)],real=realPlayers()
  return TEAMS.map((name,i)=>{
    const lg=Math.floor(i/12)+1,off=lg===1?STR1[i]:Math.round((r()-.5)*6),rp=real[norm(name)]
    const color=COL[name]||'#'+Math.floor(r()*0xffffff).toString(16).padStart(6,'0')
    const mkp=(pos,j,ovr,age,name2,val)=>{const p={id:i*100+j,name:name2,pos,age,ovr,contract:1+Math.floor(r()*4)};p.value=val||playerValue(p);return p}
    const players=rp?rp.map((p,j)=>mkp(p.pos,j,p.ovr,p.age,p.name,p.value)):POS.map((pos,j)=>{const age=16+Math.floor(r()*21),ovr=Math.round(BASE[lg]+off+(r()-.5)*16);return mkp(pos,j,ovr,age,pick(F)+' '+pick(L))})
    return {id:i,name,league:lg,budget:Math.round(BUDGET[lg]*(1+(lg===1?off*.04:0))),cap:[0,20000,10000,5000,3000][lg],price:[0,40,25,18,15][lg],sponsor:[0,150000,50000,15000,5000][lg],human:null,color,players}
  })
}
export function freeAgents(seed=7){const r=rng(seed),P=['GK','DEF','DEF','MID','MID','FWD'];return Array.from({length:30},(_,i)=>{const age=18+Math.floor(r()*17),ovr=Math.round(45+r()*22),p={id:90000+i,name:F[Math.floor(r()*F.length)]+' '+L[Math.floor(r()*L.length)],pos:P[i%6],age,ovr,contract:2};p.value=playerValue(p);return p})}
