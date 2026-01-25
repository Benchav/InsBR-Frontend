export type UserRole = 'ADMIN' | 'GERENTE' | 'CAJERO';

export interface Branch {
	id: string;
	name: string;
	code: string;
	isActive: boolean;
}

export interface Category {
	id: string;
	name: string;
	description?: string;
	isActive: boolean;
}

export interface Stock {
	id: string;
	productId: string;
	branchId: string;
	quantity: number;
	product: {
		id: string;
		name: string;
		category: string; // Nombre legacy
		categoryId?: string; // Nuevo ID
		// ... otros campos de producto
	};
}

export interface Product {
	id: string;
	name: string;
	categoryId?: string;
	category?: string;
	// ...otros campos existentes
}
