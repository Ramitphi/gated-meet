export const getTrack = (track: MediaStreamTrack): MediaStream => {
  const stream = new MediaStream();
  stream.addTrack(track);
  return stream;
};
