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