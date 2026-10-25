import fs from 'node:fs/promises';
const token=process.env.GITHUB_TOKEN;
const repo=process.env.GITHUB_REPOSITORY;
if(!token || !repo) throw new Error('Revisão visual apenas dentro do GitHub Actions autorizado');
const dir='qa-hero-v73';
for(const tag of ['desktop-1440','mobile-390']){
  const file=`${dir}/${tag}-review.jpg`;
  const jpeg=await fs.readFile(file);
  // O blob contém somente ASCII/base64 para leitura posterior; nenhuma mídia
  // binária é comitada nem publicada no branch.
  const b64=jpeg.toString('base64');
  const res=await fetch(`https://api.github.com/repos/${repo}/git/blobs`,{
    method:'POST',
    headers:{
      'Authorization':`Bearer ${token}`,
      'Accept':'application/vnd.github+json',
      'Content-Type':'application/json',
      'X-GitHub-Api-Version':'2022-11-28'
    },
    body:JSON.stringify({content:b64,encoding:'utf-8'})
  });
  if(!res.ok) throw new Error(`Blob temporário ${tag}: HTTP ${res.status} ${(await res.text()).slice(0,250)}`);
  const data=await res.json();
  if(!/^[a-f0-9]{40}$/.test(data.sha||''))throw new Error('Git blob sem SHA válida');
  console.log('TO_HERO_REVIEW_'+tag+'='+data.sha);
}
