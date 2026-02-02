
export type TestModeState = {
  enabled: boolean;
  currentEventId: number;
  lastOpenAt: number;
};

const state: TestModeState = {
  enabled: false,
  currentEventId: 0,
  lastOpenAt: 0,
};

export function isTestMode(){ return state.enabled; }
export function setTestMode(v: boolean){ state.enabled = v; }
export function getEventId(){ return state.currentEventId; }
export function bumpEvent(){ state.currentEventId += 1; state.lastOpenAt = Date.now(); return state.currentEventId; }
export function getLastOpenAt(){ return state.lastOpenAt; }


let __mc:number = 0;

export function setMC(v:number){
  const n = Number(v);
  __mc = Number.isFinite(n) ? n : 0;
  return __mc;
}

export function getMC(){
  return __mc;
}
