async function dashboardTotalBooks(){
    const totalBooks = document.getElementById('totalBooks');

    const result = await getBooks();
    const total = result.data.length || 0;

    totalBooks.innerText = total;
}

async function dashboardTotalStudents(){
    const totalActiveStudents = document.getElementById('totalStudents');
}