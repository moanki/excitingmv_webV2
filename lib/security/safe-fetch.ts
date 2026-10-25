import "server-only";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";
const MAX_BYTES=50*1024*1024;
export function validateImportUrl(value:string) {
  const url=new URL(value);
  const project=process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
  if(url.protocol!=="https:" || url.username || url.password || (url.port && url.port!=="443") ||
    !( ["drive.google.com","docs.google.com","drive.usercontent.google.com",project].filter(Boolean).includes(url.hostname) || url.hostname.endsWith(".googleusercontent.com"))) throw new Error("Import sources must be approved HTTPS Google Drive or project Storage URLs.");
  return url;
}
export function isPublicAddress(value:string) {
  if(isIP(value)===4) {
    const [a,b,c]=value.split(".").map(Number);
    return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19||b===51&&c===100))||(a===192&&(b===0||b===2))||(a===203&&b===0&&c===113));
  }
  // Provider origins must resolve to globally routable IPv6 unicast addresses.
  return isIP(value)===6 && /^[23][0-9a-f]{3}:/i.test(value) && !value.toLowerCase().startsWith("2001:db8:");
}
export async function safeFetch(value:string,_init?:RequestInit,redirects=0):Promise<Response> {
  if(redirects>4)throw new Error("Too many import redirects.");
  const url=validateImportUrl(value);
  const addresses=await lookup(url.hostname,{all:true});
  if(!addresses.length||addresses.some(item=>!isPublicAddress(item.address)))throw new Error("Private network import sources are not allowed.");
  const target=addresses[0];
  const response=await new Promise<Response>((resolve,reject)=>{
    const req=request(url,{method:"GET",headers:{"accept-encoding":"identity"},lookup:(_host,options,callback)=>{ if(typeof options === "object" && options.all) (callback as Function)(null,[target]); else callback(null,target.address,target.family); }},res=>{
      const status=res.statusCode??500;
      if([301,302,303,307,308].includes(status)) {
        const location=res.headers.location;res.resume();
        if(!location){reject(new Error("Invalid redirect."));return;}
        safeFetch(new URL(location,url).toString(),undefined,redirects+1).then(resolve,reject);return;
      }
      if(Number(res.headers["content-length"]||0)>MAX_BYTES){res.destroy();reject(new Error("Document exceeds 50 MB."));return;}
      let size=0;const chunks:Buffer[]=[];
      res.on("data",(chunk:Buffer)=>{size+=chunk.length;if(size>MAX_BYTES){req.destroy(new Error("Document exceeds 50 MB."));return;}chunks.push(chunk);});
      res.on("error",reject);
      res.on("end",()=>{
        const headers=new Headers();for(const [key,value] of Object.entries(res.headers))if(value)headers.set(key,Array.isArray(value)?value.join(","):value);
        const result=new Response(Buffer.concat(chunks),{status,headers});Object.defineProperty(result,"url",{value:url.toString()});resolve(result);
      });
    });
    const deadline=setTimeout(()=>req.destroy(new Error("Import download timed out.")),45000);
    req.on("close",()=>clearTimeout(deadline));req.on("error",reject);req.end();
  });
  return response;
}
