// ==================== BASE URLS ====================
const BASE = "http://localhost:8080/api";
const STUDENT_URL    = BASE + "/student";
const MARKS_URL      = BASE + "/marks";
const FEES_URL       = BASE + "/fees";
const ATTENDANCE_URL = BASE + "/attendance";

// ==================== AUTH HELPERS ====================
function getToken() {
    return localStorage.getItem("sms_token");
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

function checkAuth() {
    if (!getToken()) {
        window.location.href = "login.html";
    }
}

// Call on every page load
checkAuth();

function logout() {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_user");
    window.location.href = "login.html";
}

// ==================== HELPERS ====================
function $(id) { return document.getElementById(id); }

function toast(msg, type = "success") {
    let el = document.getElementById("toast");
    if (!el) {
        el = document.createElement("div");
        el.id = "toast";
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = "toast " + type;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 3000);
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function statusBadge(status) {
    const map = {
        PAID: "badge-green", PENDING: "badge-yellow", OVERDUE: "badge-red",
        PRESENT: "badge-green", ABSENT: "badge-red", LATE: "badge-yellow"
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

// ==================== THEME TOGGLE ====================
const themeBtn = document.getElementById("theme");
if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        themeBtn.textContent = isDark ? "☀️" : "🌙";
    });
    window.addEventListener("load", () => {
        if (localStorage.getItem("theme") === "dark") {
            document.body.classList.add("dark");
            themeBtn.textContent = "☀️";
        }
    });
}

// ==================== STUDENTS ====================
function getStudent() {
    const tbody = $("Student-details");
    if (!tbody) return;
    fetch(STUDENT_URL + "/find", { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => {
            if (!data) return;
            const count = $("totalcount");
            if (count) count.textContent = data.length;
            if (!data.length) {
                tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-icon">📭</div><p>No students found. <a href="add.html">Add one?</a></p></div></td></tr>`;
                return;
            }
            tbody.innerHTML = data.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${s.registerNumber}</td>
                    <td>${s.name}</td>
                    <td>${s.department}</td>
                    <td>${s.yrs}</td>
                    <td>${s.dateOfBirth || '-'}</td>
                    <td>${s.bloodGroup || '-'}</td>
                    <td>${s.email}</td>
                    <td>${s.mobile}</td>
                    <td>${s.address || '-'}</td>
                    <td>${s.guardianName || '-'}</td>
                    <td>${s.id}</td>
                    <td><button class="edit-btn" onclick="openStudentEdit(${s.id},'${s.registerNumber}','${s.name}','${s.department}','${s.yrs}','${s.dateOfBirth||''}','${s.bloodGroup||''}','${s.email}','${s.mobile}','${(s.address||'').replace(/'/g,"\\'")}','${(s.guardianName||'').replace(/'/g,"\\'")}')">Edit</button></td>
                    <td><button class="delete-btn" onclick="deleteStudent(${s.id})">Delete</button></td>
                </tr>`).join("");
        })
        .catch(() => {
            if (tbody) tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not connect to server.</p></div></td></tr>`;
        });
}

function deleteStudent(id) {
    if (!confirm("Delete this student? This will also remove their marks, fees, and attendance.")) return;
    fetch(STUDENT_URL + "/delete/" + id, { method: "DELETE", headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } toast("Student deleted ✓"); getStudent(); })
        .catch(() => toast("Delete failed!", "error"));
}

function openStudentEdit(id, regNo, name, dept, yrs, dob, blood, email, mobile, address, guardian) {
    document.querySelector(".update-form").style.display = "flex";
    editId = id;
    $("up-registerNumber").value  = regNo;
    $("up-studentName").value     = name;
    $("up-department").value      = dept;
    $("up-years").value           = yrs;
    $("up-dob").value             = dob;
    $("up-bloodGroup").value      = blood;
    $("up-email").value           = email;
    $("up-mobileNo").value        = mobile;
    $("up-address").value         = address;
    $("up-guardianName").value    = guardian;
}

let editId = null;

const updateForm = $("update-form");
if (updateForm) {
    updateForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            registerNumber: $("up-registerNumber").value,
            name:           $("up-studentName").value,
            department:     $("up-department").value,
            yrs:            $("up-years").value,
            dateOfBirth:    $("up-dob").value,
            bloodGroup:     $("up-bloodGroup").value,
            email:          $("up-email").value,
            mobile:         $("up-mobileNo").value,
            address:        $("up-address").value,
            guardianName:   $("up-guardianName").value,
        };
        fetch(STUDENT_URL + "/update/" + editId, {
            method: "PUT", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => {
            if (!data) return;
            toast("Student updated ✓");
            document.querySelector(".update-form").style.display = "none";
            getStudent();
        })
        .catch(() => toast("Update failed!", "error"));
    });
}

