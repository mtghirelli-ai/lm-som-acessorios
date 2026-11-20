import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// One context and environment for both cached scenes. No second render loop.
export function createRuntime(host){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);
  room.dispose();pmrem.dispose();renderer.setSize(host.clientWidth||1,host.clientHeight||1,false);host.append(renderer.domElement);
  const runtime={renderer,env,active:null,disposed:false,dispose(){
    if(this.disposed)return;this.disposed=true;this.active=null;observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',contextLost);
    env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
  }};
  const observer=new ResizeObserver(()=>runtime.active?.resize());observer.observe(host);
  function contextLost(e){
    if(runtime.disposed)return;e.preventDefault();host.dispatchEvent(new CustomEvent('showroom-context-lost',{bubbles:true}));
  }
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return runtime;
}
export const yieldPreparation=()=>new Promise(resolve=>{
  if('requestIdleCallback' in window)requestIdleCallback(resolve,{timeout:1200});else setTimeout(resolve,32);
});
export async function createShowroom(host,name,runtime){
  const isCar=name==='passat',base=`assets/3d/${name}/`;
  const {renderer,env}=runtime;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x05090f);scene.environment=env.texture;
  const key=new THREE.DirectionalLight(0xe9f3ff,2.6);key.position.set(3,6,4);scene.add(key);
  const fill=new THREE.DirectionalLight(0x399dff,1.4);fill.position.set(-3,3,-3);scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xd8e9ff,0x141820,1));
  if(isCar){const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,140),new THREE.MeshStandardMaterial({color:0x0a1019,roughness:.55,metalness:.25}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.015,-15);scene.add(floor)}
  const draco=new DRACOLoader().setWorkerLimit(1).setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  const loader=new GLTFLoader().setDRACOLoader(draco);let gltf,manifest;
  try{
    [gltf,manifest]=await Promise.all([loader.loadAsync(base+name+'_web.glb'+(isCar?'?v=airbag-fix-1':'')),fetch(base+'manifest_web.json').then(r=>{if(!r.ok)throw Error('manifest');return r.json()})]);
  }catch(error){draco.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});throw error}
  await yieldPreparation();
  if(runtime.disposed){
    gltf.scene.traverse(o=>{o.geometry?.dispose();for(const m of (o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){
      for(const v of Object.values(m))if(v?.isTexture){v.dispose();v.source?.data?.close?.()}m.dispose();
    }});draco.dispose();throw Error('Runtime disposed');
  }
  scene.add(gltf.scene);scene.updateMatrixWorld(true);
  const bakedCamera=gltf.cameras[0]||new THREE.PerspectiveCamera(40,1,.02,200);
  const orbitCamera=new THREE.PerspectiveCamera(40,1,.02,200);
  let orbit=false,disposed=false,lastProgress=0,highlighted=[];
  let currentCamera=bakedCamera;
  const mixer=new THREE.AnimationMixer(gltf.scene);
  const actions=gltf.animations.filter(c=>isCar||['Disassembly','CameraMove'].includes(c.name)).map(clip=>{const a=mixer.clipAction(clip);a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true;a.play();return a});
  const controls=new OrbitControls(orbitCamera,renderer.domElement);controls.enabled=false;controls.enableDamping=false;controls.minDistance=isCar?1:.15;controls.maxDistance=isCar?15:3;controls.enablePan=false;
  controls.addEventListener('change',render);
  function render(){if(!disposed&&runtime.active===api&&host.isConnected){
    renderer.toneMappingExposure=isCar?1.1:1.25;renderer.render(scene,currentCamera);
  }}
  const lensKeys=(isCar?manifest.camera_curve:manifest.camera_keys).map(k=>[k.progress,isCar?k.lens_mm:k.focal_length_mm]);
  function lensAt(p){for(let i=1;i<lensKeys.length;i++)if(p<=lensKeys[i][0]){const [p0,l0]=lensKeys[i-1],[p1,l1]=lensKeys[i];const t=Math.max(0,(p-p0)/(p1-p0));return l0+(l1-l0)*t}return lensKeys.at(-1)?.[1]||50}
  const materialList=new Set();gltf.scene.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materialList.add(m))});
  function setProgress(value,draw=true){
    if(disposed)return;const p=Math.max(0,Math.min(1,value));lastProgress=p;
    const t=Math.min(1/30+p*((isCar?40:30)-1/30),(isCar?40:30)-1e-4);
    actions.forEach(a=>a.time=t);mixer.update(0);scene.updateMatrixWorld(true);
    const portraitFit=Math.min(1,Math.sqrt((host.clientWidth/host.clientHeight)/(16/9)));
    bakedCamera.setFocalLength(lensAt(p)*(bakedCamera.getFilmHeight()/20.25)*portraitFit);
    if(isCar){const v=n=>gltf.scene.getObjectByName('LIGHTCTL_'+n)?.position.x||0;const vehicle=gltf.scene.getObjectByName('VEHICLE');const pos=vehicle?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3();key.position.set(pos.x+3,6,pos.z+4);fill.position.set(pos.x-3,4,pos.z-3);key.intensity=1.2+1.8*Math.max(v('KEY_REVEAL'),v('SIDE_REVEAL'));for(const m of materialList){if(m.name.startsWith('Glow_Red'))m.emissiveIntensity=8*v('TAIL_BRAKE');if(m.name.startsWith('Glow_DRL'))m.emissiveIntensity=6*v('DRL')}}
    if(draw)render();
  }
  function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(runtime.active===api)renderer.setSize(w,h,false);for(const c of [bakedCamera,orbitCamera]){c.aspect=w/h;c.updateProjectionMatrix()}setProgress(lastProgress,runtime.active===api)}
  function setOrbit(enabled){orbit=enabled;currentCamera=enabled?orbitCamera:bakedCamera;controls.enabled=enabled;renderer.domElement.style.touchAction=enabled?'none':'pan-y';if(enabled){scene.updateMatrixWorld(true);bakedCamera.getWorldPosition(orbitCamera.position);bakedCamera.getWorldQuaternion(orbitCamera.quaternion);orbitCamera.fov=bakedCamera.fov;const target=isCar?gltf.scene.getObjectByName('VEHICLE'):gltf.scene.getObjectByName('LSR308_ROOT');const center=target?new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3()):new THREE.Vector3();controls.target.copy(center);controls.update()}resize()}
  const candidates=isCar?[{name:'TRUNK_LID_EXT',label:'Porta-malas',function:'A tampa abre ao longo da sequência. O sistema de som mostrado dentro é genérico e ilustrativo.'},{name:'PLACEHOLDER_SUBWOOFER_BOX',label:'Caixa de som ilustrativa',function:'Representação provisória de uma caixa para graves; não corresponde a um produto à venda.'}]:manifest.components.filter(c=>['WOOFER_CONE','WOOFER_VOICE_COIL','WOOFER_MAGNET','HEATSINK','AMP_PCB','FRONT_BAFFLE','TWEETER_DIAPHRAGM'].includes(c.name));
  const components=candidates.filter(c=>gltf.scene.getObjectByName(c.name));
  function highlight(nodeName){
    highlighted.forEach(([mesh,material])=>{(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>m.dispose());mesh.material=material});highlighted=[];
    const node=nodeName?gltf.scene.getObjectByName(nodeName):null;
    node?.traverse(o=>{if(!o.isMesh)return;const original=o.material;const map=m=>{const c=m.clone();c.emissive=new THREE.Color(0x007bca);c.emissiveIntensity=.8;return c};o.material=Array.isArray(original)?original.map(map):map(original);highlighted.push([o,original])});render();return components.find(c=>c.name===nodeName)?.function||'';
  }
  function sectionIndex(p){const frame=1+p*((isCar?1200:900)-1);let i=manifest.sections.findIndex(s=>frame>=s.frames[0]&&frame<=s.frames[1]);return i<0?manifest.sections.length-1:i}
  function sectionDescription(p){return manifest.sections[sectionIndex(p)]?.description||''}
  function dispose(){if(disposed)return;highlight('');disposed=true;if(runtime.active===api)runtime.active=null;controls.dispose();mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);const textures=new Set(),geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){materials.add(m);Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v)})}});textures.forEach(t=>t.dispose());new Set([...textures].map(t=>t.source?.data)).forEach(image=>image?.close?.());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());draco.dispose()}
  const api={render,setProgress,setOrbit,highlight,components,sectionIndex,sectionDescription,dispose,resize,
    activate(){
      runtime.active?.deactivate();runtime.active=api;controls.enabled=orbit;
      renderer.domElement.setAttribute('aria-label',isCar?'Passat 2022 em cena ilustrativa':'Desmontagem ilustrativa de monitor de estúdio');
      renderer.domElement.setAttribute('role','img');resize();
    },
    deactivate(){controls.enabled=false},
    async prepare(){
      const textures=new Set();for(const m of materialList)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);
      for(const texture of textures){await yieldPreparation();if(runtime.disposed)return;renderer.initTexture(texture)}
      await yieldPreparation();if(runtime.disposed)return;
      // compileAsync uses KHR_parallel_shader_compile when the driver provides it.
      await renderer.compileAsync(scene,bakedCamera);
      await yieldPreparation();if(runtime.disposed)return;
      resize();setProgress(0,false);
      // Use the display framebuffer: a render target uses different color/tone-mapping
      // shader variants in r160. Capture and restore the car in the SAME task,
      // before the browser can paint; no extra context, animation loop or target.
      const exposure=renderer.toneMappingExposure,canvas=document.createElement('canvas');
      canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;
      try{
        renderer.toneMappingExposure=isCar?1.1:1.25;
        renderer.render(scene,bakedCamera);
        canvas.getContext('2d').drawImage(renderer.domElement,0,0);
      }finally{
        renderer.toneMappingExposure=exposure;
        runtime.active?.render();
      }
      return await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.94));
    }
  };
  resize();setProgress(0,false);
  return api;
}
