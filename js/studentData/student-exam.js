let CurrentExam = null;
let CurrentQuestions = [];
let CurrentQuestionIndex = 0;
let UserAnswers = {};
let ExamTimer = null;
let QTimer = null;
let TimeRemaining = 0;
let QuestionTimeRemaining = 0;

document.addEventListener("DOMContentLoaded", () => {
    const Student = JSON.parse(localStorage.getItem("currentUser"));
    if (!Student || (Student.Role !== 0 && Student.Role !== "Student")) {
        window.location.href = "login.html";
        return;
    }
    renderStudentDashboard();
});

const renderStudentDashboard = () => {
    const Std = JSON.parse(localStorage.getItem("currentUser"));
    const Assignments = StorageAPI.getStudentAssignments(Std.id);
    const Results = StorageAPI.getStudentResults(Std.id);

    const RequiredExams = Assignments.filter((a) => a.status === "Pending");
    const CompletedExams = Assignments.filter((a) => a.status === "Completed");

    const RequiredDiv = document.getElementById("required-exams-grid");
    if (RequiredDiv) {
        if (RequiredExams.length === 0) {
            RequiredDiv.innerHTML = `<p class="text-gray-500 col-span-full text-center">No pending exams.</p>`;
        } else {
            RequiredDiv.innerHTML = RequiredExams
                .map(
                    (Exam) => `
                <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                    <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">Active</span>
                    <h3 class="text-xl font-bold mt-3 text-gray-800">${Exam.title}</h3>
                    <p class="text-gray-500 text-sm mt-2">Duration: ${Exam.duration} mins • ${Exam.questions.length} Questions</p>
                    <button onclick="initExam('${Exam.assignmentId}')" class="mt-6 block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                        Start Exam
                    </button>
                </div>
            `,
                )
                .join("");
        }
    }

    const PreviousDiv = document.getElementById("previous-exams-grid");
    if (PreviousDiv) {
        if (CompletedExams.length === 0) {
            PreviousDiv.innerHTML = `<p class="text-gray-500 col-span-full text-center">No completed exams.</p>`;
        } else {
            PreviousDiv.innerHTML = CompletedExams
                .map((Exam) => {
                    const Result = Results.find(
                        (r) => r.assignmentId === Exam.assignmentId,
                    );
                    const Score = Result ? Result.score : 0;
                    const DateStr = Result
                        ? new Date(Result.dateTaken).toLocaleDateString()
                        : "N/A";

                    return `
                <div class="bg-gray-100 border border-gray-200 rounded-xl p-6 opacity-90">
                    <div class="flex justify-between items-start">
                        <h3 class="text-lg font-bold text-gray-700">${Exam.title}</h3>
                        <span class="text-green-600 font-bold">${Score}/100</span>
                    </div>
                    <p class="text-gray-500 text-xs mt-1">Completed: ${DateStr}</p>
                </div>
            `;
                })
                .join("");
        }
    }
};

const initExam = (AssignmentId) => {
    const Student = JSON.parse(localStorage.getItem("currentUser"));
    const Assignments = StorageAPI.getStudentAssignments(Student.id);
    CurrentExam = Assignments.find((a) => a.assignmentId === AssignmentId);

    if (!CurrentExam) return;

    CurrentQuestions = shuffleArray([...CurrentExam.questions]);

    CurrentQuestions.forEach((Q) => {
        Q.shuffledChoices = shuffleArray([
            { key: "QC1", text: Q.QC1 },
            { key: "QC2", text: Q.QC2 },
            { key: "QC3", text: Q.QC3 },
            { key: "QC4", text: Q.QC4 },
        ]);
    });

    document.getElementById("dashboard-section").classList.add("hidden");
    document.getElementById("exam-interface").classList.remove("hidden");
    document.getElementById("start-overlay").classList.remove("hidden");
    document.getElementById("question-container").classList.add("hidden");
};

const startQuiz = () => {
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("question-container").classList.remove("hidden");

    CurrentQuestionIndex = 0;
    UserAnswers = {};

    TimeRemaining = CurrentExam.duration * 60;

    startTotalTimer();
    renderQuestion();
};

const startTotalTimer = () => {
    const TimerEl = document.getElementById("total-timer");
    ExamTimer = setInterval(() => {
        TimeRemaining--;
        const Minutes = Math.floor(TimeRemaining / 60);
        const Seconds = TimeRemaining % 60;
        TimerEl.innerText = `${Minutes}:${Seconds < 10 ? "0" : ""}${Seconds}`;

        if (TimeRemaining <= 0) {
            finishExam(true);
        }
    }, 1000);
};

