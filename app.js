const $ = (id) => document.getElementById(id);
const seed = {
  episode:"Afterparty #15", length:"2H33MIN", videoUrl:"https://youtu.be/085m6rgXjBA",
  desc:"Dneska to je totální mix všeho, co máš na afterparty rád: cestování bez filtru, Winterfest chaos, bizár historky z víkendu, rapový novinky a Survivor intriky.",
  timeline:`00:00:00 Nejlepší město v Evropě?\n00:10:45 Turisti, koloběžky a realita měst\n00:19:30 Slovo cvaut a skate historie\n00:25:40 Minulej týden bez filtru\n00:53:50 Bukovka Winterfest chaos\n01:20:55 Survivor, intriky a fyzika soutěží`,
  titles:["Tahle epizoda je chaos","Winterfest nás skoro zabil","Nejlepší město v Evropě?","Fiesta, průsery a nulovej filtr","Survivor, porno a totální chaos"],
  thumbPrompt:"Two hosts with shocked expression, Czech podcast thumbnail, vivid contrast, punchy text area left",
  outliers:[{title:"ZRCE VLOG #3",views:310000,ratio:"+220%"}],
  keywords:["erem","afterparty podcast","zrce 2025"],
  clips:[]
};
const STORAGE_KEY='eremstudio_store_v3';
function parseVideoId(url=''){const m=url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);return m?m[1]:(url.trim().replace(/[^a-zA-Z0-9]+/g,'-').slice(0,40)||'untitled')}
function readStore(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function writeStore(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensureStore(){const s=readStore();if(!s.projects)s.projects={};if(!s.activeId){const id=parseVideoId(seed.videoUrl);s.projects[id]={...seed,_projectId:id};s.activeId=id;writeStore(s)}return s}
function loadActive(){const s=ensureStore();return {...(s.projects[s.activeId]||{...seed,_projectId:s.activeId})}}
const state=loadActive();
function save(){const s=ensureStore();s.projects[state._projectId]={...state};s.activeId=state._projectId;writeStore(s)}
function switchProject(url){const id=parseVideoId(url);if(id===state._projectId)return false;save();const s=ensureStore();const next=s.projects[id]||{...seed,episode:'',videoUrl:url,_projectId:id};Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,next);save();return true}
function bindCore(){['episode','length','videoUrl','desc','timeline'].forEach(k=>{const el=$(k);if(!el)return;el.value=state[k]||'';if(k==='videoUrl'){el.onchange=e=>{const sw=switchProject(e.target.value);if(sw){['episode','length','videoUrl','desc','timeline'].forEach(x=>$(x)&&($(x).value=state[x]||''))}else state[k]=e.target.value;save();};el.oninput=e=>state[k]=e.target.value;}else el.oninput=e=>{state[k]=e.target.value;save();}})}
function _parseTs(raw){
  const s=(raw||'').trim();
  // supports hh:mm:ss, h:mm:ss, mm:ss
  let m=s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if(m){
    const h=Number(m[1]), mi=Number(m[2]), se=Number(m[3]);
    return {h,mi,se,total:h*3600+mi*60+se};
  }
  m=s.match(/^(\d{1,2}):(\d{2})$/);
  if(m){
    const mi=Number(m[1]), se=Number(m[2]);
    return {h:0,mi,se,total:mi*60+se};
  }
  return null;
}

function _fmtHMS(h,mi,se){
  return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(se).padStart(2,'0')}`;
}

function _fmtSpotify(h,mi,se){
  return `${h}:${String(mi).padStart(2,'0')}:${String(se).padStart(2,'0')}`;
}

function normalizedTimelineItems(){
  const lines=(state.timeline||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const out=[];
  for(const l of lines){
    const mm=l.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
    if(!mm) continue;
    const ts=_parseTs(mm[1]);
    if(!ts) continue;
    let title=(mm[2]||'').replace(/\s+/g,' ').trim();
    if(!title) continue;
    // shorten accidental long chapter names
    if(title.length>92) title=title.slice(0,92).trim()+"…";
    out.push({
      ts_hms:_fmtHMS(ts.h,ts.mi,ts.se),
      ts_sp:_fmtSpotify(ts.h,ts.mi,ts.se),
      total:ts.total,
      title
    });
  }
  // dedupe same timestamps, keep first
  const seen=new Set();
  return out.filter(x=>{ if(seen.has(x.total)) return false; seen.add(x.total); return true;});
}

function spotifyLines(){
  return normalizedTimelineItems().map(x=>`(${x.ts_sp}) ${x.title}`)
}
function ytText(){
  const ch=normalizedTimelineItems().map(x=>`${x.ts_hms} ${x.title}`).join('\n');
  return `👉🏼 CELÁ EPIZODA (${state.length}) BEZ CENZURY NA https://herohero.co/erem 👈🏼\n☝🏻 Bonusové části, historky, co neprošly na YouTube, a epizody o týden dřív najdeš jen na našem HeroHero. Díky za support!\n\n🎙 O ČEM JE DNEŠNÍ AFTERPARTY?\n\n${state.desc}\n\n🕗 ČASOVÁ OSA\n\n${ch}\n\n🎧 PODCAST\nSpotify: https://eremvole.cz/spotify`
}
function spText(){return `🎙 O ČEM JE DNEŠNÍ AFTERPARTY?<br>\n<br>\n${state.desc}<br>\n<br>\n🕗 ČASOVÁ OSA<br>\n${spotifyLines().map(x=>x+'<br>').join('\n')}`}
async function copy(t){
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(t);
      return true;
    }
  }catch{}
  try{
    const ta=document.createElement('textarea');
    ta.value=t;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    const ok=document.execCommand('copy');
    ta.remove();
    return !!ok;
  }catch{
    return false;
  }
}

