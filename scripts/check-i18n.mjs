import fs from 'node:fs';
import vm from 'node:vm';
import {parse} from 'acorn';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('web/translations.js','utf8'),context);
const catalog=context.StayNestTranslations;
const keys=new Set();
function collect(node){
  if(node?.type==='Literal'&&typeof node.value==='string')keys.add(node.value);
  if(node?.type==='ConditionalExpression'){collect(node.consequent);collect(node.alternate);}
}
function walk(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee?.name==='tr')collect(node.arguments[0]);
  for(const [key,value]of Object.entries(node))if(!['start','end','value','raw'].includes(key)){
    if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);
  }
}
walk(parse(fs.readFileSync('web/app.js','utf8'),{ecmaVersion:'latest'}));
const problems=[];
for(const key of keys)if(!catalog[key])problems.push(`Missing translations: ${key}`);
for(const [key,values]of Object.entries(catalog)){
  const placeholders=value=>[...value.matchAll(/\{([a-zA-Z_]+)\}/g)].map(m=>m[1]).sort().join(',');
  if(!Array.isArray(values)||values.length!==2||values.some(v=>typeof v!=='string'||!v.trim()))problems.push(`Incomplete Hindi/Telugu pair: ${key}`);
  else for(const value of values){
    if(placeholders(value)!==placeholders(key))problems.push(`Placeholder mismatch: ${key}`);
    if(/[<>]/.test(value))problems.push(`Translation contains HTML: ${key}`);
  }
}
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log(`${keys.size} literal UI messages covered; ${Object.keys(catalog).length} complete Hindi/Telugu translation pairs.`);
