import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const translationSource=fs.readFileSync(new URL('../web/translations.js',import.meta.url),'utf8');
const i18nSource=fs.readFileSync(new URL('../web/i18n.js',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const property={id:1,name:'The Green House',area:'Gachibowli',address:'Hyderabad',type:'Co-living',price:9500,deposit:9500,lat:17.44,lon:78.35,amen:['Wi-Fi','Meals'],photo:'',beds:1,sharing:2,sharing_options:[2],phone:'9999999999',closing:'22:30',notice_days:30,rules:'Terms apply',updated:'2026-11-01T10:00:00',published:true};
const user={id:1,name:'Test Tenant',email:'tenant@example.test',owner_approved:true,tenant:true,properties:[{id:1,name:property.name,published:true}]};
const state={property,tenancy:{id:1,room:'204',bed:'B',moveout:''},requests:[{id:1,title:'Fan <broken>',detail:'Please repair',category:'Maintenance',status:'Open',reply:'',user_id:1}],announcements:[{id:1,title:'Lunch ready',body:'Join us',type:'Food ready',created:'2026-11-01T10:00:00'}],menu:{breakfast:'Idli',lunch:'Rice',dinner:'Chapati'},invoices:[{id:1,user_id:1,period:'2026-11',amount:950000,due:'2026-11-05',status:'due'}],beds:[{id:1,room:'204',label:'B',sharing:2,active:true,occupied:true}],tenants:[{id:1,user_id:1,name:'Test Tenant',email:'tenant@example.test',bed_id:1,moveout:''}],joins:[],enquiries:[],join_url:'https://example.test/?join=code'};
async function sandbox(globals={}){
  const nodes=new Map();const node=k=>{if(!nodes.has(k))nodes.set(k,{innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){}},addEventListener(){},showModal(){this.open=true},close(){this.open=false}});return nodes.get(k)};
  const responses={'/api/me':user,'/api/properties':[property],'/api/saved':[],'/api/enquiries':[],'/api/tenant':state,'/api/owner/1?offset=0':state,'/api/invoices?offset=0':state.invoices};
  const context=vm.createContext({...globals,console,URLSearchParams,URL,Date,Math,Number,String,JSON,Promise,Uint8Array,Error,FormData,document:{querySelector:node,hidden:false,activeElement:null},navigator:{},location:{search:'',pathname:'/'},history:{replaceState(){}},setInterval(){},setTimeout(){},fetch:async url=>({ok:true,status:200,json:async()=>structuredClone(responses[new URL(url,"http://test").pathname+new URL(url,"http://test").search]??{})})});
  vm.runInContext(translationSource,context);vm.runInContext(i18nSource,context);vm.runInContext(source,context);await new Promise(resolve=>setImmediate(resolve));await vm.runInContext("setMode('Explore')",context);return {context,nodes,run:s=>vm.runInContext(s,context)};
}
test('discovery loads server listings without localStorage or demo data',async()=>{const q=await sandbox();assert.match(q.nodes.get('#cards').innerHTML,/The Green House/);assert.match(q.nodes.get('#count').textContent,/1 hostels/);assert.doesNotMatch(q.nodes.get('#app').innerHTML,/Interactive demo/)});
test('tenant screens render and escape user supplied ticket content',async()=>{const q=await sandbox();await q.run("setMode('Tenant')");for(const v of ['home','payments','requests']){q.run(`nav('${v}')`);assert.match(q.nodes.get('#app').innerHTML,/The Green House|THE GREEN HOUSE/)}q.run("nav('requests')");assert.match(q.nodes.get('#app').innerHTML,/Fan &lt;broken&gt;/);assert.doesNotMatch(q.nodes.get('#app').innerHTML,/<broken>/)});
test('owner tabs and property editor render from server state',async()=>{const q=await sandbox();await q.run("setMode('Owner')");for(const t of ['Overview','Rooms & beds','Payments','Requests','Enquiries','Food & notices','Tenants & QR']){q.run(`ownerTab=${JSON.stringify(t)};render()`);assert.ok(q.nodes.get('#app').innerHTML.length>1000)}q.run("nav('property')");assert.match(q.nodes.get('#app').innerHTML,/Listing details/);assert.match(q.nodes.get('#app').innerHTML,/The Green House/)});