const cancelBtn = $("cancel-btn");
if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
        document.querySelector(".update-form").style.display = "none";
    });
}

// ADD STUDENT
const addForm = $("add-student-form");
if (addForm) {
    addForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            registerNumber: $("registerNumber").value,
            name:           $("studentName").value,
            department:     $("department").value,
            yrs:            $("years").value,
            dateOfBirth:    $("dateOfBirth").value,
            bloodGroup:     $("bloodGroup").value,
            email:          $("email").value,
            mobile:         $("mobileNo").value,
            address:        $("address").value,
            guardianName:   $("guardianName").value,
        };
        fetch(STUDENT_URL + "/create", {
            method: "POST", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => {
            if (!data) return;
            toast("Student added ✓");
            addForm.reset();
            setTimeout(() => window.location.href = "index.html", 1000);
        })
        .catch(() => toast("Failed to add student!", "error"));
    });
}

// SEARCH
const searchBtn = $("Searchbtn");
const searchInput = $("searchInput");
if (searchBtn && searchInput) {
    function triggerSearch() {
        const type  = $("searchType").value;
        const value = searchInput.value.trim();
        if (!value) { alert("Enter a search value!"); return; }

        const urls = {
            id:             STUDENT_URL + "/findbyid/" + value,
            name:           STUDENT_URL + "/findbyname/" + value,
            registerNumber: STUDENT_URL + "/findByRegisterNumber/" + value,
            department:     STUDENT_URL + "/findbydepartment/" + value,
        };

        const resultBox = $("Search-results");
        fetch(urls[type], { headers: authHeaders() })
            .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
            .then(data => {
                if (!data) return;
                if (!data || (Array.isArray(data) && !data.length)) {
                    resultBox.innerHTML = "<p>No student found!</p>";
                } else {
                    const arr = Array.isArray(data) ? data : [data];
                    resultBox.innerHTML = `<table><thead><tr><th>S.No</th><th>Reg No</th><th>Name</th><th>Dept</th><th>Year</th><th>Email</th><th>Mobile</th></tr></thead><tbody>
                        ${arr.map((s,i) => `<tr><td>${i+1}</td><td>${s.registerNumber}</td><td>${s.name}</td><td>${s.department}</td><td>${s.yrs}</td><td>${s.email}</td><td>${s.mobile}</td></tr>`).join("")}
                    </tbody></table>`;
                }
                resultBox.style.display = "block";
                setTimeout(() => { resultBox.style.display = "none"; resultBox.innerHTML = ""; }, 10000);
            })
            .catch(() => {
                resultBox.innerHTML = "<p>No student found!</p>";
                resultBox.style.display = "block";
                setTimeout(() => { resultBox.style.display = "none"; resultBox.innerHTML = ""; }, 3000);
            });
    }
    searchBtn.addEventListener("click", triggerSearch);
    searchInput.addEventListener("keyup", e => { if (e.key === "Enter") triggerSearch(); });
}

// Init student page
if ($("Student-details")) getStudent();

// ==================== MARKS ====================
function loadAllMarks() {
    const tbody = $("marks-tbody");
    if (!tbody) return;
    fetch(MARKS_URL + "/find", { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) renderMarks(data, tbody); })
        .catch(() => { tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not connect.</p></div></td></tr>`; });
}

function renderMarks(data, tbody) {
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">📝</div><p>No marks found.</p></div></td></tr>`; return; }
    tbody.innerHTML = data.map((m, i) => {
        const pct = m.totalMark ? ((m.mark / m.totalMark) * 100).toFixed(1) + "%" : "-";
        return `<tr>
            <td>${i+1}</td>
            <td>${m.student ? m.student.id : '-'}</td>
            <td>${m.student ? m.student.name : '-'}</td>
            <td>${m.subject}</td>
            <td>${m.mark}</td>
            <td>${m.totalMark}</td>
            <td>${pct}</td>
            <td>${m.examDate || '-'}</td>
            <td><button class="edit-btn" onclick="openMarksEdit(${m.id},'${m.subject}',${m.mark},${m.totalMark},'${m.examDate||''}')">Edit</button></td>
            <td><button class="delete-btn" onclick="deleteMarks(${m.id})">Delete</button></td>
        </tr>`;
    }).join("");
}

