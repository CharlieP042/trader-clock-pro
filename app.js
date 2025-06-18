// Trader Clock Pro - Clean Implementation
(function() {
    'use strict';

    // Configuration
    const TIMEZONES = {
        NIGERIA: 1,
        HFM: 2,
        NY: -4
    };

    const SESSIONS = {
        SYDNEY: { start: 0, end: 9 },
        TOKYO: { start: 0, end: 9 },
        LONDON: { start: 8, end: 17 },
        NY: { start: 13, end: 22 }
    };

    const DEFAULT_PREFERENCES = {
        theme: 'system',
        timezones: { nigeria: true, hfm: true, ny: true },
        sessions: { sydney: true, tokyo: true, london: true, ny: true, overlap: true },
        alertSound: 'bell',
        alertVolume: 0.8,
        notifications: {
            enabled: true, sessionStart: true, sessionEnd: true, 
            dailyCandle: true, customAlerts: true
        }
    };

    // Utility Functions
    function padZero(num) {
        return num < 10 ? '0' + num : num.toString();
    }

    function formatTime(date) {
        return padZero(date.getHours()) + ':' + 
               padZero(date.getMinutes()) + ':' + 
               padZero(date.getSeconds());
    }

    function getTimeInTimezone(offset) {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * offset));
    }

    function formatCountdown(milliseconds) {
        if (milliseconds < 0) return '--:--:--';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return padZero(hours) + ':' + padZero(minutes) + ':' + padZero(seconds);
    }

    // Core Functions
    function updateClocks() {
        const nigeriaEl = document.getElementById('nigeria-time');
        const hfmEl = document.getElementById('hfm-time');
        const nyEl = document.getElementById('ny-time');

        if (nigeriaEl) nigeriaEl.textContent = formatTime(getTimeInTimezone(TIMEZONES.NIGERIA));
        if (hfmEl) hfmEl.textContent = formatTime(getTimeInTimezone(TIMEZONES.HFM));
        if (nyEl) nyEl.textContent = formatTime(getTimeInTimezone(TIMEZONES.NY));
    }

    function calculateTimeUntilNextSession(session) {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const targetHour = session.start;
        let targetDate = new Date(now);
        
        if (currentHour >= session.end) {
            targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        }
        
        targetDate.setUTCHours(targetHour, 0, 0, 0);
        return targetDate.getTime() - now.getTime();
    }

    function updateSessionCountdowns() {
        const sessions = [
            { element: document.getElementById('sydney-countdown'), session: SESSIONS.SYDNEY },
            { element: document.getElementById('tokyo-countdown'), session: SESSIONS.TOKYO },
            { element: document.getElementById('london-countdown'), session: SESSIONS.LONDON },
            { element: document.getElementById('ny-countdown'), session: SESSIONS.NY }
        ];

        sessions.forEach(item => {
            if (item.element) {
                const timeUntilNext = calculateTimeUntilNextSession(item.session);
                item.element.textContent = formatCountdown(timeUntilNext);
            }
        });
    }

    function updateDailyCountdown() {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const hfmHour = (currentHour + TIMEZONES.HFM + 24) % 24;
        
        let closeDate = new Date(now);
        if (hfmHour >= 0) {
            closeDate.setUTCDate(closeDate.getUTCDate() + 1);
        }
        closeDate.setUTCHours(-TIMEZONES.HFM, 0, 0, 0);
        const timeUntilClose = closeDate.getTime() - now.getTime();
        
        let openDate = new Date(closeDate);
        openDate.setUTCHours(openDate.getUTCHours() + 1);
        const timeUntilOpen = openDate.getTime() - now.getTime();
        
        const dailyEl = document.getElementById('daily-countdown');
        const nextEl = document.getElementById('next-candle');
        
        if (dailyEl) dailyEl.textContent = formatCountdown(timeUntilClose);
        if (nextEl) nextEl.textContent = formatCountdown(timeUntilOpen);
    }

    function updateSessions() {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentTime = currentHour + (now.getUTCMinutes() / 60);
        
        function isSessionActive(session) {
            if (session.start > session.end) {
                return currentTime >= session.start || currentTime < session.end;
            }
            return currentTime >= session.start && currentTime < session.end;
        }
        
        function isLondonNYOverlapActive() {
            return isSessionActive(SESSIONS.LONDON) && isSessionActive(SESSIONS.NY);
        }
        
        // Update individual sessions
        const sessions = [
            { element: document.getElementById('sydney-session'), session: SESSIONS.SYDNEY },
            { element: document.getElementById('tokyo-session'), session: SESSIONS.TOKYO },
            { element: document.getElementById('london-session'), session: SESSIONS.LONDON },
            { element: document.getElementById('ny-session'), session: SESSIONS.NY }
        ];
        
        sessions.forEach(item => {
            if (item.element) {
                const statusEl = item.element.querySelector('.session-status');
                if (statusEl) {
                    if (isSessionActive(item.session)) {
                        statusEl.textContent = 'Active';
                        statusEl.className = 'session-status active';
                    } else {
                        statusEl.textContent = 'Closed';
                        statusEl.className = 'session-status';
                    }
                }
            }
        });
        
        // Update overlap
        const overlapEl = document.getElementById('london-ny-overlap');
        if (overlapEl) {
            const overlapStatus = overlapEl.querySelector('.overlap-status');
            if (overlapStatus) {
                if (isLondonNYOverlapActive()) {
                    overlapStatus.textContent = 'Active';
                    overlapStatus.className = 'overlap-status active';
                } else {
                    overlapStatus.textContent = 'Closed';
                    overlapStatus.className = 'overlap-status';
                }
            }
        }
    }

    // Preferences Management
    function loadPreferences() {
        try {
            const saved = localStorage.getItem('preferences');
            return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
        } catch (e) {
            return DEFAULT_PREFERENCES;
        }
    }

    function savePreferences(preferences) {
        try {
            localStorage.setItem('preferences', JSON.stringify(preferences));
        } catch (e) {
            console.error('Failed to save preferences:', e);
        }
    }

    function applyTheme(theme) {
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
    }

    function updateUIFromPreferences() {
        const prefs = loadPreferences();
        applyTheme(prefs.theme);
        
        // Update timezone visibility
        const timezones = [
            { id: 'nigeria-time', enabled: prefs.timezones.nigeria },
            { id: 'hfm-time', enabled: prefs.timezones.hfm },
            { id: 'ny-time', enabled: prefs.timezones.ny }
        ];
        
        timezones.forEach(tz => {
            const el = document.getElementById(tz.id);
            if (el && el.parentElement) {
                el.parentElement.style.display = tz.enabled ? 'block' : 'none';
            }
        });
        
        // Update session visibility
        const sessions = [
            { id: 'sydney-session', enabled: prefs.sessions.sydney },
            { id: 'tokyo-session', enabled: prefs.sessions.tokyo },
            { id: 'london-session', enabled: prefs.sessions.london },
            { id: 'ny-session', enabled: prefs.sessions.ny },
            { id: 'london-ny-overlap', enabled: prefs.sessions.overlap }
        ];
        
        sessions.forEach(session => {
            const el = document.getElementById(session.id);
            if (el) {
                el.style.display = session.enabled ? 'block' : 'none';
            }
        });
    }

    function loadPreferencesToForm() {
        const prefs = loadPreferences();
        
        // Theme
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = prefs.theme;
        
        // Timezones
        const timezoneIds = ['timezone-nigeria', 'timezone-hfm', 'timezone-ny'];
        timezoneIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = prefs.timezones[id.replace('timezone-', '')];
        });
        
        // Sessions
        const sessionIds = ['session-sydney', 'session-tokyo', 'session-london', 'session-ny', 'session-overlap'];
        sessionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = prefs.sessions[id.replace('session-', '')];
        });
        
        // Notifications
        const notificationIds = ['notifications-enabled', 'notifications-session-start', 'notifications-session-end', 'notifications-daily-candle', 'notifications-custom-alerts'];
        notificationIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = prefs.notifications[id.replace('notifications-', '')];
        });
        
        // Alert settings
        const alertSoundSelect = document.getElementById('alert-sound-select');
        const alertVolume = document.getElementById('alert-volume');
        if (alertSoundSelect) alertSoundSelect.value = prefs.alertSound;
        if (alertVolume) alertVolume.value = prefs.alertVolume * 100;
    }

    function savePreferencesFromForm() {
        const prefs = {
            theme: document.getElementById('theme-select')?.value || 'system',
            timezones: {
                nigeria: document.getElementById('timezone-nigeria')?.checked || true,
                hfm: document.getElementById('timezone-hfm')?.checked || true,
                ny: document.getElementById('timezone-ny')?.checked || true
            },
            sessions: {
                sydney: document.getElementById('session-sydney')?.checked || true,
                tokyo: document.getElementById('session-tokyo')?.checked || true,
                london: document.getElementById('session-london')?.checked || true,
                ny: document.getElementById('session-ny')?.checked || true,
                overlap: document.getElementById('session-overlap')?.checked || true
            },
            alertSound: document.getElementById('alert-sound-select')?.value || 'bell',
            alertVolume: (document.getElementById('alert-volume')?.value || 80) / 100,
            notifications: {
                enabled: document.getElementById('notifications-enabled')?.checked || true,
                sessionStart: document.getElementById('notifications-session-start')?.checked || true,
                sessionEnd: document.getElementById('notifications-session-end')?.checked || true,
                dailyCandle: document.getElementById('notifications-daily-candle')?.checked || true,
                customAlerts: document.getElementById('notifications-custom-alerts')?.checked || true
            }
        };
        
        savePreferences(prefs);
        updateUIFromPreferences();
        showNotification('Preferences saved successfully');
    }

    function resetPreferences() {
        savePreferences(DEFAULT_PREFERENCES);
        loadPreferencesToForm();
        updateUIFromPreferences();
        showNotification('Preferences reset to default');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // UI Management
    function initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const navLinks = document.getElementById('nav-links');
        const menuOverlay = document.getElementById('menu-overlay');
        
        if (menuToggle && navLinks && menuOverlay) {
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.classList.add('active');
                menuOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            if (menuClose) {
                menuClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    navLinks.classList.remove('active');
                    menuOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            menuOverlay.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }

    function initPreferencesModal() {
        const preferencesLink = document.getElementById('preferences-link');
        const modal = document.getElementById('preferences-modal');
        const closeBtn = document.getElementById('close-preferences');
        const saveBtn = document.getElementById('save-preferences');
        const resetBtn = document.getElementById('reset-preferences');
        
        if (preferencesLink && modal) {
            const openModal = (e) => {
                e.preventDefault();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                loadPreferencesToForm();
            };
            
            const closeModal = () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            };
            
            preferencesLink.addEventListener('click', openModal);
            
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal);
            }
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    savePreferencesFromForm();
                    closeModal();
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', resetPreferences);
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
    }

    function initThemeToggles() {
        const desktopToggle = document.getElementById('desktop-theme-toggle');
        const mobileToggle = document.getElementById('mobile-theme-toggle');
        
        const toggleTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            applyTheme(newTheme);
            
            const prefs = loadPreferences();
            prefs.theme = newTheme;
            savePreferences(prefs);
        };
        
        if (desktopToggle) desktopToggle.addEventListener('click', toggleTheme);
        if (mobileToggle) mobileToggle.addEventListener('click', toggleTheme);
    }

    // Alert Management
    function loadAlerts() {
        try {
            const saved = localStorage.getItem('alerts');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    function saveAlerts(alerts) {
        try {
            localStorage.setItem('alerts', JSON.stringify(alerts));
        } catch (e) {
            console.error('Failed to save alerts:', e);
        }
    }

    function updateAlertsList() {
        const alerts = loadAlerts();
        const alertsList = document.getElementById('alerts-list');
        
        if (!alertsList) return;
        
        alertsList.innerHTML = '';
        
        alerts.forEach((alert, index) => {
            const alertEl = document.createElement('div');
            alertEl.className = 'alert-item';
            alertEl.innerHTML = `
                <div class="alert-info">
                    <div class="alert-time">${alert.time} (${alert.timezone})</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
                <button class="delete-alert" onclick="deleteAlert(${index})">×</button>
            `;
            alertsList.appendChild(alertEl);
        });
    }

    function deleteAlert(index) {
        const alerts = loadAlerts();
        alerts.splice(index, 1);
        saveAlerts(alerts);
        updateAlertsList();
    }

    function addAlert(alertData) {
        const alerts = loadAlerts();
        alerts.push({
            ...alertData,
            id: Date.now()
        });
        saveAlerts(alerts);
        updateAlertsList();
    }

    function initAlertForm() {
        const form = document.getElementById('alert-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const alertData = {
                    time: formData.get('alert-time'),
                    timezone: formData.get('alert-timezone'),
                    category: formData.get('alert-category'),
                    priority: formData.get('alert-priority'),
                    sound: formData.get('alert-sound'),
                    message: formData.get('alert-message'),
                    repeat: formData.get('alert-repeat') === 'on'
                };
                
                addAlert(alertData);
                form.reset();
                showNotification('Alert added successfully');
            });
        }
    }

    // Initialize everything
    function init() {
        console.log('Initializing Trader Clock Pro...');
        
        // Apply preferences
        updateUIFromPreferences();
        
        // Initialize UI
        initMobileMenu();
        initPreferencesModal();
        initThemeToggles();
        initAlertForm();
        
        // Update alerts list
        updateAlertsList();
        
        // Initial updates
        updateClocks();
        updateSessionCountdowns();
        updateDailyCountdown();
        updateSessions();
        
        // Set up intervals
        setInterval(updateClocks, 1000);
        setInterval(updateSessionCountdowns, 1000);
        setInterval(updateDailyCountdown, 1000);
        setInterval(updateSessions, 1000);
        
        console.log('Initialization complete');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Make deleteAlert globally available
    window.deleteAlert = deleteAlert;

})(); 