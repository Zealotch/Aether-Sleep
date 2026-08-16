import os
import sys
import time
import ctypes
from datetime import datetime

# Prevent Eel from starting the UI
sys.argv.append('--test')
import main

class MockEel:
    def __init__(self):
        self._websockets = []
    def expose(self, func):
        return func
    def sync_cancel_from_backend(self):
        return lambda: None
    def get_current_state(self):
        return lambda: main.get_current_state()

main.eel = MockEel()

print("--- STARTING TESTS ---")

print("\n--- Test 2: Timer Cancellation ---")
# schedule
main.schedule(5, "sleep", True, "timer")
time.sleep(1)
print("State is_scheduled after schedule:", main.state.is_scheduled)
# cancel
main.cancel()
print("State is_scheduled after cancel:", main.state.is_scheduled)

print("\n--- Test 3: Scheduler Replacement ---")
# schedule 5 menit
main.schedule(5, "sleep", True, "timer")
tt1 = main.state.target_time
print("Scheduled 5m at:", tt1)
# before selesai ganti menjadi 10 menit
main.cancel() # UI implicitly cancels when we schedule a new one on top
main.schedule(10, "sleep", True, "timer")
tt2 = main.state.target_time
print("Scheduled 10m at:", tt2)
if tt2 > tt1:
    print("PASS: Only 10m schedule is active.")
else:
    print("FAIL: Times don't match expectation.")
main.cancel()

print("\n--- Test 4: Smart Trigger ---")
# Set a smart trigger for cpu < 50 for 5 seconds
main.schedule(0, "sleep", True, "smart", smart_type="cpu", smart_threshold=50, smart_duration=0.08333) # 5 seconds
main.cancel()

print("\n--- Test 6: Prevent Sleep Cleanup ---")
main.schedule(5, "sleep", True, "timer")
print("prevent_sleep_flag after schedule:", main.state.prevent_sleep_flag)
main.cancel()
print("prevent_sleep_flag after cancel:", main.state.prevent_sleep_flag)

print("\n--- TESTS COMPLETE ---")
