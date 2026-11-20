'use strict';
const brandContent={
  JBL:{
    title:'Encontre o seu jeito de ouvir.',
    intro:'Conheça os alto-falantes e o subwoofer JBL presentes neste catálogo. Cada tipo resolve uma parte diferente do projeto: reprodução do som nas portas, separação das vias ou reforço de graves.'
  },
  PIONEER:{
    title:'Conectividade no centro do painel.',
    intro:'No catálogo atual, a Pioneer aparece com o rádio MVH-S235BT. Ele reúne fontes de áudio e ajustes do sistema; não é uma central com tela. Consulte as conexões e a revisão do equipamento.'
  },
  TARAMPS:{
    title:'Entenda de onde vem a potência.',
    intro:'O amplificador aumenta a potência do sinal enviado aos alto-falantes. O DS 800X4 fotografado é a versão de 2 Ω. A escolha precisa considerar os equipamentos que ele vai alimentar.'
  },
  BRAVOX:{
    title:'Escolha pelo projeto, não só pelo tamanho.',
    intro:'Os alto-falantes Bravox deste catálogo têm formatos e aplicações diferentes. Diâmetro, profundidade e furação precisam ser avaliados no veículo; a potência sozinha não determina a escolha.'
  },
  '2MIX':{
    title:'A tela certa para sua rotina.',
    intro:'Explore as centrais 2Mix disponíveis no catálogo. As telas de 7 e 9 polegadas exigem avaliação do painel e da moldura. As Detroit e a GP-MP5 são linhas diferentes; não presuma os mesmos recursos em todas.'
  },
  STETSOM:{
    title:'Vamos avaliar seu projeto.',
    intro:'A marca já fazia parte da apresentação da loja, mas não há um produto Stetsom identificado no catálogo atual. Consulte a equipe sobre os modelos e a disponibilidade.'
  },
  KX3:{
    title:'Mais informação durante a manobra.',
    intro:'O catálogo mostra um sensor KX3 com display e aviso sonoro. O kit exato precisa ser confirmado; sensores auxiliam a manobra e não substituem a atenção do condutor.'
  },
  'Marca a confirmar':{
    title:'A identificação vem antes da escolha.',
    intro:'Estes itens estão no catálogo recebido, mas a marca ou o modelo ainda precisam ser confirmados pela etiqueta. A equipe pode ajudar a identificar o equipamento correto.'
  }
};
const equipmentEducation={
  speakers:{
    title:'Alto-falante e kit componente: qual a diferença?',
    body:'O alto-falante transforma um sinal elétrico em som. Em um coaxial ou triaxial, as vias ficam na mesma estrutura. Um kit componente separa woofer e tweeter; o crossover distribui as faixas de frequência. A escolha depende dos locais disponíveis e do resultado desejado.',
    check:'Conferir diâmetro, profundidade, furação, impedância e os pontos de instalação. Um kit componente pode precisar de locais separados para os tweeters.'
  },
  subwoofer:{
    title:'Graves sem confundir as funções.',
    body:'O subwoofer é dedicado às frequências graves e complementa os alto-falantes convencionais. O SW68A-S é um subwoofer slim amplificado: não equivale a um alto-falante para substituir diretamente o da porta.',
    check:'Avaliar medidas reais do espaço, fixação, alimentação e conexões. Não confundir SW68A-S com SW68A-MS.'
  },
  amplifier:{
    title:'O que o amplificador faz?',
    body:'Ele recebe o sinal de áudio e fornece potência para movimentar os alto-falantes. Para funcionar corretamente, precisa de alimentação adequada e de cargas compatíveis em cada canal.',
    check:'Informar modelo e impedância dos alto-falantes, sistema já instalado e revisão do módulo. A equipe dimensionará alimentação, proteção, ventilação e filtros.'
  },
  multimedia:{
    title:'Uma central reúne áudio e interface.',
    body:'A tela concentra a interface do equipamento no painel. Sistema operacional, conexões e integração ao celular variam conforme a linha e a versão; querer um recurso não significa que todos os modelos o ofereçam.',
    check:'Conferir marca, modelo, ano e versão do veículo, moldura, chicotes, comandos do volante, câmeras e recursos desejados.'
  },
  radio:{
    title:'Áudio e conectividade sem tela multimídia.',
    body:'O rádio seleciona fontes de áudio e permite ajustar o sinal reproduzido pelo sistema. O MVH-S235BT do catálogo tem Bluetooth, USB e equalizador de cinco bandas, conforme a referência técnica registrada.',
    check:'Confirmar encaixe no painel, alimentação, chicote e necessidade de interface para os comandos do volante.'
  },
  tweeter:{
    title:'Um complemento para os agudos.',
    body:'O tweeter é dedicado às altas frequências. Precisa trabalhar com a divisão de frequências e com os demais equipamentos do sistema.',
    check:'Modelo e marca ainda precisam de confirmação. Não ligar um tweeter sem conferir o filtro e os requisitos de instalação.'
  },
  parking:{
    title:'Entenda o aviso de proximidade.',
    body:'O sensor auxilia o condutor ao indicar obstáculos durante a manobra. O produto fotografado possui display e indicação sonora, mas há diferentes kits da marca.',
    check:'Confirmar a versão do kit, os pontos de instalação e a integração elétrica do veículo. Alcance e número de sensores não foram presumidos.'
  }
};
let currentBrand=null,compareIds=new Set();
function brandProducts(brand){return products.filter(p=>p.brand===brand)}
function openBrand(brand){
  currentBrand=brand;
  compareIds.clear();
  const panel=$('#brand-panel'),list=brandProducts(brand),copy=brandContent[brand];
  $$('.brand-strip [data-brand]').forEach(b=>{
    b.classList.toggle('selected',b.dataset.brand===brand);
    b.setAttribute('aria-expanded',String(b.dataset.brand===brand));
  });
  panel.hidden=false;
  panel.innerHTML=`
    <div class="brand-panel-inner">
      <div class="brand-panel-top">
        <div>
          <span class="eyebrow blue"><i></i> GUIA DE MARCAS / ${escapeHtml(brand==='Marca a confirmar'?'OUTRAS MARCAS':brand)} · ${list.length} ${list.length===1?'EQUIPAMENTO':'EQUIPAMENTOS'}</span>
          <h2 id="brand-heading">${copy.title}</h2>
        </div>
        <button id="brand-close" class="brand-close-btn" aria-label="Fechar guia de marcas">Fechar <span>×</span></button>
      </div>
      <p class="brand-intro">${copy.intro}</p>
      ${list.length?`
        <div class="brand-category-tabs" role="group" aria-label="Tipos de equipamentos da marca">
          ${[...new Set(list.map(LMConsultant.group))].map((g,i)=>`<button data-brand-category="${g}" aria-pressed="${i===0}">${LMConsultant.groupNames[g]}</button>`).join('')}
        </div>
        <div id="brand-category-content"></div>
      `:`
        <div class="compatibility-note brand-empty-card">
          <strong>Consultoria direta para esta marca</strong>
          <p>Nenhum modelo desta marca está listado individualmente no catálogo atual. Nossa equipe verifica disponibilidade e alternativas equivalentes para o seu projeto.</p>
          <button class="button primary" id="brand-help">Quero ajuda para escolher <span>↗</span></button>
        </div>
      `}
    </div>`;
  $('#brand-close').addEventListener('click',closeBrand);
  $('#brand-help')?.addEventListener('click',()=>{$('#open-quote').click()});
  panel.querySelectorAll('[data-brand-category]').forEach(b=>b.addEventListener('click',()=>renderBrandCategory(b.dataset.brandCategory)));
  if(list.length)renderBrandCategory(LMConsultant.group(list[0]));
  reveal(panel);
  if(!motion.matches){
    panel.animate([
      {opacity:0,transform:'translateY(14px)'},
      {opacity:1,transform:'translateY(0)'}
    ],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  panel.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
}
function closeBrand(){
  const previous=currentBrand;
  $('#brand-panel').hidden=true;
  $$('.brand-strip [data-brand]').forEach(b=>{
    b.classList.remove('selected');
    b.setAttribute('aria-expanded','false');
  });
  $(`.brand-strip [data-brand="${previous}"]`)?.focus();
}
function renderBrandCategory(group){
  compareIds.clear();
  const list=brandProducts(currentBrand).filter(p=>LMConsultant.group(p)===group),edu=equipmentEducation[group];
  $$('#brand-panel [data-brand-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.brandCategory===group)));
  $('#brand-category-content').innerHTML=`
    <div class="brand-education">
      <div class="brand-edu-main">
        <span class="eyebrow blue">ARQUITETURA ACÚSTICA</span>
        <h3>${edu.title}</h3>
        <p>${edu.body}</p>
      </div>
      <aside class="brand-edu-aside">
        <span class="eyebrow blue"><i></i> ANTES DE INSTALAR</span>
        <p>${edu.check}</p>
      </aside>
    </div>
    <div class="brand-product-list">
      ${list.map(p=>`<article class="brand-product">
        <div class="brand-product-media" data-detail="${p.id}" role="button" tabindex="0" aria-label="Ver ficha de ${escapeHtml(p.name)}">
          ${photoMarkup(p)}
        </div>
        <div class="brand-product-body">
          <div class="brand-product-meta">
            <span class="product-brand">${p.brand}</span>
            <span class="brand-model-badge">${escapeHtml(p.model)}</span>
          </div>
          <h3>${p.name}</h3>
          <ul class="feature-pills">${p.features.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>
          <p class="small muted brand-compat-text">${p.compatibility}</p>
          <div class="brand-product-actions">
            <button class="brand-action-btn" data-detail="${p.id}">Ver detalhes ↗</button>
            <button class="brand-action-btn primary-action" data-request="${p.id}">Solicitar orçamento +</button>
          </div>
          ${list.length>=2?`<label class="compare-choice"><input type="checkbox" data-compare-id="${p.id}"> <span>Selecionar para comparar (${escapeHtml(p.model)})</span></label>`:''}
        </div>
      </article>`).join('')}
    </div>
    ${list.length>=2?`
      <div class="compare-toolbar">
        <div class="compare-toolbar-info">
          <span class="eyebrow blue">COMPARADOR TÉCNICO</span>
          <p id="compare-status" role="status">Selecione dois ou mais produtos desta categoria para comparar lado a lado.</p>
        </div>
        <button id="compare-now" class="button primary" disabled>Comparar produtos <span>↗</span></button>
      </div>
      <div id="comparison-output"></div>
    `:`<p class="small muted single-cat-note">Há um único equipamento desta categoria no catálogo da marca. Abra a ficha técnica ou solicite ajuda da equipe para comparar com outras linhas.</p>`}`;
  $$('#brand-panel [data-compare-id]').forEach(c=>c.addEventListener('change',()=>{
    const id=+c.dataset.compareId;
    c.checked?compareIds.add(id):compareIds.delete(id);
    c.closest('.brand-product')?.classList.toggle('is-comparing',c.checked);
    $('#compare-now').disabled=compareIds.size<2;
    $('#compare-status').textContent=compareIds.size?`${compareIds.size} selecionado(s). Compare equipamentos da mesma categoria.`:'Selecione dois ou mais produtos desta categoria para comparar lado a lado.';
    $('#comparison-output').replaceChildren();
  }));
  $('#compare-now')?.addEventListener('click',renderComparison);
}
function renderComparison(){
  const list=products.filter(p=>compareIds.has(p.id));
  if(!LMConsultant.canCompare(list))return;
  const group=LMConsultant.group(list[0]);
  const rows=[
    ['Categoria',p=>LMConsultant.groupNames[LMConsultant.group(p)]],
    ['Modelo',p=>p.model],
    ['Finalidade',p=>p.description],
    ['Características',p=>p.features.join(' · ')],
    ['Ficha técnica disponível',p=>Object.entries(p.specifications).map(([k,v])=>`${k}: ${v}`).join('; ')],
    ['O que diferencia a escolha',p=>p.id===10?'Kit com componentes separados e crossover externo.':group==='speakers'?'Conferir formato, vias e impedância indicados na ficha.':group==='multimedia'?`Tela e linha: ${p.model}. Recursos adicionais dependem da revisão confirmada.`:p.description],
    ['Limitações e conferência',p=>p.compatibility]
  ];
  $('#comparison-output').innerHTML=`
    <div class="comparison-block">
      <div class="comparison-header">
        <div>
          <span class="eyebrow blue"><i></i> ANÁLISE COMPARATIVA</span>
          <h3 class="compare-title">Compare com clareza.</h3>
        </div>
        <p class="small muted">Dados verificados do catálogo e das referências técnicas. Informações não confirmadas permanecem identificadas; valores e compatibilidade dependem da avaliação da loja.</p>
      </div>
      <div class="comparison-scroll" tabindex="0" role="region" aria-label="Tabela de comparação, role horizontalmente se necessário">
        <table>
          <caption>Comparação técnica · ${LMConsultant.groupNames[group]}</caption>
          <thead>
            <tr>
              <th scope="col">Critério técnico</th>
              ${list.map(p=>`<th scope="col">
                <div class="comp-th-card">
                  <div class="comp-th-img">${photoMarkup(p)}</div>
                  <div>
                    <span class="product-brand">${p.brand}</span>
                    <strong>${escapeHtml(p.name)}</strong>
                  </div>
                </div>
              </th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(([label,fn])=>`<tr><th scope="row">${label}</th>${list.map(p=>`<td>${escapeHtml(fn(p))}</td>`).join('')}</tr>`).join('')}
            <tr class="comp-action-row">
              <th scope="row">Próximo passo</th>
              ${list.map(p=>`<td><button class="add-product" data-request="${p.id}"><span>Solicitar orçamento</span><span>+</span></button></td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  $('#comparison-output').scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
}
const brandStrip=$('.brand-strip');
brandStrip.innerHTML='<span>TECNOLOGIA E SOM<br><b>ESCOLHA PARA ENTENDER.</b></span>'+Object.keys(brandContent).map(b=>`<button data-brand="${b}" class="${b==='PIONEER'?'pioneer':''}" aria-controls="brand-panel" aria-expanded="false">${b==='Marca a confirmar'?'Outras marcas':b==='2MIX'?'2Mix':b==='PIONEER'?'Pioneer':b}</button>`).join('');
brandStrip.querySelectorAll('[data-brand]').forEach(b=>b.addEventListener('click',()=>currentBrand===b.dataset.brand&&!$('#brand-panel').hidden?closeBrand():openBrand(b.dataset.brand)));
