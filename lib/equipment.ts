import type { DpDevice, SthDevice } from "./knopTypes";

export type EquipmentKind = "sth" | "dp";

export type EquipmentOption = {
  value: string;
  label: string;
  kind: EquipmentKind;
  id: string;
};

function deviceLabel(device: { identificador: string; ubicacion?: string }): string {
  return device.ubicacion
    ? `${device.identificador} — ${device.ubicacion}`
    : device.identificador;
}

/** Valor legible y estable que se guarda junto al evento de bitácora. */
export function equipmentValue(
  kind: EquipmentKind,
  device: DpDevice | SthDevice
): string {
  return `[${kind === "dp" ? "SDP" : "STH"}] ${deviceLabel(device)}`;
}

export function equipmentOption(
  kind: EquipmentKind,
  device: DpDevice | SthDevice
): EquipmentOption {
  const id = kind === "dp" ? (device as DpDevice).devEui : (device as SthDevice).name;
  return {
    value: equipmentValue(kind, device),
    label: `${kind === "dp" ? "SDP" : "STH"} · ${deviceLabel(device)}`,
    kind,
    id,
  };
}
