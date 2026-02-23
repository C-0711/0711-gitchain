# Hersteller Onboarding Plan — 0711 Product Container Platform

**Version**: 1.0
**Date**: 2026-02-23
**Blueprint**: Bosch Thermotechnik (23,141 Produkte, 30,156 Media-Dateien, 194K ETIM-Features)

---

## OVERVIEW

Dieses Dokument beschreibt den vollstandigen Onboarding-Prozess fur einen neuen Hersteller auf der 0711 Product Container Platform. Jedes Produkt wird als Container mit vollstandiger Provenienz, Zitaten, Media-Assets und Blockchain-Verankerung verwaltet.

**Zielgruppe**: Hersteller der Elektro-/SHK-/HVAC-Branche (ETIM-klassifiziert)
**Zeitrahmen**: 2-4 Wochen (abhangig von Datenqualitat und Produktanzahl)
**Ergebnis**: Alle Produkte als verifizierte, blockchain-verankerte Container mit inject() API

---

## PHASE 0: VORBEREITUNG & ASSESSMENT (Tag 1-2)

### 0.1 Hersteller-Profil erstellen

| Feld | Beschreibung | Beispiel (Bosch) |
|------|-------------|-----------------|
| **Namespace** | Eindeutiger Kurzname (lowercase, keine Sonderzeichen) | `bosch` |
| **Firmenname** | Vollstandiger Firmenname | `Robert Bosch GmbH` |
| **DUNS-Nummer** | Dun & Bradstreet Identifikation | `DE-315723486` |
| **GLN** | Global Location Number (GS1) | `4054025...` |
| **Branche** | Primarbranche (ETIM-Gruppe) | HVAC, Elektro, Sanitaer |
| **ETIM-Klassen** | Genutzte ETIM-Klassen | EC012034, EC010232, EC010233 |
| **eClass-Version** | Falls eClass statt ETIM | eClass 15.0 |
| **Produktanzahl** | Geschatzte Gesamtzahl SNRs | 23,141 |
| **Media-Volume** | Geschatztes Datenvolumen | ~12 GB |
| **Kontaktperson** | Technischer Ansprechpartner | Max Mustermann, PIM-Team |
| **Datenquelle** | PIM/ERP-System des Herstellers | SAP, Akeneo, Perfion, Stibo |

### 0.2 Daten-Assessment Checkliste

```
PFLICHTDATEN (Minimum Viable Product):
[ ] Artikelnummern (SNR / Supplier PID) — eindeutig pro Produkt
[ ] Produktnamen und Kurzbezeichnungen
[ ] ETIM-Klassifizierung (Klasse + Features) ODER eClass-Zuordnung
[ ] Mindestens 1 Produktbild pro Artikel (JPG/PNG)
[ ] Mindestens 1 Datenblatt (PDF)

STANDARDDATEN (Recommended):
[ ] GTIN/EAN-Codes
[ ] Product Master Gruppierung (Varianten-Familien)
[ ] Vollstandige ETIM-Features mit Werten und Einheiten
[ ] Alle Medien: Bilder, CAD, PDFs, Videos
[ ] BMEcat 5.0 Export aus PIM-System
[ ] Produktfamilien-/Kategorie-Hierarchie

PREMIUM-DATEN (Full Container):
[ ] Gesamtkatalog als PDF (fur Catalog-Chunk-Extraction)
[ ] Montageanleitungen, Betriebsanleitungen, Schaltplane
[ ] CAD-Dateien (DWG, DXF, STEP, IFC/BIM)
[ ] CE-Erklarungen und Zertifikate
[ ] Energielabel (ErP) Daten
[ ] Zubehor-/Ersatzteil-Zuordnungen
[ ] Digital Product Passport Daten (EU ESPR)
```

### 0.3 Datenformat-Analyse

