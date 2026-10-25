import { api } from './baseApi';
import type { AdminStats, Category, Order, OrderStatus, PaginatedResponse, Product } from '../../types';

export type ProductInput = Pick<
  Product,
  'name' | 'slug' | 'description' | 'price' | 'compare_price' | 'stock' | 'category_id' | 'image_url' | 'featured' | 'active'
>;

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
}

function toQuery(params: ListParams): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<{ data: AdminStats }, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),

    getAdminProducts: builder.query<PaginatedResponse<Product>, ListParams>({
      query: (params) => `/admin/products${toQuery(params)}`,
      providesTags: [{ type: 'Products', id: 'ADMIN' }],
    }),

    getAdminCategories: builder.query<{ data: Category[] }, void>({
      query: () => '/admin/categories',
      providesTags: [{ type: 'Categories', id: 'LIST' }],
    }),

    createProduct: builder.mutation<{ data: Product }, ProductInput>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      invalidatesTags: ['Products', 'AdminStats'],
    }),

    updateProduct: builder.mutation<{ data: Product }, { id: string; patch: Partial<ProductInput> }>({
      query: ({ id, patch }) => ({ url: `/admin/products/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => ['Products', 'AdminStats', { type: 'Product', id }],
    }),

    getAdminOrders: builder.query<PaginatedResponse<Order>, ListParams>({
      query: (params) => `/admin/orders${toQuery(params)}`,
      providesTags: [{ type: 'Orders', id: 'ADMIN' }],
    }),

    updateOrderStatus: builder.mutation<{ data: Order }, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/admin/orders/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Orders', 'AdminStats', 'Products'],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminProductsQuery,
  useGetAdminCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
} = adminApi;
