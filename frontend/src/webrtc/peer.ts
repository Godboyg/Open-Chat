const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

class PeerService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private remoteVideoEl: HTMLVideoElement | null = null;

  createPeer(): RTCPeerConnection {
    if (!this.pc) {
      this.pc = new RTCPeerConnection(rtcConfig);
    }
    return this.pc;
  }

  async getMedia(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    return this.localStream;
  }

  addTracks(): void {
    if (!this.pc || !this.localStream) return;

    this.localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, this.localStream!);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("Peer not created");
    if (this.pc.signalingState !== "stable") {
      console.warn("Cannot create offer in state:", this.pc.signalingState);
      return this.pc.localDescription!;
    }
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("Peer not created");
    if (this.pc.signalingState !== "stable") {
      console.warn("Offer already handled, state:", this.pc.signalingState);
      return this.pc.localDescription!;
    }

    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    if (this.pc.signalingState !== "have-local-offer") {
      console.warn(
        "Ignoring answer in state:",
        this.pc.signalingState
      );
      return;
    }

    await this.pc.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  }

  toggleCamera(enabled: boolean): void {
  if (!this.localStream) return;

  this.localStream.getVideoTracks().forEach(track => {
    track.enabled = enabled;
  });
}

  setRemoteVideoElement(el: HTMLVideoElement): void {
     this.remoteVideoEl = el;
  }

  toggleSpeaker(enabled: boolean): void {
    if (!this.remoteVideoEl) return;

    this.remoteVideoEl.muted = !enabled;
  }

  toggleMic(enabled: boolean): void {
  if (!this.localStream) return;

  this.localStream.getAudioTracks().forEach(track => {
    track.enabled = enabled;
  });
}
  
  onRemoteStream(callback: (stream: MediaStream) => void): void {
    if (!this.pc) return;

    this.remoteStream = new MediaStream();
    this.pc.ontrack = (event: RTCTrackEvent) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream!.addTrack(track);
      });
      callback(this.remoteStream!);
    };
  }

  onIce(callback: (candidate: RTCIceCandidate) => void): void {
    if (!this.pc) return;

    this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  addIce(candidate: RTCIceCandidateInit): void {
    if (!this.pc) return;
    this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
  }

  close(): void {
    this.pc?.close();
    this.pc = null;

    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.remoteStream = null;
  }
}

const peer = new PeerService();
export default peer;