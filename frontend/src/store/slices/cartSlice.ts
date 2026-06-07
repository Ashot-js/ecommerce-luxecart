import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/baseApi';
import type { CartItem } from '../../types';

interface CartState {
  items: CartItem[];
  itemCount: number;
}

const initialState: CartState = {
  items: [],
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.itemCount = action.payload.reduce((sum, item) => sum + item.quantity, 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.itemCount = 0;
    },
  },
});

export const { setCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

// ---- RTK Query endpoints for Cart ----
export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<{ data: CartItem[] }, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    getCartCount: builder.query<{ count: number }, void>({
      query: () => '/cart/count',
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<{ data: CartItem }, { product_id: string; quantity: number }>({
      query: (body) => ({
        url: '/cart',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<{ data: CartItem | null }, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({
        url: `/cart/${itemId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<void, string>({
      query: (itemId) => ({
        url: `/cart/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useGetCartCountQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} = cartApi;
