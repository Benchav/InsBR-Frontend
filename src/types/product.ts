export interface Product {
    id: string;
    name: string;
    // ...otros campos existentes
    categoryId?: string;
    category?: string; // Nombre de la categoría (para mostrar)
}
