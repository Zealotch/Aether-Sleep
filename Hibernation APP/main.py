import os
import sys
import subprocess
import json
import eel
import time
import threading
from datetime import datetime, timedelta
import ctypes
from PIL import Image
import pystray
from winotify import Notification, audio
import activity_history
import psutil
import urllib.request
import urllib.error

def send_discord_message(webhook_url, message):
    if not webhook_url or not webhook_url.startswith("http"):
        return
    try:
        data = json.dumps({"content": message}).encode("utf-8")
        req = urllib.request.Request(webhook_url, data=data, headers={
            "Content-Type": "application/json",
            "User-Agent": "AetherSleep/3.0"
        })
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f"Discord Webhook error: {e}")

try:
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    from ctypes import POINTER
    from comtypes import CLSCTX_ALL
    PYCAW_AVAILABLE = True
except ImportError:
    PYCAW_AVAILABLE = False

tray_icon_instance = None

class SchedulerState:
    def __init__(self):
        self.is_scheduled = False
        self.target_time = None
        self.current_action = None
        self.current_mode = None
        self.prevent_sleep_flag = False
        self.notified_5min = False
        self.notified_1min = False
        self.smart_trigger_config = {}
        self.extra_config = {}

state = SchedulerState()


# Utility Functions
def get_resource_dir():
    # Folder tempat PyInstaller meletakkan file bawaan (UI, icon.ico)
    return getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))

def get_data_dir():
    # Folder tempat menyimpan data user (sekarang disimpan di AppData agar tidak hilang saat update)
    appdata = os.environ.get('APPDATA')
    if appdata:
        base = os.path.join(appdata, "AetherSleep")
    else:
        base = os.path.join(os.path.expanduser("~"), ".aethersleep")
    return base

def get_presets_file():
    return os.path.join(get_data_dir(), "presets.json")

def get_schedule_file():
    return os.path.join(get_data_dir(), "schedule.json")

def get_settings_file():
    return os.path.join(get_data_dir(), "settings.json")

def show_notification(title, message):
    try:
        icon_ico = os.path.join(get_resource_dir(), "icon.ico")
        icon_png = os.path.join(get_data_dir(), "icon.png")
        if not os.path.exists(icon_png) and os.path.exists(icon_ico):
            try:
                os.makedirs(get_data_dir(), exist_ok=True)
                img = Image.open(icon_ico)
                img.save(icon_png, "PNG")
            except Exception as e:
                pass
                
        icon_path = icon_png if os.path.exists(icon_png) else icon_ico
        toast = Notification(app_id="Aether Sleep", title=title, msg=message, icon=icon_path)
        toast.set_audio(audio.Default, loop=False)
        toast.show()
    except Exception:
        pass

def prevent_sleep(enable=True):
    if enable:
        ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000002)
    else:
        ctypes.windll.kernel32.SetThreadExecutionState(0x80000000)

def execute_os_action(action):
    try:
        import subprocess
        if action == "hibernate":
            subprocess.Popen(["shutdown", "/h"], creationflags=subprocess.CREATE_NO_WINDOW)
        elif action == "shutdown":
            subprocess.Popen(["shutdown", "/s", "/t", "0"], creationflags=subprocess.CREATE_NO_WINDOW)
        elif action == "sleep":
            subprocess.Popen(["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"], creationflags=subprocess.CREATE_NO_WINDOW)
        return True
    except Exception as e:
        print(f"Error executing action: {e}")
        try:
            from winotify import Notification, audio
            notif = Notification(app_id="Aether Sleep", title="Eksekusi Gagal", msg=f"Gagal melakukan {action}: {e}")
            notif.set_audio(audio.Default, loop=False)
            notif.show()
        except:
            pass
        return False

def set_wake_timer(target_datetime):
    try:
        kernel32 = ctypes.windll.kernel32
        timer = kernel32.CreateWaitableTimerW(None, True, "AetherSleepWakeTimer")
        
        if not timer:
            return
            
        diff_seconds = (target_datetime - datetime.now()).total_seconds()
        if diff_seconds <= 0:
            return
            
        delay = ctypes.c_longlong(int(-diff_seconds * 10000000))
        kernel32.SetWaitableTimer(timer, ctypes.byref(delay), 0, None, None, True)
    except Exception as e:
        print(f"Error setting wake timer: {e}")

