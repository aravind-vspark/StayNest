import fs from 'node:fs/promises';
const issues=[];
let config;
try {config=JSON.parse(await fs.readFile('mobile/release.json','utf8'));}catch{issues.push('Create mobile/release.json from the example using the actual production domain, support contact and account identifiers.');}
if(config){
  try {const url=new URL(config.apiOrigin);if(url.protocol!=='https:' || /localhost|\.example$/.test(url.hostname))throw 0;}catch{issues.push('A deployed production HTTPS origin is required.');}
  if(!/^[A-Z0-9]{10}$/.test(config.appleTeamId || ''))issues.push('Set the Apple Developer team ID.');
  if(!config.androidSigningSha256?.length || !config.androidSigningSha256.every(v=>/^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(v)))issues.push('Set the Play App Signing certificate fingerprints.');
}
for(const path of ['android/app/google-services.json','mobile/dist/native-config.js']){
  try {await fs.access(path);}catch{issues.push('Missing '+path);}
}
const privacy=await fs.readFile('web/privacy.html','utf8');
if(privacy.includes('Pre-release disclosure'))issues.push('Complete and publish the operator identity, support contact, retention periods and processor-specific privacy policy.');
if(issues.length){console.error('Store release is blocked:\n'+issues.map(v=>' - '+v).join('\n'));process.exitCode=1;}else console.log('Repository configuration checks passed. Signed device testing, policy declarations and store review are still required.');
