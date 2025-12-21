const RenderResults = () => {
    const assignments = JSON.parse(localStorage.getItem("AssignedExams") || "[]");
    const results = JSON.parse(localStorage.getItem("ExamResults") || "[]");
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const tbody = document.getElementById("results-table-body");

    // Filter for completed assignments
    const completedAssignments = assignments.filter(a => a.status === "Completed");

    if (completedAssignments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-400">No results found yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = completedAssignments
        .map((assignment) => {
            const student = users.find((u) => String(u.id) === String(assignment.studentId));
            const exam = exams.find((e) => e.id === assignment.examId);
            const result = results.find(r => r.assignmentId === assignment.assignmentId);

            const score = result ? result.score : 0;
            const date = result ? new Date(result.dateTaken).toLocaleDateString() : assignment.dateAssigned;

            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-4 font-medium">${student ? student.username : "Unknown"}</td>
                <td class="p-4">${exam ? exam.title : "Deleted Exam"}</td>
                <td class="p-4 text-center">
                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">v${assignment.versionId}</span>
                </td>
                <td class="p-4">
                    <span class="${score >= 50 ? "text-green-600" : "text-red-600"} font-bold">
                        ${score}%
                    </span>
                </td>
                <td class="p-4 text-sm text-gray-500">${date}</td>
            </tr>
        `;
        })
        .join("");
};
