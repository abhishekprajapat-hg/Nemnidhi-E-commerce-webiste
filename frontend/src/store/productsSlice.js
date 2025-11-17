import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const { data } = await axios.get(`${API}/api/products`)
  // backend returns { products, page, pages } or array; normalize:
  return data.products || data
})

const slice = createSlice({
  name: 'products',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchProducts.pending, (s) => { s.status = 'loading' })
    builder.addCase(fetchProducts.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload })
    builder.addCase(fetchProducts.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message })
  }
})

export default slice.reducer
