async function dashboardTotalBooks(){
    const totalBooks = document.getElementById('totalBooks');

    const result = await getBooks();
    const total = result.data.length || 0;

    totalBooks.innerText = total;
}

async function dashboardTotalStudents() {
    const totalActiveStudents = document.getElementById('activeStudents');
    try {
        totalActiveStudents.innerText = "...";
        
        const result = await getStudents({ status: "Active" });
        const total = result?.data?.length || 0;
        
        totalActiveStudents.innerText = total;
    } catch (error) {
        console.error("Failed to get total students:", error);
        totalActiveStudents.innerText = "0";
    }
}

async function dashboardBorrowedBooks() {
  const borrowedEl = document.getElementById('borrowedBooks');
  if (!borrowedEl) return;
  try {
    borrowedEl.innerText = "...";
    const result = await insertDB("select", "book_copy", "copy_id", { status: "Borrowed" });
    const total = result?.data?.length || 0;
    borrowedEl.innerText = total;
  } catch (error) {
    console.error("Failed to get borrowed books:", error);
    borrowedEl.innerText = "0";
  }
}

async function dashboardOverdueBooks() {
  const overdueEl = document.getElementById('overdueBooks');
  if (!overdueEl) return;
  try {
    overdueEl.innerText = "...";
    const result = await insertDB("select", "book_copy", "copy_id, due_date, status", null);
    const today = new Date();
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const todayStr = fmt(today);
    const rows = result?.data || [];
    const count = rows.filter(r => {
      const due = (r.due_date || '').trim();
      if (!due) return false;
      if ((r.status || '').toLowerCase() !== 'borrowed') return false;
      const dueDateStr = due.slice(0,10);
      return dueDateStr < todayStr;
    }).length;
    overdueEl.innerText = count;
  } catch (error) {
    console.error("Failed to get overdue books:", error);
    overdueEl.innerText = "0";
  }
}

async function dashboardNotifications() {
  const notifEl = document.getElementById('notification-content');
  if (!notifEl) return;
  try {
    notifEl.textContent = 'Loading notifications...';
    const copiesRes = await insertDB('select', 'book_copy', 'copy_id, book_id, status, due_date', null);
    const booksRes = await insertDB('select', 'books', 'book_id, title', null);
    const bookTitles = {};
    (booksRes?.data || []).forEach(b => { bookTitles[b.book_id] = b.title; });
    const today = new Date();
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const todayStr = fmt(today);
    const overdue = (copiesRes?.data || []).filter(r => {
      const due = (r.due_date || '').trim();
      if (!due) return false;
      if ((r.status || '').toLowerCase() !== 'borrowed') return false;
      const dueDateStr = due.slice(0,10);
      return dueDateStr < todayStr;
    });
    if (overdue.length === 0) {
      notifEl.textContent = 'No notifications';
      return;
    }
    const lines = overdue.map(r => {
      const title = bookTitles[r.book_id] || r.book_id;
      return `${title} is overdue. Expected return date: ${r.due_date}`;
    });
    notifEl.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
  } catch (error) {
    notifEl.textContent = 'Failed to load notifications';
  }
}

async function dashboardRecentActivity() {
  const listEl = document.getElementById('recent-activities');
  if (!listEl) return;
  try {
    const libRes = await insertDB('select', 'transaction_library', '*', null);
    const lib = (libRes?.data || []).sort((a,b)=>{
      const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
      const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
      return tb - ta;
    }).slice(0, 2);

    const brRes = await insertDB('select', 'transaction_borrow', '*', null);
    const br = (brRes?.data || []).sort((a,b)=>{
      const ka = a.transaction_type === 'Return' ? a.returned_at : a.borrowed_at;
      const kb = b.transaction_type === 'Return' ? b.returned_at : b.borrowed_at;
      const ta = ka ? Date.parse(ka) : (a.due_at ? Date.parse(a.due_at) : 0);
      const tb = kb ? Date.parse(kb) : (b.due_at ? Date.parse(b.due_at) : 0);
      return tb - ta;
    }).slice(0, 2);

    let html = '';
    const format = (s) => s || '';

    if (lib.length > 0) {
      html += '<div class="mb-2"><strong>Library Transactions</strong></div>';
      lib.forEach((t, idx) => {
        const num = idx + 1;
        const ts = format(t.timestamp) || '';
        const details = (()=>{
          try {
            const before = t.before_values ? JSON.parse(t.before_values) : null;
            const after = t.after_values ? JSON.parse(t.after_values) : null;
            if (t.operation_type === 'Add') {
              return `Added: ${(after&&after.title)||''}`;
            } else if (t.operation_type === 'Edit') {
              return `Edited: ${(before&&before.title)||''}`;
            } else if (t.operation_type === 'Archive' || t.operation_type === 'Delete') {
              return `${t.operation_type}: ${(before&&before.title)||''}`;
            }
            return `${t.operation_type}`;
          } catch (_) { return `${t.operation_type}`; }
        })();
        html += `<div>${num}. ${details} • ${ts}</div>`;
      });
    }
    if (br.length > 0) {
      html += '<div class="mt-3 mb-2"><strong>Borrow/Return</strong></div>';
      br.forEach((t, idx) => {
        const num = idx + 1;
        const tt = t.transaction_type;
        const when = format(tt === 'Return' ? (t.returned_at || '') : (t.borrowed_at || t.due_at || '')) || '';
        html += `<div>${num}. ${tt} • ${when}</div>`;
      });
    }
    if (!html) html = '<p class="text-muted">No recent activity</p>';
    listEl.innerHTML = html;
  } catch (_) {
    listEl.innerHTML = '<p class="text-muted">Failed to load recent activity</p>';
  }
}
