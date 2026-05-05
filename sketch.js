let capture;
let saveBtn; // 儲存按鈕
let faceMesh; // FaceMesh 模型
let faces = []; // 存放偵測到的臉部結果

// 指定的臉部辨識連線編號順序
const lipIndices = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const secondIndices = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];

// 新增：眼睛與臉部輪廓編號
// 根據要求：247 為外圍一圈，246 為內圈一圈
const rightEyeOuter = [130, 247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25]; 
const rightEyeInner = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]; 
const leftEyeOuter = [359, 467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255];
const leftEyeInner = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];
const faceSilhouette = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 取得攝影機影像
  capture = createCapture(VIDEO);
  
  // 隱藏預設出現在畫布下方的 HTML5 影片元件，只在畫布內繪製
  capture.hide();

  // 初始化 FaceMesh
  const faceMeshOptions = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
  faceMesh = ml5.faceMesh(faceMeshOptions, () => {
    console.log("臉部辨識模型已就緒");
  });
  // 開始持續偵測
  faceMesh.detectStart(capture, (results) => { faces = results; });

  // 建立儲存按鈕
  saveBtn = createButton('儲存影像');
  saveBtn.mousePressed(saveImage);
  updateButtonPosition();
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');
  
  // 檢查攝影機是否已就緒，避免 NotFoundError 導致寬度為 0 產生運算錯誤 (NaN)
  if (!capture || capture.width === 0 || capture.height === 0) {
    fill(50);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("⚠️ 正在啟動攝影機，或找不到攝影機設備...\n(請檢查瀏覽器權限或是否使用 HTTPS/Localhost)", width / 2, height / 2);
    return;
  }

  // 計算影像寬高 (全螢幕的 60%)
  let videoW = width * 0.6;
  let videoH = height * 0.6;
  
  // 計算置中座標
  let x = (width - videoW) / 2;
  let y = (height - videoH) / 2;
  
  // 修正左右顛倒問題（實作水平翻轉鏡像）
  push(); 
  // 將原點移動到影像預定位置的右邊緣
  translate(x + videoW, y);
  // 水平翻轉座標軸：-1 代表 X 軸方向反轉
  scale(-1, 1);
  // 由於座標軸已翻轉，從 (0, 0) 開始繪製即可顯示在正確位置
  image(capture, 0, 0, videoW, videoH);

  // 繪製臉部網格連線
  if (faces.length > 0) {
    let face = faces[0];
    
    noFill();
    
    // --- 繪製嘴唇 (紅色, 粗細 1) ---
    stroke(255, 0, 0);
    strokeWeight(1);
    for (let i = 0; i < lipIndices.length - 1; i++) {
      let p1 = face.keypoints[lipIndices[i]];
      let p2 = face.keypoints[lipIndices[i + 1]];
      if (p1 && p2) {
        // 利用 line 指令，將編號點串接在一起，並依比例映射到 60% 的畫面大小
        line(p1.x * (videoW / capture.width), p1.y * (videoH / capture.height), 
             p2.x * (videoW / capture.width), p2.y * (videoH / capture.height));
      }
    }
    for (let i = 0; i < secondIndices.length - 1; i++) {
      let p1 = face.keypoints[secondIndices[i]];
      let p2 = face.keypoints[secondIndices[i + 1]];
      if (p1 && p2) {
        line(p1.x * (videoW / capture.width), p1.y * (videoH / capture.height), 
             p2.x * (videoW / capture.width), p2.y * (videoH / capture.height));
      }
    }

    // --- 繪製眼睛與臉部輪廓 (藍色, 粗細 2) ---
    stroke(0, 0, 255);
    strokeWeight(2);
    
    // 繪製路徑的輔助函式 (設為 true 則會閉合連線)
    const drawFeature = (points, isClosed) => {
      for (let i = 0; i < (isClosed ? points.length : points.length - 1); i++) {
        let p1 = face.keypoints[points[i]];
        let p2 = face.keypoints[points[(i + 1) % points.length]];
        if (p1 && p2) {
          line(p1.x * (videoW / capture.width), p1.y * (videoH / capture.height), 
               p2.x * (videoW / capture.width), p2.y * (videoH / capture.height));
        }
      }
    };

    drawFeature(rightEyeOuter, true);
    drawFeature(rightEyeInner, true);
    drawFeature(leftEyeOuter, true);
    drawFeature(leftEyeInner, true);
    drawFeature(faceSilhouette, true);
  }
  pop();
}

// 當視窗大小改變時，自動調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateButtonPosition();
}

// 更新按鈕位置，使其顯示在視訊畫面的右下方
function updateButtonPosition() {
  let videoW = width * 0.6;
  let videoH = height * 0.6;
  let x = (width - videoW) / 2;
  let y = (height - videoH) / 2;
  // 將按鈕放在視訊右下角偏移一點的位置
  saveBtn.position(x + videoW - 80, y + videoH + 20);
}

// 執行存檔
function saveImage() {
  saveCanvas('my_capture', 'png');
}