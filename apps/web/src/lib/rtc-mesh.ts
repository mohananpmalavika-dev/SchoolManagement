import { collaborationClient, LiveMember, LiveSession } from './collaboration-client';
type Peer = {
  pc: RTCPeerConnection;
  makingOffer: boolean;
  ignoreOffer: boolean;
  settingAnswer: boolean;
  pending: RTCIceCandidateInit[];
  videoSender?: RTCRtpSender;
  queue: Promise<unknown>;
  restarts: number;
};
/** Small-group WebRTC mesh. Server requests carry authorized SDP/ICE, never media. */
export class RtcMesh {
  private peers = new Map<string, Peer>();
  private closed = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private cursor = 0;
  private failures = 0;
  private videoTrack: MediaStreamTrack | null;
  constructor(
    private session: LiveSession,
    private local: MediaStream,
    private callbacks: {
      members: (members: LiveMember[]) => void;
      stream: (id: string, stream: MediaStream | null) => void;
      state: (id: string, state: RTCPeerConnectionState) => void;
      error: (message: string) => void;
    }
  ) {
    this.videoTrack = local.getVideoTracks()[0] || null;
  }
  start() {
    this.updateMembers(this.session.members);
    void this.poll();
  }
  private send(
    id: string,
    peer: Peer,
    signal: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }
  ) {
    peer.queue = peer.queue
      .then(() => {
        if (!this.closed) return collaborationClient.signal(this.session, id, signal);
      })
      .catch(() => {
        if (!this.closed)
          this.callbacks.error('Calling signaling failed. Leave and rejoin the call.');
      });
    return peer.queue;
  }
  private create(id: string) {
    const pc = new RTCPeerConnection({ iceServers: this.session.iceServers || [] });
    const peer: Peer = {
      pc,
      makingOffer: false,
      ignoreOffer: false,
      settingAnswer: false,
      pending: [],
      queue: Promise.resolve(),
      restarts: 0,
    };
    this.peers.set(id, peer);
    pc.onicecandidate = (event) => {
      if (event.candidate) void this.send(id, peer, { candidate: event.candidate.toJSON() });
    };
    pc.ontrack = (event) => {
      if (!this.closed)
        this.callbacks.stream(id, event.streams[0] || new MediaStream([event.track]));
    };
    pc.onconnectionstatechange = () => {
      if (this.closed) return;
      this.callbacks.state(id, pc.connectionState);
      if (pc.connectionState === 'failed' && peer.restarts++ < 2) pc.restartIce();
    };
    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        if (!this.closed && pc.localDescription)
          await this.send(id, peer, { description: pc.localDescription.toJSON() });
      } catch {
        if (!this.closed)
          this.callbacks.error('Media negotiation failed. Leave and rejoin the call.');
      } finally {
        peer.makingOffer = false;
      }
    };
    this.local.getAudioTracks().forEach((track) => pc.addTrack(track, this.local));
    if (this.videoTrack) peer.videoSender = pc.addTrack(this.videoTrack, this.local);
    return peer;
  }
  private updateMembers(members: LiveMember[]) {
    this.callbacks.members(members);
    const active = new Set(
      members.filter((m) => m.id !== this.session.participantId).map((m) => m.id)
    );
    for (const [id, peer] of Array.from(this.peers.entries()))
      if (!active.has(id)) {
        peer.pc.close();
        this.peers.delete(id);
        this.callbacks.stream(id, null);
      }
    for (const id of Array.from(active)) if (!this.peers.has(id)) this.create(id);
  }
  private async receive(
    from: string,
    signal: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }
  ) {
    const peer = this.peers.get(from);
    if (!peer || this.closed) return;
    const pc = peer.pc;
    if (signal.description) {
      const description = signal.description,
        ready = !peer.makingOffer && (pc.signalingState === 'stable' || peer.settingAnswer);
      peer.ignoreOffer =
        this.session.participantId < from && description.type === 'offer' && !ready;
      if (peer.ignoreOffer) return;
      peer.settingAnswer = description.type === 'answer';
      try {
        await pc.setRemoteDescription(description);
      } finally {
        peer.settingAnswer = false;
      }
      for (const candidate of peer.pending.splice(0)) await pc.addIceCandidate(candidate);
      if (description.type === 'offer') {
        await pc.setLocalDescription();
        if (pc.localDescription)
          await this.send(from, peer, { description: pc.localDescription.toJSON() });
      }
    } else if (signal.candidate && !peer.ignoreOffer) {
      if (pc.remoteDescription) await pc.addIceCandidate(signal.candidate);
      else peer.pending.push(signal.candidate);
    }
  }
  private async poll() {
    if (this.closed) return;
    try {
      const data = await collaborationClient.poll(this.session, this.cursor, 0);
      if (this.closed) return;
      this.failures = 0;
      this.updateMembers(data.members);
      for (const event of data.signals) {
        try {
          await this.receive(event.from, event.signal);
        } catch {
          if (!this.closed)
            this.callbacks.error('A media connection could not be negotiated. Leave and rejoin.');
        }
      }
      this.cursor = data.cursor;
    } catch (error) {
      if (this.closed) return;
      if ([401, 403, 404, 410].includes((error as any)?.response?.status) || ++this.failures >= 3) {
        this.callbacks.error(
          'Call connection or access was lost. Your camera and microphone have stopped. Rejoin to continue.'
        );
        return;
      }
    }
    if (!this.closed) this.timer = setTimeout(() => void this.poll(), 1200);
  }
  async replaceVideo(track: MediaStreamTrack | null) {
    this.videoTrack = track;
    await Promise.all(
      Array.from(this.peers.values()).map(async (peer) => {
        if (peer.videoSender) await peer.videoSender.replaceTrack(track);
        else if (track) peer.videoSender = peer.pc.addTrack(track, this.local);
      })
    );
  }
  close() {
    this.closed = true;
    clearTimeout(this.timer);
    for (const peer of Array.from(this.peers.values())) {
      peer.pc.ontrack = null;
      peer.pc.onicecandidate = null;
      peer.pc.onnegotiationneeded = null;
      peer.pc.close();
    }
    this.peers.clear();
  }
}
