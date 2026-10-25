const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,stubs={}){
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>{
  if(Object.hasOwn(stubs,name))return stubs[name];
  if(name==='server-only')return {};
  if(name.startsWith('@/'))return {};
  return require(name);
 },mod,mod.exports);return mod.exports;
}
function database(tables){
 return {from(table){let rows=[...(tables[table]??[])],mode='select';
  const query={select(){return query;},eq(key,value){rows=rows.filter(row=>row[key]===value);return query;},lt(key,value){rows=rows.filter(row=>row[key]<value);return query;},order(){return query;},limit(){return query;},delete(){mode='delete';return query;},insert(row){tables[table]??=[];tables[table].push(row);return Promise.resolve({error:null});},maybeSingle(){return Promise.resolve({data:rows[0]??null,error:null});},then(resolve,reject){if(mode==='delete')tables[table]=tables[table].filter(row=>!rows.includes(row));return Promise.resolve({data:rows,error:null}).then(resolve,reject);}};
  return query;
 }};
}
test('resource sessions bind identity and reject suspension, password changes and old shared tokens',async()=>{
 const tables={agents:[{id:'a',status:'approved',resource_access_version:1}],partner_resource_sessions:[]};
 const access=load('lib/partner-resource-access.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>database(tables)},'next/headers':{}});
 const token=await access.createResourceAccessToken('a',1);
 assert.deepEqual(await access.verifyResourceAccessToken(token),{agentId:'a'});
 assert.notEqual(tables.partner_resource_sessions[0].token_hash,token);
 tables.agents[0].status='suspended';assert.equal(await access.verifyResourceAccessToken(token),null);
 tables.agents[0].status='approved';tables.agents[0].resource_access_version=2;assert.equal(await access.verifyResourceAccessToken(token),null);
 assert.equal(await access.verifyResourceAccessToken('old.scope-signature'),null);
 assert.equal(await access.verifyResourceAccessToken(),null);
});
test('partner A cannot list or resolve partner B selected resources',async()=>{
 const tables={resources:[{id:'a-file',status:'published',audience_type:'selected_partners'},{id:'b-file',status:'published',audience_type:'selected_partners'},{id:'shared',status:'published',audience_type:'all_partners'},{id:'draft',status:'draft',audience_type:'all_partners'}],protected_resources:[{agent_id:'a',resource_id:'a-file'},{agent_id:'b',resource_id:'b-file'}]};
 const resources=load('lib/services/resource-service.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>database(tables)}});
 assert.deepEqual((await resources.listPublishedResources('a')).map(row=>row.id),['a-file','shared']);
 assert.equal(await resources.getPublishedResource('b-file','a'),null);
 assert.deepEqual(await resources.listPublishedResources(),[]);
});
test('CSV neutralizes formulas while preserving quoting and ordinary text',()=>{
 const {csvEscape}=load('lib/security/csv.ts');
 for(const value of ['=1+1','+SUM(A1)','-1+1','@SUM(A1)','\t =1+1','＝1+1'])assert.ok(csvEscape(value).startsWith('"\''));
 assert.equal(csvEscape('A "quoted" name'),'"A ""quoted"" name"');
});
test('import URL validation rejects misleading hosts, credentials, alternate ports and private addresses',async()=>{
 const {validateImportUrl,isPublicAddress,safeFetch}=load('lib/security/safe-fetch.ts');
 for(const value of ['http://127.0.0.1/a.pdf?source=drive.google.com','https://drive.google.com.evil.invalid/a','https://user:pass@drive.google.com/a','https://drive.google.com:8443/a'])assert.throws(()=>validateImportUrl(value));
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.1.1','192.168.0.1','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','2001:db8::1'])assert.equal(isPublicAddress(ip),false,ip);
 assert.equal(validateImportUrl('https://drive.google.com/file/d/abc').hostname,'drive.google.com');
 await assert.rejects(()=>safeFetch('http://127.0.0.1/a.pdf'));
});
test('rate limiter uses the shared backend and denies on backend failure',async()=>{
 let count=0;
 const stubs={'@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async(_name,args)=>{assert.match(args.p_key,/^[a-f0-9]{64}$/);return {data:[{allowed:++count<=1,remaining:0,reset_at:new Date(Date.now()+1000).toISOString()}]};}})}};
 const first=load('lib/security/rate-limit.ts',stubs),second=load('lib/security/rate-limit.ts',stubs);
 assert.equal((await first.checkRateLimit({key:'same-ip',limit:1,windowMs:1000})).allowed,true);
 assert.equal((await second.checkRateLimit({key:'same-ip',limit:1,windowMs:1000})).allowed,false);
 const failed=load('lib/security/rate-limit.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async()=>({error:{message:'offline'}})})}});
 assert.equal((await failed.checkRateLimit({key:'ip',limit:1,windowMs:1000})).allowed,false);
});
test('missing CAPTCHA configuration does not pass verification',async()=>{
 const saved=process.env.TURNSTILE_SECRET_KEY;delete process.env.TURNSTILE_SECRET_KEY;
 try{assert.equal((await load('lib/security/turnstile.ts').verifyTurnstileToken(undefined,new Request('https://example.test'))).ok,false);}
 finally{if(saved===undefined)delete process.env.TURNSTILE_SECRET_KEY;else process.env.TURNSTILE_SECRET_KEY=saved;}
});
test('JSON byte limit applies to streams without a Content-Length header',async()=>{
 const {readJsonBody}=load('lib/security/request-body.ts');
 await assert.rejects(()=>readJsonBody(new Request('https://example.test',{method:'POST',body:JSON.stringify({large:'x'.repeat(200)})}),32));
 assert.deepEqual(await readJsonBody(new Request('https://example.test',{method:'POST',body:'{"ok":true}'})),{ok:true});
});
test('private downloads refuse public/external paths and signatures expire quickly',async()=>{
 const privateStorage=load('lib/storage/partner-resources.ts');
 assert.throws(()=>privateStorage.validatePrivateResourcePath('https://example.test/file.pdf'));
 assert.throws(()=>privateStorage.validatePrivateResourcePath('files/../secret.pdf'));
 let expiry;
 const service=load('lib/services/resource-service.ts',{'@/lib/storage/partner-resources':privateStorage,'@/lib/supabase/admin':{createSupabaseAdminClient:()=>({storage:{from:bucket=>{assert.equal(bucket,'partner-resources');return {createSignedUrl:async(_path,seconds)=>{expiry=seconds;return {data:{signedUrl:'https://signed.example.test'}};}};}}})}});
 assert.equal(await service.createProtectedResourceUrl({filePath:'files/fixture.pdf'},'view'),'https://signed.example.test');assert.equal(expiry,60);
 await assert.rejects(()=>service.createProtectedResourceUrl({filePath:'https://public.example.test/file.pdf'},'view'));
});
test('production CSP enforces nonce scripts without unsafe inline or eval',()=>{
 const {contentSecurityPolicy}=load('lib/security/csp.ts');const policy=contentSecurityPolicy('unique-test-nonce');
 const scripts=policy.split(';').find(part=>part.trim().startsWith('script-src'));
 assert.ok(scripts.includes("'nonce-unique-test-nonce'"));assert.ok(!scripts.includes('unsafe-inline'));assert.ok(!scripts.includes('unsafe-eval'));assert.ok(policy.includes("worker-src 'self' blob:"));
});
test('email-test endpoint requires exactly the email admin role set',async()=>{
 let required;
 const route=load('app/api/admin/email-test/route.ts',{'@/lib/auth/require-admin':{requireAdminJson:async roles=>{required=roles;return {ok:false,response:new Response(null,{status:403})};}}});
 assert.equal((await route.POST(new Request('https://example.test',{method:'POST'}))).status,403);assert.deepEqual(required,['super_admin','admin']);
});
test('ExcelJS remains functional with its patched UUID dependency',async()=>{
 const Excel=require('exceljs');const workbook=new Excel.Workbook();const sheet=workbook.addWorksheet('Resorts');
 sheet.addRow(['Name','Rating','Transfer','Blank']);sheet.addRow(['Fixture Resort','5 Star','Seaplane','']);
 sheet.getCell('E2').value={formula:'1+1',result:2};
 sheet.addConditionalFormatting({ref:'A2',rules:[{type:'containsText',operator:'containsText',text:'Fixture',style:{font:{bold:true}}}]});
 const bytes=await workbook.xlsx.writeBuffer();const parsed=new Excel.Workbook();await parsed.xlsx.load(bytes);
 assert.equal(parsed.worksheets[0].getCell('A2').value,'Fixture Resort');assert.equal(parsed.worksheets[0].getCell('E2').value.result,2);
});
test('import redirects are revalidated before another connection',async()=>{
 const {EventEmitter}=require('node:events');let requests=0;
 const safe=load('lib/security/safe-fetch.ts',{
  'node:dns/promises':{lookup:async()=>[{address:'8.8.8.8',family:4}]},
  'node:https':{request:(_url,_options,receive)=>{
   requests++;const request=new EventEmitter();request.end=()=>queueMicrotask(()=>{const response=new EventEmitter();response.statusCode=302;response.headers={location:'http://127.0.0.1/internal'};response.resume=()=>{};receive(response);request.emit('close');});request.destroy=error=>{request.emit('error',error);request.emit('close');};return request;
  }}
 });
 await assert.rejects(()=>safe.safeFetch('https://drive.google.com/start'));assert.equal(requests,1);
});
test('private upload cleanup refuses files still referenced by a resource',async()=>{
 let deletes=0;
 const privateStorage=load('lib/storage/partner-resources.ts');
 const api=load('app/api/admin/resource-files/route.ts',{
  '@/lib/auth/require-admin':{requireAdminJson:async()=>({ok:true})},
  '@/lib/security/request-body':load('lib/security/request-body.ts'),
  '@/lib/storage/partner-resources':privateStorage,
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[{id:'attached'}]})})})}),storage:{from:()=>({remove:async()=>{deletes++;return {};}})}})}
 });
 const response=await api.POST(new Request('https://example.test',{method:'POST',body:JSON.stringify({mode:'discard',path:'files/fixture.pdf'})}));
 assert.equal(response.status,400);assert.equal(deletes,0);
});
test('patched image library preserves resize and format conversion',async()=>{
 const sharp=require('sharp');const png=await sharp({create:{width:8,height:4,channels:4,background:{r:1,g:2,b:3,alpha:0.5}}}).png().toBuffer();
 const webp=await sharp(png).resize({width:4}).webp().toBuffer();const info=await sharp(webp).metadata();
 assert.equal(info.format,'webp');assert.equal(info.width,4);assert.equal(info.height,2);assert.equal(info.hasAlpha,true);
});
test('global nonce middleware preserves the existing public layout header behavior',()=>{
 let forwarded;
 const {middleware}=load('middleware.ts',{
  '@/lib/security/csp':load('lib/security/csp.ts'),
  '@/lib/auth/bootstrap-admin':{ADMIN_LOGIN_PATH:'/admin/login'},
  'next/server':{NextResponse:{next:options=>{forwarded=options.request.headers;return {headers:new Headers()};}}}
 });
 const response=middleware({nextUrl:new URL('https://example.test/'),url:'https://example.test/',headers:new Headers({'x-pathname':'/admin'}),cookies:{getAll:()=>[]}});
 assert.equal(forwarded.get('x-pathname'),null);
 assert.ok(forwarded.get('x-nonce'));assert.ok(response.headers.get('content-security-policy'));
});
