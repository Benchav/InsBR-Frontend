# InsBR Frontend

Aplicación frontend para InsBR, un sistema integral de gestión minorista y de inventario construido con tecnologías web modernas.

## Descripción General

Este proyecto proporciona una interfaz robusta para gestionar diversos aspectos de un negocio minorista, incluyendo punto de venta, seguimiento de inventario, gestión financiera y reportes. Cuenta con un diseño responsivo, control de acceso basado en roles y un conjunto de herramientas para agilizar las operaciones diarias.

## Características

- **Panel de Control**: Visión general en tiempo real de métricas clave del negocio.
- **Punto de Venta (POS)**: Procesamiento eficiente de ventas (`/ventas`) y seguimiento del historial de ventas (`/ventas-todas`).
- **Gestión de Inventario**: Control integral de productos y existencias (`/inventario`), incluyendo gestión de categorías (`/admin-categorias`).
- **Compras**: Gestión de pedidos a proveedores y adquisiciones (`/compras`).
- **Gestión de Caja**: Operaciones diarias de caja, apertura y cierre (`/caja`).
- **Finanzas**:
  - **Créditos**: Gestión de cuentas de crédito de clientes (`/creditos`).
  - **Cuentas por Pagar**: Seguimiento de deudas y pagos a proveedores (`/cuentas-por-pagar`).
- **Transferencias**: Manejo de movimientos de stock entre ubicaciones (`/transferencias`).
- **CRM**:
  - **Clientes**: Mantenimiento de base de datos de clientes (`/clientes`).
  - **Proveedores**: Gestión de relaciones con proveedores (`/proveedores`).
- **Gestión de Usuarios**: Administración de usuarios y permisos (`/usuarios`).
- **Reportes**: Analíticas e informes detallados (`/reportes`).

## Tecnologías

- **Núcleo**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/) (basado en [Radix UI](https://www.radix-ui.com/))
- **Gestión de Estado y Obtención de Datos**: [Zustand](https://github.com/pmndrs/zustand), [TanStack Query](https://tanstack.com/query/latest)
- **Enrutamiento**: [React Router](https://reactrouter.com/)
- **Formularios y Validación**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Manejo de Fechas**: [date-fns](https://date-fns.org/)
- **Pruebas**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/)

## Requisitos Previos

Asegúrate de tener instalado lo siguiente:
- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [npm](https://www.npmjs.com/) (o yarn/pnpm/bun)

## Comenzando

1.  **Clona el repositorio:**

    ```bash
    git clone <TU_URL_DE_GIT>
    cd insbr-frontend
    ```

2.  **Instala las dependencias:**

    ```bash
    npm install
    ```

3.  **Inicia el servidor de desarrollo:**

    ```bash
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:5173`.

## Scripts

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Construye la aplicación para producción.
- `npm run preview`: Previsualiza la construcción de producción localmente.
- `npm run lint`: Ejecuta ESLint para verificar problemas de calidad de código.
- `npm run test`: Ejecuta la suite de pruebas usando Vitest.

## Estructura del Proyecto

```
src/
├── api/          # Definiciones y tipos de API
├── components/   # Componentes UI reutilizables
├── config/       # Configuración de la aplicación (navegación, constantes)
├── contexts/     # Proveedores de contexto de React
├── hooks/        # Hooks personalizados de React
├── lib/          # Bibliotecas de utilidad y utilidades de shadcn
├── pages/        # Páginas principales de la aplicación (vistas)
├── services/     # Capas de servicio de API
├── stores/       # Tiendas de estado de Zustand
├── test/         # Configuración y utilidades de prueba
├── types/        # Definiciones de tipo TypeScript
├── utils/        # Funciones auxiliares genéricas
└── App.tsx       # Componente principal de la aplicación
```

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:
1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/TuFuncionalidad`).
3. Haz commit de tus cambios (`git commit -m 'Añadir alguna funcionalidad'`).
4. Haz push a la rama (`git push origin feature/TuFuncionalidad`).
5. Abre un Pull Request.

## Licencia

[Licencia MIT](LICENSE) (o especifica tu licencia)
