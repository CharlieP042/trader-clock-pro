// Timezone offsets in hours
const TIMEZONES = {
    NIGERIA: 1,    // GMT+1
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
let alerts = JSON.parse(localStorage.getItem('alerts')) || [];

// Theme Management
const themeToggle = document.getElementById('theme-toggle');
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
    theme: 'dark',
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

// Load preferences from localStorage
function loadPreferences() {
    const savedPreferences = localStorage.getItem('preferences');
    return savedPreferences ? JSON.parse(savedPreferences) : DEFAULT_PREFERENCES;
}

// Save preferences to localStorage
function savePreferences(preferences) {
    localStorage.setItem('preferences', JSON.stringify(preferences));
}

// Update a specific preference
function updatePreference(key, value) {
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
}

// Reset preferences to default
function resetPreferences() {
    savePreferences(DEFAULT_PREFERENCES);
    window.dispatchEvent(new CustomEvent('preferencesReset'));
}

// Preferences Management
let preferences = loadPreferences();

// Set initial theme
function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

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

// Get current GMT hour
function getCurrentGMTHour() {
    return new Date().getUTCHours();
}

// Check if a session is active
function isSessionActive(session) {
    const currentHour = getCurrentGMTHour();
    return currentHour >= session.start && currentHour < session.end;
}

// Check if London-NY overlap is active
function isLondonNYOverlapActive() {
    const currentHour = getCurrentGMTHour();
    return currentHour >= SESSIONS.LONDON.start && currentHour < SESSIONS.NY.end;
}

// Update session statuses
function updateSessions() {
    // Update individual sessions
    const sessions = [
        { element: sydneySession, session: SESSIONS.SYDNEY },
        { element: tokyoSession, session: SESSIONS.TOKYO },
        { element: londonSession, session: SESSIONS.LONDON },
        { element: nySession, session: SESSIONS.NY }
    ];

    sessions.forEach(({ element, session }) => {
        const statusElement = element.querySelector('.session-status');
        if (isSessionActive(session)) {
            statusElement.textContent = 'Active';
            statusElement.classList.add('active');
        } else {
            statusElement.textContent = 'Closed';
            statusElement.classList.remove('active');
        }
    });

    // Update London-NY overlap
    const overlapStatus = londonNyOverlap.querySelector('.overlap-status');
    if (isLondonNYOverlapActive()) {
        overlapStatus.textContent = 'Active';
        overlapStatus.classList.add('active');
    } else {
        overlapStatus.textContent = 'Closed';
        overlapStatus.classList.remove('active');
    }
}

// Update all clocks
function updateClocks() {
    // Nigeria Time (GMT+1)
    const nigeriaTime = getTimeInTimezone(TIMEZONES.NIGERIA);
    nigeriaTimeDisplay.textContent = formatTime(nigeriaTime);
    
    // HFM Server Time
    const hfmTime = getTimeInTimezone(TIMEZONES.HFM);
    hfmTimeDisplay.textContent = formatTime(hfmTime);
    
    // New York Time
    const nyTime = getTimeInTimezone(TIMEZONES.NY);
    nyTimeDisplay.textContent = formatTime(nyTime);

    // Update session statuses
    updateSessions();
}

// Check for DST in New York
function isDSTActive() {
    const date = new Date();
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    return Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset()) === date.getTimezoneOffset();
}

// Update timezone offsets based on DST
function updateTimezoneOffsets() {
    if (isDSTActive()) {
        TIMEZONES.NY = -4;  // EDT
        TIMEZONES.HFM = 3;  // GMT+3 during DST
    } else {
        TIMEZONES.NY = -5;  // EST
        TIMEZONES.HFM = 2;  // GMT+2 during standard time
    }
}

// Create alert element
function createAlertElement(alert) {
    const alertElement = document.createElement('div');
    alertElement.className = 'alert-item';
    alertElement.innerHTML = `
        <div class="alert-info">
            <div class="alert-time">${alert.time} (${alert.timezone})</div>
            <div class="alert-message">${alert.message}</div>
        </div>
        <button class="delete-alert" data-id="${alert.id}">×</button>
    `;
    return alertElement;
}

// Update alerts list
function updateAlertsList() {
    alertsList.innerHTML = '';
    const categoryFilter = filterCategory.value;
    const priorityFilter = filterPriority.value;
    
    const filteredAlerts = alerts.filter(alert => {
        const categoryMatch = categoryFilter === 'all' || alert.category === categoryFilter;
        const priorityMatch = priorityFilter === 'all' || alert.priority === priorityFilter;
        return categoryMatch && priorityMatch;
    });

    filteredAlerts.forEach(alert => {
        alertsList.appendChild(createAlertElement(alert));
    });
    localStorage.setItem('alerts', JSON.stringify(alerts));
}

