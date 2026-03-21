const $ = (id) => document.getElementById(id);
const DEFAULT_SETTINGS = {
  prompts: {
    titles: '',
    descriptions: '',
    growth: ''
  },
  skills: {
    enabled: true,
    selected: ['seo', 'curiosity-gap', 'high-stakes'],
    custom: ''
  },
  algorithms: {
    titleTemperature: 0.7,
    descriptionTemperature: 0.5,
    growthTemperature: 0.7,
    titleCount: 10
  },
  channel: {
    mode: 'both',
    audience: 'CZ',
    publishMode: 'manual'
  }
};

function cloneDefaultSettings(){
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
function ensureSettingsShape(raw){
  const base=cloneDefaultSettings();
  const s = (raw && typeof raw === 'object') ? raw : {};
  return {
    prompts: {
      titles: String(s.prompts?.titles ?? base.prompts.titles),
      descriptions: String(s.prompts?.descriptions ?? base.prompts.descriptions),
      growth: String(s.prompts?.growth ?? base.prompts.growth)
    },
    skills: {
      enabled: typeof s.skills?.enabled === 'boolean' ? s.skills.enabled : base.skills.enabled,
      selected: Array.isArray(s.skills?.selected) ? s.skills.selected.map(x=>String(x)) : base.skills.selected,
      custom: String(s.skills?.custom ?? base.skills.custom)
    },
    algorithms: {
      titleTemperature: Number.isFinite(Number(s.algorithms?.titleTemperature)) ? Number(s.algorithms.titleTemperature) : base.algorithms.titleTemperature,
      descriptionTemperature: Number.isFinite(Number(s.algorithms?.descriptionTemperature)) ? Number(s.algorithms.descriptionTemperature) : base.algorithms.descriptionTemperature,
      growthTemperature: Number.isFinite(Number(s.algorithms?.growthTemperature)) ? Number(s.algorithms.growthTemperature) : base.algorithms.growthTemperature,
      titleCount: Number.isFinite(Number(s.algorithms?.titleCount)) ? Number(s.algorithms.titleCount) : base.algorithms.titleCount
    },
    channel: {
      mode: String(s.channel?.mode ?? base.channel.mode),
      audience: String(s.channel?.audience ?? base.channel.audience),
      publishMode: String(s.channel?.publishMode ?? base.channel.publishMode)
    }
  };
}
function normalizeProjectShape(project){
  const p={...(project||{})};
  p.settings = ensureSettingsShape(p.settings);
  return p;
}
const seed = {
  episode:"Afterparty #15", length:"2H33MIN", videoUrl:"https://youtu.be/085m6rgXjBA",
  desc:"Dneska to je totální mix všeho, co máš na afterparty rád: cestování bez filtru, Winterfest chaos, bizár historky z víkendu, rapový novinky a Survivor intriky.",
  timeline:`00:00:00 Nejlepší město v Evropě?\n00:10:45 Turisti, koloběžky a realita měst\n00:19:30 Slovo cvaut a skate historie\n00:25:40 Minulej týden bez filtru\n00:53:50 Bukovka Winterfest chaos\n01:20:55 Survivor, intriky a fyzika soutěží`,
  titles:["Tahle epizoda je chaos","Winterfest nás skoro zabil","Nejlepší město v Evropě?","Fiesta, průsery a nulovej filtr","Survivor, porno a totální chaos"],
  thumbPrompt:"Two hosts with shocked expression, Czech podcast thumbnail, vivid contrast, punchy text area left",
  outliers:[{title:"ZRCE VLOG #3",views:310000,ratio:"+220%"}],
  keywords:["erem","afterparty podcast","zrce 2025"],
  clips:[],
  settings: cloneDefaultSettings()
};
const STORAGE_KEY='eremstudio_store_v3';
function parseVideoId(url=''){const m=url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);return m?m[1]:(url.trim().replace(/[^a-zA-Z0-9]+/g,'-').slice(0,40)||'untitled')}
function readStore(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function writeStore(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensureStore(){
  const s=readStore();
  if(!s.projects)s.projects={};
  if(!s.activeId){
    const id=parseVideoId(seed.videoUrl);
    s.projects[id]=normalizeProjectShape({...seed,_projectId:id});
    s.activeId=id;
  }
  for(const id of Object.keys(s.projects)) s.projects[id]=normalizeProjectShape(s.projects[id]);
  writeStore(s);
  return s;
}
function loadActive(){const s=ensureStore();return normalizeProjectShape({...((s.projects[s.activeId])||{...seed,_projectId:s.activeId})})}
const state=loadActive();
function save(){const s=ensureStore();s.projects[state._projectId]={...state};s.activeId=state._projectId;writeStore(s)}
function switchProject(url){const id=parseVideoId(url);if(id===state._projectId)return false;save();const s=ensureStore();const next=normalizeProjectShape(s.projects[id]||{...seed,episode:'',videoUrl:url,_projectId:id});Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,next);save();return true}
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

function getCodexApiUrl(){
  return (localStorage.getItem('eremstudio_codex_api_url') || './api/openai.php').trim();
}
function setCodexApiUrl(url=''){
  const v=String(url||'').trim();
  if(v) localStorage.setItem('eremstudio_codex_api_url',v);
  else localStorage.removeItem('eremstudio_codex_api_url');
  return getCodexApiUrl();
}

function _extractJsonPayload(text=''){
  const raw=(text||'').trim();
  if(!raw) return null;
  try{return JSON.parse(raw);}catch{}
  const fenced=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if(fenced){
    try{return JSON.parse(fenced[1].trim());}catch{}
  }
  const arrStart=raw.indexOf('[');
  const arrEnd=raw.lastIndexOf(']');
  if(arrStart!==-1 && arrEnd>arrStart){
    try{return JSON.parse(raw.slice(arrStart,arrEnd+1));}catch{}
  }
  const objStart=raw.indexOf('{');
  const objEnd=raw.lastIndexOf('}');
  if(objStart!==-1 && objEnd>objStart){
    try{return JSON.parse(raw.slice(objStart,objEnd+1));}catch{}
  }
  return null;
}

function buildTitlesPrompt({transcript='', trendsKeywords=[], audience='CZ'}={}){
  return [
    'System Prompt:',
    'Jsi YouTube Strategist s 10 lety praxe. Tvym cilem je maximalizovat CTR (miru prokliku).',
    '',
    'User Input:',
    `Transcript/Obsah: ${transcript}`,
    `Klicova slova z trendu: ${(trendsKeywords||[]).join(', ')}`,
    `Cilove publikum: ${audience}`,
    '',
    'Ukol:',
    'Vygeneruj 10 unikatnich nazvu v techto kategoriich:',
    '- Search Optimized (SEO)',
    '- Curiosity Gap',
    '- The "High Stakes" Title',
    '',
    'Format vystupu (JSON):',
    '[{"title":"...","category":"...","score":1-100}]'
  ].join('\n');
}

function buildDescriptionsPrompt({timeline='', descShort=''}={}){
  return [
    'System Prompt:',
    'Jsi Copywriter. Umis psat texty, ktere algoritmus YouTube miluje, ale zaroven jsou citelne pro lidi.',
    '',
    'User Input:',
    `Timeline (Kapitoly): ${timeline}`,
    `Hlavni tema: ${descShort}`,
    '',
    'Ukol:',
    '1) Vytvor YouTube Description: prvni 2 radky musi prodat video, potom "O cem to je", potom Timeline a CTA.',
    '2) Vytvor Spotify HTML: formatuj s <p>, <strong>, <ul>.',
    'Pravidla: neprehanej emoji. Timeline zachovej presne ve formatu 00:00 Nazev.',
    '',
    'Format vystupu (JSON):',
    '{"youtube_description":"...","spotify_html":"..."}'
  ].join('\n');
}

function buildGrowthPrompt({transcript=''}={}){
  return [
    'System Prompt:',
    'Jsi Viral Specialist. Tvym ukolem je najit v textu zlato pro kratka videa (Shorts/Reels).',
    '',
    'User Input:',
    `Full Transcript: ${transcript}`,
    '',
    'Ukol:',
    '1) Najdi 5 clip kandidatu (priblizny cas), vtipne/kontroverzni/rychla rada.',
    '2) Pro kazdy klip navrhni Shorts hook.',
    '3) Najdi jedno rizikove misto retence a navrhni zlepseni.',
    '',
    'Format vystupu (JSON):',
    '{"clips":[{"start":"mm:ss","hook":"...","reason":"..."}],"retention_tip":"..."}'
  ].join('\n');
}

async function callCodex(taskType, inputData, opts={}){
  const prompts = {
    titles: buildTitlesPrompt(inputData),
    descriptions: buildDescriptionsPrompt(inputData),
    growth: buildGrowthPrompt(inputData)
  };
  const override = (typeof inputData?.promptOverride === 'string') ? inputData.promptOverride.trim() : '';
  const prompt = override || prompts[taskType];
  if(!prompt) throw new Error(`Unknown taskType: ${taskType}`);
  const apiUrl = opts.apiUrl || getCodexApiUrl();
  if(!apiUrl) throw new Error('Missing API URL: nastav eremstudio_codex_api_url v localStorage.');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      taskType,
      prompt,
      temperature: opts.temperature ?? 0.7
    })
  });
  if(!response.ok){
    let body='';
    try{ body = await response.text(); }catch{}
    throw new Error(`LLM request failed (${response.status})${body ? `: ${body}` : ''}`);
  }
  const data = await response.json();
  if(data && typeof data === 'object' && (data.clips || data.youtube_description || Array.isArray(data))){
    return data;
  }
  const text = data?.text || data?.output || data?.message || '';
  const parsed = _extractJsonPayload(text);
  if(parsed) return parsed;
  throw new Error('LLM response is not valid JSON payload.');
}

