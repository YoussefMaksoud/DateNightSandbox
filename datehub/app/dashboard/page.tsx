"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import SpotifyPlayer, { type PlaybackUpdate } from "@/components/SpotifyPlayer";
import Link from "next/link";
import {
  Map,
  Puzzle,
  Flag,
  Palette,
  Music,
  BookOpen,
  GraduationCap,
  Wrench,
  User,
  Trophy,
  Film,
  Gamepad2,
  ChefHat,
  MessageCircle,
  Sparkles,
  Moon,
} from "lucide-react";

// --- Types ---

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
}

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

async function fetchActivitiesApi(): Promise<Activity[]> {
  const res = await fetch("/api/activities");
  if (!res.ok) return [];
  const data = await res.json();
  return data.activities || [];
}

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
  const res = await fetch(`/api/playlist/tracks/${trackId}`, {
    method: "DELETE",
  });
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

async function pollPlayback(
  since: string
): Promise<{ changed: boolean; state?: PlaybackState }> {
  const res = await fetch(
    `/api/playlist/playback/poll?roomId=default-room&since=${encodeURIComponent(since)}`
  );
  if (!res.ok) return { changed: false };
  return res.json();
}

async function startActivity(activityId: string): Promise<string | null> {
  const res = await fetch("/api/activities/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activityId }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sessionId;
}

// --- Activity type icons ---

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    music: <Music className="h-5 w-5" />,
    movie: <Film className="h-5 w-5" />,
    game: <Gamepad2 className="h-5 w-5" />,
    cook: <ChefHat className="h-5 w-5" />,
    quiz: <Puzzle className="h-5 w-5" />,
    chat: <MessageCircle className="h-5 w-5" />,
  };
  return <span className="text-lg">{icons[type] || <Sparkles className="h-5 w-5" />}</span>;
}