// functional modules
function scoreTitle(t){let s=100; const len=t.length; if(len<38)s-=18; if(len>65)s-=16; if(!/[?!]/.test(t))s-=5; if((t.match(/\b(nej|totální|šok|pravda|zničí|drama)\b/gi)||[]).length===0)s-=7; return Math.max(35,Math.min(98,s));}
function scoreThumb(text){let s=90; const words=text.trim().split(/\s+/).filter(Boolean).length; if(words>4)s-=18; if(words<2)s-=8; return Math.max(30,Math.min(96,s));}
function retentionHints(){const lines=(state.timeline||'').split('\n').map(x=>x.trim()).filter(Boolean); const hints=[]; if(lines.length<8)hints.push('Přidej víc chapter bodů (cílit 10-15).'); if(state.desc.length<220)hints.push('První odstavec popisku je krátký, přidej hook.'); if((state.episode||'').length>62)hints.push('Zkrať název videa kvůli CTR na mobilu.'); if(!hints.length)hints.push('Struktura vypadá dobře, otestuj A/B thumbnail.'); return hints;}
function mineClips(){const lines=(state.timeline||'').split('\n').map(x=>x.trim()).filter(Boolean); const picks=lines.slice(0,5).map((l,i)=>({hook:`Hook #${i+1}: ${l.replace(/^\d\d:\d\d:\d\d\s*/,'')}`,caption:`Tohle byl moment, co nejvíc řešil chat #${i+1}`})); state.clips=picks; save(); return picks;}
function trendRadar(){const base=['survivor','vlog','afterparty','zrce','bizár']; const existing=(state.keywords||[]); const merged=[...new Set([...existing,...base])]; state.keywords=merged.slice(0,12); save(); return state.keywords;}



async function fetchGoogleTrendsGeo(geo='CZ'){
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  const data = await res.json();
  const xml = new DOMParser().parseFromString(data.contents || '', 'text/xml');
  const items = [...xml.querySelectorAll('item title')].map(x=>x.textContent?.trim()).filter(Boolean);
  return items.slice(0,20);
}

async function refreshDailyTrendData(){
  try{
    const [cz, world] = await Promise.all([
      fetchGoogleTrendsGeo('CZ'),
      fetchGoogleTrendsGeo('US')
    ]);
    state.trendSnapshot = {
      date: new Date().toISOString(),
      cz,
      world,
      merged: [...new Set([...(state.keywords||[]), ...cz.slice(0,10), ...world.slice(0,10)])].slice(0,30)
    };
    state.keywords = state.trendSnapshot.merged.slice(0,12);
    save();
    return state.trendSnapshot;
  }catch(e){
    return null;
  }
}

function trendDrivenTitleVariants(currentTitle, transcript){
  const trend = state.trendSnapshot?.merged || state.keywords || [];
  return suggestTitlesFromTranscript(currentTitle, transcript, trend);
}



function listProjects(){
  const s=ensureStore();
  return Object.entries(s.projects||{}).map(([id,v])=>({id,...v}));
}
function selectProject(id){
  const s=ensureStore();
  if(!s.projects[id]) return false;
  s.activeId=id; writeStore(s);
  Object.keys(state).forEach(k=>delete state[k]);
  Object.assign(state, s.projects[id]);
  return true;
}
function removeProject(id){
  const s=ensureStore();
  if(!s.projects[id]) return false;
  delete s.projects[id];
  const keys=Object.keys(s.projects);
  if(!keys.length){
    const nid=parseVideoId(seed.videoUrl);
    s.projects[nid]={...seed,_projectId:nid};
    s.activeId=nid;
  } else if(s.activeId===id){
    s.activeId=keys[0];
  }
  writeStore(s);
  Object.keys(state).forEach(k=>delete state[k]);
  Object.assign(state, s.projects[s.activeId]);
  return true;
}

