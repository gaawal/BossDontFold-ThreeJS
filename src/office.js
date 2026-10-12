import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {DESKS,ROLES,employeeStatus,qualification} from './game.js';
const COLORS={design:0xe8a283,dev:0x91bba4,qa:0x91afcf};
export class Office {
 constructor(host,{selectEmployee,dropEmployee,selectDesk}){
  this.host=host;this.callbacks={selectEmployee,dropEmployee,selectDesk};this.models={};this.props={};this.staff=new Map();this.labels=new Map();this.seatGroups=new Map();this.hitObjects=[];this.drag=null;this.selected=null;this.ray=new THREE.Raycaster();this.mouse=new THREE.Vector2();this.clock=new THREE.Clock();this.errors=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e6e9df');this.scene.fog=new THREE.Fog('#e6e9df',32,62);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.domElement.className='office-canvas';host.append(this.renderer.domElement);
  this.labelLayer=document.createElement('div');this.labelLayer.className='world-labels';host.append(this.labelLayer);
  this.camera=new THREE.OrthographicCamera(-8,8,8,-8,.1,100);this.camera.position.set(9,14,17);this.camera.lookAt(0,0.1,.1);
  this.scene.add(new THREE.HemisphereLight(0xfff6df,0x8a9690,2.1));const sun=new THREE.DirectionalLight(0xffeccf,3.2);sun.position.set(-6,12,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;this.scene.add(sun);
  const fill=new THREE.DirectionalLight(0xc5e6ff,1.3);fill.position.set(7,5,-6);this.scene.add(fill);
  this.buildRoom();this.setupPointers();new ResizeObserver(()=>this.resize()).observe(host);this.resize();
  this.ready=this.loadAssets();this.frame=()=>{this.animate();this.raf=requestAnimationFrame(this.frame);};this.frame();
 }
 mat(color,roughness=.85){return new THREE.MeshStandardMaterial({color,roughness});}
 box(w,h,d,color,x,y,z,parent=this.scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 cylinder(r,h,color,x,y,z,parent=this.scene){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),this.mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 label(text,pos,className='zone-label',onClick){const el=document.createElement('button');el.className=`world-label ${className}`;el.textContent=text;if(onClick)el.onclick=onClick;else el.style.pointerEvents='none';this.labelLayer.append(el);const item={el,pos:new THREE.Vector3(...pos)};this.labels.set(el,item);return item;}
 buildRoom(){
  this.box(12,.42,10,0xab876b,0,-.25,0);this.box(11.9,.08,9.9,0xe2c3a0,0,0,0);
  for(let z=-4.8;z<5;z+=.45){this.box(11.8,.012,.018,0xcda785,0,.05,z);for(let x=-5.8+(Math.round(z*10)%2)*.8;x<6;x+=2)this.box(.014,.012,.44,0xcda785,x,.05,z);}
  this.box(12,2.5,.18,0xe6e9dd,0,1.25,-5);this.box(.18,2.5,10,0xe6e9dd,-6,1.25,0);
  this.box(12,.13,.22,0xa0aaa0,0,.15,-4.9);this.box(.22,.13,10,0xa0aaa0,-5.9,.15,0);
  for(const x of [-4,-1.8,.4]){this.box(1.6,1.3,.06,0xb9dbe0,x,1.7,-4.88);this.box(.06,1.4,.08,0xffffff,x,1.7,-4.82);this.box(1.75,.07,.12,0xffffff,x,1.03,-4.83);this.box(1.75,.07,.12,0xffffff,x,2.37,-4.83);}
  for(const r of ['design','dev','qa']){const x=r==='design'?-3.6:r==='dev'?0:3.6,w=r==='dev'?4.5:2.2;this.box(w,.018,5.1,COLORS[r],x,.065,1);this.label(ROLES[r],[x,.25,-1.65],`zone-label ${r}`);}
  for(const d of DESKS){const g=new THREE.Group();g.position.set(d.x,0,d.z);this.scene.add(g);const marker=this.box(1.95,.025,2.1,COLORS[d.role],0,.085,.3,g);marker.material.transparent=true;marker.material.opacity=.25;const hit=this.box(1.95,.1,2.1,0xffffff,0,.11,.3,g);hit.visible=false;hit.userData={desk:d.id};this.hitObjects.push(hit);
   const fallback=this.box(1.65,.12,.85,0xefcfaa,0,.9,0,g);for(const x of [-.65,.65])for(const z of [-.28,.28])this.box(.09,.85,.09,0xd2a579,x,.43,z,g);
   this.box(.73,.46,.065,0x344744,0,1.25,-.20,g);const screen=this.box(.63,.36,.008,0x77aab6,0,1.25,-.159,g);this.box(.06,.2,.06,0x475450,0,.97,-.2,g);this.box(.42,.035,.17,0x475450,0,.93,-.1,g);screen.userData.dynamic=true;this.box(.62,.028,.20,0xa6aaa4,0,.98,.23,g);this.cylinder(.065,.15,0xeeaa75,.58,1.04,.22,g);
   this.box(.7,.12,.65,0x6b8b81,0,.47,.93,g);this.box(.7,.7,.1,0x6b8b81,0,.88,1.23,g);this.cylinder(.08,.42,0x4e625b,0,.24,.93,g);
   const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.61,40),new THREE.MeshBasicMaterial({color:0xffd15c,transparent:true,opacity:.9,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(0,.15,.75);ring.visible=false;g.add(ring);
   const lb=this.label('空位',[d.x,1.8,d.z+.1],'desk-label',()=>this.callbacks.selectDesk(d.id));this.seatGroups.set(d.id,{group:g,ring,marker,screen,fallback,label:lb});
  }
  this.label('培训',[0,1.8,-3.8],'zone-label training');this.label('休息',[3.9,1.3,-3.8],'zone-label rest');this.label('待安排',[-2.9,.25,4.35],'zone-label waiting');
  this.box(8.8,.18,.7,0xf4d6ac,-.45,.3,4.1);this.box(8.8,.4,.12,0xadc6b8,-.45,.53,4.5);
  this.box(1.7,.06,1.1,0xf1debf,0,.86,-3.3);this.box(2,.07,.06,0xcbb39a,0,1.85,-4.85);
  this.box(2.4,1.1,.04,0x8ca990,2.7,1.7,-4.84);this.textPlane('四周创业挑战\n设计 → 开发 → 测试',2.7,1.7,-4.79,2.1,1);
 }
 textPlane(text,x,y,z,w,h){const c=document.createElement('canvas');c.width=640;c.height=240;const cx=c.getContext('2d');cx.fillStyle='#8ca990';cx.fillRect(0,0,640,240);cx.fillStyle='#fffbea';cx.font='bold 38px OfficeUI,sans-serif';cx.textAlign='center';text.split('\n').forEach((line,i)=>cx.fillText(line,320,85+i*75));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);this.scene.add(m);}
 async loadAssets(){
  const loader=new GLTFLoader(),base=import.meta.env.BASE_URL;
  const animalNames=['Fox','ShibaInu','Husky','Alpaca'];const propNames=['table_medium','couch_pillows','shelf_B_large_decorated','cactus_small_A','cactus_medium_A','lamp_standing','book_set','table_low'];
  await Promise.allSettled([...animalNames.map(async name=>{try{this.models[name]=await loader.loadAsync(`${base}models/animals/${name}.glb`);}catch(e){this.errors.push(name);console.error('模型加载失败',name,e);}}),...propNames.map(async name=>{try{this.props[name]=await loader.loadAsync(`${base}models/furniture/${name}.gltf`);}catch(e){this.errors.push(name);console.error('家具加载失败',name,e);}})]);
  this.placeProps();this.mergeStatic();this.assetLoaded=true;if(this.state)this.sync(this.state);return {errors:this.errors};
 }
 prop(name,x,y,z,width,rotation=0){const original=this.props[name];if(!original)return;const o=original.scene.clone(true);const b=new THREE.Box3().setFromObject(o),sz=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());o.position.sub(center);const g=new THREE.Group();g.add(o);g.scale.setScalar(width/sz.x);g.position.set(x,y+sz.y*g.scale.x/2,z);g.rotation.y=rotation;g.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});this.scene.add(g);return g;}
 placeProps(){
  this.prop('couch_pillows',3.6,.1,-3.4,2.5);this.prop('shelf_B_large_decorated',-4.8,.1,-3.7,1.3);this.prop('lamp_standing',5.2,.1,-3.8,.5);this.prop('table_low',3.5,.1,-2.3,1.2);this.prop('book_set',0,.91,-3.3,.4);
  for(const [x,z] of [[-5.3,3.3],[5.25,3.8],[-5.2,-2],[5.25,-1.8]])this.prop('cactus_medium_A',x,.1,z,.45);
  for(const d of DESKS){this.prop('cactus_small_A',d.x-.59,1,d.z-.1,.17);const seat=this.seatGroups.get(d.id);const table=this.props.table_medium;if(table){seat.fallback.visible=false;this.prop('table_medium',d.x,.05,d.z,1.65);}}
 }
 mergeStatic(){
  this.scene.updateMatrixWorld(true);const buckets=new Map(),remove=[];
  this.scene.traverse(o=>{if(!o.isMesh||!o.visible||o.userData.dynamic||o.userData.employee||o.userData.desk||Array.isArray(o.material)||!o.material.isMeshStandardMaterial||o.material.transparent)return;
   const key=o.material.map?'textured':'plain';if(!buckets.has(key))buckets.set(key,{geometries:[],map:o.material.map});const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=o.material.color.r;colors[i+1]=o.material.color.g;colors[i+2]=o.material.color.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));buckets.get(key).geometries.push(g);remove.push(o);
  });
  for(const bucket of buckets.values()){const geo=mergeGeometries(bucket.geometries,false);if(!geo)continue;const mat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:bucket.map,roughness:.85});const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);bucket.geometries.forEach(g=>g.dispose());}
  remove.forEach(o=>o.parent.remove(o));
 }
 createStaff(e){
  const g=new THREE.Group();const src=this.models[e.animal];let mixer=null;
  if(src){const model=clone(src.scene);const b=new THREE.Box3().setFromObject(model),sz=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());const scale=1.25/Math.max(sz.x,sz.y,sz.z);model.scale.setScalar(scale);model.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);g.add(model);mixer=new THREE.AnimationMixer(model);const clip=src.animations.find(a=>a.name==='Idle')||src.animations[0];if(clip)mixer.clipAction(clip).play();}
  else {this.cylinder(.27,.48,0xa5b8a2,0,.3,0,g);const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),this.mat(0xe9c9a6));head.position.y=.7;g.add(head);}
  const ring=new THREE.Mesh(new THREE.RingGeometry(.47,.52,36),new THREE.MeshBasicMaterial({color:0x42b9cf,transparent:true,opacity:.95,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;g.add(ring);ring.visible=false;
  const hit=this.box(.58,.9,.65,0xffffff,0,.45,0,g);hit.visible=false;hit.userData={employee:e.id};this.hitObjects.push(hit);g.traverse(c=>{if(c.isMesh&&c!==ring){c.castShadow=true;c.receiveShadow=true;}});this.scene.add(g);
  const lb=this.label(e.name,[0,1.4,0],'employee-label',()=>this.callbacks.selectEmployee(e.id));const obj={group:g,mixer,ring,label:lb,target:new THREE.Vector3(),id:e.id};this.staff.set(e.id,obj);return obj;
 }
 sync(s){this.state=s;if(!this.assetLoaded)return;let waiting=0;const ids=new Set(s.employees.map(e=>e.id));for(const [id,o] of this.staff)if(!ids.has(id)){this.scene.remove(o.group);o.label.el.remove();this.labels.delete(o.label.el);this.staff.delete(id);this.hitObjects=this.hitObjects.filter(h=>h.userData.employee!==id);}
  for(const e of s.employees){const o=this.staff.get(e.id)||this.createStaff(e);let x,z,y=.08;if((e.leaveUntil>s.day&&s.day>=(e.leaveFrom||0))){x=4.2;z=-3.3;y=.6;}else if(e.training&&!e.training.paused){x=-.3;z=-2.5;}else if(e.mode==='rest'){x=3.5+(waiting++%2)*.5;z=-3.1;y=.65;}else if(e.desk){const d=DESKS.find(d=>d.id===e.desk);x=d.x;z=d.z+.9;y=.52;}else {x=-4.7+waiting*.95;z=4.1;waiting++;}
   o.target.set(x,y,z);if(!o.initialized){o.group.position.copy(o.target);o.initialized=true;}o.group.rotation.y=e.desk?Math.PI:0;o.ring.visible=e.id===this.selected;o.label.el.textContent=`${e.name} · ${employeeStatus(s,e)}`;o.label.el.classList.toggle('selected',e.id===this.selected);o.label.hidden=!e.desk&&e.id!==this.selected;
  }
  for(const d of DESKS){const seat=this.seatGroups.get(d.id),e=s.employees.find(e=>e.desk===d.id),p=e&&s.projects.find(p=>p.id===e.project);seat.label.el.textContent=p?p.name:'＋ 空位';seat.label.el.classList.toggle('occupied',!!e);seat.screen.material.color.set(e?COLORS[d.role]:0x6a8284);}
 }
 select(id){this.selected=id;if(this.state)this.sync(this.state);}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);const aspect=w/h;const mobile=w<=700;let vh=mobile?Math.max(11.5,13.2/aspect):Math.max(12.8,15.6/aspect);this.camera.left=-vh*aspect/2;this.camera.right=vh*aspect/2;this.camera.top=vh/2;this.camera.bottom=-vh/2;this.camera.updateProjectionMatrix();}
 pick(ev){const r=this.renderer.domElement.getBoundingClientRect();this.mouse.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.mouse,this.camera);const hits=this.ray.intersectObjects(this.hitObjects,false);if(this.drag?.moved)return hits.find(h=>h.object.userData.desk)?.object.userData;return hits[0]?.object.userData;}
 floorPoint(ev){this.pick(ev);const out=new THREE.Vector3();return this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),out);}
 setupPointers(){const c=this.renderer.domElement;c.addEventListener('pointerdown',ev=>{const hit=this.pick(ev);if(hit?.employee){this.callbacks.selectEmployee(hit.employee);this.drag={id:hit.employee,startX:ev.clientX,startY:ev.clientY,moved:false};c.setPointerCapture(ev.pointerId);}else if(hit?.desk)this.callbacks.selectDesk(hit.desk);});c.addEventListener('pointermove',ev=>{if(!this.drag)return;if(Math.hypot(ev.clientX-this.drag.startX,ev.clientY-this.drag.startY)>7)this.drag.moved=true;if(!this.drag.moved)return;const p=this.floorPoint(ev),o=this.staff.get(this.drag.id);if(p&&o){o.group.position.set(p.x,.7,p.z);this.host.classList.add('dragging');}const hit=this.pick(ev);for(const d of DESKS)this.seatGroups.get(d.id).ring.visible=hit?.desk===d.id;});const end=ev=>{if(!this.drag)return;const drag=this.drag;this.drag=null;this.host.classList.remove('dragging');for(const d of DESKS)this.seatGroups.get(d.id).ring.visible=false;if(drag.moved){const hit=this.pick(ev);if(hit?.desk)this.callbacks.dropEmployee(drag.id,hit.desk);else {const p=this.floorPoint(ev);if(p&&p.z<-2&&p.x>2)this.callbacks.dropEmployee(drag.id,'rest');}}};c.addEventListener('pointerup',end);c.addEventListener('pointercancel',()=>{this.drag=null;this.host.classList.remove('dragging');});}
 animate(){const dt=Math.min(this.clock.getDelta(),.1);for(const o of this.staff.values()){o.mixer?.update(dt*.6);if(this.drag?.id!==o.id)o.group.position.lerp(o.target,Math.min(1,dt*8));o.label.pos.copy(o.group.position).add(new THREE.Vector3(0,1.1,0));}for(const l of this.labels.values()){const p=l.pos.clone().project(this.camera);l.el.style.left=`${(p.x*.5+.5)*100}%`;l.el.style.top=`${(-p.y*.5+.5)*100}%`;l.el.style.display=p.z>1||l.hidden?'none':'';}this.renderer.render(this.scene,this.camera);}
 dispose(){cancelAnimationFrame(this.raf);this.renderer.dispose();}
}
