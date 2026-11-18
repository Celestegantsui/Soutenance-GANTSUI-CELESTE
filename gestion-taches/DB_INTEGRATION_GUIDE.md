/**
 * GUIDE D'INTÉGRATION - BASE DE DONNÉES RÉELLE
 * 
 * Ce fichier montre comment connecter le système à une vraie DB
 * Plus tard, au lieu de localStorage
 */

// ================================
// OPTION 1 : PostgreSQL + Prisma
// ================================

/*
// Installer:
npm install @prisma/client
npx prisma init

// prisma/schema.prisma
model MonthlyArchive {
  id          String   @id @default(cuid())
  month       String   @unique // "2025-02"
  year        Int
  monthNumber Int
  
  tasks       ArchivedTask[]
  meetings    ArchivedMeeting[]
  stats       ArchiveStats?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ArchivedTask {
  id              String   @id @default(cuid())
  archiveId       String
  archive         MonthlyArchive @relation(fields: [archiveId], references: [id])
  
  title           String
  status          String   // "completed" | "pending" | "in-progress"
  assignedTo      String
  createdDate     String
  completedDate   String?
  daysToComplete  Int?
}

model ArchivedMeeting {
  id          String   @id @default(cuid())
  archiveId   String
  archive     MonthlyArchive @relation(fields: [archiveId], references: [id])
  
  title       String
  date        String
  duration    Int      // minutes
  participants String   // JSON stringified
  notes       String?
}

model ArchiveStats {
  id                    String   @id @default(cuid())
  archiveId             String   @unique
  archive               MonthlyArchive @relation(fields: [archiveId], references: [id])
  
  completionRate        Float
  averageCompletionTime Float
  delayedTasks          Int?
  totalTasks            Int
  completedTasks        Int
  pendingTasks          Int
  inProgressTasks       Int
  totalMeetings         Int
  meetingCompletionRate Float
  totalMeetingHours     Float
}

// L’API /api/history/monthly peut retourner stats.delayedTasks pour chaque archive.
// Sinon, l’historique calcule le nombre à partir du statut et de endDate/end_date
// de chaque tâche archivée, à condition que ces champs aient été sauvegardés.
// Si aucune de ces données n’existe, le compteur est indisponible.

// ================================
// IMPLEMENTATION
// ================================

// lib/archiveService.ts
import prisma from '@/lib/prisma'

export async function saveArchiveToDatabase(archive: MonthlyArchive) {
  return await prisma.monthlyArchive.upsert({
    where: { month: archive.month },
    update: {
      tasks: {
        deleteMany: {},
        create: archive.tasks.map(t => ({
          ...t,
          participants: JSON.stringify(t.participants)
        }))
      },
      meetings: {
        deleteMany: {},
        create: archive.meetings.map(m => ({
          ...m,
          participants: JSON.stringify(m.participants)
        }))
      },
      stats: {
        upsert: {
          create: archive.stats,
          update: archive.stats
        }
      }
    },
    create: {
      month: archive.month,
      year: archive.year,
      monthNumber: archive.monthNumber,
      tasks: {
        create: archive.tasks
      },
      meetings: {
        create: archive.meetings
      },
      stats: {
        create: archive.stats
      }
    }
  });
}

export async function getArchivesFromDatabase() {
  return await prisma.monthlyArchive.findMany({
    include: {
      tasks: true,
      meetings: true,
      stats: true
    },
    orderBy: { createdAt: 'desc' }
  });
}
*/

// ================================
// OPTION 2: MongoDB + Mongoose
// ================================

/*
// Installer:
npm install mongoose

// models/Archive.ts
import mongoose from 'mongoose';

const archiveSchema = new mongoose.Schema({
  month: { type: String, unique: true, required: true },     // "2025-02"
  year: { type: Number, required: true },
  monthNumber: { type: Number, required: true },
  
  tasks: [{
    id: String,
    title: String,
    status: String,
    assignedTo: String,
    createdDate: String,
    completedDate: String,
    daysToComplete: Number
  }],
  
  meetings: [{
    id: String,
    title: String,
    date: String,
    duration: Number,
    participants: [String],
    notes: String
  }],
  
  stats: {
    completionRate: Number,
    averageCompletionTime: Number,
    delayedTasks: Number,
    totalTasks: Number,
    completedTasks: Number,
    pendingTasks: Number,
    inProgressTasks: Number,
    totalMeetings: Number,
    meetingCompletionRate: Number,
    totalMeetingHours: Number
  },
  
  createdAt: { type: Date, default: Date.now }
});

export const Archive = mongoose.model('Archive', archiveSchema);

// lib/mongoService.ts
import { Archive } from '@/models/Archive';

export async function saveArchiveToMongo(archive: MonthlyArchive) {
  return await Archive.findOneAndUpdate(
    { month: archive.month },
    archive,
    { upsert: true, new: true }
  );
}

export async function getArchivesFromMongo() {
  return await Archive.find().sort({ createdAt: -1 });
}
*/

// ================================
// OPTION 3: Supabase (PostgreSQL + Auth)
// ================================

