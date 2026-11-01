import type { CashBankAccount, Customer, CustomerTransaction, FinancialTransaction, Vehicle, WorkerWage } from '../../types/accounts';
export const accountsCustomers: Customer[] = [
  { id:'CUS-00124', name:'K Engineering', phone:'98765 XXXXX', address:'Madurai', balance:50000, totalCredit:95000, totalPaid:45000, status:'Active' },
  { id:'CUS-00125', name:'Sri Construction', phone:'98766 XXXXX', address:'Madurai', balance:28000, totalCredit:68000, totalPaid:40000, status:'Active' },
  { id:'CUS-00126', name:'ABC Constructions', phone:'98767 XXXXX', address:'Dindigul', balance:0, totalCredit:40000, totalPaid:40000, status:'Active' },
];
export const customerTransactions: CustomerTransaction[] = [
  {id:'TXN-02481',customerId:'CUS-00124',date:'13 Sep 2026',type:'Customer Payment',amount:25000,paymentMode:'UPI',balanceAfter:50000,status:'Posted',notes:'UPI reference UPI/260913/481'},
  {id:'TXN-02470',customerId:'CUS-00124',date:'10 Sep 2026',type:'Customer Credit',amount:75000,balanceAfter:75000,status:'Posted'},
  {id:'TXN-02465',customerId:'CUS-00125',date:'09 Sep 2026',type:'Customer Payment',amount:12000,paymentMode:'Bank',balanceAfter:28000,status:'Posted'},
];
export const workers: WorkerWage[] = [
  {workerId:'WRK-0024',name:'Arun Kumar',phone:'+91 98765 10240',role:'Data Entry Operator',salary:18000,paid:12000,advance:0,deduction:0},
  {workerId:'WRK-0025',name:'Ravi Kumar',phone:'+91 98765 10250',role:'Driver',salary:22000,paid:22000,advance:2000,deduction:0},
  {workerId:'WRK-0026',name:'Suresh Kumar',phone:'+91 98765 10260',role:'Driver',salary:22000,paid:14000,advance:3000,deduction:0},
];
export const vehicles: Vehicle[] = [
  {registration:'TN 58 AB 2345',type:'Tipper',capacity:'18 Ton',fuelCapacity:'180 L',ownership:'Own',km:'48,230 KM',lastMaintenance:'28 Aug 2026',maintenanceFee:4500},
  {registration:'TN 59 AC 7821',type:'Tipper',capacity:'20 Ton',fuelCapacity:'200 L',ownership:'Rented',km:'31,850 KM',lastMaintenance:'30 Aug 2026',maintenanceFee:6200},
  {registration:'TN 58 AB 5678',type:'Tipper',capacity:'18 Ton',fuelCapacity:'180 L',ownership:'Own',km:'57,910 KM',lastMaintenance:'20 Aug 2026',maintenanceFee:3800},
];
export const initialAccounts: CashBankAccount[] = [{id:'cash',name:'Cash',balance:42500},{id:'bank',name:'Bank',balance:184250},{id:'upi',name:'UPI / Online',balance:64750}];
export const initialTransactions: FinancialTransaction[] = [
  {id:'TXN-02481',date:'13 Sep 2026',entity:'K Engineering',entityType:'Customer',type:'Customer Payment',amount:25000,paymentMode:'UPI',status:'Posted',createdBy:'Priya Kumar',reference:'UPI/260913/481',account:'UPI / Online'},
  {id:'TXN-02480',date:'13 Sep 2026',entity:'Ravi Kumar',entityType:'Worker',type:'Wage Payment',amount:8000,paymentMode:'Cash',status:'Posted',createdBy:'Priya Kumar',account:'Cash'},
  {id:'TXN-02479',date:'13 Sep 2026',entity:'TN 58 AB 2345',entityType:'Vehicle',type:'Vehicle Maintenance',amount:4500,paymentMode:'Bank',status:'Posted',createdBy:'Priya Kumar',account:'Bank'},
  {id:'TXN-02478',date:'12 Sep 2026',entity:'Office',entityType:'Business',type:'Other Expense',amount:2200,paymentMode:'Cash',status:'Posted',createdBy:'Priya Kumar',account:'Cash'},
];