async function generateStrategicTitles(input={}){
  const transcript = (input.transcript || state.timeline || '').trim();
  const trendsKeywords = input.trendsKeywords || state.trendSnapshot?.merged || state.keywords || [];
  const audience = input.audience || 'CZ';
  const out = await callCodex('titles', {transcript, trendsKeywords, audience}, input.options || {});
  if(!Array.isArray(out)) throw new Error('Titles payload must be array.');
  const maxTitles = Number(input.maxTitles || 10);
  return out
    .filter(x=>x && x.title)
    .slice(0,Math.max(1,Math.min(30,maxTitles)))
    .map(x=>({
      title: String(x.title).trim(),
      category: String(x.category || 'Curiosity Gap').trim(),
      score: Math.max(1, Math.min(100, Number(x.score || algorithmGuardScore(String(x.title||''), trendsKeywords))))
    }));
}

async function generateSmartDescriptions(input={}){
  const timeline = input.timeline || normalizedTimelineItems().map(x=>`${x.ts_hms} ${x.title}`).join('\n');
  const descShort = input.descShort || state.desc || '';
  const out = await callCodex('descriptions', {timeline, descShort}, input.options || {});
  if(!out || typeof out !== 'object') throw new Error('Descriptions payload must be object.');
  return {
    youtube_description: String(out.youtube_description || '').trim(),
    spotify_html: String(out.spotify_html || '').trim()
  };
}

async function generateGrowthAndClips(input={}){
  const transcript = (input.transcript || state.timeline || '').trim();
  const out = await callCodex('growth', {transcript}, input.options || {});
  if(!out || typeof out !== 'object') throw new Error('Growth payload must be object.');
  const clips = Array.isArray(out.clips) ? out.clips.slice(0,5).map(c=>({
    start: String(c.start || '00:00'),
    hook: String(c.hook || ''),
    reason: String(c.reason || '')
  })) : [];
  return {clips, retention_tip: String(out.retention_tip || '').trim()};
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

window.Studio={state,save,bindCore,spotifyLines,normalizedTimelineItems,ytText,spText,copy,scoreTitle,scoreThumb,retentionHints,mineClips,trendRadar,buildPromptForTitleAI,suggestTitlesFromTranscript,refreshDailyTrendData,trendDrivenTitleVariants,callCodex,generateStrategicTitles,generateSmartDescriptions,generateGrowthAndClips,getCodexApiUrl,setCodexApiUrl,ensureSettingsShape,defaultSettings:DEFAULT_SETTINGS,listProjects,selectProject,removeProject};


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
