export type Household = { id: string; name: string; tower: string; floor: number; unit: string; generation: number; demand: number; eligible: boolean }
export type Apartment = { id: string; name: string; place: string; towers: string[]; capacity: number; households: Household[] }
export type Transaction = { id: string; apartmentId: string; producer: string; consumer: string; kwh: number; interval: string; price: number; savings: number; simulated: true; createdAt: string }

const floors = (tower: string, count: number, offset: number) => Array.from({length: count}, (_, i) => ({id:`${tower}-${i+1}`, name:`Resident ${tower}-${String(i+1).padStart(2,'0')}`, tower, floor: Math.floor(i/4)+1+offset, unit:`${tower}${String(i+1).padStart(2,'0')}`, generation: [8,14,4,0][i%4], demand:[5,7,10,6][i%4], eligible:i%4!==3}))
export const seedApartments: Apartment[] = [
 {id:'aurora', name:'Aurora Heights', place:'Whitefield · Bengaluru', towers:['A','B','C','D'], capacity:180, households:[...floors('A',12,0),...floors('B',12,0),...floors('C',12,0),...floors('D',12,0)]},
 {id:'citrine', name:'Citrine Grove', place:'HSR Layout · Bengaluru', towers:['A','B','C'], capacity:124, households:[...floors('A',9,0),...floors('B',9,0),...floors('C',9,0)]},
 {id:'verdant', name:'Verdant Terraces', place:'Yelahanka · Bengaluru', towers:['A','B','C','D','E'], capacity:216, households:[...floors('A',12,0),...floors('B',12,0),...floors('C',12,0),...floors('D',12,0),...floors('E',12,0)]}
]
export const demoCredentials: Record<string,{apartmentId:string; consumerId:string; householdId:string}> = {aurora:{apartmentId:'SX-AUR-104',consumerId:'BESCOM-4821',householdId:'A-1'},citrine:{apartmentId:'SX-CIT-104',consumerId:'BESCOM-5932',householdId:'A-1'},verdant:{apartmentId:'SX-VER-104',consumerId:'BESCOM-6714',householdId:'A-1'}}
export function totals(households: Household[]){const generation=households.reduce((s,h)=>s+h.generation,0), demand=households.reduce((s,h)=>s+h.demand,0);return {generation,demand,surplus:Math.max(0,generation-demand),deficit:Math.max(0,demand-generation)}}
export function allocate(households: Household[], policy:'nearest'|'balanced'='nearest'){const producers=households.filter(h=>h.eligible&&h.generation>h.demand).map(h=>({...h,remaining:h.generation-h.demand}));const consumers=households.filter(h=>h.demand>h.generation).map(h=>({...h,remaining:h.demand-h.generation}));const matches:{producer:Household;consumer:Household;kwh:number}[]=[];for(const consumer of consumers){for(const producer of [...producers].sort((a,b)=>policy==='balanced'?b.remaining-a.remaining:Math.abs(a.floor-consumer.floor)-Math.abs(b.floor-consumer.floor))){if(producer.id===consumer.id||producer.remaining<=0||consumer.remaining<=0)continue;const kwh=Math.min(producer.remaining,consumer.remaining);matches.push({producer,consumer,kwh});producer.remaining-=kwh;consumer.remaining-=kwh}}return {matches,remainingSurplus:producers.reduce((s,p)=>s+p.remaining,0),unmetDemand:consumers.reduce((s,c)=>s+c.remaining,0)}}
export function loadState(){if(typeof window==='undefined')return {apartments:seedApartments,transactions:[] as Transaction[],verified:null as null|{apartmentId:string;householdId:string}};try{const raw=localStorage.getItem('sunxchange-state');if(!raw)return {apartments:seedApartments,transactions:[],verified:null};const parsed=JSON.parse(raw);return {apartments:Array.isArray(parsed.apartments)?parsed.apartments:seedApartments,transactions:Array.isArray(parsed.transactions)?parsed.transactions:[],verified:parsed.verified||null}}catch{return {apartments:seedApartments,transactions:[],verified:null}}}
export function saveState(state: ReturnType<typeof loadState>){if(typeof window!=='undefined')localStorage.setItem('sunxchange-state',JSON.stringify(state))}
export function resetState(){if(typeof window!=='undefined')localStorage.removeItem('sunxchange-state')}
export function getDemoApartmentId(id:string){return demoCredentials[id]?.apartmentId||''}
export function getDemoConsumerId(id:string){return demoCredentials[id]?.consumerId||''}
export function getDemoHousehold(id:string){return demoCredentials[id]?.householdId||''}
export function cloneSeed(){return JSON.parse(JSON.stringify(seedApartments)) as Apartment[]}
export function csv(transactions:Transaction[]){return ['id,apartment,producer,consumer,kwh,interval,savings,simulated',...transactions.map(t=>[t.id,t.apartmentId,t.producer,t.consumer,t.kwh,t.interval,t.savings,'true'].join(','))].join('\n')}
export function chartData(households:Household[]){const t=totals(households);return [{time:'06:00',solar:Math.round(t.generation*.08),demand:Math.round(t.demand*.18)},{time:'09:00',solar:Math.round(t.generation*.3),demand:Math.round(t.demand*.3)},{time:'12:00',solar:Math.round(t.generation*.56),demand:Math.round(t.demand*.28)},{time:'15:00',solar:Math.round(t.generation*.42),demand:Math.round(t.demand*.25)},{time:'18:00',solar:Math.round(t.generation*.1),demand:Math.round(t.demand*.42)},{time:'21:00',solar:0,demand:Math.round(t.demand*.28)}]}
export const allHouseholds=(apartments:Apartment[])=>apartments.flatMap(a=>a.households)
export const savings=(kwh:number,grid:number,sharing:number,charges:number)=>kwh*(grid-sharing-charges)
export const getApartment=(apartments:Apartment[],id:string)=>apartments.find(a=>a.id===id)||apartments[0]
export const net=(h:Household)=>h.generation-h.demand
export const uniqueFloors=(households:Household[])=>Array.from(new Set(households.map(h=>h.floor))).sort((a,b)=>a-b)
export const defaultState=()=>({apartments:cloneSeed(),transactions:[] as Transaction[],verified:null as null|{apartmentId:string;householdId:string}})
export type AppState=ReturnType<typeof defaultState>