// Play alert sound
function playAlertSound(soundType) {
    const audio = new Audio(ALERT_SOUNDS[soundType]);
    audio.play();
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

// Daily Candle Countdown
function updateDailyCountdown() {
    const hfmTime = getTimeInTimezone(TIMEZONES.HFM);
    
    // Daily candle closes at 00:00 HFM time
    const nextClose = new Date(hfmTime);
    nextClose.setHours(24, 0, 0, 0);
    
    // Calculate time until next close
    const timeUntilClose = nextClose - hfmTime;
    const hoursUntilClose = Math.floor(timeUntilClose / (1000 * 60 * 60));
    const minutesUntilClose = Math.floor((timeUntilClose % (1000 * 60 * 60)) / (1000 * 60));
    const secondsUntilClose = Math.floor((timeUntilClose % (1000 * 60)) / 1000);
    
    // Format the countdown
    const countdownDisplay = `${String(hoursUntilClose).padStart(2, '0')}:${String(minutesUntilClose).padStart(2, '0')}:${String(secondsUntilClose).padStart(2, '0')}`;
    document.getElementById('daily-countdown').textContent = countdownDisplay;
    document.getElementById('next-candle').textContent = countdownDisplay;
}

// Calculate time until next session
function calculateTimeUntilNextSession(session) {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinutes = now.getUTCMinutes();
    const currentSeconds = now.getUTCSeconds();
    
    let nextSessionStart;
    const today = new Date(now);
    today.setUTCHours(session.start, 0, 0, 0);
    
    if (currentHour >= session.start) {
        // Next session is tomorrow
        nextSessionStart = new Date(today);
        nextSessionStart.setUTCDate(nextSessionStart.getUTCDate() + 1);
    } else {
        // Next session is today
        nextSessionStart = today;
    }
    
    const timeUntilNext = nextSessionStart - now;
    return timeUntilNext;
}

// Format countdown time
function formatCountdownTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update session countdowns
function updateSessionCountdowns() {
    const sessions = [
        { element: sydneyCountdown, session: SESSIONS.SYDNEY },
        { element: tokyoCountdown, session: SESSIONS.TOKYO },
        { element: londonCountdown, session: SESSIONS.LONDON },
        { element: nyCountdown, session: SESSIONS.NY }
    ];

    sessions.forEach(({ element, session }) => {
        const timeUntilNext = calculateTimeUntilNextSession(session);
        element.textContent = formatCountdownTime(timeUntilNext);
    });
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

// Initialize preferences modal
function initPreferencesModal() {
    const modal = document.getElementById('preferences-modal');
    const closeBtn = document.getElementById('close-preferences');
    const saveBtn = document.getElementById('save-preferences');
    const resetBtn = document.getElementById('reset-preferences');
    const preferencesLink = document.getElementById('preferences-link');
    
    // Open modal when clicking preferences link
    preferencesLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        loadPreferencesToForm();
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Save preferences
    saveBtn.addEventListener('click', () => {
        savePreferencesFromForm();
        updateUIFromPreferences();
        modal.classList.remove('active');
    });
    
    // Reset preferences
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all preferences to default?')) {
            resetPreferences();
            preferences = loadPreferences();
            loadPreferencesToForm();
            updateUIFromPreferences();
        }
    });
}

// Load preferences into form
function loadPreferencesToForm() {
    // Theme
    document.getElementById('theme-select').value = preferences.theme;
    
    // Timezones
    document.getElementById('timezone-nigeria').checked = preferences.timezones.nigeria;
    document.getElementById('timezone-hfm').checked = preferences.timezones.hfm;
    document.getElementById('timezone-ny').checked = preferences.timezones.ny;
    
    // Alert settings
    document.getElementById('alert-sound-select').value = preferences.alertSound;
    document.getElementById('alert-volume').value = preferences.alertVolume * 100;
    
    // Sessions
    document.getElementById('session-sydney').checked = preferences.sessions.sydney;
    document.getElementById('session-tokyo').checked = preferences.sessions.tokyo;
    document.getElementById('session-london').checked = preferences.sessions.london;
    document.getElementById('session-ny').checked = preferences.sessions.ny;
    document.getElementById('session-overlap').checked = preferences.sessions.overlap;
    
    // Notifications
    document.getElementById('notifications-enabled').checked = preferences.notifications.enabled;
    document.getElementById('notification-session-start').checked = preferences.notifications.sessionStart;
    document.getElementById('notification-session-end').checked = preferences.notifications.sessionEnd;
    document.getElementById('notification-daily-candle').checked = preferences.notifications.dailyCandle;
    document.getElementById('notification-custom-alerts').checked = preferences.notifications.customAlerts;
}

// Save preferences from form
function savePreferencesFromForm() {
    preferences = {
        theme: document.getElementById('theme-select').value,
        timezones: {
            nigeria: document.getElementById('timezone-nigeria').checked,
            hfm: document.getElementById('timezone-hfm').checked,
            ny: document.getElementById('timezone-ny').checked
        },
        alertSound: document.getElementById('alert-sound-select').value,
        alertVolume: document.getElementById('alert-volume').value / 100,
        sessions: {
            sydney: document.getElementById('session-sydney').checked,
            tokyo: document.getElementById('session-tokyo').checked,
            london: document.getElementById('session-london').checked,
            ny: document.getElementById('session-ny').checked,
            overlap: document.getElementById('session-overlap').checked
        },
        notifications: {
            enabled: document.getElementById('notifications-enabled').checked,
            sessionStart: document.getElementById('notification-session-start').checked,
            sessionEnd: document.getElementById('notification-session-end').checked,
            dailyCandle: document.getElementById('notification-daily-candle').checked,
            customAlerts: document.getElementById('notification-custom-alerts').checked
        }
    };
    
    savePreferences(preferences);
}

// Update the init function to include preferences initialization
function init() {
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
    updateUIFromPreferences();
}

// Start the application
init();

// Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container') && navLinks.classList.contains('active')) {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
    }
});
