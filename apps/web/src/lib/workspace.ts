import { apiClient } from './api-client';
export function messageFor(error: unknown) {
 const value = error as { response?: { data?: { message?: string | string[] } }; message?: string };
 const message = value.response?.data?.message;
 return Array.isArray(message) ? message.join('. ') : message || 'Could not complete the request. Please try again.';
}
export const money = (value: number) => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(value / 100);
export const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}) : '?';
export async function getRows(endpoint: string, params?: Record<string,string>) {
 const {data} = await apiClient.get(endpoint,{params});
 return Array.isArray(data) ? data : data.items || data.data || [];
}
export function exportCsv(name:string, columns: {label:string;key:string}[], rows:Record<string,unknown>[]) {
 const cell = (value:unknown) => {
  let text=String(value??''); if (/^[=+@\-\t\r]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
 };
 const csv = [columns.map(c=>cell(c.label)).join(','),...rows.map(row=>columns.map(c=>cell(row[c.key])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();URL.revokeObjectURL(url);
}