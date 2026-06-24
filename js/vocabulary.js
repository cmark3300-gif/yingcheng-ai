const STORAGE_KEY="yc_vocab_v92";
let cellData=[];

const zhuyinMap={
"黃":"ㄏㄨㄤˊ","狗":"ㄍㄡˇ","公":"ㄍㄨㄥ","雞":"ㄐㄧ","經":"ㄐㄧㄥ","過":"ㄍㄨㄛˋ",
"奇":"ㄑㄧˊ","怪":"ㄍㄨㄞˋ","山":"ㄕㄢ","羊":"ㄧㄤˊ","鴨":"ㄧㄚ","子":"ㄗˇ",
"信":"ㄒㄧㄣˋ","用":"ㄩㄥˋ","錯":"ㄘㄨㄛˋ","誤":"ㄨˋ","眼":"ㄧㄢˇ","睛":"ㄐㄧㄥ",
"仔":"ㄗˇ","細":"ㄒㄧˋ","不":"ㄅㄨˋ","可":"ㄎㄜˇ","以":"ㄧˇ","重":"ㄓㄨㄥˋ",
"行":"ㄒㄧㄥˊ","樂":"ㄩㄝˋ","物":"ㄨˋ","種":"ㄓㄨㄥˇ","聽":"ㄊㄧㄥ","覺":"ㄐㄩㄝˊ"
};

const polyphoneMap={
"重":["ㄓㄨㄥˋ","ㄔㄨㄥˊ"],
"行":["ㄒㄧㄥˊ","ㄏㄤˊ"],
"樂":["ㄌㄜˋ","ㄩㄝˋ"],
"長":["ㄔㄤˊ","ㄓㄤˇ"]
};

document.getElementById("app").innerHTML=`
<div class="panel">
  <h2>生字簿設定</h2>
  <textarea id="words" rows="5">黃狗 公雞 經過 奇怪 山羊 鴨子 信用 錯誤 眼睛 仔細</textarea>
  <select id="defaultMode">
    <option value="both">國字＋注音</option>
    <option value="zhuyinOnly">只顯示注音</option>
    <option value="charOnly">只顯示國字</option>
    <option value="blank">空白</option>
  </select>
  <button onclick="generateBook()">產生生字簿</button>
  <button class="green" onclick="generateBlank()">空白生字簿</button>
  <button onclick="saveWork()">儲存作業</button>
  <button onclick="loadWork()">讀取作業</button>
  <button class="danger" onclick="clearWork()">清除本機記憶</button>
  <button class="secondary" onclick="window.print()">列印／PDF</button>
  <p>點格切換：全 → 音 → 字 → 空。雙擊可選破音字。</p>
</div>
<div class="paper-wrap"><div id="preview"></div></div>
`;

function cleanText(t){return t.replace(/[，,、。！？；：「」『』（）()《》〈〉\n\r\t\s]/g,"");}
function getZhuyin(ch){return zhuyinMap[ch]||"";}
function splitZhuyin(z){
  const tones=["ˊ","ˇ","ˋ","˙"]; let tone="",base=z||"";
  tones.forEach(t=>{if(base.includes(t)){tone=t;base=base.replace(t,"");}});
  return {base,tone};
}

function generateBook(){
  const text=cleanText(document.getElementById("words").value);
  const mode=document.getElementById("defaultMode").value;
  cellData=[...text].map(ch=>({char:ch,zhuyin:getZhuyin(ch),mode}));
  render();
}

function generateBlank(){
  cellData=Array.from({length:100},()=>({char:"",zhuyin:"",mode:"blank"}));
  render();
}

function render(){
  let html="";
  for(let p=0;p<Math.max(1,Math.ceil(cellData.length/100));p++){
    html+=`<div class="page"><div class="grid">`;
    const page=cellData.slice(p*100,p*100+100);
    for(let r=0;r<10;r++){
      for(let c=9;c>=0;c--){
        const idx=p*100+c*10+r;
        html+=cell(page[c*10+r],idx);
      }
    }
    html+=`</div></div>`;
  }
  document.getElementById("preview").innerHTML=html;
  localStorage.setItem(STORAGE_KEY,JSON.stringify({words:document.getElementById("words").value,cellData}));
}

function cell(item,index){
  if(!item)item={char:"",zhuyin:"",mode:"blank"};
  let showChar=item.mode==="both"||item.mode==="charOnly";
  let showZ=item.mode==="both"||item.mode==="zhuyinOnly";
  let tag=item.mode==="both"?"全":item.mode==="zhuyinOnly"?"音":item.mode==="charOnly"?"字":"空";
  const zh=splitZhuyin(showZ?item.zhuyin:"");
  return `<div class="word-cell" onclick="toggle(${index})" ondblclick="chooseZhuyin(${index})">
    <div class="char-grid">
      <div class="diag1"></div><div class="diag2"></div>
      <div class="char-text" style="${showChar?'':'color:transparent'}">${item.char}</div>
      <div class="status">${tag}</div>
    </div>
    <div class="zhuyin-grid">${renderZhuyin(zh.base,zh.tone)}</div>
  </div>`;
}

function renderZhuyin(base,tone){

  const symbols = [...(base || "")];

  if(tone){

    symbols.push(tone);

  }

  if(symbols.length===0){

    return "";

  }

  let pos=[];

  if(symbols.length===1){

    pos=[50];

  }

  else if(symbols.length===2){

    pos=[38,62];

  }

  else if(symbols.length===3){

    pos=[25,50,75];

  }

  else{

    pos=[18,40,62,84];

  }

  let html=`<div class="z-base">`;

  symbols.forEach((ch,i)=>{

    html += `<span style="top:${pos[i]}%">${ch}</span>`;

  });

  html += `</div>`;

  return html;

}

function toggle(i){
  if(!cellData[i])return;
  const order=["both","zhuyinOnly","charOnly","blank"];
  cellData[i].mode=order[(order.indexOf(cellData[i].mode)+1)%order.length];
  render();
}

function chooseZhuyin(i){
  const item=cellData[i]; if(!item)return;
  const opts=polyphoneMap[item.char]||[];
  if(opts.length){
    const msg=opts.map((z,n)=>`${n+1}. ${z}`).join("\n");
    const pick=prompt(`選擇「${item.char}」讀音：\n${msg}\n或直接輸入注音`,item.zhuyin);
    if(!pick)return;
    item.zhuyin=opts[Number(pick)-1]||pick;
  }else{
    const z=prompt(`輸入「${item.char}」注音`,item.zhuyin);
    if(z!==null)item.zhuyin=z;
  }
  render();
}

function saveWork(){localStorage.setItem(STORAGE_KEY,JSON.stringify({words:document.getElementById("words").value,cellData}));alert("已儲存在本機");}
function loadWork(){
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){alert("沒有本機存檔");return;}
  const data=JSON.parse(raw);
  document.getElementById("words").value=data.words||"";
  cellData=data.cellData||[];
  render();
}
function clearWork(){
  if(confirm("確定清除本機記憶？")){
    localStorage.removeItem(STORAGE_KEY);cellData=[];document.getElementById("preview").innerHTML="";
  }
}

loadWork();
if(cellData.length===0)generateBook();
