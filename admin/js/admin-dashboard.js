document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const statCategories = document.getElementById('statCategories');
  const statProducts = document.getElementById('statProducts');
  const statMessages = document.getElementById('statMessages');
  const recentMessagesBody = document.getElementById('recentMessagesBody');

  const [
    { count: categoriesCount },
    { count: productsCount },
    { count: unreadCount },
    { data: recentMessages, error: messagesError }
  ] = await Promise.all([
    window.mmcSupabase.from('categories').select('*', { count: 'exact', head: true }),
    window.mmcSupabase.from('products').select('*', { count: 'exact', head: true }),
    window.mmcSupabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
    window.mmcSupabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5)
  ]);

  if (statCategories) statCategories.textContent = String(categoriesCount ?? 0);
  if (statProducts) statProducts.textContent = String(productsCount ?? 0);
  if (statMessages) statMessages.textContent = String(unreadCount ?? 0);

  if (!recentMessagesBody) return;

  if (messagesError || !recentMessages?.length) {
    recentMessagesBody.innerHTML = `
      <tr>
        <td colspan="4" class="p-6 text-center text-sm text-primary/60">No messages yet.</td>
      </tr>
    `;
    return;
  }

  recentMessagesBody.innerHTML = recentMessages.map((message) => `
    <tr class="hover:bg-adminbg transition-colors ${message.is_read ? '' : 'bg-accent/5'}">
      <td class="p-4 text-sm font-bold text-primary">${escapeHtml(message.name)}</td>
      <td class="p-4 text-sm text-primary/70">${escapeHtml(message.email)}</td>
      <td class="p-4 text-sm text-primary/70">${escapeHtml(formatDate(message.created_at))}</td>
      <td class="p-4">
        <a href="messages.html" class="text-xs font-bold uppercase tracking-widest bg-primary text-secondary px-3 py-1 hover:bg-accent hover:text-primary transition-colors inline-block">Read</a>
      </td>
    </tr>
  `).join('');
});
