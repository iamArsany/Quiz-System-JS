const MAX_TOTAL_SCORE = 100;
let currentQuestions = [];
let activeIndex = 0;

/**
 * Initial Load
 */
document.addEventListener("DOMContentLoaded", () => {
  const teacher = JSON.parse(localStorage.getItem("currentUser"));
  if (!teacher) {
    window.location.href = "login.html";
    return;
  }

  const teacherNameEl = document.getElementById("teacher-name");
  if (teacherNameEl) teacherNameEl.innerText = `Welcome, ${teacher.username}`;

  RenderExams();
});

/**
 * UI State Management
 */
const OpenExamCreator = () => {
  document.getElementById("exam-modal").classList.remove("hidden");
  // Start with one fresh question
  currentQuestions = [CreateEmptyQuestion(1)];
  activeIndex = 0;

  // Clear exam title input
  const nameInput = document.getElementById("exam-name");
  if (nameInput) nameInput.value = "";

  RenderCurrentQuestion();
  UpdateTotalScoreDisplay();
};

const CloseExamCreator = () => {
  document.getElementById("exam-modal").classList.add("hidden");
  currentQuestions = [];
  activeIndex = 0;
};

const CreateEmptyQuestion = (number) => ({
  QNo: number,
  QText: "",
  QLevel: Level.Easy,
  QPic: null,
  QScore: 0,
  QC1: "",
  QC2: "",
  QC3: "",
  QC4: "",
  QAns: "",
});

/**
 * Question Rendering
 */
