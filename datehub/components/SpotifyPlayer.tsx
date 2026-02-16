"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIFrameAPI) => void;
    __spotifyIframeAPI?: SpotifyIFrameAPI;
    __spotifyIframeAPIReady?: boolean;
  }
}

interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string; height?: string },
    callback: (controller: SpotifyEmbedController) => void
  ): void;
}

interface SpotifyEmbedController {
  loadUri(uri: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  restart(): void;
  seek(seconds: number): void;
  addListener(event: string, callback: (e: any) => void): void;
  destroy(): void;
}

interface PlaybackUpdate {
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
}

interface SpotifyPlayerProps {
  spotifyUri: string;
  onPlaybackUpdate?: (state: PlaybackUpdate) => void;
  onReady?: () => void;
}

export type { PlaybackUpdate, SpotifyEmbedController };

const SCRIPT_SRC = "https://open.spotify.com/embed/iframe-api/v1";

function loadIFrameAPI(): Promise<SpotifyIFrameAPI> {
  if (window.__spotifyIframeAPIReady && window.__spotifyIframeAPI) {
    return Promise.resolve(window.__spotifyIframeAPI);
  }

  return new Promise((resolve) => {
    const prev = window.onSpotifyIframeApiReady;

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      window.__spotifyIframeAPI = IFrameAPI;
      window.__spotifyIframeAPIReady = true;
      prev?.(IFrameAPI);
      resolve(IFrameAPI);
    };

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export default function SpotifyPlayer({
  spotifyUri,
  onPlaybackUpdate,
  onReady,
}: SpotifyPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const onPlaybackUpdateRef = useRef(onPlaybackUpdate);
  const onReadyRef = useRef(onReady);

  onPlaybackUpdateRef.current = onPlaybackUpdate;
  onReadyRef.current = onReady;

  const initController = useCallback((uri: string) => {
    if (!containerRef.current) return;

    loadIFrameAPI().then((IFrameAPI) => {
      if (!containerRef.current) return;

      IFrameAPI.createController(
        containerRef.current,
        { uri, width: "100%", height: "152" },
        (controller) => {
          controllerRef.current = controller;

          controller.addListener("playback_update", (e: any) => {
            onPlaybackUpdateRef.current?.({
              isPaused: e.data.isPaused,
              isBuffering: e.data.isBuffering,
              duration: e.data.duration,
              position: e.data.position,
            });
          });

          controller.addListener("ready", () => {
            onReadyRef.current?.();
          });
        }
      );
    });
  }, []);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.loadUri(spotifyUri);
    } else {
      initController(spotifyUri);
    }
  }, [spotifyUri, initController]);

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden"
    />
  );
}
