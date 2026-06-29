const STORAGE_KEY = "yc_vocab_v10b";

let cellData = [];
let zhuyinMap = {};
let polyphoneMap = {};
let editingIndex = null;

document.getElementById("app").innerHTML = `
<div class="panel">
  <h2>生字簿設定</h2>

  <label>輸入詞語或句子</label>
  <textarea id="words" rows="5">黃狗 公雞 經過 奇怪 山羊 鴨子 信用 錯誤 眼睛 仔細</textarea>

  <label>本課生字</label>
  <textarea id="lessonChars" rows="3" placeholder="例如：狗 雞 經 怪 羊 鴨 信 錯 睛 仔">狗 雞 經 怪 羊 鴨 信 錯 睛 仔</textarea>

  <button class="green" onclick="applyLessonChars()">套用生字</button>

  <label>預設顯示模式</label>
  <select id="defaultMode">
    <option value="both" selected>國字＋注音</option>
    <option value="zhuyinOnly">只顯示注音</option>
    <option value="charOnly">只顯示國字</option>
    <option value="trace">描字／描紅</option>
    <option value="blank">空白</option>
  </select>

  <label>字體顏色</label>
  <input type="color" id="fontColor" value="#111827">

  <label>描字深淺</label>
  <input type="range" id="opacity" min="0.1" max="1" step="0.1" value="0.25">

  <button onclick="generateBook()">產生生字簿</button>
  <button id="btnLoadLesson" onclick="loadCurrentLesson()">📚 使用目前教材</button>
  <button class="green" onclick="generateBlank()">空白生字簿</button>
  <button onclick="saveWork()">儲存作業</button>
  <button onclick="loadWork()">讀取作業</button>
  <button class="danger" onclick="clearWork()">清除本機記憶</button>
  <button class="secondary" onclick="window.print()">列印／PDF</button>

  <p>
    V10-B：可輸入「本課生字」，按「套用生字」後，生字會自動變成只顯示注音，其餘字保留國字＋注音。<br>
    點格切換：全 → 音 → 字 → 描 → 空。雙擊格子可選破音字。
  </p>
</div>

<div class="panel">
  <h2>生字管理表</h2>
  <div id="charManager">請先產生生字簿。</div>
</div>

<div class="paper-wrap">
  <div id="preview"></div>
</div>

<div id="zhuyinModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;">
  <div style="background:white;border-radius:14px;padding:20px;width:min(90vw,380px);box-shadow:0 8px 30px rgba(0,0,0,.25);">
    <h3 id="modalTitle">選擇注音</h3>
    <div id="modalOptions"></div>
    <button class="green" onclick="customZhuyin()">自訂注音</button>
    <button class="secondary" onclick="closeZhuyinModal()">取消</button>
  </div>
</div>
`;

async function loadZhuyinData(){
  try{
    const res = await fetch("data/knowledge/chinese/zhuyin.json");
    zhuyinMap = await res.json();

    polyphoneMap = {};
    Object.keys(zhuyinMap).forEach(ch=>{
      if(Array.isArray(zhuyinMap[ch])){
        polyphoneMap[ch] = zhuyinMap[ch];
      }
    });
  }catch(e){
    alert("注音資料庫讀取失敗，請檢查 data/knowledge/chinese/zhuyin.json");
    console.error(e);
  }

  loadWork();
}

function cleanText(text){
  return text.replace(/[，,、。！？；：「」『』（）()《》〈〉\n\r\t\s]/g,"");
}

function parseChars(text){
  return text.replace(/[，,、。！？；：「」『』（）()《》〈〉\n\r\t\s]/g,"").split("");
}

function getZhuyin(ch){
  const value = zhuyinMap[ch];

  if(Array.isArray(value)){
    return value[0] || "";
  }

  return value || "";
}

function splitZhuyin(z){
  const tones = ["ˊ","ˇ","ˋ","˙"];
  let tone = "";
  let base = z || "";

  tones.forEach(t=>{
    if(base.includes(t)){
      tone = t;
      base = base.replace(t,"");
    }
  });

  return {base,tone};
}

function generateBook(){
  const text = cleanText(document.getElementById("words").value);
  const mode = document.getElementById("defaultMode").value;

  cellData = [...text].map(ch=>({
    char:ch,
    zhuyin:getZhuyin(ch),
    mode:mode
  }));

  render();
}

function applyLessonChars(){
  if(!cellData.length){
    generateBook();
  }

  const lessonChars = parseChars(document.getElementById("lessonChars").value);

  if(lessonChars.length === 0){
    alert("請先輸入本課生字");
    return;
  }

  cellData.forEach(item=>{
    if(!item.char) return;

    if(lessonChars.includes(item.char)){
      item.mode = "zhuyinOnly";
    }else{
      item.mode = "both";
    }
  });

  render();
}