test('former tenants can open billing without active hostel state',async()=>{const q=await sandbox();q.run('user.tenant=false');await q.run("setMode('Tenant')");q.run("nav('payments')");assert.match(q.nodes.get('#app').innerHTML,/Invoices & receipts/);assert.match(q.nodes.get('#app').innerHTML,/Pay rent/);assert.match(q.nodes.get('#app').innerHTML,/Older invoices/)});

test('tenant selection before login is retained after authentication',async()=>{const q=await sandbox();q.run('user=null');await q.run("setMode('Tenant')");assert.equal(q.run('pendingMode'),'Tenant');assert.equal(q.nodes.get('#modal').open,true);q.run('FormData=class { constructor() { return new Map([["email","tenant@example.test"],["password","test-password-long-enough"]]); } }');await q.run('authenticate({preventDefault(){},target:{}},false)');assert.equal(q.run('mode'),'Tenant');assert.match(q.nodes.get('#app').innerHTML,/Welcome home/);assert.match(q.nodes.get('#app').innerHTML,/The Green House/)});

test('welcome gates app and registration explains account journey',async()=>{const q=await sandbox();q.run('user=null;render()');assert.match(q.nodes.get('#app').innerHTML,/Get started/);assert.doesNotMatch(q.nodes.get('#app').innerHTML,/class="card"/);q.run('auth(true)');assert.match(q.nodes.get('#modal').innerHTML,/onboarding_intent/);assert.match(q.nodes.get('#modal').innerHTML,/I am looking for a hostel/);assert.match(q.nodes.get('#modal').innerHTML,/I own or manage a hostel/)});
test('seeker sees approval progress and approved tenant keeps their account',async()=>{const q=await sandbox();q.run('user.tenant=false;user.properties=[];user.onboarding_intent="seeker";user.join_requests=[{property_name:"The Green House",status:"Requested"}];homeMode();render()');assert.equal(q.run('mode'),'Explore');assert.match(q.nodes.get('#app').innerHTML,/awaiting approval/);q.run('user.tenant=true;user.active_property={name:"The Green House"};homeMode()');assert.equal(q.run('mode'),'Tenant');q.run('user.tenant=false;user.onboarding_intent="owner";homeMode()');assert.equal(q.run('mode'),'Owner')});

test('location and hostel type combine with address search and reset',async()=>{const q=await sandbox();q.run(`db.listings.push({...db.listings[0],id:2,name:'Lake View',area:'Madhapur',address:'Road 12, Hyderabad',type:'Women',price:8500}); $('#location').value='  road 12  '; $('#hosteltype').value='Women'; applyFilters()`);assert.match(q.nodes.get('#cards').innerHTML,/Lake View/);assert.doesNotMatch(q.nodes.get('#cards').innerHTML,/The Green House/);q.run(`$('#hosteltype').value='Men';applyFilters()`);assert.match(q.nodes.get('#cards').innerHTML,/No places match/);q.run('resetFilters()');assert.match(q.nodes.get('#cards').innerHTML,/Lake View/);assert.match(q.nodes.get('#cards').innerHTML,/The Green House/);assert.equal(q.run('matchesLocation(db.listings[0]," GREEN   gachibowli ")'),true);assert.match(q.nodes.get('#app').innerHTML,/oninput="applyFilters\(\)"/);assert.match(q.nodes.get('#app').innerHTML,/id="hosteltype" onchange="applyFilters\(\)"/)});

test('GPS sorts nearest first and retains distances across server refresh',async()=>{const q=await sandbox();q.run(`db.listings.push({...db.listings[0],id:2,name:'Near Me',lat:18,lon:79}); navigator.geolocation={getCurrentPosition(success){success({coords:{latitude:18,longitude:79}})}}; nearby()`);assert.equal(q.run('geo'),true);assert.equal(q.run('filters.sort'),'distance');assert.equal(q.run('locating'),false);const cards=q.nodes.get('#cards').innerHTML;assert.ok(cards.indexOf('Near Me')<cards.indexOf('The Green House'));const before=q.run('db.listings[0].distance');assert.ok(before>50);await q.run('refresh()');assert.equal(q.run('db.listings[0].distance'),before);q.run('clearLocation()');assert.equal(q.run('geo'),false);assert.ok(q.run('db.listings[0].distance')<1)});

