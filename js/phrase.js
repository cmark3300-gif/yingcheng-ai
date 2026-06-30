// ===============================
// YC-AI 語詞中心 v1.1
// ===============================

let lesson = null;

document.addEventListener("DOMContentLoaded", () => {
    loadCurrentLesson();
});

function loadCurrentLesson() {

    const key = localStorage.getItem("YC_LAST_LESSON_KEY");

    if (!key) {
        alert("請先由教材工作台進入語詞中心。");
        return;
    }

    const raw = localStorage.getItem(key);

    if (!raw) {
        alert("找不到教材資料。");
        return;
    }

    lesson = JSON.parse(raw);

    showLessonInfo();
    showPhraseList();
}

// 顯示教材資訊
function showLessonInfo(){

    const h2 = document.querySelector(".panel h2");

    if(h2){
        h2.textContent = "教材資訊｜" + (lesson.title || "未命名教材");
    }

}

// 顯示語詞
function showPhraseList(){

    const box = document.getElementById("phraseList");

    if(!box) return;

    if(!lesson.phrases || lesson.phrases.length===0){
        box.innerHTML = "<p>本教材沒有語詞。</p>";
        return;
    }

    let html = "";

    lesson.phrases.forEach((p,index)=>{
        html += `
        <label class="option">
          <input type="checkbox" class="phraseCheck" value="${p}" checked>
          ${p}
        </label>
        `;
    });

    box.innerHTML = html;
}