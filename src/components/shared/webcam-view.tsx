"use client";

import { WebcamIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function WebcamView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
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
