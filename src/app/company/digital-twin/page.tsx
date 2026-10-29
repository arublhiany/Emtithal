"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { PageHead, Panel, Chip } from "@/components/ui/kit";
import { applyEvent, applyScenario, createCamp, observations, restoreCamp, simulateCamp, summarize,
  STALE_AFTER_MS, TWIN_STORAGE_KEY, type CampState, type CampEvent, type Field, type Scenario, type ZoneId } from "@/lib/twin/camp";
import { projectCompany } from "@/lib/twin/projection";

type State = { camp: CampState; hydrated: boolean; error: string; storageError: boolean };
type Action = { type: "HYDRATE"; raw: string | null; failed: boolean } | { type: "EVENT"; event: CampEvent; now: number }
  | { type: "APPLY"; proposal: Scenario; now: number; id: string } | { type: "ERROR"; message: string }
  | { type: "STORAGE_ERROR" } | { type: "TICK"; zoneId: ZoneId; step: number; now: number; id: string };
function reducer(state: State, action: Action): State {
  try {
    switch (action.type) {
      case "HYDRATE": {
        const restored = action.raw ? restoreCamp(action.raw) : null;
        return { ...state, camp: restored ?? createCamp(Date.now()), hydrated: true, storageError: action.failed,
          error: action.raw && !restored ? "تعذر قراءة البيانات المحفوظة. بدأ مخيم افتراضي جديد." : "" };
      }
      case "TICK": {
        const zone = state.camp.zones.find(z => z.id === action.zoneId)!;
        const event: CampEvent = { id: action.id, zoneId: zone.id, field: "occupancy", value: Math.max(0,zone.occupancy+action.step), observedAt: action.now, source: "SIMULATOR" };
        return { ...state, camp: applyEvent(state.camp,event,action.now), error: "" };
      }
      case "EVENT": return { ...state, camp: applyEvent(state.camp, action.event, action.now), error: "" };
      case "APPLY": return { ...state, camp: applyScenario(state.camp, action.proposal, action.now, action.id), error: "" };
      case "ERROR": return { ...state, error: action.message };
      case "STORAGE_ERROR": return { ...state, storageError: true };
    }
  } catch (e) { return { ...state, error: e instanceof Error ? e.message : "تعذر تطبيق التحديث." }; }
}
const number = (n: number) => n.toLocaleString("ar-SA");
const time = (n: number) => new Date(n).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const inputClass = "w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm";
const buttonClass = "rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const fieldNames: Record<Field,string> = { occupancy: "الإشغال", workers: "العاملون المتاحون", meals: "الوجبات المتاحة لكل وجبة", exitOpen: "حالة المخرج" };
const sourceNames = { MANUAL_DEMO: "إدخال تجريبي يدوي", SIMULATOR: "مولّد أحداث تجريبي", SCENARIO: "تطبيق سيناريو تجريبي" };
export default function DigitalTwinPage() {
  const [state, dispatch] = useReducer(reducer, { camp: createCamp(0), hydrated: false, error: "", storageError: false });
  const [now, setNow] = useState(0);
  const [live, setLive] = useState(false);
  const [selected, setSelected] = useState<ZoneId>("a");
  const [field, setField] = useState<Field>("occupancy");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"ADD"|"MOVE">("ADD");
  const [from, setFrom] = useState<ZoneId>("a");
  const [to, setTo] = useState<ZoneId>("c");
  const [amount, setAmount] = useState("100");
  const [proposal, setProposal] = useState<Scenario|null>(null);
  useEffect(() => {
    try { dispatch({ type: "HYDRATE", raw: localStorage.getItem(TWIN_STORAGE_KEY), failed: false }); }
    catch { dispatch({ type: "HYDRATE", raw: null, failed: true }); }
  }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    try { localStorage.setItem(TWIN_STORAGE_KEY, JSON.stringify(state.camp)); }
    catch { dispatch({ type: "STORAGE_ERROR" }); }
  }, [state.camp, state.hydrated]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()),1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!live || !state.hydrated) return;
    let tick = 0;
    const timer = setInterval(() => {
      const stamp = Date.now(); const ids: ZoneId[] = ["a", "b", "c"];
      const index = tick++ % 3;
      dispatch({ type: "TICK", zoneId: ids[index], step: Math.floor((tick-1)/3)%2 ? -10 : 10, now: stamp, id: crypto.randomUUID() });
    }, 5000);
    return () => clearInterval(timer);
  }, [live, state.hydrated]);
  const projection = useMemo(() => proposal ? projectCompany(proposal.zones) : null, [proposal]);
  if (!state.hydrated) return <p role="status">جارٍ تحميل نموذج المخيم…</p>;
  const { camp } = state;
  const totals = summarize(camp.zones);
  const zone = camp.zones.find(z=>z.id===selected)!;
  const proposedTotals = proposal ? summarize(proposal.zones) : null;
  const stale = camp.zones.filter(z=>now-z.updatedAt > STALE_AFTER_MS);
  const changed = !!proposal && proposal.revision !== camp.revision;
  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() === "") return dispatch({type:"ERROR",message:"أدخل قيمة التحديث أولًا."});
    const stamp = Date.now();
    dispatch({ type: "EVENT", now: stamp, event: { id: crypto.randomUUID(), zoneId: selected, field,
      value: field === "exitOpen" ? value === "true" : Number(value), observedAt: stamp, source: "MANUAL_DEMO" } });
    setValue("");
  }
  function simulate(e: React.FormEvent) {
    e.preventDefault();
    try { setProposal(simulateCamp(camp,{kind,from,to,count:Number(amount)})); }
    catch(e) { setProposal(null); dispatch({type:"ERROR",message:e instanceof Error ? e.message : "تعذر تشغيل السيناريو."}); }
  }
  const options = camp.zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>);
  return <div className="space-y-6">
    <PageHead title="توأم المخيم" subtitle="تابع حالة مخيم منى الافتراضي، ثم اختبر أثر القرار على نسخة منفصلة قبل تطبيقه." />
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-tint)] p-4 text-sm leading-7">
      <strong>تجربة لتوأم رقمي ببيانات محاكاة</strong> — جميع الأعداد والأحداث افتراضية. لا توجد حساسات أو بيانات ميدانية متصلة. السعات والموارد افتراضات تشغيلية مسجلة، وليست حدودًا حكومية. يحفظ المتصفح بيانات هذه التجربة فقط، ولا يشاركها مع الجهات الحكومية أو الأجهزة الأخرى.
    </div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
    {state.storageError && <p role="status" className="text-sm text-amber-800">الحفظ المحلي غير متاح. تبقى التحديثات في هذه الجلسة فقط.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2"><Chip tone={live?"indigo":"neutral"}>{live ? "تدفق محاكى كل ٥ ثوانٍ" : "التدفق التجريبي متوقف"}</Chip><Chip tone={stale.length?"amber":"green"}>{stale.length ? `${number(stale.length)} مناطق بياناتها متأخرة` : "التحديثات ضمن دقيقة"}</Chip><span className="text-xs text-[var(--color-ink-muted)]">نسخة الحالة {number(camp.revision)}</span></div>
      <button className={buttonClass} onClick={()=>setLive(v=>!v)}>{live?"إيقاف التدفق التجريبي":"تشغيل التدفق التجريبي"}</button>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[["الإشغال / السعة",`${number(totals.occupancy)} / ${number(totals.capacity)}`],["العاملون المتاحون",number(totals.workers)],["نقص الوجبات",number(totals.mealDeficit)],["تجاوز السعة",number(totals.overCapacity)]].map(([label,n])=><div className="card p-4" key={label}><p className="text-xs text-[var(--color-ink-muted)]">{label}</p><p className="mt-2 text-2xl font-bold">{n}</p></div>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <h2 className="mb-2 font-bold">مخطط المخيم التفاعلي</h2><p className="mb-4 text-xs leading-6 text-[var(--color-ink-muted)]">اضغط على منطقة لعرض تفاصيلها. المخطط توضيحي، ولا يمثل أبعادًا مساحية أو مسارات إخلاء معتمدة.</p>
        <div className="rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <p className="mb-4 border-b border-dashed border-[var(--color-border-strong)] pb-3 text-center text-xs">المدخل الرئيسي ومنطقة الاستقبال</p>
          <div className="grid gap-3 sm:grid-cols-3">{camp.zones.map(z=>{
            const notices = observations(z); const late = now-z.updatedAt>STALE_AFTER_MS;
            return <button key={z.id} onClick={()=>{setSelected(z.id);setValue("");}} aria-pressed={selected===z.id} className={`rounded-xl border-2 bg-white p-4 text-right transition ${selected===z.id?"border-[var(--color-primary)] ring-2 ring-[var(--color-primary-tint-strong)]":"border-[var(--color-border)]"}`}>
              <span className="block font-bold">{z.name}</span><span className="my-3 block text-2xl font-bold">{number(z.occupancy)} <span className="text-xs font-normal">حاج</span></span>
              <span className="block text-xs">السعة المسجلة {number(z.capacity)}</span>
              <span className="my-3 block h-2 overflow-hidden rounded-full bg-[var(--color-bg)]"><span className={`block h-full ${notices.length?"bg-amber-600":"bg-[var(--color-primary)]"}`} style={{width:`${Math.min(100,z.occupancy/z.capacity*100)}%`}} /></span>
              <span className="block text-xs">{z.exitOpen?"المخرج مفتوح":"المخرج مغلق"}</span>
              <span className="mt-2 block text-xs text-[var(--color-ink-muted)]">{late?"بيانات متأخرة":`آخر تحديث ${time(z.updatedAt)}`}</span>
              <span className="mt-2 block text-xs text-amber-800">{notices.length?`${number(notices.length)} ملاحظات تشغيلية`:"لا تجاوزات في الفحوص التشغيلية المحددة"}</span>
            </button>;
          })}</div>
          <p className="mt-4 border-t border-dashed border-[var(--color-border-strong)] pt-3 text-center text-xs">ممر خدمة مشترك · نقاط إعاشة · مخارج المناطق</p>
        </div>
      </Panel>
      <Panel><h2 className="font-bold">تفاصيل {zone.name}</h2><dl className="my-4 space-y-2 text-sm">{[["الإشغال",zone.occupancy],["السعة",zone.capacity],["العاملون",zone.workers],["الوجبات المتاحة",zone.meals]].map(([k,v])=><div className="flex justify-between" key={k}><dt>{k}</dt><dd>{number(Number(v))}</dd></div>)}</dl>
        {observations(zone).map(n=><p className="mb-2 text-xs text-amber-800" key={n}>{n}</p>)}
        <form onSubmit={submitEvent} className="mt-4 space-y-3"><label className="block text-sm">حقل التحديث<select className={inputClass} value={field} onChange={e=>{setField(e.target.value as Field);setValue("");}}>{Object.entries(fieldNames).map(([k,n])=><option key={k} value={k}>{n}</option>)}</select></label>
          <label className="block text-sm">القيمة الجديدة{field==="exitOpen"?<select className={inputClass} value={value} onChange={e=>setValue(e.target.value)} required><option value="">اختر الحالة</option><option value="true">مفتوح</option><option value="false">مغلق</option></select>:<input className={inputClass} type="number" min="0" max="1000000" step="1" value={value} onChange={e=>setValue(e.target.value)} required />}</label>
          <button className={buttonClass} type="submit">تسجيل تحديث تجريبي</button>
        </form>
      </Panel>
    </div>
    <Panel><h2 className="mb-2 font-bold">محاكاة قرار على الحالة الحالية</h2><p className="mb-4 text-xs leading-6 text-[var(--color-ink-muted)]">تبدأ كل محاكاة من آخر نسخة من المخيم. النقل يحافظ على العدد الإجمالي، والزيادة ترفع الطلب على المنطقة المستقبلة. يفحص النموذج السعة والإعاشة وحالة المخارج والعاملين المتاحين، ولا يقدّر الازدحام أو زمن الإخلاء.</p>
      <form onSubmit={simulate} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">القرار<select className={inputClass} value={kind} onChange={e=>setKind(e.target.value as "ADD"|"MOVE")}><option value="ADD">زيادة عدد الحجاج</option><option value="MOVE">نقل بين منطقتين</option></select></label>
        <label className="text-sm">من المنطقة<select className={inputClass} disabled={kind==="ADD"} value={from} onChange={e=>setFrom(e.target.value as ZoneId)}>{options}</select></label>
        <label className="text-sm">إلى المنطقة<select className={inputClass} value={to} onChange={e=>setTo(e.target.value as ZoneId)}>{options}</select></label>
        <label className="text-sm">عدد الحجاج<input className={inputClass} type="number" min="1" max="100000" step="1" value={amount} onChange={e=>setAmount(e.target.value)} required /></label><button className={buttonClass}>تشغيل المحاكاة</button>
      </form>
      {proposal && proposedTotals && <div className="mt-5 space-y-4 border-t border-[var(--color-border)] pt-4">
        <h3 className="font-semibold">{proposal.description}</h3>
        {changed && <p role="status" className="text-sm text-amber-800">تغيرت حالة المخيم. أعد تشغيل المحاكاة قبل تطبيق الاقتراح.</p>}
        {stale.length>0 && <p className="text-sm text-amber-800">بيانات منطقة واحدة أو أكثر تجاوزت دقيقة. حدّث بياناتها قبل التطبيق.</p>}
        <div className="overflow-x-auto"><table className="w-full text-right text-sm"><caption className="mb-2 text-right text-xs">النتيجة التشغيلية ضمن افتراضات هذه التجربة</caption><thead><tr><th className="p-2">المؤشر</th><th>قبل القرار</th><th>بعد القرار</th></tr></thead><tbody>{[["عدد الحجاج",totals.occupancy,proposedTotals.occupancy],["تجاوز السعة",totals.overCapacity,proposedTotals.overCapacity],["نقص الوجبات",totals.mealDeficit,proposedTotals.mealDeficit],["المخارج المغلقة",totals.closedExits,proposedTotals.closedExits]].map(([label,before,after])=><tr key={label} className="border-t border-[var(--color-border)]"><th className="p-2 font-normal">{label}</th><td>{number(Number(before))}</td><td>{number(Number(after))}</td></tr>)}</tbody></table></div>
        {proposal.zones.flatMap(z=>observations(z).map(n=><p key={z.id+n} className="text-sm text-amber-800">{z.name}: {n}</p>))}
        {projection && <p className="rounded-lg bg-[var(--color-bg)] p-3 text-xs leading-6">فحص مستقل بمحرك سبّاق الحالي: مؤشر الجاهزية {projection.kpis.readiness ?? "—"}. يفترض الربط أن تغير إشغال هذا المخيم يضاف إلى عدد الشركة الافتراضية البالغ ٤٢٠٠. يستخدم الفحص الأدلة التجريبية الحالية. تغيّر الإشغال وحده لا يثبت تغير الامتثال، ولا تدخل فحوص السعة والوجبات تلقائيًا في الدرجة التنظيمية.</p>}
        <button className={buttonClass} disabled={changed || stale.length>0 || proposal.zones.some(z=>observations(z).length>0)} onClick={()=>{setLive(false);dispatch({type:"APPLY",proposal,now:Date.now(),id:crypto.randomUUID()});}}>تطبيق الاقتراح كتحديث تجريبي</button>
        <p className="text-xs text-[var(--color-ink-muted)]">التطبيق يحدّث المخيم الافتراضي وسجل الأحداث فقط. لا يرسل أمرًا ميدانيًا ولا يغيّر أدلة الشركة أو أحكام الامتثال.</p>
      </div>}
    </Panel>
    <Panel><h2 className="mb-3 font-bold">سجل تحديثات المخيم</h2><p className="mb-3 text-xs text-[var(--color-ink-muted)]">آخر ١٠٠ حدث مقبول. يعرض السجل مصدر القيمة ووقت رصدها، ويرفض التحديثات المكررة أو الأقدم من الحالة الحالية.</p>
      {camp.history.length===0?<p className="text-sm">لا توجد أحداث بعد. أضف تحديثًا أو شغّل التدفق التجريبي.</p>:<div className="max-h-80 overflow-auto"><table className="w-full text-right text-xs"><thead><tr><th className="p-2">الوقت</th><th>المنطقة والحقل</th><th>قبل / بعد</th><th>المصدر</th></tr></thead><tbody>{camp.history.map(e=><tr key={e.id} className="border-t border-[var(--color-border)]"><td className="p-2">{time(e.observedAt)}</td><td>{camp.zones.find(z=>z.id===e.zoneId)?.name} · {fieldNames[e.field]}</td><td>{typeof e.previous==="boolean"?(e.previous?"مفتوح":"مغلق"):number(e.previous)} / {typeof e.value==="boolean"?(e.value?"مفتوح":"مغلق"):number(e.value)}</td><td>{sourceNames[e.source]}</td></tr>)}</tbody></table></div>}
    </Panel>
  </div>;
}
