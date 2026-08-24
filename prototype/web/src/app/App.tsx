import { useState } from "react";
import {
  LayoutDashboard, Package, FileText, ShoppingCart, TrendingUp,
  Search, Plus, AlertTriangle, X, ChevronDown, ChevronUp,
  Wallet, Banknote, Bell, CreditCard, Check, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import logoImg from "../imports/534370197_1452060665838269_6992858018444703897_n.jpg";

type Tab = "dash" | "inv" | "rec" | "pos" | "fin";
type PayMethod = "transfer" | "tunai" | "kartu";
type FinPeriod = "bulan" | "semester";

// ─── Currency helpers ────────────────────────────────────────────────────────

function idr(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function idrShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",")} jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}

// ─── Mock data (IDR) ─────────────────────────────────────────────────────────

const INVENTORY = [
  { id: 1,  name: "Amoxicillin 250mg",       cat: "Obat",        stock: 8,  reorder: 20, unit: "tab",   cost: 2500,   price: 8000    },
  { id: 2,  name: "Doxycycline 100mg",        cat: "Obat",        stock: 34, reorder: 25, unit: "kap",   cost: 2000,   price: 7500    },
  { id: 3,  name: "Metacam 1,5 mg/ml",        cat: "Obat",        stock: 1,  reorder: 5,  unit: "btl",   cost: 180000, price: 450000  },
  { id: 4,  name: "Metronidazol 250mg",       cat: "Obat",        stock: 22, reorder: 15, unit: "tab",   cost: 2000,   price: 7500    },
  { id: 5,  name: "Methimazole 2,5mg",        cat: "Obat",        stock: 14, reorder: 12, unit: "tab",   cost: 5000,   price: 18000   },
  { id: 6,  name: "Vaksin Rabies 1 tahun",    cat: "Vaksin",      stock: 4,  reorder: 10, unit: "vial",  cost: 35000,  price: 120000  },
  { id: 7,  name: "Vaksin DHPP",              cat: "Vaksin",      stock: 12, reorder: 8,  unit: "vial",  cost: 45000,  price: 135000  },
  { id: 8,  name: "Vaksin Bordetella",        cat: "Vaksin",      stock: 7,  reorder: 6,  unit: "vial",  cost: 40000,  price: 125000  },
  { id: 9,  name: "Anti-Kutu Kucing (L)",     cat: "Preventif",   stock: 2,  reorder: 12, unit: "pcs",   cost: 195000, price: 580000  },
  { id: 10, name: "Revolution Plus Kucing",   cat: "Preventif",   stock: 9,  reorder: 8,  unit: "pcs",   cost: 165000, price: 490000  },
  { id: 11, name: "Cairan Pembersih Telinga", cat: "Perlengkapan", stock: 18, reorder: 6,  unit: "btl",   cost: 30000,  price: 120000  },
  { id: 12, name: "Kalung Elizabethan M",     cat: "Perlengkapan", stock: 6,  reorder: 4,  unit: "unit",  cost: 25000,  price: 85000   },
  { id: 13, name: "NaCl 0,9% 500ml",          cat: "Perlengkapan", stock: 24, reorder: 10, unit: "bag",   cost: 18000,  price: 55000   },
  { id: 14, name: "Royal Canin Adult 4kg",    cat: "Pakan",       stock: 3,  reorder: 8,  unit: "sak",   cost: 250000, price: 490000  },
  { id: 15, name: "Hills Science Diet Sm",    cat: "Pakan",       stock: 11, reorder: 6,  unit: "sak",   cost: 230000, price: 430000  },
];

