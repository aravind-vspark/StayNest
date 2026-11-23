/* Shared browser/native localization. User-generated content is never rewritten. */
(() => {
  const languages = {en:'English', te:'తెలుగు', hi:'हिन्दी'};
  const supported = code => Object.hasOwn(languages, code);
  const normalize = code => String(code || '').toLowerCase().split('-')[0];
  let language = 'en';
  let saved = '';
  let preferred;
  try {
    saved = normalize(globalThis.localStorage?.getItem('staynest.language'));
  } catch {}
  try {preferred = (globalThis.navigator?.languages || [globalThis.navigator?.language]).map(normalize).find(supported);}catch{}
  language = supported(saved) ? saved : preferred || 'en';
  function translate(key, parameters={}) {
    const entry=globalThis.StayNestTranslations?.[key];
    const text=language==='en' ? key : entry?.[language==='hi'?0:1] || key;
    return String(text).replace(/\{([a-zA-Z_]+)\}/g,(match,name)=>Object.hasOwn(parameters,name)?String(parameters[name]):match);
  }
  function setLanguage(code) {
    if(!supported(code)) return false;
    language=code;
    try {globalThis.localStorage?.setItem('staynest.language', code);}catch{}
    globalThis.document?.documentElement?.setAttribute('lang',code);
    globalThis.document?.documentElement?.setAttribute('dir','ltr');
    if(globalThis.document) globalThis.document.title=translate('StayNest — Find your place');
    return true;
  }
  globalThis.StayNestI18n={translate,setLanguage,languages,getLanguage:()=>language,locale:()=>`${language}-IN`};
  setLanguage(language);
})();
