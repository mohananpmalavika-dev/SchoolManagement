import {useLanguageContext} from '@/contexts/LanguageContext';
import {translations} from '@/i18n/translations';
function lookup(language:'en'|'hi'|'ml',key:string):unknown {
 return key.split('.').reduce<unknown>((value,part)=>value&&typeof value==='object'?Reflect.get(value,part):undefined,translations[language]);
}
export function useTranslation(){
 const {language}=useLanguageContext();
 const t=(key:string,variables:Record<string,string|number>={}):string=>{
  const value=lookup(language,key)??lookup('en',key);
  if(typeof value!=='string')return key;
  return value.replace(/\{\{(\w+)\}\}/g,(match,name)=>Object.hasOwn(variables,name)?String(variables[name]):match);
 };
 return {t,language};
}