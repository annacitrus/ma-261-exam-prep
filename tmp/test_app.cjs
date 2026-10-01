const fs=require('fs');
const assert=require('assert/strict');
const vm=require('vm');
const {chromium}=require('C:/Users/acitr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='C:/Coding/ma261-exam1';
const html=fs.readFileSync(root+'/index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
new vm.Script(scripts.at(-1)[1]);
const bank=JSON.parse(scripts[0][1]);
assert.equal(bank.length,84);assert.equal(new Set(bank.map(q=>q.id)).size,84);
for(const exam of ['f2022','f2023','f2024','s2023','s2025']){
 const source=fs.readFileSync(root+`/tmp/ans-26100e1-${exam}.txt`,'utf8');
 const letters=[...source.matchAll(/^\s*\d+\.?\s+([A-F])\s*$/gm)].map(m=>m[1]).join('');
 assert.equal(bank.filter(q=>q.exam===exam).map(q=>String.fromCharCode(65+q.answer)).join(''),letters,exam);
}
assert.equal(bank.filter(q=>q.exam==='s2024').map(q=>String.fromCharCode(65+q.answer)).join(''),'EBAEBEEAAEAC');
assert.equal(bank.filter(q=>q.exam==='s2022').map(q=>String.fromCharCode(65+q.answer)).join(''),'CABDBDACFEDC');
for(const q of bank){assert.ok(q.explanation.length>80,q.id);assert.ok(q.options.length===(['s2022','s2025'].includes(q.exam)?6:5));assert.ok(q.answer<q.options.length);}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1365,height:1050}});
 const page=await context.newPage();const errors=[];const external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('file:///'+root+'/index.html');
 assert.equal(await page.locator('#choices').isVisible(),false);
 await page.locator('#recall-draft').fill('A draft from memory');
 await page.getByRole('button',{name:'Reveal choices',exact:true}).click();
 assert.equal(await page.locator('#choices').isVisible(),true);
 assert.match(await page.locator('#draft-reminder').textContent(),/A draft/);
 const id=await page.evaluate(()=>current.id);
 const answer=await page.evaluate(()=>current.answer);
 const before=Date.now();await page.locator(`[data-answer="${answer}"]`).click();
 assert.match(await page.locator('#feedback').innerText(),/Correct/);
 let record=await page.evaluate(id=>db.cards[id],id);
 assert.equal(record.box,2);assert.equal(record.attempts,1);assert.ok(Math.abs(record.due-before-86400000)<4000);
 assert.equal(await page.evaluate(()=>submitAnswer(current.answer)),false);
 assert.equal(await page.locator('.option:not(:disabled)').count(),0);
 await page.getByRole('button',{name:'Next question',exact:true}).click();
 assert.notEqual(await page.evaluate(()=>current.id),id);
 assert.equal(await page.locator('#choices').isVisible(),false);
 const missId=await page.evaluate(()=>current.id);const missTime=Date.now();
 await page.getByRole('button',{name:'I couldn’t recall',exact:true}).click();
 record=await page.evaluate(id=>db.cards[id],missId);assert.equal(record.box,1);assert.ok(Math.abs(record.due-missTime-60000)<4000);
 assert.equal(await page.locator('.option.correct').count(),1);
 await page.reload();assert.equal(await page.evaluate(id=>db.cards[id].box,missId),1);
 const checks=await page.evaluate(()=>{
  const results=[];const expect=(test,msg)=>{if(!test)throw new Error(msg);results.push(msg);};const now=1234567890;
  let r=gradeRecord(null,true,now);expect(r.box===2&&r.due===now+DAY,'first success');
  for(const box of [3,4,5,5]){r=gradeRecord(r,true,now);expect(r.box===box&&r.due===now+INTERVALS[box],'promotion '+box);}
  r=gradeRecord(r,false,now);expect(r.box===1&&r.due===now+MINUTE,'miss reset');
  const future={box:4,due:now+5*DAY,attempts:4,correct:4};r=gradeRecord(future,true,now,true);expect(r.box===4&&r.due===future.due,'early correct preserves schedule');
  r=gradeRecord(future,false,now,true);expect(r.box===1&&r.due===now+MINUTE,'early miss resets');
  for(const invalid of [null,{version:1,settings:{recall:true},cards:{bad:{box:1}}},{version:1,settings:{recall:true},cards:{[QUESTIONS[0].id]:{box:2,due:NaN,attempts:1,correct:1}}}]){let rejected=false;try{validateProgress(invalid);}catch(e){rejected=true;}expect(rejected,'invalid backup rejected');}
  db=fresh();current=null;recent=[];
  for(const q of QUESTIONS)db.cards[q.id]={box:3,due:now+DAY,attempts:1,correct:1};expect(selectQuestion(now)===null,'future cards excluded');expect(selectQuestion(now,true)?.extra===true,'opt-in early practice');
  const due=QUESTIONS[0];db.cards[due.id].due=now;expect(selectQuestion(now).q.id===due.id,'due card returned');
  db=fresh();current=null;recent=[];let seed=42;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};let byTopic={};
  for(let i=0;i<12000;i++){const q=selectQuestion(now,false,rng).q;byTopic[q.topic]=(byTopic[q.topic]||0)+1;}expect(byTopic.curves>byTopic.vectors*3,'high frequency topic prioritized');
  current=QUESTIONS.find(q=>q.topic==='curves');let repeats=0;for(let i=0;i<2000;i++)if(selectQuestion(now,false,rng).q.topic==='curves')repeats++;expect(repeats<180,'interleaving downweights last topic');
  db=fresh();current=null;recent=[];db.cards[QUESTIONS[0].id]={box:1,due:now,attempts:1,correct:0};let dueDraws=0;for(let i=0;i<4000;i++)if(selectQuestion(now,false,rng).q.id===QUESTIONS[0].id)dueDraws++;expect(dueDraws>2850&&dueDraws<3150,'due reviews selected about 75%');
  db=fresh();current=null;sessionAnswers=0;recent=[];save();nextQuestion();return {results,byTopic,repeats,dueDraws};
 });
 console.log(JSON.stringify(checks,null,2));
 await page.evaluate(()=>{current=QUESTIONS.find(q=>q.id==='s2025-12');answered=false;revealed=false;draft='';renderQuestion();updateStats();});
 await page.screenshot({path:root+'/tmp/app-desktop.png',fullPage:true});
 for(const q of bank){await page.evaluate(id=>{current=QUESTIONS.find(q=>q.id===id);answered=false;revealed=true;draft='';renderQuestion();},q.id);assert.equal(await page.locator('.option').count(),q.options.length);assert.ok(!(await page.locator('#question-area').innerText()).includes('undefined'),q.id);if(q.figure)assert.ok(await page.locator('.figure').evaluate(img=>img.complete&&img.naturalWidth>0),q.id);}
 await page.setViewportSize({width:390,height:844});
 for(const id of ['s2022-6','s2023-2','s2024-4','s2025-7','f2023-6','s2022-5','s2022-10']){
  await page.evaluate(id=>{current=QUESTIONS.find(q=>q.id===id);answered=false;revealed=true;draft='';renderQuestion();},id);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' overflow');
 }
 await page.evaluate(()=>{current=QUESTIONS.find(q=>q.id==='s2022-5');answered=false;revealed=false;renderQuestion();});
 await page.screenshot({path:root+'/tmp/app-mobile.png',fullPage:true});
 await page.locator('#recall-toggle').uncheck();assert.equal(await page.locator('#choices').isVisible(),true);await page.locator('#recall-toggle').check();assert.equal(await page.locator('#choices').isVisible(),false);
 await page.getByRole('button',{name:'Reveal choices',exact:true}).click();
 await page.keyboard.press(await page.evaluate(()=>String.fromCharCode(65+current.answer)));assert.equal(await page.evaluate(()=>answered),true);
 await page.keyboard.press('n');assert.equal(await page.evaluate(()=>answered),false);
 // All-future state, opted-in early practice, and a newly due review.
 await page.evaluate(()=>{for(const q of QUESTIONS)db.cards[q.id]={box:2,due:Date.now()+DAY,attempts:1,correct:1};nextQuestion();});
 assert.equal(await page.getByRole('heading',{name:'You’re up to date.'}).count(),1);
 await page.getByRole('button',{name:'Practice early',exact:true}).click();assert.equal(await page.evaluate(()=>extra),true);
 await page.evaluate(()=>{const record=db.cards[current.id];record.due=Date.now()-1;nextQuestion();});assert.equal(await page.evaluate(()=>extra),false);
 await page.evaluate(()=>{db=fresh();sessionAnswers=0;current=null;save();nextQuestion();});
 await page.setViewportSize({width:1365,height:1050});await page.getByRole('button',{name:'Exam analysis',exact:true}).click();
 assert.equal(await page.locator('#analysis-body tr').count(),11);await page.screenshot({path:root+'/tmp/app-analysis.png',fullPage:true});
 // Simulate a fresh browser session with storage access denied.
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}});});
 const blockedPage=await blocked.newPage();await blockedPage.goto('file:///'+root+'/index.html');assert.equal(await blockedPage.locator('#storage-warning').isVisible(),true);assert.equal(await blockedPage.locator('#question-heading').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: 84 questions; all keys; offline file mode; hidden choices; feedback; persistence; scheduler; weighting; interleaving; mobile layouts; storage failure; no external requests or browser errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
