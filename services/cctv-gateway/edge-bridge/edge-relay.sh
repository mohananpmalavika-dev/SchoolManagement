#!/bin/sh
set -eu

apk add --no-cache ffmpeg >/dev/null 2>&1

: "${OCI_MEDIA_HOST:?Set OCI_MEDIA_HOST to your Oracle Cloud IP or domain}"
: "${OCI_SRT_PORT:=8890}"
: "${SCHOOL_TENANT_ID:?Set SCHOOL_TENANT_ID to the Krypton ERP tenant UUID}"
: "${CCTV_PUBLISH_TOKEN:?Set CCTV_PUBLISH_TOKEN matching Oracle Cloud .env.oci}"
: "${CAMERA_STREAMS:?Set CAMERA_STREAMS as semicolon-separated cameraRef=rtsp_url pairs}"
: "${INCLUDE_AUDIO:=false}"

echo "[om-edge-bridge] Starting OM System NVR -> Oracle Cloud SRT bridge for tenant ${SCHOOL_TENANT_ID}"

start_relay() {
  cam_ref="$1"
  rtsp_url="$2"
  stream_path="school_${SCHOOL_TENANT_ID}__${cam_ref}"
  srt_target="srt://${OCI_MEDIA_HOST}:${OCI_SRT_PORT}?streamid=publish:${stream_path}:om-bridge:${CCTV_PUBLISH_TOKEN}&pkt_size=1316&mode=caller&latency=200000"

  if [ "${INCLUDE_AUDIO}" = "true" ]; then
    audio_flags="-c:a aac -ar 44100 -b:a 64k"
  else
    audio_flags="-an"
  fi

  while true; do
    echo "[om-edge-bridge] Connecting camera '${cam_ref}' -> path '${stream_path}'"
    # shellcheck disable=SC2086
    ffmpeg -hide_banner -loglevel warning \
      -rtsp_transport tcp \
      -fflags +genpts+discardcorrupt \
      -i "${rtsp_url}" \
      -c:v copy ${audio_flags} \
      -f mpegts "${srt_target}" || true
    echo "[om-edge-bridge] Camera '${cam_ref}' disconnected; retrying in 5s..."
    sleep 5
  done
}

OLD_IFS="$IFS"
IFS=';'
for entry in $CAMERA_STREAMS; do
  [ -z "$entry" ] && continue
  cam_ref="${entry%%=*}"
  rtsp_url="${entry#*=}"
  start_relay "$cam_ref" "$rtsp_url" &
done
IFS="$OLD_IFS"

wait
