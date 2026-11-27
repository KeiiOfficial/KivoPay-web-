const fileInput = document.getElementById('videoFile');
const dropzone = document.getElementById('dropzone');
const editor = document.getElementById('editor');
const video = document.getElementById('preview');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const startRange = document.getElementById('startRange');
const endRange = document.getElementById('endRange');
const exportBtn = document.getElementById('exportBtn');
const progressBox = document.getElementById('progressBox');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('status');
let sourceUrl = null, sourceFile = null, recording = false;

const fmt = n => {
  if (!Number.isFinite(n)) return '00:00';
  const m = Math.floor(n / 60), s = Math.floor(n % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('video/')) return alert('Pilih file video, ya.');
  sourceFile = file;
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);
  video.src = sourceUrl;
  document.getElementById('fileName').textContent = file.name;
  dropzone.classList.add('hidden');
  editor.classList.remove('hidden');
  video.load();
});

video.addEventListener('loadedmetadata', () => {
  const d = video.duration;
  if (!Number.isFinite(d) || d <= 0) return;
  startRange.max = endRange.max = d;
  startRange.value = 0;
  endRange.value = d;
  startTime.value = 0;
  endTime.value = d.toFixed(1);
  document.getElementById('durationLabel').textContent = fmt(d);
  updateClip();
});
function updateClip() {
  const d = video.duration || 0;
  let a = Math.max(0, Math.min(Number(startTime.value) || 0, d));
  let b = Math.max(0, Math.min(Number(endTime.value) || d, d));
  if (b <= a) b = Math.min(d, a + .5);
  startTime.value = a.toFixed(1);
  endTime.value = b.toFixed(1);
  startRange.value = a;
  endRange.value = b;
  document.getElementById('clipLength').textContent = `Durasi pilihan: ${(b-a).toFixed(1)} dtk`;
}
[startTime,endTime].forEach(el => el.addEventListener('change', updateClip));
startRange.addEventListener('input', () => { startTime.value = startRange.value; updateClip(); });
endRange.addEventListener('input', () => { endTime.value = endRange.value; updateClip(); });

document.getElementById('resetBtn').addEventListener('click', () => {
  video.pause(); video.removeAttribute('src'); video.load();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = null; sourceFile = null; fileInput.value = '';
  editor.classList.add('hidden'); dropzone.classList.remove('hidden');
  progressBox.classList.add('hidden');
});

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function pickMime() {
  const options = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return options.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
}

exportBtn.addEventListener('click', async () => {
  if (!sourceFile || recording) return;
  const start = Math.max(0, Number(startTime.value) || 0);
  const end = Math.min(video.duration, Number(endTime.value) || video.duration);
  if (end <= start || end - start > 30.1) {
    alert('Pilih durasi antara 0,5 sampai 30 detik untuk percobaan ini.');
    return;
  }
  if (!('captureStream' in HTMLVideoElement.prototype) || !window.MediaRecorder) {
    alert('Browser ini belum mendukung ekspor video bersuara. Coba Chrome versi terbaru.');
    return;
  }
  const mimeType = pickMime();
  if (!mimeType) {
    alert('Format rekaman WebM tidak didukung browser ini.');
    return;
  }

  recording = true;
  exportBtn.disabled = true;
  progressBox.classList.remove('hidden');
  progressBar.style.width = '0%';
  statusText.textContent = 'Menyiapkan video dan audio…';

  let stream = null, recorder = null, chunks = [];
  try {
    video.pause();
    if (Math.abs(video.currentTime - start) > 0.05) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video gagal diputar.')), 10000);
        video.addEventListener('seeked', () => { clearTimeout(timeout); resolve(); }, {once:true});
        video.currentTime = start;
      });
    }

    const canvas = document.createElement('canvas');
    const maxW = 720;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(24);
    const mediaStream = video.captureStream();
    const audioTracks = mediaStream.getAudioTracks();
    if (!audioTracks.length) {
      throw new Error('Audio tidak terdeteksi dari video. Pastikan video memang memiliki suara dan coba lagi.');
    }
    stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    recorder = new MediaRecorder(stream, {mimeType});
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error('Perekaman gagal.'));
    });
    recorder.start(250);
    await video.play();

    const draw = () => {
      if (!recording) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pct = Math.min(100, ((video.currentTime - start) / (end - start)) * 100);
      progressBar.style.width = `${pct}%`;
      statusText.textContent = `Memproses video… ${Math.round(pct)}%`;
      if (video.currentTime >= end || video.ended) {
        video.pause();
        if (recorder.state !== 'inactive') recorder.stop();
        return;
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    await stopped;
    recording = false;
    canvasStream.getTracks().forEach(t => t.stop());
    mediaStream.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks, {type:mimeType});
    if (!blob.size) throw new Error('File hasil kosong. Coba video lain.');
    const outUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = outUrl;
    a.download = `${sourceFile.name.replace(/\.[^.]+$/, '')}-keii-tools.webm`;
    document.body.appendChild(a); a.click(); a.remove();
    statusText.textContent = 'Selesai! Video WebM sudah diunduh. Audio ikut diproses jika sumber memiliki audio.';
    progressBar.style.width = '100%';
    setTimeout(() => URL.revokeObjectURL(outUrl), 60000);
  } catch (err) {
    recording = false;
    statusText.textContent = err.message || 'Terjadi kesalahan saat memproses video.';
    alert(err.message || 'Gagal memproses video.');
  } finally {
    if (stream) stream.getTracks().forEach(t => t.stop());
    exportBtn.disabled = false;
    recording = false;
  }
});

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', e => {
  e.preventDefault(); dropzone.classList.remove('drag');
  const f = e.dataTransfer.files[0];
  if (f) { const dt = new DataTransfer(); dt.items.add(f); fileInput.files = dt.files; fileInput.dispatchEvent(new Event('change')); }
});
