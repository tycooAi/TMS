export interface Driver {
  id: string;
  name: string;
  phone: string;
  availability: 'Available' | 'On Trip' | 'On Leave';
}
