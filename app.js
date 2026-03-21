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
  },
  team: {
    actor: 'owner',
    reviewers: []
  },
  integrations: {
    analyticsApiUrl: './api/analytics.php',
    schedulerApiUrl: './api/scheduler.php',
    queueApiUrl: './api/queue.php',
    youtubeChannelId: '',
    spotifyShowId: ''
  },
  marketplace: {
    installed: [],
    customTemplates: []
  },
  promptOptimizer: {
    enabled: true,
    tasks: {
      titles: {uses: 0, ok: 0, fail: 0, avgScore: 0, trendWeights: {}, lastUsedAt: ''},
      descriptions: {uses: 0, ok: 0, fail: 0, avgScore: 0, trendWeights: {}, lastUsedAt: ''},
      growth: {uses: 0, ok: 0, fail: 0, avgScore: 0, trendWeights: {}, lastUsedAt: ''}
    }
  },
  tooling: {
    customTools: []
  }
};

function cloneDefaultSettings(){
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
function normalizeToolContract(raw){
  const c = (raw && typeof raw === 'object') ? raw : {};
  return {
    inputSchema: String(c.inputSchema || ''),
    outputSchema: String(c.outputSchema || ''),
    handler: String(c.handler || ''),
    version: String(c.version || 'v1')
  };
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
    },
    team: {
      actor: String(s.team?.actor ?? base.team.actor),
      reviewers: Array.isArray(s.team?.reviewers) ? s.team.reviewers.map(x=>String(x)) : []
    },
    integrations: {
      analyticsApiUrl: String(s.integrations?.analyticsApiUrl ?? base.integrations.analyticsApiUrl),
      schedulerApiUrl: String(s.integrations?.schedulerApiUrl ?? base.integrations.schedulerApiUrl),
      queueApiUrl: String(s.integrations?.queueApiUrl ?? base.integrations.queueApiUrl),
      youtubeChannelId: String(s.integrations?.youtubeChannelId ?? base.integrations.youtubeChannelId),
      spotifyShowId: String(s.integrations?.spotifyShowId ?? base.integrations.spotifyShowId)
    },
    marketplace: {
      installed: Array.isArray(s.marketplace?.installed) ? s.marketplace.installed.map(x=>String(x)) : [],
      customTemplates: Array.isArray(s.marketplace?.customTemplates) ? s.marketplace.customTemplates.map(t=>({
        id: String(t?.id || `tpl-${Date.now().toString(36)}`),
        name: String(t?.name || 'Custom Template'),
        type: String(t?.type || 'titles'),
        prompt: String(t?.prompt || '')
      })) : []
    },
    promptOptimizer: {
      enabled: typeof s.promptOptimizer?.enabled === 'boolean' ? s.promptOptimizer.enabled : base.promptOptimizer.enabled,
      tasks: {
        titles: {
          uses: Number(s.promptOptimizer?.tasks?.titles?.uses || 0),
          ok: Number(s.promptOptimizer?.tasks?.titles?.ok || 0),
          fail: Number(s.promptOptimizer?.tasks?.titles?.fail || 0),
          avgScore: Number(s.promptOptimizer?.tasks?.titles?.avgScore || 0),
          trendWeights: (s.promptOptimizer?.tasks?.titles?.trendWeights && typeof s.promptOptimizer.tasks.titles.trendWeights==='object') ? s.promptOptimizer.tasks.titles.trendWeights : {},
          lastUsedAt: String(s.promptOptimizer?.tasks?.titles?.lastUsedAt || '')
        },
        descriptions: {
          uses: Number(s.promptOptimizer?.tasks?.descriptions?.uses || 0),
          ok: Number(s.promptOptimizer?.tasks?.descriptions?.ok || 0),
          fail: Number(s.promptOptimizer?.tasks?.descriptions?.fail || 0),
          avgScore: Number(s.promptOptimizer?.tasks?.descriptions?.avgScore || 0),
          trendWeights: (s.promptOptimizer?.tasks?.descriptions?.trendWeights && typeof s.promptOptimizer.tasks.descriptions.trendWeights==='object') ? s.promptOptimizer.tasks.descriptions.trendWeights : {},
          lastUsedAt: String(s.promptOptimizer?.tasks?.descriptions?.lastUsedAt || '')
        },
        growth: {
          uses: Number(s.promptOptimizer?.tasks?.growth?.uses || 0),
          ok: Number(s.promptOptimizer?.tasks?.growth?.ok || 0),
          fail: Number(s.promptOptimizer?.tasks?.growth?.fail || 0),
          avgScore: Number(s.promptOptimizer?.tasks?.growth?.avgScore || 0),
          trendWeights: (s.promptOptimizer?.tasks?.growth?.trendWeights && typeof s.promptOptimizer.tasks.growth.trendWeights==='object') ? s.promptOptimizer.tasks.growth.trendWeights : {},
          lastUsedAt: String(s.promptOptimizer?.tasks?.growth?.lastUsedAt || '')
        }
      }
    },
    tooling: {
      customTools: Array.isArray(s.tooling?.customTools)
        ? s.tooling.customTools
          .filter(Boolean)
          .map(t=>({
            id: String(t.id || `tool-${Math.random().toString(36).slice(2,8)}`),
            name: String(t.name || 'Untitled Tool'),
            group: String(t.group || 'Custom'),
            status: String(t.status || 'planned'),
            description: String(t.description || ''),
            inputs: String(t.inputs || ''),
            outputs: String(t.outputs || ''),
            contract: normalizeToolContract(t.contract)
          }))
        : []
    }
  };
}
function normalizeProjectShape(project){
  const p={...(project||{})};
  p.settings = ensureSettingsShape(p.settings);
  p.abSelections = (p.abSelections && typeof p.abSelections==='object') ? p.abSelections : {title:'',description:'',clip:'',thumbnail:''};
  p.approval = (p.approval && typeof p.approval==='object')
    ? {
      state: String(p.approval.state || 'draft'),
      updatedAt: String(p.approval.updatedAt || ''),
      note: String(p.approval.note || ''),
      reviewer: String(p.approval.reviewer || ''),
      requiredApprovals: Number(p.approval.requiredApprovals || 1),
      votes: Array.isArray(p.approval.votes) ? p.approval.votes : []
    }
    : {state:'draft', updatedAt:'', note:'', reviewer:'', requiredApprovals:1, votes:[]};
  p.channelProfile = (p.channelProfile && typeof p.channelProfile==='object') ? p.channelProfile : {tone:'balanced', successRate:0, avgTitleScore:0, recommendations:[]};
  p.publishQueue = Array.isArray(p.publishQueue) ? p.publishQueue : [];
  p.abPlanner = (p.abPlanner && typeof p.abPlanner==='object') ? p.abPlanner : {variants:[], results:[], selectedWinner:'', notes:''};
  p.clipPipeline = Array.isArray(p.clipPipeline) ? p.clipPipeline : [];
  p.auditLog = Array.isArray(p.auditLog) ? p.auditLog : [];
  p.generationHistory = {
    titles: Array.isArray(p.generationHistory?.titles) ? p.generationHistory.titles : [],
    descriptions: Array.isArray(p.generationHistory?.descriptions) ? p.generationHistory.descriptions : [],
    clips: Array.isArray(p.generationHistory?.clips) ? p.generationHistory.clips : []
  };
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
  abSelections:{title:'',description:'',clip:'',thumbnail:''},
  approval:{state:'draft',updatedAt:'',note:'',reviewer:'',requiredApprovals:1,votes:[]},
  channelProfile:{tone:'balanced',successRate:0,avgTitleScore:0,recommendations:[]},
  publishQueue:[],
  abPlanner:{variants:[],results:[],selectedWinner:'',notes:''},
  clipPipeline:[],
  auditLog:[],
  generationHistory:{titles:[],descriptions:[],clips:[]},
  settings: cloneDefaultSettings()
};
const STORAGE_KEY='eremstudio_store_v3';
function parseVideoId(url=''){const m=url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);return m?m[1]:(url.trim().replace(/[^a-zA-Z0-9]+/g,'-').slice(0,40)||'untitled')}
function isValidVideoUrl(url=''){
  const u=String(url||'').trim();
  if(!u) return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{6,}/i.test(u);
}
function readStore(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function writeStore(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function ensureStore(){
  const s=readStore();
  let changed=false;
  if(!s.projects)s.projects={};
  if(!s.activeId){
    const id=parseVideoId(seed.videoUrl);
    s.projects[id]=normalizeProjectShape({...seed,_projectId:id});
    s.activeId=id;
    changed=true;
  }
  for(const id of Object.keys(s.projects)){
    const before=JSON.stringify(s.projects[id]||{});
    s.projects[id]=normalizeProjectShape(s.projects[id]);
    if(before!==JSON.stringify(s.projects[id])) changed=true;
  }
  if(changed) writeStore(s);
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
function validateTimelineText(timeline=''){
  const raw=String(timeline||'');
  const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean);
  if(!lines.length) return {ok:false, errors:['Timeline je prázdná.'], lineErrors:[]};
  const lineErrors=[];
  lines.forEach((line, idx)=>{
    const m=line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
    if(!m){
      lineErrors.push({line:idx+1, reason:'Neplatný formát. Použij např. 00:12 Název kapitoly.'});
      return;
    }
    if(!_parseTs(m[1])){
      lineErrors.push({line:idx+1, reason:'Neplatný timestamp.'});
      return;
    }
    if(!m[2].trim()){
      lineErrors.push({line:idx+1, reason:'Chybí název kapitoly.'});
    }
  });
  return {
    ok: lineErrors.length===0,
    errors: lineErrors.length ? ['Některé řádky timeline nejsou ve správném formátu.'] : [],
    lineErrors
  };
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
  const backend = `./api/trends.php?geo=${encodeURIComponent(geo)}`;
  const backendRes = await fetch(backend, {method:'GET'});
  if(backendRes.ok){
    const payload = await backendRes.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if(items.length) return items.slice(0,20);
  }
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
function getApiAccessToken(){
  return (localStorage.getItem('eremstudio_api_access_token') || '').trim();
}
function setApiAccessToken(token=''){
  const v=String(token||'').trim();
  if(v) localStorage.setItem('eremstudio_api_access_token',v);
  else localStorage.removeItem('eremstudio_api_access_token');
  return getApiAccessToken();
}
function getProjectsApiUrl(){
  return (localStorage.getItem('eremstudio_projects_api_url') || './api/projects.php').trim();
}
function getAnalyticsApiUrl(){
  const inSettings = String(state.settings?.integrations?.analyticsApiUrl || '').trim();
  return inSettings || './api/analytics.php';
}
function getSchedulerApiUrl(){
  const inSettings = String(state.settings?.integrations?.schedulerApiUrl || '').trim();
  return inSettings || './api/scheduler.php';
}
function getAuditApiUrl(){
  return './api/audit.php';
}
function getQueueApiUrl(){
  const inSettings = String(state.settings?.integrations?.queueApiUrl || '').trim();
  return inSettings || './api/queue.php';
}
async function _queueApiRequest(payloadOrQuery, method='POST', opts={}){
  const apiUrl=(opts.apiUrl || getQueueApiUrl()).trim();
  const apiToken=(opts.apiToken ?? getApiAccessToken()).trim();
  const headers={'Content-Type':'application/json'};
  if(apiToken) headers['X-API-Token']=apiToken;
  let url=apiUrl;
  const init={method,headers};
  if(method==='GET'){
    const q=payloadOrQuery && typeof payloadOrQuery==='object' ? new URLSearchParams(payloadOrQuery).toString() : '';
    if(q) url += (url.includes('?') ? '&' : '?') + q;
  }else{
    init.body=JSON.stringify(payloadOrQuery || {});
  }
  const res=await fetch(url, init);
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data?.error) throw new Error(String(data?.error || `Queue API failed (${res.status})`));
  return data;
}
function setProjectsApiUrl(url=''){
  const v=String(url||'').trim();
  if(v) localStorage.setItem('eremstudio_projects_api_url',v);
  else localStorage.removeItem('eremstudio_projects_api_url');
  return getProjectsApiUrl();
}
async function _projectsApiRequest(payloadOrQuery, method='POST', opts={}){
  const apiUrl=(opts.apiUrl || getProjectsApiUrl()).trim();
  const apiToken=(opts.apiToken ?? getApiAccessToken()).trim();
  const headers={'Content-Type':'application/json'};
  if(apiToken) headers['X-API-Token']=apiToken;
  let url=apiUrl;
  const init={method, headers};
  if(method==='GET'){
    const q=payloadOrQuery && typeof payloadOrQuery==='object' ? new URLSearchParams(payloadOrQuery).toString() : '';
    if(q) url += (url.includes('?') ? '&' : '?') + q;
  }else{
    init.body=JSON.stringify(payloadOrQuery || {});
  }
  const res=await fetch(url, init);
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data?.error) throw new Error(String(data?.error || `Projects API failed (${res.status})`));
  return data;
}
async function syncProjectToServer(project, opts={}){
  const p=normalizeProjectShape(project || state);
  await _projectsApiRequest({action:'upsert', project:p}, 'POST', opts);
  return true;
}
async function deleteProjectOnServer(id, opts={}){
  await _projectsApiRequest({action:'delete', id:String(id||'')}, 'POST', opts);
  return true;
}
async function pullProjectsFromServer(opts={}){
  const out=await _projectsApiRequest({}, 'GET', opts);
  const list=Array.isArray(out?.projects)?out.projects:[];
  return list.map(normalizeProjectShape);
}
function replaceAllLocalProjects(projects=[]){
  const list=Array.isArray(projects)?projects.map(normalizeProjectShape):[];
  const s=ensureStore();
  const next={};
  for(const p of list){
    const id=String(p._projectId || p.id || '');
    if(!id) continue;
    p._projectId=id;
    next[id]=p;
  }
  if(!Object.keys(next).length) return false;
  s.projects=next;
  if(!s.projects[s.activeId]){
    s.activeId=Object.keys(s.projects)[0];
  }
  writeStore(s);
  Object.keys(state).forEach(k=>delete state[k]);
  Object.assign(state, s.projects[s.activeId]);
  return true;
}
function addAuditEvent(type, message, meta={}){
  const actor=String(state.settings?.team?.actor || 'system');
  const entry={
    id:`audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
    ts:new Date().toISOString(),
    type:String(type||'event'),
    message:String(message||''),
    actor,
    meta: JSON.parse(JSON.stringify(meta||{}))
  };
  state.auditLog=[entry, ...(state.auditLog||[])].slice(0,150);
  save();
  return entry;
}
function listAuditLog(limit=50){
  return [...(state.auditLog||[])].slice(0, Math.max(1, Math.min(200, Number(limit||50))));
}
function enqueuePublishJob(payload={}, scheduleAt=''){
  const job={
    id:`job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
    createdAt:new Date().toISOString(),
    scheduleAt:String(scheduleAt || new Date().toISOString()),
    status:'queued',
    payload: JSON.parse(JSON.stringify(payload||{}))
  };
  state.publishQueue=[...(state.publishQueue||[]), job];
  addAuditEvent('publish_queue', 'Job queued', {jobId:job.id, scheduleAt:job.scheduleAt});
  save();
  return job;
}
function listPublishQueue(){
  return [...(state.publishQueue||[])];
}
function updatePublishJobStatus(jobId, status='queued'){
  const allowed=new Set(['queued','running','done','failed','canceled']);
  const s=allowed.has(status)?status:'queued';
  const next=(state.publishQueue||[]).map(j=>j.id===jobId?{...j,status:s,updatedAt:new Date().toISOString()}:j);
  state.publishQueue=next;
  addAuditEvent('publish_queue', `Job ${s}`, {jobId,status:s});
  save();
  return true;
}
function runDuePublishJobs(nowIso=''){
  const now = nowIso ? new Date(nowIso) : new Date();
  let processed=0;
  const next=(state.publishQueue||[]).map(j=>{
    if(j.status!=='queued') return j;
    const at=new Date(j.scheduleAt || j.createdAt || now.toISOString());
    if(at.getTime()<=now.getTime()){
      processed += 1;
      addAuditEvent('scheduler','Job executed',{jobId:j.id});
      return {...j,status:'done',updatedAt:new Date().toISOString()};
    }
    return j;
  });
  state.publishQueue=next;
  save();
  return {processed,total:next.length};
}
async function runDuePublishJobsOnServer(nowIso='', opts={}){
  const apiUrl=String(opts.apiUrl || getSchedulerApiUrl()).trim();
  const apiToken=String(opts.apiToken ?? getApiAccessToken()).trim();
  const headers={'Content-Type':'application/json'};
  if(apiToken) headers['X-API-Token']=apiToken;
  const res=await fetch(apiUrl,{
    method:'POST',
    headers,
    body:JSON.stringify({
      action:'run_due',
      nowIso: String(nowIso||''),
      projectId: String(state._projectId || ''),
      queue: listPublishQueue()
    })
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data?.error) throw new Error(String(data?.error || `Scheduler API failed (${res.status})`));
  const queue=Array.isArray(data?.queue) ? data.queue : [];
  state.publishQueue=queue;
  addAuditEvent('scheduler','Server scheduler run',{processed:Number(data?.processed||0)});
  save();
  return {processed:Number(data?.processed||0), total:Number(data?.total||queue.length), queue};
}
async function fetchAnalyticsSnapshot(range='30d', opts={}){
  const apiUrl=String(opts.apiUrl || getAnalyticsApiUrl()).trim();
  const apiToken=String(opts.apiToken ?? getApiAccessToken()).trim();
  const headers={'Content-Type':'application/json'};
  if(apiToken) headers['X-API-Token']=apiToken;
  const res=await fetch(apiUrl,{
    method:'POST',
    headers,
    body:JSON.stringify({
      action:'snapshot',
      range:String(range||'30d'),
      projectId:String(state._projectId||''),
      channelProfile: state.channelProfile || {},
      generationHistory: state.generationHistory || {}
    })
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data?.error) throw new Error(String(data?.error || `Analytics API failed (${res.status})`));
  state.analyticsSnapshot = {
    ts:new Date().toISOString(),
    range:String(range||'30d'),
    ...data
  };
  addAuditEvent('analytics','Analytics snapshot refreshed',{range:String(range||'30d')});
  save();
  return state.analyticsSnapshot;
}
async function fetchServerAudit(limit=80, opts={}){
  const apiUrl=String(opts.apiUrl || getAuditApiUrl()).trim();
  const apiToken=String(opts.apiToken ?? getApiAccessToken()).trim();
  const headers={};
  if(apiToken) headers['X-API-Token']=apiToken;
  const q=`?limit=${encodeURIComponent(String(limit||80))}`;
  const res=await fetch(apiUrl+q,{method:'GET',headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data?.error) throw new Error(String(data?.error || `Audit API failed (${res.status})`));
  return Array.isArray(data?.items) ? data.items : [];
}
function getMarketplaceTemplates(){
  return [
    {
      id:'tpl-cz-viral-titles',
      name:'CZ Viral Titles Pack',
      type:'titles',
      prompt:'Použij agresivnější hook, jasný benefit a 2 trendy keywordy v každém title. Výstup pouze JSON pole.'
    },
    {
      id:'tpl-clean-descriptions',
      name:'Clean Description Pack',
      type:'descriptions',
      prompt:'Piš čistě, bez výplně, first 2 lines sales hook, potom přesná timeline a CTA.'
    },
    {
      id:'tpl-shorts-gold',
      name:'Shorts Gold Hunter',
      type:'growth',
      prompt:'Prioritizuj momenty s konfliktem, překvapením nebo konkrétní rychlou radou. U každého klipu dej silný overlay hook.'
    }
  ];
}
function installMarketplaceTemplate(templateId=''){
  const id=String(templateId||'').trim();
  const tpl=getMarketplaceTemplates().find(x=>x.id===id);
  if(!tpl) return false;
  const s=ensureSettingsShape(state.settings);
  if(!(s.marketplace.installed||[]).includes(id)){
    s.marketplace.installed=[...(s.marketplace.installed||[]),id];
  }
  if(tpl.type==='titles') s.prompts.titles = [s.prompts.titles, tpl.prompt].filter(Boolean).join('\n\n');
  if(tpl.type==='descriptions') s.prompts.descriptions = [s.prompts.descriptions, tpl.prompt].filter(Boolean).join('\n\n');
  if(tpl.type==='growth') s.prompts.growth = [s.prompts.growth, tpl.prompt].filter(Boolean).join('\n\n');
  state.settings=s;
  addAuditEvent('marketplace','Template installed',{templateId:id});
  save();
  return true;
}
function setApprovalState(approvalState='draft', note=''){
  const allowed=new Set(['draft','review','approved']);
  const s=allowed.has(approvalState)?approvalState:'draft';
  state.approval={...(state.approval||{}),state:s,updatedAt:new Date().toISOString(),note:String(note||'')};
  addAuditEvent('approval',`Approval -> ${s}`,{note:String(note||'')});
  save();
  return {...state.approval};
}
function setApprovalPolicy(reviewer='', requiredApprovals=1){
  const req=Math.max(1, Math.min(10, Number(requiredApprovals||1)));
  state.approval={
    ...(state.approval||{}),
    reviewer:String(reviewer||''),
    requiredApprovals:req,
    updatedAt:new Date().toISOString()
  };
  addAuditEvent('approval','Approval policy updated',{reviewer:String(reviewer||''), requiredApprovals:req});
  save();
  return {...state.approval};
}
function addApprovalVote(actor='', decision='approve', note=''){
  const who=String(actor || state.settings?.team?.actor || 'reviewer').trim();
  const d=decision==='reject' ? 'reject' : 'approve';
  const votes=Array.isArray(state.approval?.votes) ? [...state.approval.votes] : [];
  const entry={id:`vote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`,actor:who,decision:d,note:String(note||''),ts:new Date().toISOString()};
  votes.unshift(entry);
  const required=Math.max(1, Number(state.approval?.requiredApprovals || 1));
  const approveCount=votes.filter(v=>v.decision==='approve').length;
  const rejectCount=votes.filter(v=>v.decision==='reject').length;
  let next='review';
  if(rejectCount>0) next='draft';
  if(approveCount>=required && rejectCount===0) next='approved';
  state.approval={...(state.approval||{}), votes, state:next, updatedAt:new Date().toISOString()};
  addAuditEvent('approval',`Vote ${d}`,{actor:who,nextState:next});
  save();
  return {...state.approval};
}
function canPublishNow(){
  return String(state.approval?.state||'draft') === 'approved';
}
function _slug(s=''){
  return String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,60);
}
function buildClipPipelineFromClips(clips=[]){
  const src=Array.isArray(clips)?clips:[];
  const out=src.slice(0,8).map((c,idx)=>{
    const hook=String(c.hook || c.caption || `Hook ${idx+1}`).trim();
    const reason=String(c.reason || c.caption || '').trim();
    const script=`${hook}. ${reason || 'Tady přijde pointa během 12-20 sekund.'}`.trim();
    const caption=`${hook}${reason ? `\n${reason}` : ''}`;
    const words=_safeWords(`${hook} ${reason}`).slice(0,4).map(x=>`#${_slug(x)}`).filter(Boolean);
    const hashtags=[...new Set(['#shorts','#podcast','#erem',...words])].slice(0,8);
    return {
      id:`clip-${Date.now().toString(36)}-${idx}`,
      start:String(c.start || '00:00'),
      hook,
      script,
      caption,
      hashtags
    };
  });
  state.clipPipeline=out;
  addAuditEvent('clips','Clip pipeline built',{count:out.length});
  save();
  return out;
}
function setAbPlannerPlan(variants=[], notes=''){
  const list=Array.isArray(variants)?variants:[];
  state.abPlanner={
    ...(state.abPlanner||{variants:[],results:[],selectedWinner:'',notes:''}),
    variants:list.map((v,i)=>({
      id:String(v.id || `var-${i+1}`),
      label:String(v.label || `Variant ${i+1}`),
      channel:String(v.channel || 'youtube'),
      publishAt:String(v.publishAt || ''),
      asset:String(v.asset || '')
    })),
    notes:String(notes||'')
  };
  addAuditEvent('ab_planner','A/B plan saved',{count:state.abPlanner.variants.length});
  save();
  return {...state.abPlanner};
}
function importAbPlannerResults(results=[]){
  const list=Array.isArray(results)?results:[];
  const rows=list.map((r,i)=>({
    variantId:String(r.variantId || r.id || `var-${i+1}`),
    impressions:Number(r.impressions || 0),
    clicks:Number(r.clicks || 0),
    watchTime:Number(r.watchTime || 0),
    ctr:Number(r.ctr || 0)
  })).map(r=>{
    const ctr = r.ctr>0 ? r.ctr : (r.impressions>0 ? (r.clicks/r.impressions)*100 : 0);
    return {...r, ctr:Number(ctr.toFixed(2))};
  });
  let winner='';
  if(rows.length){
    winner=[...rows].sort((a,b)=>b.ctr-a.ctr || b.watchTime-a.watchTime)[0].variantId;
  }
  state.abPlanner={
    ...(state.abPlanner||{variants:[],results:[],selectedWinner:'',notes:''}),
    results:rows,
    selectedWinner:winner
  };
  addAuditEvent('ab_planner','A/B results imported',{count:rows.length,winner});
  save();
  return {...state.abPlanner};
}
function exportChannelPayloads(){
  const title=String(state.abSelections?.title || state.smartTitles?.[0]?.title || state.episode || '').trim();
  const ytDesc=String(state.descGenerated?.youtube_description || '').trim();
  const spHtml=String(state.descGenerated?.spotify_html || '').trim();
  const baseTags=(state.keywords||[]).slice(0,10).map(x=>_slug(x)).filter(Boolean);
  const youtubePayload={
    title,
    description: ytDesc,
    tags: baseTags,
    categoryId:'22',
    privacyStatus:'private'
  };
  const spotifyPayload={
    title: String(state.episode||''),
    description_html: spHtml,
    chapters: normalizedTimelineItems().map(x=>({time:x.ts_hms,title:x.title}))
  };
  const pack={
    projectId: String(state._projectId||''),
    generatedAt: new Date().toISOString(),
    youtube: youtubePayload,
    spotify: spotifyPayload
  };
  addAuditEvent('export','Channel payload exported',{projectId:pack.projectId});
  save();
  return pack;
}
function routePublishJobs(channel={}, outputs={}){
  const mode=String(channel?.mode || 'both');
  const publishMode=String(channel?.publishMode || 'manual');
  const jobs=[];
  if(mode==='youtube' || mode==='both' || mode==='auto'){
    jobs.push({
      id:`pub-yt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`,
      target:'youtube',
      mode:publishMode,
      payload:{
        title:String(outputs?.title || ''),
        description:String(outputs?.youtube_description || ''),
        timeline:Array.isArray(outputs?.timeline)?outputs.timeline:[]
      }
    });
  }
  if(mode==='spotify' || mode==='both' || mode==='auto'){
    jobs.push({
      id:`pub-sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`,
      target:'spotify',
      mode:publishMode,
      payload:{
        title:String(outputs?.episode || ''),
        description_html:String(outputs?.spotify_html || ''),
        timeline:Array.isArray(outputs?.timeline)?outputs.timeline:[]
      }
    });
  }
  return jobs;
}
async function enqueuePublishJobOnServer(payload={}, scheduleAt='', opts={}){
  const data=await _queueApiRequest({
    action:'enqueue',
    projectId:String(state._projectId||''),
    payload,
    scheduleAt:String(scheduleAt || new Date().toISOString())
  }, 'POST', opts);
  const queue=Array.isArray(data?.queue) ? data.queue : [];
  if(queue.length) state.publishQueue=queue;
  addAuditEvent('publish_queue','Server enqueue',{projectId:String(state._projectId||'')});
  save();
  return {ok:true, queue};
}
async function pullPublishQueueFromServer(opts={}){
  const data=await _queueApiRequest({projectId:String(state._projectId||'')}, 'GET', opts);
  const queue=Array.isArray(data?.queue) ? data.queue : [];
  state.publishQueue=queue;
  save();
  return queue;
}
async function updatePublishJobStatusOnServer(jobId, status='queued', opts={}){
  const data=await _queueApiRequest({
    action:'update_status',
    projectId:String(state._projectId||''),
    jobId:String(jobId||''),
    status:String(status||'queued')
  }, 'POST', opts);
  const queue=Array.isArray(data?.queue) ? data.queue : [];
  state.publishQueue=queue;
  addAuditEvent('publish_queue','Server status update',{jobId:String(jobId||''), status:String(status||'queued')});
  save();
  return queue;
}
function compareVariants(kind='title', left='', right=''){
  const k=String(kind||'title');
  const l=String(left||'').trim();
  const r=String(right||'').trim();
  if(!l || !r){
    return {ok:false, reason:'missing values'};
  }
  if(k==='title'){
    const lScore=scoreTitle(l);
    const rScore=scoreTitle(r);
    const winner=lScore===rScore ? 'tie' : (lScore>rScore ? 'left' : 'right');
    return {ok:true, kind:k, left:{value:l,score:lScore}, right:{value:r,score:rScore}, winner};
  }
  // description compare: prefer strong opening and readable length
  const dScore=(txt='')=>{
    const t=String(txt||'');
    const len=t.length;
    let s=50;
    if(len>=300 && len<=1400) s+=25;
    else if(len<180) s-=15;
    const firstTwo=t.split('\n').slice(0,2).join(' ').trim();
    if(firstTwo.length>=40) s+=10;
    if(/cta|subscribe|odeber|follow|klikni|link/i.test(t)) s+=8;
    return Math.max(0,Math.min(100,s));
  };
  const lScore=dScore(l);
  const rScore=dScore(r);
  const winner=lScore===rScore ? 'tie' : (lScore>rScore ? 'left' : 'right');
  return {ok:true, kind:k, left:{value:l,score:lScore}, right:{value:r,score:rScore}, winner};
}
function recomputeChannelProfile(){
  const tasks=state.settings?.promptOptimizer?.tasks || {};
  const titleAvg=Number(tasks.titles?.avgScore || 0);
  const uses=Number(tasks.titles?.uses || 0)+Number(tasks.descriptions?.uses || 0)+Number(tasks.growth?.uses || 0);
  const ok=Number(tasks.titles?.ok || 0)+Number(tasks.descriptions?.ok || 0)+Number(tasks.growth?.ok || 0);
  const successRate=uses?Math.round((ok/uses)*100):0;
  let tone='balanced';
  if(titleAvg>=80) tone='bold';
  else if(titleAvg<60) tone='clear';
  const recommendations=[];
  if(successRate<50) recommendations.push('Zkrátit prompty a zpřesnit vstupy.');
  if(titleAvg<70) recommendations.push('Zvýšit důraz na curiosity/high-stakes pattern.');
  if(!recommendations.length) recommendations.push('Profil je stabilní, drž konzistentní styl.');
  state.channelProfile={tone,successRate,avgTitleScore:Math.round(titleAvg),recommendations};
  save();
  return {...state.channelProfile};
}
function ingestPerformanceMetrics(metrics={}){
  const m=(metrics && typeof metrics==='object') ? metrics : {};
  const ctr=Number(m.ctr || 0);
  const retention=Number(m.retention || 0);
  const titlePerf=Number(m.titleScore || 0);
  const source=String(m.source || 'manual');
  const tasks=state.settings?.promptOptimizer?.tasks;
  if(!tasks) return {ok:false, reason:'missing optimizer tasks'};

  // Feedback loop: map external KPI to internal optimizer scores.
  const perfScore=Math.max(0,Math.min(100, Math.round((ctr*3.2 + retention*0.9 + titlePerf*0.6)/3)));
  const apply=(task)=>{
    task.uses = Number(task.uses||0) + 1;
    task.ok = Number(task.ok||0) + (perfScore>=60 ? 1 : 0);
    task.fail = Number(task.fail||0) + (perfScore<60 ? 1 : 0);
    const prev=Number(task.avgScore||0);
    const n=Math.max(1, Number(task.uses||1));
    task.avgScore = Number((prev + (perfScore-prev)/n).toFixed(2));
    task.lastUsedAt = new Date().toISOString();
  };
  apply(tasks.titles);
  apply(tasks.descriptions);
  apply(tasks.growth);

  state.performanceSnapshot={
    ts:new Date().toISOString(),
    source,
    ctr:Number(ctr.toFixed(2)),
    retention:Number(retention.toFixed(2)),
    titleScore:Number(titlePerf.toFixed(2)),
    perfScore
  };
  addAuditEvent('performance','Performance metrics ingested',{source,ctr,retention,perfScore});
  recomputeChannelProfile();
  save();
  return {ok:true, perfScore, snapshot:{...state.performanceSnapshot}};
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

function buildTitlesPrompt({transcript='', trendsKeywords=[], audience='CZ', titleCount=10}={}){
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
    `Vygeneruj ${Math.max(1,Math.min(30,Number(titleCount)||10))} unikatnich nazvu v techto kategoriich:`,
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
function getBaseToolRegistry(){
  return [
    {id:'core-projects',name:'Project Manager',group:'Core',status:'implemented',description:'Správa projektů podle URL/ID s lokálním úložištěm.',inputs:'video URL, metadata',outputs:'project state',contract:normalizeToolContract({inputSchema:'{"videoUrl":"string","metadata":"object"}',outputSchema:'{"projectId":"string","state":"object"}',handler:'local.projectManager'})},
    {id:'core-descriptions',name:'Smart Description',group:'Core',status:'implemented',description:'Generování YouTube/Spotify textů s LLM fallbackem.',inputs:'timeline, desc',outputs:'youtube text, spotify html',contract:normalizeToolContract({inputSchema:'{"timeline":"string","descShort":"string"}',outputSchema:'{"youtube_description":"string","spotify_html":"string"}',handler:'llm.smartDescription'})},
    {id:'growth-scout',name:'Growth & Clips Scout',group:'Growth',status:'implemented',description:'Hledání clip kandidátů a retention tipů.',inputs:'transcript/timeline',outputs:'clips, retention tip',contract:normalizeToolContract({inputSchema:'{"transcript":"string"}',outputSchema:'{"clips":"array","retention_tip":"string"}',handler:'llm.growthScout'})},
    {id:'titles-engine',name:'Strategic Titles Engine',group:'Titles',status:'implemented',description:'Návrhy title variant podle strategií CTR.',inputs:'transcript, trends',outputs:'title variants',contract:normalizeToolContract({inputSchema:'{"transcript":"string","trends":"array"}',outputSchema:'{"titles":"array"}',handler:'llm.titlesEngine'})},
    {id:'trend-ingest',name:'Trend Ingestor',group:'Discovery',status:'implemented',description:'Načítání trend keywordů (CZ/US).',inputs:'RSS feeds',outputs:'trend snapshot',contract:normalizeToolContract({inputSchema:'{"feeds":"array"}',outputSchema:'{"keywords":"array","updatedAt":"string"}',handler:'system.trendIngest'})},
    {id:'thumbnail-lab',name:'Thumbnail Lab',group:'Creative',status:'implemented',description:'Skórování thumbnail textu.',inputs:'thumb text',outputs:'score',contract:normalizeToolContract({inputSchema:'{"thumbText":"string"}',outputSchema:'{"score":"number"}',handler:'local.thumbnailScore'})},
    {id:'publish-router',name:'Publish Router',group:'Distribution',status:'planned',description:'Směrování výstupů dle channel mode a publish mode.',inputs:'channel settings',outputs:'publish payload',contract:normalizeToolContract({inputSchema:'{"channel":"object","payload":"object"}',outputSchema:'{"jobs":"array"}',handler:'pipeline.publishRouter'})},
    {id:'ab-lab',name:'A/B Experiment Lab',group:'Experiments',status:'planned',description:'Testovací varianty title/thumbnail/description.',inputs:'variants',outputs:'winner recommendation',contract:normalizeToolContract({inputSchema:'{"variants":"array","metric":"string"}',outputSchema:'{"winner":"object","confidence":"number"}',handler:'pipeline.abLab'})},
    {id:'analytics-hub',name:'Analytics Hub',group:'Analytics',status:'planned',description:'Konsolidace výkonových metrik napříč platformami.',inputs:'platform metrics',outputs:'kpi dashboard',contract:normalizeToolContract({inputSchema:'{"sources":"array","range":"string"}',outputSchema:'{"kpi":"object","series":"array"}',handler:'pipeline.analyticsHub'})},
    {id:'automation-engine',name:'Automation Engine',group:'Automation',status:'planned',description:'Plánované dávky a trigger-based workflow.',inputs:'schedule, triggers',outputs:'executed jobs',contract:normalizeToolContract({inputSchema:'{"schedule":"object","triggers":"array"}',outputSchema:'{"runs":"array"}',handler:'pipeline.automationEngine'})}
  ];
}
function getMergedToolRegistry(settings){
  const s=ensureSettingsShape(settings);
  const base=getBaseToolRegistry();
  const byId=new Map(base.map(x=>[x.id,x]));
  for(const c of (s.tooling?.customTools||[])){
    byId.set(c.id, {...c});
  }
  return [...byId.values()];
}
function addCustomToolToSettings(settings, toolInput={}){
  const s=ensureSettingsShape(settings);
  const tool={
    id:String(toolInput.id || `custom-${Date.now().toString(36)}`),
    name:String(toolInput.name || 'Custom Tool'),
    group:String(toolInput.group || 'Custom'),
    status:String(toolInput.status || 'planned'),
    description:String(toolInput.description || ''),
    inputs:String(toolInput.inputs || ''),
    outputs:String(toolInput.outputs || ''),
    contract: normalizeToolContract(toolInput.contract)
  };
  s.tooling.customTools = [...(s.tooling.customTools||[]), tool];
  return s;
}
function upsertToolContractInSettings(settings, toolId, contractInput={}){
  const s=ensureSettingsShape(settings);
  const id=String(toolId||'').trim();
  if(!id) return s;
  const contract=normalizeToolContract(contractInput);
  const idx=(s.tooling.customTools||[]).findIndex(t=>t.id===id);
  if(idx>=0){
    const next=[...(s.tooling.customTools||[])];
    next[idx]={...next[idx], contract};
    s.tooling.customTools=next;
    return s;
  }
  const base=getBaseToolRegistry().find(t=>t.id===id);
  if(base){
    const shadow={...base, contract};
    s.tooling.customTools=[...(s.tooling.customTools||[]), shadow];
  }
  return s;
}
function _inferType(v){
  if(Array.isArray(v)) return 'array';
  if(v===null) return 'null';
  return typeof v;
}
function validatePayloadAgainstSchema(schemaText='', payload={}){
  const raw=String(schemaText||'').trim();
  if(!raw) return {ok:true, errors:[]};
  let schema;
  try{
    schema=JSON.parse(raw);
  }catch{
    return {ok:false, errors:['Schema není validní JSON.']};
  }
  if(!schema || typeof schema!=='object' || Array.isArray(schema)){
    return {ok:false, errors:['Schema musí být JSON objekt typu {"field":"type"}.']};
  }
  const errors=[];
  for(const [k, expected] of Object.entries(schema)){
    const actual=(payload||{})[k];
    const expectedType=String(expected||'').toLowerCase().trim();
    if(expectedType==='optional') continue;
    if(actual===undefined){
      errors.push(`Chybí pole "${k}".`);
      continue;
    }
    const actualType=_inferType(actual);
    if(expectedType && actualType!==expectedType){
      errors.push(`Pole "${k}" má typ ${actualType}, očekáván ${expectedType}.`);
    }
  }
  return {ok:errors.length===0, errors};
}
function validateToolContractPayload(toolId, inputPayload={}, outputPayload={}, settings){
  const reg=getMergedToolRegistry(settings || state.settings);
  const tool=reg.find(t=>t.id===toolId);
  if(!tool) return {ok:false, errors:[`Tool ${toolId} nebyl nalezen.`]};
  const inputCheck=validatePayloadAgainstSchema(tool.contract?.inputSchema||'', inputPayload||{});
  const outputCheck=validatePayloadAgainstSchema(tool.contract?.outputSchema||'', outputPayload||{});
  const errors=[...inputCheck.errors.map(e=>`input: ${e}`), ...outputCheck.errors.map(e=>`output: ${e}`)];
  return {ok:errors.length===0, errors};
}

function _avg(nums=[]){
  const v=nums.filter(n=>Number.isFinite(Number(n))).map(Number);
  if(!v.length) return 0;
  return v.reduce((a,b)=>a+b,0)/v.length;
}
function _topWeightedKeywords(weights={}, take=6){
  return Object.entries(weights||{})
    .filter(([,w])=>Number.isFinite(Number(w)) && Number(w)>0)
    .sort((a,b)=>Number(b[1])-Number(a[1]))
    .slice(0,take)
    .map(([k])=>k);
}
function _safeWords(s=''){
  return String(s||'').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,' ').split(/\s+/).filter(x=>x.length>2);
}
function buildAdaptivePrompt(taskType, settings, context={}){
  const s=ensureSettingsShape(settings);
  if(!s.promptOptimizer?.enabled) return '';
  const taskStats=s.promptOptimizer.tasks?.[taskType] || {};
  const trendNow = (context.trendsKeywords||state.trendSnapshot?.merged||state.keywords||[]).slice(0,12).map(x=>String(x).toLowerCase());
  const learned = _topWeightedKeywords(taskStats.trendWeights||{}, 6);
  const merged = [...new Set([...learned,...trendNow])].slice(0,10);
  const successRate = taskStats.uses ? Math.round((taskStats.ok/taskStats.uses)*100) : 0;
  const quality = Math.round(Number(taskStats.avgScore||0));
  return [
    'AUTO OPTIMIZER (internal):',
    `task=${taskType}; usage=${taskStats.uses||0}; success_rate=${successRate}%; quality=${quality}/100`,
    merged.length ? `prefer_keywords=${merged.join(', ')}` : '',
    successRate<45 ? 'increase_clarity=true; simplify_output=true; strict_json=true' : 'keep_style=true; strict_json=true'
  ].filter(Boolean).join('\n');
}
function updatePromptOptimizer(taskType, settings, context={}, result={}){
  const s=ensureSettingsShape(settings);
  const t=s.promptOptimizer.tasks[taskType];
  t.uses += 1;
  t.lastUsedAt = new Date().toISOString();
  if(result.ok) t.ok += 1; else t.fail += 1;

  let score=0;
  if(taskType==='titles'){
    const arr=Array.isArray(result.titles)?result.titles:[];
    score = _avg(arr.map(x=>Number(x.score||0)));
    const trendSet=(context.trendsKeywords||[]).map(x=>String(x).toLowerCase());
    for(const row of arr){
      const w=_safeWords(row.title||'');
      for(const k of trendSet){
        if((row.title||'').toLowerCase().includes(k)){
          t.trendWeights[k]=(Number(t.trendWeights[k]||0)+1);
        }
      }
      for(const word of w){
        if(trendSet.includes(word)) t.trendWeights[word]=(Number(t.trendWeights[word]||0)+0.5);
      }
    }
  }else if(taskType==='descriptions'){
    const ytLen=String(result.youtube_description||'').length;
    const spLen=String(result.spotify_html||'').length;
    score = Math.max(0, Math.min(100, Math.round((Math.min(ytLen,900)/9 + Math.min(spLen,1200)/12)/2)));
  }else if(taskType==='growth'){
    const clips=Array.isArray(result.clips)?result.clips:[];
    const retentionLen=String(result.retention_tip||'').length;
    score = Math.max(0, Math.min(100, clips.length*16 + Math.min(retentionLen,80)*0.25));
  }
  if(score>0){
    const prev=t.avgScore||0;
    const n=Math.max(1,t.ok);
    t.avgScore = Number((prev + (score-prev)/n).toFixed(2));
  }
  return s;
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
  const apiToken = opts.apiToken ?? getApiAccessToken();
  const attempts = Math.max(1,Math.min(3,Number(opts.retries ?? 2)));
  const timeoutMs = Math.max(3000,Math.min(90000,Number(opts.timeoutMs ?? 30000)));

  let lastErr = null;
  for(let i=0;i<attempts;i++){
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), timeoutMs);
    try{
      const headers = {'Content-Type':'application/json'};
      if(apiToken) headers['X-API-Token']=apiToken;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        signal: controller.signal,
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
      if(data && typeof data === 'object'){
        if(data.payload) return data.payload;
        if(data.clips || data.youtube_description || Array.isArray(data)) return data;
      }
      const text = data?.text || data?.output || data?.message || '';
      const parsed = _extractJsonPayload(text);
      if(parsed) return parsed;
      throw new Error('LLM response is not valid JSON payload.');
    }catch(err){
      lastErr = err;
      if(i===attempts-1) break;
      await new Promise(r=>setTimeout(r, 350*(i+1)));
    }finally{
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('LLM request failed');
}

async function generateStrategicTitles(input={}){
  const transcript = (input.transcript || state.timeline || '').trim();
  const trendsKeywords = input.trendsKeywords || state.trendSnapshot?.merged || state.keywords || [];
  const audience = input.audience || 'CZ';
  const titleCount = Number(input.maxTitles || 10);
  const out = await callCodex('titles', {transcript, trendsKeywords, audience, titleCount, promptOverride: input.promptOverride || ''}, input.options || {});
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
  const out = await callCodex('descriptions', {timeline, descShort, promptOverride: input.promptOverride || ''}, input.options || {});
  if(!out || typeof out !== 'object') throw new Error('Descriptions payload must be object.');
  return {
    youtube_description: String(out.youtube_description || '').trim(),
    spotify_html: String(out.spotify_html || '').trim()
  };
}

async function generateGrowthAndClips(input={}){
  const transcript = (input.transcript || state.timeline || '').trim();
  const out = await callCodex('growth', {transcript, promptOverride: input.promptOverride || ''}, input.options || {});
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
function _historyKey(type=''){
  const t=String(type||'').toLowerCase();
  if(t==='titles') return 'titles';
  if(t==='descriptions') return 'descriptions';
  if(t==='clips') return 'clips';
  return '';
}
function addGenerationSnapshot(type, payload={}, meta={}){
  const key=_historyKey(type);
  if(!key) return false;
  const hist=normalizeProjectShape(state).generationHistory;
  const entry={
    id:`hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
    ts:new Date().toISOString(),
    type:key,
    payload: JSON.parse(JSON.stringify(payload||{})),
    meta: {
      source: String(meta.source || 'llm'),
      note: String(meta.note || ''),
      mode: String(meta.mode || state.settings?.channel?.mode || 'both')
    }
  };
  hist[key]=[entry, ...(hist[key]||[])].slice(0,30);
  state.generationHistory=hist;
  save();
  return true;
}
function listGenerationHistory(type){
  const hist=normalizeProjectShape(state).generationHistory;
  const key=_historyKey(type);
  if(key) return [...(hist[key]||[])];
  return {
    titles:[...(hist.titles||[])],
    descriptions:[...(hist.descriptions||[])],
    clips:[...(hist.clips||[])]
  };
}
function rollbackGenerationSnapshot(type, historyId){
  const key=_historyKey(type);
  if(!key) return false;
  const list=listGenerationHistory(key);
  const row=list.find(x=>x.id===historyId);
  if(!row) return false;
  if(key==='titles'){
    const arr=Array.isArray(row.payload?.items)?row.payload.items:[];
    state.smartTitles=arr;
    state.titles=arr.map(x=>String(x.title||''));
  }else if(key==='descriptions'){
    const yt=String(row.payload?.youtube_description||'');
    const sp=String(row.payload?.spotify_html||'');
    state.descGenerated={youtube_description:yt,spotify_html:sp};
  }else if(key==='clips'){
    const clips=Array.isArray(row.payload?.clips)?row.payload.clips:[];
    state.clips=clips;
  }
  save();
  return true;
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

window.Studio={state,save,bindCore,spotifyLines,normalizedTimelineItems,ytText,spText,copy,scoreTitle,scoreThumb,retentionHints,mineClips,trendRadar,buildPromptForTitleAI,suggestTitlesFromTranscript,refreshDailyTrendData,trendDrivenTitleVariants,callCodex,generateStrategicTitles,generateSmartDescriptions,generateGrowthAndClips,getCodexApiUrl,setCodexApiUrl,getApiAccessToken,setApiAccessToken,getProjectsApiUrl,setProjectsApiUrl,getAnalyticsApiUrl,getSchedulerApiUrl,getAuditApiUrl,getQueueApiUrl,syncProjectToServer,deleteProjectOnServer,pullProjectsFromServer,replaceAllLocalProjects,addAuditEvent,listAuditLog,enqueuePublishJob,enqueuePublishJobOnServer,pullPublishQueueFromServer,updatePublishJobStatusOnServer,listPublishQueue,updatePublishJobStatus,runDuePublishJobs,runDuePublishJobsOnServer,fetchAnalyticsSnapshot,fetchServerAudit,getMarketplaceTemplates,installMarketplaceTemplate,buildClipPipelineFromClips,setAbPlannerPlan,importAbPlannerResults,exportChannelPayloads,routePublishJobs,compareVariants,ingestPerformanceMetrics,setApprovalState,setApprovalPolicy,addApprovalVote,canPublishNow,recomputeChannelProfile,ensureSettingsShape,buildAdaptivePrompt,updatePromptOptimizer,getBaseToolRegistry,getMergedToolRegistry,addCustomToolToSettings,upsertToolContractInSettings,validateToolContractPayload,isValidVideoUrl,validateTimelineText,addGenerationSnapshot,listGenerationHistory,rollbackGenerationSnapshot,defaultSettings:DEFAULT_SETTINGS,listProjects,selectProject,removeProject};


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