| Format | Unterstutzung | Import-Methode |
|--------|--------------|----------------|
| **BMEcat 5.0 XML** | Nativ | `bmecat_parser.py` (existiert) |
| **CSV/Excel** | Standard | CSV-Template + Mapping-Config |
| **JSON** | Nativ | Direkt-Import |
| **ARGE/SAP Export** | Bosch-spezifisch | `arge_import.py` Muster |
| **Akeneo API** | Via Connector | REST API Pull |
| **Perfion/Stibo** | Via Connector | Webhook oder Batch |
| **ETIM BMEcat** | Nativ | BMEcat mit ETIM-Namespace |

---

## PHASE 1: INFRASTRUKTUR AUFSETZEN (Tag 2-3)

### 1.1 Namespace erstellen

```bash
# Via API
curl -X POST http://localhost:3100/api/namespaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "neuer-hersteller",
    "display_name": "Neuer Hersteller GmbH",
    "description": "HVAC-Produkte, ETIM EC012034",
    "owner_id": "admin@0711.io"
  }'
```

### 1.2 Contributor registrieren

Jede Datenquelle wird als Contributor mit Default-Trust-Level registriert:

```sql
-- Hersteller selbst (Trust: highest)
INSERT INTO contributors (id, name, role, organization, trust_default)
VALUES (
  'neuer-hersteller',
  'Neuer Hersteller GmbH',
  'manufacturer',
  'Neuer Hersteller GmbH',
  'highest'
);

-- ETIM-Klassifizierung (Trust: high)
INSERT INTO contributors (id, name, role, trust_default)
VALUES ('etim-international', 'ETIM International', 'classification', 'high');

-- AI-Enrichment Pipeline (Trust: medium)
INSERT INTO contributors (id, name, role, trust_default)
VALUES ('0711-ai-pipeline', '0711 AI Enrichment', 'ai_agent', 'medium');

-- Menschlicher Reviewer (Trust: verified nach Review)
INSERT INTO contributors (id, name, role, email, trust_default)
VALUES (
  'reviewer@neuer-hersteller.de',
  'Max Mustermann',
  'human_reviewer',
  'reviewer@neuer-hersteller.de',
  'verified'
);
```

### 1.3 Datenbank vorbereiten

```bash
# PostgreSQL-Schema ist bereits deployed (gitchain-postgres:5440)
# Nur Namespace-Indexe prufen:

docker exec gitchain-postgres psql -U gitchain -d gitchain -c "
  SELECT count(*) FROM containers WHERE namespace = 'neuer-hersteller';
"
# Sollte 0 sein (frischer Namespace)
```

### 1.4 MCP-Server deployen (Optional)

Fur Hersteller, die ihren eigenen MCP-Server wollen:

```bash
# Template kopieren
cp -r ~/0711/0711-mcp-tenant-template/ ~/0711/neuer-hersteller-mcp/

# docker-compose.yml anpassen:
# - Container-Name: neuer-hersteller-mcp
# - Port: naechster freier Port (z.B. 9850)
# - DB-Connection: gitchain-postgres oder eigene PostgreSQL

cd ~/0711/neuer-hersteller-mcp/
docker compose build --no-cache && docker compose up -d
```

### 1.5 Media-Verzeichnis erstellen

```bash
# Physisches Verzeichnis fur Media-Dateien
mkdir -p ~/0711/neuer-hersteller/media/
# Unterstruktur (optional, nach Bosch-Muster):
# media/
# ├── images/      (JPG, PNG)
# ├── documents/   (PDF)
# ├── cad/         (DWG, DXF, STEP)
# └── video/       (MP4)
```

---

## PHASE 2: DATEN-IMPORT (Tag 3-7)

### 2.1 Import-Script erstellen

Basierend auf dem Bosch-Blueprint (`bosch-import.ts`):

