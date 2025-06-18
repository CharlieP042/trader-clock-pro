// Timezone offsets in hours
const TIMEZONES = {
    NIGERIA: 1,    // GMT+1 (No DST)
    HFM: 2,        // GMT+2 (will be adjusted for DST)
    NY: -4         // GMT-4 (will be adjusted for DST)
};

// Trading session times in GMT
const SESSIONS = {
    SYDNEY: { start: 0, end: 9 },
    TOKYO: { start: 0, end: 9 },
    LONDON: { start: 8, end: 17 },
    NY: { start: 13, end: 22 }
};

// DOM Elements
const nigeriaTimeDisplay = document.getElementById('nigeria-time');
const hfmTimeDisplay = document.getElementById('hfm-time');
const nyTimeDisplay = document.getElementById('ny-time');

// Session elements
const sydneySession = document.getElementById('sydney-session');
const tokyoSession = document.getElementById('tokyo-session');
const londonSession = document.getElementById('london-session');
const nySession = document.getElementById('ny-session');
const londonNyOverlap = document.getElementById('london-ny-overlap');

// Alert Management
const alertForm = document.getElementById('alert-form');
const alertsList = document.getElementById('alerts-list');
const filterCategory = document.getElementById('filter-category');
const filterPriority = document.getElementById('filter-priority');
let alerts = [];

// Theme Management
const desktopThemeToggle = document.getElementById('desktop-theme-toggle');
const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Session countdown elements
const sydneyCountdown = document.getElementById('sydney-countdown');
const tokyoCountdown = document.getElementById('tokyo-countdown');
const londonCountdown = document.getElementById('london-countdown');
const nyCountdown = document.getElementById('ny-countdown');

// Alert sound URLs
const ALERT_SOUNDS = {
    bell: 'https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3',
    chime: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
    beep: 'https://assets.mixkit.co/sfx/preview/mixkit-interface-hint-notification-911.mp3',
    ding: 'https://assets.mixkit.co/sfx/preview/mixkit-notification-bell-remote-886.mp3'
};

// Default preferences
const DEFAULT_PREFERENCES = {
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

// Safari detection and fixes
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// Safari-specific fixes
if (isSafari || isIOS) {
    console.log('Safari/iOS detected, applying specific fixes...');
    
    // Fix for Safari's strict JavaScript policies
    document.addEventListener('DOMContentLoaded', function() {
        // Force a repaint to ensure elements are properly rendered
        document.body.style.display = 'none';
        document.body.offsetHeight; // Force reflow
        document.body.style.display = '';
    });
}

// More robust initialization for Safari
function safariSafeInit() {
    try {
        console.log('Safari-safe initialization starting...');
        
        // Use requestAnimationFrame for better Safari compatibility
        const initWithRAF = () => {
            try {
                setInitialTheme();
                updateTimezoneOffsets();
                updateClocks();
                
                // Use more conservative intervals for Safari
                const interval = isSafari || isIOS ? 2000 : 1000;
                
                setInterval(updateClocks, interval);
                setInterval(checkAlerts, interval);
                setInterval(updateDailyCountdown, interval);
                setInterval(updateSessionCountdowns, interval);
                
                // Initial updates
                updateDailyCountdown();
                updateSessionCountdowns();
                updateAlertsList();
                
                initPreferencesModal();
                initMobileMenu();
                updateUIFromPreferences();
                
                console.log('Safari-safe initialization complete');
            } catch (error) {
                console.error('Error in Safari-safe initialization:', error);
            }
        };
        
        // Use requestAnimationFrame for better timing
        if (window.requestAnimationFrame) {
            requestAnimationFrame(initWithRAF);
        } else {
            setTimeout(initWithRAF, 100);
        }
        
    } catch (error) {
        console.error('Error in safariSafeInit:', error);
    }
}

// Load preferences from localStorage with error handling
function loadPreferences() {
    try {
        const savedPreferences = localStorage.getItem('preferences');
        return savedPreferences ? JSON.parse(savedPreferences) : DEFAULT_PREFERENCES;
    } catch (error) {
        console.error('Error loading preferences:', error);
        return DEFAULT_PREFERENCES;
    }
}

// Save preferences to localStorage with error handling
function savePreferences(preferences) {
    try {
        localStorage.setItem('preferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving preferences:', error);
        showNotification('Failed to save preferences. Please check your browser storage permissions.', 'error');
    }
}

// Update a specific preference with error handling
function updatePreference(key, value) {
    try {
        const preferences = loadPreferences();
        const keys = key.split('.');
        let current = preferences;
        
        // Navigate to the nested property
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        // Update the value
        current[keys[keys.length - 1]] = value;
        
        // Save the updated preferences
        savePreferences(preferences);
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('preferencesUpdated', {
            detail: { key, value }
        }));
        
        return true;
    } catch (error) {
        console.error('Error updating preference:', error);
        showNotification('Failed to update preference', 'error');
        return false;
    }
}

