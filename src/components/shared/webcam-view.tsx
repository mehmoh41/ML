"use client";

import { WebcamIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function WebcamView({ onStream, onStop, enabled = true }: { onStream?: (stream: MediaStream) => void, onStop?: () => void, enabled?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableWebcam = async () => {
      if (!enabled) {
        if (videoRef.current?.srcObject) {
            const currentStream = videoRef.current.srcObject as MediaStream;
            currentStream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
        return;
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (onStream) {
            onStream(stream);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access the webcam. Please check permissions and try again.");
      }
    };

    enableWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (onStop) {
        onStop();
      }
    };
  }, [onStream, onStop, enabled]);

  if (!enabled) {
    return (
        <div className="relative h-full w-full overflow-hidden bg-black flex flex-col items-center justify-center text-white/80 p-4">
             <WebcamIcon className="mb-4 h-12 w-12" />
            <p className="text-lg font-semibold">Webcam Off</p>
            <p className="text-sm text-center">Enable the webcam to see the live feed.</p>
        </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        data-ai-id="webcam-video-feed"
      />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center text-white">
          <WebcamIcon className="mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold">Webcam Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
