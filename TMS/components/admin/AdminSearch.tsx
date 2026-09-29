'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import {
  Search,
  Truck,
  Users,
  FileText,
  DollarSign,
  Fuel,
  Network,
  ArrowRight,
  Database,
  CheckCircle,
  ExternalLink,
  Layers,
  MapPin,
  ClipboardList,
} from '../ui/Icons';
import { formatCurrency } from '../../lib/calculations';

interface SearchResultItem {
  id: string;
  type: 'TRIP' | 'CUSTOMER' | 'VEHICLE' | 'DRIVER' | 'INVOICE' | 'PAYMENT' | 'TRANSACTION' | 'DIESEL';
  title: string;
  subtitle: string;
  details: Record<string, any>;
  relations: Array<{ label: string; id: string; name: string; type: string; url?: string }>;
}

export function AdminSearch() {
  const { trips, customers, vehicles, drivers, invoices, payments, transactions, dieselRecords } = useTmsStore();
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);

  const results: SearchResultItem[] = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const list: SearchResultItem[] = [];

    // 1. Search Trips
    trips.forEach((t) => {
      if (
        t.id.toLowerCase().includes(q) ||
        (t.customerId && t.customerId.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.vehicleRegistration && t.vehicleRegistration.toLowerCase().includes(q)) ||
        (t.driverName && t.driverName.toLowerCase().includes(q)) ||
        (t.material && t.material.toLowerCase().includes(q))
      ) {
        list.push({
          id: t.id,
          type: 'TRIP',
          title: `Trip ${t.id}`,
          subtitle: `${t.customerName || t.customerId} · ${t.vehicleRegistration} · ${t.material} (${t.quantity} Tons)`,
          details: {
            Date: t.date,
            Status: t.status,
            Quantity: `${t.quantity} ${t.unit || 'Tons'}`,
            AppliedRate: `₹${t.appliedRate}/Ton`,
            GrossFreight: formatCurrency((t.appliedRate || 0) * (t.quantity || 0)),
            Source: t.source || '—',
            Loading: t.loadingLocation || '—',
            Delivery: t.deliveryLocation || '—',
          },
          relations: [
            { label: 'Customer', id: t.customerId || '', name: t.customerName || 'Customer', type: 'CUSTOMER' },
            { label: 'Vehicle', id: t.vehicleRegistration || '', name: t.vehicleRegistration || '', type: 'VEHICLE' },
            { label: 'Driver', id: t.driverId || '', name: t.driverName || 'Driver', type: 'DRIVER' },
            { label: 'Invoice', id: t.invoiceId || 'UNBILLED', name: t.invoiceId ? `Invoice ${t.invoiceId}` : 'Not Yet Invoiced', type: 'INVOICE' },
          ],
        });
      }
    });

    // 2. Search Customers
    customers.forEach((c) => {
      if (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
      ) {
        const relatedTrips = trips.filter((t) => t.customerId === c.id);
        const relatedInvoices = invoices.filter((i) => i.customerId === c.id);
        list.push({
          id: c.id,
          type: 'CUSTOMER',
          title: `Customer ${c.name} (${c.id})`,
          subtitle: `Phone: ${c.phone} · Balance: ₹${c.balance || 0} · Terms: ${c.creditTerms || 'Cash'}`,
          details: {
            Phone: c.phone,
            GSTIN: c.gstin || 'Unregistered',
            CreditTerms: c.creditTerms,
            Status: c.status,
            OutstandingBalance: formatCurrency(c.balance || 0),
            TotalBilled: formatCurrency(c.totalCredit || 0),
            TotalPaid: formatCurrency(c.totalPaid || 0),
          },
          relations: [
            ...relatedTrips.slice(0, 3).map((t) => ({ label: 'Trip Dispatch', id: t.id, name: `${t.id} - ${t.material}`, type: 'TRIP' })),
            ...relatedInvoices.slice(0, 3).map((i) => ({ label: 'Billed Invoice', id: i.id, name: `${i.id} (₹${i.totalAmount})`, type: 'INVOICE' })),
          ],
        });
      }
    });

    // 3. Search Vehicles
    vehicles.forEach((v) => {
      if (v.registration.toLowerCase().includes(q) || (v.type && v.type.toLowerCase().includes(q))) {
        const relatedTrips = trips.filter((t) => t.vehicleRegistration?.toLowerCase() === v.registration.toLowerCase());
        const relatedFuel = dieselRecords.filter((d) => d.vehicleRegistration?.toLowerCase() === v.registration.toLowerCase());
        list.push({
          id: v.registration,
          type: 'VEHICLE',
          title: `Vehicle ${v.registration}`,
          subtitle: `Type: ${v.type} · Capacity: ${v.capacity || 25} Tons · Status: ${v.status}`,
          details: {
            Registration: v.registration,
            BodyType: v.type,
            Ownership: v.ownership || 'OWN',
            Capacity: `${v.capacity || 25} Tons`,
            Status: v.status,
            AssignedDriver: v.assignedDriverName || 'None',
          },
          relations: [
            { label: 'Assigned Pilot', id: v.assignedDriverId || '', name: v.assignedDriverName || 'No Driver', type: 'DRIVER' },
            ...relatedTrips.slice(0, 3).map((t) => ({ label: 'Assigned Trip', id: t.id, name: `${t.id} - ${t.customerName}`, type: 'TRIP' })),
            ...relatedFuel.slice(0, 2).map((f) => ({ label: 'Fuel Fill', id: f.id, name: `${f.litres}L at ${f.fuelStation || 'Bunk'}`, type: 'DIESEL' })),
          ],
        });
      }
    });

    // 4. Search Invoices
    invoices.forEach((i) => {
      if (
        i.id.toLowerCase().includes(q) ||
        (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
        (i.customerId && i.customerId.toLowerCase().includes(q)) ||
        (i.customerName && i.customerName.toLowerCase().includes(q))
      ) {
        list.push({
          id: i.id,
          type: 'INVOICE',
          title: `Invoice ${i.invoiceNumber || i.id}`,
          subtitle: `${i.customerName || i.customerId} · Total: ₹${i.totalAmount} · Balance Due: ₹${i.outstandingAmount}`,
          details: {
            InvoiceNo: i.invoiceNumber || i.id,
            Date: i.date,
            Customer: i.customerName || i.customerId,
            Subtotal: formatCurrency(i.subtotal || 0),
            GSTAmount: formatCurrency(i.gstAmount || 0),
            TotalAmount: formatCurrency(i.totalAmount || 0),
            BalanceDue: formatCurrency(i.outstandingAmount || 0),
            Status: i.status,
          },
          relations: [
            { label: 'Billed Customer', id: i.customerId, name: i.customerName || i.customerId, type: 'CUSTOMER' },
          ],
        });
      }
    });

    return list.slice(0, 15);
  }, [query, trips, customers, vehicles, invoices, dieselRecords]);

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Global Cross-Entity Search & Relationship Inspector"
        description="Search across trips, customers, fleet vehicles, invoices, and ledgers to trace cross-portal connections"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1f5] text-[#16425B] text-xs font-mono font-bold rounded-md border border-[#81C4D7]/40">
          <Network size={14} className="text-[#2F668F]" />
          Relational Trace Active
        </span>
      </PageHeader>

      {/* SEARCH INPUT BAR */}
      <div className="bg-white p-6 rounded-xl border border-[#D9DBD6] shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8da3b5]" />
          <input
            type="text"
            placeholder="Search by Trip ID (TRP-...), Customer Name/ID, Truck Plate (TN 58...), Phone, Invoice ID..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedItem(null);
            }}
            className="w-full h-12 pl-12 pr-4 text-sm font-semibold rounded-lg border border-[#D9DBD6] focus:border-[#2F668F] focus:outline-none shadow-inner"
            autoFocus
          />
        </div>
        <p className="text-xs text-[#5A6E7F] mt-2">
          Tip: Type a trip reference like <code>TRP-1001</code>, customer name like <code>Velan</code>, or vehicle plate like <code>TN</code>.
        </p>
      </div>

      {/* RESULTS & RELATIONSHIP GRAPH INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RESULTS LIST (LEFT 6 COLS) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E7F]">
              Matching Records {query && `(${results.length})`}
            </span>
            <span className="text-xs text-[#8da3b5]">Click record to inspect graph</span>
          </div>

          {!query ? (
            <div className="p-12 bg-white rounded-xl border border-[#D9DBD6] text-center text-[#5A6E7F]">
              <Search size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold">Enter a search keyword to inspect entity relations</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-[#D9DBD6] text-center text-[#5A6E7F]">
              No records match "{query}". Try checking ID syntax or searching a phone number.
            </div>
          ) : (
            results.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const typeBadge =
                item.type === 'TRIP'
                  ? 'bg-blue-100 text-blue-800'
                  : item.type === 'CUSTOMER'
                  ? 'bg-indigo-100 text-indigo-800'
                  : item.type === 'VEHICLE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#e8f1f5] border-[#2F668F] shadow-sm ring-1 ring-[#2F668F]'
                      : 'bg-white border-[#D9DBD6] hover:border-[#81C4D7] hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${typeBadge}`}>
                        {item.type}
                      </span>
                      <strong className="text-xs font-bold text-[#16425B] truncate">{item.title}</strong>
                    </div>
                    <p className="text-xs text-[#5A6E7F] truncate">{item.subtitle}</p>
                  </div>
                  <ArrowRight size={16} className={isSelected ? 'text-[#2F668F]' : 'text-[#8da3b5]'} />
                </div>
              );
            })
          )}
        </div>

        {/* GRAPH / RELATIONSHIP DETAILS (RIGHT 6 COLS) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm sticky top-4 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9DBD6]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#2F668F] font-bold block">
                  Relationship Node Inspector
                </span>
                <h3 className="text-base font-black text-[#16425B]">
                  {selectedItem ? selectedItem.title : 'Select a Record'}
                </h3>
              </div>
              {selectedItem && (
                <span className="px-2.5 py-1 rounded bg-[#f8fafc] text-xs font-mono font-bold text-[#16425B] border">
                  {selectedItem.id}
                </span>
              )}
            </div>

            {!selectedItem ? (
              <div className="py-16 text-center text-[#5A6E7F] space-y-2">
                <Network size={36} className="mx-auto text-gray-300" />
                <p className="text-xs">
                  Click on any search result to visualize its inbound and outbound relationships across portals.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* NODE ATTRIBUTES */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E7F] block mb-2">
                    Direct Record Fields
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] font-mono text-xs">
                    {Object.entries(selectedItem.details).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-gray-500 block text-[11px]">{key}:</span>
                        <strong className="text-[#16425B] truncate block">{String(val)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONNECTED NODES GRAPH */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5A6E7F] block mb-3">
                    Connected Graph Entities ({selectedItem.relations.length})
                  </span>
                  <div className="space-y-2">
                    {selectedItem.relations.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] font-bold text-[#8da3b5] uppercase block">{rel.label}</span>
                          <strong className="text-xs text-[#16425B] block truncate">{rel.name}</strong>
                          <span className="text-[11px] font-mono text-[#2F668F]">{rel.id}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 shrink-0">
                          {rel.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QUICK JUMP TO DATABASE */}
                <div className="pt-2 border-t border-[#D9DBD6] flex justify-between items-center">
                  <span className="text-xs text-[#5A6E7F]">Ready to inspect raw database row?</span>
                  <Link
                    href={`/admin/database?entity=${selectedItem.type.toLowerCase()}s`}
                    className="btn-secondary !text-xs !py-1.5"
                  >
                    <Database size={13} />
                    Open in DB Explorer
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
