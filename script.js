// 비디오 엘리먼트를 가져옵니다.
const video = document.getElementById("video");

// 필요한 모델을 로드하는 Promise.all을 사용합니다.
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"), // 작은 얼굴 탐지 모델 로드
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"), // 68개의 얼굴 랜드마크 모델 로드
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"), // 얼굴 인식 모델 로드
  faceapi.nets.faceExpressionNet.loadFromUri("/models"), // 표정 인식 모델 로드
]).then(startVideo); // 로드가 완료되면 비디오 시작 함수 호출

function startVideo() {
  // 미디어 스트림을 사용하여 비디오를 가져와 재생합니다.
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log(err);
    });
}

// 비디오가 재생될 때 실행되는 이벤트 리스너입니다.
video.addEventListener("playing", () => {
  // 비디오로부터 캔버스 생성 및 추가합니다.
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  // 캔버스 크기를 비디오 크기에 맞게 설정합니다.
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  // 일정 시간 간격으로 얼굴을 감지하고 그리는 함수를 실행합니다.
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()) // 비디오에서 얼굴 탐지
      .withFaceLandmarks() // 얼굴 랜드마크 추출
      .withFaceExpressions(); // 표정 인식 추가

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // 캔버스 초기화
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // 얼굴 랜드마크 표시
    const drawOptions = {
      drawLines: true,
      drawPoints: true,
      lineWidth: 2,
      lineColor: "rgba(255, 0, 0, 0.5)",
      pointColor: "rgba(0, 255, 0, 0.5)",
    };
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections, drawOptions);

    // 얼굴 방향 확인
    const faceDirection = getFaceDirection(resizedDetections);
    // 얼굴 방향에 따른 처리
    if (faceDirection === "left") {
      console.log("왼쪽");
    } else if (faceDirection === "right") {
      console.log("오른쪽");
    }
  }, 100); // 100ms마다 실행
});

// 이전 코 좌표를 저장하는 변수를 선언합니다.
let previousNoseX = 0;

function getFaceDirection(detections) {
  // 얼굴이 감지되지 않으면 "unknown" 반환
  if (!detections || detections.length === 0) {
    return "unknown";
  }

  // 첫 번째 얼굴의 랜드마크 추출
  const landmarks = detections[0].landmarks;

  // 코의 좌표 추출
  const noseX = landmarks.getNose()[0].x;

  // 이전 코 좌표와 현재 코 좌표 사이의 이동 거리 계산
  const movementDistance = Math.abs(noseX - previousNoseX);

  // 이동 거리가 일정 값보다 크면 방향을 인식하고 업데이트합니다.
  let faceDirection = "unknown";
  const movementThreshold = 5; // 이동 거리의 임계값
  if (movementDistance > movementThreshold) {
    if (noseX < previousNoseX) {
      faceDirection = "left";
    } else if (noseX > previousNoseX) {
      faceDirection = "right";
    }

    // 현재 코 좌표를 이전 코 좌표로 업데이트합니다.
    previousNoseX = noseX;
  }

  return faceDirection;
}
