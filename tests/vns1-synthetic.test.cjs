/* Synthetic regression scenarios; not patients and not clinical validation. */
'use strict';
const assert=require('node:assert/strict');
const core=require('../assets/js/vns1-screening-core.js');
const scenarios=[
  [
    "well",
    {
      "age": 40,
      "heightCm": 176,
      "weightKg": 74,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0
    },
    0
  ],
  [
    "missing weight change",
    {
      "age": 40,
      "weightKg": 74,
      "intakeReduced": "no",
      "almostNoIntakeDays": 0
    },
    "insufficient"
  ],
  [
    "6percent",
    {
      "age": 74,
      "heightCm": 164,
      "weightKg": 60,
      "previousWeightKg": 65,
      "weightLossIntent": "unintentional",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0
    },
    2
  ],
  [
    "intentional",
    {
      "age": 35,
      "heightCm": 178,
      "weightKg": 70,
      "previousWeightKg": 88,
      "weightLossIntent": "intentional",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0
    },
    0
  ],
  [
    "lowbmi",
    {
      "age": 70,
      "heightCm": 170,
      "weightKg": 62,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0
    },
    2
  ],
  [
    "edema",
    {
      "age": 70,
      "heightCm": 170,
      "weightKg": 62,
      "edema": true,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0
    },
    0
  ],
  [
    "severe shortage",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "yes",
      "intakeAmount": "half-or-less",
      "reducedIntakeDays": 9,
      "almostNoIntakeDays": 0
    },
    2
  ],
  [
    "some shortage",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "yes",
      "intakeAmount": "some",
      "reducedIntakeDays": 4,
      "almostNoIntakeDays": 0
    },
    1
  ],
  [
    "prolonged shortage",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "yes",
      "intakeAmount": "some",
      "reducedIntakeDays": 20,
      "almostNoIntakeDays": 0
    },
    2
  ],
  [
    "no intake five",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "yes",
      "reducedIntakeDays": 6,
      "almostNoIntakeDays": 5
    },
    2
  ],
  [
    "future anticipated",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0,
      "expectedLowIntakeDays": 5
    },
    2
  ],
  [
    "food access",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0,
      "foodAccess": "yes"
    },
    1
  ],
  [
    "functional change",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0,
      "functionDecline": "yes"
    },
    1
  ],
  [
    "breathing",
    {
      "age": 55,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0,
      "emergency": "breathing-problem"
    },
    3
  ],
  [
    "pregnant",
    {
      "age": 25,
      "heightCm": 165,
      "weightKg": 49,
      "weightLossIntent": "none",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0,
      "specialContext": "pregnancy"
    },
    "insufficient"
  ],
  [
    "dialysis edema",
    {
      "age": 63,
      "heightCm": 175,
      "weightKg": 76,
      "previousWeightKg": 84,
      "edema": true,
      "weightLossIntent": "unintentional",
      "intakeReduced": "no",
      "almostNoIntakeDays": 0,
      "specialContext": "dialysis"
    },
    1
  ]
];
const complete={emergency:'none',fluidState:'no',weightReliable:true,barriersPresent:'no',foodAccess:'no',illnessAffectsIntake:'no',functionDecline:'no',expectedLowIntakeDays:0};
for(const [name,input,expected] of scenarios){
  const data={...complete,...input};
  assert.equal(core.evaluate(data).category,expected,name);
}
assert.equal(core.evaluate({age:40,heightCm:174,weightKg:70,weightLossIntent:'none',intakeReduced:'no',almostNoIntakeDays:0}).category,'insufficient','missing sections must not mean no risk');
assert.equal(core.evaluate({...complete,age:15,weightLossIntent:'none',intakeReduced:'no',almostNoIntakeDays:0}).category,'insufficient','underage is outside scope');
assert.equal(core.evaluate({age:35,heightCm:180,weightKg:52,weightLossIntent:'none',intakeReduced:'no',almostNoIntakeDays:11}).refeedingRiskFlag,'needs-professional-review');
console.log('Synthetic behavior checks passed: '+scenarios.length+' scenarios. These checks are not clinical validation.');
