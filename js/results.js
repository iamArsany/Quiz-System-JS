const RenderResults = () => {
  const completed = JSON.parse(localStorage.getItem("CompletedExams") || "[]");
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const exams = JSON.parse(localStorage.getItem("exams") || "[]");
  const tbody = document.getElementById("results-table-body");

  if (completed.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-400">No results found yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = completed
    .map((entry) => {
      const student = users.find((u) => u.id === entry.studentId);
      const exam = exams.find((e) => e.id === entry.examId);

      return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-4 font-medium">${student ? student.username : "Unknown"}</td>
                <td class="p-4">${exam ? exam.title : "Deleted Exam"}</td>
                <td class="p-4 text-center">
                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">v${entry.versionId}</span>
                </td>
                <td class="p-4">
                    <span class="${entry.score >= 50 ? "text-green-600" : "text-red-600"} font-bold">
                        ${entry.score}%
                    </span>
                </td>
                <td class="p-4 text-sm text-gray-500">${entry.submittedAt}</td>
            </tr>
        `;
    })
    .join("");
};
