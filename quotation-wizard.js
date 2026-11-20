'use strict';
const wizardUnknown=LMConsultant.UNKNOWN;
let projectAnswers={goals:[]},wizardStep=0;
try{projectAnswers={goals:[],...JSON.parse(sessionStorage.getItem('lm-project-v3')||'{}')}}catch{}
const priorVehicle=$('#vehicle').value,priorNotes=$('#notes').value;
if(priorVehicle&&!projectAnswers.carModel)projectAnswers.carModel=priorVehicle;
if(priorNotes&&!projectAnswers.notes)projectAnswers.notes=priorNotes;
const fieldValue=k=>projectAnswers[k]||'';
const qEscape=escapeHtml;

function textField(key,label,{list='',placeholder='',hint='',type='text',max=160}={}){
  return `<label class="wizard-field" for="project-${key}">
    <span class="field-label-row"><span>${label}</span><span class="optional">Opcional · pode informar “Não sei”</span></span>
    <input id="project-${key}" data-project-field="${key}" type="${type}" maxlength="${max}" value="${qEscape(fieldValue(key))}" ${list?`list="${list}"`:''} placeholder="${qEscape(placeholder)}">
    ${hint?`<small>${hint}</small>`:''}
  </label>`;
}
function selectField(key,label,options,{required=false,hint=''}={}){
  return `<label class="wizard-field" for="project-${key}">
    <span class="field-label-row"><span>${label}</span><span class="optional">${required?'Obrigatório · “Não sei” também vale':'Opcional'}</span></span>
    <select id="project-${key}" data-project-field="${key}" ${required?'aria-required="true"':''}>
      <option value="">Selecione uma opção</option>
      ${options.map(v=>`<option ${fieldValue(key)===v?'selected':''} value="${qEscape(v)}">${v}</option>`).join('')}
    </select>
    ${hint?`<small>${hint}</small>`:''}
  </label>`;
}
function multiField(key,label,options,hint=''){
  const value=Array.isArray(projectAnswers[key])?projectAnswers[key]:[];
  return `<fieldset class="wizard-choices" id="project-${key}">
    <legend>${label}</legend>
    ${hint?`<p class="small muted">${hint}</p>`:''}
    <div class="choices-grid">
      ${options.map(v=>`<label class="choice-card"><input type="checkbox" data-project-multi="${key}" value="${qEscape(v)}" ${value.includes(v)?'checked':''}><span>${v}</span></label>`).join('')}
    </div>
  </fieldset>`;
}

