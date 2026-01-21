export const toggleMic = (stream: MediaStream, enabled?: boolean) => {
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) return;

  audioTracks.forEach(track => {
    track.enabled = enabled ?? !track.enabled;
  });
};

export const toggleCamera = (stream: MediaStream, enabled?: boolean) => {
  const videoTracks = stream.getVideoTracks();
  if (!videoTracks.length) return;

  videoTracks.forEach(track => {
    track.enabled = enabled ?? !track.enabled;
  });
};