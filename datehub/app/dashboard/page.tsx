"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
}

interface Track {
  trackId: string;
  title: string;
  artist: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(true);

  const [trackId, setTrackId] = useState("");
  const [addingTrack, setAddingTrack] = useState(false);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await fetch("/api/activities");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      /* ignore */
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const fetchPlaylist = useCallback(async () => {
    setPlaylistLoading(true);
    try {
      const res = await fetch("/api/music/playlist");
      if (res.ok) {
        const data = await res.json();
        setTracks(data.playlist || []);
      }
    } catch {
      /* ignore */
    } finally {
      setPlaylistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchActivities();
      fetchPlaylist();
    }
  }, [isLoaded, user, fetchActivities, fetchPlaylist]);

  async function handleStartActivity(activityId: string) {
    try {
      const res = await fetch("/api/activities/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Activity started! Session ID: ${data.sessionId}`);
      }
    } catch {
      alert("Failed to start activity.");
    }
  }

  async function handleAddTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackId.trim()) return;
    setAddingTrack(true);
    try {
      const res = await fetch("/api/music/playlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (res.ok) {
        setTrackId("");
        fetchPlaylist();
      }
    } catch {
      /* ignore */
    } finally {
      setAddingTrack(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xl font-bold text-rose-500">DateHub</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-2">
        {/* Activities */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-zinc-100">
            Date Night Activities
          </h2>
          {activitiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-zinc-800/50"
                />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="mb-3 text-4xl">🌙</p>
                <p className="text-zinc-400">
                  No activities available yet. Check back soon for new date
                  night ideas!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-rose-600/20 px-3 py-0.5 text-xs font-medium text-rose-400">
                        {activity.type}
                      </span>
                    </div>
                    <CardTitle className="mt-2">{activity.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-zinc-400">
                      {activity.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleStartActivity(activity.id)}
                    >
                      Start Activity
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Playlist */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-zinc-100">
            Shared Playlist
          </h2>
          {playlistLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-zinc-800/50"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent>
                {tracks.length === 0 ? (
                  <p className="py-6 text-center text-zinc-400">
                    Your playlist is empty. Add a track below!
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-800">
                    {tracks.map((track, i) => (
                      <li
                        key={track.trackId}
                        className="flex items-center gap-4 py-3"
                      >
                        <span className="w-6 text-right font-mono text-sm text-zinc-500">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-zinc-100">
                            {track.title}
                          </p>
                          <p className="truncate text-sm text-zinc-400">
                            {track.artist}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  onSubmit={handleAddTrack}
                  className="mt-4 flex gap-3 border-t border-zinc-800 pt-4"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Track ID"
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={addingTrack}>
                    {addingTrack ? "Adding..." : "Add Track"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