const renderQuestion = async () => {
    if (CurrentQuestionIndex >= CurrentQuestions.length) {
        finishExam();
        return;
    }

    const Q = CurrentQuestions[CurrentQuestionIndex];

    const TimePerQuestion = (CurrentExam.duration * 60) / CurrentQuestions.length;
    QuestionTimeRemaining = TimePerQuestion;

    document.getElementById("q-text").innerText = Q.QText;
    document.getElementById("q-progress").innerText =
        `Question ${CurrentQuestionIndex + 1} of ${CurrentQuestions.length}`;

    const ImgEl = document.getElementById("q-image");
    if (Q.QImage) {
        if (Q.QImage.startsWith("img_")) {
            try {
                const Base64 = await StorageAPI.getQuestionImage(Q.QImage);
                ImgEl.src = Base64 || "";
                ImgEl.classList.remove("hidden");
            } catch (E) {
                console.error(E);
                ImgEl.classList.add("hidden");
            }
        } else {
            ImgEl.src = Q.QImage;
            ImgEl.classList.remove("hidden");
        }
    } else {
        ImgEl.classList.add("hidden");
    }

    const ChoicesDiv = document.getElementById("choices-grid");
    ChoicesDiv.innerHTML = Q.shuffledChoices
        .map(
            (C) => `
        <button onclick="handleAnswer('${C.text}', this)" class="choice-btn w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition font-medium text-gray-700">
            ${C.text}
        </button>
    `,
        )
        .join("");

    document.getElementById("next-btn").disabled = true;

    startQuestionTimer(TimePerQuestion);
};

const startQuestionTimer = (Duration) => {
    if (QTimer) clearInterval(QTimer);

    const Bar = document.getElementById("q-timer-bar");
    let TimeLeft = Duration;

    QTimer = setInterval(() => {
        TimeLeft--;
        const Percentage = (TimeLeft / Duration) * 100;
        Bar.style.width = `${Percentage}%`;

        if (TimeLeft <= 0) {
            clearInterval(QTimer);
            handleTimeUp();
        }
    }, 1000);
};

const handleTimeUp = () => {
    const Btns = document.querySelectorAll(".choice-btn");
    Btns.forEach((B) => (B.disabled = true));

    setTimeout(() => {
        nextQuestion();
    }, 1000);
};

const handleAnswer = (SelectedText, BtnElement) => {
    if (QTimer) clearInterval(QTimer);

    const Q = CurrentQuestions[CurrentQuestionIndex];
    const IsCorrect = SelectedText === Q.QAns;

    UserAnswers[Q.QNo] = {
        questionId: Q.QNo,
        selected: SelectedText,
        isCorrect: IsCorrect,
        score: IsCorrect ? Q.QScore : 0,
    };

    if (IsCorrect) {
        BtnElement.classList.add(
            "bg-green-100",
            "border-green-500",
            "text-green-700",
        );
    } else {
        BtnElement.classList.add("bg-red-100", "border-red-500", "text-red-700");
    }

    const Btns = document.querySelectorAll(".choice-btn");
    Btns.forEach((B) => (B.disabled = true));

    document.getElementById("next-btn").disabled = false;
};

const nextQuestion = () => {
    CurrentQuestionIndex++;
    renderQuestion();
};

const finishExam = (IsTimeout = false) => {
    if (ExamTimer) clearInterval(ExamTimer);
    if (QTimer) clearInterval(QTimer);

    let TotalScore = 0;
    Object.values(UserAnswers).forEach((Ans) => {
        TotalScore += parseInt(Ans.score) || 0;
    });

    const Student = JSON.parse(localStorage.getItem("currentUser"));
    const Result = {
        studentId: Student.id,
        assignmentId: CurrentExam.assignmentId,
        examId: CurrentExam.examId,
        examTitle: CurrentExam.title,
        score: TotalScore,
        dateTaken: new Date().toISOString(),
        answers: UserAnswers,
    };

    StorageAPI.saveExamResult(Result);

    StorageAPI.updateAssignmentStatus(CurrentExam.assignmentId, "Completed");

    document.getElementById("exam-interface").classList.add("hidden");
    document.getElementById("result-interface").classList.remove("hidden");
    document.getElementById("final-score").innerText = `${TotalScore}/100`;

    if (IsTimeout) {
        new PopupMsg("Time is up! Exam submitted.", MsgType.Hint);
    }
};

const returnToDashboard = () => {
    window.location.reload();
};

const naiveShuffle = (Array) => {
    const Result = [];
    const Temp = Array.slice();
    while (Temp.length > 0) {
        const RandomIdx = Math.floor(Math.random() * Temp.length);
        const El = Temp[RandomIdx];
        Result.push(El);
        Temp.splice(RandomIdx, 1);
    }
    return Result;
};

const shuffleArray = naiveShuffle;
