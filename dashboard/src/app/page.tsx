import { loadParquetData } from '@/lib/parquet-loader';
import { SmartDashboard } from '@/components/dashboard/smart-dashboard';
import { LoadingIndicator } from '@/components/dashboard/loading-indicator';

export default async function Home() {
  const data = await loadParquetData();

  return (
    <>
      <LoadingIndicator />
      <SmartDashboard initialData={data} />
    </>
  );
}