// Reset preferences to default
function resetPreferences() {
    savePreferences(DEFAULT_PREFERENCES);
    window.dispatchEvent(new CustomEvent('preferencesReset'));
}

// Preferences Management
let preferences = loadPreferences();

// Set initial theme with proper handling
function setInitialTheme() {
    const preferences = loadPreferences();
    let theme = preferences.theme;
    
    if (theme === 'system') {
        theme = prefersDarkScheme.matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
}

// Toggle theme with proper handling
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    updatePreference('theme', newTheme);
}

// Theme toggle event listeners
desktopThemeToggle.addEventListener('click', toggleTheme);
mobileThemeToggle.addEventListener('click', toggleTheme);

// Format time as HH:MM:SS
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Get time in specific timezone
function getTimeInTimezone(offset) {
    const date = new Date();
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * offset));
}

// Get current GMT hour with proper handling
function getCurrentGMTHour() {
    return new Date().getUTCHours();
}

// Check if a session is active with proper timezone handling
function isSessionActive(session) {
    const currentHour = getCurrentGMTHour();
    const currentMinute = new Date().getUTCMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    // Handle sessions that cross midnight
    if (session.start > session.end) {
        return currentTime >= session.start || currentTime < session.end;
    }
    
    return currentTime >= session.start && currentTime < session.end;
}

// Check if London-NY overlap is active with proper timezone handling
function isLondonNYOverlapActive() {
    const currentHour = getCurrentGMTHour();
    const currentMinute = new Date().getUTCMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    return currentTime >= SESSIONS.LONDON.start && currentTime < SESSIONS.NY.end;
}

// Update session statuses with proper handling
function updateSessions() {
    try {
        // Sydney Session
        if (sydneySession) {
            const sydneyStatus = sydneySession.querySelector('.session-status');
            if (sydneyStatus) {
                sydneyStatus.textContent = isSessionActive(SESSIONS.SYDNEY) ? 'Active' : 'Closed';
                sydneyStatus.className = `session-status ${isSessionActive(SESSIONS.SYDNEY) ? 'active' : ''}`;
            }
        }

        // Tokyo Session
        if (tokyoSession) {
            const tokyoStatus = tokyoSession.querySelector('.session-status');
            if (tokyoStatus) {
                tokyoStatus.textContent = isSessionActive(SESSIONS.TOKYO) ? 'Active' : 'Closed';
                tokyoStatus.className = `session-status ${isSessionActive(SESSIONS.TOKYO) ? 'active' : ''}`;
            }
        }

        // London Session
        if (londonSession) {
            const londonStatus = londonSession.querySelector('.session-status');
            if (londonStatus) {
                londonStatus.textContent = isSessionActive(SESSIONS.LONDON) ? 'Active' : 'Closed';
                londonStatus.className = `session-status ${isSessionActive(SESSIONS.LONDON) ? 'active' : ''}`;
            }
        }

        // New York Session
        if (nySession) {
            const nyStatus = nySession.querySelector('.session-status');
            if (nyStatus) {
                nyStatus.textContent = isSessionActive(SESSIONS.NY) ? 'Active' : 'Closed';
                nyStatus.className = `session-status ${isSessionActive(SESSIONS.NY) ? 'active' : ''}`;
            }
        }

        // London-NY Overlap
        if (londonNyOverlap) {
            const overlapStatus = londonNyOverlap.querySelector('.overlap-status');
            if (overlapStatus) {
                overlapStatus.textContent = isLondonNYOverlapActive() ? 'Active' : 'Closed';
                overlapStatus.className = `overlap-status ${isLondonNYOverlapActive() ? 'active' : ''}`;
            }
        }
    } catch (error) {
        console.error('Error updating sessions:', error);
    }
}

