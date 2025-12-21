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
            <tr onclick="showResultDetails('${assignment.assignmentId}')" class="border-b hover:bg-gray-50 cursor-pointer transition">
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

const showResultDetails = (assignmentId) => {
    const assignments = JSON.parse(localStorage.getItem("AssignedExams") || "[]");
    const results = JSON.parse(localStorage.getItem("ExamResults") || "[]");
    const exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    const assignment = assignments.find(a => a.assignmentId === assignmentId);
    if (!assignment) return;

    const result = results.find(r => r.assignmentId === assignmentId);
    const exam = exams.find(e => e.id === assignment.examId);
    const student = users.find(u => String(u.id) === String(assignment.studentId));

    if (!exam || !result) return new PopupMsg("Details not found", MsgType.Error);

    const version = exam.versions.find(v => v.versionId === assignment.versionId);
    if (!version) return new PopupMsg("Exam version not found", MsgType.Error);

    // Populate Modal
    document.getElementById("modal-student-name").innerText = `Student: ${student ? student.username : "Unknown"} | Score: ${result.score}%`;

    const contentDiv = document.getElementById("modal-content");
    contentDiv.innerHTML = version.questions.map((q, index) => {
        const studentAnswer = result.answers[q.QNo];
        const isCorrect = studentAnswer ? studentAnswer.isCorrect : false;
        const selectedText = studentAnswer ? studentAnswer.selected : "Not Answered";

        return `
            <div class="p-6 rounded-2xl border-2 ${isCorrect ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"}">
                <div class="flex justify-between mb-4">
                    <h4 class="font-bold text-gray-800">Q${index + 1}: ${q.QText}</h4>
                    <span class="text-xs font-bold px-2 py-1 rounded ${isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}">
                        ${isCorrect ? "Correct (+" + q.QScore + ")" : "Wrong (0)"}
                    </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div class="p-3 bg-white rounded-lg border border-gray-200">
                        <p class="text-xs text-gray-400 font-bold uppercase mb-1">Student Answer</p>
                        <p class="${isCorrect ? "text-green-700 font-bold" : "text-red-600 font-bold"}">${selectedText}</p>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-gray-200">
                        <p class="text-xs text-gray-400 font-bold uppercase mb-1">Correct Answer</p>
                        <p class="text-green-700 font-bold">${q.QAns}</p>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("result-details-modal").classList.remove("hidden");
};

const closeResultModal = () => {
    document.getElementById("result-details-modal").classList.add("hidden");
};
