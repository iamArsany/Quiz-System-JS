let currentExam = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let examTimer = null;
let questionTimer = null;
let timeRemaining = 0; // Total exam time
let questionTimeRemaining = 0; // Per question time

document.addEventListener("DOMContentLoaded", () => {
  const student = JSON.parse(localStorage.getItem("currentUser"));
  if (!student || student.Role !== 0) {
    // 0 is Student
    window.location.href = "login.html";
    return;
  }
  renderStudentDashboard();
});

const renderStudentDashboard = () => {
  const student = JSON.parse(localStorage.getItem("currentUser"));
  const assignments = StorageAPI.getStudentAssignments(student.id);
  const results = StorageAPI.getStudentResults(student.id);

  // Filter based on status
  const requiredExams = assignments.filter(a => a.status === "Pending");
  const completedExams = assignments.filter(a => a.status === "Completed");

  // Render Required
  const requiredContainer = document.getElementById("required-exams-grid");
  if (requiredContainer) {
    if (requiredExams.length === 0) {
      requiredContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center">No pending exams.</p>`;
    } else {
      requiredContainer.innerHTML = requiredExams
        .map(
          (exam) => `
                <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                    <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">Active</span>
                    <h3 class="text-xl font-bold mt-3 text-gray-800">${exam.title}</h3>
                    <p class="text-gray-500 text-sm mt-2">Duration: ${exam.duration} mins • ${exam.questions.length} Questions</p>
                    <button onclick="initExam('${exam.assignmentId}')" class="mt-6 block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                        Start Exam
                    </button>
                </div>
            `,
        )
        .join("");
    }
  }

  // Render Previous (Use results for score, but list from completed assignments)
  const previousContainer = document.getElementById("previous-exams-grid");
  if (previousContainer) {
    if (completedExams.length === 0) {
      previousContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center">No completed exams.</p>`;
    } else {
      previousContainer.innerHTML = completedExams
        .map(
          (exam) => {
            // Find result for score
            const result = results.find(r => r.assignmentId === exam.assignmentId);
            const score = result ? result.score : 0;
            const date = result ? new Date(result.dateTaken).toLocaleDateString() : "N/A";

            return `
                <div class="bg-gray-100 border border-gray-200 rounded-xl p-6 opacity-90">
                    <div class="flex justify-between items-start">
                        <h3 class="text-lg font-bold text-gray-700">${exam.title}</h3>
                        <span class="text-green-600 font-bold">${score}/100</span>
                    </div>
                    <p class="text-gray-500 text-xs mt-1">Completed: ${date}</p>
                </div>
            `;
          }
        )
        .join("");
    }
  }
};

const initExam = (assignmentId) => {
  const student = JSON.parse(localStorage.getItem("currentUser"));
  const assignments = StorageAPI.getStudentAssignments(student.id);
  currentExam = assignments.find((a) => a.assignmentId === assignmentId);

  if (!currentExam) return;

  // Randomize Questions
  currentQuestions = shuffleArray([...currentExam.questions]);

  // Randomize Answers for each question
  currentQuestions.forEach((q) => {
    q.shuffledChoices = shuffleArray([
      { key: "QC1", text: q.QC1 },
      { key: "QC2", text: q.QC2 },
      { key: "QC3", text: q.QC3 },
      { key: "QC4", text: q.QC4 },
    ]);
  });

  // Show Start Overlay
  document.getElementById("dashboard-section").classList.add("hidden");
  document.getElementById("exam-interface").classList.remove("hidden");
  document.getElementById("start-overlay").classList.remove("hidden");
  document.getElementById("question-container").classList.add("hidden");
};

const startQuiz = () => {
  document.getElementById("start-overlay").classList.add("hidden");
  document.getElementById("question-container").classList.remove("hidden");

  currentQuestionIndex = 0;
  userAnswers = {};

  // Total Duration in Seconds
  timeRemaining = currentExam.duration * 60;

  startTotalTimer();
  renderQuestion();
};

const startTotalTimer = () => {
  const timerEl = document.getElementById("total-timer");
  examTimer = setInterval(() => {
    timeRemaining--;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerEl.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    if (timeRemaining <= 0) {
      finishExam(true);
    }
  }, 1000);
};

