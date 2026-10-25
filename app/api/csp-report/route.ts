import { readJsonBody } from "@/lib/security/request-body";
import { checkRateLimit,getClientIp } from "@/lib/security/rate-limit";
export async function POST(request:Request) {
  const limit=await checkRateLimit({key:`csp:${getClientIp(request)}`,limit:20,windowMs:60000});
  if(!limit.allowed)return new Response(null,{status:429});
  const report=await readJsonBody(request,8192).catch(()=>null);
  const value=report?.["csp-report"] as Record<string,unknown>|undefined;
  if(value) {
    const directive=String(value["effective-directive"]??"").slice(0,80);
    let origin="";try{origin=new URL(String(value["blocked-uri"])).origin;}catch{}
    console.info("CSP violation",{directive,origin});
  }
  return new Response(null,{status:204});
}
