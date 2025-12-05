import { loadParquetData } from '@/lib/parquet-loader';
import { ExportersDeepDive } from '@/components/dashboard/exporters-deep-dive';
import { LoadingIndicator } from '@/components/dashboard/loading-indicator';

export default async function ExportersPage() {
	const data = await loadParquetData();

	return (
		<>
			<LoadingIndicator />
			<ExportersDeepDive initialData={data} />
		</>
	);
}


