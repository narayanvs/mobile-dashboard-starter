#!/usr/bin/env python3
"""Validate distributable paths, privacy, metadata and HACS structure."""
from pathlib import Path
import json,re,struct,sys
R=Path(__file__).resolve().parents[1];errors=[]
manifest=json.loads((R/'hacs.json').read_text());entry=R/'dist'/manifest['filename']
if entry.name!='mobile-dashboard-starter.js' or not entry.exists():errors.append('Missing HACS entry point')
text=entry.read_text()
if '__MDS_ASSET__' in text and 'replaceAll("__MDS_ASSET__",MDS_ASSET_BASE)' not in text:errors.append('Unresolved artwork placeholders')
if re.search(r'^import\s',text,re.M):errors.append('Distribution has unresolved module imports')
for path in re.findall(r'__MDS_ASSET__/([a-zA-Z0-9_./-]+\.(?:png|svg))','\n'.join(p.read_text() for p in (R/'src/visuals').glob('*.js'))):
 if not (R/'dist'/path.replace('/','--')).is_file():errors.append('Missing artwork '+path)
for path in re.findall(r'\$\{ASSETS\}([a-zA-Z0-9_./-]+\.(?:png|svg))',(R/'src/app.js').read_text()):
 if not (R/'dist'/path.replace('/','--')).is_file():errors.append('Missing page artwork '+path)
patterns={
 'credential':r'''(?i)["']?(?:password|api_key|client_secret|access_token|refresh_token)["']?\s*[:=]\s*["'][^"']+["']''',
 'IP address':r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
 'email':r'(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b',
 'hardware address':r'\b0x[0-9a-fA-F]{16}\b|\b(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}\b',
 'JWT':r'\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+',
 'configured coordinates':r'''["'](?:latitude|longitude)["']\s*:\s*-?\d''',
 'private hosts':r'(?i)https?://[^\s/"\']+\.(?:local|duckdns\.org|ui\.nabu\.casa)\b',
 'installation-specific entity':r'\b(?:sensor\.(?:sigen_plant|parking_tesla|zappi_)|person\.(?!resident_[12]\b)[a-z0-9_]+)',
}
for p in R.rglob('*'):
 if not p.is_file() or any(x in p.parts for x in ['.git','node_modules','__pycache__']):continue
 if p.suffix in ['.js','.json','.md','.svg','.py','.yaml','.yml']:
  s=p.read_text()
  for name,pattern in patterns.items():
   if re.search(pattern,s):errors.append(str(p.relative_to(R))+': possible '+name)
 if p.suffix=='.png':
  data=p.read_bytes();i=8
  if data[:8]!=b'\x89PNG\r\n\x1a\n':errors.append(str(p)+': invalid PNG');continue
  while i<len(data):
   n=struct.unpack('>I',data[i:i+4])[0];kind=data[i+4:i+8]
   if kind not in [b'IHDR',b'PLTE',b'IDAT',b'IEND',b'tRNS',b'sRGB',b'gAMA',b'cHRM']:errors.append(str(p)+': image metadata')
   i+=n+12
# Dynamic room paths must be validated too, not only literal URLs in templates.
artwork=(R/'src/artwork.js').read_text()
for photo in re.findall(r"photo:'([^']+)'",artwork):
 if not (R/'dist'/photo).is_file():errors.append('Missing room photo '+photo)
for icon in re.findall(r"icon:'([^']+)'",artwork):
 if not (R/'dist'/('myhome-room-icons-v1--'+icon+'.png')).is_file():errors.append('Missing room icon '+icon)
mapping=json.loads((R/'examples/entity-mapping.example.json').read_text())
if mapping['schema_version']!=1:errors.append('Unsupported example schema')
if errors:print('\n'.join(errors));sys.exit(1)
print('PASS: HACS payload, module paths, artwork, example mapping, metadata and privacy patterns')
