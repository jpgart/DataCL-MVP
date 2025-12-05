export default function ExportersLoading() {
	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header skeleton */}
				<div className="mb-8">
					<div className="h-10 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
					<div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
				</div>

				{/* Filters skeleton */}
				<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="h-10 bg-gray-200 rounded animate-pulse" />
						<div className="h-10 bg-gray-200 rounded animate-pulse" />
						<div className="h-10 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>

				{/* KPI cards skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
						<div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
					</div>
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
						<div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
					</div>
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
						<div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
					</div>
				</div>

				{/* Charts skeleton */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
						<div className="h-64 bg-gray-200 rounded animate-pulse" />
					</div>
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
						<div className="h-64 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
						<div className="h-64 bg-gray-200 rounded animate-pulse" />
					</div>
					<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
						<div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
						<div className="h-64 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
			</div>
		</div>
	);
}


