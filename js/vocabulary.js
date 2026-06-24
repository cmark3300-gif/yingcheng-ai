document.getElementById("app").innerHTML = `
<div style="padding:20px;">

  <div style="
    background:white;
    border-radius:12px;
    padding:20px;
    margin-bottom:20px;
    box-shadow:0 2px 10px rgba(0,0,0,.08);
  ">
    <h2>生字簿設定</h2>

    <textarea id="words"
      style="width:100%;height:120px;font-size:18px;"
      placeholder="請輸入生字或詞語"></textarea>

    <br><br>

    <button id="generateBtn">
      產生生字簿
    </button>

    <button id="blankBtn">
      空白生字簿
    </button>

  </div>

  <div id="preview"></div>

</div>
`;

document.getElementById("generateBtn")
.addEventListener("click", generateBook);

document.getElementById("blankBtn")
.addEventListener("click", generateBlankBook);

function generateBook(){

  const text =
    document.getElementById("words")
    .value
    .replace(/\s/g,"");

  let html = `
  <div class="page">
    <div class="grid">
  `;

  for(let i=0;i<100;i++){

    const char = text[i] || "";

    html += `
    <div class="word-cell">

      <div class="char-grid">

        <div class="diag1"></div>
        <div class="diag2"></div>

        <div style="
          position:absolute;
          inset:0;
          display:flex;
          justify-content:center;
          align-items:center;
          font-size:36px;
          font-family:標楷體;
        ">
          ${char}
        </div>

      </div>

      <div class="zhuyin-grid"></div>

    </div>
    `;
  }

  html += `
    </div>
  </div>
  `;

  document.getElementById("preview").innerHTML = html;
}

function generateBlankBook(){

  document.getElementById("words").value="";

  generateBook();
}
