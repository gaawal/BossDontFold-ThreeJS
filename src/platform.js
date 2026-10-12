// 浏览器试玩与激励广告接口分离。正式抖音小游戏还需要Canvas UI和平台适配。
export class RewardAds {
 constructor({adUnitId='',confirmDemo}={}){this.adUnitId=adUnitId;this.confirmDemo=confirmDemo;this.busy=false;}
 async show(scene){
  if(this.busy)return false;this.busy=true;
  try{
   if(!globalThis.tt?.createRewardedVideoAd||!this.adUnitId)return await this.confirmDemo(scene);
   const ad=globalThis.tt.createRewardedVideoAd({adUnitId:this.adUnitId});
   return await new Promise(resolve=>{let ended=false;const finish=v=>{if(ended)return;ended=true;ad.offClose(close);ad.offError(error);resolve(v);};const close=res=>finish(res?.isEnded===true),error=()=>finish(false);ad.onClose(close);ad.onError(error);ad.load().then(()=>ad.show()).catch(error);});
  }finally{this.busy=false;}
 }
}
export const SAVE_KEY='boss-dont-fold-save-v1';
export function saveState(state){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function loadState(){try{return localStorage.getItem(SAVE_KEY);}catch{return null;}}
