document.addEventListener('DOMContentLoaded', () => {
  // Users page actions
  document.querySelectorAll('[data-action="ban"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      const statusCell = tr.querySelector('[data-field="status"]');
      const prev = statusCell.textContent;
      statusCell.textContent = 'BANNED';
      try {
        const res = await fetch(`/admin/users/${id}/ban`, { method: 'POST' });
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
      } catch (err) {
        statusCell.textContent = prev;
        alert('Ban failed');
      }
    });
  });

  document.querySelectorAll('[data-action="unban"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      const statusCell = tr.querySelector('[data-field="status"]');
      const prev = statusCell.textContent;
      statusCell.textContent = 'ACTIVE';
      try {
        const res = await fetch(`/admin/users/${id}/unban`, { method: 'POST' });
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
      } catch (err) {
        statusCell.textContent = prev;
        alert('Unban failed');
      }
    });
  });

  document.querySelectorAll('[data-action="changerole"]').forEach(select => {
    select.addEventListener('change', async (e) => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      const role = e.target.value;
      const prev = e.target.getAttribute('data-prev') || e.target.value;
      e.target.setAttribute('data-prev', role);
      try {
        const res = await fetch(`/admin/users/${id}/role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
      } catch (err) {
        e.target.value = prev;
        alert('Role update failed');
      }
    });
  });

  document.querySelectorAll('[data-action="limit"]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      const value = e.target.value;
      const prev = e.target.getAttribute('data-prev') || value;
      e.target.setAttribute('data-prev', value);
      try {
        const res = await fetch(`/admin/users/${id}/limit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dailyLimit: parseInt(value) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
      } catch (err) {
        e.target.value = prev;
        alert('Limit update failed');
      }
    });
  });

  // Jobs retry
  document.querySelectorAll('[data-action="retry"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      const statusCell = tr.querySelector('[data-field="status"]');
      const prev = statusCell.textContent;
      statusCell.textContent = 'PENDING';
      try {
        const res = await fetch(`/admin/jobs/${id}/retry`, { method: 'POST' });
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
      } catch (err) {
        statusCell.textContent = prev;
        alert('Retry failed');
      }
    });
  });
});
