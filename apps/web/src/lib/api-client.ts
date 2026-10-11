import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearSession } from './session';
const API_URL=process.env.NEXT_PUBLIC_API_URL;
export const apiClient=axios.create({baseURL:API_URL?`${API_URL.replace(/\/$/,'')}/api/v1`:'/api',timeout:30000,headers:{'Content-Type':'application/json'}});
apiClient.interceptors.request.use(config=>{if(typeof window!=='undefined'){const token=localStorage.getItem('accessToken');if(token)config.headers.Authorization='Bearer '+token;}return config;});
let refresh:Promise<string>|null=null;
apiClient.interceptors.response.use(response=>{
 if(response.data?.success===true&&'data' in response.data)response.data=response.data.data;
 return response;
},async(error:AxiosError<any>)=>{
 const request=error.config as (InternalAxiosRequestConfig&{_retry?:boolean})|undefined;
 if(error.response?.data?.error?.message)error.response.data.message=error.response.data.error.message;
 if(typeof window!=='undefined'&&error.response?.status===401&&request&&!request._retry&&!['/auth/login','/auth/refresh'].includes(request.url||'')){
  request._retry=true;const token=localStorage.getItem('refreshToken');
  if(token){try{
   refresh ||= axios.post((apiClient.defaults.baseURL||'/api')+'/auth/refresh',{refreshToken:token},{timeout:15000}).then(res=>{const data=res.data.data||res.data;if(!data.accessToken)throw new Error('Invalid session');localStorage.setItem('accessToken',data.accessToken);return data.accessToken as string;}).finally(()=>{refresh=null;});
   request.headers.Authorization='Bearer '+await refresh;return apiClient(request);
  }catch{clearSession();window.location.assign('/login');}}
  else{clearSession();window.location.assign('/login');}
 }
 return Promise.reject(error);
});
export const api={
 login:async(email:string,password:string)=>(await apiClient.post('/auth/login',{email,password})).data,
 logout:async()=>{try{return (await apiClient.post('/auth/logout')).data;}finally{clearSession();}},
 getMyChildren:async()=>(await apiClient.get('/workspace/children')).data,
 getStudent:async(id:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data,
 getStudentInvoices:async(id:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data.invoices,
 getStudentPayments:async(id:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data.payments,
 getStudentAttendance:async(id:string,_start?:string,_end?:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data.attendance,
 getStudentAttendanceReport:async(id:string,_start?:string,_end?:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data.attendanceSummary,
 getStudentGrades:async(id:string,_term?:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data.grades,
 getStudentReportCards:async(id:string)=>(await apiClient.get('/workspace/student/'+encodeURIComponent(id))).data.reportCards,
 getInvoice:async(id:string)=>(await apiClient.get('/workspace/invoice/'+encodeURIComponent(id))).data,
 getReportCard:async(id:string)=>(await apiClient.get('/workspace/report/'+encodeURIComponent(id))).data,
 getCurrentTerm:async()=>(await apiClient.get('/workspace/current-term')).data,
 initiateSTKPush:async(data:{invoiceId:string;phoneNumber:string;amount:number})=>(await apiClient.post('/workspace/pay',data)).data,
};
export default apiClient;
