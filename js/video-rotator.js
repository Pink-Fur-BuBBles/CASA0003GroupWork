// js/video-rotator.js

// 🎬 视频 A：多视频随机循环播放
const videoListA = [
  "videos/paris_01.mp4",
  "videos/paris_03.mp4",
  "videos/paris_04.mp4",
  "videos/paris_05.mp4",
  "videos/paris_06.mp4"
];

const videoA = document.getElementById("video-player-A");
const sourceA = document.getElementById("video-source-A");

function playRandomVideoA() {
  const randomIndex = Math.floor(Math.random() * videoListA.length);
  const selectedVideo = videoListA[randomIndex];

  sourceA.src = selectedVideo;
  videoA.load();
  videoA.play();
}

videoA.addEventListener("ended", playRandomVideoA);
playRandomVideoA(); // 初始化播放一次