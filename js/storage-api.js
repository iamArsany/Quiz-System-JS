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

    studentIds.forEach((sid) => {
      const newAssignment = {
        assignmentId: `assign_${Date.now()}_${sid}`,
        examId: examId,
        versionId: versionId,
        studentId: sid,
        status: "Pending",
        dateAssigned: new Date().toLocaleDateString(),
      };
      assignments.push(newAssignment);
    });

    localStorage.setItem("AssignedExams", JSON.stringify(assignments));
  },

  // 4. Save Question Image to IndexedDB
  saveQuestionImage: (id, base64) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UserAssets", 4);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains("questionImages")) {
          db.createObjectStore("questionImages", { keyPath: "id" });
        }
      };

      request.onsuccess = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains("questionImages")) {
          db.close();
          reject("Object store questionImages does not exist");
          return;
        }

        const tx = db.transaction("questionImages", "readwrite");
        const store = tx.objectStore("questionImages");

        const putReq = store.put({ id, image: base64 });

        putReq.onsuccess = () => resolve(id);
        putReq.onerror = () => reject(putReq.error);

        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };

      request.onerror = () => reject(request.error);
    });
  },

  // 5. Get Question Image from IndexedDB
  getQuestionImage: (id) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("UserAssets", 4);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("questionImages")) {
          db.createObjectStore("questionImages", { keyPath: "id" });
        }
      };

      request.onsuccess = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains("questionImages")) {
          db.close();
          resolve(null);
          return;
        }

        const tx = db.transaction("questionImages", "readonly");
        const store = tx.objectStore("questionImages");
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          resolve(getReq.result ? getReq.result.image : null);
        };

        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => db.close();
      };

      request.onerror = () => reject(request.error);
    });
  },

  // 6. Get Student Assignments
  getStudentAssignments: (studentId) => {
    const assignments = JSON.parse(
      localStorage.getItem("AssignedExams") || "[]",
    );
    const exams = JSON.parse(localStorage.getItem("exams") || "[]");

    // Find assignments for this student (Handle String/Number mismatch)
    const myAssignments = assignments.filter(
      (a) => String(a.studentId) === String(studentId),
    );

    // Map to exam details
    return myAssignments
      .map((a) => {
        const exam = exams.find((e) => e.id === a.examId);
        if (!exam) return null;

        // Get specific version
        const version = exam.versions.find((v) => v.versionId === a.versionId);
        if (!version) return null;

        return {
          assignmentId: a.assignmentId,
          examId: exam.id,
          title: exam.title,
          duration: exam.duration,
          questions: version.questions,
          versionId: a.versionId,
          status: a.status,
        };
      })
      .filter((e) => e !== null);
  },

  // 7. Update Assignment Status
  updateAssignmentStatus: (assignmentId, status) => {
    let assignments = JSON.parse(localStorage.getItem("AssignedExams") || "[]");
    const index = assignments.findIndex((a) => a.assignmentId === assignmentId);
    if (index > -1) {
      assignments[index].status = status;
      localStorage.setItem("AssignedExams", JSON.stringify(assignments));
    }
  },

  // 7. Save Exam Result
  saveExamResult: (result) => {
    const results = JSON.parse(localStorage.getItem("ExamResults") || "[]");
    results.push(result);
    localStorage.setItem("ExamResults", JSON.stringify(results));
  },

  // 8. Get Student Results
  getStudentResults: (studentId) => {
    const results = JSON.parse(localStorage.getItem("ExamResults") || "[]");
    return results.filter((r) => r.studentId === studentId);
  },
};
