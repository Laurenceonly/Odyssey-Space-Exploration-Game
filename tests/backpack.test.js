import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackpack} from '../src/backpack.js';

function element(){
  const classes=new Set(),listeners=new Map(),attributes={};
  return {hidden:false,inert:false,attributes,classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);},contains:name=>classes.has(name)},setAttribute(name,value){attributes[name]=value;},addEventListener(name,fn){listeners.set(name,fn);},click(){listeners.get('click')?.();},focus(){this.focused=true;}};
}
test('backpack opens without a modal and closes when exploration becomes unavailable',()=>{
  const button=element(),panel=element(),closeButton=element(),bag=createBackpack({button,panel,closeButton});
  bag.update(true);button.click();
  assert.equal(bag.active,true);assert.equal(panel.inert,false);assert.equal(panel.attributes['aria-hidden'],'false');assert.equal(button.attributes['aria-expanded'],'true');
  bag.update(true);assert.equal(bag.active,true,'ordinary movement leaves the backpack open');
  bag.update(true,true);assert.equal(bag.active,false,'other dialogs close the backpack');assert.equal(panel.inert,true);
  bag.toggle();closeButton.click();assert.equal(bag.active,false);assert.equal(button.focused,true);
  bag.toggle();bag.update(false);assert.equal(bag.active,false);assert.equal(button.hidden,true);
});
test('the hoverboard slot invokes equip and reflects its current state',()=>{
  const button=element(),panel=element(),closeButton=element(),itemButton=element();let changes=0;
  const bag=createBackpack({button,panel,closeButton,itemButton,onToggleBoard:()=>changes++});
  bag.update(true,false,false);itemButton.click();assert.equal(changes,1);
  bag.update(true,false,true);assert.equal(itemButton.attributes['aria-pressed'],'true');assert.equal(itemButton.attributes['aria-label'],'Put away hoverboard');
  bag.update(true,false,false);assert.equal(itemButton.attributes['aria-label'],'Equip hoverboard');
});
