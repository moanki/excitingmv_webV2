"use client";
import Script from "next/script";
import { useEffect,useRef,useState } from "react";
type Widget={render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void};
export function TurnstileField({resetKey=0}:{resetKey?:number}) {
 const element=useRef<HTMLDivElement>(null);const widget=useRef<string|undefined>(undefined);const [token,setToken]=useState("");
 const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 function render(){const api=(window as Window & {turnstile?:Widget}).turnstile;if(api&&element.current&&!widget.current&&key)widget.current=api.render(element.current,{sitekey:key,callback:(value:string)=>setToken(value),"expired-callback":()=>setToken(""),"error-callback":()=>setToken("")});}
 useEffect(()=>{setToken("");if(widget.current)(window as Window & {turnstile?:Widget}).turnstile?.reset(widget.current);},[resetKey]);
 useEffect(()=>()=>{const api=(window as Window & {turnstile?:Widget}).turnstile;if(widget.current)api?.remove(widget.current);},[]);
 return <><input type="hidden" name="turnstileToken" value={token}/>{key?<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={render}/><div ref={element}/></>:<p role="status">Verification is unavailable. Please contact us directly.</p>}</>;
}