def parse_wake_time(time_str):
    if not time_str:
        return None
    try:
        hr, mn = map(int, time_str.split(':'))
        now = datetime.now()
        target = now.replace(hour=hr, minute=mn, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        return target
    except Exception as e:
        return None

# Eel API Functions
@eel.expose
def set_topmost(topmost):
    try:
        import ctypes.wintypes
        hwnd = ctypes.windll.user32.FindWindowW(None, "Power Timer - Aether Sleep")
        if not hwnd: return
        HWND_TOPMOST = ctypes.wintypes.HWND(-1)
        HWND_NOTOPMOST = ctypes.wintypes.HWND(-2)
        SWP_NOMOVE = 0x0002
        SWP_NOSIZE = 0x0001
        insert_after = HWND_TOPMOST if topmost else HWND_NOTOPMOST
        ctypes.windll.user32.SetWindowPos(
            ctypes.wintypes.HWND(hwnd), insert_after,
            0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE
        )
    except Exception as e:
        print("Error setting topmost:", e)

@eel.expose
def get_current_state():
    if not state.is_scheduled:
        return {"status": "idle"}
    diff = 0
    if state.current_mode == "timer" and state.target_time:
        diff = max(0, (state.target_time - datetime.now()).total_seconds())
    return {
        "status": "running",
        "mode": state.current_mode,
        "action": state.current_action,
        "remaining_seconds": diff,
        "target_time": state.target_time.isoformat() if state.target_time else None
    }

@eel.expose
def check_existing_schedule():
    
    schedule_file = get_schedule_file()
    if os.path.exists(schedule_file):
        try:
            with open(schedule_file, 'r') as f:
                data = json.load(f)
            
            # If state.target_time is in the past or missing for timer, it's invalid unless it's download mode
            if data.get("mode") == "timer":
                tt_str = data.get("target_time")
                if not tt_str:
                    return None
                tt = datetime.fromisoformat(tt_str)
                if tt <= datetime.now():
                    os.remove(schedule_file)
                    return None
            else:
                tt_str = None
                
            state.is_scheduled = True
            state.current_action = data.get("action")
            state.current_mode = data.get("mode", "timer")
            state.prevent_sleep_flag = data.get("prevent_sleep", False)
            state.target_time = datetime.fromisoformat(tt_str) if tt_str else None
            
            state.smart_trigger_config = data.get("smart_config", {})
            state.extra_config = data.get("extra_config", {})
            
            if state.target_time:
                diff = (state.target_time - datetime.now()).total_seconds()
                state.notified_5min = diff <= 300
                state.notified_1min = diff <= 60
            else:
                state.notified_5min = False
                state.notified_1min = False
            
            return {
                "action": state.current_action,
                "target_time": tt_str,
                "prevent_sleep": state.prevent_sleep_flag,
                "mode": state.current_mode,
                "smart_config": state.smart_trigger_config,
                "extra_config": state.extra_config
            }
        except Exception:
            pass
    return None

@eel.expose
def schedule(minutes, action="hibernate", prevent=True, mode="timer", smart_type="network", smart_threshold=50, smart_duration=5, fade_out=False, wake_time="", discord_webhook=""):
    if state.is_scheduled:
        return {"status": "error", "message": "Jadwal sudah aktif."}
    
    state.current_action = action
    state.current_mode = mode
    state.prevent_sleep_flag = prevent
    
    if mode == "smart":
        state.smart_trigger_config = {
            "type": smart_type,
            "threshold": smart_threshold, # Can be string for process
            "duration": float(smart_duration) * 60 # convert to seconds
        }
    
    state.extra_config = {
        "fade_out": fade_out,
        "wake_time": wake_time,
        "discord_webhook": discord_webhook
    }
    
    if mode == "timer":
        state.target_time = datetime.now() + timedelta(minutes=int(minutes))
        tt_str = state.target_time.isoformat()
        state.notified_5min = int(minutes) < 5
        state.notified_1min = int(minutes) < 1
    else:
        state.target_time = None
        tt_str = None
        state.notified_5min = False
        state.notified_1min = False
        
    state.is_scheduled = True
    
    if state.prevent_sleep_flag:
        prevent_sleep(True)
        
    os.makedirs(get_data_dir(), exist_ok=True)
    with open(get_schedule_file(), 'w') as f:
        json.dump({
            "action": state.current_action,
            "target_time": tt_str,
            "prevent_sleep": state.prevent_sleep_flag,
            "mode": state.current_mode,
            "smart_config": state.smart_trigger_config,
            "extra_config": state.extra_config
        }, f)
        
    history_msg = f"Menjadwalkan {action.upper()} ({mode.capitalize()})"
    if mode == "timer":
        history_msg += f" untuk {state.target_time.strftime('%H:%M')}"
    elif mode == "smart":
        history_msg += f" (Trigger: {smart_type})"
    activity_history.add_history(history_msg, "schedule", action)
    
    if discord_webhook:
        send_discord_message(discord_webhook, f"⏳ **Aether Sleep**: {history_msg}")
        
    return {"status": "success", "target_time": tt_str}

@eel.expose
def cancel():
    global tray_icon_instance
    if tray_icon_instance:
        tray_icon_instance.title = "Aether Sleep"
    state.is_scheduled = False
    state.target_time = None
    state.current_action = None
    state.current_mode = None
    if state.prevent_sleep_flag:
        prevent_sleep(False)
    state.prevent_sleep_flag = False
    
    try:
        os.remove(get_schedule_file())
    except Exception as e:
        pass
    activity_history.add_history("Membatalkan jadwal sleep", "cancel")
    
    webhook = state.extra_config.get("discord_webhook")
    if webhook:
        send_discord_message(webhook, "❌ **Aether Sleep**: Jadwal dibatalkan oleh user.")
    
    return {"status": "success"}

def tray_cancel_schedule():
    if state.is_scheduled:
        cancel()
        try:
            if len(eel._websockets) > 0:
                eel.sync_cancel_from_backend()()
        except Exception:
            pass
        show_notification("Jadwal Dibatalkan", "Jadwal timer berhasil dibatalkan dari tray.")
    else:
        show_notification("Info", "Tidak ada jadwal yang sedang aktif.")

# Window Controls
def get_hwnd():
    return ctypes.windll.user32.FindWindowW(None, "Power Timer - Aether Sleep")

@eel.expose
def start_drag():
    hwnd = get_hwnd()
    if hwnd:
        ctypes.windll.user32.ReleaseCapture()
        ctypes.windll.user32.SendMessageW(hwnd, 0x00A1, 2, 0) # WM_NCLBUTTONDOWN, HTCAPTION

@eel.expose
def minimize_window():
    hwnd = get_hwnd()
    if hwnd:
        ctypes.windll.user32.ShowWindow(hwnd, 6) # SW_MINIMIZE

@eel.expose
def close_window():
    on_exit(None, None)

@eel.expose
def execute_action(action):
    cancel()
    activity_history.add_history(f"Mengeksekusi aksi: {action.upper()}", "execute", action)
    success = execute_os_action(action)
    if success:
        os._exit(0)
    return {"status": "success" if success else "error"}

@eel.expose
def get_presets():
    try:
        with open(get_presets_file(), 'r') as f:
            return json.load(f)
    except Exception as e:
        return [15, 30, 45, 60]

@eel.expose
def add_preset(minutes):
    presets = get_presets()
    if minutes not in presets:
        presets.append(minutes)
        presets.sort()
        os.makedirs(get_data_dir(), exist_ok=True)
        with open(get_presets_file(), 'w') as f:
            json.dump(presets, f)
    return presets

@eel.expose
def remove_preset(minutes):
    presets = get_presets()
    if minutes in presets:
        presets.remove(minutes)
        os.makedirs(get_data_dir(), exist_ok=True)
        with open(get_presets_file(), 'w') as f:
            json.dump(presets, f)
    return presets

@eel.expose
def get_history():
    return activity_history.get_history()

@eel.expose
def get_stats():
    return activity_history.get_stats()

@eel.expose
def get_setting(key, default_val=None):
    try:
        with open(get_settings_file(), 'r') as f:
            data = json.load(f)
            return data.get(key, default_val)
    except Exception as e:
        return default_val

@eel.expose
def save_setting(key, value):
    try:
        os.makedirs(get_data_dir(), exist_ok=True)
        data = {}
        if os.path.exists(get_settings_file()):
            with open(get_settings_file(), 'r') as f:
                data = json.load(f)
        data[key] = value
        with open(get_settings_file(), 'w') as f:
            json.dump(data, f)
        return True
    except Exception as e:
        return False

# Background Timer Logic
def background_timer_loop():
    global tray_icon_instance
    
    consecutive_idle_seconds = 0
    last_net_io = psutil.net_io_counters()
    
    fade_started = False
    fade_start_time = None
    initial_volume = 1.0
    fade_duration_secs = 300 # 5 minutes default
    
    def trigger_action():
        action_to_exec = state.current_action
        if state.extra_config.get("wake_time"):
            target_dt = parse_wake_time(state.extra_config.get("wake_time"))
            if target_dt:
                set_wake_timer(target_dt)
        activity_history.add_history(f"Mengeksekusi aksi: {action_to_exec.upper()}", "execute", action_to_exec)
        
        webhook = state.extra_config.get("discord_webhook")
        if webhook:
            send_discord_message(webhook, f"🚀 **Aether Sleep**: Mengeksekusi {action_to_exec.upper()} sekarang. Sampai jumpa!")
            
        cancel()
        execute_os_action(action_to_exec)
        sys.exit(0)
    
    while True:
        try:
            if state.is_scheduled:
                if state.current_mode == "timer" and state.target_time:
                    now = datetime.now()
                    diff = (state.target_time - now).total_seconds()
                    
                    if diff <= 300 and not state.notified_5min:
                        show_notification("Peringatan 5 Menit", f"Komputer akan segera {state.current_action.upper()} dalam 5 menit.")
                        state.notified_5min = True
                        webhook = state.extra_config.get("discord_webhook")
                        if webhook:
                            send_discord_message(webhook, f"⚠️ **Aether Sleep Peringatan**: PC akan {state.current_action.upper()} dalam 5 menit!")
                    
                    if diff <= 60 and not state.notified_1min:
                        show_notification("Peringatan 1 Menit", f"Komputer akan segera {state.current_action.upper()} dalam 1 menit. Simpan pekerjaan Anda!")
                        state.notified_1min = True
                        
                    if tray_icon_instance:
                        total_secs = int(diff)
                        m = total_secs // 60
                        s = total_secs % 60
                        new_title = f"{m:02d}:{s:02d} - Power Timer"
                        if tray_icon_instance.title != new_title:
                            tray_icon_instance.title = new_title
                        
                    # Audio Fade-Out Logic
                    if state.extra_config.get("fade_out") and PYCAW_AVAILABLE:
                        if diff <= fade_duration_secs and not fade_started:
                            fade_started = True
                            fade_start_time = now
                            try:
                                devices = AudioUtilities.GetSpeakers()
                                interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                                volume = ctypes.cast(interface, POINTER(IAudioEndpointVolume))
                                initial_volume = volume.GetMasterVolumeLevelScalar()
                            except Exception as e:
                                pass
                        
                        if fade_started and fade_start_time:
                            elapsed = (now - fade_start_time).total_seconds()
                            ratio = max(0, 1.0 - (elapsed / fade_duration_secs))
                            try:
                                devices = AudioUtilities.GetSpeakers()
                                interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                                volume = ctypes.cast(interface, POINTER(IAudioEndpointVolume))
                                volume.SetMasterVolumeLevelScalar(initial_volume * ratio, None)
                            except Exception as e:
                                pass
                        
                    if diff <= 0:
                        trigger_action()
                        state.notified_5min = False
                        state.notified_1min = False
                
                elif state.current_mode == "smart":
                    if tray_icon_instance:
                        new_title = "SMART MONITORING"
                        if tray_icon_instance.title != new_title:
                            tray_icon_instance.title = new_title
                            
                    stype = state.smart_trigger_config.get("type")
                    thresh = state.smart_trigger_config.get("threshold")
                    dur = state.smart_trigger_config.get("duration", 300)
                    
                    is_idle = False
                    
                    if stype == "cpu":
                        cpu_percent = psutil.cpu_percent(interval=None)
                        if cpu_percent < float(thresh):
                            is_idle = True
                    elif stype == "network":
                        current_net_io = psutil.net_io_counters()
                        # Calculate bytes per second (since loop is ~1s)
                        bytes_recv = current_net_io.bytes_recv - last_net_io.bytes_recv
                        bytes_sent = current_net_io.bytes_sent - last_net_io.bytes_sent
                        last_net_io = current_net_io
                        
                        total_kbps = (bytes_recv + bytes_sent) / 1024.0
                        if total_kbps < float(thresh):
                            is_idle = True
                    elif stype == "battery":
                        battery = psutil.sensors_battery()
                        if battery:
                            # Trigger if not plugged in AND percentage is below threshold
                            if not battery.power_plugged and battery.percent <= float(thresh):
                                is_idle = True
                    
                    if is_idle:
                        consecutive_idle_seconds += 1
                        if consecutive_idle_seconds >= dur:
                            trigger_action()
                    else:
                        consecutive_idle_seconds = 0
            
            # Reset flags if cancelled
            if not state.is_scheduled:
                state.notified_5min = False
                state.notified_1min = False
                consecutive_idle_seconds = 0
                fade_started = False
                
        except Exception as e:
            print(f"Error in background timer: {e}")
            
        time.sleep(1)

# Main Application Start
if __name__ == '__main__':
    # Single Instance Lock
    mutex_name = "Global\\AetherSleep_Mutex_v1"
    kernel32 = ctypes.windll.kernel32
    mutex = kernel32.CreateMutexW(None, False, mutex_name)
    last_error = kernel32.GetLastError()
    if last_error == 183: # ERROR_ALREADY_EXISTS
        user32 = ctypes.windll.user32
        hwnd = user32.FindWindowW(None, "Power Timer - Aether Sleep")
        if hwnd:
            if user32.IsIconic(hwnd):
                user32.ShowWindow(hwnd, 9) # SW_RESTORE
            user32.SetForegroundWindow(hwnd)
        sys.exit(0)

    # Initialize Eel with extracted UI folder
    ui_folder = os.path.join(get_resource_dir(), "UI", "extracted")
    eel.init(ui_folder)
    
    # Load initial state from file
    check_existing_schedule()
    
    # Start background timer thread
    threading.Thread(target=background_timer_loop, daemon=True).start()
    
    # Setup System Tray
    icon_img = Image.open(os.path.join(get_resource_dir(), "icon.ico"))

    def on_exit(icon, item):
        icon.stop()
        sys.exit(0)
    
    def show_window():
        try:
            if len(eel._websockets) > 0:
                hwnd = ctypes.windll.user32.FindWindowW(None, "Power Timer - Aether Sleep")
                if hwnd:
                    ctypes.windll.user32.ShowWindow(hwnd, 9)
                    ctypes.windll.user32.SetForegroundWindow(hwnd)
            else:
                eel.show('index.html')
        except Exception as e:
            print("Failed to start window", e)
            
    def tray_thread_func():
        global tray_icon_instance
        menu = pystray.Menu(
            pystray.MenuItem("Buka Aplikasi", lambda i, it: show_window(), default=True),
            pystray.MenuItem("Hapus Jadwal", lambda i, it: tray_cancel_schedule()),
            pystray.MenuItem("Keluar", on_exit)
        )
        tray_icon_instance = pystray.Icon("AetherSleep", icon_img, "Aether Sleep", menu)
        tray_icon_instance.run()

    threading.Thread(target=tray_thread_func, daemon=True).start()
    
    # Start Eel (with block=False, eel doesn't block if we run the server, but we need to keep python alive)
    def close_callback(page, sockets):
        minimize_tray = get_setting('minimizeTray', True)
        if not minimize_tray:
            sys.exit(0)
        
    try:
        eel.start('index.html', size=(900, 600), block=False, close_callback=close_callback)
    except Exception as e:
        print("Failed to start Edge/Chrome", e)
    
    # Keep the main thread alive forever so Eel WebSocket keeps running
    while True:
        eel.sleep(1.0)
