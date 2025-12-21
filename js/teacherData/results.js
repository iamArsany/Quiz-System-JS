const renderResults = () => {
    const Assignments = JSON.parse(localStorage.getItem("AssignedExams") || "[]");
    const Results = JSON.parse(localStorage.getItem("ExamResults") || "[]");
    const Users = JSON.parse(localStorage.getItem("users") || "[]");
    const Exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const Tbody = document.getElementById("results-table-body");

    const CompletedAssignments = Assignments.filter(
        (a) => a.status === "Completed",
    );

    if (CompletedAssignments.length === 0) {
        Tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-400">No results found yet.</td></tr>`;
        return;
    }

    Tbody.innerHTML = CompletedAssignments
        .map((Assignment) => {
            const Student = Users.find(
                (u) => String(u.id) === String(Assignment.studentId),
            );
            const Exam = Exams.find((e) => e.id === Assignment.examId);
            const Result = Results.find(
                (r) => r.assignmentId === Assignment.assignmentId,
            );

            const Score = Result ? Result.score : 0;
            const DateStr = Result
                ? new Date(Result.dateTaken).toLocaleDateString()
                : Assignment.dateAssigned;

            return `
            <tr onclick="showResultDetails('${Assignment.assignmentId}')" class="border-b hover:bg-gray-50 cursor-pointer transition">
                <td class="p-4 font-medium">${Student ? Student.username : "Unknown"}</td>
                <td class="p-4">${Exam ? Exam.title : "Deleted Exam"}</td>
                <td class="p-4 text-center">
                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">v${Assignment.versionId}</span>
                </td>
                <td class="p-4">
                    <span class="${Score >= 50 ? "text-green-600" : "text-red-600"} font-bold">
                        ${Score}%
                    </span>
                </td>
                <td class="p-4 text-sm text-gray-500">${DateStr}</td>
            </tr>
        `;
        })
        .join("");
};

const showResultDetails = (AssignmentId) => {
    const Assignments = JSON.parse(localStorage.getItem("AssignedExams") || "[]");
    const Results = JSON.parse(localStorage.getItem("ExamResults") || "[]");
    const Exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const Users = JSON.parse(localStorage.getItem("users") || "[]");

    const Assignment = Assignments.find((a) => a.assignmentId === AssignmentId);
    if (!Assignment) return;

    const Result = Results.find((r) => r.assignmentId === AssignmentId);
    const Exam = Exams.find((e) => e.id === Assignment.examId);
    const Student = Users.find(
        (u) => String(u.id) === String(Assignment.studentId),
    );

    if (!Exam || !Result) return new PopupMsg("Details not found", MsgType.Error);

    const Version = Exam.versions.find(
        (v) => v.versionId === Assignment.versionId,
    );
    if (!Version) return new PopupMsg("Exam version not found", MsgType.Error);

    document.getElementById("modal-student-name").innerText =
        `Student: ${Student ? Student.username : "Unknown"} | Score: ${Result.score}%`;

    const ContentDiv = document.getElementById("modal-content");
    ContentDiv.innerHTML = Version.questions
        .map((Q, Index) => {
            const StudentAnswer = Result.answers[Q.QNo];
            const IsCorrect = StudentAnswer ? StudentAnswer.isCorrect : false;
            const SelectedText = StudentAnswer
                ? StudentAnswer.selected
                : "Not Answered";

            return `
            <div class="p-6 rounded-2xl border-2 ${IsCorrect ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"}">
                <div class="flex justify-between mb-4">
                    <h4 class="font-bold text-gray-800">Q${Index + 1}: ${Q.QText}</h4>
                    <span class="text-xs font-bold px-2 py-1 rounded ${IsCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}">
                        ${IsCorrect ? "Correct (+" + Q.QScore + ")" : "Wrong (0)"}
                    </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div class="p-3 bg-white rounded-lg border border-gray-200">
                        <p class="text-xs text-gray-400 font-bold uppercase mb-1">Student Answer</p>
                        <p class="${IsCorrect ? "text-green-700 font-bold" : "text-red-600 font-bold"}">${SelectedText}</p>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-gray-200">
                        <p class="text-xs text-gray-400 font-bold uppercase mb-1">Correct Answer</p>
                        <p class="text-green-700 font-bold">${Q.QAns}</p>
                    </div>
                </div>
            </div>
        `;
        })
        .join("");

    document.getElementById("result-details-modal").classList.remove("hidden");
};

const closeResultModal = () => {
    document.getElementById("result-details-modal").classList.add("hidden");
};
