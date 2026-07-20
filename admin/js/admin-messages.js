let activeMessageId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initAdminShell();
  if (!auth) return;

  const tableBody = document.getElementById('messagesTableBody');
  const modal = document.getElementById('viewMessageModal');
  const closeModalBtn = document.getElementById('closeMessageModalBtn');
  const deleteModalBtn = document.getElementById('deleteMessageBtn');

  await loadMessages();

  if (tableBody) {
    tableBody.addEventListener('click', async (event) => {
      const readBtn = event.target.closest('[data-read-message]');
      if (readBtn) {
        await openMessage(readBtn.dataset.readMessage);
      }
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (deleteModalBtn) {
    deleteModalBtn.addEventListener('click', async () => {
      if (!activeMessageId) return;
      if (!confirm('Delete this message?')) return;

      const { error } = await window.mmcSupabase
        .from('messages')
        .delete()
        .eq('id', activeMessageId);

      if (error) {
        showToast(error.message, true);
        return;
      }

      modal.classList.add('hidden');
      activeMessageId = null;
      showToast('Message deleted.');
      await loadMessages();
      await updateUnreadMessagesBadge();
    });
  }

  async function loadMessages() {
    const { data, error } = await window.mmcSupabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToast(error.message, true);
      return;
    }

    if (!data?.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-6 text-center text-sm text-primary/60">No messages yet.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = data.map((message) => `
      <tr class="hover:bg-adminbg transition-colors ${message.is_read ? '' : 'bg-accent/5'}">
        <td class="p-4 text-center">
          <div class="w-3 h-3 rounded-full ${message.is_read ? 'bg-primary/20' : 'bg-accent'} mx-auto" title="${message.is_read ? 'Read' : 'Unread'}"></div>
        </td>
        <td class="p-4 font-bold text-primary text-sm">${escapeHtml(message.name)}</td>
        <td class="p-4 text-sm text-primary/70">${escapeHtml(message.email)}</td>
        <td class="p-4 text-sm text-primary/70 hidden md:table-cell max-w-xs truncate">${escapeHtml(message.message)}</td>
        <td class="p-4 text-sm text-primary/70 font-medium">${escapeHtml(formatDate(message.created_at))}</td>
        <td class="p-4 text-right">
          <button type="button" data-read-message="${message.id}" class="text-xs font-bold uppercase tracking-widest ${message.is_read ? 'bg-secondary text-primary' : 'bg-primary text-secondary'} px-4 py-2 hover:bg-accent hover:text-primary transition-colors">
            Read
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function openMessage(messageId) {
    const { data, error } = await window.mmcSupabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !data) {
      showToast('Could not load message.', true);
      return;
    }

    activeMessageId = data.id;
    document.getElementById('modalMessageName').textContent = data.name;
    document.getElementById('modalMessageEmail').textContent = data.email;
    document.getElementById('modalMessageDate').textContent = formatDate(data.created_at);
    document.getElementById('modalMessageBody').textContent = data.message;
    document.getElementById('modalReplyEmail').href = `mailto:${encodeURIComponent(data.email)}`;

    if (!data.is_read) {
      await window.mmcSupabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', data.id);
      await loadMessages();
      await updateUnreadMessagesBadge();
    }

    modal.classList.remove('hidden');
  }
});
