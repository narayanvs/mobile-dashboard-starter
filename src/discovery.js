import {roomArtworkType,safeLocalImage} from './artwork.js';
import {reading,ROOM_TYPES,DEFAULTS} from './config.js';
const normal=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const aliases={living_room:['livingroom','living','sittingroom','lounge'],kitchen:['kitchen'],dining_room:['dining','diningroom'],hallway:['hallway','hall','entrance'],main_bedroom:['mainbedroom','masterbedroom','primarybedroom'],kids_bedroom:['kidsroom','kidsbedroom','childrensroom','childrensbedroom'],guest_bedroom:['guestroom','guestbedroom','sparebedroom'],office:['office','study'],bathroom:['bathroom'],utility:['utility','utilityroom','laundry','laundryroom'],landing:['landing'],garage:['garage'],outdoor:['outdoor','garden','outside']};
const selected=new WeakMap();
export async function discover(h,c,{refresh=false}={}){
 if(!h||c.auto_detect===false||c.demo===true)return c;
 const calendarIds=new Set(c.calendars.map(x=>x.entity));const calendars=Object.entries(h.states||{}).filter(([id])=>id.startsWith('calendar.')).filter(([id])=>!calendarIds.has(id)).map(([entity,state])=>({entity,name:state.attributes?.friendly_name||entity.split('.')[1].replaceAll('_',' ')}));c={...c,calendars:[...c.calendars,...calendars]};
 if(refresh)selected.delete(h.connection||h);let request=selected.get(h.connection||h);if(!request){request=Promise.all([h.callWS({type:'config/area_registry/list'}),h.callWS({type:'config/entity_registry/list'}),h.callWS({type:'config/device_registry/list'})]);selected.set(h.connection||h,request);}
 let registry;try{registry=await request;}catch{selected.delete(h.connection||h);return {...c,discovery_report:{summary:'Room/device discovery could not access HA registries. Calendars were checked; map other entities manually or retry.'}};}const [areas,entities,devices]=registry;if(!Array.isArray(areas)||!Array.isArray(entities)||!Array.isArray(devices))return c;
 const out=structuredClone(c),issues=[],deviceMap=new Map(devices.map(d=>[d.id,d])),enabled=entities.filter(x=>!x.disabled_by&&!x.hidden_by&&h.states[x.entity_id]),usedAreas=new Set();
 // Use actual area metadata first. Name inference is limited to read-only
 // environmental sensors; it never assigns switches, alarms or thermostats.
 const labels=area=>{const n=normal(area.name);if(['home','core'].includes(n))return [];const kind=Object.keys(aliases).find(k=>aliases[k].includes(n));return [...new Set([n,...(kind?aliases[kind]:[]),...(n.endsWith('room')?[n.slice(0,-4)]:[])])].filter(x=>x.length>=4);};
 const labelArea=x=>{const text=normal([x.name,x.original_name,h.states[x.entity_id]?.attributes?.friendly_name].filter(Boolean).join(' '));const scored=areas.map(a=>({id:a.area_id,score:Math.max(0,...labels(a).filter(k=>text.includes(k)).map(k=>k.length))})).sort((a,b)=>b.score-a.score);return scored[0]?.score&&scored[0].score!==scored[1]?.score?scored[0].id:null;};
 const assigned=x=>x.area_id||deviceMap.get(x.device_id)?.area_id;
 const environmental=x=>x.entity_id.startsWith('sensor.')&&(['temperature','humidity'].includes(h.states[x.entity_id]?.attributes?.device_class)||['°C','°F'].includes(h.states[x.entity_id]?.attributes?.unit_of_measurement))&&x.entity_category!=='diagnostic'&&!/cpu|processor|internal|battery.*temp|cell.*temp|analog|profile|hold.*temp|ema(?:1h)?/.test(normal([x.name,x.original_name,h.states[x.entity_id]?.attributes?.friendly_name].join(' ')));
 const bridgeAreas=new Map();for(const x of enabled.filter(environmental)){if(x.device_id){const a=labelArea(x);if(a){if(!bridgeAreas.has(x.device_id))bridgeAreas.set(x.device_id,new Set());bridgeAreas.get(x.device_id).add(a);}}}
 const namedSensors=id=>enabled.filter(x=>environmental(x)&&labelArea(x)===id&&(!assigned(x)||(bridgeAreas.get(x.device_id)?.size||0)>1));
 const forArea=id=>enabled.filter(x=>(x.area_id||deviceMap.get(x.device_id)?.area_id)===id),unique=list=>list.length===1?list[0].entity_id:'';
 for(const area of areas){const found=Object.keys(aliases).filter(id=>aliases[id].includes(normal(area.name)));let room=out.rooms.find(r=>normal(r.area||r.name)===normal(area.name))||(found.length===1?out.rooms.find(r=>r.id===found[0]):null);const pool=forArea(area.area_id),fallback=namedSensors(area.area_id);if(!pool.some(x=>/^(light|climate|sensor|binary_sensor)\./.test(x.entity_id))&&!fallback.length)continue;
 if(!room){const id='area_'+normal(area.area_id||area.name);if(out.rooms.some(r=>r.id===id))continue;room={id,name:area.name,icon:area.icon||'mdi:home-outline',entities:{}};out.rooms.push(room);}
 usedAreas.add(area.area_id);room.area_id=area.area_id;if(!room.artwork)room.artwork=roomArtworkType({...room,name:area.name,icon:area.icon||room.icon});if(!room.picture&&safeLocalImage(area.picture))room.picture=area.picture;room.entities||={};const put=(k,list)=>{if(!room.entities[k]){const id=unique(list);if(id)room.entities[k]=id;else if(list.length>1)issues.push(area.name+': choose '+k+' ('+list.length+' candidates)');}};
 const candidates=(domain,classes)=>pool.filter(x=>{const s=h.states[x.entity_id],a=s.attributes||{};const unitMatch=classes.includes('temperature')&&['°C','°F'].includes(a.unit_of_measurement);return x.entity_id.startsWith(domain+'.')&&(classes.includes(a.device_class)||unitMatch);});
 const climateDevices=new Set(pool.filter(x=>x.entity_id.startsWith('climate.')).map(x=>x.device_id).filter(Boolean));
 const environment=(key)=>{let list=candidates('sensor',[key]).filter(x=>environmental(x)&&!climateDevices.has(x.device_id));if(!list.length)list=fallback.filter(x=>h.states[x.entity_id].attributes.device_class===key&&!entities.some(e=>e.device_id&&e.device_id===x.device_id&&e.entity_id.startsWith('climate.')));if(key==='temperature'&&list.length>1){const paired=list.filter(x=>x.device_id&&enabled.some(e=>e.device_id===x.device_id&&h.states[e.entity_id].attributes?.device_class==='humidity'));if(paired.length===1)list=paired;}return list;};
 put('temperature',environment('temperature'));
 put('humidity',environment('humidity'));
 if(!room.entities.presence&&!room.presence_entities?.length){const presence=candidates('binary_sensor',['occupancy','presence','motion']);if(presence.length===1)room.entities.presence=presence[0].entity_id;else if(presence.length>1)room.presence_entities=presence.map(x=>x.entity_id);}
put('door',candidates('binary_sensor',['door','opening']));
 put('light',pool.filter(x=>x.entity_id.startsWith('light.')||(x.entity_id.startsWith('switch.')&&h.states[x.entity_id].attributes?.device_class==='light')));put('climate',pool.filter(x=>x.entity_id.startsWith('climate.')));
 }
 if(!out.weather){const weather=enabled.filter(x=>x.entity_id.startsWith('weather.'));out.weather=unique(weather);if(weather.length>1)issues.push('Choose a weather entity ('+weather.map(x=>h.states[x.entity_id].attributes?.friendly_name||x.entity_id).join(', ')+')');}
 // Match named appliance power sensors only when the name and device class agree.
 const kinds={washer:['washingmachine','washer'],dryer:['tumbledryer','dryer'],dishwasher:['dishwasher'],kettle:['kettle'],extractor:['extractor'],tv:['television','tv'],pc:['gamingpc'],desk:['officedesk']};
 const added=new Set();if(out.starting_mode==='discover')for(const a of DEFAULTS.appliances){if(!out.appliances.some(x=>x.id===a.id||x.kind===a.kind)){out.appliances.push(structuredClone(a));added.add(a.id);}}
 for(const a of out.appliances){if(a.entities.power)continue;const matches=enabled.filter(x=>x.entity_id.startsWith('sensor.')&&h.states[x.entity_id].attributes?.device_class==='power'&&(kinds[a.kind]||[]).some(name=>normal([x.name,x.original_name,h.states[x.entity_id].attributes?.friendly_name,deviceMap.get(x.device_id)?.name_by_user,deviceMap.get(x.device_id)?.name,deviceMap.get(x.device_id)?.model].filter(Boolean).join(' ')).includes(name)));const id=unique(matches);if(id)a.entities.power=id;else if(matches.length>1)issues.push(a.name+': choose power sensor ('+matches.length+' candidates)');}
 out.appliances=out.appliances.filter(a=>!added.has(a.id)||Object.values(a.entities).some(Boolean));
 // Energy meaning is not reliably implied by device_class; never guess signs,
 // inverter totals, flow attribution, alarm, lock or plug control mappings.
 const roomCount=out.rooms.filter(r=>Object.values(r.entities||{}).some(Boolean)||r.presence_entities?.length).length;
 out.discovery_report={summary:`Found mappings in ${roomCount} rooms, ${out.appliances.filter(a=>Object.values(a.entities||{}).some(Boolean)).length} appliances and ${out.calendars.length} calendars. ${issues.length} choices need review. Energy, security and lab fields are mapped manually.`,issues};
 return out;
}
