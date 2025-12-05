import { ExportRecord, KPIResult, FilterState } from '@/types/exports';

export class DataEngine {
  private data: ExportRecord[];

  constructor(data: ExportRecord[]) {
    this.data = data;
  }

  /**
   * Obtiene datos de serie temporal agrupados por absolute_season_week
   * y pivoteados por temporada (season).
   * CRÍTICO: Ordena por absolute_season_week ascendente para continuidad en gráficos.
   */
  getTimeSeriesData(): Array<{
    absolute_season_week: number;
    [season: string]: number | string;
  }> {
    // Agrupar por absolute_season_week y season
    const grouped = new Map<string, { absolute_season_week: number; season: string; boxes: number }>();

    this.data.forEach(record => {
      const key = `${record.absolute_season_week}_${record.season}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          absolute_season_week: record.absolute_season_week,
          season: record.season,
          boxes: 0
        });
      }
      const item = grouped.get(key)!;
      item.boxes += record.boxes;
    });

    // Convertir a objeto pivoteado por season
    const pivoted = new Map<number, { absolute_season_week: number; [season: string]: number | string }>();

    grouped.forEach(item => {
      if (!pivoted.has(item.absolute_season_week)) {
        pivoted.set(item.absolute_season_week, { absolute_season_week: item.absolute_season_week });
      }
      const pivotItem = pivoted.get(item.absolute_season_week)!;
      pivotItem[item.season] = item.boxes;
    });

    // Convertir a array y ordenar por absolute_season_week (CRÍTICO)
    const result = Array.from(pivoted.values()).sort((a, b) => 
      a.absolute_season_week - b.absolute_season_week
    );

    return result;
  }

  /**
   * Calcula KPIs globales
   */
  getKPIs(): KPIResult {
    const totalBoxes = this.data.reduce((sum, record) => sum + record.boxes, 0);
    const totalWeight = this.data.reduce((sum, record) => sum + record.net_weight_kg, 0);
    const avgUnitWeight = totalBoxes > 0 ? totalWeight / totalBoxes : 0;

    // Calcular valores únicos usando Set para eficiencia
    const uniqueExporters = new Set(this.data.map(r => r.exporter)).size;
    const uniqueProducts = new Set(this.data.map(r => r.product)).size;
    const uniqueCountries = new Set(this.data.map(r => r.country)).size;
    const uniqueSeasons = new Set(this.data.map(r => r.season)).size;

    return {
      totalBoxes,
      totalWeight,
      avgUnitWeight,
      recordCount: this.data.length,
      uniqueExporters,
      uniqueProducts,
      uniqueCountries,
      uniqueSeasons
    };
  }

  /**
   * Obtiene top N exportadores
   */
  getTopExporters(n: number = 5): Array<{ exporter: string; boxes: number }> {
    const grouped = new Map<string, number>();

    this.data.forEach(record => {
      const current = grouped.get(record.exporter) || 0;
      grouped.set(record.exporter, current + record.boxes);
    });

    return Array.from(grouped.entries())
      .map(([exporter, boxes]) => ({ exporter, boxes }))
      .sort((a, b) => b.boxes - a.boxes)
      .slice(0, n);
  }

  /**
   * Obtiene top N productos
   */
  getTopProducts(n: number = 5): Array<{ product: string; boxes: number }> {
    const grouped = new Map<string, number>();

    this.data.forEach(record => {
      const current = grouped.get(record.product) || 0;
      grouped.set(record.product, current + record.boxes);
    });

    return Array.from(grouped.entries())
      .map(([product, boxes]) => ({ product, boxes }))
      .sort((a, b) => b.boxes - a.boxes)
      .slice(0, n);
  }

  /**
   * Filtra datos según FilterState
   */
  filter(filters: FilterState): ExportRecord[] {
    let filtered = [...this.data];

    if (filters.season) {
      filtered = filtered.filter(r => r.season === filters.season);
    }

    if (filters.country && filters.country.length > 0) {
      filtered = filtered.filter(r => filters.country!.includes(r.country));
    }

    if (filters.product && filters.product.length > 0) {
      filtered = filtered.filter(r => filters.product!.includes(r.product));
    }

    if (filters.exporter && filters.exporter.length > 0) {
      filtered = filtered.filter(r => filters.exporter!.includes(r.exporter));
    }

    return filtered;
  }

  /**
   * Obtiene valores únicos de una columna
   */
  getUniqueValues(column: keyof ExportRecord): string[] {
    const values = new Set<string>();
    this.data.forEach(record => {
      const value = String(record[column]);
      if (value && value !== 'undefined' && value !== 'null') {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  }

  /**
   * Obtiene serie temporal filtrada por país
   */
  getTimeSeriesByCountry(country: string): Array<{
    absolute_season_week: number;
    [season: string]: number | string;
  }> {
    const filtered = this.data.filter(r => r.country === country);
    const engine = new DataEngine(filtered);
    return engine.getTimeSeriesData();
  }

  /**
   * Obtiene serie temporal filtrada por producto
   */
  getTimeSeriesByProduct(product: string): Array<{
    absolute_season_week: number;
    [season: string]: number | string;
  }> {
    const filtered = this.data.filter(r => r.product === product);
    const engine = new DataEngine(filtered);
    return engine.getTimeSeriesData();
  }

  /**
   * Obtiene serie temporal filtrada por exportador
   */
  getTimeSeriesByExporter(exporter: string): Array<{
    absolute_season_week: number;
    [season: string]: number | string;
  }> {
    const filtered = this.data.filter(r => r.exporter === exporter);
    const engine = new DataEngine(filtered);
    return engine.getTimeSeriesData();
  }

  /**
   * Gets KPIs for a specific exporter
   */
  getExporterKPIs(exporter: string, season?: string, product?: string): {
    totalBoxes: number;
    totalKilos: number;
    globalSharePercent: number;
    topCountry: string;
  } {
    let filtered = this.data.filter(r => r.exporter === exporter);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    if (product) {
      filtered = filtered.filter(r => r.product === product);
    }

    const exporterBoxes = filtered.reduce((sum, r) => sum + r.boxes, 0);
    const exporterKilos = filtered.reduce((sum, r) => sum + r.net_weight_kg, 0);

    // Calculate global total for share calculation
    const globalEngine = new DataEngine(this.data);
    const globalKPIs = globalEngine.getKPIs();
    const globalSharePercent = globalKPIs.totalBoxes > 0
      ? (exporterBoxes / globalKPIs.totalBoxes) * 100
      : 0;

    // Find top destination country
    const countryMap = new Map<string, number>();
    filtered.forEach(record => {
      if (record.country) {
        const current = countryMap.get(record.country) || 0;
        countryMap.set(record.country, current + record.boxes);
      }
    });

    const topCountryEntry = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const topCountry = topCountryEntry ? topCountryEntry[0] : 'N/A';

    return {
      totalBoxes: exporterBoxes,
      totalKilos: exporterKilos,
      globalSharePercent,
      topCountry
    };
  }

  /**
   * Gets top products for a specific exporter
   */
  getExporterTopProducts(exporter: string, season?: string, limit: number = 5): Array<{
    product: string;
    boxes: number;
    kilos: number;
  }> {
    let filtered = this.data.filter(r => r.exporter === exporter);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    const productMap = new Map<string, { boxes: number; kilos: number }>();

    filtered.forEach(record => {
      if (record.product) {
        const current = productMap.get(record.product) || { boxes: 0, kilos: 0 };
        productMap.set(record.product, {
          boxes: current.boxes + record.boxes,
          kilos: current.kilos + record.net_weight_kg
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([product, values]) => ({ product, ...values }))
      .sort((a, b) => b.boxes - a.boxes)
      .slice(0, limit);
  }

  /**
   * Gets country distribution for a specific exporter
   */
  getExporterCountryDistribution(exporter: string, season?: string): Array<{
    country: string;
    boxes: number;
    kilos: number;
    percentage: number;
  }> {
    let filtered = this.data.filter(r => r.exporter === exporter);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    const totalBoxes = filtered.reduce((sum, r) => sum + r.boxes, 0);

    const countryMap = new Map<string, { boxes: number; kilos: number }>();

    filtered.forEach(record => {
      if (record.country) {
        const current = countryMap.get(record.country) || { boxes: 0, kilos: 0 };
        countryMap.set(record.country, {
          boxes: current.boxes + record.boxes,
          kilos: current.kilos + record.net_weight_kg
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([country, values]) => ({
        country,
        ...values,
        percentage: totalBoxes > 0 ? (values.boxes / totalBoxes) * 100 : 0
      }))
      .sort((a, b) => b.boxes - a.boxes);
  }

  /**
   * Gets YoY time series comparison for an exporter
   */
  getExporterTimeSeriesYoY(exporter: string, currentSeason: string, previousSeason: string): Array<{
    absolute_season_week: number;
    currentSeason: number;
    previousSeason: number;
  }> {
    const currentData = this.data.filter(
      r => r.exporter === exporter && r.season === currentSeason
    );
    const previousData = this.data.filter(
      r => r.exporter === exporter && r.season === previousSeason
    );

    // Group by absolute_season_week
    const currentMap = new Map<number, number>();
    currentData.forEach(record => {
      const current = currentMap.get(record.absolute_season_week) || 0;
      currentMap.set(record.absolute_season_week, current + record.boxes);
    });

    const previousMap = new Map<number, number>();
    previousData.forEach(record => {
      const current = previousMap.get(record.absolute_season_week) || 0;
      previousMap.set(record.absolute_season_week, current + record.boxes);
    });

    // Get all unique weeks
    const allWeeks = new Set([
      ...Array.from(currentMap.keys()),
      ...Array.from(previousMap.keys())
    ]);

    return Array.from(allWeeks)
      .sort((a, b) => a - b)
      .map(week => ({
        absolute_season_week: week,
        currentSeason: currentMap.get(week) || 0,
        previousSeason: previousMap.get(week) || 0
      }));
  }

  /**
   * Gets competitive positioning for an exporter vs top competitors
   */
  getCompetitivePositioning(exporter: string, season?: string, limit: number = 5): Array<{
    exporter: string;
    boxes: number;
    yoyChangePercent: number;
  }> {
    // Get all unique seasons to calculate YoY
    const seasons = Array.from(new Set(this.data.map(r => r.season))).sort();
    
    // Determine current and previous season
    let currentSeason: string | undefined = season;
    let previousSeason: string | undefined;

    if (!currentSeason && seasons.length >= 2) {
      currentSeason = seasons[seasons.length - 1];
      previousSeason = seasons[seasons.length - 2];
    } else if (currentSeason) {
      const currentIndex = seasons.indexOf(currentSeason);
      previousSeason = currentIndex > 0 ? seasons[currentIndex - 1] : undefined;
    }

    // Get top exporters by boxes
    let dataForRanking = [...this.data];
    if (currentSeason) {
      dataForRanking = dataForRanking.filter(r => r.season === currentSeason);
    }

    const exporterMap = new Map<string, number>();
    dataForRanking.forEach(record => {
      if (record.exporter) {
        const current = exporterMap.get(record.exporter) || 0;
        exporterMap.set(record.exporter, current + record.boxes);
      }
    });

    const topExporters = Array.from(exporterMap.entries())
      .map(([exp, boxes]) => ({ exporter: exp, boxes }))
      .sort((a, b) => b.boxes - a.boxes)
      .slice(0, limit + 1); // +1 to include the selected exporter if not in top

    // Ensure selected exporter is included
    const selectedExporterData = exporterMap.get(exporter);
    if (selectedExporterData && !topExporters.some(e => e.exporter === exporter)) {
      topExporters.push({ exporter, boxes: selectedExporterData });
      topExporters.sort((a, b) => b.boxes - a.boxes);
      topExporters.pop(); // Remove the last one to keep limit
    }

    // Calculate YoY change for each exporter
    const result = topExporters.map(({ exporter: exp, boxes }) => {
      let yoyChangePercent = 0;

      if (currentSeason && previousSeason) {
        const currentBoxes = this.data
          .filter(r => r.exporter === exp && r.season === currentSeason)
          .reduce((sum, r) => sum + r.boxes, 0);

        const previousBoxes = this.data
          .filter(r => r.exporter === exp && r.season === previousSeason)
          .reduce((sum, r) => sum + r.boxes, 0);

        if (previousBoxes > 0) {
          yoyChangePercent = ((currentBoxes - previousBoxes) / previousBoxes) * 100;
        }
      }

      return {
        exporter: exp,
        boxes,
        yoyChangePercent
      };
    });

    return result;
  }

  /**
   * Gets KPIs for a specific product
   */
  getProductKPIs(product: string, season?: string, region?: string): {
    totalKilos: number;
    yoyChangePercent: number;
    avgPricePerKg: number;
  } {
    let filtered = this.data.filter(r => r.product === product);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    if (region) {
      filtered = filtered.filter(r => r.region === region);
    }

    const productKilos = filtered.reduce((sum, r) => sum + r.net_weight_kg, 0);

    // Calculate YoY change
    let yoyChangePercent = 0;
    const seasons = Array.from(new Set(this.data.map(r => r.season))).sort();
    
    if (seasons.length >= 2) {
      const currentSeason = season || seasons[seasons.length - 1];
      const currentIndex = seasons.indexOf(currentSeason);
      const previousSeason = currentIndex > 0 ? seasons[currentIndex - 1] : undefined;

      if (previousSeason) {
        const currentKilos = this.data
          .filter(r => r.product === product && r.season === currentSeason && (!region || r.region === region))
          .reduce((sum, r) => sum + r.net_weight_kg, 0);

        const previousKilos = this.data
          .filter(r => r.product === product && r.season === previousSeason && (!region || r.region === region))
          .reduce((sum, r) => sum + r.net_weight_kg, 0);

        if (previousKilos > 0) {
          yoyChangePercent = ((currentKilos - previousKilos) / previousKilos) * 100;
        }
      }
    }

    // Calculate average price per kg
    let avgPricePerKg = 0;
    const totalValue = filtered.reduce((sum, r) => sum + (r.value_usd || 0), 0);
    if (productKilos > 0 && totalValue > 0) {
      avgPricePerKg = totalValue / productKilos;
    }

    return {
      totalKilos: productKilos,
      yoyChangePercent,
      avgPricePerKg
    };
  }

  /**
   * Gets top exporters for a specific product
   */
  getProductTopExporters(product: string, season?: string, limit: number = 10): Array<{
    exporter: string;
    kilos: number;
    boxes: number;
    percentage: number;
  }> {
    let filtered = this.data.filter(r => r.product === product);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    const totalKilos = filtered.reduce((sum, r) => sum + r.net_weight_kg, 0);

    const exporterMap = new Map<string, { kilos: number; boxes: number }>();

    filtered.forEach(record => {
      if (record.exporter) {
        const current = exporterMap.get(record.exporter) || { kilos: 0, boxes: 0 };
        exporterMap.set(record.exporter, {
          kilos: current.kilos + record.net_weight_kg,
          boxes: current.boxes + record.boxes
        });
      }
    });

    return Array.from(exporterMap.entries())
      .map(([exporter, values]) => ({
        exporter,
        ...values,
        percentage: totalKilos > 0 ? (values.kilos / totalKilos) * 100 : 0
      }))
      .sort((a, b) => b.kilos - a.kilos)
      .slice(0, limit);
  }

  /**
   * Gets country distribution for a specific product
   */
  getProductCountryDistribution(product: string, season?: string): Array<{
    country: string;
    kilos: number;
    boxes: number;
    percentage: number;
  }> {
    let filtered = this.data.filter(r => r.product === product);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    const totalKilos = filtered.reduce((sum, r) => sum + r.net_weight_kg, 0);

    const countryMap = new Map<string, { kilos: number; boxes: number }>();

    filtered.forEach(record => {
      if (record.country) {
        const current = countryMap.get(record.country) || { kilos: 0, boxes: 0 };
        countryMap.set(record.country, {
          kilos: current.kilos + record.net_weight_kg,
          boxes: current.boxes + record.boxes
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([country, values]) => ({
        country,
        ...values,
        percentage: totalKilos > 0 ? (values.kilos / totalKilos) * 100 : 0
      }))
      .sort((a, b) => b.kilos - a.kilos);
  }

  /**
   * Gets dual time series (boxes and price) for a product by year
   */
  getProductDualTimeSeries(product: string, season?: string): Array<{
    year: number;
    boxes: number;
    avgPricePerKg: number;
  }> {
    let filtered = this.data.filter(r => r.product === product);

    if (season) {
      filtered = filtered.filter(r => r.season === season);
    }

    const yearMap = new Map<number, { boxes: number; totalValue: number; totalKilos: number }>();

    filtered.forEach(record => {
      const current = yearMap.get(record.year) || { boxes: 0, totalValue: 0, totalKilos: 0 };
      yearMap.set(record.year, {
        boxes: current.boxes + record.boxes,
        totalValue: current.totalValue + (record.value_usd || 0),
        totalKilos: current.totalKilos + record.net_weight_kg
      });
    });

    return Array.from(yearMap.entries())
      .map(([year, values]) => ({
        year,
        boxes: values.boxes,
        avgPricePerKg: values.totalKilos > 0 && values.totalValue > 0
          ? values.totalValue / values.totalKilos
          : 0
      }))
      .sort((a, b) => a.year - b.year);
  }

  /**
   * Gets variety composition for a product across specified seasons
   */
  getProductVarietyComposition(product: string, seasons: string[]): Array<{
    season: string;
    variety: string;
    boxes: number;
    percentage: number;
  }> {
    const filtered = this.data.filter(
      r => r.product === product && seasons.includes(r.season)
    );

    // Calculate total boxes per season
    const seasonTotals = new Map<string, number>();
    filtered.forEach(record => {
      const current = seasonTotals.get(record.season) || 0;
      seasonTotals.set(record.season, current + record.boxes);
    });

    // Group by season and variety
    const varietyMap = new Map<string, { season: string; variety: string; boxes: number }>();

    filtered.forEach(record => {
      const variety = record.variety || 'Unknown';
      const key = `${record.season}_${variety}`;
      const current = varietyMap.get(key) || { season: record.season, variety, boxes: 0 };
      varietyMap.set(key, {
        ...current,
        boxes: current.boxes + record.boxes
      });
    });

    return Array.from(varietyMap.values())
      .map(item => ({
        ...item,
        percentage: (seasonTotals.get(item.season) || 0) > 0
          ? (item.boxes / (seasonTotals.get(item.season) || 1)) * 100
          : 0
      }))
      .sort((a, b) => {
        const seasonCompare = a.season.localeCompare(b.season);
        if (seasonCompare !== 0) return seasonCompare;
        return b.boxes - a.boxes;
      });
  }
}

