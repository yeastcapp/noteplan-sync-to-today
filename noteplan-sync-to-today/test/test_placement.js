const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(process.argv[2],'utf8');
const P=(type,content)=>({type,content,rawContent:type==='open'?'- '+content:content,blockId:undefined});
function mkNote(fn,paras){const n={filename:fn,paragraphs:paras,
 addBlockID(p){p.blockId='abc123';p.rawContent+=' ^abc123'},
 updateParagraph(p){n.paragraphs[p.lineIndex]=p},
 insertParagraph(raw,i,t){n.paragraphs.splice(i,0,mk(raw,t));re()},
 appendParagraph(raw,t){n.paragraphs.push(mk(raw,t));re()}};
 function mk(raw,t){const m=/\s\^([a-z0-9]{6})\s*$/.exec(raw);return{type:t==='title'?'title':'open',content:raw,rawContent:raw,blockId:m?m[1]:undefined}}
 function re(){n.paragraphs.forEach((p,i)=>p.lineIndex=i)} re(); return n}
async function run(name,settings,dailyParas){
 const proj=mkNote('proj',[P('open','Review the investment policy')]);
 const today=mkNote('day',dailyParas());
 const ctx={console:{log(){}},Editor:Object.assign(proj,{note:proj,selectedParagraphs:[proj.paragraphs[0]]}),
  DataStore:{settings,calendarNoteByDate:()=>today,updateCache(){}},CommandBar:{prompt:async()=>{}}};
 vm.createContext(ctx);vm.runInContext(code,ctx);await ctx.syncToToday();
 console.log(name.padEnd(30),'=>',today.paragraphs.map(p=>p.type==='open'?'[ ] '+p.content.replace(' ^abc123',' *'):p.type==='empty'?'(blank)':p.content).join(' / '));
}
const mine=()=>[P('open','call bank'),P('open','email Sam'),P('empty',''),P('title','Done'),P('done','old thing')];
(async()=>{
 await run('default (no settings)',{},mine);
 await run('above heading Done',{position:'Above heading',heading:'Done'},mine);
 await run('above, heading "done" lower',{position:'Above heading',heading:'done'},mine);
 await run('above, heading missing',{position:'Above heading',heading:'Wrap-up'},mine);
 await run('under heading Done',{position:'Under heading',heading:'Done'},mine);
 await run('under, heading missing',{position:'Under heading',heading:'Focus'},mine);
 await run('top',{position:'Top'},mine);
 await run('bottom',{position:'Bottom'},mine);
 await run('above, empty note',{position:'Above heading',heading:'Done'},()=>[]);
})();
