import {COLORS,FLOW_EDGES} from './demo.js';
import {escapeHTML as e} from './config.js';
export function flowDiagram(flows,selected){
 const edges=FLOW_EDGES.map(([from,to,key])=>({from,to,key,value:flows[key]})).filter(x=>Number.isFinite(x.value)&&x.value>0);
 if(!edges.length)return '<p>No recorded flow breakdown is configured. Add measured kWh flow entities to show connections.</p>';
 const sums=(side,node)=>edges.filter(x=>x[side]===node).reduce((n,x)=>n+x.value,0),left=['solar','battery','grid'],right=['battery','home','grid'];
 const max=Math.max(...left.map(n=>sums('from',n)),...right.map(n=>sums('to',n))),scale=95/max,offsetL={},offsetR={};left.forEach(n=>offsetL[n]=0);right.forEach(n=>offsetR[n]=0);
 let paths='',labels='';for(const x of edges){const y1=20+left.indexOf(x.from)*115+offsetL[x.from],y2=20+right.indexOf(x.to)*115+offsetR[x.to],width=x.value*scale;offsetL[x.from]+=width;offsetR[x.to]+=width;
 const active=!selected||(selected.side==='from'?x.from===selected.node:x.to===selected.node);const total=selected?sums(selected.side,selected.node):sums('from',x.from),pct=total?100*x.value/total:0;
 paths+=`<linearGradient id="g-${x.key}"><stop stop-color="${COLORS[x.from]}"/><stop offset="1" stop-color="${COLORS[x.to]}"/></linearGradient><path d="M105 ${y1} C195 ${y1} 245 ${y2} 335 ${y2} L335 ${y2+width} C245 ${y2+width} 195 ${y1+width} 105 ${y1+width}Z" fill="url(#g-${x.key})" opacity="${active?.72:.08}"/>`;
 if(selected&&active&&width>12)labels+=`<text x="${selected.side==='from'?111:329}" y="${selected.side==='from'?y1+width/2+4:y2+width/2+4}" text-anchor="${selected.side==='from'?'start':'end'}" fill="var(--primary-text-color)" font-size="12">${pct.toFixed(0)}%</text>`;
 }
 const nodes=(list,side,x)=>list.map((n,i)=>{const active=!selected||(selected.side===side&&selected.node===n)||edges.some(z=>selected.side==='from'?z.from===selected.node&&z.to===n&&side==='to':z.to===selected.node&&z.from===n&&side==='from');return `<g role="button" tabindex="0" data-flow-side="${side}" data-flow-node="${n}" aria-label="${n} ${side==='from'?'sources':'destinations'}" style="cursor:pointer" opacity="${active?1:.3}"><rect x="${x}" y="${20+i*115}" width="95" height="95" rx="5" fill="${COLORS[n]}" fill-opacity=".22"/><text x="${x+10}" y="${40+i*115}" fill="var(--primary-text-color)" font-size="12">${n.toUpperCase()}</text><text x="${x+10}" y="${66+i*115}" fill="var(--primary-text-color)" font-size="19" font-weight="700">${sums(side,n).toFixed(2)}</text><text x="${x+10}" y="${83+i*115}" fill="var(--secondary-text-color)" font-size="11">kWh</text></g>`;}).join('');
 return `<svg viewBox="0 0 440 360" class="chart" aria-label="Measured energy destinations. Select a source or destination to highlight its connections.">${paths}${nodes(left,'from',10)}${nodes(right,'to',335)}${labels}</svg>`;
}
export function powerChart(rows,enabled,unit='kW'){
 if(!rows.length)return '<p>No power history available yet. The mapped sensors need recorded statistics.</p>';
 const keys=['solar','battery','load','grid','forecast'].filter(k=>enabled.has(k));const values=rows.flatMap(r=>keys.map(k=>r[k])).filter(Number.isFinite),hi=Math.max(1,...values),lo=Math.min(0,...values),range=hi-lo||1,x=h=>45+h/24*540,y=v=>20+(hi-v)/range*190,zero=y(0);
 let svg='';for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;svg+=`<line x1="45" x2="585" y1="${y(v)}" y2="${y(v)}" stroke="var(--secondary-text-color)" stroke-opacity=".15" stroke-dasharray="3 5"/><text x="35" y="${y(v)+4}" text-anchor="end" fill="var(--secondary-text-color)" font-size="11">${v.toFixed(1)}</text>`;}
 for(const key of keys){let segment=[];const draw=()=>{if(!segment.length)return;const d=segment.map((r,i)=>(i?'L':'M')+x(r.hour)+' '+y(r[key])).join(' ');if(key!=='forecast')svg+=`<path d="${d} L${x(segment.at(-1).hour)} ${zero} L${x(segment[0].hour)} ${zero}Z" fill="${COLORS[key]}" fill-opacity=".13"/>`;svg+=`<path d="${d}" fill="none" stroke="${COLORS[key]}" stroke-width="2" ${key==='forecast'?'stroke-dasharray="5 4"':''}/>`;segment=[];};for(const row of rows){if(Number.isFinite(row[key]))segment.push(row);else draw();}draw();}
 for(const h of [0,6,12,18,24])svg+=`<text x="${x(h)}" y="235" text-anchor="middle" fill="var(--secondary-text-color)" font-size="11">${String(h).padStart(2,'0')}:00</text>`;
 return `<svg viewBox="0 0 610 245" class="chart" aria-label="Power in ${e(unit)}">${svg}</svg>`;
}

export function resourceRing(label,value,unit='%',tone='var(--a)'){
 const valid=Number.isFinite(value),pct=valid?Math.max(0,Math.min(100,value)):0;
 return `<div class="resource-ring"><div class="ring" style="--ring:${pct}%;--tone:${tone}"><span><b>${valid?Math.round(value):'—'}</b><small>${unit}</small></span></div><small>${e(label)}</small></div>`;
}
export function allocationBars(items,unit='kWh'){
 const finite=items.filter(x=>Number.isFinite(x.value)&&x.value>=0),sum=finite.reduce((s,x)=>s+x.value,0),max=Math.max(1,...finite.map(x=>x.value));
 if(!finite.length)return '<p>No mapped readings available.</p>';
 return `<div class="allocation-bars">${finite.map(x=>`<div><header><span>${e(x.name)}</span><b>${x.value.toFixed(unit==='kWh'?2:0)} <small>${unit}</small></b></header><div class="bar"><i style="width:${x.value/max*100}%;background:${x.color||'var(--a)'}"></i></div>${unit==='kWh'&&sum?`<small>${Math.round(x.value/sum*100)}% of shown total</small>`:''}</div>`).join('')}</div>`;
}
