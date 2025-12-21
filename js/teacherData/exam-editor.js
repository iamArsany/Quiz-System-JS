let CurrentExamId = null;
let ExamQuestions = [];
let EditIndex = 0;

const startNewExamFlow = () => {
  CurrentExamId = null;
  ExamQuestions = [];
  EditIndex = 0;

  const TitleInput = document.getElementById("setup-title");
  const DurationInput = document.getElementById("setup-duration");
  const CountInput = document.getElementById("setup-count");

  if (TitleInput) TitleInput.value = "";
  if (DurationInput) DurationInput.value = "";
  if (CountInput) CountInput.value = "";
  if (document.getElementById("setup-level"))
    document.getElementById("setup-level").value = "Easy";

  const SetupDiv = document.getElementById("editor-setup");
  const WorkspaceDiv = document.getElementById("question-workspace");

  if (SetupDiv) SetupDiv.classList.remove("hidden");
  if (WorkspaceDiv) {
    WorkspaceDiv.classList.add("hidden");
    WorkspaceDiv.innerHTML = "";
  }

  switchView("editor-section");
};

const editExam = (ExamId) => {
  const Exams = JSON.parse(localStorage.getItem("exams") || "[]");
  const Exam = Exams.find((e) => e.id === ExamId);

  if (!Exam) return new PopupMsg("Exam not found", MsgType.Error);

  CurrentExamId = Exam.id;

  const LatestVersion = Exam.versions.find(
    (v) => v.versionId === Exam.currentVersion,
  );
  ExamQuestions = JSON.parse(JSON.stringify(LatestVersion.questions));
  EditIndex = 0;

  const TitleInput = document.getElementById("setup-title");
  const DurationInput = document.getElementById("setup-duration");
  const CountInput = document.getElementById("setup-count");
  const LevelInput = document.getElementById("setup-level");

  if (TitleInput) TitleInput.value = Exam.title;
  if (DurationInput) DurationInput.value = Exam.duration;
  if (CountInput) CountInput.value = ExamQuestions.length;
  if (LevelInput) LevelInput.value = Exam.level || "Easy";

  const SetupDiv = document.getElementById("editor-setup");
  const WorkspaceDiv = document.getElementById("question-workspace");

  if (SetupDiv) SetupDiv.classList.remove("hidden");
  if (WorkspaceDiv) {
    WorkspaceDiv.classList.add("hidden");
    WorkspaceDiv.innerHTML = "";
  }

  switchView("editor-section");
};

const SaveAndNav = (NewIndex) => {
  const Q = ExamQuestions[EditIndex];
  Q.QText = document.getElementById("edit-qtext").value;
  Q.QC1 = document.getElementById("edit-c1").value;
  Q.QC2 = document.getElementById("edit-c2").value;
  Q.QC3 = document.getElementById("edit-c3").value;
  Q.QC4 = document.getElementById("edit-c4").value;
  Q.QAns = document.getElementById("edit-qans").value;
  Q.QScore = parseInt(document.getElementById("edit-qscore").value) || 0;
  Q.QLevel = document.getElementById("edit-qlevel").value;

  EditIndex = NewIndex;
  renderEditorUI();
};

const finalizeExamProcess = async () => {
  const TotalScore = ExamQuestions.reduce(
    (Sum, Item) => Sum + (parseInt(Item.QScore) || 0),
    0,
  );
  if (TotalScore !== 100)
    return new PopupMsg("Total score must be 100!", MsgType.Error);

  for (let i = 0; i < ExamQuestions.length; i++) {
    const Q = ExamQuestions[i];
    if (Q.QImage && Q.QImage.startsWith("data:image")) {
      const ImgId = `img_${Date.now()}_${i}`;
      try {
        await StorageAPI.saveQuestionImage(ImgId, Q.QImage);
        Q.QImage = ImgId;
      } catch (Err) {
        console.error("Failed to save image", Err);
        return new PopupMsg("Failed to save images", MsgType.Error);
      }
    }
  }

  const ExamData = {
    id: CurrentExamId,
    title: document.getElementById("setup-title").value,
    duration: document.getElementById("setup-duration").value,
    questions: ExamQuestions,
  };

  const SavedId = StorageAPI.saveExam(ExamData);
  CurrentExamId = SavedId;

  new PopupMsg("Exam Saved Successfully!", MsgType.Success);
  switchView("exam-list-section");
};

