// API security baseline. Pure request metadata checks, no secrets or identity data stored.
// Limiters are injected by platform configuration; never claim a rate limit is active without one.
export const SECURITY_LIMITS=Object.freeze({
  writeBytes:512*1024, restoreBytes:2048, maxPathLength:128
});
const routes=Object.freeze({
  '/health':['GET'],
  '/v1/save':['GET','PUT'],
  '/v1/revisions':['GET'],
  '/v1/restore':['POST']
});
export function validateApiRequest({pathname,method,contentType='',contentLength=null}) {
  if(typeof pathname!=='string'||pathname.length>SECURITY_LIMITS.maxPathLength)
    return {ok:false,status:404,error:'not_found'};
  const methods=routes[pathname];
  if(!methods) return {ok:false,status:404,error:'not_found'};
  if(!methods.includes(method)) return {ok:false,status:405,error:'method_not_allowed'};
  if(method==='PUT'||method==='POST') {
    if(!/^application\/json(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/i.test(contentType))
      return {ok:false,status:415,error:'unsupported_media_type'};
    if(contentLength!==null && contentLength!=='') {
      if(!/^\d+$/.test(String(contentLength))) return {ok:false,status:400,error:'invalid_content_length'};
      const bytes=Number(contentLength);
      if(!Number.isSafeInteger(bytes)) return {ok:false,status:400,error:'invalid_content_length'};
      const max=method==='PUT'?SECURITY_LIMITS.writeBytes:SECURITY_LIMITS.restoreBytes;
      if(bytes>max) return {ok:false,status:413,error:'payload_too_large'};
    }
  }
  return {ok:true};
}
export async function checkRateLimit(env,key) {
  // Cloudflare native Rate Limiting binding (future optional deployment).
  // Without it, requests remain subject to auth and strict payload validation, NOT rate limiting.
  if(!env?.SAVE_RATE_LIMITER?.limit) return {ok:true,configured:false};
  try {
    const result=await env.SAVE_RATE_LIMITER.limit({key});
    return {ok:result?.success===true,configured:true};
  }catch{
    return {ok:false,configured:true,error:'rate_limit_unavailable'};
  }
}
