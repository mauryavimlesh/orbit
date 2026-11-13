// Normalized Newtonian two-body relative motion: distance AU, time years, mu=4*pi^2 AU^3/yr^2.
// This is a point-mass model, not an N-body ephemeris.
export const MU = 4 * Math.PI * Math.PI;
export const INITIAL_RADIUS = 1;
export const CIRCULAR_SPEED = Math.sqrt(MU / INITIAL_RADIUS);
export const ESCAPE_MULTIPLIER = Math.sqrt(2);
export function initialState(speedMultiplier = 1, gravityMultiplier = 1) {
  if (!(Number.isFinite(speedMultiplier) && speedMultiplier >= 0 && Number.isFinite(gravityMultiplier) && gravityMultiplier > 0)) throw new RangeError('Invalid speed/gravity');
  return {x:1,y:0,vx:0,vy:CIRCULAR_SPEED*speedMultiplier,t:0,gravity:gravityMultiplier};
}
export function acceleration(x,y,gravity=1){
  const r2=x*x+y*y;
  if (!Number.isFinite(r2)||r2<1e-12) throw new RangeError('Singular/invalid radius');
  const f=-MU*gravity/(r2*Math.sqrt(r2));return {x:f*x,y:f*y};
}
export function step(state,dt){
  if (!Number.isFinite(dt)||dt<=0||dt>0.01) throw new RangeError('dt must be between 0 and 0.01 years');
  const a=acceleration(state.x,state.y,state.gravity);
  const x=state.x+state.vx*dt+0.5*a.x*dt*dt;
  const y=state.y+state.vy*dt+0.5*a.y*dt*dt;
  const b=acceleration(x,y,state.gravity);
  return {...state,x,y,vx:state.vx+0.5*(a.x+b.x)*dt,vy:state.vy+0.5*(a.y+b.y)*dt,t:state.t+dt};
}
export function invariants(s){
  const r=Math.hypot(s.x,s.y);const v2=s.vx*s.vx+s.vy*s.vy;
  const energy=0.5*v2-MU*s.gravity/r;
  const h=s.x*s.vy-s.y*s.vx;
  const e=Math.sqrt(Math.max(0,1+2*energy*h*h/Math.pow(MU*s.gravity,2)));
  return {r,speed:Math.sqrt(v2),energy,angularMomentum:h,eccentricity:e};
}
export function classify(s){
  const {energy,eccentricity}=invariants(s);
  if (Math.abs(energy) < 1e-7) return 'parabolic';
  if(energy>0)return 'unbound';
  if(eccentricity<0.012)return 'circular';
  return 'elliptical';
}
export function trajectory(speed=1,gravity=1,{steps=1300,dt=0.0015}={}){
  let s=initialState(speed,gravity);const states=[s];let warning=null;
  for(let i=0;i<steps;i++){
    try{s=step(s,dt);if(Math.hypot(s.x,s.y)<0.055){warning='Entered illustrative collision radius';break;}if(Math.hypot(s.x,s.y)>6){warning='Beyond viewport range';break;}states.push(s);}catch(e){warning=e.message;break;}
  }
  return {states,warning,classification:classify(states[0]),initial:invariants(states[0])};
}
