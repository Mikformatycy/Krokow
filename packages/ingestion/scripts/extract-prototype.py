import argparse, gzip, json, hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser(description='Bounded exact-reference extract; no downloads, no topology repair.')
parser.add_argument('source', type=Path)
parser.add_argument('output_directory', type=Path)
parser.add_argument('--fetched-at', required=True, help='Original acquisition timestamp in ISO 8601 UTC; never the reprocessing time.')
args = parser.parse_args()
source = args.source
fetched_at = datetime.fromisoformat(args.fetched_at.replace('Z', '+00:00'))
if not args.fetched_at.endswith('Z') or fetched_at.utcoffset().total_seconds() != 0:
    raise ValueError('Expected explicit UTC acquisition timestamp')
args.output_directory.mkdir(parents=True, exist_ok=False)
output = args.output_directory / 'raw-map.json'
box = [50.052, 19.925, 50.075, 19.955]
nodes, ways, relations = {}, [], []
def convert(e):
    r = dict(e.attrib)
    r['type'] = e.tag
    for k in ['id', 'version', 'uid', 'changeset']:
        if k in r: r[k] = int(r[k])
    for k in ['lat', 'lon']:
        if k in r: r[k] = float(r[k])
    tags = {t.attrib['k']: t.attrib['v'] for t in e.findall('tag')}
    if tags: r['tags'] = tags
    if e.tag == 'way': r['nodes'] = [int(n.attrib['ref']) for n in e.findall('nd')]
    if e.tag == 'relation': r['members'] = [dict(m.attrib, ref=int(m.attrib['ref'])) for m in e.findall('member')]
    return r
with gzip.open(source, 'rb') as f:
    context = ET.iterparse(f, events=('start','end'))
    _, root = next(context)
    for event, e in context:
        if event != 'end' or e.tag not in ('node','way','relation'): continue
        if e.tag == 'node':
            lat, lon = float(e.attrib['lat']), float(e.attrib['lon'])
            if box[0] <= lat <= box[2] and box[1] <= lon <= box[3]: nodes[int(e.attrib['id'])] = convert(e)
        elif e.tag == 'way':
            r = convert(e)
            if any(k in r.get('tags',{}) for k in ['highway','barrier','railway','building']) and any(n in nodes for n in r['nodes']): ways.append(r)
        else:
            r = convert(e)
            if 'restriction:foot' in r.get('tags',{}) or r.get('tags',{}).get('type') == 'restriction:foot': relations.append(r)
        root.clear()
refs = {n for w in ways for n in w['nodes']}
missing = refs - nodes.keys()
print('Selected ways',len(ways),'nodes',len(nodes),'missing',len(missing),flush=True)
if missing:
    with gzip.open(source, 'rb') as f:
        context = ET.iterparse(f, events=('start','end')); _, root = next(context)
        for event, e in context:
            if event != 'end' or e.tag not in ('node','way','relation'): continue
            if e.tag == 'node' and int(e.attrib['id']) in missing: nodes[int(e.attrib['id'])] = convert(e)
            if e.tag == 'way': break
            root.clear()
if refs - nodes.keys(): raise ValueError('Missing topology')
way_ids = {w['id'] for w in ways}
relations = [r for r in relations if any(m['type']=='way' and m['ref'] in way_ids for m in r['members'])]
raw = json.dumps({'version':0.6,'generator':'Krokow exact-reference bounded extraction from BBBike OSM','elements':[nodes[n] for n in sorted(refs)]+ways+relations}, ensure_ascii=False, separators=(',',':')).encode()
output.write_bytes(raw)
capture = {'fetchedAt':fetched_at.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),
 'url':'https://download.bbbike.org/osm/bbbike/Cracow/Cracow.osm.gz','upstreamCompressedSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'rawSha256':hashlib.sha256(raw).hexdigest(),'rawBytes':len(raw),'bbox':box,'license':'ODbL 1.0','attribution':'© OpenStreetMap contributors',
 'extraction':'All highway, building, barrier and railway ways with a node inside bbox; complete way nodes and pedestrian restrictions. Node identities and source timestamps preserved.'}
output.with_name('capture.json').write_text(json.dumps(capture,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
output.with_name('raw-map.json.gz').write_bytes(gzip.compress(raw,mtime=0))
print('rawBytes',len(raw),'nodes',len(refs),'ways',len(ways),flush=True)
