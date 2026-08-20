import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * El proyecto no tenía un proveedor de archivos. Esta interfaz mantiene el
 * dominio independiente del almacenamiento: local funciona en desarrollo y
 * un proveedor de objetos puede implementarse sin cambiar la API ni MySQL.
 */
export type StoredFile = {
  clave: string;
  nombre: string;
  mime: string;
  tamano: number;
};

/** Contrato que puede implementar S3/MinIO/R2 sin tocar la bitácora. */
export interface FileStorage {
  save(eventoId: number, file: File): Promise<StoredFile>;
  read(clave: string): Promise<Buffer>;
  delete(clave: string): Promise<void>;
}

export const MAX_BITACORA_FILE_BYTES = 10 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel", "application/octet-stream"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

function storageRoot(): string {
  // Una ruta relativa se resuelve respecto al cwd del proceso; en producción
  // se recomienda entregar una ruta absoluta montada como volumen.
  return path.resolve(process.env.BITACORA_STORAGE_DIR || "storage/bitacora");
}

function extensionOf(name: string): string {
  return path.extname(name).slice(1).toLowerCase();
}

function validateFile(file: File): { extension: string; mime: string } {
  const extension = extensionOf(file.name);
  const allowed = MIME_BY_EXTENSION[extension];
  const mime = String(file.type || "").toLowerCase();
  if (!allowed || !mime || !allowed.includes(mime)) {
    throw new Error("Archivo no permitido. Usa PDF, Word, Excel, PNG o JPG con su tipo MIME válido.");
  }
  if (file.size <= 0 || file.size > MAX_BITACORA_FILE_BYTES) {
    throw new Error("El informe debe pesar entre 1 byte y 10 MB.");
  }
  return { extension, mime };
}

function assertStorageDriver() {
  const driver = (process.env.BITACORA_STORAGE_DRIVER || "local").toLowerCase();
  if (driver !== "local") {
    throw new Error(
      `El almacenamiento '${driver}' aún no está configurado. Define BITACORA_STORAGE_DRIVER=local o implementa el adaptador de objetos para producción.`
    );
  }
}

export async function saveStoredFile(eventoId: number, file: File): Promise<StoredFile> {
  assertStorageDriver();
  const { extension, mime } = validateFile(file);
  const clave = `${eventoId}/${randomUUID()}.${extension}`;
  const destination = path.join(storageRoot(), clave);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return { clave, nombre: path.basename(file.name), mime, tamano: file.size };
}

export async function readStoredFile(clave: string): Promise<Buffer> {
  assertStorageDriver();
  const root = storageRoot();
  const safeKey = path.posix.normalize(clave).replace(/^\/+/, "");
  const fullPath = path.resolve(root, safeKey);
  if (fullPath !== root && !fullPath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Clave de archivo inválida");
  }
  return readFile(fullPath);
}

export async function deleteStoredFile(clave: string): Promise<void> {
  assertStorageDriver();
  const root = storageRoot();
  const safeKey = path.posix.normalize(clave).replace(/^\/+/, "");
  const fullPath = path.resolve(root, safeKey);
  if (fullPath !== root && !fullPath.startsWith(`${root}${path.sep}`)) return;
  await rm(fullPath, { force: true });
}

/** Adaptador local privado para desarrollo. El dominio sólo necesita FileStorage. */
export const localFileStorage: FileStorage = {
  save: saveStoredFile,
  read: readStoredFile,
  delete: deleteStoredFile,
};
