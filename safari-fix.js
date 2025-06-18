// Minimal Safari iOS fix
(function() {
    'use strict';
    
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (!isIOS && !isSafari) return;
    
    console.log('Safari iOS detected - loading minimal fix');
    
    // Simple time formatting
    function formatTime(date) {
        var hours = date.getHours().toString().padStart(2, '0');
        var minutes = date.getMinutes().toString().padStart(2, '0');
        var seconds = date.getSeconds().toString().padStart(2, '0');
        return hours + ':' + minutes + ':' + seconds;
    }
    
    // Update clocks
    function updateClocks() {
        try {
            var now = new Date();
            
            // Nigeria time (GMT+1)
            var nigeriaTime = new Date(now.getTime() + (1 * 60 * 60 * 1000));
            var nigeriaEl = document.getElementById('nigeria-time');
            if (nigeriaEl) nigeriaEl.textContent = formatTime(nigeriaTime);
            
            // HFM time (GMT+2)
            var hfmTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
            var hfmEl = document.getElementById('hfm-time');
            if (hfmEl) hfmEl.textContent = formatTime(hfmTime);
            
            // NY time (GMT-4)
            var nyTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
            var nyEl = document.getElementById('ny-time');
            if (nyEl) nyEl.textContent = formatTime(nyTime);
            
        } catch (e) {
            console.error('Clock update error:', e);
        }
    }
    
    // Update countdowns
    function updateCountdowns() {
        try {
            var countdownIds = [
                'sydney-countdown', 
                'tokyo-countdown', 
                'london-countdown', 
                'ny-countdown', 
                'daily-countdown', 
                'next-candle'
            ];
            
            countdownIds.forEach(function(id) {
                var el = document.getElementById(id);
                if (el) {
                    // Simple countdown display
                    var now = new Date();
                    var hours = (23 - now.getHours()).toString().padStart(2, '0');
                    var minutes = (59 - now.getMinutes()).toString().padStart(2, '0');
                    var seconds = (59 - now.getSeconds()).toString().padStart(2, '0');
                    el.textContent = hours + ':' + minutes + ':' + seconds;
                }
            });
        } catch (e) {
            console.error('Countdown update error:', e);
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
                } else {
                    preferencesLink.addEventListener('click', openModal);
                    if (closeBtn) {
                        closeBtn.addEventListener('click', closeModal);
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
                
                // Save and reset buttons
                if (saveBtn) {
                    saveBtn.addEventListener('click', function() {
                        console.log('Preferences saved');
                        closeModal();
                    });
                }
                
                if (resetBtn) {
                    resetBtn.addEventListener('click', function() {
                        console.log('Preferences reset');
                    });
                }
                
                console.log('Preferences modal initialized');
            }
        } catch (e) {
            console.error('Preferences modal error:', e);
        }
    }
    
    // Initialize everything
    function init() {
        console.log('Safari iOS initialization starting...');
        
        // Update immediately
        updateClocks();
        updateCountdowns();
        
        // Set up intervals
        setInterval(updateClocks, 1000);
        setInterval(updateCountdowns, 1000);
        
        // Initialize menu and preferences
        initMobileMenu();
        initPreferencesModal();
        
        console.log('Safari iOS initialization complete');
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
