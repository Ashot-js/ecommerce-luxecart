import { api } from './baseApi';
import type {
  Product,
  Category,
  PaginatedResponse,
  ProductFilters,
} from '../../types';

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.search) params.set('search', filters.search);
        if (filters.min_price !== undefined) params.set('min_price', String(filters.min_price));
        if (filters.max_price !== undefined) params.set('max_price', String(filters.max_price));
        if (filters.featured !== undefined) params.set('featured', String(filters.featured));
        if (filters.sort_by) params.set('sort_by', filters.sort_by);
        if (filters.page !== undefined) params.set('page', String(filters.page));
        if (filters.limit !== undefined) params.set('limit', String(filters.limit));
        const qs = params.toString();
        return qs ? `/products?${qs}` : '/products';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Products' as const, id })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),

    getFeaturedProducts: builder.query<{ data: Product[] }, void>({
      query: () => '/products/featured',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Products' as const, id })),
              { type: 'Products', id: 'FEATURED' },
            ]
          : [{ type: 'Products', id: 'FEATURED' }],
    }),

    getCategories: builder.query<{ data: Category[] }, void>({
      query: () => '/products/categories',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Categories' as const, id })),
              { type: 'Categories', id: 'LIST' },
            ]
          : [{ type: 'Categories', id: 'LIST' }],
    }),

    getProduct: builder.query<{ data: Product }, string>({
      query: (slugOrId) => `/products/${slugOrId}`,
      providesTags: (_result, _error, slugOrId) => [{ type: 'Product', id: slugOrId }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetCategoriesQuery,
  useGetProductQuery,
} = productsApi;
