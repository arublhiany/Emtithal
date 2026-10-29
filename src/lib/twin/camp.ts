import { z } from "zod";

export const TWIN_STORAGE_KEY = "sabbaq-camp-twin-v1";
export const STALE_AFTER_MS = 60_000;
const count = z.number().int().min(0).max(1_000_000);
const zoneSchema = z.object({
  id: z.enum(["a", "b", "c"]), name: z.string(), capacity: count,
  occupancy: count, workers: count, meals: count, exitOpen: z.boolean(),
  updatedAt: z.number().finite().nonnegative(),
});
export type Zone = z.infer<typeof zoneSchema>;
export type ZoneId = Zone["id"];
export type Field = "occupancy" | "workers" | "meals" | "exitOpen";
const eventSchema = z.object({
  id: z.string().min(1).max(100), zoneId: z.enum(["a", "b", "c"]),
  field: z.enum(["occupancy", "workers", "meals", "exitOpen"]),
  value: z.union([count, z.boolean()]), observedAt: z.number().finite().nonnegative(),
  source: z.enum(["MANUAL_DEMO", "SIMULATOR", "SCENARIO"]),
});
export type CampEvent = z.infer<typeof eventSchema>;
const recordedSchema = eventSchema.extend({ previous: z.union([count, z.boolean()]), receivedAt: z.number() });
const stateSchema = z.object({
  schemaVersion: z.literal(1), companyId: z.literal("demo-company-01"), campId: z.literal("demo-camp-mina"),
  revision: z.number().int().nonnegative(), zones: z.array(zoneSchema).length(3),
  history: z.array(recordedSchema).max(100),
  seenIds: z.array(z.string()).max(2000),
});
export type CampState = z.infer<typeof stateSchema>;
export type Scenario = { revision: number; zones: Zone[]; description: string };

