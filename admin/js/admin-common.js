function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, isError = false) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'fixed bottom-6 right-6 z-[100] px-6 py-4 font-bold uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#2E2B29] border-2 border-primary hidden';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove('hidden', 'bg-accent', 'text-primary', 'bg-red-500', 'text-white');
  toast.classList.add(isError ? 'bg-red-500' : 'bg-accent', isError ? 'text-white' : 'text-primary');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

async function requireAdminSession() {
  const { data: { session } } = await window.mmcSupabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const { data: profile, error } = await window.mmcSupabase
    .from('admin_profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== 'admin') {
    await window.mmcSupabase.auth.signOut();
    window.location.href = 'login.html';
    return null;
  }

  return { session, profile };
}

function updateAdminHeader(session, profile) {
  const emailEl = document.querySelector('[data-admin-email]');
  const nameEl = document.querySelector('[data-admin-name]');
  const avatarEl = document.querySelector('[data-admin-avatar]');

  const email = session.user.email || '';
  const name = profile.full_name || 'Admin User';
  const initial = name.charAt(0).toUpperCase();

  if (emailEl) emailEl.textContent = email;
  if (nameEl) nameEl.textContent = name;
  if (avatarEl) avatarEl.textContent = initial;
}

async function updateUnreadMessagesBadge() {
  const badge = document.querySelector('[data-unread-messages]');
  if (!badge) return;

  const { count, error } = await window.mmcSupabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) {
    badge.classList.add('hidden');
    return;
  }

  if (!count) {
    badge.classList.add('hidden');
    return;
  }

  badge.textContent = String(count);
  badge.classList.remove('hidden');
}

function initAdminMobileMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('aside');
  const overlay = document.getElementById('mobileSidebarOverlay');
  let isMobileMenuOpen = false;

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    if (isMobileMenuOpen) {
      sidebar.classList.remove('hidden');
      sidebar.classList.add('absolute', 'inset-y-0', 'left-0', 'z-50');
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('absolute', 'inset-y-0', 'left-0', 'z-50');
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
  }

  if (mobileBtn) mobileBtn.addEventListener('click', toggleMobileMenu);
  if (overlay) overlay.addEventListener('click', toggleMobileMenu);
}

function initAdminLogout() {
  const logoutLinks = document.querySelectorAll('[data-admin-logout]');
  logoutLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      await window.mmcSupabase.auth.signOut();
      window.location.href = 'login.html';
    });
  });
}

async function applyAdminBranding() {
  try {
    const { data, error } = await window.mmcSupabase
      .from('site_settings')
      .select('logo_url, favicon_url')
      .eq('id', 1)
      .single();

    if (error || !data) return;

    const isRemote = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));

    if (isRemote(data.logo_url)) {
      document.querySelectorAll('img[src*="logo.webp"]').forEach(img => {
        img.src = data.logo_url;
      });
    }

    if (isRemote(data.favicon_url)) {
      let faviconLink = document.querySelector('link[rel*="icon"]');
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'shortcut icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = data.favicon_url;
    }
  } catch (_) {
    // Branding is non-critical; fail silently
  }
}

async function initAdminShell() {
  const auth = await requireAdminSession();
  if (!auth) return null;

  updateAdminHeader(auth.session, auth.profile);
  initAdminMobileMenu();
  initAdminLogout();
  await updateUnreadMessagesBadge();
  applyAdminBranding();
  return auth;
}
