export interface Customer {
  id: string;
  name: string;
  customerNumber: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
}
