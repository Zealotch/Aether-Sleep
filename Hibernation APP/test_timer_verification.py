import sys
import time
import threading
from datetime import datetime, timedelta

# Prevent Eel from starting UI
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

# Start background timer loop for testing
threading.Thread(target=main.background_timer_loop, daemon=True).start()

execution_state_calls = []
original_set_thread_execution_state = main.ctypes.windll.kernel32.SetThreadExecutionState

def mock_set_thread_execution_state(flags):
    execution_state_calls.append((flags, threading.current_thread().name))
    return 0x80000000

main.ctypes.windll.kernel32.SetThreadExecutionState = mock_set_thread_execution_state

print("=== STARTING COMPREHENSIVE TIMER TESTS ===")

# Test 1: schedule() does NOT call SetThreadExecutionState directly on Eel/calling thread
execution_state_calls.clear()
main.schedule(30, action="hibernate", prevent=True, mode="timer")
print("1. After schedule(30, prevent=True) from calling thread:")
calling_thread_calls = [c for c in execution_state_calls if c[1] == threading.current_thread().name]
assert len(calling_thread_calls) == 0, f"FAIL: schedule() called SetThreadExecutionState on calling thread: {calling_thread_calls}"
print("   PASS: schedule() did NOT call SetThreadExecutionState on calling thread.")

# Wait for background timer loop to pick it up
time.sleep(1.5)
bg_calls = [c for c in execution_state_calls if c[1] != threading.current_thread().name]
assert len(bg_calls) > 0, "FAIL: background_timer_loop did not call SetThreadExecutionState"
last_flag = bg_calls[-1][0]
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
assert last_flag == (ES_CONTINUOUS | ES_SYSTEM_REQUIRED), f"FAIL: Expected {hex(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)}, got {hex(last_flag)}"
print(f"   PASS: background_timer_loop called SetThreadExecutionState({hex(last_flag)}) on background thread.")

# Test 2: cancel() sets state, background thread releases keep_awake
execution_state_calls.clear()
main.cancel()
print("2. After cancel():")
calling_thread_calls = [c for c in execution_state_calls if c[1] == threading.current_thread().name]
assert len(calling_thread_calls) == 0, "FAIL: cancel() called SetThreadExecutionState on calling thread"
print("   PASS: cancel() did NOT call SetThreadExecutionState on calling thread.")

time.sleep(1.5)
release_calls = [c for c in execution_state_calls if c[0] == ES_CONTINUOUS]
assert len(release_calls) > 0, "FAIL: background_timer_loop did not release execution state"
print(f"   PASS: background_timer_loop released execution state with ES_CONTINUOUS ({hex(ES_CONTINUOUS)}).")

# Test 3: Prevent Sleep OFF -> SetThreadExecutionState with ES_SYSTEM_REQUIRED is NOT called
execution_state_calls.clear()
main.schedule(30, action="hibernate", prevent=False, mode="timer")
time.sleep(1.5)
system_req_calls = [c for c in execution_state_calls if (c[0] & ES_SYSTEM_REQUIRED) != 0]
assert len(system_req_calls) == 0, f"FAIL: ES_SYSTEM_REQUIRED called when prevent=False: {system_req_calls}"
print("3. Prevent Sleep OFF:")
print("   PASS: ES_SYSTEM_REQUIRED was NOT called when prevent=False.")
main.cancel()
time.sleep(1.5)

# Test 4: Timer completion & Single Execution
actions_executed = []
def mock_execute_os_action(action):
    actions_executed.append(action)
    return True

main.execute_os_action = mock_execute_os_action

execution_state_calls.clear()
# Schedule 1 second timer (using a mock target_time set to 1 second from now)
with main.state_lock:
    main.state.is_scheduled = True
    main.state.current_action = "sleep"
    main.state.current_mode = "timer"
    main.state.prevent_sleep_flag = True
    main.state.target_time = datetime.now() + timedelta(seconds=1)

print("4. Testing timer completion & single execution:")
time.sleep(2.5)
assert len(actions_executed) == 1, f"FAIL: Action executed {len(actions_executed)} times, expected exactly 1! Actions: {actions_executed}"
print("   PASS: Action executed exactly 1 time.")
assert main.state.is_scheduled == False, "FAIL: state.is_scheduled is not False after completion"
print("   PASS: state.is_scheduled is False after completion.")

# Wait another 2 seconds to make sure it doesn't trigger again
time.sleep(2.0)
assert len(actions_executed) == 1, f"FAIL: Action re-triggered on next loop: {actions_executed}"
print("   PASS: Action was not re-triggered on subsequent loop iterations.")

print("\n=== ALL COMPREHENSIVE TESTS PASSED! ===")
sys.exit(0)
