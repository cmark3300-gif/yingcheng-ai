const STORAGE_KEY = "yc_vocab_v96";

let cellData = [];

const zhuyinMap = {
  "黃":"ㄏㄨㄤˊ","狗":"ㄍㄡˇ","公":"ㄍㄨㄥ","雞":"ㄐㄧ","經":"ㄐㄧㄥ","過":"ㄍㄨㄛˋ",
  "奇":"ㄑㄧˊ","怪":"ㄍㄨㄞˋ","山":"ㄕㄢ","羊":"ㄧㄤˊ","鴨":"ㄧㄚ","子":"ㄗˇ",
  "信":"ㄒㄧㄣˋ","用":"ㄩㄥˋ","錯":"ㄘㄨㄛˋ","誤":"ㄨˋ","眼":"ㄧㄢˇ","睛":"ㄐㄧㄥ",
  "仔":"ㄗˇ","細":"ㄒㄧˋ","不":"ㄅㄨˋ","可":"ㄎㄜˇ","以":"ㄧˇ",
  "物":"ㄨˋ","種":"ㄓㄨㄥˇ","聽":"ㄊㄧㄥ","覺":"ㄐㄩㄝˊ",
  "重":"ㄓㄨㄥˋ","行":"ㄒㄧㄥˊ","樂":"ㄩㄝˋ","長":"ㄔㄤˊ",
  "學":"ㄒㄩㄝˊ","校":"ㄒㄧㄠˋ","生":"ㄕㄥ","字":"ㄗˋ",
  "國":"ㄍㄨㄛˊ","語":"ㄩˇ","好":"ㄏㄠˇ","明":"ㄇㄧㄥˊ",
  "今":"ㄐㄧㄣ","天":"ㄊㄧㄢ","小":"ㄒㄧㄠˇ"
};

const polyphoneMap = {
  "重":["ㄓㄨㄥˋ","ㄔㄨㄥˊ"],
  "行":["ㄒㄧㄥˊ","ㄏㄤˊ"],
  "樂":["ㄌㄜˋ","ㄩㄝˋ"],
  "長":["ㄔㄤˊ","ㄓㄤˇ"],
  "種":["ㄓㄨㄥˇ","ㄓㄨㄥˋ"],
  "覺":["ㄐㄩㄝˊ","ㄐㄧㄠˋ"]
};

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

  <div class="row">
    <div style="flex:1;">
      <label>字體顏色</label>
      <input type="color" id="fontColor" value="#111827">
    </div>

    <div style="flex:2;">
      <label>描字深淺</label>
      <input type="range" id="opacity" min="0.1" max="1" step="0.1" value="0.25">
    </div>
  </div>

  <button onclick="generateBook()">產生生字簿</button>
  <button class="green" onclick="generateBlank()">空白生字簿</button>
  <button onclick="saveWork()">儲存作業</button>
  <button onclick="loadWork()">讀取作業</button>
  <button class="danger" onclick="clearWork()">清除本機記憶</button>
  <button class="secondary" onclick="window.print()">列印／PDF</button>

  <p>
    點格切換：全 → 音 → 字 → 描 → 空。<br>
    雙擊格子可修改破音字或自訂注音。
  </p>
</div>

<div class="paper-wrap">
  <div id="preview"></div>
</div>
`;

function cleanText(text){
  return text.replace(/[，,、。！？；：「」『』（）()《》〈〉\n\r\t\s]/g,"");
}

function getZhuyin(ch){
  return zhuyinMap[ch] || "";
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
        const item = page[dataIndex];
        html += cell(item,globalIndex,row,col);
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
      ondblclick="chooseZhuyin(${index})">

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
    html += `
      <span class="zhuyin-symbol" style="top:${pos[i]}%">
        ${ch}
      </span>
    `;
  });

  if(tone){
    let toneTop;

    if(chars.length === 1){
      toneTop = 28;
    }else{
      toneTop = pos[chars.length-1] - 8;
    }

    html += `
      <span class="tone-mark" style="top:${toneTop}%">
        ${tone}
      </span>
    `;
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

function chooseZhuyin(index){
  const item = cellData[index];
  if(!item) return;

  const opts = polyphoneMap[item.char] || [];

  if(opts.length){
    const msg = opts.map((z,n)=>`${n+1}. ${z}`).join("\\n");
    const pick = prompt(
      `選擇「${item.char}」讀音：\\n${msg}\\n或直接輸入注音`,
      item.zhuyin
    );

    if(!pick) return;

    item.zhuyin = opts[Number(pick)-1] || pick;
  }else{
    const z = prompt(`輸入「${item.char}」注音`,item.zhuyin);

    if(z !== null){
      item.zhuyin = z.trim();
    }
  }

  render();
}

function saveWork(showAlert=true){
  localStorage.setItem(STORAGE_KEY,JSON.stringify({
    words:document.getElementById("words").value,
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
  if(confirm("確定清除本機記憶？")){
    localStorage.removeItem(STORAGE_KEY);

    document.getElementById("words").value =
      "黃狗 公雞 經過 奇怪 山羊 鴨子 信用 錯誤 眼睛 仔細";

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

loadWork();
