export interface Source {
  id: string;
  name: string;
  material: string;
  ratePerUnit: number;
  unit: 'Ton' | 'CFT' | 'Load';
  location: string;
}
