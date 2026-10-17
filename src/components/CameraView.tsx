import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  Zap,
  ZapOff,
  Sparkles,
  Maximize2,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';
import { SAMPLE_EXERCISES, SampleExercise, generateSampleExerciseImage } from '../data/sampleExercises';

interface CameraViewProps {
  onCaptureImage: (imageBase64: string, userHint?: string) => void;
  isLoading: boolean;
  onOpenDrawMode: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCaptureImage,
  isLoading,
  onOpenDrawMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);
  const [userHint, setUserHint] = useState<string>('');
  const [showHintInput, setShowHintInput] = useState<boolean>(false);
  const [frameSize, setFrameSize] = useState<'compact' | 'medium' | 'wide'>('medium');

  // Start camera stream
  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        setCameraError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraActive(true);
        }

        // Check if torch/flashlight is supported on device
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (err: any) {
        console.warn('Camera access unavailable:', err);
        if (mounted) {
          setIsCameraActive(false);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Permiso de cámara denegado. Puedes subir una foto de tu galería o probar los ejercicios de muestra abajo.'
              : 'No se pudo iniciar la cámara web. Puedes subir una foto o usar los ejercicios de muestra.'
          );
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const newStatus = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newStatus }],
      });
      setTorchOn(newStatus);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Switch between back/front camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture photo from live video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger haptic feedback if available on mobile
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    // Trigger visual shutter flash
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.92);
    onCaptureImage(base64, userHint);
  };

  // Upload photo from device gallery / files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        onCaptureImage(result, userHint);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load sample exercise for instant testing
  const handleSelectSample = (sample: SampleExercise) => {
    const sampleImage = generateSampleExerciseImage(sample);
    onCaptureImage(sampleImage, sample.prompt);
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden select-none">
      {/* Visual Flash effect on capture */}
      {flashAnimation && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Top Camera Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-xs font-semibold text-slate-200 shadow-md">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            Escáner IA
          </span>
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full backdrop-blur-md transition ${
                torchOn
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                  : 'bg-black/40 text-slate-200 border border-white/10 hover:bg-black/60'
              }`}
              title="Linterna"
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Frame size selector */}
          <div className="flex items-center bg-black/50 backdrop-blur-md rounded-full p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => setFrameSize('compact')}
              className={`px-2 py-0.5 rounded-full transition ${
                frameSize === 'compact' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300'
              }`}
            >
              1 Línea
            </button>
            <button
              onClick={() => setFrameSize('medium')}
              className={`px-2 py-0.5 rounded-full transition ${
                frameSize === 'medium' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300'
              }`}
            >
              Medio
            </button>
            <button
              onClick={() => setFrameSize('wide')}
              className={`px-2 py-0.5 rounded-full transition ${
                frameSize === 'wide' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300'
              }`}
            >
              Página
            </button>
          </div>

          <button
            onClick={switchCamera}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-slate-200 hover:bg-black/60 transition"
            title="Girar cámara"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport: Live Camera or Fallback */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Camera Permission / Error Fallback Notice */}
        {(!isCameraActive || cameraError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Escáner Listo</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              {cameraError || 'Activa la cámara para tomar fotos a tus ejercicios de matemáticas o sube una imagen de tu galería.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <ImageIcon className="w-4 h-4" />
                Subir foto de galería
              </button>
              <button
                onClick={onOpenDrawMode}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95"
              >
                ✏️ Dibujar
              </button>
            </div>
          </div>
        )}

        {/* Viewfinder Overlays & Reticle (When camera active) */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
            {/* Darkened mask around the crop area */}
            <div
              className={`relative border-2 border-indigo-400/80 rounded-2xl transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden ${
                frameSize === 'compact'
                  ? 'w-[90%] max-w-md h-32'
                  : frameSize === 'medium'
                  ? 'w-[88%] max-w-md h-64'
                  : 'w-[94%] max-w-lg h-96'
              }`}
            >
              {/* Corner Targets */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-sm" />

              {/* Faint Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-6 h-px bg-white" />
                <div className="h-6 w-px bg-white -ml-3" />
              </div>

              {/* Animated Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-scan-laser" />

              {/* Floating Help Badge */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white/90 font-medium border border-white/10 whitespace-nowrap">
                Enfoca la fórmula o problema en este marco
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Optional Hint drawer */}
      {showHintInput && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 z-30">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userHint}
              onChange={(e) => setUserHint(e.target.value)}
              placeholder="Instrucción opcional (ej: despejar x, calcular por partes...)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => setShowHintInput(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Instant Sample Exercises Strip */}
      <div className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 z-30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Ejercicios de prueba rápida (1 toque):
          </span>
          <button
            onClick={() => setShowHintInput(!showHintInput)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium"
          >
            <HelpCircle className="w-3 h-3" />
            {showHintInput ? 'Ocultar nota' : '+ Añadir nota'}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SAMPLE_EXERCISES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              disabled={isLoading}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition group active:scale-95 disabled:opacity-50"
            >
              <div className="text-[10px] text-indigo-400 font-semibold group-hover:text-indigo-300">
                {sample.topic}
              </div>
              <div className="text-xs font-mono font-medium text-slate-200">
                {sample.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Shutter & Action Bar */}
      <div className="bg-black/90 backdrop-blur-lg border-t border-white/10 px-6 py-5 flex items-center justify-around z-30">
        {/* Gallery / File Picker */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
          title="Subir imagen"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-[10px] font-medium text-slate-400">Galería</span>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Main Camera Shutter Button */}
        <div className="relative">
          <button
            onClick={capturePhoto}
            disabled={isLoading}
            className={`w-20 h-20 rounded-full p-1 border-4 transition-transform active:scale-90 flex items-center justify-center shadow-xl ${
              isLoading
                ? 'border-indigo-400 animate-spin opacity-80 cursor-wait'
                : 'border-white hover:border-indigo-400'
            }`}
            title="Tomar foto y resolver"
          >
            <div
              className={`w-full h-full rounded-full transition ${
                isLoading
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-tr from-white via-indigo-100 to-indigo-300 hover:brightness-110 shadow-inner'
              }`}
            />
          </button>
          {isLoading && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-bounce">
              Resolviendo...
            </div>
          )}
        </div>

        {/* Draw on Canvas button */}
        <button
          onClick={onOpenDrawMode}
          disabled={isLoading}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
          title="Dibujar en pizarra"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md">
            <span className="text-lg">✏️</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">Dibujar</span>
        </button>
      </div>
    </div>
  );
};

export default CameraView;
