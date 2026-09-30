import {
  mergeLearningStores,
  mergeLearningStoresFromBaseline,
} from "./account-client.js";

const assert=(v,m)=>{if(!v)throw new Error(m);};

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

const safeFallback=mergeLearningStores(local,remote);
assert(safeFallback.records["b::name"],"local-only skill lost");
assert(safeFallback.records["c::find"],"remote-only skill lost");
assert(safeFallback.records["a::find"].wrong===1,"mistake lost");
assert(safeFallback.confusions["find::a::c"].count===2,"confusion history lost");

const baseline={
  version:1,
  updatedAt:100,
  records:{
    "a::find":{
      attempts:5,correct:5,wrong:0,lastSeen:100,reviewDebt:0,
      reviewCount:1,lapses:0,cleanStreak:1,stabilityDays:1,
      lastReviewedAt:100,dueAt:1000,lastOutcome:"clean"
    }
  },
  confusions:{
    "find::a::c":{
      skillId:"find",expectedMuscleId:"a",chosenMuscleId:"c",
      count:2,lastSeen:100
    }
  },
  sessions:[{sessionId:"base",completedAt:100}]
};

const phone={
  version:1,
  updatedAt:300,
  records:{
    "a::find":{
      attempts:6,correct:6,wrong:0,lastSeen:300,reviewDebt:0,
      reviewCount:2,lapses:0,cleanStreak:2,stabilityDays:2,
      lastReviewedAt:300,dueAt:2000,lastOutcome:"clean"
    }
  },
  confusions:{
    "find::a::c":{
      skillId:"find",expectedMuscleId:"a",chosenMuscleId:"c",
      count:3,lastSeen:300
    }
  },
  sessions:[
    {sessionId:"base",completedAt:100},
    {sessionId:"phone",completedAt:300}
  ]
};

const serverAfterLaptop={
  version:1,
  updatedAt:310,
  records:{
    "a::find":{
      attempts:6,correct:5,wrong:1,lastSeen:310,reviewDebt:1,
      reviewCount:2,lapses:1,cleanStreak:0,stabilityDays:.5,
      lastReviewedAt:310,dueAt:900,lastOutcome:"corrected"
    }
  },
  confusions:{
    "find::a::c":{
      skillId:"find",expectedMuscleId:"a",chosenMuscleId:"c",
      count:4,lastSeen:310
    }
  },
  sessions:[
    {sessionId:"base",completedAt:100},
    {sessionId:"laptop",completedAt:310}
  ]
};

const concurrent=mergeLearningStoresFromBaseline(phone,serverAfterLaptop,baseline);
const record=concurrent.records["a::find"];
assert(record.attempts===7,"concurrent attempts were lost");
assert(record.correct===6,"concurrent correct answer was lost");
assert(record.wrong===1,"concurrent mistake was lost");
assert(record.reviewCount===3,"concurrent review count was lost");
assert(record.lapses===1,"concurrent lapse count is wrong");
assert(record.reviewDebt===1,"latest unresolved mistake state was lost");
assert(record.lastReviewedAt===310,"latest scheduling event was not preserved");
assert(
  concurrent.confusions["find::a::c"].count===5,
  "concurrent confusion increments were lost"
);
const sessionIds=new Set(concurrent.sessions.map(x=>x.sessionId));
assert(sessionIds.has("phone")&&sessionIds.has("laptop"),"concurrent session history was lost");

const anonymous=mergeLearningStoresFromBaseline(
  {version:1,updatedAt:20,records:{"a::find":{attempts:2,correct:2,wrong:0,lastSeen:20}},confusions:{},sessions:[]},
  {version:1,updatedAt:10,records:{"a::find":{attempts:3,correct:2,wrong:1,lastSeen:10}},confusions:{},sessions:[]},
  {version:1,updatedAt:0,records:{},confusions:{},sessions:[]}
);
assert(anonymous.records["a::find"].attempts===5,"anonymous progress import was not additive");
assert(anonymous.records["a::find"].correct===4,"anonymous correct answers were not additive");
assert(anonymous.records["a::find"].wrong===1,"anonymous mistake import was lost");

console.log("OK: account progress merge preserves independent, concurrent and anonymous work");
