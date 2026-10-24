import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
// Test server supports HTTP 206 for MP4/PDF seeks, like GitHub Pages.
const root=path.resolve('site');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.json':'application/json',
  '.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf',
  '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
  '.woff2':'font/woff2','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  try{
    const u=new URL(req.url||'/','http://127.0.0.1');
    const filename=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
    if(!(filename===root||filename.startsWith(root+path.sep))){res.writeHead(403).end();return;}
    const st=fs.statSync(filename);
    if(!st.isFile()){res.writeHead(404).end();return;}
    const h={'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
    const m=/^bytes=([0-9]*)-([0-9]*)$/i.exec(req.headers.range||'');
    let start=0,end=st.size-1,status=200;
    if(m){
      start=m[1]?Number(m[1]):(m[2]?Math.max(0,st.size-Number(m[2])):0);
      end=m[1]?(m[2]?Number(m[2]):st.size-1):st.size-1;
      end=Math.min(end,st.size-1);
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=st.size){
        res.writeHead(416,{'Content-Range':'bytes */'+st.size}).end();return;
      }
      status=206;h['Content-Range']='bytes '+start+'-'+end+'/'+st.size;
    }
    h['Content-Length']=String(end-start+1);
    res.writeHead(status,h);
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(filename,{start,end}).pipe(res);
  }catch(e){res.writeHead(404).end();}
}).listen(8765,'127.0.0.1',()=>console.log('TO V7 Range-enabled QA server :8765'));
