import { api } from "./api";
import { Order, OrderStatus, PaginatedResult, ShippingInfo } from "../types";

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export type SupplierStatsRange = "today" | "7d" | "30d" | "custom";
export interface SupplierStatsParams { range: SupplierStatsRange; from?: string; to?: string; }
export interface SupplierOrderStats {
  totalRevenue: number;
  orderCount: number;
  openOrderCount: number;
  averageOrderValue: number;
  trend: { date: string; revenue: number }[];
}

export interface SupplierOpenOrderCount {
  openOrderCount: number;
}

export async function placeOrder(shippingInfo: ShippingInfo) {
  const res = await api.post<{ data: Order }>("/orders", { shippingInfo });
  return res.data.data;
}

export async function getBuyerOrders(params: ListOrdersParams = {}) {
  const res = await api.get<{ data: PaginatedResult<Order> }>("/orders/mine", { params });
  return res.data.data;
}

export async function getSupplierOrders(params: ListOrdersParams = {}) {
  const res = await api.get<{ data: PaginatedResult<Order> }>("/orders/supplier", { params });
  return res.data.data;
}

export async function getSupplierOrder(id: string) {
  const res = await api.get<{ data: Order }>(`/orders/supplier/${id}`);
  return res.data.data;
}

export async function getSupplierOrderStats(params: SupplierStatsParams) {
  const res = await api.get<{ data: SupplierOrderStats }>("/orders/supplier/stats", { params });
  return res.data.data;
}

export async function getSupplierOpenOrderCount() {
  const res = await api.get<{ data: SupplierOpenOrderCount }>("/orders/supplier/open-count");
  return res.data.data;
}

export async function getOrder(id: string) {
  const res = await api.get<{ data: Order }>(`/orders/${id}`);
  return res.data.data;
}

export async function advanceOrderStatus(id: string, status: OrderStatus) {
  const res = await api.patch<{ data: Order }>(`/orders/${id}/status`, { status });
  return res.data.data;
}
