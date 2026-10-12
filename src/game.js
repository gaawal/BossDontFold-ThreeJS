export const ROLES = {design:'设计',dev:'开发',qa:'测试'};
export const SKILLS = {ui:'界面',ux:'交互',front:'前端',pay:'支付',web:'网页测试',payment:'支付测试'};
export const LEVELS = ['','初级','中级','高级'];
export const DAYS = ['周一','周二','周三','周四','周五','周六','周日'];
export const DESKS = [
 {id:'d1',role:'design',x:-3.6,z:-.3},{id:'d2',role:'design',x:-3.6,z:2.1},
 {id:'v1',role:'dev',x:-1.2,z:-.3},{id:'v2',role:'dev',x:1.2,z:-.3},
 {id:'v3',role:'dev',x:-1.2,z:2.1},{id:'v4',role:'dev',x:1.2,z:2.1},
 {id:'q1',role:'qa',x:3.6,z:-.3},{id:'q2',role:'qa',x:3.6,z:2.1}
];
export const UPGRADES = [
 {id:'equipment',name:'好电脑',icon:'⌘',description:'每级使开发效率提高12%',cost:850,max:3},
 {id:'academy',name:'培训教室',icon:'▤',description:'培训费用减半，每级减少2小时培训',cost:650,max:2},
 {id:'wellness',name:'休息角',icon:'♡',description:'每级增加休息恢复，降低加班健康损耗',cost:650,max:3},
 {id:'quality',name:'代码检查',icon:'✓',description:'每级降低开发缺陷风险',cost:1000,max:2},
 {id:'mentor',name:'带教制度',icon:'↗',description:'全员工作经验增加25%',cost:700,max:2}
];
const cap=(x,a=0,b=100)=>Math.min(b,Math.max(a,x));
export function random(s){let n=s.rng|0;n^=n<<13;n^=n>>>17;n^=n<<5;s.rng=n>>>0;return s.rng/4294967296;}
export function employee(id,name,animal,role,level,skills){return {id,name,animal,role,level,skills,health:100,energy:100,xp:0,track:null,desk:null,project:null,mode:'normal',training:null,leaveUntil:0,leaveFrom:0,salary:[0,450,750,1050][level],todayWork:0};}
export function newGame(seed=Date.now(),meta={}){
 const s={version:1,seed,rng:(seed>>>0)||12345,day:0,hour:9,cash:21000,status:'playing',meeting:true,meetingDay:0,meetingReason:'周一：安排本月需求',paused:true,saturday:false,revived:false,deadlinePrompt:false,selectedProject:'p1',employees:[
 employee('e1','小狐狸','Fox','design',2,['ui','ux']),employee('e2','小柴','ShibaInu','dev',2,['front']),employee('e3','小哈','Husky','dev',1,['front','pay']),employee('e4','小羊','Alpaca','qa',2,['web']),employee('e5','阿橘','Fox','dev',1,['front']),employee('e6','小白','Husky','qa',1,['web','payment'])],projects:[
 project('p1','商城页面','🛍','ui','front','web',[2.5,10,3],14500,1),
 project('p2','会员登录','🔐','ux','front','web',[3,11,3.5],16500,1),
 project('p3','支付功能','💳','ui','pay','payment',[3,12,4],20000,2)
 ],upgrades:{equipment:0,academy:0,wellness:0,quality:0,mentor:0},logs:[],event:null,dayEvent:-1,candidates:[],salaryWeeks:[],delivery:null,totalIncome:0,totalCosts:0,bugsFiled:0,completedTraining:0,meta:{stars:meta.stars||0,months:meta.months||0},rewardClaimed:false};
 s.candidates=recruitCandidates(s);log(s,'公司开张！现金要撑过四周工资，项目款月底到账。');return s;
}
function project(id,name,icon,d,v,q,work,reward,minLevel){return {id,name,icon,skills:{design:d,dev:v,qa:q},minLevel,work:{design:work[0],dev:work[1],qa:work[2]},done:{design:0,dev:0,qa:0},stage:'design',reward,bugs:[],generated:false,devQuality:0,devEffort:0,qaQuality:0,qaEffort:0,delivered:false};}
export function log(s,message,type='info'){s.logs.unshift({day:s.day,hour:s.hour,message,type});s.logs=s.logs.slice(0,100);}
export function dateText(s){return `第${Math.floor(s.day/7)+1}周·${DAYS[s.day%7]}`;}
export function weekSalary(s){return s.employees.reduce((a,e)=>a+e.salary,0)+500;}
export function stageRole(p){return p.stage==='fix'?'dev':p.stage==='retest'?'qa':p.stage;}
export function remaining(p){if(p.stage==='ready'||p.delivered)return 0;if(p.stage==='fix')return p.bugs.filter(b=>b.status==='open').reduce((a,b)=>a+b.work-b.done,0);if(p.stage==='retest')return p.bugs.filter(b=>b.status==='fixed').reduce((a,b)=>a+b.verify-b.verified,0);return Math.max(0,p.work[p.stage]-p.done[p.stage]);}
export function qualification(e,p,role){
 if(e.role!==role)return {ok:false,reason:`岗位不符：需要${ROLES[role]}`,kind:'role'};
 if(e.level<(role==='dev'?p.minLevel:1))return {ok:false,reason:`级别不足：需要${LEVELS[p.minLevel]}开发`,kind:'level'};
 const skill=p.skills[role];if(!e.skills.includes(skill))return {ok:false,reason:`缺少${SKILLS[skill]}：需培训1天`,kind:'skill',skill};
 return {ok:true,reason:'资格符合，可工作'};
}
export function efficiency(s,e){return [0,1,1.3,1.65][e.level]*(e.energy<20?.55:e.energy<45?.8:1)*(e.health<40?.8:1)*(1+(e.role==='dev'?s.upgrades.equipment*.12:0))*(e.track==='expert'?1.12:1);}
export function assign(s,eid,did,pid){
 if(s.status!=='playing')return {ok:false,reason:'本局已结束'};
 const e=s.employees.find(x=>x.id===eid),d=DESKS.find(x=>x.id===did),p=s.projects.find(x=>x.id===pid);
 if(!e||!d||!p)return {ok:false,reason:'员工、工位或需求不存在'};
 if((e.leaveUntil>s.day&&s.day>=(e.leaveFrom||0)))return {ok:false,reason:`${e.name}正在请假`};
 if(e.training)return {ok:false,reason:'培训中，请先暂停培训'};
 if(p.delivered||p.stage==='ready')return {ok:false,reason:'该需求已完成，请选择其他需求'};
 const q=qualification(e,p,d.role);if(!q.ok)return q;
 const occupied=s.employees.find(x=>x.desk===did&&x.id!==eid);if(occupied)return {ok:false,reason:`工位由${occupied.name}占用，请先调走`};
 e.desk=did;e.project=pid;e.mode='normal';log(s,`${e.name}安排到${ROLES[d.role]}位，负责${p.name}`);return {ok:true};
}
export function rest(s,eid){const e=s.employees.find(x=>x.id===eid);if(!e)return;e.desk=null;e.project=null;e.mode='rest';log(s,`${e.name}安排休息`);}
export function idle(s,eid){const e=s.employees.find(x=>x.id===eid);if(!e)return;e.desk=null;e.project=null;e.mode='normal';}
export function train(s,eid,skill,target=null){
 if(s.status!=='playing')return {ok:false,reason:'本局已结束'};
 const e=s.employees.find(x=>x.id===eid);if(!e)return {ok:false,reason:'员工不存在'};
 const allowed={design:['ui','ux'],dev:['front','pay'],qa:['web','payment']}[e.role];
 if(!allowed.includes(skill))return {ok:false,reason:'只能培训本岗位技能'};
 if(e.skills.includes(skill))return {ok:false,reason:'已掌握此技能'};
 if((e.leaveUntil>s.day&&s.day>=(e.leaveFrom||0)))return {ok:false,reason:'请假期间无法培训'};
 if(e.training){if(e.training.skill!==skill)return {ok:false,reason:'请先完成现有培训'};e.training.paused=false;return {ok:true};}
 const cost=s.upgrades.academy?150:300;if(s.cash<cost)return {ok:false,reason:'现金不足，培训需要'+cost};
 s.cash-=cost;s.totalCosts+=cost;e.desk=null;e.project=null;e.mode='normal';e.training={skill,remaining:Math.max(4,8-s.upgrades.academy*2),target,paused:false};log(s,`${e.name}开始${SKILLS[skill]}培训，占用一个工作日`);return {ok:true};
}
export function pauseTraining(s,eid){const e=s.employees.find(x=>x.id===eid);if(e?.training)e.training.paused=!e.training.paused;}
export function employeeStatus(s,e){
 if((e.leaveUntil>s.day&&s.day>=(e.leaveFrom||0)))return `请假${e.leaveUntil-s.day}天`;
 if(e.training)return `${e.training.paused?'培训暂停':'培训'} ${Math.ceil(e.training.remaining)}小时`;
 if(e.mode==='rest')return '休息中';
 if(!e.desk)return '空闲';
 const p=s.projects.find(p=>p.id===e.project);if(!p||p.stage==='ready'||p.delivered)return '任务完成';
 const d=DESKS.find(d=>d.id===e.desk);if(stageRole(p)!==d.role)return `等待${ROLES[stageRole(p)]||'交付'}`;
 return e.mode==='overtime'?'加班中':p.stage==='fix'?'修复中':p.stage==='retest'?'回归中':'工作中';
}
function earnXp(s,e,work){e.xp+=work*22*(1+s.upgrades.mentor*.25)*(e.track==='mentor'?1.25:1);const threshold=e.level*70;if(e.level<3&&e.xp>=threshold){e.xp-=threshold;e.level++;e.salary+=250;log(s,`${e.name}升为${LEVELS[e.level]}${ROLES[e.role]}！可选择成长方向`,'good');}}
function generateBugs(s,p){
 if(p.generated)return;p.generated=true;const quality=p.devEffort?p.devQuality/p.devEffort:1;
 const risk=cap(.65-(quality-1)*.22-s.upgrades.quality*.16,.12,.8);
 const count=(random(s)<risk?1:0)+(p.minLevel===2&&random(s)<risk?1:0);
 for(let i=0;i<count;i++)p.bugs.push({id:`${p.id}-b${i}`,title:i===0?'核心流程异常':'边界场景错误',severity:i===0?'严重':'普通',work:i===0?1:.5,done:0,verify:.35,verified:0,status:'hidden',author:p.mainDev});
}
function progressProject(s,p,e,amount){
 if(p.stage==='fix'){
  let left=amount;for(const b of p.bugs.filter(b=>b.status==='open')){const used=Math.min(left,b.work-b.done);b.done+=used;left-=used;if(b.done>=b.work-1e-6){b.status='fixed';log(s,`${p.name}：${b.title}修复完成，等待回归`,'good');}if(left<=0)break;}
  if(!p.bugs.some(b=>b.status==='open'))p.stage='retest';
 }else if(p.stage==='retest'){
  let left=amount;for(const b of p.bugs.filter(b=>b.status==='fixed')){const used=Math.min(left,b.verify-b.verified);b.verified+=used;left-=used;if(b.verified>=b.verify-1e-6)b.status='verified';if(left<=0)break;}
  if(!p.bugs.some(b=>['open','fixed'].includes(b.status))){p.stage='ready';log(s,`${p.name}回归通过，等待月底交付`,'good');}
 }else{
  const r=p.stage,used=Math.min(amount,p.work[r]-p.done[r]);p.done[r]+=used;
  if(r==='dev'){p.mainDev=e.id;p.devQuality+=(e.level*(e.health/100)*(.65+e.energy/200))*used;p.devEffort+=used;}
  if(r==='qa'){p.qaQuality+=e.level*used;p.qaEffort+=used;}
  if(p.done[r]>=p.work[r]-1e-6){
   if(r==='design'){p.stage='dev';log(s,`${p.name}设计完成，进入开发`,'good');}
   else if(r==='dev'){generateBugs(s,p);p.stage='qa';log(s,`${p.name}开发完成，进入测试`,'good');}
   else{
    const detect=cap(.65+(p.qaEffort?p.qaQuality/p.qaEffort-1:0)*.18,.65,.97);
    for(const b of p.bugs.filter(b=>b.status==='hidden'))if(b.severity==='严重'||random(s)<detect){b.status='open';s.bugsFiled++;log(s,`${e.name}提单：${p.name} · ${b.title}`,'warn');}
    p.stage=p.bugs.some(b=>b.status==='open')?'fix':'ready';log(s,p.stage==='fix'?`${p.name}测试发现Bug，需开发修复`:`${p.name}测试完成，等待交付`,p.stage==='fix'?'warn':'good');
   }
  }
 }
 earnXp(s,e,amount);
}
function hourly(s,dt){
 const weekend=s.day%7>=5,workingDay=!weekend||(s.day%7===5&&s.saturday),regular=s.hour>=9&&s.hour<18&&!(s.hour>=12&&s.hour<13),extra=s.hour>=18&&s.hour<20;
 for(const e of s.employees){
  if((e.leaveUntil>s.day&&s.day>=(e.leaveFrom||0))){e.energy=cap(e.energy+dt*5);e.health=cap(e.health+dt*.9);continue;}
  const active=workingDay&&regular;
  if(e.training&&!e.training.paused&&active){e.training.remaining-=dt;e.energy=cap(e.energy-dt*1.1);if(e.training.remaining<=1e-6){const t=e.training;e.skills.push(t.skill);e.training=null;s.completedTraining++;log(s,`${e.name}掌握${SKILLS[t.skill]}，培训完成`,'good');if(t.target){const result=assign(s,e.id,t.target.desk,t.target.project);if(!result.ok)log(s,`自动支援未安排：${result.reason}`,'warn');}}continue;}
  if(e.training){e.energy=cap(e.energy+dt*2);continue;}
  if(e.mode==='rest'||!workingDay||!regular&&!extra){e.energy=cap(e.energy+dt*(2+s.upgrades.wellness));e.health=cap(e.health+dt*(weekend?.7:.12));continue;}
  const canWork=active||workingDay&&extra&&e.mode==='overtime';
  if(!canWork)continue;
  const p=s.projects.find(p=>p.id===e.project),d=DESKS.find(d=>d.id===e.desk);
  if(p&&d&&stageRole(p)===d.role&&qualification(e,p,d.role).ok&&p.stage!=='ready'&&!p.delivered){
   const overtime=extra||s.day%7===5;e.energy=cap(e.energy-dt*(overtime?5:2.3));if(overtime)e.health=cap(e.health-dt*(3-s.upgrades.wellness*.35));
   let amount=efficiency(s,e)*dt/8;if(p.stage==='fix'&&p.mainDev&&p.mainDev!==e.id)amount*=.85;
   if(overtime&&s.day%7!==5){const cost=e.salary/5/8*.5*dt;s.cash-=cost;s.totalCosts+=cost;if(s.cash<0){s.status='bankrupt';s.paused=true;}}e.todayWork+=amount;progressProject(s,p,e,amount);
  }else e.energy=cap(e.energy+dt*.7);
 }
}
function dailyEvent(s){
 if(s.day<2||s.day%7>4||s.event||s.dayEvent===s.day||random(s)>.30)return;s.dayEvent=s.day;
 const options=['change','bonus','leave'];const type=options[Math.floor(random(s)*options.length)];
 if(type==='change'){const p=s.projects.find(p=>!p.delivered&&['design','dev'].includes(p.stage));if(p)s.event={type,pid:p.id,title:'客户想加个小功能',text:`${p.name}增加2人天开发，交付收入增加¥1,800。你可以拒绝。`};}
 if(type==='bonus')s.event={type,title:'老客户的感谢',text:'获得¥600预付款，月底交付收入不变。'};
 if(type==='leave'){const e=s.employees[Math.floor(random(s)*s.employees.length)];s.event={type,eid:e.id,title:'临时事假申请',text:`${e.name}明天需要请假一天。可以批准，或协商下周休假（健康-6）。`};}
 if(s.event){s.paused=true;log(s,s.event.title,'warn');}
}
function morning(s){
 for(const e of s.employees){e.todayWork=0;if(e.health<75&&s.day%7<5&&(e.leaveUntil<=s.day||s.day<(e.leaveFrom||0))&&random(s)<(75-e.health)/170){e.leaveFrom=s.day;e.leaveUntil=s.day+1+(random(s)<.25?1:0);log(s,`${e.name}因健康不佳请假${e.leaveUntil-s.day}天`,'warn');}}
 if(s.day%7===6){for(const e of s.employees){e.health=cap(e.health+12+s.upgrades.wellness*3);e.energy=100;}}
 if(s.day<=25&&[0,2,4].includes(s.day%7)){s.meeting=true;s.meetingDay=s.day;s.meetingReason=s.day%7===0?'安排本周工作':s.day%7===2?'检查进度，动态调配':'检查风险，准备交付';s.paused=true;}
 dailyEvent(s);
}
function paySalary(s,week){if(s.salaryWeeks.includes(week))return;const cost=weekSalary(s);s.cash-=cost;s.totalCosts+=cost;s.salaryWeeks.push(week);log(s,`第${week}周结算：工资与房租 ¥${cost}`,s.cash<0?'warn':'info');if(s.cash<0){s.status='bankrupt';s.paused=true;}}
export function advance(s,hours){
 if(s.status!=='playing'||s.paused||s.meeting||s.event||s.deadlinePrompt)return;
 let left=Math.min(hours,48);while(left>1e-6&&s.status==='playing'&&!s.paused){const dt=Math.min(left,.25);hourly(s,dt);s.hour+=dt;left-=dt;
  if(s.day===25&&s.hour>=18&&!s.saturday){s.hour=18;s.deadlinePrompt=true;s.paused=true;log(s,'月底交付时间已到，请验收或安排周六补交','warn');break;}
  if(s.day===26&&s.hour>=18&&s.saturday){s.hour=18;s.deadlinePrompt=true;s.paused=true;break;}
  if(s.hour>=20){if(s.day%7===6)paySalary(s,Math.floor(s.day/7)+1);s.day++;s.hour=9;if(s.day>=28){finish(s);break;}morning(s);}
 }
}
export function closeMeeting(s){s.meeting=false;s.paused=!!s.event;log(s,'早会结束，按当前安排开始工作');}
export function resolveEvent(s,accept){const ev=s.event;if(!ev)return;if(ev.type==='change'&&accept){const p=s.projects.find(p=>p.id===ev.pid);p.work.dev+=2;p.reward+=1800;}if(ev.type==='bonus'){s.cash+=600;s.totalIncome+=600;}if(ev.type==='leave'){const e=s.employees.find(e=>e.id===ev.eid);if(accept){e.leaveFrom=s.day+1;e.leaveUntil=s.day+2;}else e.health=cap(e.health-6);}s.event=null;s.paused=!!s.meeting;}
export function extendSaturday(s){if(s.day!==25||s.saturday)return false;s.saturday=true;s.deadlinePrompt=false;s.paused=false;s.meeting=false;const cost=s.employees.filter(e=>e.desk).reduce((a,e)=>a+Math.round(e.salary/5*.5),0);s.cash-=cost;s.totalCosts+=cost;log(s,`安排周六补交，加班补贴¥${cost}`,'warn');if(s.cash<0){s.status='bankrupt';s.paused=true;}return true;}
export function deliver(s){
 for(const p of s.projects.filter(p=>p.stage==='ready'&&!p.delivered)){
  const hidden=p.bugs.filter(b=>b.status==='hidden');if(hidden.length){for(const b of hidden){b.status='open';s.bugsFiled++;}p.stage='fix';log(s,`${p.name}客户验收发现遗漏问题，需修复`,'warn');continue;}
  p.delivered=true;const reward=Math.round(p.reward*(s.saturday?.9:1));s.cash+=reward;s.totalIncome+=reward;log(s,`${p.name}交付成功，收入¥${reward}`,'good');
 }
 if(s.day===25&&s.projects.some(p=>!p.delivered)&&!s.saturday)return {finished:false};finish(s);return {finished:true};
}
function finish(s){paySalary(s,4);if(s.status==='bankrupt')return;const delivered=s.projects.filter(p=>p.delivered).length;s.status=delivered?'won':'lost';s.paused=true;s.deadlinePrompt=false;s.delivery={count:delivered,total:s.projects.length,cash:s.cash,income:s.totalIncome,cost:s.totalCosts,bugs:s.bugsFiled,stars:delivered*2+(s.cash>15000?1:0)};if(!s.rewardClaimed){s.meta.stars+=s.delivery.stars;s.meta.months++;s.rewardClaimed=true;}log(s,`本月完成${delivered}/${s.projects.length}个需求。`);}
export function revive(s){if(s.status!=='bankrupt'||s.revived)return false;s.cash+=Math.max(6500,1-s.cash);s.revived=true;s.status='playing';s.paused=true;log(s,'获得救急资金，保留本局员工与进度','good');return true;}
export function purchase(s,id){if(s.status!=='playing')return {ok:false,reason:'本局已结束'};const u=UPGRADES.find(u=>u.id===id);if(!u)return {ok:false,reason:'升级不存在'};const n=s.upgrades[id],cost=u.cost*(n+1);if(n>=u.max)return {ok:false,reason:'已达最高等级'};if(s.cash<cost)return {ok:false,reason:'现金不足'};s.cash-=cost;s.totalCosts+=cost;s.upgrades[id]++;log(s,`公司升级：${u.name} Lv.${n+1}`,'good');return {ok:true};}
export function recruitCandidates(s){const rows=[['小棕','Alpaca','design',1,['ui']],['阿柴','ShibaInu','dev',2,['front','pay']],['小灰','Husky','qa',2,['web','payment']]];return rows.map((a,i)=>employee(`hire-${s.day}-${i}-${Math.floor(random(s)*9999)}`,...a));}
export function hire(s,id){if(s.status!=='playing')return {ok:false,reason:'本局已结束'};const e=s.candidates.find(e=>e.id===id);if(!e)return {ok:false,reason:'候选人已离开'};if(s.employees.length>=10)return {ok:false,reason:'办公室最多10人'};const cost=e.salary;if(s.cash<cost)return {ok:false,reason:'招聘费不足'};s.cash-=cost;s.totalCosts+=cost;s.employees.push(e);s.candidates=s.candidates.filter(x=>x.id!==id);log(s,`${e.name}入职，周薪¥${e.salary}`,'good');return {ok:true};}
export function fire(s,id){if(s.status!=='playing')return {ok:false,reason:'本局已结束'};const e=s.employees.find(e=>e.id===id);if(!e)return {ok:false,reason:'员工不存在'};if(s.cash<e.salary)return {ok:false,reason:'现金不足以支付一周补偿'};s.cash-=e.salary;s.totalCosts+=e.salary;s.employees=s.employees.filter(e=>e.id!==id);log(s,`${e.name}离职，支付补偿¥${e.salary}`);return {ok:true};}
export function forecast(s,p){
 if(p.delivered||p.stage==='ready')return {text:'可交付',risk:false};
 const roles=['design','dev','qa'];let total=0;
 for(const r of roles){const rem=Math.max(0,p.work[r]-p.done[r]);if(!rem)continue;const workers=s.employees.filter(e=>e.project===p.id&&e.desk&&e.role===r&&qualification(e,p,r).ok&&(e.leaveUntil<=s.day||s.day<(e.leaveFrom||0)));const speed=workers.reduce((a,e)=>a+efficiency(s,e),0);if(!speed)return {text:`缺${ROLES[r]}人员`,risk:true};total+=rem/speed;}
 if(['fix','retest'].includes(p.stage)){const r=stageRole(p);const workers=s.employees.filter(e=>e.project===p.id&&e.desk&&e.role===r&&qualification(e,p,r).ok&&(e.leaveUntil<=s.day||s.day<(e.leaveFrom||0)));if(!workers.length)return {text:`需${ROLES[r]}处理`,risk:true};total=remaining(p)/workers.reduce((a,e)=>a+efficiency(s,e),0)+(p.stage==='fix'?.5:0);}
 let available=0;for(let day=s.day;day<=25;day++){if(day%7<5)available+=day===s.day?Math.max(0,18-s.hour-(s.hour<13?1:0))/8:1;}
 return {text:`约${total.toFixed(1)}工作日`,risk:total>available};
}
export function snapshot(s){return JSON.stringify(s);}
export function restore(raw){const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.employees)||!Array.isArray(s.projects)||!Number.isFinite(s.cash)||s.day<0||s.day>28)throw Error('存档格式无效');s.paused=true;return s;}