function generateBlank(){
  cellData = Array.from({length:100},()=>({
    char:"",
    zhuyin:"",
    mode:"blank"
  }));

  render();
}

function render(){
  renderBook();
  renderManager();
  saveWork(false);
}

function renderBook(){
  let html = "";
  const pageCount = Math.max(1,Math.ceil(cellData.length / 100));

  for(let p=0;p<pageCount;p++){
    html += `<div class="page"><div class="grid">`;

    const page = cellData.slice(p*100,p*100+100);
    let dataIndex = 0;

    for(let col=10;col>=1;col--){
      for(let row=1;row<=10;row++){
        const globalIndex = p*100 + dataIndex;
        html += cell(page[dataIndex],globalIndex,row,col);
        dataIndex++;
      }
    }

    html += `</div></div>`;
  }

  document.getElementById("preview").innerHTML = html;
}

function cell(item,index,row,col){
  if(!item){
    item = {char:"",zhuyin:"",mode:"blank"};
  }

  const showChar =
    item.mode === "both" ||
    item.mode === "charOnly" ||
    item.mode === "trace";

  const showZ =
    item.mode === "both" ||
    item.mode === "zhuyinOnly" ||
    item.mode === "trace";

  const tag =
    item.mode === "both" ? "全" :
    item.mode === "zhuyinOnly" ? "音" :
    item.mode === "charOnly" ? "字" :
    item.mode === "trace" ? "描" : "空";

  const color = document.getElementById("fontColor")?.value || "#111827";
  const opacity = item.mode === "trace"
    ? (document.getElementById("opacity")?.value || "0.25")
    : "1";

  const zh = splitZhuyin(showZ ? item.zhuyin : "");

  return `
    <div class="word-cell"
      style="grid-row:${row};grid-column:${col};"
      onclick="toggle(${index})"
      ondblclick="openZhuyinModal(${index})">

      <div class="char-grid">
        <div class="diag1"></div>
        <div class="diag2"></div>

        <div class="char-text"
          style="${showChar ? `color:${color};opacity:${opacity};` : "color:transparent;"}">
          ${item.char}
        </div>

        <div class="status">${tag}</div>
      </div>

      <div class="zhuyin-grid">
        ${renderZhuyin(zh.base,zh.tone)}
      </div>
    </div>
  `;
}

function renderZhuyin(base,tone){
  const chars = [...(base || "")];

  if(chars.length === 0){
    return "";
  }

  let pos = [];

  if(chars.length === 1){
    pos = [58];
  }else if(chars.length === 2){
    pos = [35,70];
  }else{
    pos = [22,50,78];
  }

  let html = `<div class="z-base">`;

  chars.forEach((ch,i)=>{
    html += `<span class="zhuyin-symbol" style="top:${pos[i]}%">${ch}</span>`;
  });

  if(tone){
    const toneTop = chars.length === 1 ? 28 : pos[chars.length-1] - 8;
    html += `<span class="tone-mark" style="top:${toneTop}%">${tone}</span>`;
  }

  html += `</div>`;
  return html;
}

