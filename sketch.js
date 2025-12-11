let song;
let button;
let volumeSlider;
let fft;

let progressY;
let progressIcon;

let smoke = [];
let boatImg;

// Boat Movement //
let boatX = -50;
let boatSpeed = 1.5;
let boatDirection = 1;
let boatPaused = false;

// Clouds //
let cloud1 = {x: 60, y: 74, dir: 1, speed: 0.3};
let cloud2 = {x: 280, y: 74, dir: -1, speed: 0.25};

// Dragging variables
let dragging = false;
let fishX = 0;
let targetTime = 0;

function preload() {
  song = loadSound("Ginger Island.mp3");
  boatImg = loadImage("Willy's Boat.png");
  progressIcon = loadImage("Blue_Discus.webp");
}

function setup() {
  createCanvas(400, 400);
  progressY = height;

  // Play/Pause Button //
  button = createButton("play");
  button.position(70, 500);
  button.mousePressed(togglePlaying);

  // Volume Slider //
  volumeSlider = createSlider(0.0, 1.0, 0.5, 0.01);
  volumeSlider.position(130, 500);
  volumeSlider.style('width', '200px');

  fft = new p5.FFT(0.3, 1024);
}

// Play/Pause Button Function //
function togglePlaying() {
  if (!song.isPlaying()) {
    song.loop();
    button.html("pause");
  } else {
    song.pause();
    button.html("play");
  }
}

function draw() {
  if (song && song.isLoaded()) {
    song.setVolume(volumeSlider.value());
  }

  // Base Background Color //
  background(135, 206, 235);

  // Sky Gradient //
  for (let y = 0; y < height - 50; y++) {
    let inter = map(y, 0, height - 50, 0, 1);
    let c = lerpColor(color(135, 206, 235), color(255, 200, 150), inter);
    stroke(c);
    line(0, y, width, y);
  }

  // Volume Display //
  let volumeValue = volumeSlider.value();
  let volumePercent = int(volumeValue * 100);
  fill("black");
  stroke("white");
  textSize(16);
  text("Volume: " + volumePercent + "%", 10, 30);

  // Cloud Movements //
  cloud1.x += cloud1.dir * cloud1.speed;
  cloud2.x += cloud2.dir * cloud2.speed;

  if (cloud1.x > width - 30 || cloud1.x < 30) cloud1.dir *= -1;
  if (cloud2.x > width - 30 || cloud2.x < 30) cloud2.dir *= -1;

  // Cloud 1 //
  drawCloud(cloud1.x, cloud1.y, 25, 40);
  drawCloud(cloud1.x + 30, cloud1.y + 1, 15, 30);
  drawCloud(cloud1.x - 30, cloud1.y + 1, 15, 30);

  // Cloud 2 //
  drawCloud(cloud2.x, cloud2.y, 30, 40);
  drawCloud(cloud2.x - 30, cloud2.y + 1, 20, 30);
  drawCloud(cloud2.x + 30, cloud2.y + 1, 20, 30);

  // Volcano //
  let volcanoX = width / 2;
  fill("#D29C4B");
  stroke("#D29C4B");
  rect(volcanoX - 45, 170, 90, 230);
  triangle(volcanoX - 150, 400, volcanoX - 45, 400, volcanoX - 45, 200); // Left //
  triangle(volcanoX + 45, 200, volcanoX + 45, 400, volcanoX + 150, 400);  // Right // 

  // Lava reacting to bass //
  let bass = fft.getEnergy("bass");
  let lavaHeight = map(bass, 0, 255, 10, 40);
  fill(255, 100, 0, 200);
  ellipse(volcanoX, 180, 60, lavaHeight);

  // Smoke Spawn - Volume/Bass Reaction //
  if (volumeValue > 0) {
    let amount = map(bass, 0, 255, 1, 6);
    for (let i = 0; i < amount; i++) {
      smoke.push(new Smoke(volcanoX, 170));
    }
  }

  for (let i = smoke.length - 1; i >= 0; i--) {
    smoke[i].update();
    smoke[i].show();
    if (smoke[i].finished()) {
      smoke.splice(i, 1);
    }
  }

  // Sun Waveform //
  let waveform = fft.waveform();
  fill("orange");
  stroke(255, 204, 0, 200);
  strokeWeight(3);
  let sunX = width - 60;
  let sunY = 60;
  let sunRadius = 30;

  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    let angle = map(i, 0, waveform.length, 0, TWO_PI);
    let offset = map(waveform[i], -1, 1, -20, 40);
    let x = sunX + (sunRadius + offset) * cos(angle);
    let y = sunY + (sunRadius + offset) * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);

  // Spectrum Frequency Analyze //
  let spectrum = fft.analyze();
  noStroke();
  let waterTop = height - 50;

  for (let i = 0; i < spectrum.length / 2; i++) {
    let h = map(spectrum[i] * 1.5, 0, 255, 0, 100);
    let w = width / (spectrum.length / 2);

    // Green Gradient //
    let t = map(h, 0, 100, 0, 1);
    let r = lerp(40, 120, t);   
    let g = lerp(100, 220, t);
    let b = lerp(20,  80,  t);
    fill(r, g, b);

    rect(width / 2 - i * w, waterTop - h, w, h);
    rect(width / 2 + i * w, waterTop - h, w, h);
  }

  // Water //
  for (let y = height - 50; y < height; y++) {
    let inter = map(y, height - 50, height, 0, 1);
    let c = lerpColor(color(0, 100, 200), color(0, 150, 255), inter);
    stroke(c);
    line(0, y, width, y);
  }

  // Boat //
  drawBoat();

  // Progress Bar //
  if (song.isLoaded()) {
    let duration = song.duration();
    let currentTime = song.currentTime();
    let progress;

    if (dragging) {
      fishX = lerp(fishX, constrain(mouseX, 0, width), 0.2);
      targetTime = map(fishX, 0, width, 0, duration);
      progress = map(targetTime, 0, duration, 0, width);
    } else {
      progress = map(currentTime, 0, duration, 0, width);
      fishX = progress;
      targetTime = currentTime;
    }

    let barHeight = 10;

    stroke(0);
    strokeWeight(2);
    noFill();
    rect(0, progressY - barHeight, width, barHeight);

    noStroke();
    fill("#88daff");
    rect(1, progressY - barHeight + 1, progress - 2, barHeight - 2);

    imageMode(CENTER);
    let iconY = progressY - barHeight / 2;
    let iconSize = dist(mouseX, mouseY, fishX, iconY) < 10 ? 25 : 15;
    image(progressIcon, fishX, iconY, iconSize, iconSize);
  }
}

