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
        const result = await insertDB("select", "transactions_borrow", "transaction_id", { date_returned: null });
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
        const result = await insertDB("select", "transactions_borrow", "transaction_id, due_date", { date_returned: null });
        const today = new Date();
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const todayStr = fmt(today);
        const rows = result?.data || [];
        const count = rows.filter(r => {
            const due = (r.due_date || "").trim();
            if (!due) return false;
            return due < todayStr;
        }).length;
        overdueEl.innerText = count;
    } catch (error) {
        console.error("Failed to get overdue books:", error);
        overdueEl.innerText = "0";
    }
}
