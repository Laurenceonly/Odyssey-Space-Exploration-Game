export function createBackpack({button,panel,closeButton,itemButton=null,onToggleBoard=()=>false}){
  let open=false;
  function setOpen(value){
    open=Boolean(value);
    panel.classList.toggle('is-open',open);
    panel.inert=!open;
    panel.setAttribute('aria-hidden',String(!open));
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open?'Close backpack':'Open backpack');
  }
  function toggle(){setOpen(!open);}
  button.addEventListener('click',toggle);
  closeButton.addEventListener('click',()=>{setOpen(false);button.focus({preventScroll:true});});
  itemButton?.addEventListener('click',()=>{onToggleBoard();});
  return {
    toggle,close(){setOpen(false);},
    update(available,blocked=false,riding=false){button.hidden=!available;if(open&&(!available||blocked))setOpen(false);if(itemButton){itemButton.setAttribute('aria-pressed',String(riding));itemButton.setAttribute('aria-label',riding?'Put away hoverboard':'Equip hoverboard');itemButton.title=riding?'Put away hoverboard (H)':'Equip hoverboard (H)';}},
    get active(){return open;},
  };
}
