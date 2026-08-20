import { exportRowsToXlsx, safeFileName } from "./exportXlsx";
import { TIPO_LABEL_PERSISTIDO, type EventoBitacora } from "./bitacoraMeta";
import { formatExcelTime, ymdLocal, ymdToDmy } from "./units";

/**
 * Exporta los eventos filtrados de la bitácora a Excel (mismo patrón que los
 * export del monitoreo: columnas fijas y SheetJS cargado bajo demanda).
 */
export function exportEventosXlsx(eventos: EventoBitacora[]) {
  if (!eventos.length) return;
  const rows = eventos.map((e) => ({
    fecha: formatExcelTime(e.fechaHora),
    tipo: TIPO_LABEL_PERSISTIDO[e.tipo],
    titulo: e.titulo,
    area: e.area ?? "",
    descripcion: e.descripcion ?? "",
    autor: e.autor,
  }));
  const nombre = `bitacora_${ymdToDmy(ymdLocal(new Date()))}.xlsx`;
  exportRowsToXlsx(safeFileName(nombre), rows, "Bitacora", [
    "fecha",
    "tipo",
    "titulo",
    "area",
    "descripcion",
    "autor",
  ]);
}
