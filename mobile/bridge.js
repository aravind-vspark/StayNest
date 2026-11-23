import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {Share} from '@capacitor/share';
import {PushNotifications} from '@capacitor/push-notifications';

if (Capacitor.isNativePlatform()) {
  window.StayNestNative={
    platform:Capacitor.getPlatform(),
    async locate(success,failure,options) {
      try {
        const permission=await Geolocation.requestPermissions({permissions:['location']});
        if(permission.location==='denied') return failure({code:1});
        success(await Geolocation.getCurrentPosition(options));
      } catch(error) { failure({code:/denied|permission/i.test(error.message)?1:/timeout/i.test(error.message)?3:2}); }
    },
    async share(url,title) { await Share.share({title,url,dialogTitle:'Share StayNest'}); },
    async payOnWebsite() { await Browser.open({url:window.STAYNEST_MOBILE.apiOrigin+'/?billing=1'}); },
    async shareReceipt(text) { await Share.share({title:'StayNest rent receipt',text,dialogTitle:'Share receipt'}); }
  };
  window.StayNestNative.enablePush=async registerToken=>{
    const permission=await PushNotifications.requestPermissions();
    if(permission.receive!=='granted') throw new Error('Allow notifications in your device settings to receive hostel updates.');
    if(Capacitor.getPlatform()==='android') await PushNotifications.createChannel({id:'hostel-updates',name:'Hostel updates',importance:3});
    await new Promise(async(resolve,reject)=>{
      let success, failure;
      const timer=setTimeout(()=>finish(new Error('Notification registration timed out. Please try again.')),20000);
      const finish=async error=>{clearTimeout(timer);await success?.remove();await failure?.remove();error?reject(error):resolve();};
      try {
        success=await PushNotifications.addListener('registration',async({value})=>{
          try {await registerToken(Capacitor.getPlatform(),value);await finish();}catch(error){await finish(error)}
        });
        failure=await PushNotifications.addListener('registrationError',error=>finish(new Error(error.error || 'Could not register notifications.')));
        await PushNotifications.register();
      }catch(error){await finish(error)}
    });
  };
  window.StayNestNative.disablePush=()=>PushNotifications.unregister();
  PushNotifications.addListener('pushNotificationActionPerformed',()=>window.dispatchEvent(new Event('staynest:update')));
  const receive=url=>{
    try {
      const incoming=new URL(url);
      if(incoming.origin!==window.STAYNEST_MOBILE.apiOrigin) return;
      const code=incoming.searchParams.get('join');
      if(code && /^[A-Za-z0-9_-]{20,64}$/.test(code)) {
        history.replaceState({},'', '/?join='+encodeURIComponent(code));
        window.dispatchEvent(new Event('staynest:join'));
      }
    } catch {}
  };
  App.addListener('appUrlOpen',({url})=>receive(url));
  App.addListener('appStateChange',({isActive})=>{if(isActive)window.dispatchEvent(new Event('staynest:update'))});
  App.addListener('appStateChange',({isActive})=>{if(isActive)window.dispatchEvent(new Event('staynest:update'))});
  App.getLaunchUrl().then(result=>{if(result)receive(result.url)});
  App.addListener('backButton',()=>window.dispatchEvent(new Event('staynest:back')));
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link)return;
    const url=new URL(link.href,location.href);
    if(url.protocol==='https:') {event.preventDefault();Browser.open({url:url.href});}
  });
}