function renderManager(){
  const box = document.getElementById("charManager");

  if(!cellData.length){
    box.innerHTML = "請先產生生字簿。";
    return;
  }

  let html = `
    <div style="overflow:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #ddd;padding:6px;">序</th>
            <th style="border:1px solid #ddd;padding:6px;">字</th>
            <th style="border:1px solid #ddd;padding:6px;">注音</th>
            <th style="border:1px solid #ddd;padding:6px;">顯示方式</th>
          </tr>
        </thead>
        <tbody>
  `;

  cellData.forEach((item,index)=>{
    if(!item.char) return;

    html += `
      <tr>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${index+1}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;font-size:22px;">${item.char}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">
          <button onclick="openZhuyinModal(${index})" style="padding:6px 10px;margin:0;">
            ${item.zhuyin || "設定"}
          </button>
        </td>
        <td style="border:1px solid #ddd;padding:6px;">
          <select onchange="setMode(${index},this.value)" style="width:100%;">
            <option value="both" ${item.mode==="both" ? "selected" : ""}>國字＋注音</option>
            <option value="zhuyinOnly" ${item.mode==="zhuyinOnly" ? "selected" : ""}>只顯示注音</option>
            <option value="charOnly" ${item.mode==="charOnly" ? "selected" : ""}>只顯示國字</option>
            <option value="trace" ${item.mode==="trace" ? "selected" : ""}>描字／描紅</option>
            <option value="blank" ${item.mode==="blank" ? "selected" : ""}>空白</option>
          </select>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  box.innerHTML = html;
}

function setMode(index,mode){
  if(!cellData[index]) return;
  cellData[index].mode = mode;
  render();
}

function toggle(index){
  if(!cellData[index]) return;

  const order = ["both","zhuyinOnly","charOnly","trace","blank"];
  const current = cellData[index].mode || "both";
  const next = order[(order.indexOf(current)+1) % order.length];

  cellData[index].mode = next;
  render();
}

function openZhuyinModal(index){
  editingIndex = index;
  const item = cellData[index];
  if(!item) return;

  const options = polyphoneMap[item.char] || [item.zhuyin || ""];

  document.getElementById("modalTitle").textContent = `選擇「${item.char}」的注音`;

  let html = "";
  options.filter(Boolean).forEach(z=>{
    html += `<button onclick="chooseZhuyin('${z}')">${z}</button>`;
  });

  if(!html){
    html = `<p>目前沒有備選音，可使用自訂注音。</p>`;
  }

  document.getElementById("modalOptions").innerHTML = html;
  document.getElementById("zhuyinModal").style.display = "flex";
}

function chooseZhuyin(z){
  if(editingIndex !== null && cellData[editingIndex]){
    cellData[editingIndex].zhuyin = z;
    render();
  }

  closeZhuyinModal();
}

function customZhuyin(){
  if(editingIndex === null) return;

  const now = cellData[editingIndex]?.zhuyin || "";
  const z = prompt("請輸入自訂注音：", now);

  if(z !== null){
    chooseZhuyin(z.trim());
  }
}

function closeZhuyinModal(){
  document.getElementById("zhuyinModal").style.display = "none";
  editingIndex = null;
}

function saveWork(showAlert=true){
  localStorage.setItem(STORAGE_KEY,JSON.stringify({
    words:document.getElementById("words").value,
    lessonChars:document.getElementById("lessonChars").value,
    mode:document.getElementById("defaultMode").value,
    fontColor:document.getElementById("fontColor").value,
    opacity:document.getElementById("opacity").value,
    cellData:cellData
  }));

  if(showAlert){
    alert("已儲存在本機");
  }
}

function loadWork(){
  const raw = localStorage.getItem(STORAGE_KEY);

  if(!raw){
    generateBook();
    return;
  }

  try{
    const data = JSON.parse(raw);

    document.getElementById("words").value =
      data.words || "黃狗 公雞 經過 奇怪 山羊 鴨子 信用 錯誤 眼睛 仔細";

    document.getElementById("lessonChars").value =
      data.lessonChars || "狗 雞 經 怪 羊 鴨 信 錯 睛 仔";

    document.getElementById("defaultMode").value = data.mode || "both";
    document.getElementById("fontColor").value = data.fontColor || "#111827";
    document.getElementById("opacity").value = data.opacity || "0.25";

    cellData = Array.isArray(data.cellData) ? data.cellData : [];

    if(cellData.length === 0){
      generateBook();
    }else{
      render();
    }
  }catch(e){
    generateBook();
  }
}

function clearWork(){
  if(confirm("確定清除此裝置記憶？")){
    localStorage.removeItem(STORAGE_KEY);

    document.getElementById("words").value =
      "黃狗 公雞 經過 奇怪 山羊 鴨子 信用 錯誤 眼睛 仔細";

    document.getElementById("lessonChars").value =
      "狗 雞 經 怪 羊 鴨 信 錯 睛 仔";

    document.getElementById("defaultMode").value = "both";
    document.getElementById("fontColor").value = "#111827";
    document.getElementById("opacity").value = "0.25";

    generateBook();
  }
}

document.addEventListener("input",function(e){
  if(e.target.id === "fontColor" || e.target.id === "opacity"){
    render();
  }
});

loadZhuyinData();
function loadCurrentLesson(){

    const key = localStorage.getItem("YC_LAST_LESSON_KEY");

    if(!key){
        alert("請先到教材清單選擇教材。");
        return;
    }

    const raw = localStorage.getItem(key);

    if(!raw){
        alert("找不到教材資料。");
        return;
    }

    const lesson = JSON.parse(raw);

    // ① 將教材課文放入「輸入詞語或句子」
    document.getElementById("words").value =
        lesson.text || "";

    // ② 將教材生字放入「本課生字」
    if(Array.isArray(lesson.newWords)){
        document.getElementById("lessonChars").value =
            lesson.newWords.join(" ");
    }else{
        document.getElementById("lessonChars").value = "";
    }

    // ③ 自動重新產生生字簿
    generateBook();

    // ④ 自動套用本課生字
    applyLessonChars();

    alert("已載入教材：\n" + (lesson.title || "未命名教材"));

}
