import { z } from 'zod';

export const kpiSummarySchema = z.object({
	totalBoxes: z.number(),
	totalKilos: z.number(),
	avgUnitWeight: z.number(),
	recordCount: z.number(),
	totalExporters: z.number(),
	totalProducts: z.number(),
	totalCountries: z.number(),
	totalSeasons: z.number()
});

export const topCountriesSchema = z.object({
	year: z.number().nullable(),
	limit: z.number(),
	items: z
		.array(
			z.object({
				rank: z.number(),
				country: z.string(),
				netWeightKg: z.number(),
				boxes: z.number()
			})
		)
		.min(1)
});

export const topExportersSchema = z.object({
	year: z.number().nullable(),
	product: z.string().nullable(),
	limit: z.number(),
	items: z
		.array(
			z.object({
				rank: z.number(),
				exporter: z.string(),
				netWeightKg: z.number(),
				boxes: z.number()
			})
		)
		.min(1)
});

export const timeSeriesSchema = z.object({
	country: z.string(),
	points: z.array(
		z.object({
			year: z.number(),
			netWeightKg: z.number(),
			boxes: z.number()
		})
	)
});

