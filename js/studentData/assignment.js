let TargetExamId = null;

const openAssignmentView = (ExamId) => {
    TargetExamId = ExamId;
    const Students = StorageAPI.getStudents();
    const Container = document.getElementById("student-list");

    Container.innerHTML = Students
        .map(
            (S) => `
        <div class="flex items-center gap-3 p-2 hover:bg-gray-50 border-b">
            <input type="checkbox" value="${S.id}" class="student-checkbox w-5 h-5">
            <div>
                <p class="font-bold">${S.username}</p>
                <p class="text-xs text-gray-500">${S.grade || "No Grade"}</p>
            </div>
        </div>
    `,
        )
        .join("");

    switchView("assignment-section");
};

const confirmAssignment = () => {
    const SelectedIds = Array.from(
        document.querySelectorAll(".student-checkbox:checked"),
    ).map((Cb) => Cb.value);

    if (SelectedIds.length === 0)
        return new PopupMsg("Select at least one student", MsgType.Error);

    const Exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const Exam = Exams.find((e) => e.id === TargetExamId);

    console.log("Exam data", Exam);
    console.log("Exams", Exams);
    if (!Exam.currentVersion) {
        return new PopupMsg("Cannot assign exam: No version found", MsgType.Error);
    }
    StorageAPI.assignExam(TargetExamId, Exam.currentVersion, SelectedIds);

    new PopupMsg("Exam Assigned Successfully!", MsgType.Success);
    switchView("exam-list-section");
};
