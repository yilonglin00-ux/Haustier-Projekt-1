#!/usr/bin/env node
/**
 * tools/spieltest.mjs — Prüft die Spielregeln ohne Browser.
 *
 * Aktionen, Abklingzeiten, Level, verzweigte Entwicklung, Eier, Expeditionen,
 * Tagesaufgaben und Erfolge. Zum Schluss wird jede der 114 Arten einmal
 * erzeugt, damit kein Datenfehler unbemerkt bleibt:
 *
 *   node tools/spieltest.mjs
 */
class LS { constructor(){this.m=new Map();} getItem(k){return this.m.has(k)?this.m.get(k):null;} setItem(k,v){this.m.set(k,String(v));} removeItem(k){this.m.delete(k);} }
globalThis.localStorage = new LS();
globalThis.requestAnimationFrame = (fn)=>setTimeout(()=>fn(0),0);
globalThis.Blob = class { constructor(p){ this.size=p.join('').length; } };
const B = new URL('../src/', import.meta.url).href;
const state=await import(B+'core/state.js');
const pets=await import(B+'systems/pets.js');
const evo=await import(B+'systems/evolution.js');
const act=await import(B+'systems/actions.js');
const inv=await import(B+'systems/inventory.js');
const eggs=await import(B+'systems/eggs.js');
const exp=await import(B+'systems/expeditions.js');
const quests=await import(B+'systems/quests.js');
const ach=await import(B+'systems/achievements.js');
const species=await import(B+'data/species.js');

const r=[]; const p=(n,ok,z='')=>r.push(`${ok?'✅':'❌'} ${n}${z?' — '+z:''}`);
state.setState(state.createNewSave());
state.update(s=>{ s.flags.starterGewaehlt=true; });

// Aktionen
const pet=pets.createPet('flammkitz'); pets.adoptPet(pet,'test');
inv.addItem('koernermix',10); inv.addItem('wasserflasche',10);
const vorher=pet.beduerfnisse.hunger;
const a1=act.performAction('fuettern',pet.id,{});
p('Füttern wirkt', a1.ok && state.getState().haustiere[0].beduerfnisse.hunger>vorher);
const a2=act.performAction('streicheln',pet.id,{});
p('Streicheln gibt Zuneigung', a2.ok && state.getState().haustiere[0].gefuehle.zuneigung>10);
p('Abklingzeit greift', act.performAction('streicheln',pet.id,{}).ok===false);

// Level & Entwicklung
pets.grantXp(pet.id, 40000);
const lvl=state.getState().haustiere[0].level;
p('Level steigt', lvl>=15, 'Level '+lvl);
state.update(s=>{ s.haustiere[0].gefuehle.zuneigung=100; s.haustiere[0].gefuehle.vertrauen=100; });
const schritt=evo.checkEvolution(pet.id);
p('Entwicklung möglich', !!schritt, schritt?('→ '+schritt.zu):'');
const e=evo.evolvePet(pet.id, schritt);
p('Entwicklung führt aus', e.ok, e.ok?(e.von.name+' → '+e.zu.name):e.grund);
p('Buch vermerkt neue Art', !!state.getState().buch[e.zu?.id]?.gefangen);

// Verzweigung: Bedingungen der Starter greifen unterschiedlich
const zweig=species.species('flammkitz').entwicklung;
p('Flammkitz hat zwei Wege', zweig.length===2, zweig.map(x=>x.zu).join(' / '));

// Eier
const ei=eggs.addEgg('normal');
p('Ei angelegt', ei.ok);
state.update(s=>{ s.eier[0].schluepftAm = Date.now()-1; });
const schlupf=eggs.hatchEgg(state.getState().eier[0].id);
p('Ei schlüpft', schlupf.ok, schlupf.ok?schlupf.pet.name:schlupf.grund);
p('Zwei Haustiere', state.getState().haustiere.length===2);

// Expedition
const reise=exp.startExpedition(pet.id,'heimatwiese');
p('Expedition startet', reise.ok, reise.ok?'':reise.grund);
state.update(s=>{ s.expeditionen[0].endet=Date.now()-1; });
const beute=exp.collectExpedition(state.getState().expeditionen[0].id);
p('Beute abgeholt', beute.ok && beute.beute.muenzen>0, beute.ok?(beute.beute.muenzen+' Münzen, '+beute.beute.gegenstaende.length+' Fundstücke'):beute.grund);

// Aufgaben & Erfolge
quests.ensureTodaysQuests();
p('Vier Tagesaufgaben', state.getState().aufgaben.liste.length===4);
const neu=ach.checkAchievements();
p('Erfolge schalten frei', ach.unlockedCount()>0, ach.unlockedCount()+' freigeschaltet');

// Alle Arten erzeugbar
let fehler=0;
for (const art of species.SPECIES) { try { pets.createPet(art.id); } catch { fehler++; } }
p('Alle 114 Arten erzeugbar', fehler===0, fehler?fehler+' fehlerhaft':'');

console.log(r.join('\n'));
const bad=r.filter(x=>x.startsWith('❌'));
console.log(bad.length ? `\n❌ ${bad.length} Prüfung(en) fehlgeschlagen.` : '\n✅ Alle Prüfungen bestanden.');
process.exit(bad.length ? 1 : 0);
