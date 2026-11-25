(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const navLinks = nav ? nav.querySelectorAll('a') : [];

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
      nav.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });
    navLinks.forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 800) closeMenu();
    });
  }

  // Scroll reveal: content remains visible when reduced motion is requested.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Gentle pointer parallax on the hero photo (desktop only).
  const parallax = document.querySelector('[data-parallax]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (parallax && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
    const photo = parallax.querySelector('img');
    parallax.addEventListener('pointermove', (event) => {
      const rect = parallax.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      photo.style.transform = `scale(1.07) translate(${x * -8}px, ${y * -8}px)`;
    });
    parallax.addEventListener('pointerleave', () => {
      photo.style.transform = '';
    });
  }

  // Discreet custom cursor on desktop.
  const cursor = document.querySelector('.cursor-dot');
  if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.querySelectorAll('a, button, input, textarea, label').forEach((element) => {
      element.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      element.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  }

  // Submit the contact form to the PHP endpoint and show its response inline.
  const form = document.querySelector('#contact-form');
  const formMessage = document.querySelector('#form-message');
  if (form && formMessage) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      formMessage.textContent = '';
      formMessage.classList.remove('is-error');
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = 'Отправляем…';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Не удалось отправить заявку.');
        formMessage.textContent = result.message;
        form.reset();
      } catch (error) {
        formMessage.textContent = error.message || 'Не удалось связаться с сервером. Попробуйте позже или напишите нам напрямую.';
        formMessage.classList.add('is-error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  }
})();
