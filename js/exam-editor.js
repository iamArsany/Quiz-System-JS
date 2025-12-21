let currentExamId = null;
let examQuestions = [];
let editIndex = 0;

const startNewExamFlow = () => {
  currentExamId = null;
  examQuestions = [];
  editIndex = 0;

  // Reset inputs
  const titleInput = document.getElementById("setup-title");
  const durationInput = document.getElementById("setup-duration");
  const countInput = document.getElementById("setup-count");

  if (titleInput) titleInput.value = "";
  if (durationInput) durationInput.value = "";
  if (countInput) countInput.value = "";

  // Show Setup, Hide Workspace
  const setupDiv = document.getElementById("editor-setup");
  const workspaceDiv = document.getElementById("question-workspace");

  if (setupDiv) setupDiv.classList.remove("hidden");
  if (workspaceDiv) {
    workspaceDiv.classList.add("hidden");
    workspaceDiv.innerHTML = "";
  }

  switchView("editor-section");
};

const saveAndNav = (newIndex) => {
  // Save current fields to array
  const q = examQuestions[editIndex];
  q.QText = document.getElementById("edit-qtext").value;
  q.QC1 = document.getElementById("edit-c1").value;
  q.QC2 = document.getElementById("edit-c2").value;
  q.QC3 = document.getElementById("edit-c3").value;
  q.QC4 = document.getElementById("edit-c4").value;
  q.QAns = document.getElementById("edit-qans").value;
  q.QScore = parseInt(document.getElementById("edit-qscore").value) || 0;

  editIndex = newIndex;
  renderEditorUI();
};

const finalizeExamProcess = async () => {
  const totalScore = examQuestions.reduce(
    (sum, item) => sum + (parseInt(item.QScore) || 0),
    0,
  );
  if (totalScore !== 100)
    return new PopupMsg("Total score must be 100!", MsgType.Error);

  // Process Images: Save to DB and replace Base64 with ID
  for (let i = 0; i < examQuestions.length; i++) {
    const q = examQuestions[i];
    if (q.QImage && q.QImage.startsWith("data:image")) {
      const imgId = `img_${Date.now()}_${i}`;
      try {
        await StorageAPI.saveQuestionImage(imgId, q.QImage);
        q.QImage = imgId; // Replace Base64 with ID
      } catch (err) {
        console.error("Failed to save image", err);
        return new PopupMsg("Failed to save images", MsgType.Error);
      }
    }
  }

  // Save via StorageAPI (This handles versioning internally)
  const examData = {
    id: currentExamId,
    title: document.getElementById("setup-title").value,
    duration: document.getElementById("setup-duration").value,
    questions: examQuestions,
  };

  const savedId = StorageAPI.saveExam(examData);
  currentExamId = savedId;

  // Move to Assignment View
  openAssignmentView(savedId);
};

/**
 * Updated Setup Logic
 */
const initQuestionEditor = () => {
  const title = document.getElementById("setup-title").value.trim();
  const duration = parseInt(document.getElementById("setup-duration").value);
  const qCount = parseInt(document.getElementById("setup-count").value);

  const qNum = 1;
  // Validation
  if (!title) return new PopupMsg("Exam Title is required", MsgType.Error);
  if (isNaN(duration) || duration <= 0)
    return new PopupMsg("Invalid Duration", MsgType.Error);
  if (isNaN(qCount) || qCount < qNum)
    return new PopupMsg(`Min ${qNum} question required`, MsgType.Error);

  document.getElementById("editor-setup").classList.add("hidden");
  document.getElementById("question-workspace").classList.remove("hidden");

  // Initialize array based on user input
  examQuestions = Array.from({ length: qCount }, (_, i) => ({
    QNo: i + 1,
    QText: "",
    QScore: 0,
    QC1: "",
    QC2: "",
    QC3: "",
    QC4: "",
    QAns: "",
    QLevel: "Easy",
    QImage: "",
  }));

  editIndex = 0;
  renderEditorUI();
};

/**
 * Updated Question UI with Radio Buttons
 */