const RenderCurrentQuestion = () => {
  const container = document.getElementById("question-container");
  const q = currentQuestions[activeIndex];

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-bold text-blue-600">Question #${q.QNo}</h3>
        <select id="q-level" class="border rounded-lg px-3 py-2 bg-white font-medium">
          <option value="${Level.Easy}" ${q.QLevel === Level.Easy ? "selected" : ""}>Easy</option>
          <option value="${Level.Medium}" ${q.QLevel === Level.Medium ? "selected" : ""}>Medium</option>
          <option value="${Level.Hard}" ${q.QLevel === Level.Hard ? "selected" : ""}>Hard</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="font-bold text-gray-700">Question Text:</label>
        <textarea id="q-text" placeholder="What is this animal?" 
          class="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 h-24">${q.QText}</textarea>
      </div>

      <div class="space-y-2">
        <label class="font-bold text-gray-700">Upload Image (Required):</label>
        <input type="file" id="q-image" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        ${q.QPic ? `<p class="text-xs text-green-600 font-bold mt-1">✓ Image currently saved</p>` : ""}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${[1, 2, 3, 4]
          .map(
            (i) => `
          <div class="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <input type="radio" name="correct-ans" value="QC${i}" ${q.QAns === q[`QC${i}`] && q.QAns !== "" ? "checked" : ""} />
            <input type="text" id="QC${i}" value="${q[`QC${i}`]}" placeholder="Choice ${i}" 
              class="w-full bg-transparent border-none focus:ring-0 p-0" />
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="w-40">
        <label class="block font-bold text-gray-700 mb-1">Score:</label>
        <input type="number" id="q-score" value="${q.QScore}" class="w-full p-2 border rounded-lg" />
      </div>
    </div>
  `;
  UpdateNavigationButtons();
};

/**
 * Validation & Saving
 */
const ValidateAndSaveCurrent = async () => {
  const qText = document.getElementById("q-text").value.trim();
  const qLevel = document.getElementById("q-level").value;
  const qScore = parseInt(document.getElementById("q-score").value) || 0;
  const c1 = document.getElementById("QC1").value.trim();
  const c2 = document.getElementById("QC2").value.trim();
  const c3 = document.getElementById("QC3").value.trim();
  const c4 = document.getElementById("QC4").value.trim();
  const selectedRadio = document.querySelector(
    'input[name="correct-ans"]:checked',
  );
  const imageFile = document.getElementById("q-image").files[0];

  // Logic Validations
  if (!qText)
    return new PopupMsg("Error: Question text is missing", MsgType.Error);
  if (!c1 || !c2 || !c3 || !c4)
    return new PopupMsg("Error: All 4 choices must be filled", MsgType.Error);
  if (!selectedRadio)
    return new PopupMsg(
      "Error: Please select the correct answer",
      MsgType.Error,
    );
  if (qScore <= 0)
    return new PopupMsg("Error: Score must be greater than 0", MsgType.Error);
  if (!imageFile && !currentQuestions[activeIndex].QPic)
    return new PopupMsg("Error: Question picture is required", MsgType.Error);

  // Score Validation
  const otherQuestionsScore = currentQuestions.reduce(
    (sum, q, idx) => (idx !== activeIndex ? sum + q.QScore : sum),
    0,
  );
  if (otherQuestionsScore + qScore > MAX_TOTAL_SCORE) {
    return new PopupMsg(
      `Error: Total score exceeds 100 (Current total: ${otherQuestionsScore + qScore})`,
      MsgType.Error,
    );
  }

  // Handle IndexedDB Image Save
  if (imageFile) {
    const imageId = `img_${Date.now()}`;
    await SaveImageToDB(imageId, imageFile);
    currentQuestions[activeIndex].QPic = imageId;
  }

  // Update Object
  currentQuestions[activeIndex].QText = qText;
  currentQuestions[activeIndex].QLevel = qLevel;
  currentQuestions[activeIndex].QScore = qScore;
  currentQuestions[activeIndex].QC1 = c1;
  currentQuestions[activeIndex].QC2 = c2;
  currentQuestions[activeIndex].QC3 = c3;
  currentQuestions[activeIndex].QC4 = c4;
  currentQuestions[activeIndex].QAns = document.getElementById(
    selectedRadio.value,
  ).value;

  UpdateTotalScoreDisplay();
  return true;
};

/**
 * Navigation Logic
 */
const NextQuestion = async () => {
  const result = await ValidateAndSaveCurrent();
  if (result === true) {
    if (activeIndex === currentQuestions.length - 1) {
      currentQuestions.push(CreateEmptyQuestion(currentQuestions.length + 1));
    }
    activeIndex++;
    RenderCurrentQuestion();
  }
};

const PrevQuestion = () => {
  if (activeIndex > 0) {
    activeIndex--;
    RenderCurrentQuestion();
  }
};

const UpdateNavigationButtons = () => {
  const prevBtn = document.getElementById("prev-btn");
  if (prevBtn) prevBtn.disabled = activeIndex === 0;
};

const UpdateTotalScoreDisplay = () => {
  const total = currentQuestions.reduce((sum, q) => sum + q.QScore, 0);
  const scoreEl = document.getElementById("running-score");
  if (scoreEl) {
    scoreEl.innerText = total;
    scoreEl.className =
      total > MAX_TOTAL_SCORE ? "text-red-600 font-bold" : "text-gray-500";
  }
};

/**
 * Final Submission
 */
const FinalizeExam = async () => {
  const name = document.getElementById("exam-name").value.trim();
  if (!name) return new PopupMsg("Error: Exam name is required", MsgType.Error);

  const result = await ValidateAndSaveCurrent();
  if (result !== true) return;

  const total = currentQuestions.reduce((sum, q) => sum + q.QScore, 0);
  if (total !== 100) {
    return new PopupMsg(
      `Error: Total score must be exactly 100. Current: ${total}`,
      MsgType.Error,
    );
  }

  const exams = JSON.parse(localStorage.getItem("exams") || "[]");
  const teacher = JSON.parse(localStorage.getItem("currentUser"));

  exams.push({
    id: Date.now(),
    name: name,
    questions: currentQuestions,
    teacherId: teacher.id,
    createdAt: new Date().toLocaleDateString(),
  });

  localStorage.setItem("exams", JSON.stringify(exams));
  new PopupMsg("Exam Created Successfully!", MsgType.Success);
  CloseExamCreator();
  RenderExams();
};

/**
 * Data Rendering (Previous Exams)
 */
const RenderExams = () => {
  const list = document.getElementById("exams-list");
  if (!list) return;

  const exams = JSON.parse(localStorage.getItem("exams") || "[]");
  const teacher = JSON.parse(localStorage.getItem("currentUser"));
  const myExams = exams.filter((e) => e.teacherId === teacher.id);

  if (myExams.length === 0) {
    list.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10">No exams created yet.</p>`;
    return;
  }

  list.innerHTML = myExams
    .map(
      (exam) => `
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 class="font-bold text-xl mb-1">${exam.name}</h3>
      <p class="text-sm text-gray-500 mb-4">Date: ${exam.createdAt}</p>
      <div class="flex justify-between items-center">
        <span class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">${exam.questions.length} Questions</span>
        <button class="text-blue-600 font-semibold hover:underline">View Results</button>
      </div>
    </div>
  `,
    )
    .join("");
};

/**
 * Assets Management (IndexedDB)
 */
const SaveImageToDB = (id, file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file provided");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const openRequest = indexedDB.open("ExamAssets", 1);

      openRequest.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("question_images")) {
          db.createObjectStore("question_images", { keyPath: "id" });
        }
      };

      openRequest.onsuccess = (e) => {
        const db = e.target.result;

        const tx = db.transaction("question_images", "readwrite");
        const store = tx.objectStore("question_images");

        const putRequest = store.put({
          id: id,
          image: reader.result,
        });

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);

        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };

      openRequest.onerror = () => reject(openRequest.error);
    };

    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
};
/**
 * Setup Logic
 */
