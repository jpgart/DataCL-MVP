import { loadParquetData } from '@/lib/parquet-loader';
import { ProductsDeepDive } from '@/components/dashboard/products-deep-dive';
import { LoadingIndicator } from '@/components/dashboard/loading-indicator';

export default async function ProductsPage() {
	const data = await loadParquetData();

	return (
		<>
			<LoadingIndicator />
			<ProductsDeepDive initialData={data} />
		</>
	);
}


