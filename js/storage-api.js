const StorageAPI = {
  // 1. Get all students from users list
  getStudents: () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    return users.filter((u) => u.Role === "Student" || u.Role === 0); // Assuming 0 is student role
  },

  // 2. Save/Update Exam with Versioning
  saveExam: (examData) => {
    let exams = JSON.parse(localStorage.getItem("exams") || "[]");
    let existingExamIndex = exams.findIndex((e) => e.id === examData.id);

    if (existingExamIndex > -1) {
      // New Version Logic
      let existingExam = exams[existingExamIndex];
      const newVersionId = existingExam.currentVersion + 1;

      existingExam.currentVersion = newVersionId;
      existingExam.title = examData.title;
      existingExam.duration = examData.duration;
      existingExam.versions.push({
        versionId: newVersionId,
        createdAt: new Date().toISOString(),
        questions: examData.questions,
      });
      exams[existingExamIndex] = existingExam;
    } else {
      // Brand New Exam
      const newExam = {
        id: examData.id || Date.now().toString(),
        title: examData.title,
        teacherId: JSON.parse(localStorage.getItem("currentUser")).id,
        duration: examData.duration,
        currentVersion: 1,
        versions: [
          {
            versionId: 1,
            createdAt: new Date().toISOString(),
            questions: examData.questions,
          },
        ],
      };
      exams.push(newExam);
    }
    localStorage.setItem("exams", JSON.stringify(exams));
    return examData.id;
  },

  // 3. Assign Exam to specific students
  assignExam: (examId, versionId, studentIds) => {
    let assignments = JSON.parse(localStorage.getItem("AssignedExams") || "[]");

    const newAssignment = {
      assignmentId: Date.now().toString(),
      examId: examId,
      versionId: versionId,
      studentIds: studentIds,
      dateAssigned: new Date().toLocaleDateString(),
    };

    assignments.push(newAssignment);
    localStorage.setItem("AssignedExams", JSON.stringify(assignments));
  },

  // 4. Save Question Image to IndexedDB
  saveQuestionImage: (id, base64) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UserAssets", 3);
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("questionImages", "readwrite");
        const store = tx.objectStore("questionImages");
        store.put({ id: id, image: base64 });
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // 5. Get Question Image from IndexedDB
  getQuestionImage: (id) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UserAssets", 3);
      request.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("questionImages")) {
          resolve(null);
          return;
        }
        const tx = db.transaction("questionImages", "readonly");
        const store = tx.objectStore("questionImages");
        const getReq = store.get(id);
        getReq.onsuccess = () => resolve(getReq.result ? getReq.result.image : null);
        getReq.onerror = () => reject(getReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
};
