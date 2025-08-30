import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Square, Play, Pause, Save, Info } from 'lucide-react';
import Button from './Button';
import { useUploadStore } from '../../stores/uploadStore';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (uniqueId: string, url: string) => void;
  title?: string;
}

const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({ isOpen, onClose, onSaved, title = 'Record Your Name' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recordMime, setRecordMime] = useState<string | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { uploadAudio, isUploading, uploads } = useUploadStore();

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when closed
      stopAll();
      setChunks([]);
      setAudioUrl(null);
      setMicError(null);
      setPermissionState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // On open, try to read microphone permission state (if supported)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const checkPerm = async () => {
      try {
        type NavWithPermissions = Navigator & {
          permissions?: { query: (opts: { name: 'microphone' }) => Promise<PermissionStatus> };
        };
        const nav = navigator as unknown as NavWithPermissions;
        if (nav.permissions?.query) {
          const status = await nav.permissions.query({ name: 'microphone' });
          if (!cancelled) setPermissionState(status.state);
          status.onchange = () => {
            if (!cancelled) setPermissionState(status.state);
          };
        } else {
          setPermissionState('unsupported');
        }
      } catch {
        setPermissionState('unsupported');
      }
    };
    checkPerm();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      setMicError(null);
      // Basic support checks
      if (typeof window === 'undefined') {
        setMicError('Recording is not supported in this environment.');
        return;
      }
      // Narrowing guard for MediaRecorder support
      type WindowWithMediaRecorder = Window & { MediaRecorder?: typeof MediaRecorder };
      const w = window as unknown as WindowWithMediaRecorder;
      if (typeof w.MediaRecorder === 'undefined') {
        setMicError('Your browser does not support audio recording (MediaRecorder API). Please use the latest Chrome, Edge, or Firefox.');
        return;
      }
      // Stop any previous tracks before requesting a new stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      // getUserMedia requires a secure context unless localhost; surface that early
      const isLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
      if (!window.isSecureContext && !isLocalhost) {
        setMicError('Microphone requires HTTPS. Please access this page over https or use localhost during development.');
        return;
      }

      // Prefer some basic audio processing; if it fails, fallback to minimal constraints
      const constraintsA: MediaStreamConstraints = { audio: { echoCancellation: true, noiseSuppression: true } as MediaTrackConstraints };
      const constraintsB: MediaStreamConstraints = { audio: true };
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsA);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(constraintsB);
      }
      if (!stream) throw new Error('Unable to obtain microphone stream');
      streamRef.current = stream;
      // Pick a supported audio mime type
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/webm',
      ];
      const hasIsTypeSupported = typeof MediaRecorder !== 'undefined' && typeof (MediaRecorder as unknown as { isTypeSupported?: (mt: string) => boolean }).isTypeSupported === 'function';
      const supported = candidates.find((mt) => (hasIsTypeSupported ? (MediaRecorder as unknown as { isTypeSupported: (mt: string) => boolean }).isTypeSupported(mt) : false));
      if (supported) setRecordMime(supported);

      const options: MediaRecorderOptions = supported ? { mimeType: supported } : {};
      const recorder = new MediaRecorder(stream, options);
      const localChunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          localChunks.push(e.data);
        }
      };
      recorder.onstop = () => {
        setChunks(localChunks);
        // Prefer the selected mime type, else fall back to first chunk type if Blob, or webm
        const first = localChunks[0];
        const firstType = first instanceof Blob ? first.type : undefined;
        const inferredType = recordMime || firstType || 'audio/webm';
        const blob = new Blob(localChunks, { type: inferredType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (e: unknown) {
      const error = e as { name?: string; message?: string };
      console.error('Microphone access denied or error:', error);
      const name: string = error?.name || '';
      switch (name) {
        case 'NotAllowedError':
        case 'SecurityError':
          setMicError('Microphone access was blocked. In Microsoft Edge, click the lock icon in the address bar → Permissions → Allow Microphone, then reload. Also check macOS System Settings → Privacy & Security → Microphone and ensure Edge is enabled.');
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          setMicError('No microphone was found. Please connect a microphone or ensure it is not disabled.');
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          setMicError('Your microphone is busy. Close any other app using the mic (Zoom/Teams/Meet/QuickTime) and try again.');
          break;
        case 'OverconstrainedError':
          setMicError('The selected audio device does not meet the requested constraints. Try another device or default settings.');
          break;
        default:
          setMicError(error?.message || 'Unable to access microphone. Please check permissions.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const stopAll = () => {
    try {
      if (isRecording) stopRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    } catch (e) {
      console.warn('Error during cleanup', e);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  const handleSave = async () => {
    console.log('[Recorder] Save clicked');
    if (isRecording) {
      console.warn('[Recorder] Cannot save while recording.');
      setMicError('Please stop the recording before saving.');
      return;
    }
    if (!audioUrl || !chunks.length) {
      console.warn('[Recorder] No audio captured yet.');
      setMicError('No audio captured. Please record and try again.');
      return;
    }
    // Convert chunks to a File for upload
    // Decide extension based on mime type
  const first = chunks[0];
  const firstType = first instanceof Blob ? first.type : undefined;
  const mime = recordMime || firstType || 'audio/webm';
    const ext = mime.startsWith('audio/ogg') ? '.ogg' : mime.startsWith('audio/mp4') ? '.m4a' : '.webm';
    const blob = new Blob(chunks, { type: mime });
    const file = new File([blob], `pronunciation-${Date.now()}${ext}`, { type: mime });
    try {
      setIsSaving(true);
      console.log('[Recorder] Uploading audio… size:', blob.size);
      const uniqueId = await uploadAudio(file);
      if (!uniqueId || typeof uniqueId !== 'string') {
        throw new Error('Upload did not return a valid file id.');
      }
      console.log('[Recorder] Upload complete. id:', uniqueId);
      // Build a URL where audio can be fetched from backend static folder
      // Backend saves to static/audio/<uniqueId>.<ext>
  // Do not append extension here; backend id already includes the extension if present
  const url = `/api/static/audio/${uniqueId}`;
      onSaved(uniqueId, url);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      console.error('Upload failed:', e);
      alert(msg);
      setMicError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentUpload = uploads[uploads.length - 1];
  const progress = currentUpload?.progress ?? 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Prevent closing while saving/uploading to avoid accidental dismissal
        if (isSaving || isUploading) {
          e.stopPropagation();
          return;
        }
        onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <Mic className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              This recording helps the Pujari pronounce your name correctly. Please record in a quiet environment and speak clearly. The same pronunciation will be used by the Pujari during the puja.
            </p>
          </div>

          {/* Recorder Controls */}
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <Button onClick={(e) => { e.stopPropagation(); startRecording(); }} variant="outline">
                <Mic className="w-4 h-4 mr-2" /> Start Recording
              </Button>
            ) : (
              <Button onClick={(e) => { e.stopPropagation(); stopRecording(); }} variant="outline" className="text-red-600">
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            )}

            <Button onClick={(e) => { e.stopPropagation(); togglePlayback(); }} variant="outline" disabled={!audioUrl || isRecording}>
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" /> Play
                </>
              )}
            </Button>

            <Button onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={!audioUrl || isRecording || isSaving}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>

          {/* Hidden audio element for playback */}
          <audio ref={audioRef} src={audioUrl ?? undefined} />

          {/* Permission status and errors */}
          {permissionState && permissionState !== 'unsupported' && (
            <p className="text-xs text-gray-500">Microphone permission: {permissionState}</p>
          )}
          {micError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{micError}</div>
          )}

          {/* Upload progress */}
          {(isUploading || isSaving) && (
            <div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-2 bg-orange-500 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{isSaving ? 'Preparing upload…' : 'Uploading...'} {isUploading ? `${progress}%` : ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderModal;