```typescript
// scripts/import/neuer-hersteller-import.ts

import { Pool } from 'pg';
import { createHash } from 'crypto';

const NAMESPACE = 'neuer-hersteller';
const BATCH_SIZE = 500;

interface ManufacturerProduct {
  snr: string;                    // Artikelnummer (Pflicht)
  gtin?: string;                  // EAN/GTIN
  product_name: string;           // Produktname (Pflicht)
  product_line?: string;          // Produktlinie/Familie
  brand: string;                  // Marke
  etim_class?: string;            // ETIM-Klasse (z.B. EC012034)
  features: FeatureData[];        // ETIM-Features
  media: MediaFile[];             // Verknuepfte Dateien
  documents: DocumentData[];      // PDFs mit extrahiertem Text
}

async function importProducts(products: ManufacturerProduct[]) {
  const pool = new Pool({
    connectionString: 'postgresql://gitchain:gitchain2026@localhost:5440/gitchain'
  });

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    for (const product of batch) {
      try {
        // 1. Container erstellen
        const containerId = `0711:product:${NAMESPACE}:${product.snr}:v1`;
        const contentHash = createHash('sha256')
          .update(JSON.stringify(product))
          .digest('hex');

        await pool.query(`
          INSERT INTO containers (container_id, type, namespace, identifier, version, data, content_hash)
          VALUES ($1, 'product', $2, $3, 1, $4, $5)
          ON CONFLICT (container_id) DO NOTHING
        `, [containerId, NAMESPACE, product.snr, JSON.stringify(product), contentHash]);

        // 2. Layer 000-core (Herstellerdaten)
        await pool.query(`
          INSERT INTO container_layers (id, container_id, name, type, contributor_id, trust_level, commit_hash)
          VALUES ('000-core', (SELECT id FROM containers WHERE container_id = $1),
                  'Manufacturer Core Data', 'manufacturer', $2, 'highest', $3)
        `, [containerId, NAMESPACE, contentHash]);

        // 3. Atoms: Identity
        const containerUuid = await getContainerUuid(pool, containerId);
        await insertAtom(pool, containerUuid, '000-core', 'identity.snr', product.snr, 'manufacturer');
        await insertAtom(pool, containerUuid, '000-core', 'identity.brand', product.brand, 'manufacturer');
        await insertAtom(pool, containerUuid, '000-core', 'identity.product_name', product.product_name, 'manufacturer');

        // 4. Atoms: ETIM Features
        for (const feature of product.features) {
          await insertFeatureAtom(pool, containerUuid, feature);
        }

        // 5. Media-Referenzen
        for (const media of product.media) {
          await insertMediaRef(pool, containerUuid, media);
        }

        // 6. Commit erstellen
        await pool.query(`
          INSERT INTO container_commits (container_id, version, data, message, author_id, commit_hash)
          VALUES ($1, 1, $2, 'Initial import', $3, $4)
        `, [containerUuid, JSON.stringify(product), NAMESPACE, contentHash]);

        imported++;
      } catch (err) {
        errors++;
        console.error(`Fehler bei SNR ${product.snr}:`, err);
      }
    }

    console.log(`Fortschritt: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} | Importiert: ${imported} | Fehler: ${errors}`);
  }

  console.log(`\nIMPORT ABGESCHLOSSEN`);
  console.log(`Importiert: ${imported} | Uebersprungen: ${skipped} | Fehler: ${errors}`);
}
```

### 2.2 CSV-Import-Template

Fur Hersteller ohne BMEcat-Export:

```csv
snr;gtin;product_name;product_line;brand;etim_class;etim_features;media_files
8738208680;4054025123456;Compress 7000i AW;CS7000iAW;Bosch;EC012034;"EF020090=7.0kW|EF000050=50Hz|EF000008=900mm";"bob_00335430.jpg|bodbed_6720869205.pdf"
```

**Mapping-Konfiguration** (`import-mapping.json`):

```json
{
  "manufacturer": "neuer-hersteller",
  "format": "csv",
  "delimiter": ";",
  "encoding": "utf-8",
  "field_mapping": {
    "snr": { "source_column": "Artikelnummer", "required": true },
    "gtin": { "source_column": "EAN", "required": false },
    "product_name": { "source_column": "Bezeichnung", "required": true },
    "product_line": { "source_column": "Produktlinie", "required": false },
    "brand": { "source_column": "Marke", "required": true, "default": "Neuer Hersteller" },
    "etim_class": { "source_column": "ETIM_Klasse", "required": false },
    "etim_features": {
      "source_column": "ETIM_Merkmale",
      "format": "pipe_separated",
      "pattern": "EF_CODE=VALUE UNIT"
    },
    "media_files": {
      "source_column": "Medien",
      "format": "pipe_separated",
      "base_path": "/home/christoph.bertsch/0711/neuer-hersteller/media/"
    }
  }
}
```

