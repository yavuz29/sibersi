let ctx
export function sfx(kind){
  if(localStorage['cf-mute'])return
  try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();const t=ctx.currentTime
    const tone=(f,d,v,ty,s)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(v,t+s);g.gain.exponentialRampToValueAtTime(.001,t+s+d);o.connect(g).connect(ctx.destination);o.start(t+s);o.stop(t+s+d)}
    const noise=d=>{const b=ctx.createBuffer(1,ctx.sampleRate*d,ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=.15;s.buffer=b;s.connect(g).connect(ctx.destination);s.start()}
    if(kind==='goal'){[523,659,784,1047].forEach((f,i)=>tone(f,.3,.15,'triangle',i*.09));noise(1.6)}
    if(kind==='card')tone(300,.2,.15,'square',0)
    if(kind==='miss')tone(180,.5,.15,'sawtooth',0)
    if(kind==='whistle'){tone(2200,.15,.12,'sine',0);tone(2200,.4,.12,'sine',.2)}
  }catch{}
}