const preservedItems=$('#quote-items');
const dialog=$('#quote-dialog');
dialog.innerHTML=`
  <button class="close" aria-label="Fechar orçamento" data-close>×</button>
  <div class="wizard-header">
    <div class="eyebrow blue"><i></i> CONFIGURADOR DE PROJETO · L&amp;M</div>
    <h2>Vamos entender<br><em>o seu projeto.</em></h2>
    <p class="wizard-intro">Não precisa dominar especificações técnicas. Configure o que já sabe e marque “Não sei” sempre que quiser a recomendação da nossa equipe.</p>
  </div>
  <ol class="wizard-progress" aria-label="Etapas do orçamento">
    ${['Produtos','Veículo','Seu objetivo','Instalação e prazo','Ficha final'].map((s,i)=>`<li data-step-index="${i}"><span>${i+1}</span><b>${s}</b></li>`).join('')}
  </ol>
  <div id="wizard-error" role="alert" tabindex="-1" hidden></div>

  <section class="wizard-step" data-wizard-step="0">
    <div class="step-header">
      <span class="step-tag">ETAPA 01 / EQUIPAMENTOS</span>
      <h3 tabindex="-1">01 / Sua seleção</h3>
      <p class="step-sub">Defina quantidades e indique se deseja incluir a instalação para cada item selecionado.</p>
    </div>
    <div id="wizard-product-slot"></div>
    <p class="small muted step-note">Ainda não sabe quais produtos escolher? Pode continuar sem selecionar equipamentos e pedir uma indicação completa à equipe.</p>
  </section>

  <section class="wizard-step" data-wizard-step="1" hidden>
    <div class="step-header">
      <span class="step-tag">ETAPA 02 / ESPECIFICAÇÃO DO VEÍCULO</span>
      <h3 tabindex="-1">02 / Conheça seu veículo</h3>
      <p class="step-sub">Estes dados ajudam a equipe a conferir espaço de painel, furação de portas, chicotes e molduras.</p>
    </div>
    <label class="wizard-help-choice">
      <input type="checkbox" id="vehicle-unknown" ${projectAnswers.vehicleUnknown?'checked':''}>
      <span>Não sei os dados exatos do veículo / quero ajuda da equipe</span>
    </label>
    <div id="vehicle-fields" class="wizard-fields">
      ${textField('carBrand','Marca do veículo',{list:'car-brand-list',placeholder:'Ex.: Volkswagen, Hyundai, Chevrolet'})}
      ${textField('carModel','Modelo',{placeholder:'Ex.: Gol, Passat, Veloster ou Não sei'})}
      ${textField('carYear','Ano',{placeholder:'Ex.: 2018 ou Não sei',max:30})}
      ${textField('carVersion','Versão, se souber',{placeholder:'Ex.: Comfortline ou Não sei'})}
    </div>
    <datalist id="car-brand-list">
      ${['Volkswagen','Fiat','Chevrolet','Ford','Renault','Hyundai','Toyota','Honda','Nissan','Jeep','Peugeot','Citroën','BMW','Mercedes-Benz','Audi','BYD','Volvo',wizardUnknown].map(v=>`<option value="${v}">`).join('')}
    </datalist>
    <div class="wizard-fields">
      ${selectField('modified','O som já foi modificado?',['Não, é o sistema original','Sim, já tem modificações',wizardUnknown])}
      ${textField('keepEquipment','Há equipamentos que deseja manter?',{placeholder:'Rádio atual, alto-falantes, módulo… ou Não sei',max:300})}
    </div>
  </section>

  <section class="wizard-step" data-wizard-step="2" hidden>
    <div class="step-header">
      <span class="step-tag">ETAPA 03 / PERFIL SONORO E FUNCIONAL</span>
      <h3 tabindex="-1">03 / O que você quer sentir?</h3>
      <p class="step-sub">Selecione seus objetivos principais para calibrarmos a recomendação técnica.</p>
    </div>
    ${multiField('goals','O que deseja fazer no carro?',LMConsultant.goals,'Escolha uma ou mais opções. Se ainda não souber, a equipe ajuda a definir.')}
    <div id="adaptive-questions"></div>
    <label class="wizard-field" for="notes">
      <span class="field-label-row"><span>Como imagina o projeto?</span><span class="optional">Opcional · preferências de uso, estética e ideias</span></span>
      <textarea id="notes" data-project-field="notes" maxlength="1600" rows="4" placeholder="Ex.: Quero mais grave sem perder espaço no porta-malas e manter os comandos de volante.">${qEscape(fieldValue('notes'))}</textarea>
    </label>
  </section>

  <section class="wizard-step" data-wizard-step="3" hidden>
    <div class="step-header">
      <span class="step-tag">ETAPA 04 / EXECUÇÃO E PLANEJAMENTO</span>
      <h3 tabindex="-1">04 / Instalação e prazo</h3>
      <p class="step-sub">Defina o formato de atendimento na loja e a previsão para realização do projeto.</p>
    </div>
    <div class="wizard-fields">
      ${selectField('installation','Como deseja ser atendido?',['Somente os produtos','Produtos e instalação',wizardUnknown],{required:true})}
      ${selectField('timing','Quando gostaria de realizar o projeto?',['Assim que possível','Nas próximas semanas','Estou pesquisando','Data preferida','Ainda não sei'],{required:true})}
    </div>
    <label class="wizard-field" id="preferred-date-field" for="project-date" hidden>
      <span class="field-label-row"><span>Data preferida</span><span class="optional">Preferência sujeita à agenda da loja</span></span>
      <input type="date" id="project-date" data-project-field="date" value="${qEscape(fieldValue('date'))}">
      <small>É uma preferência inicial, não um agendamento confirmado.</small>
    </label>
    <div id="installation-preferences">
      <div id="installation-locations"></div>
      <div class="wizard-fields">
        ${selectField('originalLook','Deseja preservar a aparência original?',['Sim, o máximo possível','Não é minha prioridade',wizardUnknown])}
        ${selectField('adaptations','Aceita adaptações tecnicamente viáveis?',['Sim, quero avaliar as opções','Prefiro evitar adaptações',wizardUnknown])}
      </div>
    </div>
    <div class="wizard-fields">
      ${textField('budget','Faixa de orçamento aproximada',{list:'budget-list',placeholder:'Ex.: Até R$ 1.000, a definir ou Não sei',max:80})}
      ${selectField('urgency','Existe alguma urgência?',['Não, posso planejar','Sim — explico nas observações','Ainda não sei'])}
    </div>
    <datalist id="budget-list">
      <option value="Ainda não sei">
      <option value="Até R$ 500">
      <option value="R$ 500 a R$ 1.000">
      <option value="R$ 1.000 a R$ 2.000">
      <option value="Acima de R$ 2.000">
    </datalist>
    <p class="small muted step-note">Valor, disponibilidade, compatibilidade e agendamento serão confirmados pela L&amp;M.</p>
  </section>

  <section class="wizard-step" data-wizard-step="4" hidden>
    <div class="step-header">
      <span class="step-tag">ETAPA 05 / FICHA DE CONFIGURAÇÃO DO PROJETO</span>
      <h3 tabindex="-1">05 / Revise antes de enviar</h3>
      <p class="step-sub">Confira o resumo técnico do seu projeto antes de abrir a conversa no WhatsApp.</p>
    </div>
    <div id="project-review" class="project-dossier"></div>
    <details class="message-preview">
      <summary>Conferir mensagem formatada para o WhatsApp <span>+</span></summary>
      <pre id="message-preview"></pre>
    </details>
    <p class="small muted" id="project-privacy">Ao continuar, estas respostas serão compartilhadas com a L&amp;M pelo WhatsApp. Você ainda confirma o envio no aplicativo. Abrir o WhatsApp não confirma recebimento nem agendamento.</p>
    <a class="button primary send-wa-cta" id="send-quote" href="#" target="_blank" rel="noopener noreferrer" aria-describedby="project-privacy">
      <span>Abrir solicitação no WhatsApp</span>
      <span>↗</span>
    </a>
  </section>

  <div class="wizard-footer">
    <button id="wizard-back" type="button" class="button outline">← Voltar</button>
    <span id="wizard-position" role="status"></span>
    <button id="wizard-next" type="button" class="button primary">Continuar →</button>
  </div>
  <input type="hidden" id="vehicle" value="${qEscape(priorVehicle)}">`;

