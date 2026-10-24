#!/usr/bin/env bash
# Executed as one script by android-emulator-runner; the action runs each
# inline line as a separate shell command, so loops must live in a real file.
set -euo pipefail
adb logcat -c
adb install apk/app-debug.apk
# The calculator must boot with all Android network transports disabled.
adb shell svc wifi disable
adb shell svc data disable
adb shell am start -n ru.vesninmed.nutrient/.MainActivity
for i in $(seq 1 60); do
  if adb logcat -d -s NutrientSmoke:I '*:S' | grep -q NUTRIENT_SMOKE_READY; then
    echo "PASS: calculator initialized inside Android WebView"
    exit 0
  fi
  if adb logcat -d -s NutrientSmoke:I '*:S' | grep -q NUTRIENT_SMOKE_ERROR; then
    echo "FAIL: calculator reported startup error"
    adb logcat -d -s NutrientSmoke:I '*:S'
    exit 1
  fi
  sleep 2
done
echo "FAIL: calculator was not ready within 120 seconds"
adb logcat -d -s NutrientSmoke:I '*:S'
exit 1
