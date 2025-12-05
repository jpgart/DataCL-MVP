export interface ExportRecord {
  season: string;
  year: number;
  week: number;
  absolute_season_week: number; // Índice calculado por Python para ordenamiento

  region: string;
  market: string;
  country: string;
  transport: string;
  product: string;
  variety: string;
  importer: string;
  exporter: string;
  port_destination: string;

  boxes: number;
  net_weight_kg: number;
  value_usd?: number; // Optional: Value in USD for price calculations

  // Métricas calculadas / Auditoría
  unit_weight_kg?: number;
  is_outlier?: boolean;
}

export interface KPIResult {
  totalBoxes: number;
  totalWeight: number;
  avgUnitWeight: number;
  recordCount: number;
  uniqueExporters: number;
  uniqueProducts: number;
  uniqueCountries: number;
  uniqueSeasons: number;
}

export interface FilterState {
  season?: string;
  country?: string[];
  product?: string[];
  exporter?: string[];
}


