import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const translations=fs.readFileSync(new URL('../web/translations.js',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../web/i18n.js',import.meta.url),'utf8');
function initialize(globals={}){
  const attributes={};
  const c=vm.createContext({navigator:{},document:{documentElement:{setAttribute:(k,v)=>attributes[k]=v}},...globals});
  vm.runInContext(translations,c);vm.runInContext(runtime,c);
  return {c,attributes,i18n:c.StayNestI18n};
}
test('device language is the default and stored selection takes precedence',()=>{
  const {i18n,attributes}=initialize({navigator:{languages:['te-IN','en-US']}});
  assert.equal(i18n.getLanguage(),'te');assert.equal(attributes.lang,'te');
  const saved=initialize({navigator:{languages:['te-IN']},localStorage:{getItem:()=> 'hi',setItem(){}}});
  assert.equal(saved.i18n.getLanguage(),'hi');
});
test('blocked storage and unsupported languages degrade safely',()=>{
  const {i18n}=initialize({navigator:{languages:['hi-IN']},localStorage:{getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}}});
  assert.equal(i18n.getLanguage(),'hi');
  assert.equal(i18n.setLanguage('xx'),false);
  assert.equal(i18n.getLanguage(),'hi');
  assert.equal(i18n.setLanguage('te'),true);
  assert.equal(i18n.translate('A future untranslated label'),'A future untranslated label');
});
test('message interpolation and catalogue placeholders remain consistent',()=>{
  const {c,i18n}=initialize();
  for(const language of ['hi','te']){
    i18n.setLanguage(language);
    const text=i18n.translate('Welcome home, {name}.',{name:'Aravind'});
    assert.match(text,/Aravind/);assert.doesNotMatch(text,/\{name\}/);
  }
  const tokens=s=>[...s.matchAll(/\{([a-zA-Z_]+)\}/g)].map(m=>m[1]).sort();
  for(const [key,pair]of Object.entries(c.StayNestTranslations))for(const text of pair){
    assert.equal(typeof text,'string');assert.ok(text.length);assert.deepEqual(tokens(text),tokens(key));assert.doesNotMatch(text,/[<>]/);
  }
});