### 2.3 Import-Reihenfolge (Layers)

```
SCHRITT 1: Core-Import (Layer 000-core, Trust: HIGHEST)
───────────────────────────────────────────────────────
Quelle: PIM-System / BMEcat / CSV Export
Inhalt: Artikelstamm, GTIN, Bezeichnungen, Abmessungen, Gewicht
        Zubehoer-Zuordnungen, Produktfamilien
Atoms:  identity.*, dimensions.*, arge.*

SCHRITT 2: Media-Import (Layer 000-core, Trust: HIGHEST)
────────────────────────────────────────────────────────
Quelle: DAM-System / Dateisystem
Inhalt: Produktbilder (JPG/PNG)
        Datenblaetter (PDF)
        CAD-Zeichnungen (DWG/DXF/STEP)
        Montageanleitungen (PDF)
        Videos (MP4)
Tabelle: container_media

SCHRITT 3: ETIM-Klassifizierung (Layer 001-etim, Trust: HIGH)
─────────────────────────────────────────────────────────────
Quelle: ETIM-Datenbank / PIM-Export
Inhalt: ETIM-Klasse + alle EF-Codes mit Werten
        ETIM-Version (10.0 oder 11.0)
Atoms:  etim.class_code, etim.EF*

SCHRITT 4: eClass-Mapping (Layer 002-eclass, Trust: HIGH)
─────────────────────────────────────────────────────────
Optional, falls eClass zusaetzlich zu ETIM verwendet wird
Quelle: eClass-Zuordnung aus PIM
Inhalt: eClass-IRDI, Property-Werte
Atoms:  eclass.*

SCHRITT 5: Dokument-Extraktion (Layer 003-documents, Trust: HIGH)
─────────────────────────────────────────────────────────────────
Automatisch: OCR-Pipeline verarbeitet alle PDFs
Quelle: Physische PDF-Dateien
Inhalt: Extrahierter Text, Seitenzahlen, Strukturierte Specs
Engine: Pixtral OCR / Tesseract / pdfplumber
Tabelle: container_media.content_text

SCHRITT 6: AI-Enrichment (Layer 004-ai, Trust: MEDIUM)
──────────────────────────────────────────────────────
Automatisch: Claude analysiert Dokumente und extrahiert Features
Quelle: document_content + ETIM-Feature-Schema
Inhalt: Feature-Werte mit Zitaten (Dokument, Seite, Zitat)
Atoms:  etim.EF* (mit citations)

SCHRITT 7: Menschliche Verifizierung (Trust-Upgrade: MEDIUM → VERIFIED)
───────────────────────────────────────────────────────────────────────
Manuell: Reviewer prueft Konflikte im Conflict Center
Aktion: confirmed ✓ / accept_document / keep_current
Ergebnis: Trust-Level steigt von "medium" auf "verified"
```

### 2.4 Validierung nach Import

```bash
# Import-Statistiken prufen:
curl http://localhost:3100/api/namespaces/neuer-hersteller/stats

# Erwartete Antwort:
{
  "namespace": "neuer-hersteller",
  "total_containers": 1500,
  "total_atoms": 132000,
  "total_media": 4500,
  "layers": {
    "000-core": { "containers": 1500, "atoms": 45000 },
    "001-etim": { "containers": 1200, "atoms": 72000 },
    "004-ai":   { "containers": 800,  "atoms": 15000 }
  },
  "verification": {
    "confirmed": 8500,
    "likely": 2100,
    "conflict": 1800,
    "not_found": 2600
  }
}
```

---

## PHASE 3: AI-ENRICHMENT & OCR (Tag 7-14)

### 3.1 PDF-Verarbeitung (OCR Pipeline)

