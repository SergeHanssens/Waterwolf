"""Build a conservative historical RWS/NAP bathymetry grid; --check replaces only validated newer years.
Dependencies: rasterio, numpy, pyproj (local .bathymetry-tools or normal Python environment).
"""
import argparse,base64,gzip,hashlib,json,math,os,re,sys,tempfile,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'.bathymetry-tools'))
import numpy as np
import rasterio
from pyproj import CRS,Transformer
BASE='https://downloads.rijkswaterstaatdata.nl/bodemhoogte_ijsselmeergebied/'
OUT=ROOT/'data';OUT.mkdir(exist_ok=True)
def fetch(url,path):
 with urllib.request.urlopen(url,timeout=90) as response:blob=response.read()
 path.write_bytes(blob)
def atomic(path,blob):
 temporary=path.with_suffix(path.suffix+'.tmp');temporary.write_bytes(blob);os.replace(temporary,path)
def build(year,checkInfo=None):
 source=OUT/f'bathymetry-source-{year}.tif';xml=OUT/f'bathymetry-source-{year}.xml';prj=OUT/f'bathymetry-source-{year}.prj'
 for suffix,path in [('.tif',source),('.tif.xml',xml),('.prj',prj)]:
  if not path.exists():fetch(BASE+f'bodemhoogte_ijg_{year}'+suffix,path)
 root=ET.parse(xml).getroot();codes=[''.join(e.itertext()).strip() for e in root.iter() if e.tag.endswith('}code')]
 if '28992' not in codes or '5709' not in codes:raise ValueError('Expected RD New / NAP height reference systems not confirmed in source XML')
 vertical=CRS.from_epsg(5709);assert vertical.axis_info[0].unit_name=='metre'
 with rasterio.open(source) as ds:
  if ds.crs.to_epsg()!=28992 or ds.count!=1 or ds.transform.b!=0 or ds.transform.d!=0:raise ValueError('Unsupported raster CRS/bands/rotation')
  resolution=ds.res[0]
  if ds.res[1]!=resolution or resolution<=0 or abs(100/resolution-round(100/resolution))>1e-8:raise ValueError('Source resolution must divide 100 metres')
  factor=round(100/resolution);arr=ds.read(1,masked=True);height=arr.shape[0]//factor;width=arr.shape[1]//factor
  data=arr[:height*factor,:width*factor].filled(np.nan).reshape(height,factor,width,factor)
  known=np.isfinite(data).all(axis=(1,3));maximum=np.max(data,axis=(1,3));encoded=np.full((height,width),32767,dtype='<i2')
  vals=np.ceil(maximum[known]*100-1e-7)
  if np.any(vals<-32768) or np.any(vals>=32767):raise ValueError('Unexpected bottom elevation range')
  encoded[known]=vals.astype('<i2')
  metadata={'schema':1,'dataset':'Algemeen Dieptebestand IJsselmeergebied','surveyYear':year,'publisher':'Rijkswaterstaat','license':'CC0-1.0','sourceUrl':BASE+f'bodemhoogte_ijg_{year}.tif','metadataUrl':BASE+f'bodemhoogte_ijg_{year}.tif.xml','horizontalCRS':'EPSG:28992','verticalCRS':'EPSG:5709','verticalDatum':'NAP','unit':'metre','sourceResolutionM':resolution,'cellSizeM':100,'originX':ds.bounds.left,'originY':ds.bounds.top,'width':width,'height':height,'nodata':32767,'valueScale':.01,'encoding':'int16-little-endian-base64','aggregation':'Maximum bottom elevation over all source pixels; only completely covered cells; rounded upward to centimetres','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'knownCells':int(known.sum()),'totalCells':int(width*height),'warning':'Historical interpolated bottom model; unknown edges and no guarantee of current clearance. Metadata lineage contains older survey text; year is dataset label, not a freshness claim.'}
  metadata.update(checkInfo or {})
  payload={**metadata,'data':base64.b64encode(encoded.tobytes()).decode()}
  packed=gzip.compress(json.dumps(payload,separators=(',',':')).encode(),mtime=0)
  check=json.loads(gzip.decompress(packed));assert len(base64.b64decode(check['data']))==width*height*2
  atomic(OUT/'bathymetry-ijsselmeer.json.gz',packed)
  atomic(OUT/'bathymetry-metadata.json',json.dumps(metadata,indent=2).encode())
  transform=Transformer.from_crs(4326,28992,always_xy=True)
  controls=[{'lat':lat,'lon':lon,'x':transform.transform(lon,lat)[0],'y':transform.transform(lon,lat)[1]} for lat,lon in [(52.1551744,5.38720621),(52.73,5.30),(52.6,5.5),(53,5.5),(52.5,5.1)]]
  atomic(OUT/'bathymetry-projection-controls.json',json.dumps(controls,indent=2).encode())
  print(json.dumps({'year':year,'knownCells':int(known.sum()),'gridCells':width*height,'compressedBytes':len(packed),'sourceCRS':str(ds.crs),'verticalCRS':vertical.name}))
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--year',type=int,default=2022);parser.add_argument('--force',action='store_true');args=parser.parse_args()
if args.check:
 with urllib.request.urlopen(BASE,timeout=30) as response:listing=response.read().decode()
 years=[int(y) for y in re.findall(r'bodemhoogte_ijg_(\d{4})\.tif["\s<]',listing)]
 if not years:raise ValueError('No official bathymetry years found')
 newest=max(years);metaPath=OUT/'bathymetry-metadata.json';currentMeta=json.loads(metaPath.read_text()) if metaPath.exists() else {};current=currentMeta.get('surveyYear',0)
 if newest<current:raise ValueError('Official listing older than current model; refusing downgrade')
 url=BASE+f'bodemhoogte_ijg_{newest}.tif'
 with urllib.request.urlopen(url,timeout=90) as response:blob=response.read();modified=response.headers.get('Last-Modified')
 sourceHash=hashlib.sha256(blob).hexdigest();checkInfo={'checkedAt':datetime.now(timezone.utc).isoformat(),'checkUrl':BASE,'sourceLastModified':modified}
 if newest==current and sourceHash==currentMeta.get('sourceSHA256') and not args.force:
  currentMeta.update(checkInfo);atomic(metaPath,json.dumps(currentMeta,indent=2).encode());print(json.dumps({'status':'unchanged','currentYear':current,'latestYear':newest,'checkedAt':checkInfo['checkedAt']}));sys.exit()
 # Raw source may be replaced, but published grid is replaced only after CRS/NAP/data validation.
 atomic(OUT/f'bathymetry-source-{newest}.tif',blob)
 for suffix,extension in [('.tif.xml','.xml'),('.prj','.prj')]:fetch(BASE+f'bodemhoogte_ijg_{newest}'+suffix,OUT/f'bathymetry-source-{newest}{extension}')
 build(newest,checkInfo)
else:build(args.year)
