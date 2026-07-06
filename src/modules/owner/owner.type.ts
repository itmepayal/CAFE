export interface FindOrdersOptions {
  status?: string;
  paymentStatus?: string;
  search?: string;
  from?: string;
  to?: string;
  today?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface GetCafeOrdersOptions {
  status?: string;
  paymentStatus?: string;
  search?: string;
  from?: string;
  to?: string;
  today?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}
