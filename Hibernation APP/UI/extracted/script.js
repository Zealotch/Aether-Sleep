let countdownInterval;
    let targetTime = null;
    let currentMinutes = 45;

    const displayTimer = document.getElementById('display-timer');
    const startBtn = document.getElementById('start-btn');
    const statusLabel = document.getElementById('status-label');
    const pulseRing = document.getElementById('pulse-ring');
    const presetContainer = document.getElementById('preset-buttons');
    const ring = document.querySelector('.timer-ring');
    const customMinutesInput = document.getElementById('custom-minutes');
    const addPresetBtn = document.getElementById('add-preset-btn');
    const actionSelect = document.getElementById('action-select');
    const keepAwakeCheck = document.getElementById('keep-awake');
    
    const smartTriggerPanel = document.getElementById('smart-trigger-panel');
    const smartType = document.getElementById('smart-type');
    const smartThreshold = document.getElementById('smart-threshold');
    const smartDuration = document.getElementById('smart-duration');

    actionSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        eel.save_setting('lastAction', val)();
        
        if (!targetTime) {
            let baseAction = val.replace('_timer', '').replace('_smart', '');
            startBtn.innerText = `Start ${baseAction.charAt(0).toUpperCase() + baseAction.slice(1)}`;
        }
        
        if (val.includes('_smart')) {
            smartTriggerPanel.classList.remove('hidden');
            smartTriggerPanel.classList.add('flex');
            customMinutesInput.parentElement.classList.add('hidden');
            presetContainer.parentElement.classList.add('hidden');
        } else {
            smartTriggerPanel.classList.add('hidden');
            smartTriggerPanel.classList.remove('flex');
            customMinutesInput.parentElement.classList.remove('hidden');
            presetContainer.parentElement.classList.remove('hidden');
        }
    });

    const historyBtn = document.getElementById('history-btn');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');

    // Theme Logic
    const btnTheme = document.getElementById('btn-theme');
    const themeModal = document.getElementById('theme-modal');
    const btnCloseTheme = document.getElementById('btn-close-theme');
    const themeGrid = document.getElementById('theme-grid');
    
    const themes = [
        { id: 'cyan', name: 'Glow Cyan', color: '#00dbe9', light: '#dbfcff', gradient: 'linear-gradient(135deg, rgba(0,219,233,1) 0%, rgba(87,27,193,1) 100%)' },
        { id: 'ruby', name: 'Ruby Red', color: '#f43f5e', light: '#ffebee', gradient: 'linear-gradient(135deg, rgba(244,63,94,1) 0%, rgba(136,19,55,1) 100%)' },
        { id: 'emerald', name: 'Emerald Green', color: '#10b981', light: '#ecfdf5', gradient: 'linear-gradient(135deg, rgba(16,185,129,1) 0%, rgba(6,78,59,1) 100%)' },
        { id: 'amethyst', name: 'Amethyst Purple', color: '#a855f7', light: '#faf5ff', gradient: 'linear-gradient(135deg, rgba(168,85,247,1) 0%, rgba(88,28,135,1) 100%)' },
        { id: 'amber', name: 'Amber Gold', color: '#f59e0b', light: '#fffbeb', gradient: 'linear-gradient(135deg, rgba(245,158,11,1) 0%, rgba(120,53,15,1) 100%)' },
        { id: 'sapphire', name: 'Sapphire Blue', color: '#3b82f6', light: '#eff6ff', gradient: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(30,58,138,1) 100%)' },
        { id: 'sakura', name: 'Sakura Pink', color: '#f472b6', light: '#fdf2f8', gradient: 'linear-gradient(135deg, rgba(244,114,182,1) 0%, rgba(190,24,93,1) 100%)' },
        { id: 'sunset', name: 'Sunset Orange', color: '#f97316', light: '#fff7ed', gradient: 'linear-gradient(135deg, rgba(249,115,22,1) 0%, rgba(154,52,18,1) 100%)' },
        { id: 'lime', name: 'Toxic Lime', color: '#84cc16', light: '#f7fee7', gradient: 'linear-gradient(135deg, rgba(132,204,22,1) 0%, rgba(63,98,18,1) 100%)' }
    ];

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 219, 233';
    }

    // Setup Audio Context for UI Sounds
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Quick ESC to Close/Minimize
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Check if any modal is open, if so, close modal instead of app
            if (!themeModal.classList.contains('hidden')) {
                btnCloseTheme.click();
            } else if (!historyModal.classList.contains('hidden')) {
                closeHistoryBtn.click();
            } else if (!extraPanel.classList.contains('-translate-x-full')) {
                closeMenuBtn.click();
            } else {
                eel.minimize_window()();
            }
        }
    });

    function playClickSound() {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }

    function playStartSound() {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }

    function playCancelSound() {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }

    function applyTheme(themeId, save = true) {
        playClickSound();
        const theme = themes.find(t => t.id === themeId) || themes[0];
        const rgb = hexToRgb(theme.color);
        const root = document.documentElement;
        
        root.style.setProperty('--c-primary-fixed-dim', theme.color);
        root.style.setProperty('--c-primary', theme.light);
        root.style.setProperty('--timer-ring', theme.color);
        root.style.setProperty('--input-focus-border', theme.color);
        root.style.setProperty('--select-opt-selected', theme.color);
        root.style.setProperty('--btn-gradient', theme.gradient);
        
        root.style.setProperty('--panel-2-border', `rgba(${rgb}, 0.2)`);
        root.style.setProperty('--scrollbar-thumb', `rgba(${rgb}, 0.3)`);
        root.style.setProperty('--scrollbar-thumb-hover', `rgba(${rgb}, 0.6)`);
        root.style.setProperty('--select-opt-hover', `rgba(${rgb}, 0.2)`);
        
        if (save) eel.save_setting('theme', themeId)();
        renderThemeGrid(themeId);
    }

    function renderThemeGrid(currentThemeId) {
        themeGrid.innerHTML = '';
        themes.forEach(t => {
            const btn = document.createElement('button');
            const isActive = t.id === currentThemeId;
            btn.className = `flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${isActive ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`;
            btn.innerHTML = `
                <div class="w-8 h-8 rounded-full shadow-lg" style="background: ${t.color}"></div>
                <span class="text-[10px] text-center leading-tight ${isActive ? 'text-white' : 'text-on-surface-variant'}">${t.name}</span>
            `;
            btn.onclick = () => applyTheme(t.id);
            themeGrid.appendChild(btn);
        });
    }

    btnTheme.addEventListener('click', () => {
        playClickSound();
        themeModal.classList.remove('hidden');
        themeModal.classList.add('flex');
        setTimeout(() => {
            themeModal.classList.remove('opacity-0');
            themeModal.querySelector('div').classList.remove('scale-95');
        }, 10);
    });

    btnCloseTheme.addEventListener('click', () => {
        themeModal.classList.add('opacity-0');
        themeModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            themeModal.classList.add('hidden');
            themeModal.classList.remove('flex');
        }, 300);
    });
    // History Modal & Menu Logic
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const extraPanel = document.getElementById('extra-panel');
    const fadeoutToggle = document.getElementById('fadeout-toggle');
    const autowakeTrigger = document.getElementById('autowake-trigger');
    const clearWakeBtn = document.getElementById('clear-wake-btn');
    const minimizeTrayToggle = document.getElementById('minimize-tray-toggle');
    const topmostToggle = document.getElementById('topmost-toggle');

    menuBtn.addEventListener('click', () => {
        playClickSound();
        extraPanel.classList.remove('-translate-x-full');
    });

    closeMenuBtn.addEventListener('click', () => {
        playClickSound();
        extraPanel.classList.add('-translate-x-full');
    });

    minimizeTrayToggle.addEventListener('change', () => {
        eel.save_setting('minimizeTray', minimizeTrayToggle.checked);
    });

    topmostToggle.addEventListener('change', (e) => {
        let isTopmost = e.target.checked;
        eel.save_setting('isTopmost', isTopmost);
        eel.set_topmost(isTopmost);
    });

    clearWakeBtn.addEventListener('click', () => {
        playClickSound();
        autowakeTrigger.innerText = '--:--';
        autowakeTrigger.dataset.value = '';
    });

    historyBtn.addEventListener('click', async () => {
        playClickSound();
        historyModal.classList.remove('hidden');
        // Small delay to allow display block to apply before opacity transition
        setTimeout(() => {
            historyModal.classList.remove('opacity-0');
            historyModal.querySelector('div').classList.remove('scale-95');
            historyModal.querySelector('div').classList.add('scale-100');
        }, 10);
        
        const dashboardStats = document.getElementById('dashboard-stats');
        dashboardStats.innerHTML = '<div class="text-center py-4 text-on-surface-variant/50 text-sm col-span-3">Memuat statistik...</div>';
        historyList.innerHTML = '<div class="text-center py-4 text-on-surface-variant/50 text-sm">Memuat riwayat...</div>';
        
        try {
            const logs = await eel.get_history()();
            const stats = await eel.get_stats()();
            
            dashboardStats.innerHTML = `
                <div class="bg-primary/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="material-symbols-outlined text-[24px] text-primary mb-1">power_settings_new</span>
                    <div class="text-2xl font-headline-md font-bold text-white leading-none">${stats.hibernations}</div>
                    <div class="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Siklus Tidur</div>
                </div>
                <div class="bg-primary/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="material-symbols-outlined text-[24px] text-blue-400 mb-1">schedule</span>
                    <div class="text-2xl font-headline-md font-bold text-white leading-none">${stats.hours_saved}</div>
                    <div class="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Jam Dihemat</div>
                </div>
                <div class="bg-primary/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="material-symbols-outlined text-[24px] text-green-400 mb-1">eco</span>
                    <div class="text-2xl font-headline-md font-bold text-white leading-none">${stats.kwh_saved}</div>
                    <div class="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">kWh Dihemat</div>
                </div>
            `;
            
            if (logs.length === 0) {
                historyList.innerHTML += '<div class="text-center py-4 text-on-surface-variant/50 text-sm">Tidak ada riwayat.</div>';
                return;
            }
            // Reverse so newest is top
            logs.reverse().forEach(log => {
                const dateObj = new Date(log.time);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: 'short' });
                
                const item = document.createElement('div');
                item.className = "flex gap-3 items-start border-b border-white/5 pb-3 last:border-0";
                item.innerHTML = `
                    <div class="text-[10px] text-primary-fixed-dim bg-primary-fixed-dim/10 px-2 py-1 rounded whitespace-nowrap mt-0.5">
                        ${timeStr}
                    </div>
                    <div class="flex-1 flex flex-col">
                        <span class="text-[13px] text-white leading-snug">${log.message}</span>
                        <span class="text-[10px] text-on-surface-variant/50 mt-0.5">${dateStr}</span>
                    </div>
                `;
                historyList.appendChild(item);
            });
        } catch (e) {
            historyList.innerHTML = '<div class="text-center py-4 text-red-400/80 text-sm">Gagal memuat riwayat.</div>';
        }
    });

    closeHistoryBtn.addEventListener('click', () => {
        playClickSound();
        historyModal.classList.add('opacity-0');
        historyModal.querySelector('div').classList.remove('scale-100');
        historyModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            historyModal.classList.add('hidden');
        }, 300);
    });

    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            closeHistoryBtn.click();
        }
    });

    function updateDisplay(m, s) {
        let timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        displayTimer.innerText = timeStr;
        if (targetTime && targetTime !== "smart") {
            document.title = `${timeStr} - Power Timer`;
        } else {
            document.title = "Power Timer - Aether Sleep";
        }
    }

    function setDuration(m) {
        if(targetTime) return; 
        currentMinutes = m;
        updateDisplay(m, 0);
        
        // Highlight active preset
        const btns = document.querySelectorAll('.preset-btn');
        btns.forEach(btn => {
            if(parseInt(btn.innerText) === m) {
                btn.className = "preset-btn glass-panel-2 px-5 py-2 rounded-full font-label-md text-primary border-primary-fixed-dim transition-all duration-300 shadow-[0_0_15px_rgba(0,219,233,0.3)] transform scale-[1.05]";
            } else {
                btn.className = "preset-btn glass-panel-1 px-5 py-2 rounded-full font-label-md text-on-surface-variant hover:text-white hover:border-primary-fixed-dim/50 hover:bg-[#1E293B]/60 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,219,233,0.15)] transform hover:scale-[1.02]";
            }
        });
        
        ring.style.strokeDashoffset = 0; // reset ring to full visually
    }

    function renderPresets(presets) {
        presetContainer.innerHTML = '';
        presets.forEach(minutes => {
            const btn = document.createElement('button');
            btn.className = "preset-btn glass-panel-1 px-5 py-2 rounded-full font-label-md text-on-surface-variant hover:text-white hover:border-primary-fixed-dim/50 hover:bg-[#1E293B]/60 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,219,233,0.15)] transform hover:scale-[1.02]";
            btn.innerText = `${minutes}m`;
            
            // Left click to select
            btn.addEventListener('click', () => {
                playClickSound();
                setDuration(minutes);
            });
            
            // Right click to remove
            btn.addEventListener('contextmenu', async (e) => {
                e.preventDefault();
                if(targetTime) return;
                playClickSound();
                
                // Visual feedback (fade out)
                btn.style.transform = 'scale(0.8)';
                btn.style.opacity = '0';
                
                setTimeout(async () => {
                    const newPresets = await eel.remove_preset(minutes)();
                    renderPresets(newPresets);
                }, 200);
            });
            
            presetContainer.appendChild(btn);
        });
        // Set initial duration to the first preset if exists, else 45
        if(presets.length > 0 && !targetTime) {
            setDuration(presets[0]);
        } else if (presets.length === 0 && !targetTime) {
            setDuration(45);
        }
    }

    customMinutesInput.addEventListener('input', (e) => {
        if(targetTime) return;
        const val = parseInt(e.target.value);
        if(!isNaN(val) && val > 0) {
            setDuration(val);
        }
    });

    // Save custom minutes on input
    customMinutesInput.addEventListener('input', (e) => {
        eel.save_setting('lastCustomMinutes', e.target.value)();
    });

    addPresetBtn.addEventListener('click', async () => {
        if(targetTime) return;
        playClickSound();
        const val = parseInt(customMinutesInput.value);
        if(!isNaN(val) && val > 0) {
            customMinutesInput.classList.remove('border-red-400');
            const newPresets = await eel.add_preset(val)();
            renderPresets(newPresets);
            customMinutesInput.value = '';
        } else {
            // Visual validation error
            customMinutesInput.classList.add('border-red-400');
            setTimeout(() => {
                customMinutesInput.classList.remove('border-red-400');
            }, 1500);
        }
    });

    // Clock Picker Logic
    let clockMode = 'hours';
    let clockHour = 7;
    let clockMinute = 0;
    let isPM = false;

    const clockModal = document.getElementById('clock-picker-modal');
    const clockHH = document.getElementById('clock-hh');
    const clockMM = document.getElementById('clock-mm');
    const clockNumbers = document.getElementById('clock-numbers');
    const clockHand = document.getElementById('clock-hand');
    const clockAMPM = document.getElementById('clock-ampm');

    function closeClockModal() {
        clockModal.classList.add('opacity-0');
        clockModal.querySelector('div').classList.remove('scale-100');
        clockModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => clockModal.classList.add('hidden'), 300);
    }

    autowakeTrigger.addEventListener('click', () => {
        try {
            if (autowakeTrigger.dataset.value) {
                let [h, m] = autowakeTrigger.dataset.value.split(':');
                clockHour = parseInt(h);
                clockMinute = parseInt(m);
            } else {
                clockHour = 7;
                clockMinute = 0;
            }
            isPM = clockHour >= 12;
            
            clockModal.classList.remove('hidden');
            setTimeout(() => {
                clockModal.classList.remove('opacity-0');
                clockModal.querySelector('div').classList.remove('scale-95');
                clockModal.querySelector('div').classList.add('scale-100');
            }, 10);
            setClockMode('hours');
            updateClockDisplay();
        } catch (e) {
            alert("Error in click: " + e.message);
        }
    });

    clockAMPM.addEventListener('click', () => {
        isPM = !isPM;
        clockAMPM.innerText = isPM ? "PM" : "AM";
        if (isPM && clockHour < 12) clockHour += 12;
        if (!isPM && clockHour >= 12) clockHour -= 12;
    });

    function setClockMode(mode) {
        clockMode = mode;
        clockNumbers.innerHTML = '';
        
        if (mode === 'hours') {
            clockHH.classList.add('text-primary');
            clockHH.classList.remove('text-on-surface-variant');
            clockMM.classList.remove('text-primary');
            clockMM.classList.add('text-on-surface-variant');
            
            for(let i=1; i<=12; i++) {
                createClockNumber(i, i, 90);
            }
            
            let h = clockHour % 12;
            if (h === 0) h = 12;
            setHandAngle(h * 30);
        } else {
            clockMM.classList.add('text-primary');
            clockMM.classList.remove('text-on-surface-variant');
            clockHH.classList.remove('text-primary');
            clockHH.classList.add('text-on-surface-variant');
            
            for(let i=0; i<60; i+=5) {
                createClockNumber(i === 0 ? "00" : i, i, 90);
            }
            
            setHandAngle(clockMinute * 6);
        }
    }

    function createClockNumber(text, value, radius) {
        const num = document.createElement('div');
        num.className = "absolute w-[32px] h-[32px] flex items-center justify-center text-[15px] font-semibold rounded-full cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors text-white z-20";
        num.innerText = text;
        
        let angle = clockMode === 'hours' ? (value * 30) - 90 : (value * 6) - 90;
        const rad = angle * (Math.PI / 180);
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        
        num.style.left = `calc(50% + ${x}px - 16px)`;
        num.style.top = `calc(50% + ${y}px - 16px)`;
        
        num.addEventListener('click', (e) => {
            e.stopPropagation();
            if (clockMode === 'hours') {
                let h = value;
                if (isPM && h < 12) h += 12;
                if (!isPM && h === 12) h = 0;
                clockHour = h;
                setHandAngle(value * 30);
                updateClockDisplay();
                setTimeout(() => setClockMode('minutes'), 300);
            } else {
                clockMinute = value;
                setHandAngle(value * 6);
                updateClockDisplay();
            }
        });
        
        clockNumbers.appendChild(num);
    }

    function setHandAngle(deg) {
        clockHand.style.transform = `rotate(${deg}deg)`;
    }

    function updateClockDisplay() {
        let displayH = clockHour % 12;
        if (displayH === 0) displayH = 12;
        clockHH.innerText = String(displayH).padStart(2, '0');
        clockMM.innerText = String(clockMinute).padStart(2, '0');
        clockAMPM.innerText = clockHour >= 12 ? "PM" : "AM";
        isPM = clockHour >= 12;
    }

    clockHH.addEventListener('click', () => setClockMode('hours'));
    clockMM.addEventListener('click', () => setClockMode('minutes'));

    document.getElementById('clock-cancel').addEventListener('click', closeClockModal);
    document.getElementById('clock-ok').addEventListener('click', () => {
        let finalHH = String(clockHour).padStart(2, '0');
        let finalMM = String(clockMinute).padStart(2, '0');
        autowakeTrigger.innerText = `${finalHH}:${finalMM}`;
        autowakeTrigger.dataset.value = `${finalHH}:${finalMM}`;
        closeClockModal();
    });

    let totalDurationSeconds = 0;

    eel.expose(sync_cancel_from_backend);
    function sync_cancel_from_backend() {
        if (targetTime) {
            clearInterval(countdownInterval);
            targetTime = null;
            let selectedAction = actionSelect.value.replace('_timer', '').replace('_smart', '');
            startBtn.innerText = `Start ${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}`;
            statusLabel.innerText = "READY";
            pulseRing.classList.remove('animate-pulse');
            ring.classList.add('opacity-30');
            ring.classList.remove('glow-active');
            displayTimer.classList.remove('text-[36px]', 'tracking-normal');
            displayTimer.classList.add('text-[64px]', 'tracking-tighter');
            setInputsDisabled(false);
            document.title = "Power Timer - Aether Sleep";
        }
    }

    function startCountdownTimer(baseAction) {
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            const now = new Date();
            const diff = targetTime - now;
            if (diff <= 0) {
                clearInterval(countdownInterval);
                updateDisplay(0, 0);
                // Do NOT call eel.execute_action() here.
                // Backend background_timer_loop is the single source of truth for execution.
                // The global poller will detect backend state=idle and reset the UI.
            } else {
                const totalSeconds = Math.floor(diff / 1000);
                const m = Math.floor(totalSeconds / 60);
                const s = totalSeconds % 60;
                updateDisplay(m, s);
                
                // Calculate percentage remaining (1.0 to 0.0)
                const pct = totalDurationSeconds > 0 ? (totalSeconds / totalDurationSeconds) : 0;
                ring.style.strokeDashoffset = 880 - (880 * pct);
            }
        }, 1000);
    }

    let isToggling = false;
    async function toggleSleep() {
        if (isToggling) return;
        isToggling = true;
        startBtn.classList.add('opacity-50', 'pointer-events-none');
        
        try {
            if (targetTime) {
                // Cancel
                await eel.cancel()();
                clearInterval(countdownInterval);
                targetTime = null;
                let selectedAction = actionSelect.value.replace('_timer', '').replace('_smart', '');
                startBtn.innerText = `Start ${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}`;
                statusLabel.innerText = "READY";
                pulseRing.classList.remove('animate-pulse');
                ring.style.strokeDashoffset = 0;
                ring.classList.add('opacity-30');
                ring.classList.remove('glow-active');
                displayTimer.classList.remove('text-[36px]', 'tracking-normal');
                displayTimer.classList.add('text-[64px]', 'tracking-tighter');
                setDuration(currentMinutes);
                document.title = "Power Timer - Aether Sleep";
                
                // Re-enable inputs
                setInputsDisabled(false);
            } else {
                // Start
                let selectedAction = actionSelect.value;
                let mode = "timer";
                let baseAction = selectedAction.replace('_timer', '').replace('_smart', '');
                
                if (selectedAction.includes("_smart")) {
                    mode = "smart";
                }
                
                const prevent = keepAwakeCheck.checked;
                if (!prevent) {
                    alert("Harap pastikan pekerjaan Anda sudah disimpan!");
                    // Jangan return langsung dari try, biarkan ke finally
                    return;
                }
                
                const res = await eel.schedule(
                    currentMinutes, 
                    baseAction, 
                    prevent, 
                    mode,
                    smartType.value,
                    smartThreshold.value,
                    smartDuration.value,
                    fadeoutToggle.checked,
                    autowakeTrigger.dataset.value,
                    "" // discordWebhook removed
                )();
                
                if (res.status === "success") {
                    targetTime = mode === "timer" ? new Date(res.target_time) : "smart";
                    startBtn.innerText = `Cancel ${baseAction.charAt(0).toUpperCase() + baseAction.slice(1)}`;
                    statusLabel.innerText = "RUNNING";
                    pulseRing.classList.add('animate-pulse');
                    ring.classList.remove('opacity-30');
                    ring.classList.add('glow-active');
                    
                    // Disable inputs
                    setInputsDisabled(true);
                    
                    if (mode === "timer") {
                        totalDurationSeconds = currentMinutes * 60;
                        startCountdownTimer(baseAction);
                    } else {
                        // Smart mode visual
                        displayTimer.classList.remove('text-[64px]', 'tracking-tighter');
                        displayTimer.classList.add('text-[36px]', 'tracking-normal');
                        displayTimer.innerText = "MONITORING";
                        statusLabel.innerText = "SMART TRIGGER";
                        ring.style.strokeDashoffset = 0; // Filled visually to indicate active tracking
                    }
                }
            }
        } finally {
            isToggling = false;
            startBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    startBtn.addEventListener('click', toggleSleep);

    async function initialize() {
        try {
            // Load theme first
            const savedTheme = await eel.get_setting('theme', 'cyan')();
            applyTheme(savedTheme, false);
            
            await restoreSettings();
            
            const stats = await eel.get_stats()();
            
            // Check if there is an existing schedule running
            const existing = await eel.check_existing_schedule()();
            
            if (existing) {
                let baseAction = existing.action;
                if (existing.mode === "timer" && existing.target_time) {
                    targetTime = new Date(existing.target_time);
                    totalDurationSeconds = existing.total_duration || (currentMinutes * 60);
                } else {
                    targetTime = "smart";
                    displayTimer.classList.remove('text-[64px]', 'tracking-tighter');
                    displayTimer.classList.add('text-[36px]', 'tracking-normal');
                    displayTimer.innerText = "MONITORING";
                    
                    // set selects based on config
                    if (existing.smart_config) {
                        smartType.value = existing.smart_config.type || "network";
                        smartThreshold.value = existing.smart_config.threshold || 50;
                        smartDuration.value = (existing.smart_config.duration / 60) || 5;
                    }
                    actionSelect.value = baseAction + "_smart";
                    actionSelect.dispatchEvent(new Event('change'));
                    
                    statusLabel.innerText = "SMART TRIGGER";
                    ring.style.strokeDashoffset = 0;
                }
                
                if (existing.extra_config) {
                    fadeoutToggle.checked = existing.extra_config.fade_out || false;
                    if (existing.extra_config.wake_time) {
                        autowakeTrigger.dataset.value = existing.extra_config.wake_time;
                        autowakeTrigger.innerText = existing.extra_config.wake_time;
                    }
                }
                
                startBtn.innerText = `Cancel ${baseAction.charAt(0).toUpperCase() + baseAction.slice(1)}`;
                statusLabel.innerText = existing.mode === "smart" ? "SMART TRIGGER" : "RUNNING";
                pulseRing.classList.add('animate-pulse');
                ring.classList.remove('opacity-30');
                ring.classList.add('glow-active');
                
                // Disable inputs
                setInputsDisabled(true);
                
                if (existing.mode === "timer" && existing.target_time) {
                    startCountdownTimer(baseAction);
                }
                
                // Render presets but they will be non-clickable visually
                const presets = await eel.get_presets()();
                renderPresets(presets);
                    
                } else {
                    statusLabel.innerText = "READY";
                    pulseRing.classList.remove('animate-pulse');
                    ring.classList.add('opacity-30');
                    ring.classList.remove('glow-active');
                    displayTimer.classList.remove('text-[36px]', 'tracking-normal');
                    displayTimer.classList.add('text-[64px]', 'tracking-tighter');
                    const presets = await eel.get_presets()();
                    renderPresets(presets);
                }
            } catch (e) {
                console.error(e);
                renderPresets([15, 30, 45, 60]);
            }
    }

    async function restoreSettings() {
        let fadeOut = await eel.get_setting('fadeOut', false)();
        fadeoutToggle.checked = fadeOut;

        let minimizeTray = await eel.get_setting('minimizeTray', true)();
        minimizeTrayToggle.checked = minimizeTray;

        let isTopmost = await eel.get_setting('isTopmost', false)();
        topmostToggle.checked = isTopmost;
        if (isTopmost) eel.set_topmost(true);
        
        let lastAction = await eel.get_setting('lastAction', 'hibernate')();
        actionSelect.value = lastAction;
        const actionOptions = document.querySelectorAll('#action-select-container .custom-select-option');
        const selectedOpt = Array.from(actionOptions).find(o => o.dataset.value === lastAction);
        if (selectedOpt) {
            document.querySelector('#action-select-container .custom-select-trigger span').innerText = selectedOpt.innerText;
            actionOptions.forEach(o => o.classList.remove('selected'));
            selectedOpt.classList.add('selected');
        }
        actionSelect.dispatchEvent(new Event('change'));
        
        let lastCustomMinutes = await eel.get_setting('lastCustomMinutes', '')();
        if (lastCustomMinutes) {
            customMinutesInput.value = lastCustomMinutes;
        }
    }
    
    // Listen for Eel ready
    window.addEventListener("DOMContentLoaded", () => {
        setupCustomSelect('action-select');
        setupCustomSelect('smart-type');
        initialize();
    });
    
    // Custom Select Logic
    function setupCustomSelect(selectId) {
        const selectContainer = document.getElementById(selectId + '-container');
        if (!selectContainer) return;
        const trigger = selectContainer.querySelector('.custom-select-trigger');
        const options = selectContainer.querySelectorAll('.custom-select-option');
        const hiddenInput = document.getElementById(selectId);
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-container').forEach(c => {
                if (c !== selectContainer) c.classList.remove('open');
            });
            selectContainer.classList.toggle('open');
        });
        
        options.forEach(opt => {
            opt.addEventListener('click', async (e) => {
                e.stopPropagation();
                const val = opt.dataset.value;
                const text = opt.innerText;
                
                hiddenInput.value = val;
                trigger.querySelector('span').innerText = text;
                
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                
                selectContainer.classList.remove('open');
                
                // Process autocomplete logic
                if (selectId === 'smart-type') {
                    const thresholdInput = document.getElementById('smart-threshold');
                    thresholdInput.placeholder = "Nilai batas...";
                }
                
                // Trigger change event manually
                hiddenInput.dispatchEvent(new Event('change'));
            });
        });
        
        // Init state based on input value if needed
        const initVal = hiddenInput.value;
        if (initVal) {
            const selectedOpt = Array.from(options).find(o => o.dataset.value === initVal);
            if (selectedOpt) {
                trigger.querySelector('span').innerText = selectedOpt.innerText;
                options.forEach(o => o.classList.remove('selected'));
                selectedOpt.classList.add('selected');
            }
        }
    }
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
    });
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Prevent triggering if user is typing in an input field
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault(); // Prevent page scrolling
            toggleSleep();
        }
    });
    
    
    // Global Poller for Syncing with Backend
    setInterval(async () => {
        try {
            const state = await eel.get_current_state()();
            if (state.status === "idle") {
                if (targetTime) {
                    // Backend was cancelled or finished, reset UI
                    targetTime = null;
                    clearInterval(countdownInterval);
                    let selectedAction = actionSelect.value.replace('_timer', '').replace('_smart', '');
                    startBtn.innerText = `Start ${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}`;
                    statusLabel.innerText = "READY";
                    pulseRing.classList.remove('animate-pulse');
                    setInputsDisabled(false);
                    setDuration(currentMinutes); 
                    document.title = "Power Timer - Aether Sleep";
                }
            }
            // If running, we let the local countdownInterval handle the smooth UI updates
        } catch (e) {
            // ignore eel connection errors during shutdown
        }
    }, 1000);
    
    // Live Wallpaper Particle Effect
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = Math.random() * -0.5 - 0.1;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
        }
        draw() {
            ctx.fillStyle = document.body.classList.contains('light-mode') 
                ? `rgba(14, 165, 233, ${this.opacity * 0.5})` 
                : `rgba(0, 219, 233, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function initParticles() {
        particles = [];
        const numParticles = Math.floor((canvas.width * canvas.height) / 10000); // Dynamic count
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    
    initParticles();
    animateParticles();

    function setInputsDisabled(disabled) {
        document.querySelectorAll('.preset-btn').forEach(b => b.disabled = disabled);
        customMinutesInput.disabled = disabled;
        keepAwakeCheck.disabled = disabled;
        addPresetBtn.disabled = disabled;
        smartType.disabled = disabled;
        smartThreshold.disabled = disabled;
        smartDuration.disabled = disabled;
        fadeoutToggle.disabled = disabled;
        clearWakeBtn.disabled = disabled;
        if (disabled) {
            document.getElementById('action-select-container').classList.add('opacity-50', 'pointer-events-none');
            document.getElementById('smart-type-container').classList.add('opacity-50', 'pointer-events-none');
            autowakeTrigger.style.pointerEvents = 'none';
            autowakeTrigger.classList.add('opacity-50');
        } else {
            document.getElementById('action-select-container').classList.remove('opacity-50', 'pointer-events-none');
            document.getElementById('smart-type-container').classList.remove('opacity-50', 'pointer-events-none');
            autowakeTrigger.style.pointerEvents = 'auto';
            autowakeTrigger.classList.remove('opacity-50');
        }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals/panels
            if (!themeModal.classList.contains('hidden')) {
                btnCloseTheme.click();
            }
            else if (!historyModal.classList.contains('hidden')) {
                closeHistoryBtn.click();
            }
            else if (!extraPanel.classList.contains('-translate-x-full')) {
                closeMenuBtn.click();
            }
        }
        else if (e.key === 'Enter') {
            // If focused on custom minutes or smart threshold input, start timer
            if (document.activeElement === customMinutesInput || document.activeElement === smartThreshold) {
                startBtn.click();
            }
        }
    });
