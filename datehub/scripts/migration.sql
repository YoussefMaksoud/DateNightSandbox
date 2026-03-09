-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DateNight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT,
    "activityId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DateNight_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DateNight_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DateNight_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "spotifyTrackId" TEXT NOT NULL,
    "spotifyUri" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "albumName" TEXT,
    "albumArt" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "addedBy" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlaybackState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "trackId" TEXT,
    "spotifyUri" TEXT,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "progressMs" INTEGER NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpotifyToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skinTone" TEXT NOT NULL DEFAULT 'cat',
    "hairStyle" TEXT NOT NULL DEFAULT 'solid',
    "hairColor" TEXT NOT NULL DEFAULT 'coral',
    "eyeColor" TEXT NOT NULL DEFAULT 'round',
    "outfit" TEXT NOT NULL DEFAULT 'casual-tee',
    "outfitColor" TEXT NOT NULL DEFAULT 'rose',
    "accessory" TEXT NOT NULL DEFAULT 'none',
    "expression" TEXT NOT NULL DEFAULT 'smile',
    "background" TEXT NOT NULL DEFAULT 'none',
    "vehicle" TEXT NOT NULL DEFAULT 'none',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MapPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "x" REAL NOT NULL DEFAULT 400,
    "y" REAL NOT NULL DEFAULT 300,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Scrapbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL DEFAULT 'default-room',
    "name" TEXT NOT NULL,
    "coverUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScrapbookPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scrapbookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFF8F0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScrapbookPage_scrapbookId_fkey" FOREIGN KEY ("scrapbookId") REFERENCES "Scrapbook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrapbookItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "x" REAL NOT NULL DEFAULT 50,
    "y" REAL NOT NULL DEFAULT 50,
    "width" REAL NOT NULL DEFAULT 100,
    "height" REAL NOT NULL DEFAULT 100,
    "rotation" REAL NOT NULL DEFAULT 0,
    "scale" REAL NOT NULL DEFAULT 1,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScrapbookItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ScrapbookPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleBuild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'stock',
    "tires" TEXT NOT NULL DEFAULT 'street',
    "body" TEXT NOT NULL DEFAULT 'sedan',
    "spoiler" TEXT NOT NULL DEFAULT 'none',
    "nitro" TEXT NOT NULL DEFAULT 'none',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScreenShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "offer" TEXT,
    "answer" TEXT,
    "hostCandidates" TEXT NOT NULL DEFAULT '[]',
    "viewerCandidates" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaintingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateNightId" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "theme" TEXT NOT NULL DEFAULT 'landscape',
    "referenceUrl" TEXT NOT NULL,
    "palette" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GameRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "player1Ready" BOOLEAN NOT NULL DEFAULT false,
    "player2Ready" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "startedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RaceRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "player1Ready" BOOLEAN NOT NULL DEFAULT false,
    "player2Ready" BOOLEAN NOT NULL DEFAULT false,
    "lapCount" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "player1Lap" INTEGER NOT NULL DEFAULT 0,
    "player2Lap" INTEGER NOT NULL DEFAULT 0,
    "player1T" REAL NOT NULL DEFAULT 0,
    "player2T" REAL NOT NULL DEFAULT 0,
    "player1Time" REAL,
    "player2Time" REAL,
    "startedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lapCount" INTEGER NOT NULL,
    "finishTime" REAL NOT NULL,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TriviaRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "player1Ready" BOOLEAN NOT NULL DEFAULT false,
    "player2Ready" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'general',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "mode" TEXT NOT NULL DEFAULT 'classic',
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL DEFAULT 10,
    "player1Score" INTEGER NOT NULL DEFAULT 0,
    "player2Score" INTEGER NOT NULL DEFAULT 0,
    "player1Streak" INTEGER NOT NULL DEFAULT 0,
    "player2Streak" INTEGER NOT NULL DEFAULT 0,
    "player1Lives" INTEGER NOT NULL DEFAULT 3,
    "player2Lives" INTEGER NOT NULL DEFAULT 3,
    "currentQuestion" TEXT,
    "questionSentAt" DATETIME,
    "player1Answer" TEXT,
    "player2Answer" TEXT,
    "player1Time" REAL,
    "player2Time" REAL,
    "startedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TriviaResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalRounds" INTEGER NOT NULL,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "avgTime" REAL NOT NULL DEFAULT 0,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PlaylistTrack_roomId_idx" ON "PlaylistTrack"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackState_roomId_key" ON "PlaybackState"("roomId");

-- CreateIndex
CREATE INDEX "PlaybackState_roomId_idx" ON "PlaybackState"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyToken_userId_key" ON "SpotifyToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_userId_key" ON "Avatar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MapPosition_userId_key" ON "MapPosition"("userId");

-- CreateIndex
CREATE INDEX "Scrapbook_roomId_idx" ON "Scrapbook"("roomId");

-- CreateIndex
CREATE INDEX "ScrapbookPage_scrapbookId_idx" ON "ScrapbookPage"("scrapbookId");

-- CreateIndex
CREATE INDEX "ScrapbookItem_pageId_idx" ON "ScrapbookItem"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBuild_userId_key" ON "VehicleBuild"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreenShare_roomId_key" ON "ScreenShare"("roomId");

-- CreateIndex
CREATE INDEX "PaintingSession_userId_idx" ON "PaintingSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRoom_roomId_key" ON "GameRoom"("roomId");

-- CreateIndex
CREATE INDEX "GameRoom_type_status_idx" ON "GameRoom"("type", "status");

-- CreateIndex
CREATE INDEX "GameRoom_player1Id_idx" ON "GameRoom"("player1Id");

-- CreateIndex
CREATE UNIQUE INDEX "RaceRoom_roomId_key" ON "RaceRoom"("roomId");

-- CreateIndex
CREATE INDEX "RaceResult_userId_idx" ON "RaceResult"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TriviaRoom_roomId_key" ON "TriviaRoom"("roomId");

-- CreateIndex
CREATE INDEX "TriviaResult_userId_idx" ON "TriviaResult"("userId");