const renderQuestion = async () => {
  if (currentQuestionIndex >= currentQuestions.length) {
    finishExam();
    return;
  }

  const q = currentQuestions[currentQuestionIndex];

  // Calculate Time per Question (Total Duration / Question Count) - or just use remaining total time?
  // Requirement: "Each Question has a time to solve (related to total Exam Duration)"
  // Let's split total duration equally among questions for the question timer bar
  const timePerQuestion = (currentExam.duration * 60) / currentQuestions.length;
  questionTimeRemaining = timePerQuestion;

  // Update UI
  document.getElementById("q-text").innerText = q.QText;
  document.getElementById("q-progress").innerText =
    `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;

  // Image
  const imgEl = document.getElementById("q-image");
  if (q.QImage) {
    if (q.QImage.startsWith("img_")) {
      try {
        const base64 = await StorageAPI.getQuestionImage(q.QImage);
        imgEl.src = base64 || "";
        imgEl.classList.remove("hidden");
      } catch (e) {
        console.error(e);
        imgEl.classList.add("hidden");
      }
    } else {
      imgEl.src = q.QImage; // Legacy Base64
      imgEl.classList.remove("hidden");
    }
  } else {
    imgEl.classList.add("hidden");
  }

  // Choices
  const choicesDiv = document.getElementById("choices-grid");
  choicesDiv.innerHTML = q.shuffledChoices
    .map(
      (c, i) => `
        <button onclick="handleAnswer('${c.text}', this)" class="choice-btn w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition font-medium text-gray-700">
            ${c.text}
        </button>
    `,
    )
    .join("");

  // Disable Next Button
  document.getElementById("next-btn").disabled = true;

  // Start Question Timer
  startQuestionTimer(timePerQuestion);
};

const startQuestionTimer = (duration) => {
  if (questionTimer) clearInterval(questionTimer);

  const bar = document.getElementById("q-timer-bar");
  let timeLeft = duration;

  questionTimer = setInterval(() => {
    timeLeft--;
    const percentage = (timeLeft / duration) * 100;
    bar.style.width = `${percentage}%`;

    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      // Time's up for this question -> Wrong answer, move next
      handleTimeUp();
    }
  }, 1000);
};

const handleTimeUp = () => {
  // Mark as wrong (or just skip)
  // Disable all buttons
  const btns = document.querySelectorAll(".choice-btn");
  btns.forEach((b) => (b.disabled = true));

  // Show correct answer? Requirement says "Question answer will be considered wrong"
  // Requirement: "next question will be appeared automatically"

  setTimeout(() => {
    nextQuestion();
  }, 1000);
};

const handleAnswer = (selectedText, btnElement) => {
  if (questionTimer) clearInterval(questionTimer);

  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = selectedText === q.QAns;

  // Save Answer
  userAnswers[q.QNo] = {
    questionId: q.QNo,
    selected: selectedText,
    isCorrect: isCorrect,
    score: isCorrect ? q.QScore : 0,
  };

  // UI Feedback
  if (isCorrect) {
    btnElement.classList.add(
      "bg-green-100",
      "border-green-500",
      "text-green-700",
    );
  } else {
    btnElement.classList.add("bg-red-100", "border-red-500", "text-red-700");
  }

  // Disable all buttons
  const btns = document.querySelectorAll(".choice-btn");
  btns.forEach((b) => (b.disabled = true));

  // Enable Next
  document.getElementById("next-btn").disabled = false;
};

const nextQuestion = () => {
  currentQuestionIndex++;
  renderQuestion();
};

const finishExam = (isTimeout = false) => {
  if (examTimer) clearInterval(examTimer);
  if (questionTimer) clearInterval(questionTimer);

  // Calculate Score
  let totalScore = 0;
  Object.values(userAnswers).forEach((ans) => {
    totalScore += parseInt(ans.score) || 0;
  });

  // Save Result
  const student = JSON.parse(localStorage.getItem("currentUser"));
  const result = {
    studentId: student.id,
    assignmentId: currentExam.assignmentId,
    examId: currentExam.examId,
    examTitle: currentExam.title,
    score: totalScore,
    dateTaken: new Date().toISOString(),
    answers: userAnswers,
  };

  StorageAPI.saveExamResult(result);

  // Update Assignment Status
  StorageAPI.updateAssignmentStatus(currentExam.assignmentId, "Completed");

  // Show Result UI
  document.getElementById("exam-interface").classList.add("hidden");
  document.getElementById("result-interface").classList.remove("hidden");

  document.getElementById("final-score").innerText = `${totalScore}/100`;

  if (isTimeout) {
    new PopupMsg("Time is up! Exam submitted.", MsgType.Hint);
  }
};

const returnToDashboard = () => {
  window.location.reload();
};

// Utils
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
