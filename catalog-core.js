(function(root){
  'use strict';
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const filterProducts = (products, category, query) => products.filter(p => (category === 'Todos' || p.category === category) && normalize([p.name,p.brand,p.model,p.category,p.description,...p.features].join(' ')).includes(normalize(query.trim())));
  const quantity = value => Math.max(1,Math.min(99,Math.floor(Number(value)||1)));
  function sanitizeQuote(raw, products){
    const clean = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
    for (const [id,value] of Object.entries(raw)) if(products.some(p=>String(p.id)===id)) {
      const n=typeof value==='number'?value:value?.quantity;
      if(Number.isInteger(n)&&n>0) clean[id]={quantity:quantity(n),installation:['sim','não','a definir'].includes(value?.installation)?value.installation:'a definir'};
    }
    return clean;
  }
  function buildMessage(products, quote, vehicle, notes){
    const blocks=Object.entries(quote).flatMap(([id,item])=>{
      const p=products.find(p=>String(p.id)===id); if(!p)return [];
      return [`Produto: ${p.brand} ${p.name}\nModelo: ${p.model||'a confirmar'}\nQuantidade: ${quantity(item.quantity)}\nInstalação: ${item.installation}`];
    });
    return ['Olá! Gostaria de solicitar um orçamento na L&M.',...blocks,vehicle.trim()?`Veículo: ${vehicle.trim()}`:'',notes.trim()?`Observações: ${notes.trim()}`:'','Poderiam informar valor e disponibilidade?'].filter(Boolean).join('\n\n');
  }
  const api={normalize,filterProducts,quantity,sanitizeQuote,buildMessage};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LMCatalogCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
