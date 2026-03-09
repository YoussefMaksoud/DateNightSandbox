"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SpotifyPlayer, { type PlaybackUpdate } from "@/components/SpotifyPlayer";
import Link from "next/link";
import { Music, Headphones } from "lucide-react";

// --- Types ---

interface SpotifyTrack {
  spotifyTrackId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumName: string;
  albumArt: string;
  durationMs: number;
  previewUrl: string;
}

interface PlaylistTrack {
  id: string;
  spotifyTrackId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt: string;
  durationMs: number;
  addedBy: string;
}

interface PlaybackState {
  trackId: string;
  spotifyUri: string;
  isPlaying: boolean;
  progressMs: number;
  updatedBy: string;
  updatedAt: string;
}

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// --- API helpers ---

async function fetchSpotifyStatus(): Promise<boolean> {
  const res = await fetch("/api/spotify/status");
  if (!res.ok) return false;
  const data = await res.json();
  return data.connected;
}

async function fetchSpotifyAuthUrl(): Promise<string | null> {
  const res = await fetch("/api/spotify/auth-url");
  if (!res.ok) return null;
  const data = await res.json();
  return data.url;
}

async function searchSpotifyTracks(q: string): Promise<SpotifyTrack[]> {
  const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks || [];
}

async function fetchPlaylistTracks(): Promise<PlaylistTrack[]> {
  const res = await fetch("/api/playlist/tracks?roomId=default-room");
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks || [];
}

async function addTrackToPlaylist(spotifyTrackId: string): Promise<boolean> {
  const res = await fetch("/api/playlist/tracks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spotifyTrackId }),
  });
  return res.ok;
}

async function removeTrackFromPlaylist(trackId: string): Promise<boolean> {
  const res = await fetch(`/api/playlist/tracks/${trackId}`, { method: "DELETE" });
  return res.ok;
}

async function fetchPlaybackState(): Promise<PlaybackState | null> {
  const res = await fetch("/api/playlist/playback?roomId=default-room");
  if (!res.ok) return null;
  return res.json();
}

