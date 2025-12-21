let targetExamId = null;

const openAssignmentView = (examId) => {
  targetExamId = examId;
  const students = StorageAPI.getStudents();
  const container = document.getElementById("student-list");

  container.innerHTML = students
    .map(
      (s) => `
        <div class="flex items-center gap-3 p-2 hover:bg-gray-50 border-b">
            <input type="checkbox" value="${s.id}" class="student-checkbox w-5 h-5">
            <div>
                <p class="font-bold">${s.username}</p>
                <p class="text-xs text-gray-500">${s.grade || "No Grade"}</p>
            </div>
        </div>
    `,
    )
    .join("");

  switchView("assignment-section");
};

const confirmAssignment = () => {
  const selectedIds = Array.from(
    document.querySelectorAll(".student-checkbox:checked"),
  ).map((cb) => cb.value);

  if (selectedIds.length === 0)
    return new PopupMsg("Select at least one student", MsgType.Error);

  // Get the latest version of the exam
  const exams = JSON.parse(localStorage.getItem("exams") || "[]");
  const exam = exams.find((e) => e.id === targetExamId);

  console.log("Exam data", exam);
  console.log("Exams", exams);
  StorageAPI.assignExam(targetExamId, exam.currentVersion, selectedIds);

  new PopupMsg("Exam Assigned Successfully!", MsgType.Success);
  switchView("exam-list-section");
};