Alle PDFs des Herstellers werden durch die OCR-Pipeline geschickt:

```
Datenblaetter (DB)        ──► Pixtral OCR (bevorzugt, hohe Qualitaet)
Montageanleitungen (MA)   ──► Pixtral OCR
Betriebsanleitungen (IS)  ──► Pixtral OCR
Schaltplaene (EL)         ──► pdfplumber (strukturierte Tabellen)
Ersatzteillisten (PA)     ──► pdfplumber (Tabellen-Extraktion)

Ergebnis pro Dokument:
├── content_text: Volltext (alle Seiten)
├── page_count: Seitenzahl
├── extracted_specs: { "Heizleistung": "7.0 kW", "SCOP": "4.8" }
├── extracted_sections: ["Technische Daten", "Montage", "Wartung"]
└── extraction_quality: 0.92 (Konfidenz)
```

### 3.2 Feature-Extraktion (AI Enrichment)

Fur jedes Produkt: Claude liest die extrahierten Dokumente und fullt ETIM-Features:

```
INPUT:
├── ETIM-Klasse EC012034 → 88 EF-Codes erwartet
├── Dokument-Texte (OCR) aus Datenblaettern
├── Bestehende Werte aus Layer 000-core
└── Sibling-Daten aus gleicher Produktfamilie

PROCESSING:
├── Claude analysiert Dokumente pro Feature
├── Extrahiert Werte mit Seitenreferenz
├── Vergleicht mit bestehenden Werten
└── Erstellt Citation pro Feature

OUTPUT PRO FEATURE:
├── value: 7.0
├── unit: "kW"
├── source: "claude_direct_semantic"
├── citation:
│   ├── document: "datenblatt_xyz.pdf"
│   ├── page: 2
│   ├── excerpt: "Nennheizleistung: 7,0 kW bei A7/W35"
│   ├── confidence: 0.95
│   └── status: "confirmed" | "likely" | "conflict" | "not_found"
└── trust: "medium" (bis zur menschlichen Verifizierung)
```

### 3.3 Citation-Status-Verteilung (Erfahrungswerte)

Basierend auf Bosch-Daten (138 Citations pro Produkt):

| Status | Anteil | Bedeutung | Aktion |
|--------|--------|-----------|--------|
| **confirmed** ✓ | ~40% | Dokument bestaetigt DB-Wert | Automatisch verified |
| **likely** ? | ~5% | Wahrscheinlich korrekt, aber unsicher | Manueller Review |
| **conflict** ! | ~22% | Dokument-Wert ≠ DB-Wert | Manueller Review PFLICHT |
| **not_found** ~ | ~28% | Kein Dokument-Nachweis gefunden | Markieren, ggf. nachliefern |

---

## PHASE 4: VERIFIZIERUNG & CONFLICT RESOLUTION (Tag 14-21)

### 4.1 Conflict Center

Der Hersteller-Reviewer bekommt Zugang zum Conflict Center:

```
URL: https://bosch.0711.io (Muster) → https://[hersteller].0711.io

Conflict Center zeigt:
┌──────────────────────────────────────────────────────────────┐
│  CONFLICTS (1,800 zu pruefen)                                │
│                                                              │
│  SNR 12345678 — "Nennheizleistung"                           │
│  ├── DB-Wert:      7.0 kW                                   │
│  ├── Dokument-Wert: 7.5 kW (Datenblatt S.2)                 │
│  ├── Zitat: "Nennheizleistung bei A7/W35: 7,5 kW"           │
│  ├── Konfidenz: 0.89                                         │
│  │                                                           │
│  └── Aktionen:                                               │
│      [Dokument akzeptieren]  → Wert wird auf 7.5 aktualisiert│
│      [DB-Wert behalten]      → Markiert als geprueft         │
│      [Ueberspringen]        → Bleibt als Konflikt           │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Trust-Upgrade-Pfad

```
IMPORT (Tag 3-7):
  Layer 000-core  → Trust: HIGHEST (Herstellerdaten unveraendert)
  Layer 001-etim  → Trust: HIGH (ETIM-Standard)

