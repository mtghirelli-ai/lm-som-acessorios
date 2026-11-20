'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {filterProducts,sanitizeQuote,buildMessage,quantity}=LMCatalogCore;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=id=>`foto-${String(id).padStart(2,'0')}.webp`;
const wa=text=>'https://wa.me/5541991549334?text='+encodeURIComponent(text);
const photos=[
  {id:14,label:'Fachada da L&M'},
  {id:15,label:'Nosso espaço de instalação'},
  {id:16,label:'Exposição de som e acessórios'},
  {id:17,label:'Interior da loja'},
  {id:19,label:'L&M Som e Acessórios Automotivos'},
  {id:20,label:'Produtos em exposição'},
  {id:21,label:'Vista da entrada da loja'},
  {id:22,label:'Subwoofers e amplificadores'},
  {id:23,label:'Venha conhecer a L&M'}
];
let selected='Todos',query='',quote={},currentPhoto=0,toastTimer;
try{
  quote=sanitizeQuote(JSON.parse(localStorage.getItem('lm-quote-v2')||localStorage.getItem('lm-quote-v1')||'{}'),products);
  $('#notes').value=(localStorage.getItem('lm-notes-v1')||'').slice(0,1600);
  $('#vehicle').value=(localStorage.getItem('lm-vehicle-v2')||'').slice(0,160);
}catch{}
function persist(){
  try{
    localStorage.setItem('lm-quote-v2',JSON.stringify(quote));
    localStorage.setItem('lm-notes-v1',$('#notes').value);
    localStorage.setItem('lm-vehicle-v2',$('#vehicle').value);
  }catch{}
}
function toast(message){
  clearTimeout(toastTimer);
  $('#toast').textContent=message;
  $('#toast').classList.add('show');
  toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);
}
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){
    e.target.classList.add('is-visible');
    observer.unobserve(e.target);
  }
}),{threshold:.08}):null;
function reveal(root=document){
  root.querySelectorAll('[data-reveal]').forEach(el=>{
    if(!motion.matches&&observer){
      el.classList.add('will-reveal');
      observer.observe(el);
    }else{
      el.classList.add('is-visible');
    }
  });
}
motion.addEventListener('change',()=>{
  if(motion.matches)$$('.will-reveal').forEach(el=>el.classList.add('is-visible'));
});
function photoMarkup(p,cls='',loading='lazy'){
  return `<img class="${cls}" src="${p.images[0]}" srcset="${p.images[0].replace(".webp","-480.webp")} 480w, ${p.images[0]} 1000w" sizes="(max-width: 650px) 45vw, (max-width: 1000px) 45vw, 30vw" alt="${escapeHtml(p.name)} — fotografia fornecida no projeto" width="1000" height="760" loading="${loading}" decoding="async">`;
}
function renderProducts(){
  const list=filterProducts(products,selected,query);
  $('#result-count').textContent=`${list.length} ${list.length===1?'equipamento listado':'equipamentos listados'}`;
  $('#empty').hidden=!!list.length;
  $('#product-grid').innerHTML=list.map((p,i)=>{
    const inQuote=quote[p.id]?.quantity>0;
    const idx=String(products.indexOf(p)+1).padStart(2,'0');
    return `<article class="product ${inQuote?'in-quote':''}" data-reveal style="--reveal-delay:${Math.min(i%3,2)*55}ms">
      <button class="product-image" data-detail="${p.id}" aria-label="Explorar ${escapeHtml(p.name)}">
        ${photoMarkup(p)}
        <span class="tag">${p.category.toUpperCase()}</span>
        ${inQuote?`<span class="selected-badge" aria-label="Selecionado no orçamento">✓ No projeto (${quote[p.id].quantity})</span>`:''}
        <span class="view-icon" aria-hidden="true">↗</span>
      </button>
      <div class="product-body">
        <div class="product-header-meta">
          <span class="product-brand">${p.brand}</span>
          <span class="product-index">#${idx}</span>
        </div>
        <h3>${p.name}</h3>
        <p class="product-desc">${p.description} · <span class="product-model-ref">${escapeHtml(p.model)}</span></p>
        <ul class="feature-pills">${p.features.slice(0,3).map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <div class="product-actions">
          <div class="product-actions-row">
            <span class="price-status">${p.price===null?'Valor sob consulta':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(p.price)}</span>
            <button class="explore-link" data-detail="${p.id}">Ficha técnica ↗</button>
          </div>
          <button class="add-product ${inQuote?'is-added':''}" data-request="${p.id}">
            <span>${inQuote?`No orçamento (${quote[p.id].quantity})`:'Solicitar orçamento'}</span>
            <span aria-hidden="true">${inQuote?'✓':'+'}</span>
          </button>
        </div>
      </div>
    </article>`;
  }).join('');
  reveal($('#product-grid'));
}
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
  selected=b.dataset.filter;
  $$('[data-filter]').forEach(c=>{
    c.classList.toggle('active',c===b);
    c.setAttribute('aria-pressed',String(c===b));
  });
  renderProducts();
}));
$('#search').addEventListener('input',e=>{query=e.target.value;renderProducts()});
$('#reset-search').addEventListener('click',()=>{
  $('#search').value='';
  query='';
  $('[data-filter="Todos"]').click();
  $('#search').focus();
});
function openDialog(dialog){
  if(!dialog.open)dialog.showModal();
  document.body.classList.add('modal-open');
}
$$('dialog').forEach(d=>{
  d.addEventListener('close',()=>{if(!$('dialog[open]'))document.body.classList.remove('modal-open')});
  d.querySelector('[data-close]').addEventListener('click',()=>d.close());
  d.addEventListener('click',e=>{
    if(e.target===d){
      const r=d.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();
    }
  });
});
function openProduct(id){
  const p=products.find(p=>p.id===id);
  if(!p)return;
  const dialog=$('#product-dialog');
  const inQuote=quote[p.id]?.quantity>0;
  $('#product-detail').innerHTML=`
    <div class="detail-topline">
      <span>${p.category.toUpperCase()} · ${escapeHtml(p.model)}</span>
      <span>ENGENHARIA DO SEU SOM / ${String(products.indexOf(p)+1).padStart(2,'0')}</span>
    </div>
    <div class="detail-hero">
      <div class="detail-visual">
        ${photoMarkup(p,'','eager')}
        <span>Fotografia do catálogo fornecido</span>
      </div>
      <div class="detail-intro">
        <span class="product-brand">${p.brand}</span>
        <h2 class="line-reveal"><span>${p.name}</span></h2>
        <p>${p.detail||p.description}</p>
        <ul class="feature-pills">${p.features.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <div class="detail-cta-group">
          <button class="button primary" data-request="${p.id}">
            <span>${inQuote?`Já no orçamento (${quote[p.id].quantity}) · Abrir projeto`:'Solicitar orçamento'}</span>
            <span>↗</span>
          </button>
          <a class="detail-scroll" href="#detail-engineering">Especificações e engenharia ↓</a>
        </div>
      </div>
    </div>
    <div class="detail-body">
      <section id="detail-engineering" class="detail-section" data-reveal>
        <div class="eyebrow blue"><i></i> 01 / O QUE FAZ A DIFERENÇA</div>
        <h3>${p.story.title}</h3>
        <p>${p.story.body}</p>
        <div class="spec-highlights">
          ${Object.entries(p.specifications).slice(0,3).map(([k,v])=>`<div class="spec-card"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}
        </div>
      </section>
      <section class="detail-section application" data-reveal>
        <div class="eyebrow blue"><i></i> 02 / INTEGRAÇÃO NO SEU PROJETO</div>
        <h3>O encaixe certo.<br>O cuidado em cada conexão.</h3>
        <p>${p.story.application}</p>
        <div class="compatibility-note">
          <strong>Nota de conferência técnica</strong>
          <p>${escapeHtml(p.compatibility)}</p>
        </div>
      </section>
      <section class="detail-section" data-reveal>
        <div class="eyebrow blue"><i></i> 03 / FICHA TÉCNICA VERIFICADA</div>
        <h3>Conheça antes de escolher.</h3>
        <dl class="spec-table">
          <div><dt>Marca no catálogo</dt><dd>${p.brand}</dd></div>
          <div><dt>Modelo / Referência</dt><dd>${escapeHtml(p.model)}</dd></div>
          ${Object.entries(p.specifications).map(([k,v])=>`<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}
          <div><dt>Valor e disponibilidade</dt><dd>Sob consulta com a L&amp;M</dd></div>
          <div><dt>Instalação técnica</dt><dd>Solicite avaliação para seu veículo</dd></div>
        </dl>
        <details class="technical-sources">
          <summary>Fontes técnicas e identificação <span>+</span></summary>
          <p>${escapeHtml(p.note)}</p>
          <div class="source-links">
            ${p.sources.map((s,i)=>`<a href="${s}" target="_blank" rel="noopener noreferrer">Referência oficial do fabricante ${i+1} ↗</a>`).join('')}
          </div>
          <p class="source-stamp">Dados auditados em 14/11/2026. Recursos e acessórios dependem da variante confirmada pela loja.</p>
        </details>
      </section>
      <section class="detail-end" data-reveal>
        <div class="eyebrow blue"><i></i> 04 / VAMOS MONTAR SEU PROJETO?</div>
        <h3>Seu próximo upgrade<br>começa aqui.</h3>
        <p>Adicione ao configurador, informe seu veículo e consulte valor, compatibilidade e instalação pelo WhatsApp.</p>
        <div class="detail-end-actions">
          <button class="button primary" data-request="${p.id}">Solicitar orçamento <span>↗</span></button>
          <button class="button outline" data-back-catalog>Voltar ao catálogo ↑</button>
        </div>
      </section>
    </div>
    <div class="detail-progress" aria-hidden="true"><i></i></div>`;
  openDialog(dialog);
  dialog.scrollTop=0;
  reveal(dialog);
  const update=()=>{
    const max=dialog.scrollHeight-dialog.clientHeight;
    $('.detail-progress i').style.transform=`scaleX(${max>0?dialog.scrollTop/max:0})`;
  };
  dialog.onscroll=update;
  update();
}
function updateMessage(){
  const message=buildMessage(products,quote,$('#vehicle').value,$('#notes').value);
  $('#send-quote').href=wa(message);
  $('#message-preview').textContent=message;
}
function updateQuote(){
  const entries=Object.entries(quote);
  const totalCount=entries.reduce((n,[,v])=>n+v.quantity,0);
  $('#quote-count').textContent=totalCount;
  $('#open-quote').classList.toggle('has-items',totalCount>0);
  $('#quote-items').innerHTML=entries.length?entries.map(([id,item])=>{
    const p=products.find(p=>String(p.id)===id);
    return `<article class="quote-item">
      <div class="quote-item-thumb">${photoMarkup(p)}</div>
      <div class="quote-item-info">
        <div class="quote-item-top">
          <div>
            <span class="product-brand">${p.brand} · ${escapeHtml(p.model)}</span>
            <b>${p.name}</b>
          </div>
          <button class="remove-item" data-remove="${id}" aria-label="Remover ${p.name}">Remover ×</button>
        </div>
        <p>${p.features.slice(0,3).join(' · ')}</p>
        <div class="quote-item-controls">
          <div class="quantity" role="group" aria-label="Quantidade de ${p.name}">
            <button type="button" data-quantity="${id}" data-delta="-1" aria-label="Diminuir quantidade de ${p.name}">−</button>
            <output aria-label="Quantidade de ${p.name}">${item.quantity}</output>
            <button type="button" data-quantity="${id}" data-delta="1" aria-label="Aumentar quantidade de ${p.name}" ${item.quantity>=99?'disabled':''}>+</button>
          </div>
          <label class="installation-label">
            <span>Instalação</span>
            <select data-installation="${id}" aria-label="Instalação de ${p.name}">
              ${['a definir','sim','não'].map(v=>`<option value="${v}" ${item.installation===v?'selected':''}>${v==='a definir'?'A definir com a equipe':v==='sim'?'Sim, incluir instalação':'Não, somente produto'}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>
    </article>`;
  }).join(''):`<div class="quote-empty-state">
    <span class="eyebrow blue">CONFIGURADOR CONSULTIVO</span>
    <strong>Nenhum equipamento selecionado ainda.</strong>
    <p class="muted small">Você pode escolher produtos no catálogo ou avançar diretamente para descrever seu carro e receber uma recomendação completa da equipe L&amp;M.</p>
  </div>`;
  updateMessage();
  persist();
  renderProducts();
}
function requestProduct(id){
  const p=products.find(p=>p.id===id);
  if(!p)return;
  if(!quote[id])quote[id]={quantity:1,installation:'a definir'};
  updateQuote();
  toast(`${p.name} adicionado ao projeto`);
  if($('#product-dialog').open)$('#product-dialog').close();
  openDialog($('#quote-dialog'));
  $('#quote-dialog').scrollTop=0;
}
$('#open-quote').addEventListener('click',()=>{updateQuote();openDialog($('#quote-dialog'))});
['notes','vehicle'].forEach(id=>$('#'+id).addEventListener('input',()=>{updateMessage();persist()}));
document.addEventListener('change',e=>{
  const id=e.target.dataset.installation;
  if(id&&quote[id]){
    quote[id].installation=e.target.value;
    updateMessage();
    persist();
  }
});
document.addEventListener('click',e=>{
  const detail=e.target.closest('[data-detail]');
  if(detail)openProduct(+detail.dataset.detail);
  const request=e.target.closest('[data-request]');
  if(request)requestProduct(+request.dataset.request);
  if(e.target.closest('[data-back-catalog]'))$('#product-dialog').close();
  const remove=e.target.closest('[data-remove]');
  if(remove){
    delete quote[remove.dataset.remove];
    updateQuote();
    $('#quote-dialog [data-close]').focus();
  }
  const q=e.target.closest('[data-quantity]');
  if(q){
    const id=q.dataset.quantity;
    const n=quote[id].quantity+Number(q.dataset.delta);
    if(n<=0)delete quote[id];
    else quote[id].quantity=quantity(n);
    updateQuote();
    const focus=$(`[data-quantity="${id}"][data-delta="${q.dataset.delta}"]`);
    (focus||$('#quote-dialog [data-close]')).focus();
  }
  const photo=e.target.closest('[data-photo]');
  if(photo){
    currentPhoto=photos.findIndex(p=>p.id===+photo.dataset.photo);
    renderPhoto();
    openDialog($('#photo-dialog'));
  }
});
$$('.whatsapp').forEach(a=>{
  a.href=wa('Olá, L&M! Vi o site e gostaria de saber mais sobre os produtos e serviços.');
  a.target='_blank';
  a.rel='noopener noreferrer';
});
$$('[data-service]').forEach(a=>{
  a.href=wa(`Olá, L&M! Gostaria de um orçamento para ${a.dataset.service}. Posso passar as informações do meu carro?`);
  a.target='_blank';
  a.rel='noopener noreferrer';
});
$('#gallery').innerHTML=[15,16,17,20,22,21,19,23].map(id=>{
  const p=photos.find(p=>p.id===id);
  return `<button class="gallery-open" data-photo="${id}" aria-label="Ampliar: ${p.label}">
    <img src="${img(id)}" alt="${p.label}" loading="lazy" width="1000" height="760">
    <span class="gallery-caption-overlay">${escapeHtml(p.label)}</span>
  </button>`;
}).join('');
function renderPhoto(){
  const p=photos[currentPhoto];
  $('#large-photo').src=img(p.id);
  $('#large-photo').alt=p.label;
  $('#photo-caption').textContent=`${p.label} · ${currentPhoto+1} / ${photos.length}`;
}
function stepPhoto(n){
  currentPhoto=(currentPhoto+n+photos.length)%photos.length;
  renderPhoto();
}
$('#photo-prev').addEventListener('click',()=>stepPhoto(-1));
$('#photo-next').addEventListener('click',()=>stepPhoto(1));
$('#photo-dialog').addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'){e.preventDefault();stepPhoto(1)}
  if(e.key==='ArrowLeft'){e.preventDefault();stepPhoto(-1)}
});
$('.menu-toggle').addEventListener('click',()=>{
  const open=$('#nav').classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded',String(open));
  $('.menu-toggle').setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
});
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{
  $('#nav').classList.remove('open');
  $('.menu-toggle').setAttribute('aria-expanded','false');
}));

// Premium: two reusable scenes, one WebGL context, one scroll scheduler.
// Keep in sync with the media query at the end of cinematic.css.
const mobileShowroom=matchMedia('(max-width: 1023px), (hover: none) and (pointer: coarse)');
let showroom=null,sceneGeneration=0,sceneLoading=false,sceneFailed=false,manualScene=false;
const sceneInfo={
  passat:{
    title:'SEU CARRO. OUTRA EXPERIÊNCIA.',
    label:'Passat 2022',
    caption:'Cena ilustrativa · Passat NMS 2022 · sistema de som genérico, sem vínculo com uma instalação real da L&M.',
    chapters:['Revelação','Movimento','Desaceleração','Porta-malas','Sistema de som','Encerramento']
  },
  lsr308:{
    title:'POR DENTRO DO SOM.',
    label:'Engenharia do áudio',
    caption:'Monitor de estúdio baseado no JBL LSR308 · interior reconstruído para demonstração, sem reproduzir o projeto interno do fabricante. Não é um produto automotivo do catálogo.',
    chapters:['Introdução','Abertura frontal','Extração do woofer','Motor do woofer','Vista traseira','Conjunto traseiro','Eletrônica','Tweeter','Vista explodida']
  }
};

const cinematicStories={
  passat:[
    ['SEU CARRO. SEU ESTILO. SEU SOM.','Do primeiro detalhe ao projeto completo. Descubra outra experiência ao volante.'],
    ['PROJETO QUE ACOMPANHA VOCÊ.','A cena ganha movimento. A trilha é sua. O cuidado com cada detalhe é da L&M.'],
    ['CADA DETALHE CONTA.','Acabamento, integração e cuidado. Um projeto pensado para o seu carro.'],
    ['ABRA ESPAÇO PARA O SOM.','O porta-malas revela uma composição ilustrativa de um sistema de áudio.'],
    ['OS GRAVES ENTRAM EM CENA.','Caixa, amplificador e conexões trabalham em conjunto. Os equipamentos desta cena são genéricos e ilustrativos.'],
    ['IMAGINE O SEU PRÓXIMO PROJETO.','Explore os produtos e monte um orçamento com a equipe da L&M.']
  ],
  lsr308:[
    ['O SOM, POR DENTRO.','Uma demonstração de engenharia baseada em um monitor de estúdio. Interior ilustrativo.'],
    ['CADA PEÇA TEM UMA FUNÇÃO.','A abertura revela como os conjuntos podem se organizar em um equipamento de áudio.'],
    ['O MOVIMENTO VIRA SOM.','O conjunto do woofer converte o sinal elétrico em movimento e variações de pressão no ar.'],
    ['A ENERGIA POR TRÁS DO GRAVE.','Bobina, campo magnético e cone trabalham em conjunto para movimentar o ar.'],
    ['OUTRO PONTO DE VISTA.','As conexões e a eletrônica completam a experiência de um monitor ativo.'],
    ['O PROJETO ALÉM DA SUPERFÍCIE.','Gabinete, duto e amplificação fazem parte da construção do sistema.'],
    ['CONTROLE. POTÊNCIA. DETALHE.','A placa e o dissipador desta cena representam uma reconstrução ilustrativa, sem reproduzir o projeto do fabricante.'],
    ['AGUDOS, EM OUTRA ESCALA.','O tweeter participa da reprodução de altas frequências.'],
    ['ENTENDA. ESCOLHA. SINTA.','Agora conheça os equipamentos automotivos do catálogo e encontre o seu próximo upgrade.']
  ]
};
let activeScene='passat',scenePool=null,poolPromise=null,preloadStarted=false,pendingProgress=0,poolEpoch=0;
const sceneProgress={passat:0,lsr308:0};
const posterSource=name=>name==='lsr308'?`assets/3d/lsr308/transition-${innerWidth<innerHeight?'portrait':'landscape'}.webp`:`assets/3d/${name}/poster.webp`;
const bridge=document.createElement('img');bridge.id='scene-bridge';bridge.alt='';bridge.setAttribute('aria-hidden','true');
if(!mobileShowroom.matches)bridge.src=posterSource('lsr308');bridge.width=1920;bridge.height=1080;
$('#scene-canvas').after(bridge);
const endCover=document.createElement('img');endCover.id='scene-end-cover';
endCover.alt='';endCover.setAttribute('aria-hidden','true');if(!mobileShowroom.matches)endCover.src=posterSource('passat');
endCover.width=1920;endCover.height=1080;bridge.after(endCover);
function cinematicFrame(total){
  const p=Math.max(0,Math.min(1,total));
  const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
  if(p<.6)return {scene:'passat',progress:p/.6,cover:0,copy:1,returning:false};
  if(p<.94)return {scene:'lsr308',progress:(p-.6)/.34,cover:0,copy:1,returning:false};
  if(p<.98){const fade=smooth((p-.94)/.04);return {scene:'lsr308',progress:1,cover:fade,copy:1-fade,returning:true}}
  const fade=smooth((p-.98)/.02);
  return {scene:'passat',progress:0,cover:1-fade,copy:fade,returning:true};
}
function getScenePool(){
  if(mobileShowroom.matches)return Promise.reject(Error('Showroom is desktop only'));
  if(!poolPromise){const epoch=poolEpoch;poolPromise=import('./scene-pool.js').then(({createScenePool})=>{
    if(epoch!==poolEpoch||mobileShowroom.matches)throw Error('Preparation cancelled');
    return scenePool=createScenePool($('#scene-canvas'));
  })}
  return poolPromise;
}
function stageState(state){$('#showroom').dataset.sceneState=state;$('#showroom').dataset.activeScene=activeScene}
async function setPoster(url){
  const image=new Image();image.src=url;
  try{await image.decode()}catch{return false}
  return image;
}
async function preloadSound(){
  if(preloadStarted||motion.matches||mobileShowroom.matches)return;preloadStarted=true;
  try{
    const pool=await getScenePool(),entry=await pool.preload('lsr308');
    if(entry?.url&&await setPoster(entry.url)){
      bridge.src=entry.url;
      if(activeScene==='lsr308'&&!showroom)$('#scene-poster').src=entry.url;
    }
  }catch{preloadStarted=false} // Retry on demand; the current scene stays visible.
}
function selectScene(name){
  activeScene=name;
  sceneGeneration++;
  showroom?.setOrbit(false);showroom?.highlight('');showroom?.deactivate();
  showroom=null;
  stageState('waiting');
  $('#scene-load').hidden=true;
  $('#scene-load').disabled=false;
  $('#scene-load').textContent='Tentar novamente';
  sceneLoading=false;
  sceneFailed=false;
  $('#scene-poster').hidden=scenePool?.get(name)?.state==='ready';
  if(!mobileShowroom.matches)$('#scene-poster').src=scenePool?.get(name)?.url||posterSource(name);
  bridge.style.opacity=0;
  pendingProgress=sceneProgress[name];
  $('#scene-caption').textContent=sceneInfo[name].caption;
  $('#scene-title').textContent=sceneInfo[name].title;
  $('#scene-status').textContent=motion.matches?'Movimento reduzido · apresentação estática':'Preparando a próxima cena…';
  $('#scene-progress').value=0;
  $('#scene-controls').hidden=true;
  $('#scene-mode').checked=false;
  $('#scene-component-description').textContent='';
  $('#scene-explanation').textContent=name==='passat'?'Movimento, iluminação e detalhes de uma cena automotiva ilustrativa.':'Uma sequência de desmontagem para entender a função dos componentes do áudio.';
  $('#scene-poster').alt=name==='passat'?'Render ilustrativo do Passat 2022':'Render de um monitor de estúdio com identidade L&M';
  $('#scene-chapter').textContent='01 / '+sceneInfo[name].chapters[0];
  $$('[data-scene]').forEach(b=>{
    b.setAttribute('aria-pressed',String(b.dataset.scene===name));
    b.classList.toggle('active',b.dataset.scene===name);
  });
}
$$('[data-scene]').forEach(b=>b.addEventListener('click',()=>{
  if(mobileShowroom.matches)return;
  manualScene=true;
  selectScene(b.dataset.scene);
  if(!motion.matches)loadScene();
  $('#showroom-track').scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
}));
async function loadScene(){
  if(sceneLoading||showroom||sceneFailed||motion.matches||mobileShowroom.matches)return;
  sceneLoading=true;const generation=++sceneGeneration,name=activeScene;
  $('#scene-load').disabled=true;
  try{
    const pool=await getScenePool();
    if(generation!==sceneGeneration)return;
    const entry=await pool.prepare(name);
    if(generation!==sceneGeneration||motion.matches||mobileShowroom.matches)return;
    showroom=entry.instance;showroom.activate();sceneLoading=false;
    if(name==='passat'&&entry.url){
      const epoch=poolEpoch;
      setPoster(entry.url).then(image=>{if(image&&epoch===poolEpoch)endCover.src=entry.url});
    }
    $('#scene-load').hidden=true;$('#scene-controls').hidden=false;$('#scene-status').textContent='';
    $('#scene-component').innerHTML='<option value="">Todos os componentes</option>'+showroom.components.map(c=>`<option value="${escapeHtml(c.name)}">${escapeHtml(c.label)}</option>`).join('');
    applyProgress(pendingProgress);
    // A real rendered frame, not a timer, gates removal of the photographic cover.
    requestAnimationFrame(()=>{
      if(generation!==sceneGeneration)return;
      stageState('ready');$('#scene-poster').hidden=true;updateCinematicScroll();
    });
  }catch(error){
    if(generation!==sceneGeneration)return;
    sceneLoading=false;sceneFailed=true;stageState('fallback');
    $('#scene-load').hidden=false;$('#scene-load').disabled=false;
    $('#scene-load').textContent='Tentar 3D novamente';
    $('#scene-status').textContent='Apresentação fotográfica · você pode continuar explorando';
    console.warn('Showroom: cena preservada em fotografia',error);
  }
}
$('#scene-load').addEventListener('click',()=>{sceneFailed=false;scenePool?.retry(activeScene);loadScene()});
function applyStoryStep(index){
  const chapters=sceneInfo[activeScene].chapters;
  const clamped=Math.max(0,Math.min(chapters.length-1,index));
  $('#scene-chapter').textContent=String(clamped+1).padStart(2,'0')+' / '+(chapters[clamped]||'Explorar');
  const story=cinematicStories[activeScene][clamped];
  if(story&&$('#scene-title').textContent!==story[0]){
    $('#scene-title').textContent=story[0];
    $('#scene-explanation').textContent=story[1];
    if(!motion.matches){
      $('#scene-title').animate([
        {opacity:0,transform:'translateY(18px)'},
        {opacity:1,transform:'translateY(0)'}
      ],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});
    }
  }
}
function applyProgress(p){
  const clamped=Math.max(0,Math.min(1,p));
  pendingProgress=clamped;sceneProgress[activeScene]=clamped;
  if(!showroom){
    const chapters=sceneInfo[activeScene].chapters;
    applyStoryStep(Math.floor(clamped*(chapters.length-0.01)));
    return;
  }
  showroom.setProgress(clamped);
  $('#scene-progress').value=Math.round(clamped*1000);
  $('#scene-percent').textContent=Math.round(clamped*100)+'%';
  const index=showroom.sectionIndex(clamped);
  applyStoryStep(index);
  if(!cinematicStories[activeScene][index])$('#scene-explanation').textContent=showroom.sectionDescription(clamped);
}
$('#scene-progress').addEventListener('input',e=>applyProgress(e.target.value/1000));
$('#scene-mode').addEventListener('change',e=>showroom?.setOrbit(e.target.checked));
$('#scene-component').addEventListener('change',e=>{
  const text=showroom?.highlight(e.target.value);
  $('#scene-component-description').textContent=text||'';
});
$('#scene-reset').addEventListener('click',()=>{
  $('#scene-mode').checked=false;
  showroom?.setOrbit(false);
  $('#scene-component').value='';
  showroom?.highlight('');
  applyProgress(0);
});
let scrollFrame=0;
function updateCinematicScroll(){
  if(motion.matches||mobileShowroom.matches)return;
  const r=$('#showroom-track').getBoundingClientRect(),travel=r.height-innerHeight;
  if(r.top>innerHeight*1.5||(r.bottom<0&&!scenePool))return;
  const total=travel>0?Math.min(1,Math.max(0,-r.top/travel)):0;
  const frame=cinematicFrame(total);
  // Once parked at the opening frame, scrolling through the catalogue needs no draw.
  if(r.bottom<0&&!manualScene&&activeScene==='passat'&&pendingProgress===0&&showroom&&$('#showroom').dataset.sceneState==='ready'&&$('#showroom').dataset.sequenceEnd==='complete')return;
  const desired=frame.scene;
  if(!manualScene&&desired!==activeScene)selectScene(desired);
  if(!showroom&&!sceneLoading)loadScene();
  if(activeScene==='passat'&&showroom&&total<.94&&total>=(scenePool?.preloadAt??.12))preloadSound();
  const preview=!manualScene&&!frame.returning&&activeScene==='passat'?Math.max(0,Math.min(1,(total-.55)/.05)):0;
  bridge.style.opacity=preview;
  bridge.style.transform=`translateY(${-18*(1-preview)}px) scale(${1.012-.012*preview})`;
  // Keep the cover until the cached car has produced its frame, including fast jumps.
  endCover.style.opacity=manualScene?0:(frame.returning&&activeScene==='passat'&&!showroom?1:frame.cover);
  const copyOpacity=manualScene?1:frame.copy;
  for(const id of ['scene-copy-progress','scene-caption','scene-controls'])$('#'+id).style.opacity=copyOpacity;
  $('#showroom').dataset.sequenceEnd=!manualScene&&total>=1?'complete':(!manualScene&&frame.returning?'returning':'story');
  const local=manualScene?sceneProgress[activeScene]:frame.progress;
  if(showroom&&$('#scene-scroll').checked){
    applyProgress(Math.max(0,local));
  }else if(!showroom){
    applyProgress(Math.max(0,local));
  }
  $('#scene-copy-progress').style.setProperty('--scene-progress',total);
}
window.addEventListener('scroll',()=>{
  if(scrollFrame||mobileShowroom.matches||motion.matches)return;
  scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateCinematicScroll()});
},{passive:true});
const sceneObserver=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting))updateCinematicScroll();
},{rootMargin:'600px'});
if(!mobileShowroom.matches)sceneObserver.observe($('#showroom-track'));
function releaseScenes(){
  sceneGeneration++;poolEpoch++;showroom=null;sceneLoading=false;sceneFailed=false;preloadStarted=false;
  scenePool?.dispose();scenePool=null;poolPromise=null;
  $('#scene-poster').hidden=false;if(!mobileShowroom.matches)$('#scene-poster').src=posterSource(activeScene);
  if(!mobileShowroom.matches){bridge.src=posterSource('lsr308');endCover.src=posterSource('passat')}
  bridge.style.opacity=0;endCover.style.opacity=0;
  for(const id of ['scene-copy-progress','scene-caption','scene-controls'])$('#'+id).style.opacity=1;
  $('#scene-controls').hidden=true;stageState('static');
}
mobileShowroom.addEventListener('change',()=>{
  sceneObserver.disconnect();
  if(scrollFrame){cancelAnimationFrame(scrollFrame);scrollFrame=0}
  if(mobileShowroom.matches){releaseScenes();return}
  bridge.src=posterSource('lsr308');endCover.src=posterSource('passat');
  $('#scene-poster').src=posterSource(activeScene);
  sceneObserver.observe($('#showroom-track'));updateCinematicScroll();
});
motion.addEventListener('change',()=>{
  if(motion.matches){releaseScenes();$('#scene-status').textContent='Movimento reduzido · apresentação estática'}
  else updateCinematicScroll();
});
$('#scene-canvas').addEventListener('showroom-context-lost',()=>{
  releaseScenes();sceneFailed=true;$('#scene-load').hidden=false;$('#scene-load').disabled=false;
  $('#scene-status').textContent='Apresentação fotográfica · tente o 3D novamente';
});
window.addEventListener('pagehide',releaseScenes);
window.addEventListener('pageshow',event=>{if(event.persisted)updateCinematicScroll()});
selectScene('passat');
renderProducts();
updateQuote();
reveal();
updateCinematicScroll();
