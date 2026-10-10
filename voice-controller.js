import {parseVoiceCommand} from './voice.js?v=0.6.4';
export function createVoiceController({getState,execute,now=()=>Date.now()}){
 let pending=null;
 const context=()=>JSON.stringify({race:getState().race.name,points:getState().race.points,active:getState().active});
 return async text=>{
  const command=parseVoiceCommand(text,{configurations:getState().ship.sails});
  if(command.type==='unknown')return command.message;
  if(command.type==='cancel'){pending=null;return 'Opdracht geannuleerd.';}
  if(command.type==='confirm'){
   if(!pending)return 'Er staat geen opdracht klaar om te bevestigen.';
   const action=pending;pending=null;
   if(now()>action.expiresAt||context()!==action.context)return 'De bevestiging is verlopen of de baan is gewijzigd. Spreek de opdracht opnieuw uit.';
   return execute(action.command);
  }
  if(command.confirmationRequired){pending={command,expiresAt:now()+30000,context:context()};return command.message+'. Zeg bevestig om dit uit te voeren, of annuleer. De bevestiging is dertig seconden geldig.';}
  if(!command.type.startsWith('read_')&&command.type!=='help')pending=null;
  return execute(command);
 };
}
