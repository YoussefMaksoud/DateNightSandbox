import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const activities = [
    {
      id: "act-1",
      title: "Romantic Candlelight Quiz",
      description:
        "Test how well you know each other with intimate questions about your relationship, dreams, and memories.",
      type: "game",
    },
    {
      id: "act-2",
      title: "Once Upon Us",
      description:
        "Take turns writing paragraphs to co-create a love story. Let your imagination run wild together!",
      type: "storytelling",
    },
    {
      id: "act-3",
      title: "Sunset Playlist Session",
      description:
        "Build the perfect shared playlist together. Discover new songs and revisit your favorites.",
      type: "music",
    },
    {
      id: "act-4",
      title: "Movie Night Roulette",
      description:
        "Spin the wheel and pick a movie genre, then watch something new together. Popcorn required! 🍿",
      type: "video",
    },
    {
      id: "act-5",
      title: "Dream Vacation Planner",
      description:
        "Collaboratively plan your dream vacation — pick destinations, activities, and restaurants together.",
      type: "game",
    },
    {
      id: "act-6",
      title: "Love Letter Exchange",
      description:
        "Write heartfelt letters to each other in real-time. A modern twist on a timeless tradition. 💌",
      type: "storytelling",
    },
  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { id: activity.id },
      update: activity,
      create: activity,
    });
  }

  console.log(`✅ Seeded ${activities.length} activities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