$('#wizard-product-slot').append(preservedItems);
dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());

function saveProject(){try{sessionStorage.setItem('lm-project-v3',JSON.stringify(projectAnswers))}catch{}}
function collectProject(){
  $$('[data-project-field]').forEach(el=>projectAnswers[el.dataset.projectField]=el.value.slice(0,Number(el.maxLength)>0?el.maxLength:1600));
  projectAnswers.vehicleUnknown=$('#vehicle-unknown').checked;
  const keys=new Set($$('[data-project-multi]').map(e=>e.dataset.projectMulti));
  for(const key of keys)projectAnswers[key]=$$(`[data-project-multi="${key}"]:checked`).map(e=>e.value);
  saveProject();
}
function updateConditions(){
  $('#vehicle-fields').hidden=$('#vehicle-unknown').checked;
  $('#vehicle-fields').querySelectorAll('input').forEach(el=>el.disabled=$('#vehicle-unknown').checked);
  $('#installation-preferences').hidden=$('#project-installation').value==='Somente os produtos';
  $('#preferred-date-field').hidden=$('#project-timing').value!=='Data preferida';
  const date=new Date(),today=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  $('#project-date').min=today;
}
function renderAdaptive(){
  const rules=LMConsultant.activeRules(products,quote);
  $('#adaptive-questions').innerHTML=rules.map(r=>`
    <div class="adaptive-question">
      <span class="product-brand">ESPECÍFICO PARA · ${LMConsultant.groupNames[r.group].toUpperCase()}</span>
      ${r.type==='multi'?multiField(r.key,r.label,r.options,r.hint):r.type==='select'?selectField(r.key,r.label,r.options):textField(r.key,r.label,{hint:r.hint,placeholder:'Descreva, ou escreva Não sei',max:300})}
    </div>`).join('');
  const list=LMConsultant.selectedProducts(products,quote);
  $('#installation-locations').innerHTML=list.length?list.filter(p=>quote[p.id].installation!=='não').map(p=>selectField('installLocation_'+p.id,`Onde imagina instalar ${p.name}?`,LMConsultant.locations(products,{[p.id]:quote[p.id]}),{hint:'A equipe confirma se o local é adequado para este equipamento e para seu veículo.'})).join(''):textField('location','Onde pretende fazer a instalação?',{placeholder:'Conte sua ideia, ou escreva Não sei'});
}
function reviewSection(title,code,body,step){
  return `<section class="review-section">
    <div class="review-card-top">
      <div>
        <span class="review-code">${code}</span>
        <h4>${title}</h4>
      </div>
      <button type="button" class="edit-step-btn" data-edit-step="${step}">Editar etapa ↗</button>
    </div>
    <p>${qEscape(body||'A definir com a equipe').replace(/\n/g,'<br>')}</p>
  </section>`;
}
function renderReview(){
  const s=projectAnswers,list=LMConsultant.selectedProducts(products,quote),car=s.vehicleUnknown?wizardUnknown:[s.carBrand,s.carModel,s.carYear,s.carVersion].filter(Boolean).join(' · ');
  $('#project-review').innerHTML=
    reviewSection('Produtos selecionados','01 / EQUIPAMENTOS',list.length?list.map(p=>`${quote[p.id].quantity}x ${p.name} (${p.model})`).join('\n'):'Quero ajuda para escolher os equipamentos',0)+
    reviewSection('Veículo e sistema atual','02 / VEÍCULO',[car,s.modified,s.keepEquipment].filter(Boolean).join('\n'),1)+
    reviewSection('Objetivo e preferências','03 / ACÚSTICA & USO',[...(s.goals||[]),...LMConsultant.activeRules(products,quote).flatMap(r=>s[r.key]?[r.label+' '+(Array.isArray(s[r.key])?s[r.key].join(', '):s[r.key])]:[]),s.notes].filter(Boolean).join('\n'),2)+
    reviewSection('Instalação e prazo','04 / EXECUÇÃO',[s.installation,...(s.installation==='Somente os produtos'?[]:list.flatMap(p=>s['installLocation_'+p.id]?[p.name+': '+s['installLocation_'+p.id]]:[])),...(s.installation==='Somente os produtos'?[]:[s.originalLook,s.adaptations]),s.timing==='Data preferida'&&s.date?s.date.split('-').reverse().join('/'):s.timing,s.budget?'Faixa de orçamento: '+s.budget:'',s.urgency].filter(Boolean).join('\n'),3);
  $('#project-review').querySelectorAll('[data-edit-step]').forEach(b=>b.addEventListener('click',()=>showWizardStep(+b.dataset.editStep)));
}
updateMessage=function(){
  collectProject();
  const message=LMConsultant.message(products,quote,projectAnswers);
  $('#message-preview').textContent=message;
  $('#send-quote').href=wa(message);
  if(wizardStep===4)renderReview();
};
function showWizardError(error){
  const el=$('#wizard-error');
  el.hidden=false;
  el.textContent=error.message;
  el.focus();
}
function showWizardStep(step){
  collectProject();
  wizardStep=step;
  $('#wizard-error').hidden=true;
  if(step===2||step===3)renderAdaptive();
  $$('.wizard-step').forEach(el=>el.hidden=+el.dataset.wizardStep!==step);
  $$('.wizard-progress li').forEach((el,i)=>{
    el.classList.toggle('active',i===step);
    el.classList.toggle('complete',i<step);
    if(i===step)el.setAttribute('aria-current','step');
    else el.removeAttribute('aria-current');
  });
  $('#wizard-back').hidden=step===0;
  $('#wizard-next').hidden=step===4;
  $('#wizard-position').textContent=`Etapa ${step+1} de 5`;
  updateConditions();
  updateMessage();
  dialog.scrollTop=0;
  const activeStepEl=dialog.querySelector(`.wizard-step[data-wizard-step="${step}"]`);
  if(!motion.matches&&activeStepEl){
    activeStepEl.animate([
      {opacity:0,transform:'translateY(10px)'},
      {opacity:1,transform:'translateY(0)'}
    ],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  activeStepEl?.querySelector('h3')?.focus({preventScroll:true});
}
$$('.wizard-progress li').forEach((li,idx)=>{
  li.addEventListener('click',()=>{
    if(idx<wizardStep)showWizardStep(idx);
  });
});
$('#wizard-next').addEventListener('click',()=>{
  collectProject();
  const error=LMConsultant.validateStep(wizardStep,projectAnswers);
  if(error)return showWizardError(error);
  showWizardStep(Math.min(4,wizardStep+1));
});
$('#wizard-back').addEventListener('click',()=>showWizardStep(Math.max(0,wizardStep-1)));
dialog.addEventListener('input',e=>{
  if(e.target.matches('[data-project-field]')){
    collectProject();
    updateConditions();
    updateMessage();
  }
});
dialog.addEventListener('change',e=>{
  const el=e.target;
  if(el.matches('[data-project-multi]')&&el.checked){
    const key=el.dataset.projectMulti;
    $$(`[data-project-multi="${key}"]`).filter(c=>c!==el&&(el.value===wizardUnknown||c.value===wizardUnknown)).forEach(c=>c.checked=false);
  }
  collectProject();
  updateConditions();
  updateMessage();
});
$('#send-quote').addEventListener('click',e=>{
  collectProject();
  for(const step of [2,3]){
    const error=LMConsultant.validateStep(step,projectAnswers);
    if(error){
      e.preventDefault();
      showWizardStep(step);
      showWizardError(error);
      return;
    }
  }
  updateMessage();
});
const requestBeforeWizard=requestProduct;
requestProduct=function(id){
  collectProject();
  requestBeforeWizard(id);
  showWizardStep(0);
};
$('#open-quote').addEventListener('click',()=>showWizardStep(0));
updateConditions();
updateQuote();
showWizardStep(0);