test('denied GPS preserves typed search and provides useful guidance',async()=>{const q=await sandbox();q.run(`$('#location').value='Gachibowli'; $('#hosteltype').value='Co-living'; navigator.geolocation={getCurrentPosition(success,failure){failure({code:1})}};nearby()`);assert.equal(q.run('locating'),false);assert.equal(q.run('geo'),false);assert.equal(q.run('filters.loc'),'Gachibowli');assert.equal(q.run('filters.type'),'Co-living');assert.match(q.nodes.get('#toast').textContent,/permission is blocked/);assert.match(q.nodes.get('#cards').innerHTML,/The Green House/)});

test('native API transport uses HTTPS backend and server-side session cookies',async()=>{const q=await sandbox({STAYNEST_MOBILE:{apiOrigin:'https://api.staynest.test'}});q.run('fetch=async (url,options)=>{globalThis.lastRequest={url,options};return {ok:true,status:200,json:async()=>({photo:"/media/room.jpg"})}}');const body=await q.run('api("/me")');assert.equal(q.run('lastRequest.url'),'https://api.staynest.test/api/me');assert.equal(q.run('lastRequest.options.credentials'),'include');assert.equal(q.run('lastRequest.options.headers.Origin'),'https://api.staynest.test');assert.equal(body.photo,'https://api.staynest.test/media/room.jpg')});
test('account deletion is discoverable and native checkout uses secure browser',async()=>{const q=await sandbox();q.run('accountSettings()');assert.match(q.nodes.get('#modal').innerHTML,/Delete my account/);assert.match(q.nodes.get('#modal').innerHTML,/confirmation/);q.run('globalThis.StayNestNative={payOnWebsite:async()=>{globalThis.openedBilling=true}}');await q.run('pay(1)');assert.equal(q.run('openedBilling'),true)});

test('language selection updates Telugu/Hindi screens and persists across launches', async()=>{
  const saved=new Map();
  const storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
  const q=await sandbox({localStorage:storage});
  q.run('changeLanguage("te")');
  assert.match(q.nodes.get('#app').innerHTML,/హాస్టల్ వెతకండి/);
  assert.match(q.nodes.get('#app').innerHTML,/భాష/);
  assert.equal(saved.get('staynest.language'),'te');
  const reopened=await sandbox({localStorage:storage});
  assert.equal(reopened.run('StayNestI18n.getLanguage()'),'te');
  reopened.run('changeLanguage("hi")');
  assert.match(reopened.nodes.get('#app').innerHTML,/हॉस्टल खोजें/);
  assert.equal(saved.get('staynest.language'),'hi');
  reopened.run('changeLanguage("en")');
  assert.match(reopened.nodes.get('#app').innerHTML,/Find a hostel/);
});

test('translated forms keep API enum values and user content unchanged', async()=>{
  const q=await sandbox();
  q.run('changeLanguage("te")');
  assert.match(q.nodes.get('#app').innerHTML, /value="Women"[^>]*>మహిళలు/);
  assert.match(q.nodes.get('#cards').innerHTML,/The Green House/);
  await q.run('setMode("Tenant")');
  q.run('user.name="Payments <img>";render()');
  assert.match(q.nodes.get('#app').innerHTML,/స్వాగతం, Payments/);
  q.run('nav("requests")');
  assert.match(q.nodes.get('#app').innerHTML,/Fan &lt;broken&gt;/);
  q.run('newRequest()');
  assert.match(q.nodes.get('#modal').innerHTML,/value="Maintenance">నిర్వహణ/);
  await q.run('setMode("Owner")');
  q.run('foodReady()');
  assert.match(q.nodes.get('#modal').innerHTML,/value="Breakfast">అల్పాహారం/);
  assert.match(q.nodes.get('#modal').innerHTML,/value="Dinner">రాత్రి భోజనం/);
});

test('language switching preserves in-progress form text and checkbox values',async()=>{
  const q=await sandbox();
  q.run(`
    globalThis.draftText={name:'name',type:'text',value:'My unfinished hostel name'};
    globalThis.draftAmenity={name:'amen',type:'checkbox',value:'Meals',checked:true};
    document.querySelectorAll=()=>[{getAttribute:()=> 'saveProperty(event,1)',elements:[draftText,draftAmenity]}];
    globalThis.actualRender=render;
    render=()=>{draftText.value='';draftAmenity.checked=false;actualRender()};
    changeLanguage('hi');
  `);
  assert.equal(q.run('draftText.value'),'My unfinished hostel name');
  assert.equal(q.run('draftAmenity.checked'),true);
});
