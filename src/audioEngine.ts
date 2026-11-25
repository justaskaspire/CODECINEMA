/**
 * CODECINEMA Web Audio engine.
 * Decodes local audio and builds an export-ready AudioBuffer with timeline fades.
 * All processing stays on-device; no media is uploaded.
 */
export type AudioEnvelopeOptions = {
  startSeconds?: number;
  endSeconds?: number;
  durationSeconds: number;
  volume?: number;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
};

export async function decodeLocalAudio(file: File): Promise<{ context: AudioContext; buffer: AudioBuffer }> {
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    return { context, buffer };
  } catch {
    await context.close().catch(() => undefined);
    throw new Error("The selected audio file could not be decoded by this browser.");
  }
}

export function createAudioEnvelopeBuffer(
  context: BaseAudioContext,
  source: AudioBuffer,
  options: AudioEnvelopeOptions
): AudioBuffer {
  const sampleRate = source.sampleRate;
  const startFrame = Math.max(0, Math.min(source.length, Math.floor(Math.max(0, options.startSeconds ?? 0) * sampleRate)));
  const requestedEnd = options.endSeconds && options.endSeconds > 0
    ? Math.floor(options.endSeconds * sampleRate)
    : source.length;
  const endFrame = Math.max(startFrame, Math.min(source.length, requestedEnd));
  const frameCount = Math.min(endFrame - startFrame, Math.ceil(Math.max(0, options.durationSeconds) * sampleRate));
  if (frameCount <= 0) throw new Error("Audio trim range is empty. Set TRIM OUT after TRIM IN.");

  const output = context.createBuffer(source.numberOfChannels, frameCount, sampleRate);
  const fadeInFrames = Math.max(0, Math.floor(Math.max(0, options.fadeInSeconds ?? 0) * sampleRate));
  const fadeOutFrames = Math.max(0, Math.floor(Math.max(0, options.fadeOutSeconds ?? 0) * sampleRate));
  const volume = Math.max(0, Math.min(1.5, options.volume ?? 1));

  for (let channel = 0; channel < source.numberOfChannels; channel++) {
    const input = source.getChannelData(channel).subarray(startFrame, startFrame + frameCount);
    const target = output.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      const fadeIn = fadeInFrames > 0 ? Math.min(1, i / fadeInFrames) : 1;
      const fadeOut = fadeOutFrames > 0 ? Math.min(1, (frameCount - 1 - i) / fadeOutFrames) : 1;
      target[i] = input[i] * volume * Math.max(0, Math.min(fadeIn, fadeOut));
    }
  }
  return output;
}
