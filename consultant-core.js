(function(root){
 'use strict';
 const UNKNOWN='Não sei / quero ajuda da equipe';
 function group(p){if(/subwoofer/i.test(p.name))return 'subwoofer';if(/amplificador/i.test(p.name))return 'amplifier';if(/rádio/i.test(p.name))return 'radio';if(p.category==='Multimídia')return 'multimedia';if(p.category==='Alto-falantes')return 'speakers';if(/tweeter/i.test(p.name))return 'tweeter';return 'parking'}
 const groupNames={subwoofer:'Subwoofers',amplifier:'Amplificadores',radio:'Rádios',multimedia:'Centrais multimídia',speakers:'Alto-falantes',tweeter:'Tweeters',parking:'Sensores e acessórios'};
 const goals=['Melhorar a qualidade do som','Aumentar os graves','Aumentar o volume','Instalar uma central multimídia','Substituir equipamentos existentes','Instalar acessórios','Montar um projeto completo','Outro objetivo',UNKNOWN];
 const rules={
  multimedia:[{key:'mediaFeatures',label:'Quais funções você gostaria de ter?',type:'multi',options:['Bluetooth','Navegação / GPS','Android Auto','Apple CarPlay','Câmera de ré',UNKNOWN],hint:'São preferências do seu projeto. A equipe vai confirmar quais recursos o produto selecionado oferece.'}],
  radio:[{key:'radioFeatures',label:'O que procura no rádio?',type:'multi',options:['Música por Bluetooth','Reproduzir arquivos por USB','Manter comandos do volante',UNKNOWN],hint:'Compatibilidade e necessidade de interfaces serão avaliadas pela equipe.'}],
  speakers:[{key:'speakerPlan',label:'Como deseja melhorar os alto-falantes?',type:'select',options:['Substituir os originais','Melhorar a qualidade sonora','Integrar a um sistema mais completo',UNKNOWN]}],
  subwoofer:[{key:'bassPreference',label:'Como você gosta dos graves?',type:'select',options:['Discretos e equilibrados','Mais presentes no dia a dia','Quero bastante grave',UNKNOWN]},{key:'availableSpace',label:'Quanto espaço pode ser utilizado?',type:'select',options:['Quero preservar o porta-malas','Posso usar parte do porta-malas','Quero uma solução compacta',UNKNOWN]}],
  amplifier:[{key:'poweredEquipment',label:'Quais equipamentos o amplificador deverá alimentar?',type:'text',hint:'Conte o que já possui, ou escreva “Não sei”. Modelo e impedância serão conferidos pela equipe.'}],
  tweeter:[{key:'tweeterPlan',label:'O que deseja com o tweeter?',type:'select',options:['Complementar os agudos','Substituir o tweeter existente',UNKNOWN]}],
  parking:[{key:'parkingPlan',label:'Qual é a necessidade do acessório?',type:'select',options:['Auxílio nas manobras de ré','Substituir um sensor existente','Avaliar um acessório para meu carro',UNKNOWN]}]
 };
 const placements={multimedia:['Painel'],radio:['Painel'],speakers:['Portas','Locais originais dos alto-falantes'],subwoofer:['Porta-malas','Solução compacta — avaliar espaço com a equipe'],amplifier:['Porta-malas','Local ventilado a definir com a equipe'],tweeter:['Local do tweeter a definir com a equipe'],parking:['Área dos para-choques — avaliar o kit']};
 function selectedProducts(products,quote){return products.filter(p=>quote[p.id]?.quantity>0)}
 function activeRules(products,quote){return [...new Set(selectedProducts(products,quote).map(group))].flatMap(g=>rules[g].map(r=>({...r,group:g})))}
 function locations(products,quote){return [...new Set(selectedProducts(products,quote).flatMap(p=>placements[group(p)]))].concat(['Outro local — descrever nas observações',UNKNOWN])}
 function canCompare(list){return list.length>=2&&new Set(list.map(group)).size===1}
 function validateStep(step,state,today){
  if(!today){const now=new Date();today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
  if(step===2&&!(state.goals||[]).length)return {field:'goals',message:'Escolha pelo menos um objetivo. Se preferir, marque “Não sei / quero ajuda da equipe”.'};
  if(step===3){if(!state.installation)return {field:'installation',message:'Escolha como deseja ser atendido, inclusive “Não sei”.'};if(!state.timing)return {field:'timing',message:'Informe um prazo ou escolha “Ainda não sei”.'};if(state.timing==='Data preferida'){if(!/^\d{4}-\d{2}-\d{2}$/.test(state.date||'')||!Number.isFinite(Date.parse(state.date+'T12:00:00')))return {field:'date',message:'Escolha uma data ou altere o prazo para “Ainda não sei”.'};if(state.date<today)return {field:'date',message:'Escolha uma data a partir de hoje, ou selecione “Ainda não sei”.'};}}
  return null;
 }
 function message(products,quote,s){
  const blocks=['*NOVA SOLICITAÇÃO DE ORÇAMENTO — L&M*'];
  const list=selectedProducts(products,quote);blocks.push('*PRODUTOS*\n'+(list.length?list.map(p=>`${quote[p.id].quantity}x ${p.brand} — ${p.name}\nModelo: ${p.model}`).join('\n\n'):'Quero ajuda da equipe para escolher os equipamentos.'));
  const lines=(pairs)=>pairs.filter(([,v])=>v&&String(v).trim()).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(', '):String(v).trim()}`).join('\n');
  blocks.push('*VEÍCULO*\n'+(s.vehicleUnknown?UNKNOWN:lines([['Marca',s.carBrand],['Modelo',s.carModel],['Ano',s.carYear],['Versão',s.carVersion]])||'Dados do veículo a confirmar.'));
  const existing=lines([['Som modificado',s.modified],['Equipamentos a manter',s.keepEquipment]]);if(existing)blocks.push('*SISTEMA ATUAL*\n'+existing);
  blocks.push('*OBJETIVO*\n'+((s.goals||[]).join(', ')||UNKNOWN));
  const adaptive=lines(activeRules(products,quote).map(r=>[r.label,s[r.key]]));if(adaptive)blocks.push('*PREFERÊNCIAS DOS EQUIPAMENTOS*\n'+adaptive);
  const wantsInstallation=s.installation!=='Somente os produtos';
  const installed=wantsInstallation?list.flatMap(p=>{
   const fields=[];const item=quote[p.id];
   if(item.installation!=='a definir')fields.push([p.name,item.installation==='sim'?'Incluir instalação':'Somente produto']);
   if(item.installation!=='não'&&s['installLocation_'+p.id])fields.push(['Local de '+p.name,s['installLocation_'+p.id]]);
   return fields;
  }):[];
  const installation=lines([['Atendimento',s.installation],...(wantsInstallation?[['Local',s.location],['Preservar aparência original',s.originalLook],['Aceita adaptações viáveis',s.adaptations]]:[]),...installed]);if(installation)blocks.push('*INSTALAÇÃO*\n'+installation);
  if(s.budget?.trim())blocks.push('*ORÇAMENTO PREVISTO*\n'+s.budget.trim());
  const desiredDate=s.timing==='Data preferida'&&s.date?s.date.split('-').reverse().join('/'):s.timing;
  blocks.push('*PRAZO E DATA DESEJADA*\n'+(desiredDate||'Ainda não sei')+(s.urgency?'\nUrgência: '+s.urgency:''));
  if(s.notes?.trim())blocks.push('*OBSERVAÇÕES*\n'+s.notes.trim());
  blocks.push('Solicitação sujeita à confirmação de preço, disponibilidade, compatibilidade e agendamento. A data indicada é apenas uma preferência.');return blocks.join('\n\n');
 }
 const api={UNKNOWN,group,groupNames,goals,rules,selectedProducts,activeRules,locations,canCompare,validateStep,message};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LMConsultant=api;
})(typeof globalThis!=='undefined'?globalThis:this);
