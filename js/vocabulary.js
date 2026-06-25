const STORAGE_KEY = "yc_vocab_v98";

let cellData = [];
let zhuyinMap = {};
let polyphoneMap = {};
let editingIndex = null;

document.getElementById("app").innerHTML = `
<div class="panel">
  <h2>生字簿設定</h2>

  <label>輸入詞語或句子</label>
  <textarea id="words" rows="5">黃狗 公雞 經過 奇怪 山羊 鴨子 信用 錯誤 眼睛 仔細</textarea>

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
  <button class="green" onclick="generateBlank()">空白生字簿</button>
  <button onclick="saveWork()">儲存作業</button>
  <button onclick="loadWork()">讀取作業</button>
  <button class="danger" onclick="clearWork()">清除本機記憶</button>
  <button class="secondary" onclick="window.print()">列印／PDF</button>

  <p>
    點格切換：全 → 音 → 字 → 描 → 空。<br>
    雙擊格子可選破音字。
  </p>
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
    const res = await fetch("data/zhuyin.json");
    zhuyinMap = await res.json();

    polyphoneMap = {};
    Object.keys(zhuyinMap).forEach(ch=>{
      if(Array.isArray(zhuyinMap[ch])){
        polyphoneMap[ch] = zhuyinMap[ch];
      }
    });

  }catch(e){
    alert("注音資料庫讀取失敗，請檢查 data/zhuyin.json");
    console.error(e);
  }

  loadWork();
}

function cleanText(text){
  return text.replace(/[，,、。！？；：「」『』（）()《》〈〉\n\r\t\s]/g,"");
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

function generateBlank(){
  cellData = Array.from({length:100},()=>({
    char:"",
    zhuyin:"",
    mode:"blank"
  }));

  render();
}

function render(){
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
  saveWork(false);
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
    words:document.getElementById