window.Studio={state,save,bindCore,spotifyLines,normalizedTimelineItems,ytText,spText,copy,scoreTitle,scoreThumb,retentionHints,mineClips,trendRadar,buildPromptForTitleAI,suggestTitlesFromTranscript,refreshDailyTrendData,trendDrivenTitleVariants,listProjects,selectProject,removeProject};


// advanced title engine (transcript + current title + trend/algorithm guard)
function buildPromptForTitleAI(currentTitle, transcript, trendKeywords){
  return `Jsi YouTube growth editor pro kanal erem.\n\nVstup:\n- aktualni nazev: ${currentTitle}\n- prepis / body: ${transcript}\n- trend keywords: ${(trendKeywords||[]).join(', ')}\n\nUkol:\n1) navrhni 10 nazvu v cestine\n2) kazdy max 62 znaku, ideal 45-58\n3) zadny clickbait lzi, ale silny hook\n4) max jeden vykricnik/otaznik\n5) jasne tema + emoce + benefit\n6) vyhni se repetitivnim slovum\n\n7) vzdy vychazej z CELEHO prepisu (ne jen casti)\n8) chapter/timestamp nazvy formuluj co nejpresneji podle realneho obsahu segmentu\n9) pokud je u casti prepisu nejistota, dohledat kontext na webu a teprve pak navrhovat\n\nVystup JSON:\n[{"title":"...","angle":"...","trend_fit":0-100,"ctr_potential":0-100}]`;
}

function algorithmGuardScore(title, trendKeywords=[]){
  const t = (title||'').trim();
  const len = t.length;
  let score = 100;

  if(len < 38) score -= 18;
  if(len > 62) score -= 20;
  if(/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]{7,}/.test(t)) score -= 10; // too shouty
  if((t.match(/[!?]/g)||[]).length > 1) score -= 10;

  const hookWords = ['šok','pravda','tajemství','zničí','drama','největší','totální','odhalení','bizár'];
  const hasHook = hookWords.some(w => t.toLowerCase().includes(w));
  if(!hasHook) score -= 8;

  const trendHit = trendKeywords.filter(k => t.toLowerCase().includes((k||'').toLowerCase())).length;
  score += Math.min(8, trendHit*3);

  // anti-spam / quality guard
  if(/(!!!|\?\?\?|100%|garantovan[eé])/i.test(t)) score -= 12;
  if(/\b(zdarma|free money|hack)\b/i.test(t)) score -= 15;

  return Math.max(20, Math.min(100, Math.round(score)));
}

function suggestTitlesFromTranscript(currentTitle, transcript, trendKeywords=[]){
  // Use whole transcript context: beginning + middle + end
  const all = (transcript||'').split('\n').map(x=>x.trim()).filter(Boolean)
    .map(x=>x.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*/,''));

  const pick = [];
  if(all.length){
    const idx = [0, Math.floor(all.length*0.2), Math.floor(all.length*0.4), Math.floor(all.length*0.6), Math.floor(all.length*0.8), all.length-1];
    for(const i of idx){ if(all[i]) pick.push(all[i]); }
  }
  const themes = [...new Set(pick)].slice(0,6);
  const trend = (trendKeywords||[]).slice(0,5);

  const templates = [
    () => `${themes[0]||'Tohle'}: co jsme fakt necekali`,
    () => `Nejvetsi drama: ${themes[1]||'Afterparty bez filtru'}`,
    () => `${trend[0]||'Afterparty'} bez filtru: tohle bouchlo`,
    () => `Odhaleni, co zmeni pohled na ${themes[2]||'nas podcast'}`,
    () => `${themes[3]||'Winterfest chaos'}: pravda bez cenzury`,
    () => `${themes[4]||'Survivor intriky'}: tohle rozjelo nejvetsi hadku`,
    () => `${currentTitle.split('~')[0].trim()}: co se delo dal`,
    () => `${trend[1]||'Survivor'} a totalni chaos v jednom dile`,
    () => `Pravda o tom, co se stalo po nataceni`,
    () => `${themes[5]||'To nebo to'}: odpovedi, co rozjely chat`
  ];

  const uncertainty = all.length < 4 || themes.filter(t=>t.length<6).length > 2;

  const out = templates.map(fn => {
    let title = fn();
    title = title.replace(/\s+/g,' ').trim();
    if(title.length > 62) title = title.slice(0,61).trim();
    return {
      title,
      score: algorithmGuardScore(title, trendKeywords),
      trend_fit: Math.min(100, 55 + (trendKeywords.filter(k=>title.toLowerCase().includes((k||'').toLowerCase())).length*15)),
      needs_web_check: uncertainty
    };
  }).sort((a,b)=>b.score-a.score);

  return out;
}
