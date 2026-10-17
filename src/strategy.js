// Native Community dashboards entry (Home Assistant 2026.5+).
import {validateConfig} from './config.js';
import {starterDashboardConfig} from './setup.js';
export class StarterDashboardStrategy extends HTMLElement{
 static registryDependencies=[];
 static configRequired=true;
 static getCreateSuggestions(){return{title:'Mobile Home',icon:'mdi:home-variant-outline'};}
 static getConfigElement(){return document.createElement('mds-strategy-editor');}
 static async generate(config){
  // Rendering never creates dashboards, writes config or controls devices.
  const mapping=validateConfig(config.mapping||{schema_version:1,demo:true,auto_detect:false});
  return starterDashboardConfig(mapping);
 }
}
class StarterStrategyEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.editor=document.createElement('mds-starter-editor');this.editor.setAttribute('wizard','');this.shadowRoot.append(this.editor);this.editor.addEventListener('config-changed',ev=>{ev.stopPropagation();this.config={...this.config,type:'custom:mobile-dashboard-starter',mapping:structuredClone(ev.detail.config.mapping)};this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this.config)},bubbles:true,composed:true}));});}
 setConfig(config){this.config=structuredClone(config||{});this.editor.setConfig({mapping:this.config.mapping||{schema_version:1,demo:true,auto_detect:false},setup:false});}
 set hass(h){this.editor.hass=h;}
}
if(!customElements.get('mds-strategy-editor'))customElements.define('mds-strategy-editor',StarterStrategyEditor);
if(!customElements.get('ll-strategy-dashboard-mobile-dashboard-starter'))customElements.define('ll-strategy-dashboard-mobile-dashboard-starter',StarterDashboardStrategy);
window.customStrategies=window.customStrategies||[];
if(!window.customStrategies.some(s=>s.type==='mobile-dashboard-starter'))window.customStrategies.push({type:'mobile-dashboard-starter',strategyType:'dashboard',name:'Mobile Dashboard Starter',description:'Animated mobile dashboard. Starts in demo mode; map your devices in dashboard settings.',documentationURL:'https://github.com/narayanvs/mobile-dashboard-starter'});
