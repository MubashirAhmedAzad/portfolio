/* ============================================================
   MAIN.JS — Mubashir Ahmed Azad Portfolio
   Vanilla JavaScript (ES6+)
   Features: Theme toggle, typewriter, smooth scroll, 
   contact form, admin panel, AOS init, stat counter
   ============================================================ */

'use strict';

// ── DOM Elements ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Initialize AOS ──
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 80,
        disable: 'mobile'
    });

    // Initialize Lucide icons
    lucide.createIcons();

    // Initialize all modules
    initThemeToggle();
    initNavbar();
    initTypewriter();
    initCursorGlow();
    initStatCounter();
    initContactForm();
    initAdminPanel();
});

/* ============================================================
   THEME TOGGLE (Light/Dark Mode with localStorage persistence)
   ============================================================ */
function initThemeToggle() {
    const toggle = $('#themeToggle');
    const html = document.documentElement;

    // Load persisted theme
    const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('portfolio-theme', next);

        // Re-initialize Lucide icons after theme change
        lucide.createIcons();
    });
}

/* ============================================================
   NAVBAR — Sticky, scroll-aware, mobile hamburger, active link
   ============================================================ */
function initNavbar() {
    const navbar = $('#navbar');
    const hamburger = $('#hamburger');
    const navMenu = $('#navMenu');
    const navLinks = $$('.navbar__link');
    const sections = $$('section[id]');

    // Scroll effect on navbar
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;

        // Active link detection
        updateActiveNavLink(sections, navLinks);
    });

    // Mobile hamburger toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('open');
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('open');
        }
    });
}

function updateActiveNavLink(sections, navLinks) {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === current) {
            link.classList.add('active');
        }
    });
}

/* ============================================================
   TYPEWRITER EFFECT
   ============================================================ */
function initTypewriter() {
    const element = $('#typewriter');
    const phrases = [
        'Tech Enthusiast',
        'Problem Solver',
        'React Developer',
        'Full Stack Developer',
        'CS Engineering Student'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            element.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            element.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            typingSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 400; // Pause before next phrase
        }

        setTimeout(type, typingSpeed);
    }

    type();
}

/* ============================================================
   CURSOR GLOW EFFECT
   ============================================================ */
function initCursorGlow() {
    const glow = $('#cursorGlow');

    if (window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
            glow.classList.add('active');
        });

        document.addEventListener('mouseleave', () => {
            glow.classList.remove('active');
        });
    }
}

/* ============================================================
   STAT COUNTER ANIMATION
   ============================================================ */
function initStatCounter() {
    const statNumbers = $$('.stat-card__number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count'));
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => observer.observe(num));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 40;
    const duration = 1500;
    const stepTime = duration / 40;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.ceil(current) + '+';
    }, stepTime);
}

/* ============================================================
   CONTACT FORM — Validation, localStorage, Success Message
   ============================================================ */
function initContactForm() {
    const form = $('#contactForm');
    const nameInput = $('#contactName');
    const emailInput = $('#contactEmail');
    const messageInput = $('#contactMessage');
    const emailError = $('#emailError');
    const successMsg = $('#contactSuccess');
    const submitBtn = $('#submitBtn');

    // Email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Real-time email validation
    emailInput.addEventListener('input', () => {
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            emailInput.classList.add('error');
            emailError.classList.add('visible');
        } else {
            emailInput.classList.remove('error');
            emailError.classList.remove('visible');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate email
        if (!emailRegex.test(emailInput.value)) {
            emailInput.classList.add('error');
            emailError.classList.add('visible');
            emailInput.focus();
            return;
        }

        // Create submission object
        const submission = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            message: messageInput.value.trim(),
            timestamp: new Date().toISOString()
        };

        // Store in localStorage
        const responses = JSON.parse(localStorage.getItem('portfolio-responses') || '[]');
        responses.push(submission);
        localStorage.setItem('portfolio-responses', JSON.stringify(responses));

        // Show success message
        form.style.display = 'none';
        successMsg.classList.add('visible');

        // Re-initialize icons for success checkmark
        lucide.createIcons();

        // Reset form after delay
        setTimeout(() => {
            form.reset();
            form.style.display = 'block';
            successMsg.classList.remove('visible');
            emailInput.classList.remove('error');
            emailError.classList.remove('visible');
        }, 4000);
    });
}

/* ============================================================
   ADMIN PANEL — Login, Logout, Response Viewer
   ============================================================ */
function initAdminPanel() {
    const loginSection = $('#adminLogin');
    const dashboard = $('#adminDashboard');
    const loginForm = $('#adminForm');
    const adminError = $('#adminError');
    const logoutBtn = $('#adminLogout');

    // Admin credentials (simple JS check)
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'admin123';

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = $('#adminUser').value.trim();
        const password = $('#adminPass').value.trim();

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            loginSection.classList.add('hidden');
            dashboard.classList.remove('hidden');
            adminError.style.display = 'none';
            renderResponses();
        } else {
            adminError.style.display = 'block';
            adminError.classList.add('visible');

            // Shake animation
            loginForm.style.animation = 'shake 0.5s ease';
            setTimeout(() => { loginForm.style.animation = ''; }, 500);
        }
    });

    logoutBtn.addEventListener('click', () => {
        dashboard.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginForm.reset();
    });
}

function renderResponses() {
    const container = $('#responsesContainer');
    const countEl = $('#responseCount');
    const responses = JSON.parse(localStorage.getItem('portfolio-responses') || '[]');

    countEl.textContent = `Total Responses: ${responses.length}`;

    if (responses.length === 0) {
        container.innerHTML = `
            <div class="response-card" style="text-align: center; padding: 3rem;">
                <p style="color: var(--clr-text-muted); font-size: var(--font-size-md);">
                    No responses yet. Submissions from the contact form will appear here.
                </p>
            </div>
        `;
        return;
    }

    // Render responses in reverse chronological order
    container.innerHTML = responses
        .slice()
        .reverse()
        .map(r => {
            const date = new Date(r.timestamp);
            const formatted = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="response-card">
                    <div class="response-card__header">
                        <span class="response-card__name">${escapeHtml(r.name)}</span>
                        <span class="response-card__time">${formatted}</span>
                    </div>
                    <div class="response-card__email">${escapeHtml(r.email)}</div>
                    <div class="response-card__message">${escapeHtml(r.message)}</div>
                </div>
            `;
        })
        .join('');
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ── CSS Shake Animation (injected via JS) ──
const shakeCSS = document.createElement('style');
shakeCSS.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeCSS);