function filterMarks() {
    const sid     = $("filter-studentId").value.trim();
    const subject = $("filter-subject").value.trim();
    let url = MARKS_URL + "/find";
    if (sid && subject)  url = MARKS_URL + "/findbystudentandsubject/" + sid + "/" + subject;
    else if (sid)        url = MARKS_URL + "/findbystudent/" + sid;
    else if (subject)    url = MARKS_URL + "/findbysubject/" + subject;

    fetch(url, { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) renderMarks(Array.isArray(data) ? data : [data], $("marks-tbody")); })
        .catch(() => { $("marks-tbody").innerHTML = `<tr><td colspan="10"><div class="empty-state"><p>No results found.</p></div></td></tr>`; });
}

let editMarksId = null;
function openMarksEdit(id, subject, mark, totalMark, examDate) {
    editMarksId = id;
    $("um-subject").value   = subject;
    $("um-mark").value      = mark;
    $("um-totalMark").value = totalMark;
    $("um-examDate").value  = examDate;
    $("marks-modal").style.display = "flex";
}

function deleteMarks(id) {
    if (!confirm("Delete this marks record?")) return;
    fetch(MARKS_URL + "/delete/" + id, { method: "DELETE", headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } toast("Marks deleted ✓"); loadAllMarks(); })
        .catch(() => toast("Delete failed!", "error"));
}

const addMarksForm = $("add-marks-form");
if (addMarksForm) {
    addMarksForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            student:    { id: parseInt($("marks-studentId").value) },
            subject:    $("marks-subject").value,
            mark:       parseFloat($("marks-mark").value),
            totalMark:  parseFloat($("marks-totalMark").value),
            examDate:   $("marks-examDate").value,
        };
        fetch(MARKS_URL + "/create", {
            method: "POST", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) { toast("Marks added ✓"); addMarksForm.reset(); loadAllMarks(); } })
        .catch(() => toast("Failed to add marks!", "error"));
    });
    loadAllMarks();
}

const updateMarksForm = $("update-marks-form");
if (updateMarksForm) {
    updateMarksForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            subject:   $("um-subject").value,
            mark:      parseFloat($("um-mark").value),
            totalMark: parseFloat($("um-totalMark").value),
            examDate:  $("um-examDate").value,
        };
        fetch(MARKS_URL + "/update/" + editMarksId, {
            method: "PUT", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) { toast("Marks updated ✓"); closeModal("marks-modal"); loadAllMarks(); } })
        .catch(() => toast("Update failed!", "error"));
    });
}

// ==================== FEES ====================
function loadAllFees() {
    const tbody = $("fees-tbody");
    if (!tbody) return;
    fetch(FEES_URL + "/find", { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) renderFees(data, tbody); })
        .catch(() => { tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not connect.</p></div></td></tr>`; });
}

function renderFees(data, tbody) {
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">💰</div><p>No fee records found.</p></div></td></tr>`; return; }
    tbody.innerHTML = data.map((f, i) => `
        <tr>
            <td>${i+1}</td>
            <td>${f.id}</td>
            <td>${f.student ? f.student.id : '-'}</td>
            <td>${f.student ? f.student.name : '-'}</td>
            <td>₹${f.amount.toLocaleString()}</td>
            <td>${f.dueDate || '-'}</td>
            <td>${f.paidDate || '-'}</td>
            <td>${statusBadge(f.status)}</td>
            <td><button class="edit-btn" onclick="openFeesEdit(${f.id},${f.amount},'${f.dueDate||''}','${f.paidDate||''}','${f.status}')">Edit</button></td>
            <td><button class="delete-btn" onclick="deleteFees(${f.id})">Delete</button></td>
        </tr>`).join("");
}

function filterFees() {
    const sid    = $("filter-fees-studentId").value.trim();
    const status = $("filter-fees-status").value;
    let url = FEES_URL + "/find";
    if (sid && status) url = FEES_URL + "/findbystudentandstatus/" + sid + "/" + status;
    else if (sid)      url = FEES_URL + "/findbystudent/" + sid;
    else if (status)   url = FEES_URL + "/findbystatus/" + status;

    fetch(url, { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) renderFees(Array.isArray(data) ? data : [data], $("fees-tbody")); })
        .catch(() => { $("fees-tbody").innerHTML = `<tr><td colspan="10"><div class="empty-state"><p>No results found.</p></div></td></tr>`; });
}

let editFeesId = null;
function openFeesEdit(id, amount, dueDate, paidDate, status) {
    editFeesId = id;
    $("uf-amount").value   = amount;
    $("uf-dueDate").value  = dueDate;
    $("uf-paidDate").value = paidDate;
    $("uf-status").value   = status;
    $("fees-modal").style.display = "flex";
}

function deleteFees(id) {
    if (!confirm("Delete this fee record?")) return;
    fetch(FEES_URL + "/delete/" + id, { method: "DELETE", headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } toast("Fee record deleted ✓"); loadAllFees(); })
        .catch(() => toast("Delete failed!", "error"));
}

