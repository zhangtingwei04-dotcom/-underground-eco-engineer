import {validateApiRequest,checkRateLimit} from '../cloudflare/security-guard.mjs';
const cases=[
 ['health',validateApiRequest({pathname:'/health',method:'GET'}).ok],
 ['reject unknown',validateApiRequest({pathname:'/admin',method:'GET'}).status===404],
 ['reject method',validateApiRequest({pathname:'/v1/save',method:'DELETE'}).status===405],
 ['reject text payload',validateApiRequest({pathname:'/v1/save',method:'PUT',contentType:'text/plain'}).status===415],
 ['accept JSON',validateApiRequest({pathname:'/v1/save',method:'PUT',contentType:'application/json'}).ok],
 ['reject oversized',validateApiRequest({pathname:'/v1/save',method:'PUT',contentType:'application/json',contentLength:'600000'}).status===413],
 ['reject malformed length',validateApiRequest({pathname:'/v1/save',method:'PUT',contentType:'application/json',contentLength:'abc'}).status===400],
 ['reject oversized restore',validateApiRequest({pathname:'/v1/restore',method:'POST',contentType:'application/json',contentLength:'2049'}).status===413],
 ['no limiter is not claimed enabled',(await checkRateLimit({},'actor')).configured===false],
 ['limiter denies',!(await checkRateLimit({SAVE_RATE_LIMITER:{limit:async()=>({success:false})}},'actor')).ok]
];
for(const [name,pass] of cases)console.log((pass?'PASS ':'FAIL ')+name);
if(cases.some(x=>!x[1]))throw new Error('security guard tests failed');