// Click to jump instantly //
function mousePressed() {
  if (song.isLoaded() && mouseY > progressY - 10 && mouseY < progressY) {
    dragging = true;

    let duration = song.duration();
    targetTime = map(mouseX, 0, width, 0, duration);
    song.jump(targetTime);
  }
}

// Dragging while playing //
function mouseDragged() {
  if (dragging) {
    let duration = song.duration();
    targetTime = map(constrain(mouseX, 0, width), 0, width, 0, duration);
    song.jump(targetTime);
  }
}

// Stop Dragging //
function mouseReleased() {
  if (dragging) {
    dragging = false;
    if (!song.isPlaying()) {
      song.jump(targetTime);
    }
  }
}

// Smoke Class //
class Smoke {
  constructor(x, y) {
    this.startY = y;
    this.x = x + random(-20, 20);
    this.y = y;
    this.alpha = 255;
    this.size = random(5, 20);
  }

  update() {
    let bass = fft.getEnergy("bass");
    this.y -= 1 + bass / 500;
    this.x += random(-0.5 - bass / 500, 0.5 + bass / 500);
    this.size += bass / 300;

    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < 40) {
      let force = map(d, 0, 40, 4, 0);
      if (mouseX < this.x) this.x += force;
      else this.x -= force;
    }

    this.alpha -= 2;
  }

  show() {
    noStroke();
    let t = map(this.y, this.startY, 0, 0, 1);
    t = constrain(t, 0, 1);
    let grey = lerp(80, 220, t);
    fill(grey, grey, grey, this.alpha);
    ellipse(this.x, this.y, this.size);
  }

  finished() {
    return this.alpha <= 0;
  }
}

// Boat //
function drawBoat() {
  let waterY = height - 50;
  let bob = sin(frameCount * 0.05) * 3;

  let frontZoneWidth = 30;
  let frontZoneX;
  if (boatDirection === 1) {
    frontZoneX = boatX;
  } else {
    frontZoneX = boatX - frontZoneWidth;
  }

  boatPaused = mouseX > frontZoneX && mouseX < frontZoneX + frontZoneWidth &&
  mouseY > waterY - 20 && mouseY < waterY + 20;

  if (!boatPaused) {
    boatX += boatSpeed * boatDirection;
    if (boatX > width + 50) boatDirection = -1;
    if (boatX < -50) boatDirection = 1;
  }

  let direction = boatDirection;
  imageMode(CENTER);
  push();
  translate(boatX, waterY + bob);
  scale(direction, 1);
  image(boatImg, 0, 0, 50, 25);
  pop();
}

// Cloud Waveforms//
function drawCloud(x, y, baseRadius, waveformLength) {
  if (!fft) return;
  let waveform = fft.waveform();
  fill("#FAF2EF");
  stroke("#FAF2EF");
  strokeWeight(2);

  beginShape();
  for (let i = 0; i < waveformLength; i++) {
    let angle = map(i, 0, waveformLength, 0, TWO_PI);
    let offset = map(waveform[i], -1, 1, -20, 40);
    let px = x + (baseRadius + offset) * cos(angle);
    let py = y + (baseRadius / 1.5 + offset / 2) * sin(angle);
    vertex(px, py);
  }
  endShape(CLOSE);
}
