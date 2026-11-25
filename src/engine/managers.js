import {rng} from './matchEngine'
const F=["Şenol","Fatih","Abdullah","Mustafa","Okan","Ersun","Bülent","Hamza","Tolunay","Sergen","Rıza","Ümit","Vedat","Cihat","Carlos","Marco","Jorge","Luis","Arda","Emre"]
const L=["Güneş","Terim","Avcı","Buruk","Yalçın","Çalımbay","Korkmaz","Kartal","Özat","Sarıoğlu","Santos","Ferrari","Silva","Costa","Demirci","Aksoy"]
export const aiManager=id=>{const r=rng(id*911+7);return F[Math.floor(r()*F.length)]+' '+L[Math.floor(r()*L.length)]}
