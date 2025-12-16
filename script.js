(function () {
  'use strict';

  if (typeof window.__app !== 'undefined' && window.__app.__scriptLoaded) {
    return;
  }

  window.__app = window.__app || {};
  window.__app.__scriptLoaded = true;

  const debounce = function (func, wait) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      const later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const throttle = function (func, limit) {
    let inThrottle;
    return function () {
      const args = arguments,
        context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  };

  const BurgerMenuModule = function () {
    if (window.__app.__burgerInit) {
      return;
    }
    window.__app.__burgerInit = true;

    const nav = document.querySelector('.c-nav#main-nav');
    const toggle = document.querySelector('.c-nav__toggle');
    const navList = document.querySelector('.c-nav__list');

    if (!nav || !toggle || !navList) {
      return;
    }

    const body = document.body;
    let isOpen = false;

    const openMenu = function () {
      isOpen = true;
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
    };

    const closeMenu = function () {
      isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    };

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    const navLinks = document.querySelectorAll('.c-nav__link');
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function () {
        if (isOpen) {
          closeMenu();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!isOpen) {
        return;
      }
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    const handleResize = function () {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    };

    window.addEventListener('resize', debounce(handleResize, 100));
  };

  const SmoothScrollModule = function () {
    if (window.__app.__smoothScrollInit) {
      return;
    }
    window.__app.__smoothScrollInit = true;

    const getHeaderHeight = function () {
      const header = document.querySelector('.l-header');
      return header ? header.offsetHeight : 80;
    };

    document.addEventListener('click', function (e) {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target || target.tagName !== 'A') {
        return;
      }

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') {
        return;
      }

      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) {
        return;
      }

      const hash = hashIndex === 0 ? href.substring(1) : href.substring(hashIndex + 1);
      if (!hash) {
        return;
      }

      const isInternalLink = hashIndex === 0 || (href.indexOf('/') === 0 && hashIndex > 0);
      if (!isInternalLink) {
        return;
      }

      if (hashIndex > 0) {
        const pathname = href.substring(0, hashIndex);
        const currentPath = window.location.pathname;
        if (pathname !== '/' && pathname !== '/index.html' && pathname !== currentPath) {
          return;
        }
      }

      const targetEl = document.getElementById(hash);
      if (!targetEl) {
        return;
      }

      e.preventDefault();
      const headerHeight = getHeaderHeight();
      const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset;
      const scrollTo = targetPos - headerHeight;

      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });

      history.pushState(null, null, '#' + hash);
    });
  };

  const ActiveMenuModule = function () {
    if (window.__app.__activeMenuInit) {
      return;
    }
    window.__app.__activeMenuInit = true;

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.c-nav__link');

    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const href = link.getAttribute('href');

      if (!href) {
        continue;
      }

      const linkPath = href.split('#')[0];
      let isMatch = false;

      if (linkPath === '/' || linkPath === '/index.html') {
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.match(/\/index\.html?$/)) {
          isMatch = true;
        }
      } else if (linkPath && currentPath.indexOf(linkPath) === 0) {
        isMatch = true;
      }

      if (isMatch) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      }
    }
  };

  const ImageModule = function () {
    if (window.__app.__imageInit) {
      return;
    }
    window.__app.__imageInit = true;

    const images = document.querySelectorAll('img');
    const placeholderSVG =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e9ecef"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%236c757d"%3EImage unavailable%3C/text%3E%3C/svg%3E';

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (!img.hasAttribute('loading')) {
        const isLogo = img.classList.contains('c-logo__img');
        const isCritical = img.hasAttribute('data-critical');
        if (!isLogo && !isCritical) {
          img.setAttribute('loading', 'lazy');
        }
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      (function (image) {
        image.addEventListener('error', function () {
          if (image.dataset.__fallbackApplied) {
            return;
          }
          image.dataset.__fallbackApplied = 'true';
          image.src = placeholderSVG;
          image.style.objectFit = 'contain';

          const isHeaderLogo = image.closest('.l-header') && image.closest('.c-logo');
          if (isHeaderLogo) {
            image.style.maxHeight = '40px';
          }
        });
      })(img);
    }
  };

  const FormValidationModule = function () {
    if (window.__app.__formInit) {
      return;
    }
    window.__app.__formInit = true;

    const form = document.getElementById('contactForm');
    if (!form) {
      return;
    }

    const fields = {
      firstName: {
        element: document.getElementById('firstName'),
        error: document.querySelector('#firstName').parentElement.querySelector('.c-form__error'),
        validate: function (value) {
          if (!value || value.trim().length < 2) {
            return 'Vorname muss mindestens 2 Zeichen enthalten.';
          }
          const nameRegex = /^[a-zA-ZÀ-ÿ\s-']{2,50}$/;
          if (!nameRegex.test(value)) {
            return 'Vorname enthält ungültige Zeichen.';
          }
          return null;
        },
      },
      lastName: {
        element: document.getElementById('lastName'),
        error: document.querySelector('#lastName').parentElement.querySelector('.c-form__error'),
        validate: function (value) {
          if (!value || value.trim().length < 2) {
            return 'Nachname muss mindestens 2 Zeichen enthalten.';
          }
          const nameRegex = /^[a-zA-ZÀ-ÿ\s-']{2,50}$/;
          if (!nameRegex.test(value)) {
            return 'Nachname enthält ungültige Zeichen.';
          }
          return null;
        },
      },
      email: {
        element: document.getElementById('email'),
        error: document.querySelector('#email').parentElement.querySelector('.c-form__error'),
        validate: function (value) {
          if (!value || value.trim().length === 0) {
            return 'E-Mail-Adresse ist erforderlich.';
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
          }
          return null;
        },
      },
      phone: {
        element: document.getElementById('phone'),
        error: document.querySelector('#phone').parentElement.querySelector('.c-form__error'),
        validate: function (value) {
          if (!value || value.trim().length === 0) {
            return 'Telefonnummer ist erforderlich.';
          }
          const phoneRegex = /^[\d\s+\-()]{10,20}$/;
          if (!phoneRegex.test(value)) {
            return 'Bitte geben Sie eine gültige Telefonnummer ein.';
          }
          return null;
        },
      },
      service: {
        element: document.getElementById('service'),
        error: document.querySelector('#service').parentElement.querySelector('.c-form__error'),
        validate: function (value) {
          if (!value || value === '') {
            return 'Bitte wählen Sie eine Dienstleistung aus.';
          }
          return null;
        },
      },
      message: {
        element: document.getElementById('message'),
        error: document.querySelector('#message').parentElement.querySelector('.c-form__error'),
        validate: function (value) {
          if (!value || value.trim().length < 10) {
            return 'Nachricht muss mindestens 10 Zeichen enthalten.';
          }
          return null;
        },
      },
      privacy: {
        element: document.getElementById('privacy'),
        error: document.querySelector('#privacy').parentElement.parentElement.querySelector('.c-form__error'),
        validate: function (checked) {
          if (!checked) {
            return 'Sie müssen die Datenschutzerklärung akzeptieren.';
          }
          return null;
        },
      },
    };

    const showError = function (field, message) {
      if (field.error) {
        field.error.textContent = message;
        field.error.classList.add('is-visible');
      }
      field.element.classList.add('has-error');
    };

    const clearError = function (field) {
      if (field.error) {
        field.error.textContent = '';
        field.error.classList.remove('is-visible');
      }
      field.element.classList.remove('has-error');
    };

    const validateField = function (fieldName) {
      const field = fields[fieldName];
      if (!field || !field.element) {
        return true;
      }

      const value = fieldName === 'privacy' ? field.element.checked : field.element.value;
      const errorMessage = field.validate(value);

      if (errorMessage) {
        showError(field, errorMessage);
        return false;
      } else {
        clearError(field);
        return true;
      }
    };

    const validateAllFields = function () {
      let isValid = true;
      for (const fieldName in fields) {
        if (!validateField(fieldName)) {
          isValid = false;
        }
      }
      return isValid;
    };

    for (const fieldName in fields) {
      const field = fields[fieldName];
      if (field.element) {
        field.element.addEventListener('blur', function () {
          validateField(fieldName);
        });
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isValid = validateAllFields();

      if (!isValid) {
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      let originalBtnText = '';

      if (submitBtn) {
        submitBtn.disabled = true;
        originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
      }

      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        window.location.href = 'thank_you.html';
      }, 800);
    });
  };

  const ScrollAnimationModule = function () {
    if (window.__app.__scrollAnimInit) {
      return;
    }
    window.__app.__scrollAnimInit = true;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
    };

    const animateOnScroll = function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(animateOnScroll, observerOptions);

    const animatedElements = document.querySelectorAll(
      '.c-card, .c-benefit-card, .c-service-card, .c-testimonial-card, .c-job-card, .c-brochure-card'
    );

    animatedElements.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      observer.observe(el);
    });
  };

  const ButtonRippleModule = function () {
    if (window.__app.__rippleInit) {
      return;
    }
    window.__app.__rippleInit = true;

    const buttons = document.querySelectorAll('.c-button');

    buttons.forEach(function (button) {
      button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple-effect 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(function () {
          ripple.remove();
        }, 600);
      });
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple-effect {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const CountdownModule = function () {
    if (window.__app.__countdownInit) {
      return;
    }
    window.__app.__countdownInit = true;

    const countdown = document.querySelector('.c-countdown');
    if (!countdown) {
      return;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    const updateCountdown = function () {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        countdown.innerHTML = '<p>Die Aktion ist beendet!</p>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const daysEl = countdown.querySelector('.c-countdown__item:nth-child(1) .c-countdown__value');
      const hoursEl = countdown.querySelector('.c-countdown__item:nth-child(2) .c-countdown__value');
      const minutesEl = countdown.querySelector('.c-countdown__item:nth-child(3) .c-countdown__value');
      const secondsEl = countdown.querySelector('.c-countdown__item:nth-child(4) .c-countdown__value');

      if (daysEl) daysEl.textContent = days;
      if (hoursEl) hoursEl.textContent = hours;
      if (minutesEl) minutesEl.textContent = minutes;
      if (secondsEl) secondsEl.textContent = seconds;
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  };

  const ScrollToTopModule = function () {
    if (window.__app.__scrollTopInit) {
      return;
    }
    window.__app.__scrollTopInit = true;

    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '↑';
    scrollBtn.setAttribute('aria-label', 'Nach oben scrollen');
    scrollBtn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light));
      color: var(--color-text-primary);
      border: none;
      border-radius: 50%;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, transform 0.3s ease-in-out;
      z-index: 1000;
      box-shadow: var(--shadow-xl);
    `;
    document.body.appendChild(scrollBtn);

    const toggleVisibility = throttle(function () {
      if (window.pageYOffset > 300) {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.visibility = 'visible';
      } else {
        scrollBtn.style.opacity = '0';
        scrollBtn.style.visibility = 'hidden';
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility);

    scrollBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });

    scrollBtn.addEventListener('mouseenter', function () {
      scrollBtn.style.transform = 'translateY(-5px)';
    });

    scrollBtn.addEventListener('mouseleave', function () {
      scrollBtn.style.transform = 'translateY(0)';
    });
  };

  window.__app.init = function () {
    BurgerMenuModule();
    SmoothScrollModule();
    ActiveMenuModule();
    ImageModule();
    FormValidationModule();
    ScrollAnimationModule();
    ButtonRippleModule();
    CountdownModule();
    ScrollToTopModule();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.__app.init);
  } else {
    window.__app.init();
  }
})();