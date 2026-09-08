const ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer',
};

const TREE_HEALTH = {
  HEALTHY: 'Sehat',
  SICK: 'Sakit',
};

const FERTILIZATION_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Selesai Dipupuk',
};

const HARVEST_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
};

// Default standard fertilization schedule relative to planting date (in days)
const DEFAULT_FERTILIZATION_PLAN = [
  { dayOffset: 7, type: 'Pupuk Dasar Organik / Kompos Matang', notes: 'Aplikasi awal pembenah tanah & akar' },
  { dayOffset: 30, type: 'NPK 16-16-16 (Masa Vegetatif Awal)', notes: 'Merangsang pertumbuhan daun & cabang baru' },
  { dayOffset: 60, type: 'NPK 16-16-16 + Pupuk Hayati Mikro', notes: 'Penguatan struktur batang & perakaran' },
  { dayOffset: 90, type: 'NPK & Unsur Hara Mikro (ZPT Organik)', notes: 'Persiapan pembentukan tajuk tanaman' },
  { dayOffset: 180, type: 'Pupuk Kandang Terfermentasi + NPK', notes: 'Pemupukan berkala semester awal' },
];

module.exports = {
  ROLES,
  TREE_HEALTH,
  FERTILIZATION_STATUS,
  HARVEST_STATUS,
  DEFAULT_FERTILIZATION_PLAN,
};
