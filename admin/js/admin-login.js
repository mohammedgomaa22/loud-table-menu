document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const { data: { session } } = await window.mmcSupabase.auth.getSession();
  if (session) {
    window.location.href = 'index.html';
    return;
  }

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!email || !password) return;

    submitBtn.disabled = true;
    if (errorEl) errorEl.classList.add('hidden');

    const { data: signInData, error } = await window.mmcSupabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
      }
      submitBtn.disabled = false;
      return;
    }

    const userId = signInData.user?.id;
    const { data: profile } = await window.mmcSupabase
      .from('admin_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      await window.mmcSupabase.auth.signOut();
      if (errorEl) {
        errorEl.textContent = 'This account does not have admin access.';
        errorEl.classList.remove('hidden');
      }
      submitBtn.disabled = false;
      return;
    }

    window.location.href = 'index.html';
  });
});
