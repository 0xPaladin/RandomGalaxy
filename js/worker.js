import*as _utils from './utils.js';
import {System} from './system.js';

console.time("WorkerGalaxyInit")
let _g = Array.from({ length: 2000 },(v,i)=> System(i))
console.timeEnd("WorkerGalaxyInit")

//send initial systems 
postMessage({
  id: "init",
  data: _g
})

onmessage = (e)=>{
  const workerResult = `Result: ${e.data[0] * e.data[1]}`;
  postMessage(workerResult);
}