const PATIENTS = [
  {
    id: 1, pet: "Milo", species: "dog", breed: "Labrador Retriever",
    dob: "2019-03-12", owner: "Sarah Chen", phone: "(021) 5588-2214", weight: "28,4 kg",
    alert: "Alergi penisilin.",
    visits: [
      { date: "14 Agu 2026", type: "Pemeriksaan Tahunan", vet: "drh. Rivera", cost: 1400000, notes: "Sehat. Berat badan stabil. Karang gigi ringan di geraham atas.", meds: ["Heartgard Plus 51–100 lbs"] },
      { date: "3 Mei 2026",  type: "Vaksinasi",           vet: "drh. Rivera", cost: 630000,  notes: "Booster DHPP. Tidak ada reaksi negatif.", meds: [] },
      { date: "18 Jan 2026", type: "Kunjungan Sakit",     vet: "drh. Rivera", cost: 1200000, notes: "Muntah 2 hari. Kemungkinan salah makan. Diet lunak dianjurkan.", meds: ["Metronidazol 250mg × 5 hari"] },
    ],
  },
  {
    id: 2, pet: "Luna", species: "cat", breed: "Domestic Shorthair",
    dob: "2021-07-25", owner: "Marcus Webb", phone: "(021) 4091-2267", weight: "3,9 kg",
    alert: "Kucing dalam ruangan. Sudah disterilkan.",
    visits: [
      { date: "30 Jul 2026", type: "Pemeriksaan Tahunan", vet: "drh. Rivera", cost: 1350000, notes: "Penyakit gigi ringan grade-1. Disarankan pembersihan pada kunjungan berikutnya.", meds: ["Revolution Plus"] },
      { date: "14 Jul 2025", type: "Vaksinasi",           vet: "drh. Rivera", cost: 850000,  notes: "FVRCP + Rabies. Tidak ada reaksi.", meds: [] },
    ],
  },
  {
    id: 3, pet: "Biscuit", species: "rabbit", breed: "Holland Lop",
    dob: "2023-11-02", owner: "Priya Nair", phone: "(021) 7385-5501", weight: "1,8 kg",
    alert: "Rentan stasis GI — diet jerami dianjurkan.",
    visits: [
      { date: "20 Agu 2026", type: "Pemeriksaan Stasis GI", vet: "drh. Rivera", cost: 2200000, notes: "Motilitas menurun. Cairan IV 2 jam. Dipulangkan dalam kondisi stabil.", meds: ["Metoklopramid", "Critical Care Herbivore"] },
    ],
  },
  {
    id: 4, pet: "Zeus", species: "dog", breed: "German Shepherd",
    dob: "2017-09-08", owner: "Tom & Elisa Kowalski", phone: "(021) 8823-3349", weight: "34,2 kg",
    alert: "Displasia pinggul. Lansia. Metacam jangka panjang.",
    visits: [
      { date: "5 Agu 2026",  type: "Kontrol Nyeri",  vet: "drh. Rivera", cost: 950000,  notes: "Mobilitas membaik. Lanjutkan Metacam 1,5 mg/ml. Kontrol ulang 6 minggu.", meds: ["Metacam 1,5 mg/ml 30 hari"] },
      { date: "12 Feb 2026", type: "Rontgen",         vet: "drh. Rivera", cost: 2800000, notes: "Rontgen pinggul: DJD memburuk. Opsi bedah telah dibahas.", meds: [] },
    ],
  },
  {
    id: 5, pet: "Cleo", species: "cat", breed: "Siamese",
    dob: "2020-02-14", owner: "Angela Frost", phone: "(021) 6137-7720", weight: "4,2 kg",
    alert: "Hipertiroid — Methimazole 2,5 mg BID.",
    visits: [
      { date: "18 Agu 2026", type: "Kontrol Tiroid", vet: "drh. Rivera", cost: 1700000, notes: "Kadar T4 mulai normal. Lanjutkan dosis saat ini. Cek darah ulang 3 bulan.", meds: ["Methimazole 2,5 mg × 30 hari"] },
    ],
  },
];

const POS_PRODUCTS = [
  { id: 1,  name: "Biaya Pemeriksaan", price: 150000, cat: "Layanan"   },
  { id: 2,  name: "Vaksin Rabies",     price: 120000, cat: "Vaksin"    },
  { id: 3,  name: "Vaksin DHPP",       price: 135000, cat: "Vaksin"    },
  { id: 4,  name: "Vaksin Bordetella", price: 125000, cat: "Vaksin"    },
  { id: 5,  name: "Anti-Kutu (L)",     price: 580000, cat: "Preventif" },
  { id: 6,  name: "Revolution Plus",   price: 490000, cat: "Preventif" },
  { id: 7,  name: "Bersih Telinga",    price: 120000, cat: "Ritel"     },
  { id: 8,  name: "Royal Canin 4kg",   price: 490000, cat: "Pakan"     },
  { id: 9,  name: "Kalung E M",        price: 85000,  cat: "Ritel"     },
  { id: 10, name: "Potong Kuku",       price: 75000,  cat: "Layanan"   },
  { id: 11, name: "Kelenjar Anal",     price: 120000, cat: "Layanan"   },
  { id: 12, name: "Rontgen (1 view)",  price: 850000, cat: "Layanan"   },
  { id: 13, name: "Metacam 30ml",      price: 450000, cat: "Obat"      },
  { id: 14, name: "Amox. 10 hari",     price: 180000, cat: "Obat"      },
];

