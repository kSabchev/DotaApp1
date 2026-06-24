// One-off: capture app screenshots to PNG files via headless Chrome + the
// DevTools Protocol (zero deps — Node's global WebSocket/fetch). Loads the dev
// server, injects a demo draft through the temporary window.__draft hook, then
// screenshots a few sections. Output: docs/shots/*.png
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const APP = 'http://localhost:5173';  // resolved to [::1] via --host-resolver-rules below
const OUT = 'D:\\coding\\claude\\dotaApp1\\docs\\shots';
mkdirSync(OUT, { recursive: true });
const profile = path.join(os.tmpdir(), 'shoot-profile-' + Date.now());

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--force-device-scale-factor=1', `--remote-debugging-port=${PORT}`,
  // Frontend binds to [::1] only and the backend CORS allows the localhost origin —
  // map localhost→[::1] so the page loads AND its API origin stays "localhost".
  '--host-resolver-rules=MAP localhost [::1]',
  '--window-size=1180,1500', `--user-data-dir=${profile}`, APP,
], { stdio: 'ignore' });

let target;
for (let i = 0; i < 40; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    target = list.find(t => t.type === 'page' && t.url.includes('5173')) || list.find(t => t.type === 'page');
    if (target?.webSocketDebuggerUrl) break;
  } catch { /* not up yet */ }
}
if (!target) { console.error('no devtools page target'); chrome.kill(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let _id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const cdp = (method, params = {}) => new Promise(res => { const id = ++_id; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const evalJS = async expr => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.result?.value;

await cdp('Page.enable');
await cdp('Runtime.enable');

// Wait for the hero pool + the __draft hook.
for (let i = 0; i < 40; i++) {
  if (await evalJS('!!(window.__draft && window.__draft.store.getState().heroes.heroes.length > 50)')) break;
  await sleep(500);
}
console.log('diag:', await evalJS('JSON.stringify({hasDraft: !!window.__draft, heroes: (window.__draft ? window.__draft.store.getState().heroes.heroes.length : -1), title: document.title, url: location.href})'));

const injected = await evalJS(`(function(){
  const w=window.__draft; const H=w.store.getState().heroes.heroes;
  const byName=n=>{const h=H.find(x=>x.displayName.toLowerCase()===n.toLowerCase());return h?h.id:null;};
  const R=['Faceless Void','Riki','Crystal Maiden','Medusa','Lina'];
  const D=['Doom','Bounty Hunter','Silencer','Ancient Apparition','Slardar'];
  const rI=R.map(byName), dI=D.map(byName);
  if([...rI,...dI].some(x=>x===null)) return 'missing:'+[...R,...D].filter((n,i)=>[...rI,...dI][i]===null);
  const slots=[]; for(let i=0;i<5;i++){slots.push({phase:'pick',team:'radiant',heroId:rI[i]});slots.push({phase:'pick',team:'dire',heroId:dI[i]});}
  const ro=['carry','mid','offlane','support','hard_support']; const ra={};
  rI.forEach((id,i)=>ra[id]=ro[i]); dI.forEach((id,i)=>ra[id]=ro[i]);
  w.store.dispatch(w.loadDraft({id:'shot',name:'Demo',notes:'',outcome:'tbd',savedAt:Date.now(),slots,mode:'manual',startingTeam:'radiant',roleAssignments:ra}));
  return 'ok:'+w.store.getState().draft.phase;
})()`);
console.log('inject:', injected);
await sleep(1800);

async function shoot(file, scrollExpr) {
  await evalJS(scrollExpr);
  await sleep(700);
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(OUT, file), Buffer.from(r.result.data, 'base64'));
  console.log('saved', file, r.result.data.length, 'b64');
}

const scrollTo = label => `(function(){const h=[...document.querySelectorAll('h4,h2')].find(x=>new RegExp(${JSON.stringify(label)},'i').test(x.textContent)); if(h){(h.closest('.bg-dota-surface')||h.closest('div')||h).scrollIntoView({block:'start'}); window.scrollBy(0,-20);} return !!h;})()`;

await shoot('01-analysis.png', 'window.scrollTo(0,0); true');
await shoot('02-freegame.png', scrollTo('Free Game Check'));
await shoot('03-timeline.png', scrollTo('Game Plan Timeline'));

ws.close();
chrome.kill();
await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
console.log('done');