async function updatePlaybackState(
  state: Pick<PlaybackState, "trackId" | "spotifyUri" | "isPlaying" | "progressMs">
): Promise<boolean> {
  const res = await fetch("/api/playlist/playback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  return res.ok;
}

async function pollPlayback(since: string): Promise<{ changed: boolean; state?: PlaybackState }> {
  const res = await fetch(`/api/playlist/playback/poll?roomId=default-room&since=${encodeURIComponent(since)}`);
  if (!res.ok) return { changed: false };
  return res.json();
}

// --- Component ---

export default function MusicLoungePage() {
  const { user, isLoaded } = useUser();

  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);

  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(true);

  const [currentTrack, setCurrentTrack] = useState<PlaylistTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [lastPollTime, setLastPollTime] = useState(new Date().toISOString());

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Data fetching ---

  const loadPlaylist = useCallback(async () => {
    setPlaylistLoading(true);
    const tracks = await fetchPlaylistTracks();
    setPlaylist(tracks);
    setPlaylistLoading(false);
  }, []);

  const loadPlaybackState = useCallback(async () => {
    const state = await fetchPlaybackState();
    if (state && state.trackId) {
      setIsPlaying(state.isPlaying);
      setLastPollTime(state.updatedAt || new Date().toISOString());
      const tracks = await fetchPlaylistTracks();
      setPlaylist(tracks);
      const match = tracks.find((t) => t.id === state.trackId);
      if (match) setCurrentTrack(match);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchSpotifyStatus().then(setSpotifyConnected);
    loadPlaylist();
    loadPlaybackState();
  }, [isLoaded, user, loadPlaylist, loadPlaybackState]);

  // --- Debounced search ---

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchSpotifyTracks(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // --- Sync polling ---

  useEffect(() => {
    if (!isLoaded || !user) return;
    const interval = setInterval(async () => {
      const result = await pollPlayback(lastPollTime);
      if (result.changed && result.state && result.state.updatedBy !== user.id) {
        setIsPlaying(result.state.isPlaying);
        setLastPollTime(result.state.updatedAt || new Date().toISOString());
        const tracks = await fetchPlaylistTracks();
        setPlaylist(tracks);
        const match = tracks.find((t) => t.id === result.state!.trackId);
        if (match) setCurrentTrack(match);
      } else if (result.changed && result.state) {
        setLastPollTime(result.state.updatedAt || new Date().toISOString());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoaded, user, lastPollTime]);

  // --- Auto-advance ---

  function scheduleAutoAdvance(remainingMs: number) {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (remainingMs <= 0 || playlist.length <= 1) return;
    autoAdvanceTimerRef.current = setTimeout(() => {
      if (!currentTrack) return;
      const idx = playlist.findIndex((t) => t.id === currentTrack.id);
      const nextIdx = idx >= playlist.length - 1 ? 0 : idx + 1;
      handlePlayTrack(playlist[nextIdx]);
    }, remainingMs + 500);
  }

  function handlePlaybackUpdate(state: PlaybackUpdate) {
    setPlaybackPosition(state.position);
    setPlaybackDuration(state.duration);
    setIsPlaying(!state.isPaused);
    if (!state.isPaused && state.duration > 0) {
      const remaining = state.duration - state.position;
      if (remaining > 0 && remaining < state.duration) {
        scheduleAutoAdvance(remaining);
      }
    } else if (state.isPaused && autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // --- Handlers ---

  async function handleConnectSpotify() {
    const url = await fetchSpotifyAuthUrl();
    if (url) window.location.href = url;
  }

  async function handleAddTrack(track: SpotifyTrack) {
    const ok = await addTrackToPlaylist(track.spotifyTrackId);
    if (ok) {
      setSearchQuery("");
      setSearchResults([]);
      await loadPlaylist();
    }
  }

  async function handleRemoveTrack(trackId: string) {
    const ok = await removeTrackFromPlaylist(trackId);
    if (ok) {
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      await loadPlaylist();
    }
  }

  async function handlePlayTrack(track: PlaylistTrack) {
    setCurrentTrack(track);
    setIsPlaying(true);
    setPlaybackPosition(0);
    setPlaybackDuration(track.durationMs);
    await updatePlaybackState({
      trackId: track.id,
      spotifyUri: track.spotifyUri,
      isPlaying: true,
      progressMs: 0,
    });
    setLastPollTime(new Date().toISOString());
  }

  function getNextTrack(): PlaylistTrack | null {
    if (!currentTrack || playlist.length <= 1) return null;
    const idx = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = idx >= playlist.length - 1 ? 0 : idx + 1;
    return playlist[nextIdx];
  }

  const progressPercent = playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0;

  // --- Render ---

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-rose-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-pink-500/[0.03] blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/map" className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Map
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-lg font-bold"><Music className="h-5 w-5 inline" /> Music Lounge</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Music Lounge</h1>
          <p className="mt-2 text-zinc-500">Listen to music together</p>
        </div>

        {/* Spotify connect */}
        {!spotifyConnected ? (
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1DB954]/10">
                <Headphones className="h-10 w-10 text-[#1DB954]" />
              </div>
              <div>
                <p className="text-lg font-semibold">Connect Spotify</p>
                <p className="mt-1 text-sm text-zinc-500">Link your Spotify account to search and play music together</p>
              </div>
              <Button onClick={handleConnectSpotify} className="bg-[#1DB954] hover:bg-[#1aa34a]">
                Connect Spotify
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left: Search + Playlist */}
            <div className="flex flex-col gap-5">
              {/* Search */}
              <div className="relative">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a song…"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:border-rose-500/40 focus:outline-none focus:ring-1 focus:ring-rose-500/20"
                  />
                </div>

                {/* Search results dropdown */}
                {searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0f0f13] p-1.5 shadow-2xl">
                    {searching ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500/30 border-t-rose-500" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <p className="py-4 text-center text-xs text-zinc-600">No results</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {searchResults.map((track) => (
                          <li
                            key={track.spotifyTrackId}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                            onClick={() => handleAddTrack(track)}
                          >
                            <img src={track.albumArt} alt={track.albumName} className="h-10 w-10 rounded object-cover shadow-sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{track.title}</p>
                              <p className="truncate text-xs text-zinc-500">{track.artist} · {formatDuration(track.durationMs)}</p>
                            </div>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Playlist */}
              <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
                  <h2 className="text-sm font-semibold text-zinc-300"><Music className="h-4 w-4 inline" /> Shared Playlist</h2>
                  <span className="text-xs text-zinc-600">{playlist.length} tracks</span>
                </div>

                {playlistLoading ? (
                  <div className="space-y-1 p-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl p-2.5">
                        <div className="h-11 w-11 animate-pulse rounded-lg bg-white/[0.06]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                          <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : playlist.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="mb-3 opacity-40"><Music className="h-8 w-8" /></div>
                    <p className="text-sm text-zinc-600">Search above to add your first song</p>
                  </div>
                ) : (
                  <ul className="max-h-[500px] overflow-y-auto p-1.5">
                    {playlist.map((track) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <li
                          key={track.id}
                          onClick={() => handlePlayTrack(track)}
                          className={`group flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 ${
                            isCurrent ? "bg-rose-500/[0.08] ring-1 ring-rose-500/20" : "hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                            <div className="relative h-full w-full">
                              <img src={track.albumArt} alt={track.title} className="h-full w-full object-cover" />
                              {isCurrent && isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <div className="flex items-end gap-[3px]">
                                    <div className="h-3 w-[3px] animate-pulse rounded-full bg-rose-400" style={{ animationDelay: "0ms" }} />
                                    <div className="h-4 w-[3px] animate-pulse rounded-full bg-rose-400" style={{ animationDelay: "150ms" }} />
                                    <div className="h-2 w-[3px] animate-pulse rounded-full bg-rose-400" style={{ animationDelay: "300ms" }} />
                                  </div>
                                </div>
                              )}
                              {isCurrent && !isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <svg className="h-4 w-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                  </svg>
                                </div>
                              )}
                              {!isCurrent && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${isCurrent ? "text-rose-400" : "text-zinc-200"}`}>{track.title}</p>
                            <p className="truncate text-xs text-zinc-500">{track.artist}</p>
                          </div>
                          <span className="shrink-0 font-mono text-[11px] text-zinc-600">{formatDuration(track.durationMs)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id); }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-600 opacity-0 transition-all hover:bg-white/[0.08] hover:text-zinc-300 group-hover:opacity-100"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: Now Playing */}
            <div className="flex flex-col gap-5">
              {currentTrack ? (
                <div className="sticky top-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
                  {/* Track info */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg shadow-lg">
                      <img src={currentTrack.albumArt} alt={currentTrack.title} className="h-full w-full object-cover" />
                      {isPlaying && <div className="absolute inset-0 animate-pulse bg-black/10" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
                      <p className="truncate text-xs text-zinc-500">{currentTrack.artist}</p>
                    </div>
                    {isPlaying && (
                      <div className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                        <span className="text-[10px] font-medium text-rose-400">LIVE</span>
                      </div>
                    )}
                  </div>

                  {/* Spotify embed */}
                  <div className="px-4">
                    <SpotifyPlayer spotifyUri={currentTrack.spotifyUri} onPlaybackUpdate={handlePlaybackUpdate} />
                  </div>

                  {/* Progress */}
                  <div className="px-4 pt-3 pb-3">
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-600">
                      <span className="font-mono">{formatDuration(playbackPosition)}</span>
                      <span className="font-mono">{formatDuration(playbackDuration)}</span>
                    </div>
                  </div>

                  {/* Up next */}
                  {getNextTrack() && (
                    <div className="border-t border-white/[0.04] px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Up next</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-zinc-400">
                            {getNextTrack()!.title}
                            <span className="text-zinc-600"> · {getNextTrack()!.artist}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="border-white/[0.06] bg-white/[0.02]">
                  <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="opacity-40"><Headphones className="h-10 w-10" /></div>
                    <p className="text-sm text-zinc-500">Select a song to start listening</p>
                    <p className="text-xs text-zinc-600">Both of you will hear the same thing</p>
                  </CardContent>
                </Card>
              )}

              {/* Sync info */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs text-zinc-500">Synced — both of you hear the same song</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
