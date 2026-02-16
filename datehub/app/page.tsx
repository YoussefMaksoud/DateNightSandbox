import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SecretMessageLanding from "@/components/SecretMessageLanding";

const features = [
  {
    emoji: "🎭",
    title: "Themed Date Nights",
    description: "Choose from romantic, adventure, or creative themes",
  },
  {
    emoji: "📖",
    title: "Collaborative Stories",
    description: "Write beautiful stories together, one paragraph at a time",
  },
  {
    emoji: "🎨",
    title: "Custom Avatars",
    description: "Express yourself with personalized avatars",
  },
  {
    emoji: "🎵",
    title: "Shared Playlists",
    description: "Listen to music together in perfect sync",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 bg-clip-text text-transparent">
            DateHub
          </span>
        </h1>
        <p className="mb-4 text-xl text-zinc-300 sm:text-2xl">
          Your virtual date night, reimagined
        </p>
        <p className="mb-10 max-w-xl text-zinc-400">
          DateHub brings long-distance couples closer with themed date nights,
          collaborative activities, and shared experiences — all from the comfort
          of your own space.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <Link href="/sign-up">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
          <SecretMessageLanding />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-12 text-center text-3xl font-bold text-zinc-100">
          Everything you need for the perfect date night
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <span className="mb-2 block text-4xl">{feature.emoji}</span>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardDescription>{feature.description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        Made with ❤️ for long-distance couples
      </footer>
    </div>
  );
}
