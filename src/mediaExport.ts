import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  WebMOutputFormat,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
} from "mediabunny";

export type ExportContainer = "mp4" | "webm";

type ExportOptions = {
  canvas: HTMLCanvasElement;
  renderFrame: (time: number) => void;
  duration: number;
  fps: number;
  bitrateMbps: number;
  container: ExportContainer;
  audioFile?: File | null;
  isCancelled: () => boolean;
  onProgress: (progress: number) => void;
};

function nextTask(): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, 0));
}

export async function renderExport(options: ExportOptions): Promise<Blob> {
  const {
    canvas, renderFrame, duration, fps, bitrateMbps, container,
    audioFile, isCancelled, onProgress,
  } = options;

  const estimatedVideoBytes = duration * bitrateMbps * 1_000_000 / 8;
  if (estimatedVideoBytes > 80 * 1024 * 1024) {
    throw new Error("This export is estimated to exceed the mobile-safe 80 MB memory budget. Reduce duration or bitrate, or export at 720p.");
  }

  const format = container === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat();
  const videoCodec = await getFirstEncodableVideoCodec(
    format.getSupportedVideoCodecs(),
    { width: canvas.width, height: canvas.height },
  );
  if (!videoCodec) {
    throw new Error(`This browser cannot encode a compatible ${container.toUpperCase()} video at this size. Try WebM or 720p.`);
  }

  let decodedAudio: AudioBuffer | null = null;
  let audioContext: AudioContext | null = null;
  let audioCodec: Awaited<ReturnType<typeof getFirstEncodableAudioCodec>> = null;

  if (audioFile) {
    const supportedAudioCodec = await getFirstEncodableAudioCodec(format.getSupportedAudioCodecs());
    if (!supportedAudioCodec) {
      throw new Error(`This browser cannot encode audio for ${container.toUpperCase()} export. Try WebM or export without music.`);
    }
    audioCodec = supportedAudioCodec;
    audioContext = new AudioContext();
    try {
      decodedAudio = await audioContext.decodeAudioData(await audioFile.arrayBuffer());
    } catch {
      await audioContext.close();
      throw new Error("The selected audio file could not be decoded by this browser.");
    }
  }

  const target = new BufferTarget();
  const output = new Output({ format, target });
  const videoSource = new CanvasSource(canvas, {
    codec: videoCodec,
    quality: new Quality({ bitrate: bitrateMbps * 1_000_000 }),
    latencyMode: "quality",
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate: fps });

  let audioSource: AudioBufferSource | null = null;
  if (decodedAudio && audioCodec) {
    audioSource = new AudioBufferSource({
      codec: audioCodec,
      quality: new Quality({ bitrate: 128_000 }),
    });
    output.addAudioTrack(audioSource);
  }

  let started = false;
  try {
    await output.start();
    started = true;

    if (decodedAudio && audioSource) {
      const frameCount = Math.min(
        decodedAudio.length,
        Math.ceil(duration * decodedAudio.sampleRate),
      );
      const clipped = audioContext!.createBuffer(
        decodedAudio.numberOfChannels,
        frameCount,
        decodedAudio.sampleRate,
      );
      for (let channel = 0; channel < decodedAudio.numberOfChannels; channel++) {
        clipped.copyToChannel(decodedAudio.getChannelData(channel).subarray(0, frameCount), channel);
      }
      await audioSource.add(clipped);
      audioSource.close();
    }

    const totalFrames = Math.ceil(duration * fps);
    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelled()) throw new DOMException("Export cancelled", "AbortError");
      const timestamp = frame / fps;
      renderFrame(timestamp);
      await videoSource.add(timestamp, 1 / fps);
      if (frame % Math.max(1, Math.floor(fps / 2)) === 0 || frame === totalFrames - 1) {
        onProgress((frame + 1) / totalFrames);
        await nextTask();
      }
    }

    videoSource.close();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer) throw new Error("The encoder finished but did not return a video file.");
    return new Blob([buffer], { type: format.mimeType });
  } catch (error) {
    videoSource.close();
    audioSource?.close();
    if (output.state !== "canceled" && output.state !== "finalized") {
      await output.cancel().catch(() => undefined);
    }
    if (!started && output.state === "pending") {
      await output.cancel().catch(() => undefined);
    }
    throw error;
  } finally {
    if (audioContext && audioContext.state !== "closed") {
      await audioContext.close().catch(() => undefined);
    }
  }
}
