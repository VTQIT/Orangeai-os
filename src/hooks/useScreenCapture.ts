import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

export type AudioSource = 'system' | 'microphone' | 'both' | 'none';
export type VideoQuality = '720p' | '1080p' | '4k';

const QUALITY_PRESETS: Record<VideoQuality, { width: number; height: number; bitrate: number }> = {
  '720p': { width: 1280, height: 720, bitrate: 1500000 },
  '1080p': { width: 1920, height: 1080, bitrate: 2500000 },
  '4k': { width: 3840, height: 2160, bitrate: 8000000 },
};

export interface RecordingOptions {
  audioSource: AudioSource;
  folderName: string;
  quality?: VideoQuality;
}

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  screen: boolean;
}

/**
 * Request and verify permissions before capture.
 * Returns which permissions were granted.
 */
async function requestPermissions(needsMic: boolean): Promise<{ granted: boolean; message: string }> {
  try {
    // Check microphone permission if needed
    if (needsMic) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(t => t.stop()); // release immediately
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          return { granted: false, message: 'Microphone permission denied. Please allow microphone access in your browser/device settings.' };
        }
        return { granted: false, message: 'Microphone not available on this device.' };
      }
    }
    return { granted: true, message: 'Permissions granted' };
  } catch {
    return { granted: false, message: 'Failed to request permissions.' };
  }
}

/**
 * Save blob to the user's default Downloads directory.
 * Uses the best available method for the platform.
 */
function saveToDevice(blob: Blob, filename: string, mimeType: string): Promise<{ success: boolean; filename: string }> {
  return new Promise((resolve) => {
    // Method 1: Native share API (best for mobile - lets user choose save location)
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: mimeType })] })) {
      const file = new File([blob], filename, { type: mimeType });
      navigator.share({
        files: [file],
        title: filename,
      }).then(() => {
        resolve({ success: true, filename });
      }).catch(() => {
        // User cancelled share or not supported, fall back to download
        downloadToLocal(blob, filename);
        resolve({ success: true, filename });
      });
      return;
    }

    // Method 2: Direct download (saves to Downloads folder)
    downloadToLocal(blob, filename);
    resolve({ success: true, filename });
  });
}

function downloadToLocal(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Clean up after a delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function useScreenCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);

  const clearPermissionError = useCallback(() => setPermissionError(null), []);

  const takeScreenshot = useCallback(async () => {
    try {
      setPermissionError(null);

      // Hide UI overlays during capture
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: window.devicePixelRatio || 2,
        logging: false,
        ignoreElements: (el) =>
          el.classList?.contains('screen-capture-ignore') ||
          el.classList?.contains('smile-assistant'),
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('Failed to create screenshot');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Screenshot_${timestamp}.png`;

      const result = await saveToDevice(blob, filename, 'image/png');
      return { success: result.success, filename: result.filename };
    } catch (error: any) {
      console.error('Screenshot failed:', error);
      const msg = 'Screenshot failed. Please try again.';
      setPermissionError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const startRecording = useCallback(async (options: RecordingOptions) => {
    try {
      setPermissionError(null);
      chunksRef.current = [];

      // Step 1: Request permissions first
      const needsMic = options.audioSource === 'microphone' || options.audioSource === 'both';
      const permCheck = await requestPermissions(needsMic);
      if (!permCheck.granted) {
        setPermissionError(permCheck.message);
        return { success: false, error: permCheck.message };
      }

      const streams: MediaStream[] = [];

      // Step 2: Request screen capture permission (triggers native OS dialog)
      let displayStream: MediaStream;
      try {
        const preset = QUALITY_PRESETS[options.quality || '1080p'];
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: 30,
            width: { ideal: preset.width },
            height: { ideal: preset.height },
          },
          audio: options.audioSource === 'system' || options.audioSource === 'both',
        });
        streams.push(displayStream);
      } catch (e: any) {
        if (e.name === 'NotAllowedError') {
          const msg = 'Screen recording permission denied. Please allow screen capture when prompted.';
          setPermissionError(msg);
          return { success: false, error: msg, cancelled: true };
        }
        throw e;
      }

      // Step 3: Get microphone stream if needed
      let micStream: MediaStream | null = null;
      if (needsMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          streams.push(micStream);
        } catch (e) {
          console.warn('Microphone access denied during recording:', e);
        }
      }

      // Step 4: Combine tracks
      const combinedTracks: MediaStreamTrack[] = [...displayStream.getVideoTracks()];

      if (options.audioSource !== 'none') {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        const systemAudioTracks = displayStream.getAudioTracks();
        if (systemAudioTracks.length > 0) {
          const systemSource = audioContext.createMediaStreamSource(new MediaStream(systemAudioTracks));
          systemSource.connect(destination);
        }

        if (micStream) {
          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(destination);
        }

        if (destination.stream.getAudioTracks().length > 0) {
          combinedTracks.push(...destination.stream.getAudioTracks());
        }
      }

      const combinedStream = new MediaStream(combinedTracks);
      streamsRef.current = streams;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: QUALITY_PRESETS[options.quality || '1080p'].bitrate,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Recording_${timestamp}.webm`;

        // Save to device's default download location
        await saveToDevice(blob, filename, 'video/webm');

        // Cleanup all streams
        streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
        streamsRef.current = [];
      };

      // Auto-stop when user ends screen share via OS controls
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      return { success: true };
    } catch (error: any) {
      console.error('Screen recording failed:', error);
      const msg = error.name === 'NotAllowedError'
        ? 'Permission denied. Please allow screen recording in your device settings.'
        : 'Screen recording is not supported on this device/browser.';
      setPermissionError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    permissionError,
    clearPermissionError,
    takeScreenshot,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
