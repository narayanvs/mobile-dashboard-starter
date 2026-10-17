#!/usr/bin/env python3
"""Build the self-contained HACS frontend. Standard-library Python only."""
from pathlib import Path
import re,json,shutil
ROOT=Path(__file__).resolve().parents[1]
ORDER=['house-scene-base','house-scene-variant-base','house-weather','house-weather-variant','energy-flow-colours','energy-flow-animation','house-scene','font-preferences','appearance-presets','device-art','family-calendar','lab-console','energy-live-components','power-metrics-live','energy-insights-live']
parts=['/* Mobile Dashboard Starter. Original dashboard visuals; see LICENSE. */',"const MDS_ASSET_BASE=new URL('./',import.meta.url).href.replace(/\\/$/,'');"]
parts.append((ROOT/'src/visuals/theme-mode.js').read_text())
# Source literals containing image paths become module-relative runtime paths.
strings=re.compile(r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*' ''',re.X)
def assets(s):
 s=re.sub(r'__MDS_ASSET__/((?:[a-zA-Z0-9_.-]+/)+)',lambda m:'__MDS_ASSET__/'+m[1].replace('/','--'),s)
 return strings.sub(lambda m:'('+m[0]+'.replaceAll("__MDS_ASSET__",MDS_ASSET_BASE))' if '__MDS_ASSET__' in m[0] else m[0],s)
for name in ORDER:
 s=(ROOT/'src/visuals'/f'{name}.js').read_text();s=assets(s)
 parts.append('// '+name+'\n(()=>{\n'+s+'\n})();')
parts.append('(()=>{')
for name in ['artwork','config','pages','style','demo','energy','discovery','appliances','setup','app','strategy']:
 s=(ROOT/'src'/f'{name}.js').read_text();s=re.sub(r'^import .*;\s*$', '',s,flags=re.M);s=re.sub(r'\bexport (?=(?:const|function|async function|class)\b)','',s);parts.append('// '+name+'\n'+s)
parts.append('})();\n')
for image in (ROOT/'artwork').rglob('*'):
 if image.is_file():shutil.copy2(image,ROOT/'dist'/str(image.relative_to(ROOT/'artwork')).replace('/','--'))
out=ROOT/'dist/mobile-dashboard-starter.js';out.parent.mkdir(exist_ok=True);out.write_text('\n'.join(parts));print('Built',out.relative_to(ROOT),'('+str(out.stat().st_size)+' bytes)')
