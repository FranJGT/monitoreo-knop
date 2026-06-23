/** Exporta filas (array de objetos) a un archivo .xlsx. Carga SheetJS bajo demanda. */
export async function exportRowsToXlsx(
  filename: string,
  rows: Record<string, string | number | null>[],
  sheetName = "Datos"
) {
  if (!rows.length) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}

/** Limpia un texto para usarlo como nombre de archivo. */
export function safeFileName(s: string, max = 60): string {
  return String(s)
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, max);
}
