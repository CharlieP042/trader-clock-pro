// Comprehensive Safari iOS fix
(function() {
    'use strict';
    
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (!isIOS && !isSafari) return;
    
    console.log('Safari iOS detected - loading comprehensive fix');
    
    // Polyfill for padStart (for older Safari versions)
    if (!String.prototype.padStart) {
        String.prototype.padStart = function(targetLength, padString) {
            targetLength = targetLength >> 0;
            padString = String(typeof padString !== 'undefined' ? padString : ' ');
            if (this.length > targetLength) {
                return String(this);
            } else {
                targetLength = targetLength - this.length;
                if (targetLength > padString.length) {
                    padString += padString.repeat(targetLength / padString.length);
                }
                return padString.slice(0, targetLength) + String(this);
            }
        };
    }
    
    // Polyfill for repeat (for older Safari versions)
    if (!String.prototype.repeat) {
        String.prototype.repeat = function(count) {
            if (this == null) {
                throw new TypeError('can\'t convert ' + this + ' to object');
            }
            var str = '' + this;
            count = +count;
            if (count != count) {
                count = 0;
            }
            if (count < 0) {
                throw new RangeError('repeat count must be non-negative');
            }
            if (count == Infinity) {
                throw new RangeError('repeat count must be less than infinity');
            }
            count = Math.floor(count);
            if (str.length == 0 || count == 0) {
                return '';
            }
            if (str.length * count >= 1 << 28) {
                throw new RangeError('repeat count must not overflow maximum string size');
            }
            var rpt = '';
            for (;;) {
                if ((count & 1) == 1) {
                    rpt += str;
                }
                count >>>= 1;
                if (count == 0) {
                    break;
                }
                str += str;
            }
            return rpt;
        };
    }
    
    // Default preferences
    var DEFAULT_PREFERENCES = {
        theme: 'system',
        timezones: {
            nigeria: true,
            hfm: true,
            ny: true
        },
        alertSound: 'bell',
        alertVolume: 0.8,
        sessions: {
            sydney: true,
            tokyo: true,
            london: true,
            ny: true,
            overlap: true
        },
        notifications: {
            enabled: true,
            sessionStart: true,
            sessionEnd: true,
            dailyCandle: true,
            customAlerts: true
        }
    };
    
    // Trading session times in GMT
    var SESSIONS = {
        SYDNEY: { start: 0, end: 9 },
        TOKYO: { start: 0, end: 9 },
        LONDON: { start: 8, end: 17 },
        NY: { start: 13, end: 22 }
    };
    
    // Timezone offsets in hours
    var TIMEZONES = {
        NIGERIA: 1,
        HFM: 2,
        NY: -4
    };
    
    // Simple time formatting
    function formatTime(date) {
        var hours = date.getHours().toString().padStart(2, '0');
        var minutes = date.getMinutes().toString().padStart(2, '0');
        var seconds = date.getSeconds().toString().padStart(2, '0');
        return hours + ':' + minutes + ':' + seconds;
    }
    
    // Get time in specific timezone
    function getTimeInTimezone(offset) {
        var date = new Date();
        var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * offset));
    }
    
    // Calculate time until next session
    function calculateTimeUntilNextSession(session) {
        try {
            var now = new Date();
            var currentHour = now.getUTCHours();
            var currentMinute = now.getUTCMinutes();
            var currentSecond = now.getUTCSeconds();
            
            var targetHour = session.start;
            var targetDate = new Date(now);
            
            // If session has already started today, calculate for next day
            if (currentHour >= session.end) {
                targetDate.setUTCDate(targetDate.getUTCDate() + 1);
            }
            
            // Set target time
            targetDate.setUTCHours(targetHour, 0, 0, 0);
            
            // Calculate time difference
            var timeDiff = targetDate.getTime() - now.getTime();
            
            // Validation
            if (isNaN(timeDiff) || timeDiff < 0) {
                console.warn('Invalid time difference calculated, using fallback');
                return 3600000; // 1 hour fallback
            }
            
            return timeDiff;
        } catch (error) {
            console.error('Error calculating time until next session:', error);
            return 3600000; // 1 hour fallback
        }
    }
    
    // Format countdown time
    function formatCountdownTime(milliseconds) {
        if (milliseconds < 0) return '--:--:--';
        
        var totalSeconds = Math.floor(milliseconds / 1000);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        
        return hours.toString().padStart(2, '0') + ':' + 
               minutes.toString().padStart(2, '0') + ':' + 
               seconds.toString().padStart(2, '0');
    }
    
    // Update clocks
    function updateClocks() {
        try {
            var now = new Date();
            
            // Nigeria time (GMT+1)
            var nigeriaTime = getTimeInTimezone(TIMEZONES.NIGERIA);
            var nigeriaEl = document.getElementById('nigeria-time');
            if (nigeriaEl) nigeriaEl.textContent = formatTime(nigeriaTime);
            
            // HFM time (GMT+2)
            var hfmTime = getTimeInTimezone(TIMEZONES.HFM);
            var hfmEl = document.getElementById('hfm-time');
            if (hfmEl) hfmEl.textContent = formatTime(hfmTime);
            
            // NY time (GMT-4)
            var nyTime = getTimeInTimezone(TIMEZONES.NY);
            var nyEl = document.getElementById('ny-time');
            if (nyEl) nyEl.textContent = formatTime(nyTime);
            
        } catch (e) {
            console.error('Clock update error:', e);
        }
    }
    
    // Update session countdowns
    function updateSessionCountdowns() {
        try {
            var sessions = [
                { element: document.getElementById('sydney-countdown'), session: SESSIONS.SYDNEY },
                { element: document.getElementById('tokyo-countdown'), session: SESSIONS.TOKYO },
                { element: document.getElementById('london-countdown'), session: SESSIONS.LONDON },
                { element: document.getElementById('ny-countdown'), session: SESSIONS.NY }
            ];
            
            sessions.forEach(function(item) {
                if (item.element) {
                    var timeUntilNext = calculateTimeUntilNextSession(item.session);
                    item.element.textContent = formatCountdownTime(timeUntilNext);
                }
            });
        } catch (e) {
            console.error('Session countdown update error:', e);
        }
    }
    
    // Update daily countdown
    function updateDailyCountdown() {
        try {
            var now = new Date();
            var currentHour = now.getUTCHours();
            var currentMinute = now.getUTCMinutes();
            var currentSecond = now.getUTCSeconds();
            
            // Calculate time until next daily candle (HFM Server Time)
            var hfmOffset = TIMEZONES.HFM;
            var hfmHour = (currentHour + hfmOffset + 24) % 24;
            
            // Calculate time until daily close
            var closeDate = new Date(now);
            if (hfmHour >= 0) {
                closeDate.setUTCDate(closeDate.getUTCDate() + 1);
            }
            closeDate.setUTCHours(-hfmOffset, 0, 0, 0);
            var timeUntilClose = closeDate.getTime() - now.getTime();
            
            // Calculate time until next candle open
            var openDate = new Date(closeDate);
            openDate.setUTCHours(openDate.getUTCHours() + 1); // Next candle opens 1 hour after close
            var timeUntilOpen = openDate.getTime() - now.getTime();
            
            // Update both countdown displays
            var dailyCountdownElement = document.getElementById('daily-countdown');
            var nextCandleElement = document.getElementById('next-candle');
            
            if (dailyCountdownElement) {
                dailyCountdownElement.textContent = formatCountdownTime(timeUntilClose);
            }
            if (nextCandleElement) {
                nextCandleElement.textContent = formatCountdownTime(timeUntilOpen);
            }
        } catch (e) {
            console.error('Daily countdown update error:', e);
        }
    }
    
    // Load preferences from localStorage
    function loadPreferences() {
        try {
            var savedPreferences = localStorage.getItem('preferences');
            return savedPreferences ? JSON.parse(savedPreferences) : DEFAULT_PREFERENCES;
        } catch (error) {
            console.error('Error loading preferences:', error);
            return DEFAULT_PREFERENCES;
        }
    }
    
    // Save preferences to localStorage
    function savePreferences(preferences) {
        try {
            localStorage.setItem('preferences', JSON.stringify(preferences));
            console.log('Preferences saved successfully');
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
    
    // Load preferences to form
    function loadPreferencesToForm() {
        try {
            var preferences = loadPreferences();
            
            // Theme
            var themeSelect = document.getElementById('theme-select');
            if (themeSelect) themeSelect.value = preferences.theme;
            
            // Timezones
            var timezoneNigeria = document.getElementById('timezone-nigeria');
            var timezoneHfm = document.getElementById('timezone-hfm');
            var timezoneNy = document.getElementById('timezone-ny');
            
            if (timezoneNigeria) timezoneNigeria.checked = preferences.timezones.nigeria;
            if (timezoneHfm) timezoneHfm.checked = preferences.timezones.hfm;
            if (timezoneNy) timezoneNy.checked = preferences.timezones.ny;
            
            // Sessions
            var sessionSydney = document.getElementById('session-sydney');
            var sessionTokyo = document.getElementById('session-tokyo');
            var sessionLondon = document.getElementById('session-london');
            var sessionNy = document.getElementById('session-ny');
            var sessionOverlap = document.getElementById('session-overlap');
            
            if (sessionSydney) sessionSydney.checked = preferences.sessions.sydney;
            if (sessionTokyo) sessionTokyo.checked = preferences.sessions.tokyo;
            if (sessionLondon) sessionLondon.checked = preferences.sessions.london;
            if (sessionNy) sessionNy.checked = preferences.sessions.ny;
            if (sessionOverlap) sessionOverlap.checked = preferences.sessions.overlap;
            
            // Notifications
            var notificationsEnabled = document.getElementById('notifications-enabled');
            var notificationsSessionStart = document.getElementById('notifications-session-start');
            var notificationsSessionEnd = document.getElementById('notifications-session-end');
            var notificationsDailyCandle = document.getElementById('notifications-daily-candle');
            var notificationsCustomAlerts = document.getElementById('notifications-custom-alerts');
            
            if (notificationsEnabled) notificationsEnabled.checked = preferences.notifications.enabled;
            if (notificationsSessionStart) notificationsSessionStart.checked = preferences.notifications.sessionStart;
            if (notificationsSessionEnd) notificationsSessionEnd.checked = preferences.notifications.sessionEnd;
            if (notificationsDailyCandle) notificationsDailyCandle.checked = preferences.notifications.dailyCandle;
            if (notificationsCustomAlerts) notificationsCustomAlerts.checked = preferences.notifications.customAlerts;
            
            // Alert settings
            var alertSoundSelect = document.getElementById('alert-sound-select');
            var alertVolume = document.getElementById('alert-volume');
            
            if (alertSoundSelect) alertSoundSelect.value = preferences.alertSound;
            if (alertVolume) alertVolume.value = preferences.alertVolume * 100;
            
        } catch (e) {
            console.error('Error loading preferences to form:', e);
        }
    }
    
    // Save preferences from form
    function savePreferencesFromForm() {
        try {
            var preferences = {
                theme: document.getElementById('theme-select') ? document.getElementById('theme-select').value : 'system',
                timezones: {
                    nigeria: document.getElementById('timezone-nigeria') ? document.getElementById('timezone-nigeria').checked : true,
                    hfm: document.getElementById('timezone-hfm') ? document.getElementById('timezone-hfm').checked : true,
                    ny: document.getElementById('timezone-ny') ? document.getElementById('timezone-ny').checked : true
                },
                sessions: {
                    sydney: document.getElementById('session-sydney') ? document.getElementById('session-sydney').checked : true,
                    tokyo: document.getElementById('session-tokyo') ? document.getElementById('session-tokyo').checked : true,
                    london: document.getElementById('session-london') ? document.getElementById('session-london').checked : true,
                    ny: document.getElementById('session-ny') ? document.getElementById('session-ny').checked : true,
                    overlap: document.getElementById('session-overlap') ? document.getElementById('session-overlap').checked : true
                },
                notifications: {
                    enabled: document.getElementById('notifications-enabled') ? document.getElementById('notifications-enabled').checked : true,
                    sessionStart: document.getElementById('notifications-session-start') ? document.getElementById('notifications-session-start').checked : true,
                    sessionEnd: document.getElementById('notifications-session-end') ? document.getElementById('notifications-session-end').checked : true,
                    dailyCandle: document.getElementById('notifications-daily-candle') ? document.getElementById('notifications-daily-candle').checked : true,
                    customAlerts: document.getElementById('notifications-custom-alerts') ? document.getElementById('notifications-custom-alerts').checked : true
                },
                alertSound: document.getElementById('alert-sound-select') ? document.getElementById('alert-sound-select').value : 'bell',
                alertVolume: document.getElementById('alert-volume') ? document.getElementById('alert-volume').value / 100 : 0.8
            };
            
            savePreferences(preferences);
            
            // Apply changes immediately
            updateUIFromPreferences();
            
            console.log('Preferences saved and applied immediately');
            
            // Show success message
            var notification = document.createElement('div');
            notification.textContent = 'Preferences saved successfully';
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
            document.body.appendChild(notification);
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
            
        } catch (e) {
            console.error('Error saving preferences from form:', e);
        }
    }
    
    // Reset preferences
    function resetPreferences() {
        try {
            savePreferences(DEFAULT_PREFERENCES);
            loadPreferencesToForm();
            
            // Apply changes immediately
            updateUIFromPreferences();
            
            console.log('Preferences reset to default and applied immediately');
            
            // Show reset message
            var notification = document.createElement('div');
            notification.textContent = 'Preferences reset to default';
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #2196F3; color: white; padding: 10px; border-radius: 5px; z-index: 10000;';
            document.body.appendChild(notification);
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
            
        } catch (e) {
            console.error('Error resetting preferences:', e);
        }
    }
    
    // Mobile menu
    function initMobileMenu() {
        try {
            var menuToggle = document.getElementById('menu-toggle');
            var navLinks = document.getElementById('nav-links');
            var menuOverlay = document.getElementById('menu-overlay');
            var menuClose = document.getElementById('menu-close');
            
            if (menuToggle && navLinks && menuOverlay) {
                // Open menu
                menuToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    navLinks.classList.add('active');
                    menuOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
                
                // Close menu
                if (menuClose) {
                    menuClose.addEventListener('click', function(e) {
                        e.preventDefault();
                        navLinks.classList.remove('active');
                        menuOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                }
                
                // Close on overlay click
                menuOverlay.addEventListener('click', function() {
                    navLinks.classList.remove('active');
                    menuOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
                
                console.log('Mobile menu initialized');
            }
        } catch (e) {
            console.error('Mobile menu error:', e);
        }
    }
    
    // Preferences modal
    function initPreferencesModal() {
        try {
            var preferencesLink = document.getElementById('preferences-link');
            var modal = document.getElementById('preferences-modal');
            var closeBtn = document.getElementById('close-preferences');
            var saveBtn = document.getElementById('save-preferences');
            var resetBtn = document.getElementById('reset-preferences');
            
            if (preferencesLink && modal) {
                // Open preferences modal
                var openModal = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    modal.classList.add('active');
                    modal.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                    loadPreferencesToForm(); // Load current preferences
                    console.log('Preferences modal opened');
                };
                
                // Close preferences modal
                var closeModal = function() {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = '';
                    console.log('Preferences modal closed');
                };
                
                // Add event listeners with Safari-specific handling
                if (isIOS || isSafari) {
                    // Use touchstart for better iOS responsiveness
                    preferencesLink.addEventListener('touchstart', openModal, { passive: false });
                    preferencesLink.addEventListener('click', openModal);
                    
                    if (closeBtn) {
                        closeBtn.addEventListener('touchstart', function(e) {
                            e.preventDefault();
                            closeModal();
                        }, { passive: false });
                        closeBtn.addEventListener('click', closeModal);
                    }
                    
                    if (saveBtn) {
                        saveBtn.addEventListener('touchstart', function(e) {
                            e.preventDefault();
                            savePreferencesFromForm();
                            closeModal();
                        }, { passive: false });
                        saveBtn.addEventListener('click', function() {
                            savePreferencesFromForm();
                            closeModal();
                        });
                    }
                    
                    if (resetBtn) {
                        resetBtn.addEventListener('touchstart', function(e) {
                            e.preventDefault();
                            resetPreferences();
                        }, { passive: false });
                        resetBtn.addEventListener('click', function() {
                            resetPreferences();
                        });
                    }
                } else {
                    preferencesLink.addEventListener('click', openModal);
                    if (closeBtn) {
                        closeBtn.addEventListener('click', closeModal);
                    }
                    if (saveBtn) {
                        saveBtn.addEventListener('click', function() {
                            savePreferencesFromForm();
                            closeModal();
                        });
                    }
                    if (resetBtn) {
                        resetBtn.addEventListener('click', function() {
                            resetPreferences();
                        });
                    }
                }
                
                // Close on overlay click
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        closeModal();
                    }
                });
                
                // Close on escape key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && modal.classList.contains('active')) {
                        closeModal();
                    }
                });
                
                console.log('Preferences modal initialized');
            }
        } catch (e) {
            console.error('Preferences modal error:', e);
        }
    }
    
    // Update session statuses
    function updateSessions() {
        try {
            var now = new Date();
            var currentHour = now.getUTCHours();
            var currentMinute = now.getUTCMinutes();
            var currentTime = currentHour + (currentMinute / 60);
            
            // Check if session is active
            function isSessionActive(session) {
                if (session.start > session.end) {
                    return currentTime >= session.start || currentTime < session.end;
                }
                return currentTime >= session.start && currentTime < session.end;
            }
            
            // Check London-NY overlap
            function isLondonNYOverlapActive() {
                var londonStart = SESSIONS.LONDON.start;
                var londonEnd = SESSIONS.LONDON.end;
                var nyStart = SESSIONS.NY.start;
                var nyEnd = SESSIONS.NY.end;
                
                var londonActive = isSessionActive(SESSIONS.LONDON);
                var nyActive = isSessionActive(SESSIONS.NY);
                
                return londonActive && nyActive;
            }
            
            // Update individual sessions
            var sessions = [
                { element: document.getElementById('sydney-session'), session: SESSIONS.SYDNEY },
                { element: document.getElementById('tokyo-session'), session: SESSIONS.TOKYO },
                { element: document.getElementById('london-session'), session: SESSIONS.LONDON },
                { element: document.getElementById('ny-session'), session: SESSIONS.NY }
            ];
            
            sessions.forEach(function(item) {
                if (item.element) {
                    var statusElement = item.element.querySelector('.session-status');
                    if (statusElement) {
                        if (isSessionActive(item.session)) {
                            statusElement.textContent = 'Active';
                            statusElement.className = 'session-status active';
                        } else {
                            statusElement.textContent = 'Closed';
                            statusElement.className = 'session-status';
                        }
                    }
                }
            });
            
            // Update London-NY overlap
            var overlapElement = document.getElementById('london-ny-overlap');
            if (overlapElement) {
                var overlapStatus = overlapElement.querySelector('.overlap-status');
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
        } catch (e) {
            console.error('Session update error:', e);
        }
    }
    
    // Apply theme immediately
    function applyTheme(theme) {
        try {
            if (theme === 'system') {
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = prefersDark ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
            console.log('Theme applied:', theme);
        } catch (e) {
            console.error('Theme application error:', e);
        }
    }
    
    // Update UI based on preferences
    function updateUIFromPreferences() {
        try {
            var preferences = loadPreferences();
            
            // Apply theme immediately
            applyTheme(preferences.theme);
            
            // Update timezone displays
            var nigeriaElement = document.getElementById('nigeria-time');
            var hfmElement = document.getElementById('hfm-time');
            var nyElement = document.getElementById('ny-time');
            
            if (nigeriaElement && nigeriaElement.parentElement) {
                nigeriaElement.parentElement.style.display = preferences.timezones.nigeria ? 'block' : 'none';
            }
            if (hfmElement && hfmElement.parentElement) {
                hfmElement.parentElement.style.display = preferences.timezones.hfm ? 'block' : 'none';
            }
            if (nyElement && nyElement.parentElement) {
                nyElement.parentElement.style.display = preferences.timezones.ny ? 'block' : 'none';
            }
            
            // Update session displays
            var sessionElements = [
                { id: 'sydney-session', enabled: preferences.sessions.sydney },
                { id: 'tokyo-session', enabled: preferences.sessions.tokyo },
                { id: 'london-session', enabled: preferences.sessions.london },
                { id: 'ny-session', enabled: preferences.sessions.ny },
                { id: 'london-ny-overlap', enabled: preferences.sessions.overlap }
            ];
            
            sessionElements.forEach(function(item) {
                var element = document.getElementById(item.id);
                if (element) {
                    element.style.display = item.enabled ? 'block' : 'none';
                }
            });
            
        } catch (e) {
            console.error('UI update error:', e);
        }
    }
    
    // Theme toggle functionality
    function initThemeToggles() {
        try {
            var desktopThemeToggle = document.getElementById('desktop-theme-toggle');
            var mobileThemeToggle = document.getElementById('mobile-theme-toggle');
            
            function toggleTheme() {
                var currentTheme = document.documentElement.getAttribute('data-theme');
                var newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                applyTheme(newTheme);
                
                // Save to preferences
                var preferences = loadPreferences();
                preferences.theme = newTheme;
                savePreferences(preferences);
                
                console.log('Theme toggled to:', newTheme);
            }
            
            if (desktopThemeToggle) {
                desktopThemeToggle.addEventListener('click', toggleTheme);
            }
            
            if (mobileThemeToggle) {
                mobileThemeToggle.addEventListener('click', toggleTheme);
            }
            
            console.log('Theme toggles initialized');
        } catch (e) {
            console.error('Theme toggle error:', e);
        }
    }
    
    // Initialize everything
    function init() {
        console.log('Safari iOS comprehensive initialization starting...');
        
        // Update immediately
        updateClocks();
        updateSessionCountdowns();
        updateDailyCountdown();
        updateSessions();
        
        // Apply UI preferences
        updateUIFromPreferences();
        
        // Set up synchronized intervals
        setInterval(updateClocks, 1000);
        setInterval(updateSessionCountdowns, 1000);
        setInterval(updateDailyCountdown, 1000);
        setInterval(updateSessions, 1000);
        
        // Initialize menu and preferences
        initMobileMenu();
        initPreferencesModal();
        initThemeToggles();
        
        console.log('Safari iOS comprehensive initialization complete');
    }
    
    // Try to initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Fallback
    window.addEventListener('load', function() {
        setTimeout(init, 100);
    });
    
})(); 
