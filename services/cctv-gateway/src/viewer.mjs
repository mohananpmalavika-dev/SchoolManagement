function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

export function renderExpiredHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Viewing Session Expired</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; text-align: center; padding: 16px; }
    .card { max-width: 360px; background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 20px; }
    h1 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Viewing session expired</h1>
    <p>This secure classroom camera session has ended. Return to the parent portal to start a new viewing window if permitted.</p>
  </div>
</body>
</html>`;
}

/**
 * Renders a lightweight, mobile-browser-ready, zero-CDN live CCTV player.
 * Primary transport: WebRTC (WHEP) for sub-second latency on Android Chrome, iOS Safari & Desktop.
 * Automatic fallback: HLS (native on iOS Safari / Apple browsers).
 */
export function renderViewerHtml({ token, label, expiresAtMs, iceServers = [] }) {
  const safeLabel = escapeHtml(label || 'Classroom Camera');
  const configJson = safeJsonForScript({
    whepUrl: `/cctv/play/${encodeURIComponent(token)}/whep`,
    hlsUrl: `/cctv/play/${encodeURIComponent(token)}/hls/index.m3u8`,
    expiresAtMs,
    iceServers,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <title>${safeLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; user-select: none; -webkit-user-select: none; }
    .stage { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #020617; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; }
    .topbar { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; pointer-events: none; z-index: 4; }
    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(148, 163, 184, 0.28); font-size: 12px; font-weight: 600; backdrop-filter: blur(6px); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; }
    .dot.live { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
    .dot.err { background: #ef4444; }
    .controls { position: absolute; bottom: 10px; right: 10px; display: flex; gap: 8px; z-index: 4; }
    .watermark { position: absolute; bottom: 12px; left: 12px; font-size: 11px; color: rgba(248, 250, 252, 0.65); background: rgba(2, 6, 23, 0.55); padding: 4px 8px; border-radius: 6px; pointer-events: none; z-index: 4; }
    button { appearance: none; border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(15, 23, 42, 0.85); color: #f8fafc; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
    button:active { transform: scale(0.97); }
    .overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(2, 6, 23, 0.84); text-align: center; padding: 18px; z-index: 5; }
    .overlay.hidden { display: none; }
    .overlay h2 { font-size: 15px; font-weight: 600; }
    .overlay p { font-size: 13px; color: #cbd5e1; max-width: 320px; line-height: 1.45; }
  </style>
</head>
<body oncontextmenu="return false">
  <div class="stage" id="stage">
    <video id="player" autoplay playsinline webkit-playsinline muted disablepictureinpicture controlslist="nodownload noplaybackrate noremoteplayback"></video>

    <div class="topbar">
      <div class="pill">
        <span class="dot" id="dot"></span>
        <span id="statusText">Connecting…</span>
      </div>
      <div class="pill" id="timer">02:00</div>
    </div>

    <div class="watermark" id="watermark">${safeLabel}</div>

    <div class="controls">
      <button type="button" id="retryBtn" hidden>Reconnect</button>
      <button type="button" id="muteBtn">Unmute</button>
      <button type="button" id="fsBtn">Fullscreen</button>
    </div>

    <div class="overlay" id="overlay">
      <h2 id="overlayTitle">Connecting to classroom camera…</h2>
      <p id="overlayBody">Establishing encrypted live video stream. Please wait a moment.</p>
      <button type="button" id="overlayAction" hidden>Try again</button>
    </div>
  </div>

  <script>
    (function () {
      const cfg = ${configJson};
      const video = document.getElementById('player');
      const dot = document.getElementById('dot');
      const statusText = document.getElementById('statusText');
      const timerEl = document.getElementById('timer');
      const watermarkEl = document.getElementById('watermark');
      const overlay = document.getElementById('overlay');
      const overlayTitle = document.getElementById('overlayTitle');
      const overlayBody = document.getElementById('overlayBody');
      const overlayAction = document.getElementById('overlayAction');
      const muteBtn = document.getElementById('muteBtn');
      const fsBtn = document.getElementById('fsBtn');
      const retryBtn = document.getElementById('retryBtn');
      const stage = document.getElementById('stage');

      let pc = null;
      let whepSessionUrl = null;
      let expired = false;
      let fallbackTimer = null;

      function setStatus(kind, text) {
        dot.className = 'dot' + (kind ? ' ' + kind : '');
        statusText.textContent = text;
      }

      function showOverlay(title, body, allowRetry) {
        overlayTitle.textContent = title;
        overlayBody.textContent = body;
        overlayAction.hidden = !allowRetry;
        overlay.classList.remove('hidden');
      }

      function hideOverlay() {
        overlay.classList.add('hidden');
      }

      async function cleanupStream() {
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        if (pc) {
          try { pc.close(); } catch (_) {}
          pc = null;
        }
        if (whepSessionUrl) {
          const urlToClose = whepSessionUrl;
          whepSessionUrl = null;
          try { fetch(urlToClose, { method: 'DELETE', keepalive: true }); } catch (_) {}
        }
        try {
          video.pause();
          video.srcObject = null;
          video.removeAttribute('src');
          video.load();
        } catch (_) {}
      }

      function endSession() {
        if (expired) return;
        expired = true;
        cleanupStream();
        setStatus('err', 'Expired');
        timerEl.textContent = '00:00';
        retryBtn.hidden = true;
        showOverlay(
          'Viewing session ended',
          'Your two-minute secure classroom viewing window has closed automatically.',
          false
        );
      }

      function updateClock() {
        const remainingMs = cfg.expiresAtMs - Date.now();
        if (remainingMs <= 0) {
          endSession();
          return;
        }
        const totalSec = Math.ceil(remainingMs / 1000);
        const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const sec = String(totalSec % 60).padStart(2, '0');
        timerEl.textContent = min + ':' + sec;
        watermarkEl.textContent = ${safeJsonForScript(label || 'Classroom Camera')} + ' · ' + new Date().toLocaleTimeString();
      }

      function startHlsFallback() {
        if (expired) return;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          setStatus('', 'Switching to HLS…');
          video.src = cfg.hlsUrl;
          video.play().then(function () {
            setStatus('live', 'LIVE · HLS');
            hideOverlay();
            retryBtn.hidden = false;
          }).catch(function () {
            setStatus('err', 'Tap to play');
            showOverlay('Tap to start video', 'Mobile browser playback requires a tap to resume.', true);
          });
        } else {
          setStatus('err', 'Stream unavailable');
          retryBtn.hidden = false;
          showOverlay(
            'Unable to connect live stream',
            'The classroom camera may be offline or blocked by your mobile network. Tap Reconnect to retry.',
            true
          );
        }
      }

      function waitForIceGathering(peer, maxWaitMs) {
        return new Promise(function (resolve) {
          if (peer.iceGatheringState === 'complete') {
            resolve();
            return;
          }
          let done = false;
          const finish = function () {
            if (done) return;
            done = true;
            peer.removeEventListener('icegatheringstatechange', onState);
            clearTimeout(timer);
            resolve();
          };
          const onState = function () {
            if (peer.iceGatheringState === 'complete') finish();
          };
          const timer = setTimeout(finish, maxWaitMs);
          peer.addEventListener('icegatheringstatechange', onState);
        });
      }

      async function startWebRtc() {
        if (expired) return;
        await cleanupStream();
        setStatus('', 'Connecting…');
        showOverlay('Connecting to classroom camera…', 'Establishing low-latency live video stream.', false);

        if (typeof RTCPeerConnection === 'undefined') {
          startHlsFallback();
          return;
        }

        try {
          pc = new RTCPeerConnection({
            iceServers: cfg.iceServers && cfg.iceServers.length ? cfg.iceServers : [{ urls: 'stun:stun.l.google.com:19302' }],
          });
          pc.addTransceiver('video', { direction: 'recvonly' });
          pc.addTransceiver('audio', { direction: 'recvonly' });

          pc.ontrack = function (event) {
            if (expired) return;
            if (event.streams && event.streams[0]) {
              video.srcObject = event.streams[0];
            } else {
              const stream = video.srcObject instanceof MediaStream ? video.srcObject : new MediaStream();
              stream.addTrack(event.track);
              video.srcObject = stream;
            }
            video.play().catch(function () {});
            setStatus('live', 'LIVE · WebRTC');
            hideOverlay();
            retryBtn.hidden = false;
            if (fallbackTimer) {
              clearTimeout(fallbackTimer);
              fallbackTimer = null;
            }
          };

          pc.oniceconnectionstatechange = function () {
            if (!pc || expired) return;
            const st = pc.iceConnectionState;
            if (st === 'connected' || st === 'completed') {
              setStatus('live', 'LIVE · WebRTC');
              hideOverlay();
            } else if (st === 'failed' || st === 'closed') {
              startHlsFallback();
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await waitForIceGathering(pc, 1500);

          const res = await fetch(cfg.whepUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: pc.localDescription.sdp,
          });

          if (res.status === 401 || res.status === 403) {
            endSession();
            return;
          }
          if (!res.ok) {
            throw new Error('WHEP HTTP ' + res.status);
          }

          const loc = res.headers.get('Location');
          if (loc) whepSessionUrl = loc;
          const answerSdp = await res.text();
          if (expired || !pc) return;
          await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

          fallbackTimer = setTimeout(function () {
            if (!expired && (!pc || (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed'))) {
              startHlsFallback();
            }
          }, 7000);
        } catch (_) {
          startHlsFallback();
        }
      }

      muteBtn.addEventListener('click', function () {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? 'Unmute' : 'Mute';
      });

      fsBtn.addEventListener('click', function () {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
        } else if (stage.requestFullscreen) {
          stage.requestFullscreen().catch(function () {});
        } else if (video.webkitEnterFullscreen) {
          try { video.webkitEnterFullscreen(); } catch (_) {}
        }
      });

      retryBtn.addEventListener('click', function () { startWebRtc(); });
      overlayAction.addEventListener('click', function () { startWebRtc(); });

      window.addEventListener('pagehide', cleanupStream);
      window.addEventListener('beforeunload', cleanupStream);

      updateClock();
      setInterval(updateClock, 1000);
      startWebRtc();
    })();
  </script>
</body>
</html>`;
}
