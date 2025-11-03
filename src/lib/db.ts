import { promises as fs } from "fs";
import path from "path";

export type ImageJob = {
  id: string;
  userId: string;
  sourceKey: string;
  size: number;
  mime: string;
  status: "PENDING";
  createdAt: string;
};

type DbShape = {
  imageJobs: ImageJob[];
};

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

async function ensure() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
  try {
    await fs.access(dbFile);
  } catch {
    const initial: DbShape = { imageJobs: [] };
    await fs.writeFile(dbFile, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDb(): Promise<DbShape> {
  await ensure();
  const raw = await fs.readFile(dbFile, "utf8");
  return JSON.parse(raw) as DbShape;
}

async function writeDb(data: DbShape) {
  await fs.writeFile(dbFile, JSON.stringify(data, null, 2), "utf8");
}

export async function addImageJob(job: ImageJob) {
  const db = await readDb();
  db.imageJobs.push(job);
  await writeDb(db);
  return job;
}

export async function listUserImageJobs(userId: string) {
  const db = await readDb();
  return db.imageJobs.filter((j) => j.userId === userId);
}
