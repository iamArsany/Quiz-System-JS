const switchView = (SectionId) => {
    document
        .querySelectorAll(".view-section")
        .forEach((s) => s.classList.add("hidden"));
    document.getElementById(SectionId).classList.remove("hidden");
    if (SectionId === "exam-list-section") renderExams();
    if (SectionId === "results-section") renderResults();
};

document.addEventListener("DOMContentLoaded", () => {
    const Teacher = JSON.parse(localStorage.getItem("currentUser"));
    if (!Teacher) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("teacher-name").innerText =
        `Teacher: ${Teacher.username}`;
    switchView("exam-list-section");
});

const renderExams = () => {
    const List = document.getElementById("exams-grid");
    if (!List) return;

    const Exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const Teacher = JSON.parse(localStorage.getItem("currentUser"));

    const MyExams = Exams.filter((e) => e.teacherId === Teacher.id);

    if (MyExams.length === 0) {
        List.innerHTML = `
            <div class="col-span-full flex flex-col items-center py-20 bg-white rounded-xl border-2 border-dashed">
                <p class="text-gray-400 font-medium">No exams created yet.</p>
                <button onclick="startNewExamFlow()" class="mt-2 text-blue-600 hover:underline">Create your first exam</button>
            </div>`;
        return;
    }

    List.innerHTML = MyExams
        .map(
            (Exam) => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800">${Exam.title}</h3>
                    <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">v${Exam.currentVersion}</span>
                </div>
                <p class="text-xs text-gray-500 mb-4">Duration: ${Exam.duration} mins | ${Exam.versions?.[Exam.currentVersion - 1]?.questions?.length || 0} Qs</p>
            </div>
            <div class="flex gap-2">
                <button onclick="openAssignmentView('${Exam.id}')" class="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded font-bold transition">Assign</button>
                <button onclick="editExam('${Exam.id}')" class="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded font-bold transition">Edit</button>
            </div>
        </div>
    `,
        )
        .join("");
};
