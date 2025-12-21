const switchView = (sectionId) => {
  // Hide all sections
  document
    .querySelectorAll(".view-section")
    .forEach((s) => s.classList.add("hidden"));
  // Show selected section
  document.getElementById(sectionId).classList.remove("hidden");

  // Refresh data based on view
  if (sectionId === "exam-list-section") RenderExams();
  if (sectionId === "results-section") RenderResults();
};

document.addEventListener("DOMContentLoaded", () => {
  // Initial Load check
  const teacher = JSON.parse(localStorage.getItem("currentUser"));
  if (!teacher) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("teacher-name").innerText =
    `Teacher: ${teacher.username}`;
  switchView("exam-list-section");
});

/**
 * Data Rendering (My Exams)
 */
const RenderExams = () => {
  const list = document.getElementById("exams-grid");
  if (!list) return;

  const exams = JSON.parse(localStorage.getItem("exams") || "[]");
  const teacher = JSON.parse(localStorage.getItem("currentUser"));

  // Filter exams belonging to this teacher
  const myExams = exams.filter((e) => e.teacherId === teacher.id);

  if (myExams.length === 0) {
    list.innerHTML = `
            <div class="col-span-full flex flex-col items-center py-20 bg-white rounded-xl border-2 border-dashed">
                <p class="text-gray-400 font-medium">No exams created yet.</p>
                <button onclick="startNewExamFlow()" class="mt-2 text-blue-600 hover:underline">Create your first exam</button>
            </div>`;
    return;
  }

  list.innerHTML = myExams
    .map(
      (exam) => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800">${exam.title}</h3>
                    <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">v${exam.currentVersion}</span>
                </div>
                <p class="text-xs text-gray-500 mb-4">Duration: ${exam.duration} mins | ${exam.versions?.[exam.currentVersion - 1]?.questions?.length || 0} Qs</p>
            </div>
            <div class="flex gap-2">
                <button onclick="openAssignmentView('${exam.id}')" class="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded font-bold transition">Assign</button>
                <button onclick="editExam('${exam.id}')" class="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded font-bold transition">Edit</button>
            </div>
        </div>
    `,
    )
    .join("");
};
