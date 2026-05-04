// UrbanMove — app.js

// IoT Tab Switching
document.querySelectorAll('.iot-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.iot-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.iot-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const target = document.getElementById('tab-' + btn.dataset.tab);
    if (target) target.classList.add('active');
  });
});

// Animate occupancy bars on load
function animateBars() {
  document.querySelectorAll('.occupancy-fill, .coverage-fill').forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0';
    setTimeout(() => { bar.style.width = target; }, 200);
  });
}
document.addEventListener('DOMContentLoaded', animateBars);

// Auto-refresh IoT live data every 30s
if (window.location.pathname.includes('iot-dashboard') || window.location.pathname.includes('iot_dashboard')) {
  setInterval(() => location.reload(), 30000);
}

// Flash message auto-dismiss
const flash = document.querySelector('.alert');
if (flash) setTimeout(() => flash.style.opacity = '0', 4000);

// Counter animation
function animateCounters() {
  document.querySelectorAll('.stat-value, .iot-sys-val').forEach(el => {
    const val = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val > 0) {
      let current = 0;
      const step = val / 40;
      const suffix = el.textContent.replace(/[0-9.,]/g, '');
      const timer = setInterval(() => {
        current = Math.min(current + step, val);
        el.textContent = (val < 10 ? current.toFixed(1) : Math.round(current)) + suffix;
        if (current >= val) clearInterval(timer);
      }, 25);
    }
  });
}
document.addEventListener('DOMContentLoaded', animateCounters);

// Scroll fade-in
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; } });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .city-card, .parking-card, .stat-card, .impact-card, .arch-layer, .gateway-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
