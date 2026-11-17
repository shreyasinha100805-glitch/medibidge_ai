import React, { useEffect, useRef, useState } from 'react';
import { IconCamera } from './Icons';

const MAX_CAPTURE_EDGE = 1600;

const getCameraError = (error) => {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Camera access was denied. Allow camera access in your browser settings, or upload an image instead.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'No camera was found on this device. Upload an image instead.';
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'The camera is busy or unavailable. Close other apps using it, or upload an image instead.';
  }
  return 'Could not open the camera. Check your browser permissions, or upload an image instead.';
};

export const CameraCapture = ({ onCapture, disabled = false }) => {
  const videoRef = useRef(null);
  const mountedRef = useRef(true);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return undefined;

    video.srcObject = stream;
    video.play().catch(() => {
      setCameraError('Could not start the camera preview. Upload an image instead.');
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  };

  const startCamera = async () => {
    if (disabled || starting) return;
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(window.isSecureContext
        ? 'Camera access is not supported by this browser. Upload an image instead.'
        : 'Camera access requires HTTPS or localhost. Open the secure site, or upload an image instead.');
      return;
    }

    setStarting(true);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (!mountedRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      setStream(nextStream);
    } catch (error) {
      if (mountedRef.current) setCameraError(getCameraError(error));
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight || capturing) {
      setCameraError('The camera is not ready yet. Wait for the preview, then try again.');
      return;
    }

    setCapturing(true);
    setCameraError('');
    const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');

    if (!context) {
      setCapturing(false);
      setCameraError('Could not capture the camera image. Please try again or upload an image.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCapturing(false);
        setCameraError('Could not capture the camera image. Please try again or upload an image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          setCapturing(false);
          setCameraError('Could not read the camera image. Please try again or upload an image.');
          return;
        }
        stopCamera();
        setCapturing(false);
        onCapture({
          dataUrl: reader.result,
          mimeType: 'image/jpeg',
          fileName: `camera-capture-${Date.now()}.jpg`,
        });
      };
      reader.onerror = () => {
        setCapturing(false);
        setCameraError('Could not read the camera image. Please try again or upload an image.');
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.86);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {cameraError && (
        <p role="alert" style={{ color: '#fb7185', fontSize: '0.82rem', margin: 0 }}>
          {cameraError}
        </p>
      )}

      {stream ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Live camera preview"
            style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: '12px', background: '#020617' }}
          />
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button type="button" onClick={captureImage} disabled={disabled || capturing} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <IconCamera className="w-5 h-5" color="#ffffff" />
              {capturing ? 'Capturing…' : 'Capture photo'}
            </button>
            <button type="button" onClick={stopCamera} disabled={capturing} className="btn-ghost" style={{ justifyContent: 'center' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startCamera} disabled={disabled || starting} className="btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>
          <IconCamera className="w-5 h-5" color="currentColor" />
          {starting ? 'Opening camera…' : 'Use camera'}
        </button>
      )}
    </div>
  );
};
