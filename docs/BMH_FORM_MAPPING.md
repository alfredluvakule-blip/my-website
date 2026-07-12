# BMH paper form → Perfusio data model

This maps every field on the Benjamin Mkapa Hospital **Cardiopulmonary
Bypass Perfusion Records** paper form (both sides) to where it lives in Perfusio.
It is the reference for keeping the digital record faithful to the paper one.

## Page 1 — header

| Paper field | Perfusio location |
|---|---|
| PERF NO | `Case.perfNo` |
| DATE | `Case.scheduledDate` |
| NAME OF PATIENT | `Patient.name` |
| REG | `Patient.registrationNumber` |
| AGE / SEX | `Patient.age`, `Patient.sex` |
| WEIGHT (Kg) | `Patient.weightKg` |
| HEIGHT (cm) | `Patient.heightCm` |
| SURFACE AREA (M²) | `Patient.bsaM2` — **derived** by `@perfusio/clinical` |
| BLOOD FLOW RATE (L/MIN) | `Case.targetFlowLmin` — **derived** (CI × BSA) |
| BLOOD GROUP / RH | `Patient.bloodGroup` |
| SURGEONS | `Case.surgeon` (Profile) |
| ANAESTHESIOLOGIST | `Case.anesthetist` (Profile) |
| PERFUSIONIST | `Case.perfusionist` (Profile) |
| TYPE OF OXYGENATOR | `Oxygenator.manufacturer` + `Oxygenator.model` |
| S/N | `Oxygenator.serialNumber` |
| INDUCTION TIME | `Case.inductionTime` |
| CUTTING TIME | `Case.cuttingTime` |
| HEPARINE TIME | `Case.heparinTime` (also `HeparinDose.givenAt`) |
| PATIENT BLOOD VOLUME (ml) | `Case.patientBloodVolumeMl` — **derived** (Nadler EBV) |
| ALLERGY | `Patient.allergies[]` |
| DIAGNOSIS | `Patient.diagnosis` |
| PROCEDURE | `Case.procedure` |
| CANNULA: AORT / SVC / IVC / ROOT VENT / LV CATHETER | `Cannula[]` (type + location) |

## Page 1 — ON / OFF / TOTAL table

| Paper row | Perfusio |
|---|---|
| C.P.B | `CpbInterval` type `CPB` (TOTAL derived from ON/OFF) |
| CROSSCLAMP | `CpbInterval` type `CROSSCLAMP` |
| HOT BLOOD | `CpbInterval` type `HOT_BLOOD` |
| T.C.A | `CpbInterval` type `TCA` |

CPB and cross-clamp totals are also recomputed from timeline events; the
interval table is the direct transcription of the paper ON/OFF/TOTAL cells.

## Page 1 — SITE / SAT / PRESS table

`SitePressure[]` with `site` ∈ {SVC, IVC, RA, MAIN_PA, LEFT_PA, RIGHT_PA, LA, LV,
AO}, plus `saturationPercent` and `pressureMmhg`. FiO₂ is captured per
monitoring record (`MonitoringRecord.fio2`).

## Page 1 — bottom tables

| Paper table | Perfusio |
|---|---|
| 4:1 Cardioplegia (TIME, QUANTITY) | `CardioplegiaDose[]` |
| URINE (Before/During bypass, TIME) | `FluidBalanceEntry` (output `URINE`) + `MonitoringRecord.urineOutputMl` |
| Drugs pre & during pump (DRUG, QUANTITY, TIME) | `IntraopDrug[]` |

## Page 2 — A.C.T (SECONDS)

`ActCheckpointRecord[]` with `checkpoint` ∈ {BASELINE, POST_HEPARIN, ON_PUMP,
POST_PROTAMINE} and `measuredAt`.

## Page 2 — Fluid balance

| Paper line | Perfusio |
|---|---|
| Intake: Prime solution / Blood / Sodium chloride / Plasmalyte / Mannitol | `FluidBalanceEntry` direction `INTAKE`, `intakeType` |
| Out put: Fast / Urine / Ultrafiltration / Hemofiltration | `FluidBalanceEntry` direction `OUTPUT`, `outputType` |
| Total | summed by `@perfusio/clinical` fluid-balance helpers |

## Page 2 — EVENT PRE CPB (time series)

Each column is one `MonitoringRecord`:

| Paper row | Field |
|---|---|
| TIME | `recordedAt` |
| MAP (mmHg) | `map` |
| FLOW RATE (L/Min) | `pumpFlowLmin` |
| GAS FLOW (L/Min) | `sweepGasLmin` |
| FiO₂ (%) | `fio2` |
| NS TEMP (°C) | `nasopharyngealTempC` |
| OXY TEMP (°C) | `oxygenatorTempC` |

## Page 2 — BLOOD CHEMISTRY (time series)

All on `MonitoringRecord`: ACT → `act`; PH → `ph`; PCO₂ → `paco2`; PO₂ → `pao2`;
Na⁺ → `sodium`; K⁺ → `potassium`; Ca⁺⁺ → `calcium`; Hct → `hematocrit`;
Glu → `glucose`; Lac → `lactate`; Hb → `hemoglobin`; BE → `baseExcess`;
HCO₃ → `hco3`; SO₂ → `sao2`/`svo2`.

## Page 2 — DEVICE / UNIT No / BLOOD PRODUCTS / TIME

`BloodProduct[]` (`product`, `unitNumber`, `volumeMl`, `givenAt`); device/lot
traceability via `EquipmentItem` and the `Oxygenator`/`Cannula` lot & serial
fields.
