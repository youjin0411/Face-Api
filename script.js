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
        .then(function(stream) {
            video.srcObject = stream;
        })
        .catch(function(err) {
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
    setInterval(async() => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()) // 비디오에서 얼굴 탐지
            .withFaceLandmarks() // 얼굴 랜드마크 추출

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // 캔버스 초기화
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        // 얼굴 랜드마크 표시
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }, 100); // 100ms마다 실행
});