// Helper function to check DST for a specific timezone
function isDSTActiveForTimezone(timezone) {
    const date = new Date();
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    
    // Create dates in the target timezone
    const janInTimezone = new Date(jan.getTime() + (3600000 * timezone));
    const julInTimezone = new Date(jul.getTime() + (3600000 * timezone));
    const currentInTimezone = new Date(date.getTime() + (3600000 * timezone));
    
    return Math.min(janInTimezone.getTimezoneOffset(), julInTimezone.getTimezoneOffset()) === currentInTimezone.getTimezoneOffset();
}

// Update timezone offsets based on DST
function updateTimezoneOffsets() {
    // NY DST check
    if (isDSTActiveForTimezone(TIMEZONES.NY)) {
        TIMEZONES.NY = -4;  // EDT
    } else {
        TIMEZONES.NY = -5;  // EST
    }
    
    // HFM DST check
    if (isDSTActiveForTimezone(TIMEZONES.HFM)) {
        TIMEZONES.HFM = 3;  // GMT+3 during DST
    } else {
        TIMEZONES.HFM = 2;  // GMT+2 during standard time
    }
}

// Update clocks with proper handling
function updateClocks() {
    try {
        const nigeriaTime = getTimeInTimezone(TIMEZONES.NIGERIA);
        const hfmTime = getTimeInTimezone(TIMEZONES.HFM);
        const nyTime = getTimeInTimezone(TIMEZONES.NY);

        if (nigeriaTimeDisplay) {
            nigeriaTimeDisplay.textContent = formatTime(nigeriaTime);
        }
        if (hfmTimeDisplay) {
            hfmTimeDisplay.textContent = formatTime(hfmTime);
        }
        if (nyTimeDisplay) {
            nyTimeDisplay.textContent = formatTime(nyTime);
        }

        updateSessions();
    } catch (error) {
        console.error('Error updating clocks:', error);
    }
}

// Load alerts from localStorage with error handling
function loadAlerts() {
    try {
        const savedAlerts = localStorage.getItem('alerts');
        alerts = savedAlerts ? JSON.parse(savedAlerts) : [];
    } catch (error) {
        console.error('Error loading alerts:', error);
        alerts = [];
    }
}