const addFeesForm = $("add-fees-form");
if (addFeesForm) {
    addFeesForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            student:  { id: parseInt($("fees-studentId").value) },
            amount:   parseFloat($("fees-amount").value),
            dueDate:  $("fees-dueDate").value,
            paidDate: $("fees-paidDate").value || null,
            status:   $("fees-status").value,
        };
        fetch(FEES_URL + "/create", {
            method: "POST", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) { toast("Fee record added ✓"); addFeesForm.reset(); loadAllFees(); } })
        .catch(() => toast("Failed to add fee record!", "error"));
    });
    loadAllFees();
}

const updateFeesForm = $("update-fees-form");
if (updateFeesForm) {
    updateFeesForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            amount:   parseFloat($("uf-amount").value),
            dueDate:  $("uf-dueDate").value,
            paidDate: $("uf-paidDate").value || null,
            status:   $("uf-status").value,
        };
        fetch(FEES_URL + "/update/" + editFeesId, {
            method: "PUT", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) { toast("Fee record updated ✓"); closeModal("fees-modal"); loadAllFees(); } })
        .catch(() => toast("Update failed!", "error"));
    });
}

// ==================== ATTENDANCE ====================
function loadAllAttendance() {
    const tbody = $("att-tbody");
    if (!tbody) return;
    fetch(ATTENDANCE_URL + "/find", { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) renderAttendance(data, tbody); })
        .catch(() => { tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not connect.</p></div></td></tr>`; });
}

function renderAttendance(data, tbody) {
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📅</div><p>No attendance records found.</p></div></td></tr>`; return; }
    tbody.innerHTML = data.map((a, i) => `
        <tr>
            <td>${i+1}</td>
            <td>${a.id}</td>
            <td>${a.student ? a.student.id : '-'}</td>
            <td>${a.student ? a.student.name : '-'}</td>
            <td>${a.date || '-'}</td>
            <td>${statusBadge(a.status)}</td>
            <td><button class="edit-btn" onclick="openAttEdit(${a.id},'${a.date||''}','${a.status}')">Edit</button></td>
            <td><button class="delete-btn" onclick="deleteAttendance(${a.id})">Delete</button></td>
        </tr>`).join("");
}

function filterAttendance() {
    const sid    = $("filter-att-studentId").value.trim();
    const date   = $("filter-att-date").value;
    const status = $("filter-att-status").value;

    let url = ATTENDANCE_URL + "/find";
    if (sid)         url = ATTENDANCE_URL + "/findbystudent/" + sid;
    else if (date)   url = ATTENDANCE_URL + "/findbydate/" + date;
    else if (status) url = ATTENDANCE_URL + "/findbystatus/" + status;

    fetch(url, { headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) renderAttendance(Array.isArray(data) ? data : [data], $("att-tbody")); })
        .catch(() => { $("att-tbody").innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>No results found.</p></div></td></tr>`; });
}

let editAttId = null;
function openAttEdit(id, date, status) {
    editAttId = id;
    $("ua-date").value   = date;
    $("ua-status").value = status;
    $("att-modal").style.display = "flex";
}

function deleteAttendance(id) {
    if (!confirm("Delete this attendance record?")) return;
    fetch(ATTENDANCE_URL + "/delete/" + id, { method: "DELETE", headers: authHeaders() })
        .then(r => { if (r.status === 401) { logout(); return; } toast("Attendance deleted ✓"); loadAllAttendance(); })
        .catch(() => toast("Delete failed!", "error"));
}

const addAttForm = $("add-attendance-form");
if (addAttForm) {
    addAttForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            student: { id: parseInt($("att-studentId").value) },
            date:    $("att-date").value,
            status:  $("att-status").value,
        };
        fetch(ATTENDANCE_URL + "/create", {
            method: "POST", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) { toast("Attendance marked ✓"); addAttForm.reset(); loadAllAttendance(); } })
        .catch(() => toast("Failed to mark attendance!", "error"));
    });
    loadAllAttendance();
}

const updateAttForm = $("update-att-form");
if (updateAttForm) {
    updateAttForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const body = {
            date:   $("ua-date").value,
            status: $("ua-status").value,
        };
        fetch(ATTENDANCE_URL + "/update/" + editAttId, {
            method: "PUT", headers: authHeaders(), body: JSON.stringify(body)
        })
        .then(r => { if (r.status === 401) { logout(); return; } return r.ok ? r.json() : Promise.reject(); })
        .then(data => { if (data) { toast("Attendance updated ✓"); closeModal("att-modal"); loadAllAttendance(); } })
        .catch(() => toast("Update failed!", "error"));
    });
}