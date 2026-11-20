import {createRuntime,createShowroom,yieldPreparation} from './showroom.js';

export function scenePolicy(nav=navigator){
  const constrained=!!nav.connection?.saveData || (nav.deviceMemory||8)<=4 || (nav.hardwareConcurrency||8)<=4;
  return {constrained,preloadAt:constrained ? .35 : .12};
}
// Bounded to the two existing experiences; promises deduplicate in-flight work.
export function createScenePool(host){
  const runtime=createRuntime(host),entries=new Map();let disposed=false,tail=Promise.resolve();
  const {constrained,preloadAt}=scenePolicy();
  function prepare(name){
    if(disposed)return Promise.reject(Error('Scene pool disposed'));
    if(entries.has(name))return entries.get(name).promise;
    const entry={state:'loading',instance:null,url:null,started:performance.now()};entries.set(name,entry);
    host.dataset[name+'State']='loading';
    entry.promise=tail.then(async()=>{
      if(disposed)throw Error('Scene pool disposed');
      const instance=await createShowroom(host,name,runtime);entry.instance=instance;
      if(disposed){instance.dispose();throw Error('Scene pool disposed')}
      host.dataset[name+'State']='preparing';
      const blob=await instance.prepare();
      if(disposed){instance.dispose();throw Error('Scene pool disposed')}
      if(blob)entry.url=URL.createObjectURL(blob);
      entry.state='ready';host.dataset[name+'State']='ready';
      host.dataset[name+'ReadyMs']=Math.round(performance.now()-entry.started);
      host.dataset.gpuGeometries=runtime.renderer.info.memory.geometries;
      host.dataset.gpuTextures=runtime.renderer.info.memory.textures;
      return entry;
    }).catch(error=>{
      entry.instance?.dispose();entry.state='failed';host.dataset[name+'State']='failed';throw error;
    });
    tail=entry.promise.catch(()=>{});
    return entry.promise;
  }
  return {
    constrained,preloadAt,prepare,
    get:name=>entries.get(name),
    retry(name){const e=entries.get(name);if(e?.state==='failed')entries.delete(name)},
    async preload(name){await yieldPreparation();if(!disposed)return prepare(name)},
    dispose(){if(disposed)return;disposed=true;for(const e of entries.values()){
      e.instance?.dispose();if(e.url)URL.revokeObjectURL(e.url);
    }runtime.dispose();entries.clear()}
  };
}