const renderEditorUI = async () => {
  const workspace = document.getElementById("question-workspace");
  const q = examQuestions[editIndex];
  const totalScore = examQuestions.reduce(
    (sum, item) => sum + (parseInt(item.QScore) || 0),
    0,
  );
  const isLast = editIndex === examQuestions.length - 1;

  // Resolve Image if it's an ID
  let displayImage = q.QImage || "";
  if (displayImage && !displayImage.startsWith("data:image")) {
    try {
      const fetched = await StorageAPI.getQuestionImage(displayImage);
      if (fetched) displayImage = fetched;
    } catch (e) {
      console.error("Failed to load image", e);
    }
  }

  workspace.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">Question ${q.QNo} <span class="text-gray-400 text-sm">of ${examQuestions.length}</span></h3>
            <div class="text-right">
                <p class="text-xs font-bold uppercase text-gray-400">Progress Score</p>
                <p class="text-xl font-black ${totalScore === 100 ? "text-green-600" : "text-blue-600"}">${totalScore}/100</p>
            </div>
        </div>

        <div class="space-y-6">
            <div class="space-y-2">
                <label class="text-sm font-bold text-gray-600">Question Text</label>
                <textarea id="edit-qtext" class="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none h-24">${q.QText}</textarea>
            </div>

             <div class="space-y-2">
                <label class="text-sm font-bold text-gray-600">Question Image (Optional)</label>
                <input type="file" accept="image/*" onchange="handleQuestionImageUpload(this)" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                <div id="q-image-preview" class="${displayImage ? "" : "hidden"} mt-2">
                    <img src="${displayImage}" class="h-32 rounded-lg border border-gray-200 object-cover">
                    <button onclick="removeQuestionImage()" class="text-xs text-red-500 font-bold mt-1 hover:underline">Remove Image</button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${[1, 2, 3, 4]
                  .map(
                    (i) => `
                    <div class="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
                        <input type="radio" name="correct-choice" value="edit-c${i}" ${q.QAns === q[`QC${i}`] && q.QAns !== "" ? "checked" : ""} class="w-5 h-5 cursor-pointer">
                        <input type="text" id="edit-c${i}" value="${q[`QC${i}`]}" placeholder="Choice ${i}" class="w-full bg-transparent outline-none">
                    </div>
                `,
                  )
                  .join("")}
            </div>

            <div class="w-32">
                <label class="text-sm font-bold text-gray-600">Points</label>
                <input type="number" id="edit-qscore" value="${q.QScore}" class="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none">
            </div>
        </div>

        <div class="flex justify-between mt-10 pt-6 border-t">
            <button onclick="navigateOnly(${editIndex - 1})" ${editIndex === 0 ? "disabled" : ""} class="px-6 py-3 text-gray-400 font-bold disabled:opacity-30">Previous</button>
            
            ${
              isLast
                ? `<button onclick="validateAndSaveCurrent(true)" class="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Finalize Exam</button>`
                : `<button onclick="validateAndSaveCurrent(false)" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Save & Next</button>`
            }
        </div>
    `;
};

/**
 * Strict Validation Logic
 */
const validateAndSaveCurrent = (isFinalizing) => {
  const qText = document.getElementById("edit-qtext").value.trim();
  const c1 = document.getElementById("edit-c1").value.trim();
  const c2 = document.getElementById("edit-c2").value.trim();
  const c3 = document.getElementById("edit-c3").value.trim();
  const c4 = document.getElementById("edit-c4").value.trim();
  const score = parseInt(document.getElementById("edit-qscore").value);
  const selectedRadio = document.querySelector(
    'input[name="correct-choice"]:checked',
  );

  // 1. Check Fields
  if (!qText || !c1 || !c2 || !c3 || !c4) {
    return new PopupMsg("All fields and 4 choices are required", MsgType.Error);
  }
  // 2. Check Answer Selection
  if (!selectedRadio) {
    return new PopupMsg(
      "Please select the correct answer using the radio button",
      MsgType.Error,
    );
  }
  // 3. Check Answer Content
  const correctText = document.getElementById(selectedRadio.value).value.trim();
  if (!correctText) {
    return new PopupMsg(
      "The selected correct answer cannot be empty",
      MsgType.Error,
    );
  }
  // 4. Check Score
  if (isNaN(score) || score <= 0) {
    return new PopupMsg("Points must be greater than 0", MsgType.Error);
  } else if (score > 100) {
    return new PopupMsg("Points must not exceed 100 !", MsgType.Error);
  }

  // Save data to current index
  const q = examQuestions[editIndex];
  q.QText = qText;
  q.QC1 = c1;
  q.QC2 = c2;
  q.QC3 = c3;
  q.QC4 = c4;
  q.QAns = correctText;
  q.QScore = score;

  if (isFinalizing) {
    finalizeExamProcess();
  } else {
    editIndex++;
    renderEditorUI();
  }
};

const navigateOnly = (index) => {
  editIndex = index;
  renderEditorUI();
};

const handleQuestionImageUpload = (input) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      examQuestions[editIndex].QImage = base64;

      // Update Preview
      const previewDiv = document.getElementById("q-image-preview");
      const img = previewDiv.querySelector("img");
      img.src = base64;
      previewDiv.classList.remove("hidden");
    };
    reader.readAsDataURL(input.files[0]);
  }
};

const removeQuestionImage = () => {
  examQuestions[editIndex].QImage = "";
  const previewDiv = document.getElementById("q-image-preview");
  previewDiv.classList.add("hidden");
  previewDiv.querySelector("img").src = "";

  // Clear file input
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = "";
};