const MONTHLY = [
  { month: "Mar", clinic: 93000000,  retail: 21000000, draw: 37500000 },
  { month: "Apr", clinic: 107000000, retail: 27000000, draw: 37500000 },
  { month: "Mei", clinic: 102000000, retail: 24000000, draw: 42000000 },
  { month: "Jun", clinic: 117000000, retail: 31500000, draw: 42000000 },
  { month: "Jul", clinic: 123000000, retail: 36000000, draw: 45000000 },
  { month: "Agu", clinic:  76500000, retail: 18000000, draw: 33000000 },
];

const TRANSACTIONS = [
  { id: "T-2048", date: "22 Agu", patient: "Milo — S. Chen",         items: ["Pemeriksaan", "Vaksin DHPP"],          total: 1285000, method: "kartu"    },
  { id: "T-2047", date: "22 Agu", patient: "Cleo — A. Frost",        items: ["Kontrol Tiroid", "Methimazole 30 hr"], total: 1700000, method: "transfer"  },
  { id: "T-2046", date: "21 Agu", patient: "Biscuit — P. Nair",      items: ["Stasis GI"],                          total: 2200000, method: "tunai"     },
  { id: "T-2045", date: "21 Agu", patient: "Penjualan Ritel",        items: ["Royal Canin 4kg", "Bersih Telinga"],   total:  610000, method: "kartu"     },
  { id: "T-2044", date: "20 Agu", patient: "Zeus — T. Kowalski",     items: ["Kontrol Nyeri", "Metacam 30ml"],       total: 1400000, method: "transfer"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function speciesEmoji(s: string) {
  return s === "dog" ? "🐕" : s === "cat" ? "🐈" : s === "rabbit" ? "🐇" : "🐦";
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ children, variant = "teal" }: { children: React.ReactNode; variant?: "teal" | "warn" | "danger" | "navy" }) {
  const cls = {
    teal:   "bg-primary/10 text-primary",
    navy:   "bg-[#0f172a]/8 text-[#0f172a]",
    warn:   "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-destructive",
  }[variant];
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`} style={{ letterSpacing: "0.02em" }}>
      {children}
    </span>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="border-t border-border" />;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashScreen() {
  const lowStock = INVENTORY.filter(i => i.stock <= i.reorder);
  const aug = MONTHLY[5];
  const augGross = aug.clinic + aug.retail;
  const augNet = augGross - aug.draw;

  return (
    <div className="pb-6">
      {/* Welcome hero */}
      <div className="px-5 pt-4 pb-5 bg-card border-b border-border">
        <p className="text-xs text-muted-foreground" style={{ letterSpacing: "0.05em" }}>
          JUM'AT, 22 AGUSTUS 2026
        </p>
        <p className="text-foreground mt-0.5" style={{ fontSize: 18, fontWeight: 700 }}>
          Selamat pagi, drh. Rivera
        </p>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase" style={{ letterSpacing: "0.05em", fontWeight: 700 }}>
              Pendapatan Hari Ini
            </p>
            <p className="mt-2" style={{ fontSize: 20, fontWeight: 800, color: "#1a1c1c" }}>
              {idrShort(7260000)}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3 h-3 text-primary" />
              <p className="text-xs text-primary" style={{ fontWeight: 600 }}>+12% vs rata-rata</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase" style={{ letterSpacing: "0.05em", fontWeight: 700 }}>
              Net Klinik (Agu)
            </p>
            <p className="mt-2" style={{ fontSize: 20, fontWeight: 800, color: "#1a1c1c" }}>
              {idrShort(augNet)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5" style={{ fontWeight: 500 }}>tidak termasuk draw</p>
          </div>
        </div>

        {/* Owner draw callout */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-orange-800" style={{ fontWeight: 700 }}>Pengambilan Pribadi — Agu</p>
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#c2410c" }}>{idrShort(aug.draw)}</p>
          </div>
          <div className="mt-3 h-1.5 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full"
              style={{ width: `${Math.round((aug.draw / augGross) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-orange-600 mt-1.5" style={{ fontWeight: 500 }}>
            {Math.round((aug.draw / augGross) * 100)}% dari total pendapatan kotor
          </p>
        </div>

        {/* Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1c1c" }}>Jadwal Hari Ini</p>
            <button className="text-xs text-primary" style={{ fontWeight: 600 }}>Lihat semua</button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {[
              { time: "09.00", pet: "Milo",  owner: "S. Chen",      type: "Pemeriksaan + Vaksin", done: true  },
              { time: "11.30", pet: "Cleo",  owner: "A. Frost",     type: "Kontrol Tiroid",       done: true  },
              { time: "14.00", pet: "Daisy", owner: "R. Gutierrez", type: "Pasca Sterilisasi",    done: false },
              { time: "16.15", pet: "Max",   owner: "J. Liu",       type: "Pemeriksaan Tahunan",  done: false },
            ].map((a, i, arr) => (
              <div key={i}>
                <div className={`flex items-center gap-3 px-4 py-3 ${a.done ? "opacity-45" : ""}`}>
                  <div className={`w-1 h-9 rounded-full shrink-0 ${a.done ? "bg-muted" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${a.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                      style={{ fontWeight: 600 }}>
                      {a.pet} · {a.owner}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.type}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0" style={{ fontWeight: 600 }}>{a.time}</p>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        {lowStock.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1c1c" }}>Stok Menipis — {lowStock.length} item</p>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {lowStock.slice(0, 4).map((item, i, arr) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-foreground" style={{ fontWeight: 500 }}>{item.name}</p>
                    <Badge variant={item.stock <= 2 ? "danger" : "warn"}>
                      {item.stock} {item.unit}
                    </Badge>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inventory ────────────────────────────────────────────────────────────────

const INV_CATS = ["Semua", "Obat", "Vaksin", "Preventif", "Perlengkapan", "Pakan"];

function InvScreen() {
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("Semua");

  const filtered = INVENTORY.filter(i => {
    const matchCat = cat === "Semua" || i.cat === cat;
    const matchQ   = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 18, fontWeight: 800, color: "#1a1c1c" }}>Inventaris</p>
        <button className="flex items-center gap-1.5 bg-[#0f172a] text-white px-3.5 py-2 rounded-lg text-xs" style={{ fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" />Tambah
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari item…"
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {INV_CATS.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              cat === c
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground"
            }`}
            style={{ fontWeight: 600, letterSpacing: "0.02em" }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filtered.map((item, i, arr) => {
          const pct      = Math.min((item.stock / (item.reorder * 2)) * 100, 100);
          const critical = item.stock <= Math.ceil(item.reorder * 0.3);
          const low      = item.stock <= item.reorder;
          return (
            <div key={item.id}>
              <div className="px-4 py-3.5">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight" style={{ fontWeight: 600 }}>{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.cat}</p>
                  </div>
                  <Badge variant={critical ? "danger" : low ? "warn" : "teal"}>
                    {item.stock} {item.unit}
                  </Badge>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${critical ? "bg-destructive" : low ? "bg-orange-400" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">reorder @ {item.reorder} {item.unit}</p>
                  <p className="text-xs text-muted-foreground">{idrShort(item.price)}/{item.unit}</p>
                </div>
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Medical Records ──────────────────────────────────────────────────────────

function RecScreen() {
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = PATIENTS.filter(p =>
    p.pet.toLowerCase().includes(search.toLowerCase()) ||
    p.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 18, fontWeight: 800, color: "#1a1c1c" }}>Rekam Medis</p>
        <button className="flex items-center gap-1.5 bg-[#0f172a] text-white px-3.5 py-2 rounded-lg text-xs" style={{ fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" />Pasien Baru
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari pasien atau pemilik…"
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(p => {
          const open = expanded === p.id;
          return (
            <div key={p.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(open ? null : p.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                  {speciesEmoji(p.species)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-foreground" style={{ fontWeight: 700 }}>{p.pet}</p>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full" style={{ fontWeight: 600, letterSpacing: "0.02em" }}>
                      {p.breed}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.owner} · {p.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>{p.weight}</span>
                  {open
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {open && (
                <>
                  <Divider />
                  {p.alert && (
                    <>
                      <div className="px-4 py-3 bg-amber-50">
                        <p className="text-xs text-amber-800 leading-relaxed">
                          <span style={{ fontWeight: 700 }}>⚠ Catatan: </span>{p.alert}
                        </p>
                      </div>
                      <Divider />
                    </>
                  )}
                  <div className="px-4 py-4 space-y-4">
                    <p className="text-[10px] text-muted-foreground uppercase" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>
                      Riwayat Kunjungan
                    </p>
                    {p.visits.map((v, vi) => (
                      <div key={vi} className="border-l-2 border-primary/30 pl-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-foreground" style={{ fontWeight: 700 }}>{v.type}</p>
                          <p className="text-sm text-primary" style={{ fontWeight: 700 }}>{idr(v.cost)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground" style={{ fontWeight: 500 }}>
                          {v.date} · {v.vet}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{v.notes}</p>
                        {v.meds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {v.meds.map((m, mi) => (
                              <span key={mi} className="text-[11px] bg-primary/8 text-primary px-2.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Point of Sale ────────────────────────────────────────────────────────────

const POS_CATS = ["Semua", "Layanan", "Vaksin", "Obat", "Preventif", "Pakan", "Ritel"];

interface CartEntry { id: number; name: string; price: number; qty: number }

function PosScreen() {
  const [cat, setCat]       = useState("Semua");
  const [cart, setCart]     = useState<CartEntry[]>([]);
  const [method, setMethod] = useState<PayMethod>("transfer");
  const [done, setDone]     = useState(false);

  const filtered = POS_PRODUCTS.filter(p => cat === "Semua" || p.cat === cat);

  function addToCart(p: typeof POS_PRODUCTS[0]) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function decrement(id: number) {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.qty === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const ppn      = Math.round(subtotal * 0.11);
  const total    = subtotal + ppn;

  function checkout() {
    setDone(true);
    setTimeout(() => { setDone(false); setCart([]); }, 2600);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="w-10 h-10 text-primary" strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: "#1a1c1c" }}>Pembayaran Selesai</p>
        <p className="text-sm text-muted-foreground text-center">{idr(total)} via {method}</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      <p style={{ fontSize: 18, fontWeight: 800, color: "#1a1c1c" }}>Kasir</p>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {POS_CATS.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              cat === c
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground"
            }`}
            style={{ fontWeight: 600 }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(p => {
          const inCart = cart.find(i => i.id === p.id);
          return (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className={`relative bg-card border rounded-lg p-3 text-left active:scale-95 transition-all ${
                inCart ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              {inCart && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center" style={{ fontWeight: 800 }}>
                  {inCart.qty}
                </span>
              )}
              <p className="text-xs text-foreground leading-tight pr-3" style={{ fontWeight: 600 }}>{p.name}</p>
              <p className="text-xs text-primary mt-1.5" style={{ fontWeight: 700 }}>{idrShort(p.price)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{p.cat}</p>
            </button>
          );
        })}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-3" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>
              Keranjang
            </p>
            <div className="space-y-2.5">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => decrement(item.id)}
                      className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs" style={{ fontWeight: 800 }}
                    >−</button>
                    <span className="text-xs text-foreground w-4 text-center" style={{ fontWeight: 700 }}>{item.qty}</span>
                    <button
                      onClick={() => addToCart(POS_PRODUCTS.find(p => p.id === item.id)!)}
                      className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs" style={{ fontWeight: 800 }}
                    >+</button>
                  </div>
                  <p className="text-xs text-foreground flex-1 min-w-0 truncate" style={{ fontWeight: 500 }}>{item.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-foreground" style={{ fontWeight: 700 }}>{idrShort(item.price * item.qty)}</p>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}>
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider />
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span><span style={{ fontWeight: 600 }}>{idr(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>PPN (11%)</span><span style={{ fontWeight: 600 }}>{idr(ppn)}</span>
            </div>
            <div className="flex justify-between text-sm text-foreground pt-1">
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800 }}>{idr(total)}</span>
            </div>
          </div>

          <Divider />
          <div className="px-4 py-3 grid grid-cols-3 gap-2">
            {(["transfer", "tunai", "kartu"] as PayMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`text-xs py-2 rounded-lg border capitalize transition-colors ${
                  method === m
                    ? "bg-[#0f172a] text-white border-[#0f172a]"
                    : "border-border text-muted-foreground bg-card"
                }`}
                style={{ fontWeight: 600 }}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={checkout}
              className="w-full bg-[#0f172a] text-white py-3.5 rounded-lg text-sm"
              style={{ fontWeight: 700, letterSpacing: "0.02em" }}
            >
              Bayar {idr(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Finance ──────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#0d9488", "#3b82f6", "#f97316"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const nameMap: Record<string, string> = { clinic: "Layanan", retail: "Ritel", draw: "Tarik Pribadi" };
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-sm" style={{ fontSize: 12 }}>
      <p className="text-foreground mb-1.5" style={{ fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {nameMap[p.name] ?? p.name}: {idrShort(p.value)}
        </p>
      ))}
    </div>
  );
};

function FinScreen() {
  const [period, setPeriod]   = useState<FinPeriod>("bulan");
  const [drawPct, setDrawPct] = useState(28);

  const data   = period === "bulan" ? MONTHLY.slice(-1) : MONTHLY;
  const totals = data.reduce(
    (acc, m) => ({ clinic: acc.clinic + m.clinic, retail: acc.retail + m.retail, draw: acc.draw + m.draw }),
    { clinic: 0, retail: 0, draw: 0 }
  );
  const gross       = totals.clinic + totals.retail;
  const projDraw    = Math.round(gross * drawPct / 100);
  const pieData     = [
    { name: "Layanan Klinik",  value: totals.clinic },
    { name: "Penjualan Ritel", value: totals.retail  },
    { name: "Tarik Pribadi",   value: totals.draw    },
  ];

  return (
    <div className="px-5 pt-5 pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 18, fontWeight: 800, color: "#1a1c1c" }}>Keuangan</p>
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 border border-border">
          {(["bulan", "semester"] as FinPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                period === p ? "bg-white text-foreground shadow-none border border-border" : "text-muted-foreground"
              }`}
              style={{ fontWeight: 600 }}
            >
              {p === "bulan" ? "Agu" : "6 Bln"}
            </button>
          ))}
        </div>
      </div>

      {/* Income split */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-[10px] text-muted-foreground uppercase mb-4" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>
          Pembagian Pendapatan {period === "bulan" ? "Agustus" : "Mar–Agu"}
        </p>
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" stroke="none" paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((d, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                  </div>
                  <p className="text-xs text-foreground" style={{ fontWeight: 700 }}>{idrShort(d.value)}</p>
                </div>
                <div className="mt-1 h-0.5 bg-muted rounded-full ml-4 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.value / (gross + totals.draw)) * 100}%`, background: PIE_COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider />
        <div className="pt-4 grid grid-cols-2 gap-3">
          <div className="bg-primary/8 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>Net Klinik</p>
            <p className="text-primary" style={{ fontSize: 15, fontWeight: 800 }}>{idrShort(gross - totals.draw)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">reinvestasi</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>Pengambilan Pribadi</p>
            <p className="text-orange-600" style={{ fontSize: 15, fontWeight: 800 }}>{idrShort(totals.draw)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">pendapatan pemilik</p>
          </div>
        </div>
      </div>

      {/* Draw rate planner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-orange-500" />
          <p className="text-sm text-orange-800" style={{ fontWeight: 700 }}>Perencana Tarif Pengambilan</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range" min={10} max={55} step={1} value={drawPct}
            onChange={e => setDrawPct(Number(e.target.value))}
            className="flex-1 h-1.5 accent-orange-500"
          />
          <span className="text-orange-700 w-12 text-right" style={{ fontSize: 18, fontWeight: 800 }}>{drawPct}%</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-orange-600/70">dari pendapatan kotor</p>
          <p className="text-xs text-orange-700" style={{ fontWeight: 600 }}>
            = {idrShort(projDraw)}/{period === "bulan" ? "bln" : "bln rata-rata"}
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-[10px] text-muted-foreground uppercase mb-4" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>Tren Pendapatan</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={MONTHLY} barCategoryGap="30%" barGap={3}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#45464d", fontSize: 10, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="clinic" fill="#0d9488" radius={[2, 2, 0, 0]} />
            <Bar dataKey="retail" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="draw"   fill="#f97316" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-2 justify-center">
          {[["#0d9488", "Layanan"], ["#3b82f6", "Ritel"], ["#f97316", "Pribadi"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <p className="text-xs text-muted-foreground" style={{ fontWeight: 500 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase mb-3" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>
          Transaksi Terbaru
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {TRANSACTIONS.map((t, i, arr) => (
            <div key={t.id}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  t.method === "kartu" ? "bg-blue-50" : t.method === "transfer" ? "bg-primary/8" : "bg-green-50"
                }`}>
                  {t.method === "kartu"
                    ? <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    : t.method === "transfer"
                    ? <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                    : <Banknote className="w-3.5 h-3.5 text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate" style={{ fontWeight: 600 }}>{t.patient}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.items.join(" · ")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 700 }}>{idrShort(t.total)}</p>
                  <p className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>{t.date}</p>
                </div>
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dash", label: "Beranda",   Icon: LayoutDashboard },
  { id: "inv",  label: "Stok",      Icon: Package         },
  { id: "rec",  label: "Rekam",     Icon: FileText        },
  { id: "pos",  label: "Kasir",     Icon: ShoppingCart    },
  { id: "fin",  label: "Keuangan",  Icon: TrendingUp      },
] as const;

const SCREEN_TITLE: Record<Tab, string> = {
  dash: "Cito Petcare",
  inv:  "Inventaris",
  rec:  "Rekam Medis",
  pos:  "Kasir",
  fin:  "Keuangan",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("dash");
  const lowStock = INVENTORY.filter(i => i.stock <= i.reorder);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#e8ecf0" }}
    >
      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 390,
          height: 844,
          background: "#f9f9f9",
          borderRadius: 44,
          border: "1px solid #d1d5db",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-7 pt-3.5 pb-1 bg-card shrink-0">
          <span className="text-[13px] text-foreground" style={{ fontWeight: 700 }}>9:41</span>
          <div className="w-[100px] h-[30px] bg-[#1a1c1c] rounded-full" />
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-[2px] h-[11px]">
              {[4, 6, 8, 10].map((h, i) => (
                <div
                  key={i}
                  className={`w-[3px] rounded-[1px] ${i < 3 ? "bg-foreground" : "bg-foreground/20"}`}
                  style={{ height: h }}
                />
              ))}
            </div>
            <div className="flex items-center">
              <div className="w-[22px] h-[11px] border border-foreground/40 rounded-[3px] flex items-center px-[2px]">
                <div className="flex-1 h-[7px] bg-foreground rounded-[1px]" />
              </div>
              <div className="w-[1.5px] h-[5px] bg-foreground/30 rounded-r-[1px] ml-[1px]" />
            </div>
          </div>
        </div>

        {/* Top bar with logo */}
        <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-card border-b border-border">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Cito Petcare"
              className="w-9 h-9 object-contain rounded-lg"
              style={{ background: "white" }}
            />
            <div>
              {tab === "dash" ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1a1c1c", lineHeight: 1.1 }}>Cito Petcare</p>
                  <p style={{ fontSize: 10, color: "#45464d", fontWeight: 600, letterSpacing: "0.03em" }}>Klinik Hewan</p>
                </>
              ) : (
                <p style={{ fontSize: 16, fontWeight: 800, color: "#1a1c1c" }}>{SCREEN_TITLE[tab]}</p>
              )}
            </div>
          </div>
          <button className="relative p-1.5 rounded-lg">
            <Bell className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={2} style={{ width: 18, height: 18 }} />
            {lowStock.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </button>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {tab === "dash" && <DashScreen />}
          {tab === "inv"  && <InvScreen  />}
          {tab === "rec"  && <RecScreen  />}
          {tab === "pos"  && <PosScreen  />}
          {tab === "fin"  && <FinScreen  />}
        </div>

        {/* Bottom nav */}
        <div className="shrink-0 border-t border-border bg-card pb-7 pt-2">
          <div className="flex items-center justify-around px-1">
            {NAV.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex flex-col items-center gap-1 px-3 py-1.5"
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-primary/10" : ""}`}>
                    <Icon
                      className={`transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                      style={{ width: 19, height: 19 }}
                      strokeWidth={active ? 2.3 : 1.8}
                    />
                  </div>
                  <span
                    className={`text-[9px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                    style={{ fontWeight: active ? 700 : 500, letterSpacing: "0.03em" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