const initQuestionEditor = () => {
  const Title = document.getElementById("setup-title").value.trim();
  const Duration = parseInt(document.getElementById("setup-duration").value);
  const QCount = parseInt(document.getElementById("setup-count").value);

  const QNum = 1;
  if (!Title) return new PopupMsg("Exam Title is required", MsgType.Error);
  if (isNaN(Duration) || Duration <= 0)
    return new PopupMsg("Invalid Duration", MsgType.Error);
  if (isNaN(QCount) || QCount < QNum)
    return new PopupMsg(`Min ${QNum} question required`, MsgType.Error);

  document.getElementById("editor-setup").classList.add("hidden");
  document.getElementById("question-workspace").classList.remove("hidden");

  if (CurrentExamId && ExamQuestions.length > 0) {
    if (QCount > ExamQuestions.length) {
      const Start = ExamQuestions.length;
      for (let i = 0; i < QCount - Start; i++) {
        ExamQuestions.push({
          QNo: Start + i + 1,
          QText: "",
          QScore: 0,
          QC1: "",
          QC2: "",
          QC3: "",
          QC4: "",
          QAns: "",
          QLevel: "Easy",
          QImage: "",
        });
      }
    } else if (QCount < ExamQuestions.length) {
      ExamQuestions = ExamQuestions.slice(0, QCount);
    }
    ExamQuestions.forEach((Q, i) => (Q.QNo = i + 1));
  } else {
    ExamQuestions = Array.from({ length: QCount }, (_, i) => ({
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
  }

  EditIndex = 0;
  renderEditorUI();
};

const renderEditorUI = async () => {
  const Workspace = document.getElementById("question-workspace");
  const Q = ExamQuestions[EditIndex];
  const TotalScore = ExamQuestions.reduce(
    (Sum, Item) => Sum + (parseInt(Item.QScore) || 0),
    0,
  );
  const IsLast = EditIndex === ExamQuestions.length - 1;

  let DisplayImage = Q.QImage || "";
  if (DisplayImage && !DisplayImage.startsWith("data:image")) {
    try {
      const Fetched = await StorageAPI.getQuestionImage(DisplayImage);
      if (Fetched) DisplayImage = Fetched;
    } catch (E) {
      console.error("Failed to load image", E);
    }
  }

  Workspace.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">Question ${Q.QNo} <span class="text-gray-400 text-sm">of ${ExamQuestions.length}</span></h3>
            <div class="text-right">
                <p class="text-xs font-bold uppercase text-gray-400">Progress Score</p>
                <p class="text-xl font-black ${TotalScore === 100 ? "text-green-600" : "text-blue-600"}">${TotalScore}/100</p>
            </div>
        </div>

        <div class="space-y-6">
            <div class="space-y-2">
                <label class="text-sm font-bold text-gray-600">Question Text</label>
                <textarea id="edit-qtext" class="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none h-24">${Q.QText}</textarea>
            </div>

             <div class="space-y-2">
                <label class="text-sm font-bold text-gray-600">Question Image (Optional)</label>
                <input type="file" accept="image/*" onchange="handleQuestionImageUpload(this)" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                <div id="q-image-preview" class="${DisplayImage ? "" : "hidden"} mt-2">
                    <img src="${DisplayImage}" class="h-32 rounded-lg border border-gray-200 object-cover">
                    <button onclick="removeQuestionImage()" class="text-xs text-red-500 font-bold mt-1 hover:underline">Remove Image</button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${[1, 2, 3, 4]
      .map(
        (i) => `
                    <div class="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
                        <input type="radio" name="correct-choice" value="edit-c${i}" ${Q.QAns === Q[`QC${i}`] && Q.QAns !== "" ? "checked" : ""} class="w-5 h-5 cursor-pointer">
                        <input type="text" id="edit-c${i}" value="${Q[`QC${i}`]}" placeholder="Choice ${i}" class="w-full bg-transparent outline-none">
                    </div>
                `,
      )
      .join("")}
            </div>

            <div class="flex gap-4">
                <div class="w-32">
                    <label class="text-sm font-bold text-gray-600">Points</label>
                    <input type="number" id="edit-qscore" value="${Q.QScore}" class="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none">
                </div>
                <div class="w-48">
                    <label class="text-sm font-bold text-gray-600">Difficulty</label>
                    <select id="edit-qlevel" class="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none bg-white">
                        <option value="Easy" ${Q.QLevel === "Easy" ? "selected" : ""}>Easy</option>
                        <option value="Medium" ${Q.QLevel === "Medium" ? "selected" : ""}>Medium</option>
                        <option value="Hard" ${Q.QLevel === "Hard" ? "selected" : ""}>Hard</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="flex justify-between mt-10 pt-6 border-t">
            <button onclick="navigateOnly(${EditIndex - 1})" ${EditIndex === 0 ? "disabled" : ""} class="px-6 py-3 text-gray-400 font-bold disabled:opacity-30">Previous</button>
            
            ${IsLast
      ? `<button onclick="validateAndSaveCurrent(true)" class="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Finalize Exam</button>`
      : `<button onclick="validateAndSaveCurrent(false)" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Save & Next</button>`
    }
        </div>
    `;
};

const validateAndSaveCurrent = (IsFinalizing) => {
  const QText = document.getElementById("edit-qtext").value.trim();
  const C1 = document.getElementById("edit-c1").value.trim();
  const C2 = document.getElementById("edit-c2").value.trim();
  const C3 = document.getElementById("edit-c3").value.trim();
  const C4 = document.getElementById("edit-c4").value.trim();
  const Score = parseInt(document.getElementById("edit-qscore").value);
  const Level = document.getElementById("edit-qlevel").value;
  const SelectedRadio = document.querySelector(
    'input[name="correct-choice"]:checked',
  );

  if (!QText || !C1 || !C2 || !C3 || !C4) {
    return new PopupMsg("All fields and 4 choices are required", MsgType.Error);
  }
  if (!SelectedRadio) {
    return new PopupMsg(
      "Please select the correct answer using the radio button",
      MsgType.Error,
    );
  }
  const CorrectText = document.getElementById(SelectedRadio.value).value.trim();
  if (!CorrectText) {
    return new PopupMsg(
      "The selected correct answer cannot be empty",
      MsgType.Error,
    );
  }
  if (isNaN(Score) || Score <= 0) {
    return new PopupMsg("Points must be greater than 0", MsgType.Error);
  } else if (Score > 100) {
    return new PopupMsg("Points must not exceed 100 !", MsgType.Error);
  }

  const Q = ExamQuestions[EditIndex];
  Q.QText = QText;
  Q.QC1 = C1;
  Q.QC2 = C2;
  Q.QC3 = C3;
  Q.QC4 = C4;
  Q.QAns = CorrectText;
  Q.QScore = Score;
  Q.QLevel = Level;

  if (IsFinalizing) {
    finalizeExamProcess();
  } else {
    EditIndex++;
    renderEditorUI();
  }
};

const navigateOnly = (Index) => {
  EditIndex = Index;
  renderEditorUI();
};

const handleQuestionImageUpload = (Input) => {
  if (Input.files && Input.files[0]) {
    const Reader = new FileReader();
    Reader.onload = (E) => {
      const Base64 = E.target.result;
      ExamQuestions[EditIndex].QImage = Base64;

      const PreviewDiv = document.getElementById("q-image-preview");
      const Img = PreviewDiv.querySelector("img");
      Img.src = Base64;
      PreviewDiv.classList.remove("hidden");
    };
    Reader.readAsDataURL(Input.files[0]);
  }
};

const removeQuestionImage = () => {
  ExamQuestions[EditIndex].QImage = "";
  const PreviewDiv = document.getElementById("q-image-preview");
  PreviewDiv.classList.add("hidden");
  PreviewDiv.querySelector("img").src = "";

  const FileInput = document.querySelector('input[type="file"]');
  if (FileInput) FileInput.value = "";
};