export function createCamp(now: number): CampState {
  return { schemaVersion: 1, companyId: "demo-company-01", campId: "demo-camp-mina", revision: 0,
    zones: [
      { id: "a", name: "المنطقة أ", capacity: 400, occupancy: 360, workers: 16, meals: 380, exitOpen: true, updatedAt: now },
      { id: "b", name: "المنطقة ب", capacity: 400, occupancy: 330, workers: 14, meals: 350, exitOpen: true, updatedAt: now },
      { id: "c", name: "المنطقة ج", capacity: 400, occupancy: 280, workers: 12, meals: 300, exitOpen: true, updatedAt: now },
    ], history: [], seenIds: [] };
}
export function restoreCamp(raw: string): CampState | null {
  try {
    const value = stateSchema.parse(JSON.parse(raw));
    if (new Set(value.zones.map(z => z.id)).size !== 3) return null;
    return value;
  } catch { return null; }
}
export function applyEvent(state: CampState, input: CampEvent, now: number): CampState {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) throw Error("التحديث غير صالح. أدخل عددًا صحيحًا غير سالب.");
  const e = parsed.data;
  if ((e.field === "exitOpen") !== (typeof e.value === "boolean")) throw Error("نوع قيمة التحديث غير مناسب.");
  if (state.seenIds.includes(e.id)) throw Error("سبق تسجيل هذا التحديث.");
  const zone = state.zones.find(z => z.id === e.zoneId);
  if (!zone) throw Error("المنطقة غير موجودة.");
  if (e.observedAt < zone.updatedAt) throw Error("التحديث أقدم من حالة المنطقة الحالية.");
  if (e.observedAt > now + 5000) throw Error("وقت التحديث في المستقبل.");
  return { ...state, revision: state.revision + 1,
    zones: state.zones.map(z => z.id === e.zoneId ? { ...z, [e.field]: e.value, updatedAt: e.observedAt } : z),
    history: [{ ...e, previous: zone[e.field], receivedAt: now }, ...state.history].slice(0, 100),
    seenIds: [...state.seenIds, e.id].slice(-2000),
  };
}
export function summarize(zones: Zone[]) {
  const occupancy = zones.reduce((n, z) => n + z.occupancy, 0);
  const capacity = zones.reduce((n, z) => n + z.capacity, 0);
  return { occupancy, capacity, workers: zones.reduce((n,z)=>n+z.workers,0),
    mealDeficit: zones.reduce((n,z)=>n+Math.max(0,z.occupancy-z.meals),0),
    overCapacity: zones.reduce((n,z)=>n+Math.max(0,z.occupancy-z.capacity),0),
    closedExits: zones.filter(z=>!z.exitOpen).length };
}
export function observations(z: Zone): string[] {
  return [z.occupancy > z.capacity ? `تجاوز السعة المسجلة بـ ${z.occupancy-z.capacity}` : "",
    z.occupancy > z.meals ? `نقص ${z.occupancy-z.meals} وجبة في الوجبة الواحدة` : "",
    !z.exitOpen ? "مخرج المنطقة مغلق ويحتاج متابعة المسؤول" : "",
    z.workers === 0 && z.occupancy > 0 ? "لا يوجد عامل متاح في منطقة مشغولة" : ""].filter(Boolean);
}
export function simulateCamp(state: CampState, input: { kind: "ADD" | "MOVE"; from: ZoneId; to: ZoneId; count: number }): Scenario {
  if (!Number.isSafeInteger(input.count) || input.count <= 0 || input.count > 100_000) throw Error("أدخل عددًا صحيحًا بين ١ و١٠٠٬٠٠٠.");
  if (!state.zones.some(z=>z.id===input.to) || !state.zones.some(z=>z.id===input.from)) throw Error("اختر منطقة صحيحة.");
  if (input.kind !== "ADD" && input.kind !== "MOVE") throw Error("نوع السيناريو غير مدعوم.");
  if (input.kind === "MOVE" && (input.from === input.to || state.zones.find(z=>z.id===input.from)!.occupancy < input.count)) throw Error("النقل يحتاج منطقتين مختلفتين وعددًا متاحًا في المصدر.");
  const zones = state.zones.map(z => ({ ...z, occupancy: z.occupancy + (z.id===input.to ? input.count : 0) - (input.kind==="MOVE" && z.id===input.from ? input.count : 0) }));
  return { revision: state.revision, zones, description: input.kind === "ADD" ? `زيادة ${input.count} حاج في ${zones.find(z=>z.id===input.to)!.name}` : `نقل ${input.count} حاج من ${zones.find(z=>z.id===input.from)!.name} إلى ${zones.find(z=>z.id===input.to)!.name}` };
}
export function applyScenario(state: CampState, scenario: Scenario, now: number, id: string): CampState {
  if (state.zones.some(z=>now-z.updatedAt > STALE_AFTER_MS)) throw Error("بيانات المخيم متأخرة. حدّثها قبل التطبيق.");
  if (scenario.revision !== state.revision) throw Error("تغيرت بيانات المخيم بعد المحاكاة. أعد المحاكاة قبل التطبيق.");
  if (!z.array(zoneSchema).length(3).safeParse(scenario.zones).success) throw Error("بيانات السيناريو غير صالحة.");
  if (scenario.zones.some((z,i)=>z.capacity!==state.zones[i]?.capacity || z.meals!==state.zones[i]?.meals || z.workers!==state.zones[i]?.workers || z.exitOpen!==state.zones[i]?.exitOpen)) throw Error("تغيّر السيناريو خارج نطاق الإشغال المسموح.");
  if (scenario.zones.length !== state.zones.length || scenario.zones.some((z,i)=>z.id!==state.zones[i].id)) throw Error("السيناريو غير صالح.");
  if (scenario.zones.some(z=>observations(z).length>0)) throw Error("السيناريو يتضمن تجاوزًا أو نقصًا تشغيليًا. عالج الملاحظات أولًا.");
  return scenario.zones.reduce((current,z,i)=>z.occupancy===state.zones[i].occupancy ? current : applyEvent(current, { id: `${id}-${z.id}`, zoneId: z.id, field: "occupancy", value: z.occupancy, observedAt: now, source: "SCENARIO" }, now),state);
}