const StartCreating = () => {
  const nameInput = document.getElementById("exam-name");
  const countInput = document.getElementById("question-count");

  const examName = nameInput.value.trim();
  const qCount = parseInt(countInput.value);

  // 1. Validation
  if (!examName) {
    return new PopupMsg("Error: Please enter an exam title", MsgType.Error);
  }
  if (isNaN(qCount) || qCount < 15) {
    return new PopupMsg(
      "Error: Minimum of 15 questions required",
      MsgType.Error,
    );
  }

  // 2. Initialize Data
  // Create an array filled with empty questions based on the count provided
  currentQuestions = Array.from({ length: qCount }, (_, i) =>
    CreateEmptyQuestion(i + 1),
  );
  activeIndex = 0;

  // 3. UI Transition
  document.getElementById("setup-screen").classList.add("hidden");
  document.getElementById("editor-screen").classList.remove("hidden");

  // Set Display Name
  const displayTitle = document.getElementById("display-exam-name");
  if (displayTitle) displayTitle.innerText = examName;

  // 4. Initial Renders
  RenderCurrentQuestion();
  UpdateTotalScoreDisplay();
  UpdatePagination();
};

/**
 * Pagination Management
 */
const UpdatePagination = () => {
  const slider = document.getElementById("pagination-slider");
  if (!slider) return;

  slider.innerHTML = currentQuestions
    .map((q, idx) => {
      const isActive = idx === activeIndex;
      const isFilled = q.QText !== "" && q.QScore > 0;

      return `
      <button 
        onclick="JumpToQuestion(${idx})"
        class="min-w-[40px] h-10 rounded-lg font-bold transition-all flex items-center justify-center border-2
        ${
          isActive
            ? "bg-blue-600 border-blue-600 text-white"
            : isFilled
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "bg-white border-gray-100 text-gray-400"
        }
        hover:border-blue-400"
      >
        ${idx + 1}
      </button>
    `;
    })
    .join("");
};

const JumpToQuestion = async (index) => {
  // Optional: Save current work before jumping
  const result = await ValidateAndSaveCurrent();
  if (result === true) {
    activeIndex = index;
    RenderCurrentQuestion();
    UpdatePagination();
  }
};