AI-ENRICHMENT (Tag 7-14):
  Layer 004-ai    → Trust: MEDIUM (AI-extrahiert, unverified)

REVIEW (Tag 14-21):
  Confirmed Citations → Trust: MEDIUM → VERIFIED
  Conflict resolved   → Trust: MEDIUM → VERIFIED (mit Audit-Trail)
  Not found           → Trust: MEDIUM (bleibt, markiert)

NACH REVIEW:
  Container mit >80% verified Features → bereit fuer Blockchain-Anchoring
```

### 4.3 Qualitaets-Metriken (Quality Gate)

```
MINIMUM fuer Blockchain-Anchoring:
[ ] Fill-Rate ≥ 80% (Features mit Werten)
[ ] Citation-Coverage ≥ 60% (Features mit Dokumentnachweis)
[ ] Conflict-Rate < 15% (ungeloeste Konflikte)
[ ] Alle PFLICHT-Features ausgefuellt
[ ] Mindestens 1 Produktbild vorhanden
[ ] Mindestens 1 Datenblatt mit OCR-Extraktion

EMPFOHLEN:
[ ] Fill-Rate ≥ 95%
[ ] Citation-Coverage ≥ 80%
[ ] Alle Konflikte aufgeloest
[ ] Mindestens 3 verschiedene Dokumenttypen
[ ] CAD-Zeichnungen vorhanden
[ ] B2B/B2C Content generiert
```

---

## PHASE 5: CONTENT-GENERIERUNG (Tag 18-21)

### 5.1 B2B FactSheet

Basierend auf den verifizierten Daten wird pro Produkt ein FactSheet generiert:

```
INPUT:
├── Verified Features (88 ETIM EF-Codes)
├── Catalog Content (falls Gesamtkatalog vorhanden)
├── Document Extracts (OCR-Texte)
├── Media Assets (Bilder, CAD, PDFs)
└── Content Rules V6.2 (Zeichenlimits, Terminologie)

OUTPUT (B2B):
├── main_claim: 100 Zeichen max, 1x Markennennung
├── headline: 100 Zeichen max
├── short_description: 250 Zeichen max
├── highlights: 5x je 120 Zeichen (technisch)
├── benefits: 3x {headline + 4x reason_why}
├── product_description: 15 Zeilen je 200 Zeichen
├── equipment: 15 Zeilen je 200 Zeichen (variantenspezifisch)
├── notes: 3 Zeilen
└── application: 3 Zeilen
```

### 5.2 B2C Derivation

```
B2B Content
    │
    ▼ strip_technical_values()
    │ - Entferne kW, SCOP, dB(A), Temperaturbereiche
    │ - Vereinfache Fachbegriffe
    │ - Fokus auf Kundennutzen statt Technik
    │
    ▼
B2C Content
├── main_claim: "Effizient heizen — nachhaltige Waerme"
├── highlights: ["Sparsam heizen", "Zukunftssicher", ...]
└── benefits: [outcome-focused, keine technischen Werte]
```

### 5.3 Digital Product Passport (DPP)

Falls EU-DPP-Pflicht (ab 2027 fur energierelevante Produkte):

```
DPP-Layer (Layer 005-dpp, Trust: CERTIFIED):
├── Identifikation: GTIN, GS1 Digital Link
├── Nachhaltigkeit: Energieklasse, SCOP, GWP, Kaeltemittel
├── Reparierbarkeit: Ersatzteilverfuegbarkeit, Reparaturindex
├── Compliance: CE, ErP, Zertifikate
├── CO2-Fussabdruck: Herstellung, Transport, Nutzung, Entsorgung
└── Content-Hash → Blockchain-Verankerung
```

---

## PHASE 6: BLOCKCHAIN-VERANKERUNG (Tag 21-22)

### 6.1 Batch-Anchoring

```
Alle verifizierten Container (Quality Gate bestanden):

