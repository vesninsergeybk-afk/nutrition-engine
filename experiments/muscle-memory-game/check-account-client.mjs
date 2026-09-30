import { mergeLearningStores } from "./account-client.js";

const local={version:1,updatedAt:200,records:{
  "a::find":{attempts:3,correct:2,wrong:1,lastSeen:200,reviewDebt:1,reviewCount:2,lapses:1},
  "b::name":{attempts:1,correct:1,wrong:0,lastSeen:190,reviewDebt:0}
},confusions:{"find::a::c":{skillId:"find",expectedMuscleId:"a",chosenMuscleId:"c",count:2,lastSeen:200}},sessions:[{sessionId:"local",completedAt:200}]};

const remote={version:1,updatedAt:180,records:{
  "a::find":{attempts:2,correct:2,wrong:0,lastSeen:180,reviewDebt:0,reviewCount:1,lapses:0},
  "c::find":{attempts:1,correct:0,wrong:1,lastSeen:170,reviewDebt:1}
},confusions:{
  "find::a::c":{skillId:"find",expectedMuscleId:"a",chosenMuscleId:"c",count:1,lastSeen:180},
  "find::c::a":{skillId:"find",expectedMuscleId:"c",chosenMuscleId:"a",count:1,lastSeen:170}
},sessions:[{sessionId:"remote",completedAt:180}]};

const merged=mergeLearningStores(local,remote);
const assert=(v,m)=>{if(!v)throw new Error(m);};
assert(merged.records["b::name"],"local-only skill lost");
assert(merged.records["c::find"],"remote-only skill lost");
assert(merged.records["a::find"].wrong===1,"mistake lost");
assert(merged.records["a::find"].reviewDebt===1,"review debt lost");
assert(merged.confusions["find::a::c"].count===2,"confusion history lost");
assert(merged.confusions["find::c::a"].count===1,"remote confusion lost");
const ids=new Set(merged.sessions.map(x=>x.sessionId));
assert(ids.has("local")&&ids.has("remote"),"session history lost");
console.log("OK: local/remote progress merge preserves skills, mistakes, confusions and sessions");
