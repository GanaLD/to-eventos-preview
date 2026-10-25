import fs from 'node:fs/promises';
const token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY;
if(!token||!repo)throw Error('GitHub workflow token required');
for (const file of ['390x844-00-abertura.jpg','390x844-22.jpg','390x844-64.jpg','390x844-96-final.jpg']){
  let bytes;
  try{bytes=await fs.readFile('qa-mobile-hero-v10/'+file)}catch{console.log('MISSING_REVIEW_FRAME:'+file);continue}
  // Upload somente um blob de texto base64 temporário para inspeção visual no QA;
  // sem anexar ou publicar imagens no site.
  const response=await fetch('https://api.github.com/repos/'+repo+'/git/blobs',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},
    body:JSON.stringify({content:bytes.toString('base64'),encoding:'utf-8'})
  });
  if(!response.ok)throw Error('Failed preview blob '+response.status);
  const d=await response.json();
  console.log('REVIEW_MOBILE_HERO_'+file+': '+d.sha);
}