Container 1: 0711:product:neuer-hersteller:SNR001:v1
Container 2: 0711:product:neuer-hersteller:SNR002:v1
...
Container N: 0711:product:neuer-hersteller:SNRN:v1

    │
    ▼ SHA-256 pro Container
    │
┌──────────────────────────────────────────┐
│ Hash(C1), Hash(C2), ..., Hash(CN)        │
│                                          │
│          Merkle Tree                     │
│            ┌───┐                         │
│           /     \                        │
│        ┌───┐  ┌───┐                      │
│       / \   / \                          │
│     H1  H2  H3  H4  ...                 │
│                                          │
│ Merkle Root: 0x7a3f...                   │
└──────────┬───────────────────────────────┘
           │
           ▼ registerBatch(merkleRoot, containerCount)
           │
┌──────────────────────────────────────────┐
│ Base Mainnet (Chain ID: 8453)            │
│ Contract: 0xAd31465A5618F...             │
│ TX: 0x9b2c...                            │
│ Block: #18234567                         │
│ Gas: ~$0.02                              │
│                                          │
│ JEDER kann verifizieren:                 │
│ verifyContent(batchId, hash, proof)      │
│ → true ✓                                │
└──────────────────────────────────────────┘
```

### 6.2 Verifikations-URL

Jeder Container bekommt eine offentliche Verifikations-URL:

```
https://verify.0711.io/0711:product:neuer-hersteller:SNR001:v1

QR-Code → scannt zu Verifikationsseite
├── Container-ID
├── Content-Hash
├── Blockchain-TX
├── Alle Features mit Citations
├── Trust-Level pro Datenpunkt
└── "Verified on Base Mainnet ✓"
```

---

## PHASE 7: GO-LIVE & DISTRIBUTION (Tag 22-28)

### 7.1 inject() API aktivieren

```typescript
// Jetzt koennen AI-Agents die Daten abrufen:

const context = await inject({
  containers: ["0711:product:neuer-hersteller:SNR001:v1"],
  verify: true,
  trust_min: "verified",
  format: "markdown",
  include_citations: true
});

// Ergebnis: Verifizierter, formatierter Produktkontext
// mit Blockchain-Beweis und allen Zitaten
```

### 7.2 MCP-Tool registrieren

```json
// In .claude.json oder MCP-Server-Config:
{
  "mcpServers": {
    "neuer-hersteller": {
      "command": "node",
      "args": ["~/0711/neuer-hersteller-mcp/server.js"],
      "env": {
        "GITCHAIN_API": "http://localhost:3100",
        "NAMESPACE": "neuer-hersteller"
      }
    }
  }
}
```

### 7.3 Hub-UI Zugang

Der Hersteller bekommt Zugang zum GitChain Hub:

```
https://hub.0711.io/neuer-hersteller/

Ansichten:
├── Container Browser (alle Produkte durchsuchen)
├── Container Detail (Atoms, Layers, Citations, Media)
├── Commit History (Git-like Aenderungshistorie)
├── Conflict Center (offene Konflikte loesen)
├── Verification Dashboard (Blockchain-Status)
└── Analytics (Coverage, Fill-Rate, Trust-Verteilung)
```

### 7.4 Monitoring & Wartung

```
LAUFENDER BETRIEB:

Wochentlich:
[ ] Neue Produkte importieren (Delta-Import)
[ ] Offene Konflikte pruefen und loesen
[ ] Fill-Rate-Entwicklung tracken

Monatlich:
[ ] Neue Datenblaetter verarbeiten (OCR + AI)
[ ] Content aktualisieren (B2B/B2C)
[ ] Neue Container-Versionen anchoren
[ ] Trust-Level-Verteilung analysieren

Quartalsweise:
[ ] ETIM-Version-Update pruefen (10→11)
[ ] DPP-Daten aktualisieren
[ ] Gesamtkatalog-Update verarbeiten
[ ] Compliance-Pruefung (CE, ErP, DPP)
```

---

## TIMELINE ZUSAMMENFASSUNG

```
WOCHE 1 (Tag 1-7)
┌─────────────────────────────────────────────────────────────┐
│ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So                            │
│ Assessment │ Infra │ Infra │ Import │ Import │ Import │ -- │
│ Profil     │ NS    │ MCP   │ Core   │ ETIM   │ Media  │    │
│ Checkliste │ DB    │ Media │ Layer  │ Layer  │ Layer  │    │
└─────────────────────────────────────────────────────────────┘

