import {validatePages} from './pages.js';
import {safeLocalImage,ROOM_ARTWORK} from './artwork.js';
export const VERSION='0.1.0-beta.1';
export const ROOM_TYPES={living_room:['Living room','mdi:sofa-outline'],kitchen:['Kitchen','mdi:countertop-outline'],dining_room:['Dining room','mdi:silverware-fork-knife'],hallway:['Hallway','mdi:door-open'],main_bedroom:['Main bedroom','mdi:bed-king-outline'],kids_bedroom:['Kids bedroom','mdi:bed-single-outline'],guest_bedroom:['Guest bedroom','mdi:bed-outline'],office:['Office','mdi:desk'],bathroom:['Bathroom','mdi:shower'],utility:['Utility room','mdi:washing-machine'],landing:['Landing','mdi:stairs'],garage:['Garage','mdi:garage'],outdoor:['Outdoor','mdi:tree-outline']};
export const DEFAULTS={schema_version:1,auto_detect:true,title:'Our home',demo:'auto',rooms:Object.entries(ROOM_TYPES).map(([id,[name,icon]])=>({id,name,icon,entities:{}})),energy:{battery_positive:'charging',entities:{},flows:{}},weather:'',sun:'sun.sun',people:[],appliances:[{id:'washer',name:'Washing machine',kind:'washer',entities:{}},{id:'dryer',name:'Dryer',kind:'dryer',entities:{}},{id:'dishwasher',name:'Dishwasher',kind:'dishwasher',entities:{}},{id:'kettle',name:'Kettle',kind:'kettle',entities:{}},{id:'extractor',name:'Extractor',kind:'extractor',entities:{}},{id:'tv',name:'TV',kind:'tv',entities:{}},{id:'gaming_pc',name:'Gaming PC',kind:'pc',entities:{}},{id:'desk',name:'Office desk',kind:'desk',entities:{}}],lab:[],calendars:[],security:{entities:{}},car:{entities:{}}};
export function startingMapping(mode,title='Our home'){
 if(!['demo','discover','scratch'].includes(mode))throw Error('Unknown starting option');
 const c=structuredClone(DEFAULTS);c.title=title;c.starting_mode=mode;c.demo=mode==='demo';c.auto_detect=mode==='discover';
 if(mode!=='demo'){c.rooms=[];c.appliances=[];c.lab=[];c.calendars=[];}
 c.pages=mode==='scratch'?['home','house']:['home','house','lighting','energy','appliances','calendar','security','car','lab'];
 return c;
}
export const ENTITY=/^[a-z_]+\.[a-z0-9_]+$/;
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateConfig(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Mapping must be a JSON object');
 if(input.schema_version!==1)throw Error('Unsupported schema_version; use 1');
 input=JSON.parse(JSON.stringify(input));
 if(input.pages!==undefined&&(!Array.isArray(input.pages)||input.pages.some(x=>!['home','house','lighting','energy','appliances','calendar','security','car','lab'].includes(x))))throw Error('Invalid dashboard pages');
 if(input.demo!==undefined&&!['auto',true,false].includes(input.demo))throw Error('demo must be auto, true or false');
 const c={...structuredClone(DEFAULTS),...input};c.energy={...structuredClone(DEFAULTS.energy),...input.energy};
 for(const key of ['rooms','appliances','lab','calendars','people'])if(!Array.isArray(c[key]))throw Error(key+' must be an array');
 for(const key of ['rooms','appliances','lab']){const ids=new Set();for(const item of c[key]){if(!/^[a-z][a-z0-9_]*$/.test(item.id)||ids.has(item.id))throw Error(key+' needs unique lowercase IDs');ids.add(item.id);if(!item.name)throw Error(item.id+' needs a name');item.entities||={};}}
 for(const room of c.rooms){if(room.artwork&&!ROOM_ARTWORK[room.artwork])throw Error('Unknown room artwork preset');for(const key of ['picture','icon_picture'])if(room[key]&&!safeLocalImage(room[key]))throw Error(key+' must be a local image path');}
 for(const room of c.rooms)if(room.presence_entities!==undefined){if(!Array.isArray(room.presence_entities)||room.presence_entities.some(id=>typeof id!=='string'||!/^binary_sensor\.[a-z0-9_]+$/.test(id)))throw Error('Presence sensors must be binary_sensor entity IDs');room.presence_entities=[...new Set(room.presence_entities)];}
 for(const a of c.appliances){if(a.running_states!==undefined&&!Array.isArray(a.running_states))throw Error('running_states must be an array');for(const key of ['power_max_w','running_threshold_w'])if(a[key]!==undefined&&(!Number.isFinite(a[key])||a[key]<0||key==='power_max_w'&&a[key]===0))throw Error(key+' must be a valid non-negative number');if(a.duration_unit&&!['s','min','h'].includes(a.duration_unit))throw Error('duration_unit must be s, min or h');}
 validatePages(c);
 const check=v=>{if(typeof v==='string'&&v&&!ENTITY.test(v))throw Error('Invalid entity ID: '+v);};
 for(const item of [...c.rooms,...c.appliances,...c.lab])for(const v of Object.values(item.entities||{}))check(v);
 for(const group of ['energy','security','car']){c[group]||={entities:{}};for(const v of Object.values(c[group].entities||{}))check(v);}
 for(const v of Object.values(c.energy.flows||{}))check(v);
 check(c.weather);check(c.sun);for(const cal of c.calendars){check(cal.entity);if(!cal.entity?.startsWith('calendar.'))throw Error('Calendar entity required');}for(const p of c.people){check(p.entity);}
 if(!['charging','discharging'].includes(c.energy.battery_positive))throw Error('battery_positive must be charging or discharging');
 return c;
}
const e=escapeHTML;
const cache=new Map();
export async function loadMapping(url){
 const target=new URL(url,location.origin);if(target.origin!==location.origin||!target.pathname.startsWith('/local/'))throw Error('Mapping must be a same-origin /local/ JSON file');
 if(!cache.has(target.href))cache.set(target.href,fetch(target.href,{credentials:'same-origin',cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Mapping file not found ('+r.status+')');return validateConfig(await r.json());}).catch(e=>{cache.delete(target.href);throw e;}));
 return structuredClone(await cache.get(target.href));
}
export function reading(h,id){const s=id?h?.states?.[id]:null;return s&&!['unknown','unavailable','none',''].includes(s.state)?s:null;}
export function numeric(h,id){const s=reading(h,id);if(!s)return null;const n=Number(s.state);return Number.isFinite(n)?n:null;}
export function power(h,id){const s=reading(h,id),n=numeric(h,id);return n===null?null:s.attributes?.unit_of_measurement==='W'?n/1000:s.attributes?.unit_of_measurement==='kW'?n:null;}
export function energy(h,id){const s=reading(h,id),n=numeric(h,id);return n===null?null:s.attributes?.unit_of_measurement==='Wh'?n/1000:s.attributes?.unit_of_measurement==='kWh'?n:null;}
export function formatPower(n){return n===null?'Unavailable':Math.abs(n)<1?Math.round(n*1000)+' W':n.toFixed(2)+' kW';}
export function formatEnergy(n){return n===null?'Unavailable':n.toFixed(2)+' kWh';}
export function isDemo(c,entities){return c.demo===true||(c.demo==='auto'&&!Object.values(entities||{}).some(Boolean));}
