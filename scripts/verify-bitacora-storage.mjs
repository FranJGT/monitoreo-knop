import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localFileStorage } from "../lib/bitacoraStorage.ts";

const root = await mkdtemp(join(tmpdir(), "knop-bitacora-storage-"));
process.env.BITACORA_STORAGE_DRIVER = "local";
process.env.BITACORA_STORAGE_DIR = root;

try {
  const source = new File(["%PDF-1.4\n"], "informe mantenimiento.pdf", { type: "application/pdf" });
  const stored = await localFileStorage.save(42, source);
  assert.match(stored.clave, /^42\/[0-9a-f-]+\.pdf$/);
  assert.equal(stored.nombre, "informe mantenimiento.pdf");
  assert.deepEqual(await localFileStorage.read(stored.clave), Buffer.from("%PDF-1.4\n"));

  await assert.rejects(
    () => localFileStorage.save(42, new File(["x"], "informe.exe", { type: "application/octet-stream" })),
    /Archivo no permitido/
  );

  await localFileStorage.delete(stored.clave);
  await assert.rejects(() => readFile(join(root, stored.clave)));
  console.log("bitacoraStorage: OK (guardar, leer, validar y eliminar)");
} finally {
  await rm(root, { recursive: true, force: true });
}