/*
// Installer:
npm install @supabase/supabase-js

// lib/supabaseService.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function saveArchiveToSupabase(archive: MonthlyArchive) {
  const { data, error } = await supabase
    .from('archives')
    .upsert({
      month: archive.month,
      year: archive.year,
      monthNumber: archive.monthNumber,
      tasks: JSON.stringify(archive.tasks),
      meetings: JSON.stringify(archive.meetings),
      stats: JSON.stringify(archive.stats),
      created_at: new Date()
    }, { onConflict: 'month' })
    .select();
  
  if (error) throw error;
  return data;
}

export async function getArchivesFromSupabase() {
  const { data, error } = await supabase
    .from('archives')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data?.map(row => ({
    ...row,
    tasks: JSON.parse(row.tasks),
    meetings: JSON.parse(row.meetings),
    stats: JSON.parse(row.stats)
  }));
}
*/

// ================================
// MIGRATION DEPUIS LOCALSTORAGE
// ================================

/*
// Fonction pour migrer les données existantes
export async function migrateFromLocalStorageToDatabase() {
  const localArchives = JSON.parse(
    localStorage.getItem('history_archives') || '[]'
  );
  
  for (const archive of localArchives) {
    await saveArchiveToDatabase(archive);
    // Ou saveArchiveToSupabase(archive);
    // Ou saveArchiveToMongo(archive);
  }
  
  console.log(`✅ ${localArchives.length} archives migrées vers DB`);
  
  // Optionnel: nettoyer localStorage après migration réussie
  // localStorage.removeItem('history_archives');
}
*/

// ================================
// ADAPTER LE SYSTÈME EXISTANT
// ================================

/*
// lib/historyStorageEnhanced.ts
// Remplacement avec support multi-backend

export async function saveArchive(archive: MonthlyArchive) {
  // Toujours sauvegarder en localStorage
  saveArchiveLocally(archive);
  
  // NOUVEAU: Sauvegarder en DB si disponible
  if (process.env.NEXT_PUBLIC_DATABASE_ENABLED === 'true') {
    try {
      await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archive)
      });
    } catch (error) {
      console.error('❌ Impossible de sauvegarder en DB:', error);
      // Continuer sans erreur - les données locales restent valides
    }
  }
}

export async function getHistoryArchives(): Promise<MonthlyArchive[]> {
  // D'abord essayer le backend
  if (process.env.NEXT_PUBLIC_DATABASE_ENABLED === 'true') {
    try {
      const response = await fetch('/api/archives');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('❌ Impossible de récupérer depuis DB:', error);
    }
  }
  
  // Fallback: localStorage
  return getArchivesLocally();
}
*/

// ================================
// CONFIGURATION .env.local
// ================================

/*
// .env.local

# Décommenter une option selon votre choix

# PostgreSQL + Prisma
DATABASE_URL="postgresql://user:password@localhost:5432/gestion-taches"
NEXT_PUBLIC_DATABASE_ENABLED="true"

# Ou MongoDB
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/gestion-taches"

# Ou Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxxxx"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
*/

// ================================
// API ROUTE AMÉLIORÉE
// ================================

/*
// app/api/archives/route.ts
import { NextRequest, NextResponse } from "next/server";

// Exemple avec Prisma
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const archives = await prisma.monthlyArchive.findMany({
      include: { tasks: true, meetings: true, stats: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ success: true, data: archives });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const archive = await request.json();
    
    const saved = await prisma.monthlyArchive.upsert({
      where: { month: archive.month },
      update: { /* ... */ },
      create: { /* ... */ }
    });
    
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { month } = await request.json();
    
    await prisma.monthlyArchive.delete({
      where: { month }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
*/

// ================================
// CHECKLIST INTÉGRATION BD
// ================================

/*
✅ Checkliste pour intégrer une vraie BD:

1. Choisir une base de données
   ☐ PostgreSQL (+ Prisma) - Recommandé pour production
   ☐ MongoDB - Si vous préférez NoSQL
   ☐ Supabase - Si vous voulez managed + Auth
   ☐ Firebase - Alternative serverless

2. Installer le client/ORM
   ☐ npm install [package]
   ☐ Créer schéma de BD

3. Configuration
   ☐ Ajouter credentials dans .env.local
   ☐ Tester connexion

4. Métamorphoser l'API
   ☐ Remplacer in-memory storage par DB
   ☐ Tester GET/POST/DELETE

5. Adapter historyStorage.ts
   ☐ Ajouter fonction pour appeler la DB
   ☐ Garder localStorage comme fallback

6. Migration (optionnel)
   ☐ Exporter archives de localStorage
   ☐ Importer dans BD

7. Tester complètement
   ☐ Créer archive
   ☐ Récupérer archives
   ☐ Afficher sur /history
   ☐ Supprimer archive

8. Déploiement
   ☐ Déployer BD
   ☐ Déployer app
   ☐ Documenter credentials
*/

console.log(
  `✅ Configuration prête pour intégration BD réelle.
   Consultez les options ci-dessus et choisissez.`
);