// --- Component ---

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

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

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    const data = await fetchActivitiesApi();
    setActivities(data);
    setActivitiesLoading(false);
  }, []);

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
    loadActivities();
    fetchSpotifyStatus().then(setSpotifyConnected);
    loadPlaylist();
    loadPlaybackState();
  }, [isLoaded, user, loadActivities, loadPlaylist, loadPlaybackState]);

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

  // --- Auto-advance: use real playback events, fallback to timer ---

  function scheduleAutoAdvance(remainingMs: number) {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (remainingMs <= 0 || playlist.length <= 1) return;

    autoAdvanceTimerRef.current = setTimeout(() => {
      if (!currentTrack) return;
      const idx = playlist.findIndex((t) => t.id === currentTrack.id);
      const nextIdx = idx >= playlist.length - 1 ? 0 : idx + 1;
      handlePlayTrack(playlist[nextIdx]);
    }, remainingMs + 500); // small buffer for embed latency
  }

  // Spotify IFrame API playback callback — this is the real-time source of truth
  function handlePlaybackUpdate(state: PlaybackUpdate) {
    setPlaybackPosition(state.position);
    setPlaybackDuration(state.duration);
    setIsPlaying(!state.isPaused);

    // Re-schedule auto-advance based on real position
    if (!state.isPaused && state.duration > 0) {
      const remaining = state.duration - state.position;
      if (remaining > 0 && remaining < state.duration) {
        scheduleAutoAdvance(remaining);
      }
    } else if (state.isPaused) {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    }
  }

  // Cleanup auto-advance on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // --- Handlers ---

  async function handleStartActivity(activityId: string) {
    const sessionId = await startActivity(activityId);
    if (sessionId) {
      alert(`Activity started! Session ID: ${sessionId}`);
    } else {
      alert("Failed to start activity.");
    }
  }

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

  const progressPercent =
    playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0;

  // --- Render ---

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-rose-500/30 border-t-rose-500" />
          <span className="text-sm text-zinc-500">Loading your experience…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[30%] -top-[20%] h-[60vh] w-[60vh] rounded-full bg-rose-500/[0.04] blur-[120px]" />
        <div className="absolute -right-[20%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-purple-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] h-[40vh] w-[40vh] rounded-full bg-rose-600/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Date<span className="text-rose-400">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/map"
              className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5 transition-colors hover:bg-emerald-500/[0.12] sm:flex"
            >
              <Map className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">World Map</span>
            </Link>
            <Link
              href="/avatar"
              className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 transition-colors hover:bg-white/[0.06] sm:flex"
            >
              <User className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-400">My Avatar</span>
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 sm:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-400">
                {user?.firstName || "You"}'s date night
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Good evening, {user?.firstName || "there"}
          </h1>
          <p className="mt-1 text-zinc-500">
            Pick an activity or queue up some tunes together.
          </p>
        </div>

        {/* Quick Access — All Activities */}
        <section className="mb-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <Sparkles className="h-4 w-4 text-rose-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Activities</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[
              { href: "/map", icon: <Map className="h-6 w-6" />, label: "World Map", color: "#22C55E", desc: "Explore together" },
              { href: "/trivia", icon: <Puzzle className="h-6 w-6" />, label: "Trivia Tower", color: "#F97316", desc: "AI-powered trivia" },
              { href: "/race", icon: <Flag className="h-6 w-6" />, label: "Race Track", color: "#22C55E", desc: "Race each other" },
              { href: "/painting", icon: <Palette className="h-6 w-6" />, label: "Paint Studio", color: "#9C27B0", desc: "Paint together" },
              { href: "/music", icon: <Music className="h-6 w-6" />, label: "Music Lounge", color: "#e11d48", desc: "Listen together" },
              { href: "/scrapbook", icon: <BookOpen className="h-6 w-6" />, label: "Scrapbook", color: "#e91e63", desc: "Create memories" },
              { href: "/homework", icon: <GraduationCap className="h-6 w-6" />, label: "Homework Night", color: "#1565c0", desc: "Study together" },
              { href: "/vehicle-build", icon: <Wrench className="h-6 w-6" />, label: "Speed Shop", color: "#E67E22", desc: "Customize ride" },
              { href: "/avatar", icon: <User className="h-6 w-6" />, label: "Avatar", color: "#8B5CF6", desc: "Customize look" },
              { href: "/race/leaderboard", icon: <Trophy className="h-6 w-6" />, label: "Leaderboard", color: "#DAA520", desc: "Race records" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  style={{ ["--glow" as string]: item.color }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: item.color + "18", color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  <span className="text-[10px] text-zinc-500">{item.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* ═══════════════ Left Column ═══════════════ */}
          <div className="flex flex-col gap-8">
            {/* Activities Section */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <Moon className="h-4 w-4 text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Date Night Activities</h2>
              </div>

              {activitiesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/10 to-purple-500/10">
                      <Moon className="h-8 w-8 text-rose-400" />
                    </div>
                    <p className="text-sm text-zinc-500">
                      No activities available yet. New date night ideas coming soon!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {activities.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="flex h-full flex-col p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/10 to-purple-500/10 ring-1 ring-white/[0.06]">
                            <ActivityIcon type={activity.type} />
                          </div>
                          <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                            {activity.type}
                          </span>
                        </div>
                        <h3 className="mb-1 font-semibold text-white">
                          {activity.title}
                        </h3>
                        <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-500">
                          {activity.description}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleStartActivity(activity.id)}
                          className="w-full"
                        >
                          Start Activity
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Now Playing — full width on left, only visible on larger screens when track is active */}
            {currentTrack && (
              <section className="lg:hidden">
                <NowPlayingSection
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playbackPosition={playbackPosition}
                  playbackDuration={playbackDuration}
                  progressPercent={progressPercent}
                  nextTrack={getNextTrack()}
                  onPlaybackUpdate={handlePlaybackUpdate}
                />
              </section>
            )}
          </div>

          {/* ═══════════════ Right Column — Shared Playlist ═══════════════ */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Shared Playlist</h2>
              {playlist.length > 0 && (
                <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  {playlist.length} track{playlist.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Spotify Connect Banner */}
            {!spotifyConnected && (
              <Card>
                <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 ring-1 ring-green-500/20">
                    <svg className="h-7 w-7 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-white">Connect Spotify</p>
                    <p className="text-sm text-zinc-500">
                      Link your account to search and play music together
                    </p>
                  </div>
                  <Button onClick={handleConnectSpotify} className="gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Connect
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Track Search */}
            {spotifyConnected && (
              <div className="relative">
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    placeholder="Search for a song…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results Dropdown */}
                {(searching || searchResults.length > 0) && searchFocused && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-zinc-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    {searching ? (
                      <div className="space-y-1 p-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                            <div className="h-10 w-10 animate-pulse rounded bg-white/[0.06]" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                              <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.04]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="p-1.5">
                        {searchResults.map((track) => (
                          <li
                            key={track.spotifyTrackId}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                            onClick={() => handleAddTrack(track)}
                          >
                            <img
                              src={track.albumArt}
                              alt={track.albumName}
                              className="h-10 w-10 rounded object-cover shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {track.title}
                              </p>
                              <p className="truncate text-xs text-zinc-500">
                                {track.artist} · {formatDuration(track.durationMs)}
                              </p>
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
            )}

            {/* Playlist View */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
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
                  <div className="mb-3 opacity-40"><Music className="h-8 w-8 text-zinc-400" /></div>
                  <p className="text-sm text-zinc-600">
                    {spotifyConnected
                      ? "Search above to add your first song"
                      : "Connect Spotify to start building your playlist"}
                  </p>
                </div>
              ) : (
                <ul className="p-1.5">
                  {playlist.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <li
                        key={track.id}
                        onClick={() => handlePlayTrack(track)}
                        className={`group flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 ${
                          isCurrent
                            ? "bg-rose-500/[0.08] ring-1 ring-rose-500/20"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* Track number / play indicator */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                          <div className="relative h-full w-full">
                            <img
                              src={track.albumArt}
                              alt={track.title}
                              className="h-full w-full object-cover"
                            />
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
                          <p className={`truncate text-sm font-medium ${isCurrent ? "text-rose-400" : "text-zinc-200"}`}>
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {track.artist}
                          </p>
                        </div>

                        <span className="shrink-0 font-mono text-[11px] text-zinc-600">
                          {formatDuration(track.durationMs)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(track.id);
                          }}
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

            {/* Now Playing — sticky in right column on desktop */}
            {currentTrack && (
              <div className="hidden lg:block">
                <NowPlayingSection
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playbackPosition={playbackPosition}
                  playbackDuration={playbackDuration}
                  progressPercent={progressPercent}
                  nextTrack={getNextTrack()}
                  onPlaybackUpdate={handlePlaybackUpdate}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Now Playing Component ---

function NowPlayingSection({
  currentTrack,
  isPlaying,
  playbackPosition,
  playbackDuration,
  progressPercent,
  nextTrack,
  onPlaybackUpdate,
}: {
  currentTrack: PlaylistTrack;
  isPlaying: boolean;
  playbackPosition: number;
  playbackDuration: number;
  progressPercent: number;
  nextTrack: PlaylistTrack | null;
  onPlaybackUpdate: (state: PlaybackUpdate) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
      {/* Track info header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow-lg">
          <img
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            className="h-full w-full object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-full animate-pulse bg-black/10" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {currentTrack.title}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {currentTrack.artist}
          </p>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
            <span className="text-[10px] font-medium text-rose-400">LIVE</span>
          </div>
        )}
      </div>

      {/* Spotify Embed via IFrame API */}
      <div className="px-4">
        <SpotifyPlayer
          spotifyUri={currentTrack.spotifyUri}
          onPlaybackUpdate={onPlaybackUpdate}
        />
      </div>

      {/* Progress bar + time */}
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
      {nextTrack && (
        <div className="border-t border-white/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Up next
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-400">
                {nextTrack.title}
                <span className="text-zinc-600"> · {nextTrack.artist}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
