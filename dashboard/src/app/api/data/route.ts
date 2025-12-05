import { NextResponse } from 'next/server';
import { dataCache } from '@/lib/data-cache';

export async function GET(request: Request): Promise<NextResponse> {
	try {
		// Obtener parámetros de query para paginación opcional
		const { searchParams } = new URL(request.url);
		const limitParam = searchParams.get('limit');
		const offsetParam = searchParams.get('offset');

		// Cargar datos desde el caché
		const allData = await dataCache.getData();

		// Aplicar paginación si se especifica
		let data = allData;
		if (limitParam || offsetParam) {
			const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
			const limit = limitParam ? parseInt(limitParam, 10) : allData.length;

			if (isNaN(offset) || isNaN(limit) || offset < 0 || limit < 0) {
				return NextResponse.json(
					{ error: 'Invalid pagination parameters. offset and limit must be non-negative integers.' },
					{ status: 400 }
				);
			}

			data = allData.slice(offset, offset + limit);
		}

		// Retornar datos con metadata de paginación si aplica
		if (limitParam || offsetParam) {
			return NextResponse.json({
				data,
				pagination: {
					total: allData.length,
					offset: offsetParam ? parseInt(offsetParam, 10) : 0,
					limit: limitParam ? parseInt(limitParam, 10) : allData.length,
					hasMore: (offsetParam ? parseInt(offsetParam, 10) : 0) + data.length < allData.length
				}
			});
		}

		// Retornar todos los datos si no hay paginación
		return NextResponse.json(data);
	} catch (error) {
		console.error('[ERROR] API route error:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}