WOCHE 2 (Tag 7-14)
┌─────────────────────────────────────────────────────────────┐
│ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So                            │
│ OCR │ OCR │ AI   │ AI   │ AI   │ --   │ --                 │
│ PDFs│ PDFs│ Enrich│ Enrich│ Enrich│     │                    │
│ Start│ Cont│ Start │ Cont  │ Done  │     │                    │
└─────────────────────────────────────────────────────────────┘

WOCHE 3 (Tag 14-21)
┌─────────────────────────────────────────────────────────────┐
│ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So                            │
│ Review│ Review│ Review│ Content│ Content│ --  │ --           │
│ Conf  │ Conf  │ Conf  │ B2B    │ B2C    │     │              │
│ Center│ Center│ Center│ Gen    │ DPP    │     │              │
└─────────────────────────────────────────────────────────────┘

WOCHE 4 (Tag 21-28)
┌─────────────────────────────────────────────────────────────┐
│ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So                            │
│ Anchor│ Anchor│ Go-Live│ Monitoring│ Done │ -- │ --          │
│ Batch │ Verify│ API    │ Dashboard │ Docs │    │             │
│ Chain │ QR    │ MCP    │ Training  │      │    │             │
└─────────────────────────────────────────────────────────────┘
```

---

## KOSTEN-UEBERSICHT (Pro Hersteller)

| Posten | Einmalig | Monatlich |
|--------|----------|-----------|
| Setup (Namespace, MCP, Media) | ~2h Arbeit | — |
| Daten-Import (1000 Produkte) | ~4h Arbeit | — |
| OCR-Pipeline (PDFs) | ~$5-20 (API-Kosten) | — |
| AI-Enrichment (Claude) | ~$20-100 (Token-Kosten) | — |
| Blockchain-Anchoring (Base) | ~$0.50 (Gas-Kosten) | ~$0.10/Monat |
| Menschlicher Review | ~8-16h Arbeit | ~2h/Monat |
| **Hosting (Docker, DB, Storage)** | — | **~$50/Monat** |

**Gesamt typisch**: ~$100-200 Einrichtung + ~$50/Monat laufend

---

## CHECKLISTE: ONBOARDING ABGESCHLOSSEN

```
INFRASTRUKTUR:
[_] Namespace erstellt
[_] Contributors registriert
[_] Media-Verzeichnis angelegt
[_] MCP-Server deployed (optional)
[_] API-Key generiert

DATEN:
[_] Core-Daten importiert (Layer 000)
[_] ETIM-Features importiert (Layer 001)
[_] Media-Dateien hochgeladen und verknuepft
[_] PDFs durch OCR-Pipeline verarbeitet
[_] AI-Enrichment durchgelaufen (Layer 004)

QUALITAET:
[_] Fill-Rate >= 80%
[_] Citation-Coverage >= 60%
[_] Alle PFLICHT-Features ausgefuellt
[_] Konflikte unter 15% (oder aufgeloest)
[_] Content (B2B/B2C) generiert

VERIFIZIERUNG:
[_] Menschlicher Review der Konflikte
[_] Trust-Upgrades durchgefuehrt
[_] Quality Gate bestanden

BLOCKCHAIN:
[_] Batch-Anchoring auf Base Mainnet
[_] Verifikations-URLs aktiv
[_] QR-Codes generiert

DISTRIBUTION:
[_] inject() API getestet
[_] MCP-Tool registriert
[_] Hub-UI Zugang eingerichtet
[_] Monitoring-Dashboard aktiv
[_] Hersteller geschult

STATUS: ████████████████████ ONBOARDING COMPLETE
```

---

*0711 Intelligence — Jedes Produkt. Jeder Datenpunkt. Verifiziert.*