// Save alerts to localStorage with error handling
function saveAlerts() {
    try {
        localStorage.setItem('alerts', JSON.stringify(alerts));
    } catch (error) {
        console.error('Error saving alerts:', error);
        // Show user-friendly error message
        showNotification('Failed to save alerts. Please check your browser storage permissions.', 'error');
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Create alert element with error handling
function createAlertElement(alert) {
    try {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item priority-${alert.priority}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <span class="alert-time">${alert.time}</span>
                <span class="alert-category">${alert.category}</span>
                <span class="alert-priority">${alert.priority}</span>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-actions">
                <button class="btn-delete" onclick="deleteAlert('${alert.id}')">Delete</button>
            </div>
        `;
        return alertElement;
    } catch (error) {
        console.error('Error creating alert element:', error);
        return null;
    }
}

// Update alerts list with error handling
function updateAlertsList() {
    try {
        alertsList.innerHTML = '';
        const filteredAlerts = alerts.filter(alert => {
            const categoryMatch = filterCategory.value === 'all' || alert.category === filterCategory.value;
            const priorityMatch = filterPriority.value === 'all' || alert.priority === filterPriority.value;
            return categoryMatch && priorityMatch;
        });

        filteredAlerts.forEach(alert => {
            const alertElement = createAlertElement(alert);
            if (alertElement) {
                alertsList.appendChild(alertElement);
            }
        });
    } catch (error) {
        console.error('Error updating alerts list:', error);
        showNotification('Failed to update alerts list', 'error');
    }
}

// Play alert sound with error handling
function playAlertSound(soundType) {
    try {
        const audio = new Audio(ALERT_SOUNDS[soundType]);
        audio.volume = preferences.alertVolume || 0.8;
        audio.play().catch(error => {
            console.error('Error playing alert sound:', error);
            showNotification('Failed to play alert sound. Please check your browser audio settings.', 'error');
        });
    } catch (error) {
        console.error('Error initializing alert sound:', error);
    }
}

// Check alerts
function checkAlerts() {
    const now = new Date();
    alerts.forEach(alert => {
        if (!alert.triggered) {
            const alertTime = new Date();
            const [hours, minutes] = alert.time.split(':');
            alertTime.setHours(parseInt(hours), parseInt(minutes), 0);

            // Convert to appropriate timezone
            let timezoneOffset;
            switch (alert.timezone) {
                case 'nigeria':
                    timezoneOffset = TIMEZONES.NIGERIA;
                    break;
                case 'hfm':
                    timezoneOffset = TIMEZONES.HFM;
                    break;
                case 'ny':
                    timezoneOffset = TIMEZONES.NY;
                    break;
            }

            const alertTimeInTimezone = getTimeInTimezone(timezoneOffset);
            const currentTimeInTimezone = getTimeInTimezone(timezoneOffset);

            if (alertTimeInTimezone.getHours() === currentTimeInTimezone.getHours() &&
                alertTimeInTimezone.getMinutes() === currentTimeInTimezone.getMinutes()) {
                
                // Show notification
                if (Notification.permission === 'granted') {
                    new Notification('Trading Alert', {
                        body: `${alert.message} (${alert.category} - ${alert.priority} priority)`
                    });
                }

                // Play selected sound
                playAlertSound(alert.sound);

                if (!alert.repeat) {
                    alert.triggered = true;
                }
            }
        }
    });

    // Remove triggered non-repeating alerts
    alerts = alerts.filter(alert => !alert.triggered);
    updateAlertsList();
}

// Handle form submission
alertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const time = document.getElementById('alert-time').value;
    const timezone = document.getElementById('alert-timezone').value;
    const category = document.getElementById('alert-category').value;
    const priority = document.getElementById('alert-priority').value;
    const sound = document.getElementById('alert-sound').value;
    const message = document.getElementById('alert-message').value;
    const repeat = document.getElementById('alert-repeat').checked;

    const alert = {
        id: Date.now(),
        time,
        timezone,
        category,
        priority,
        sound,
        message,
        repeat,
        triggered: false
    };

    alerts.push(alert);
    updateAlertsList();
    alertForm.reset();
});

// Handle alert deletion
alertsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-alert')) {
        const alertId = parseInt(e.target.dataset.id);
        alerts = alerts.filter(alert => alert.id !== alertId);
        updateAlertsList();
    }
});

// Handle alert filters
filterCategory.addEventListener('change', updateAlertsList);
filterPriority.addEventListener('change', updateAlertsList);

// Request notification permission
if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}

// Calculate time until next session with Safari compatibility
function calculateTimeUntilNextSession(session) {
    try {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const currentSecond = now.getUTCSeconds();
        
        let targetHour = session.start;
        let targetDate = new Date(now);
        
        // If session has already started today, calculate for next day
        if (currentHour >= session.end) {
            targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        }
        
        // Set target time
        targetDate.setUTCHours(targetHour, 0, 0, 0);
        
        // Calculate time difference
        const timeDiff = targetDate.getTime() - now.getTime();
        
        // Safari-specific validation
        if (isSafari || isIOS) {
            if (isNaN(timeDiff) || timeDiff < 0) {
                console.warn('Invalid time difference calculated, using fallback');
                return 3600000; // 1 hour fallback
            }
        }
        
        return timeDiff;
    } catch (error) {
        console.error('Error calculating time until next session:', error);
        return 3600000; // 1 hour fallback
    }
}

// Format countdown time with proper handling
function formatCountdownTime(milliseconds) {
    if (milliseconds < 0) return '--:--:--';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update session countdowns with proper handling
function updateSessionCountdowns() {
    try {
        const sessions = [
            { element: sydneyCountdown, session: SESSIONS.SYDNEY },
            { element: tokyoCountdown, session: SESSIONS.TOKYO },
            { element: londonCountdown, session: SESSIONS.LONDON },
            { element: nyCountdown, session: SESSIONS.NY }
        ];
        
        sessions.forEach(({ element, session }) => {
            if (element) {
                const timeUntilNext = calculateTimeUntilNextSession(session);
                element.textContent = formatCountdownTime(timeUntilNext);
            }
        });
    } catch (error) {
        console.error('Error updating session countdowns:', error);
    }
}

// Update daily countdown with proper handling
function updateDailyCountdown() {
    try {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const currentSecond = now.getUTCSeconds();
        
        // Calculate time until next daily candle (HFM Server Time)
        const hfmOffset = TIMEZONES.HFM;
        const hfmHour = (currentHour + hfmOffset + 24) % 24;
        
        // Calculate time until daily close
        let closeDate = new Date(now);
        if (hfmHour >= 0) {
            closeDate.setUTCDate(closeDate.getUTCDate() + 1);
        }
        closeDate.setUTCHours(-hfmOffset, 0, 0, 0);
        const timeUntilClose = closeDate.getTime() - now.getTime();
        
        // Calculate time until next candle open
        let openDate = new Date(closeDate);
        openDate.setUTCHours(openDate.getUTCHours() + 1); // Next candle opens 1 hour after close
        const timeUntilOpen = openDate.getTime() - now.getTime();
        
        // Update both countdown displays
        const dailyCountdownElement = document.getElementById('daily-countdown');
        const nextCandleElement = document.getElementById('next-candle');
        
        if (dailyCountdownElement) {
            dailyCountdownElement.textContent = formatCountdownTime(timeUntilClose);
        }
        if (nextCandleElement) {
            nextCandleElement.textContent = formatCountdownTime(timeUntilOpen);
        }
    } catch (error) {
        console.error('Error updating daily countdown:', error);
    }
}

// Update UI based on preferences
function updateUIFromPreferences() {
    // Update theme
    document.documentElement.setAttribute('data-theme', preferences.theme);
    
    // Update timezone displays
    document.getElementById('nigeria-time').parentElement.style.display = 
        preferences.timezones.nigeria ? 'block' : 'none';
    document.getElementById('hfm-time').parentElement.style.display = 
        preferences.timezones.hfm ? 'block' : 'none';
    document.getElementById('ny-time').parentElement.style.display = 
        preferences.timezones.ny ? 'block' : 'none';
    
    // Update session displays
    document.getElementById('sydney-session').style.display = 
        preferences.sessions.sydney ? 'block' : 'none';
    document.getElementById('tokyo-session').style.display = 
        preferences.sessions.tokyo ? 'block' : 'none';
    document.getElementById('london-session').style.display = 
        preferences.sessions.london ? 'block' : 'none';
    document.getElementById('ny-session').style.display = 
        preferences.sessions.ny ? 'block' : 'none';
    document.getElementById('london-ny-overlap').style.display = 
        preferences.sessions.overlap ? 'block' : 'none';
}

// Initialize mobile menu
function initMobileMenu() {
    try {
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const navLinks = document.getElementById('nav-links');
        const menuOverlay = document.getElementById('menu-overlay');
        const body = document.body;

        if (!menuToggle || !menuClose || !navLinks || !menuOverlay) {
            console.error('Required navigation elements not found:', {
                menuToggle: !!menuToggle,
                menuClose: !!menuClose,
                navLinks: !!navLinks,
                menuOverlay: !!menuOverlay
            });
            return;
        }

        console.log('Mobile menu elements found, initializing...');

        // Function to close menu
        const closeMenu = () => {
            try {
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('active');
                menuOverlay.classList.remove('active');
                menuOverlay.setAttribute('aria-hidden', 'true');
                
                // Safari-specific body overflow fix
                if (isSafari || isIOS) {
                    setTimeout(() => {
                        body.style.overflow = '';
                    }, 100);
                } else {
                    body.style.overflow = '';
                }
            } catch (error) {
                console.error('Error closing menu:', error);
            }
        };

        // Function to open menu
        const openMenu = () => {
            try {
                menuToggle.classList.add('active');
                menuToggle.setAttribute('aria-expanded', 'true');
                navLinks.classList.add('active');
                menuOverlay.classList.add('active');
                menuOverlay.setAttribute('aria-hidden', 'false');
                
                // Safari-specific body overflow fix
                if (isSafari || isIOS) {
                    setTimeout(() => {
                        body.style.overflow = 'hidden';
                    }, 100);
                } else {
                    body.style.overflow = 'hidden';
                }
            } catch (error) {
                console.error('Error opening menu:', error);
            }
        };

        // Toggle menu on button click - Safari-specific event handling
        const handleMenuToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Menu toggle clicked');
            
            // Safari-specific delay
            if (isSafari || isIOS) {
                setTimeout(() => {
                    openMenu();
                }, 50);
            } else {
                openMenu();
            }
        };

        // Close menu on close button click - Safari-specific event handling
        const handleMenuClose = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Menu close clicked');
            
            // Safari-specific delay
            if (isSafari || isIOS) {
                setTimeout(() => {
                    closeMenu();
                }, 50);
            } else {
                closeMenu();
            }
        };

        // Add event listeners with Safari-specific handling
        if (isSafari || isIOS) {
            // Use touchstart for better iOS responsiveness
            menuToggle.addEventListener('touchstart', handleMenuToggle, { passive: false });
            menuClose.addEventListener('touchstart', handleMenuClose, { passive: false });
            
            // Also add click for fallback
            menuToggle.addEventListener('click', handleMenuToggle);
            menuClose.addEventListener('click', handleMenuClose);
        } else {
            menuToggle.addEventListener('click', handleMenuToggle);
            menuClose.addEventListener('click', handleMenuClose);
        }

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close menu when clicking overlay
        menuOverlay.addEventListener('click', () => {
            closeMenu();
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMenu();
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                    closeMenu();
                }
            }, 250);
        });

        console.log('Mobile menu initialized successfully');
    } catch (error) {
        console.error('Error initializing mobile menu:', error);
    }
}

// Initialize preferences modal
function initPreferencesModal() {
    const modal = document.getElementById('preferences-modal');
    const closeBtn = document.getElementById('close-preferences');
    const preferencesLink = document.getElementById('preferences-link');
    const saveBtn = document.getElementById('save-preferences');
    const resetBtn = document.getElementById('reset-preferences');
    const body = document.body;

    if (!modal || !closeBtn || !preferencesLink) {
        console.error('Required preferences modal elements not found');
        return;
    }

    // Function to close modal
    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
        preferencesLink.focus();
    };

    // Function to open modal
    const openModal = () => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
    };

    // Open modal on preferences link click
    preferencesLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
    });

    // Close modal on close button click
    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Save preferences
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            savePreferencesFromForm();
            closeModal();
        });
    }

    // Reset preferences
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetPreferences();
            loadPreferencesToForm();
        });
    }
}

// Load preferences to form
function loadPreferencesToForm() {
    const preferences = loadPreferences();
    
    // Theme
    document.getElementById('theme-select').value = preferences.theme;
    
    // Timezones
    document.getElementById('timezone-nigeria').checked = preferences.timezones.nigeria;
    document.getElementById('timezone-hfm').checked = preferences.timezones.hfm;
    document.getElementById('timezone-ny').checked = preferences.timezones.ny;
    
    // Sessions
    document.getElementById('session-sydney').checked = preferences.sessions.sydney;
    document.getElementById('session-tokyo').checked = preferences.sessions.tokyo;
    document.getElementById('session-london').checked = preferences.sessions.london;
    document.getElementById('session-ny').checked = preferences.sessions.ny;
    document.getElementById('session-overlap').checked = preferences.sessions.overlap;
    
    // Notifications
    document.getElementById('notifications-enabled').checked = preferences.notifications.enabled;
    document.getElementById('notifications-session-start').checked = preferences.notifications.sessionStart;
    document.getElementById('notifications-session-end').checked = preferences.notifications.sessionEnd;
    document.getElementById('notifications-daily-candle').checked = preferences.notifications.dailyCandle;
    document.getElementById('notifications-custom-alerts').checked = preferences.notifications.customAlerts;
    
    // Alert settings
    document.getElementById('alert-sound-select').value = preferences.alertSound;
    document.getElementById('alert-volume').value = preferences.alertVolume * 100;
}

// Save preferences from form
function savePreferencesFromForm() {
    const preferences = {
        theme: document.getElementById('theme-select').value,
        timezones: {
            nigeria: document.getElementById('timezone-nigeria').checked,
            hfm: document.getElementById('timezone-hfm').checked,
            ny: document.getElementById('timezone-ny').checked
        },
        sessions: {
            sydney: document.getElementById('session-sydney').checked,
            tokyo: document.getElementById('session-tokyo').checked,
            london: document.getElementById('session-london').checked,
            ny: document.getElementById('session-ny').checked,
            overlap: document.getElementById('session-overlap').checked
        },
        notifications: {
            enabled: document.getElementById('notifications-enabled').checked,
            sessionStart: document.getElementById('notifications-session-start').checked,
            sessionEnd: document.getElementById('notifications-session-end').checked,
            dailyCandle: document.getElementById('notifications-daily-candle').checked,
            customAlerts: document.getElementById('notifications-custom-alerts').checked
        },
        alertSound: document.getElementById('alert-sound-select').value,
        alertVolume: document.getElementById('alert-volume').value / 100
    };
    
    savePreferences(preferences);
    showNotification('Preferences saved successfully', 'success');
}

// Test function to verify countdown functionality
function testCountdownFunctionality() {
    try {
        console.log('Testing countdown functionality...');
        
        // Test countdown calculation
        const testSession = { start: 8, end: 17 };
        const timeUntilNext = calculateTimeUntilNextSession(testSession);
        const formattedTime = formatCountdownTime(timeUntilNext);
        
        console.log('Countdown test results:', {
            timeUntilNext,
            formattedTime,
            isValid: formattedTime !== '--:--:--' && timeUntilNext > 0
        });
        
        // Test if countdown elements are updating
        const countdownElements = [
            'sydney-countdown', 'tokyo-countdown', 'london-countdown', 'ny-countdown',
            'daily-countdown', 'next-candle'
        ];
        
        countdownElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`${id}: ${element.textContent}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
        
        return true;
    } catch (error) {
        console.error('Countdown test failed:', error);
        return false;
    }
}

// Update the init function to include mobile menu initialization
function init() {
    try {
        console.log('Initializing Trader Clock Pro...');
        console.log('User Agent:', navigator.userAgent);
        console.log('Is Safari:', isSafari);
        console.log('Is iOS:', isIOS);
        
        // Check if required elements exist
        const requiredElements = [
            'nigeria-time', 'hfm-time', 'ny-time',
            'sydney-countdown', 'tokyo-countdown', 'london-countdown', 'ny-countdown',
            'daily-countdown', 'next-candle',
            'menu-toggle', 'menu-close', 'nav-links', 'menu-overlay'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
        }
        
        // Use Safari-safe initialization if needed
        if (isSafari || isIOS) {
            safariSafeInit();
        } else {
            setInitialTheme();
            updateTimezoneOffsets();
            updateClocks();
            setInterval(updateClocks, 1000);
            updateAlertsList();
            setInterval(checkAlerts, 1000);
            setInterval(updateDailyCountdown, 1000);
            setInterval(updateSessionCountdowns, 1000);
            updateDailyCountdown();
            updateSessionCountdowns();
            initPreferencesModal();
            initMobileMenu();
            updateUIFromPreferences();
        }
        
        // Test countdown functionality
        setTimeout(() => {
            testCountdownFunctionality();
        }, 2000);
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Fallback initialization in case DOMContentLoaded doesn't fire
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}

// Safari-specific initialization
if (isSafari || isIOS) {
    // Additional Safari initialization
    window.addEventListener('load', () => {
        console.log('Safari load event fired, re-checking initialization...');
        setTimeout(() => {
            const nigeriaTimeElement = document.getElementById('nigeria-time');
            if (nigeriaTimeElement && nigeriaTimeElement.textContent === '--:--:--') {
                console.log('Re-initializing for Safari...');
                init();
            }
        }, 500);
    });
}

// Additional fallback for edge cases
window.addEventListener('load', () => {
    // Check if initialization was successful
    const nigeriaTimeElement = document.getElementById('nigeria-time');
    if (nigeriaTimeElement && nigeriaTimeElement.textContent === '--:--:--') {
        console.log('Re-initializing due to incomplete initialization...');
        init();
    }
});
