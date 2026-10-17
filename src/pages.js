import {escapeHTML as e} from './config.js';
export const PAGE_TEMPLATES={blank:'Blank page',room:'Room controls',house:'Your spaces',lighting:'Lighting modes',energy:'Energy',appliances:'Appliances',lab:'Home lab',security:'Security',car:'Car',calendar:'Calendar'};
export const BUILTIN_PAGES={home:['Home','mdi:home-outline'],house:['House','mdi:sofa-outline'],lighting:['Lighting modes','mdi:lightbulb-auto-outline'],energy:['Energy','mdi:lightning-bolt-outline'],appliances:['Appliances','mdi:washing-machine'],security:['Security','mdi:shield-home-outline'],lab:['Home lab','mdi:server-network'],car:['Car','mdi:car-outline'],calendar:['Calendar','mdi:calendar-month-outline']};
export function pageList(mapping,all=false){
 const pages=Object.entries(BUILTIN_PAGES).map(([id,[name,icon]])=>({id,name,icon,...mapping.page_settings?.[id],builtin:true,hidden:!!mapping.pages&&!mapping.pages.includes(id)}));
 pages.push(...(mapping.custom_pages||[]).map(p=>({...p,builtin:false})));
 const rank=new Map((mapping.page_order||[]).map((id,i)=>[id,i]));
 return pages.filter(p=>all||!p.hidden).sort((a,b)=>(rank.get(a.id)??999)-(rank.get(b.id)??999));
}
export function validatePages(c){
 c.custom_pages??=[];c.page_settings??={};c.page_order??=[];
 if(!Array.isArray(c.custom_pages)||!Array.isArray(c.page_order)||!c.page_settings||typeof c.page_settings!=='object'||Array.isArray(c.page_settings))throw Error('Invalid page settings');
 const ids=new Set(Object.keys(BUILTIN_PAGES));
 for(const p of c.custom_pages){
  if(!p||!/^page_[a-z0-9_]+$/.test(p.id)||ids.has(p.id))throw Error('Custom pages need unique page IDs');ids.add(p.id);
  if(typeof p.name!=='string'||!p.name.trim())throw Error('Give each page a name');
  if(!Object.hasOwn(PAGE_TEMPLATES,p.template||'blank'))throw Error('Unknown page template');
  if(p.hidden!==undefined&&typeof p.hidden!=='boolean')throw Error('Page visibility must be true or false');
  if(p.icon!==undefined&&typeof p.icon!=='string')throw Error('Page icon must be a string');
  if(p.room_id!==undefined&&typeof p.room_id!=='string')throw Error('Invalid page room');
  p.sections??=[];if(!Array.isArray(p.sections))throw Error('Page sections must be a list');
  const sections=new Set();for(const section of p.sections){
   if(!section||!/^section_[a-z0-9_]+$/.test(section.id)||sections.has(section.id))throw Error('Sections need unique IDs');sections.add(section.id);
   if(section.columns!==undefined&&![1,2].includes(section.columns))throw Error('Section columns must be 1 or 2');
   if(typeof section.name!=='string')throw Error('Section name must be text');
   if(!Array.isArray(section.cards))throw Error('Section cards must be a list');
   const cards=new Set();for(const card of section.cards){if(!card||!/^card_[a-z0-9_]+$/.test(card.id)||cards.has(card.id))throw Error('Cards need unique IDs');cards.add(card.id);if(!card.config||typeof card.config!=='object'||Array.isArray(card.config)||typeof card.config.type!=='string'||!card.config.type)throw Error('Each HA card needs a type');}
  }
 }
 for(const [id,meta]of Object.entries(c.page_settings)){if(!BUILTIN_PAGES[id]||!meta||typeof meta!=='object'||Array.isArray(meta)||Object.entries(meta).some(([k,v])=>!['name','icon'].includes(k)||typeof v!=='string'||k==='name'&&!v.trim()))throw Error('Invalid built-in page settings');}
 if(c.page_order.some(id=>typeof id!=='string'||!ids.has(id))||new Set(c.page_order).size!==c.page_order.length)throw Error('Page order contains unknown or duplicate IDs');
}
const nextId=(list,prefix)=>{let n=1;while(list.some(x=>x.id===prefix+n))n++;return prefix+n;};
const move=(list,index,step)=>{const to=index+step;if(to<0||to>=list.length)return;[list[index],list[to]]=[list[to],list[index]];};
export function pagesEditor(editor){
 const m=editor.mapping,pages=pageList(m,true);if(!pages.some(p=>p.id===editor.pageId))editor.pageId=pages[0]?.id;
 const page=pages.find(p=>p.id===editor.pageId);let html=`<p>Create pages in your own order. Use a template, add sections and place any Home Assistant card inside them.</p><div class="row"><select data-user-page>${pages.map(p=>`<option value="${p.id}" ${p.id===editor.pageId?'selected':''}>${e(p.name)}${p.hidden?' · hidden':''}</option>`).join('')}</select><button data-page-action="add">Add page</button></div>`;
 if(!page)return html;
 html+=`<label>Page name</label><input data-page-field="name" value="${e(page.name)}"/><label>Icon (MDI)</label><input data-page-field="icon" value="${e(page.icon||'mdi:view-dashboard-outline')}"/><label class="check"><input type="checkbox" data-page-field="visible" ${page.hidden?'':'checked'}/>Show in navigation</label><div class="row"><button data-page-action="up">Move left</button><button data-page-action="down">Move right</button>${page.builtin?'':'<button data-page-action="remove">Delete page</button>'}</div>`;
 if(page.builtin)return html+'<p>This built-in page uses its existing mappings. Create a new page to combine your own cards.</p>';
 html+=`<label>Page template</label><select data-page-field="template">${Object.entries(PAGE_TEMPLATES).map(([v,n])=>`<option value="${v}" ${(page.template||'blank')===v?'selected':''}>${n}</option>`).join('')}</select>`;
 if(page.template==='room')html+=`<label>Room</label><select data-page-field="room_id"><option value="">Choose a room</option>${m.rooms.map(r=>`<option value="${r.id}" ${page.room_id===r.id?'selected':''}>${e(r.name)}</option>`).join('')}</select>`;
 html+='<h3>Sections</h3><button data-page-action="section-add">Add section</button>';
 for(const section of page.sections||[]){
  html+=`<fieldset><label>Section title</label><input data-section-name="${section.id}" value="${e(section.name)}"/><label>Columns (wide screens)</label><select data-section-columns="${section.id}"><option value="1" ${section.columns!==2?'selected':''}>One</option><option value="2" ${section.columns===2?'selected':''}>Two</option></select><div class="row"><button data-page-action="section-up" data-section="${section.id}">Move up</button><button data-page-action="section-down" data-section="${section.id}">Move down</button><button data-page-action="section-remove" data-section="${section.id}">Delete section</button><button data-page-action="card-add" data-section="${section.id}">Add card</button></div>`;
  for(const card of section.cards){const config=card.config,kind=!card.advanced&&['tile','entities','history-graph','markdown','button'].includes(config.type)?config.type:'advanced';html+=`<details><summary>${e(config.name||config.title||config.type)}</summary><label>Card type</label><select data-card-field="kind" data-section="${section.id}" data-card="${card.id}">${['tile','entities','history-graph','markdown','button','advanced'].map(k=>`<option value="${k}" ${k===kind?'selected':''}>${k==='advanced'?'Any HA card (JSON)':k}</option>`).join('')}</select>`;
   if(kind!=='advanced'){html+=`<label>Title / name</label><input data-card-field="name" data-section="${section.id}" data-card="${card.id}" value="${e(config.name||config.title||'')}"/>`;if(kind==='markdown')html+=`<label>Text (Markdown)</label><textarea data-card-field="content" data-section="${section.id}" data-card="${card.id}">${e(config.content||'')}</textarea>`;else html+=`<label>${['entities','history-graph'].includes(kind)?'Entities (comma separated)':'Entity'}</label><input list="mds-entities" data-card-field="entity" data-section="${section.id}" data-card="${card.id}" value="${e(Array.isArray(config.entities)?config.entities.map(x=>typeof x==='string'?x:x.entity).join(', '):config.entity||'')}"/>`;}
   html+=`<details><summary>Advanced card configuration (JSON)</summary><p>Paste any HA card config as JSON, including custom cards you have installed. This replaces this card’s configuration only.</p><textarea rows="8" data-card-field="json" data-section="${section.id}" data-card="${card.id}">${e(JSON.stringify(config,null,2))}</textarea></details><div class="row"><button data-page-action="card-up" data-section="${section.id}" data-card="${card.id}">Move up</button><button data-page-action="card-down" data-section="${section.id}" data-card="${card.id}">Move down</button><button data-page-action="card-remove" data-section="${section.id}" data-card="${card.id}">Delete card</button></div></details>`;
  }html+='</fieldset>';
 }return html;
}
export function changePage(editor,target){
 const d=target.dataset,m=editor.mapping;if(d.userPage!==undefined){editor.pageId=target.value;editor.render();return true;}
 if(!d.pageField&&!d.sectionName&&!d.sectionColumns&&!d.cardField)return false;
 const page=m.custom_pages.find(p=>p.id===editor.pageId),section=page?.sections?.find(s=>s.id===d.section),card=section?.cards.find(c=>c.id===d.card);
 if(d.pageField){if(d.pageField==='visible'){if(page)page.hidden=!target.checked;else{const visible=new Set(m.pages||Object.keys(BUILTIN_PAGES));target.checked?visible.add(editor.pageId):visible.delete(editor.pageId);m.pages=[...visible];}}else if(page)page[d.pageField]=target.value;else{m.page_settings[editor.pageId]??={};m.page_settings[editor.pageId][d.pageField]=target.value;}}
 else if(d.sectionColumns)page.sections.find(s=>s.id===d.sectionColumns).columns=Number(target.value);
 else if(d.sectionName)page.sections.find(s=>s.id===d.sectionName).name=target.value;
 else if(card){const config=card.config;if(d.cardField==='json'){const value=JSON.parse(target.value);if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.type!=='string')throw Error('Card JSON needs an object with a type');card.config=value;}else if(d.cardField==='kind'){card.advanced=target.value==='advanced';card.config=target.value==='advanced'?{type:'markdown',content:'Configure this card below.'}:target.value==='markdown'?{type:'markdown',content:'Your text'}:['entities','history-graph'].includes(target.value)?{type:target.value,entities:[]}:{type:target.value,entity:''};}else if(d.cardField==='entity'){if(['entities','history-graph'].includes(config.type))config.entities=target.value.split(',').map(x=>x.trim()).filter(Boolean);else config.entity=target.value.trim();}else if(d.cardField==='name')config[['tile','button'].includes(config.type)?'name':'title']=target.value;else config.content=target.value;}
 editor.emit();editor.render();return true;
}
export function pageAction(editor,target){
 const d=target.dataset;if(!d.pageAction)return false;const m=editor.mapping;let page=m.custom_pages.find(p=>p.id===editor.pageId);const section=page?.sections.find(s=>s.id===d.section);const action=d.pageAction;
 if(action==='add'){page={id:nextId(m.custom_pages,'page_'),name:'New page',icon:'mdi:view-dashboard-outline',template:'blank',sections:[]};m.custom_pages.push(page);editor.pageId=page.id;}
 else if(action==='remove'){if(!confirm('Delete this page and its cards? Your entities and automations stay unchanged.'))return true;m.custom_pages=m.custom_pages.filter(p=>p.id!==page.id);m.page_order=m.page_order.filter(id=>id!==page.id);editor.pageId=null;}
 else if(action==='up'||action==='down'){const order=pageList(m,true).map(p=>p.id);move(order,order.indexOf(editor.pageId),action==='up'?-1:1);m.page_order=order;}
 else if(action==='section-add')page.sections.push({id:nextId(page.sections,'section_'),name:'New section',cards:[]});
 else if(action==='section-remove'){if(!confirm('Delete this section and its cards?'))return true;page.sections=page.sections.filter(s=>s!==section);}
 else if(action.startsWith('section-'))move(page.sections,page.sections.indexOf(section),action==='section-up'?-1:1);
 else if(action==='card-add')section.cards.push({id:nextId(section.cards,'card_'),config:{type:'markdown',content:'Your text'}});
 else if(action==='card-remove')section.cards=section.cards.filter(c=>c.id!==d.card);
 else if(action.startsWith('card-'))move(section.cards,section.cards.findIndex(c=>c.id===d.card),action==='card-up'?-1:1);
 editor.emit();editor.render();return true;
}
export function customPageMarkup(app){
 const page=app._mapping.custom_pages?.find(p=>p.id===app._page);if(!page)return '';
 let html='';const template=page.template||'blank';
 if(template==='room'){app._room=page.room_id;html=page.room_id?app.room():'<section class="panel"><p>Choose a room for this page in Edit dashboard → Pages.</p></section>';}
 else{const render={house:()=>app.house(),lighting:()=>app.lighting(),energy:()=>app.energyPage(),appliances:()=>app.appliances(),lab:()=>app.lab(),security:()=>app.security(),car:()=>app.car(),calendar:()=>app.calendar()};html=render[template]?render[template]():'';}
 const host=document.createElement('div');host.innerHTML=html;
 const title=host.querySelector('.hero .overlay h1,.lighting-title h1');if(title)title.textContent=page.name;
 html=host.innerHTML;if(!html)html=`<header class="user-page-heading"><ha-icon icon="${e(page.icon||'mdi:view-dashboard-outline')}"></ha-icon><h1>${e(page.name)}</h1></header>`;
 for(const section of page.sections||[])html+=`<section class="panel user-section"><details data-fold="${page.id}-${section.id}" open><summary>${e(section.name)}</summary><div class="body user-cards" style="--user-columns:${section.columns||1}">${section.cards.map(card=>`<div data-native-card="${page.id}/${section.id}/${card.id}"></div>`).join('')}${section.cards.length?'':'<p class="subtle">Add cards to this section in Edit dashboard → Pages.</p>'}</div></details></section>`;
 if(template==='blank'&&!page.sections.length)html+='<section class="panel"><p>Add sections and cards in Edit dashboard → Pages.</p></section>';
 return html;
}
export async function mountPageCards(app){
 if(app._mapping.demo===true)return;
 const page=app._mapping.custom_pages?.find(p=>p.id===app._page);if(!page)return;
 const slots=[...app.shadowRoot.querySelectorAll('[data-native-card]')];if(!slots.length)return;
 const token=app._pageCardsToken={};let helpers;
 try{if(typeof window.loadCardHelpers!=='function')throw Error('Home Assistant card helpers are unavailable. Reload HA and try again.');helpers=await window.loadCardHelpers();}catch(error){if(app._pageCardsToken===token)for(const slot of slots)slot.textContent=error.message;return;}
 if(app._pageCardsToken!==token||app._page!==page.id)return;
 app._nativeCards??=new Map();const allowed=new Set((app._mapping.custom_pages||[]).flatMap(p=>(p.sections||[]).flatMap(s=>s.cards.map(c=>p.id+'/'+s.id+'/'+c.id))));for(const key of app._nativeCards.keys())if(!allowed.has(key))app._nativeCards.delete(key);
 for(const section of page.sections||[])for(const card of section.cards){const key=page.id+'/'+section.id+'/'+card.id,slot=slots.find(s=>s.dataset.nativeCard===key);if(!slot?.isConnected)continue;
  try{const signature=JSON.stringify(card.config);let cached=app._nativeCards.get(key);if(!cached||cached.signature!==signature){const element=helpers.createCardElement(JSON.parse(signature));cached={element,signature};app._nativeCards.set(key,cached);}cached.element.hass=app._hass;slot.replaceChildren(cached.element);}catch(error){slot.textContent='This card could not load: '+error.message;}
 }
}
