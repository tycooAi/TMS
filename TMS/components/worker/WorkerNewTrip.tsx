'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTmsStore, readStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Stepper } from '../ui/Stepper';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { SearchableSelect } from '../ui/SearchableSelect';
import { CustomerCreateModal } from './new-trip/CustomerCreateModal';
import { CustomerEditRequestModal } from './new-trip/CustomerEditRequestModal';
import { VehicleCreateModal } from './new-trip/VehicleCreateModal';
import { DriverCreateModal } from './new-trip/DriverCreateModal';
import {
  CheckCircle2,
  Search,
  Plus,
  Truck,
  UserRound,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Edit,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Shield,
  Phone,
  Check,
  X,
} from '../ui/Icons';
import { Customer, Driver, Trip, Vehicle, TripStatus } from '../../types';
import { generateNextId } from '../../lib/ids';
import { apiClient } from '../../lib/api';
import { findCrusherPurchaseRate } from '../../lib/rates';

const STEPS = [
  'Trip Details',
  'Customer Details',
  'Vehicle Details',
  'Driver Details',
  'Load & Source',
  'Delivery & Review',
];

const NO_LOAD_REASONS = [
  'Vehicle repositioning / empty transit',
  'Scheduled maintenance / workshop visit',
  'Quarry breakdown / no load available',
  'Driver transit / duty change',
  'Customer cancelled order after dispatch',
  'Other operational reason',
];

export function WorkerNewTrip() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams?.get('draftId') || searchParams?.get('tripId') || searchParams?.get('editId');
  const { customers, vehicles, drivers, materials, sources, locations, rates, trips, createTrip, updateTrip } = useTmsStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerEditOpen, setIsCustomerEditOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [customMaterial, setCustomMaterial] = useState('');
  const [isOtherMaterial, setIsOtherMaterial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-generate Trip ID
  const newTripId = useMemo(() => generateNextId('TRP', trips.map((t) => t.id)), [trips]);

  // Today's date in YYYY-MM-DD format for HTML5 date pickers
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentTime = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  // Form State - Retained throughout entire wizard navigation
  const [formData, setFormData] = useState<{
    id: string;
    businessDate: string;
    enteredBy: string;
    status: TripStatus;
    isNoLoad: boolean;
    noLoadReason: string;
    // Customer
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerGstin: string;
    customerCreditTerms: string;
    customerTransactionType: 'Cash' | 'Credit';
    // Vehicle
    vehicleRegistration: string;
    vehicleType: string;
    vehicleOwnership: 'OWN' | 'RENTED';
    vehicleCapacity: string;
    // Driver
    driverId: string;
    driverName: string;
    driverPhone: string;
    driverLicense: string;
    // Load & Source
    material: string;
    quantity: number | string;
    unit: 'Ton' | 'CFT' | 'Load';
    source: string;
    sourceBillNo: string;
    loadingLocation: string;
    loadingDate: string;
    loadingTime: string;
    // Rates
    customerRate: number | string;
    transportRate: number | string;
    sourceRate: number;
    perKmRate: number;
    // Delivery
    deliveryLocation: string;
    deliveryDate: string;
    deliveryTime: string;
    openingKm: number;
    closingKm: number;
    tripKm: number;
    unloadedQuantity: number | string;
    unloadedUnit: 'Ton' | 'CFT' | 'Load';
    shortage: number;
    deliveryProof: string;
    notes: string;
  }>({
    id: newTripId,
    businessDate: todayIso,
    enteredBy: 'Arun Kumar',
    status: 'SUBMITTED',
    isNoLoad: false,
    noLoadReason: '',
    // Customer
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerGstin: '',
    customerCreditTerms: '',
    customerTransactionType: 'Credit',
    // Vehicle
    vehicleRegistration: '',
    vehicleType: '',
    vehicleOwnership: 'OWN',
    vehicleCapacity: '',
    // Driver
    driverId: '',
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    // Load & Source
    material: materials[0]?.name || 'Black M-Sand',
    quantity: 18,
    unit: 'Ton',
    source: sources[0]?.name || 'ABC Crusher',
    sourceBillNo: '',
    loadingLocation: locations[0]?.name || 'ABC Crusher Yard',
    loadingDate: todayIso,
    loadingTime: currentTime,
    // Rates
    customerRate: 850,
    transportRate: 350,
    sourceRate: 500,
    perKmRate: 28,
    // Delivery
    deliveryLocation: locations[2]?.name || 'K Engineering Site',
    deliveryDate: todayIso,
    deliveryTime: currentTime,
    openingKm: 0,
    closingKm: 0,
    tripKm: 0,
    unloadedQuantity: 18,
    unloadedUnit: 'Ton',
    shortage: 0,
    deliveryProof: '',
    notes: '',
  });

  const [userEditedRates, setUserEditedRates] = useState(false);

  // Search filter states for customer, vehicle, driver
  const [customerSearch, setCustomerSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');

  // Step validation errors
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  // Update Trip ID if trips change
  useEffect(() => {
    if (!formData.id) {
      setFormData((prev) => ({ ...prev, id: newTripId }));
    }
  }, [newTripId, formData.id]);

  // Load existing trip data if continuing draft or editing
  useEffect(() => {
    if (draftId && trips.length > 0) {
      const existingTrip = trips.find((t) => t.id === draftId);
      if (existingTrip) {
        setFormData((prev) => ({
          ...prev,
          id: existingTrip.id,
          businessDate: existingTrip.date || prev.businessDate,
          enteredBy: existingTrip.enteredBy || prev.enteredBy,
          status: existingTrip.status || prev.status,
          isNoLoad: Boolean(existingTrip.isNoLoad),
          noLoadReason: existingTrip.noLoadReason || '',
          customerId: existingTrip.customerId || prev.customerId,
          customerName: existingTrip.customerName || prev.customerName,
          customerPhone: existingTrip.customerPhone || prev.customerPhone,
          customerAddress: existingTrip.deliveryLocation || prev.customerAddress,
          customerTransactionType: (existingTrip.customerTransactionType as any) || prev.customerTransactionType || 'Credit',
          vehicleRegistration: existingTrip.vehicleRegistration || prev.vehicleRegistration,
          vehicleOwnership: (existingTrip.vehicleOwnership as any) || prev.vehicleOwnership,
          driverId: existingTrip.driverId || prev.driverId,
          driverName: existingTrip.driverName || prev.driverName,
          driverPhone: existingTrip.driverPhone || prev.driverPhone,
          material: existingTrip.material || prev.material,
          quantity: existingTrip.quantity !== undefined ? existingTrip.quantity : prev.quantity,
          unit: (existingTrip.unit as any) || prev.unit,
          source: existingTrip.source || prev.source,
          sourceBillNo: existingTrip.sourceBillNo || '',
          loadingLocation: existingTrip.loadingLocation || prev.loadingLocation,
          loadingDate: existingTrip.date || prev.loadingDate,
          customerRate: existingTrip.billingRate ?? existingTrip.appliedRate ?? prev.customerRate,
          transportRate: existingTrip.transportRate ?? prev.transportRate,
          sourceRate: existingTrip.purchaseRate ?? prev.sourceRate,
          perKmRate: existingTrip.perKmRate ?? prev.perKmRate,
          deliveryLocation: existingTrip.deliveryLocation || prev.deliveryLocation,
          deliveryDate: existingTrip.date || prev.deliveryDate,
          openingKm: existingTrip.openingKm || 0,
          closingKm: existingTrip.closingKm || 0,
          tripKm: existingTrip.tripKm || 0,
          unloadedQuantity: existingTrip.unloadQuantity !== undefined ? existingTrip.unloadQuantity : (existingTrip.quantity !== undefined ? existingTrip.quantity : prev.unloadedQuantity),
          unloadedUnit: (existingTrip.unloadUnit as any) || (existingTrip.unit as any) || prev.unloadedUnit,
          shortage: existingTrip.shortage || 0,
          deliveryProof: existingTrip.deliveryProof || '',
          notes: existingTrip.notes || '',
        }));
        setUserEditedRates(true);
      }
    }
  }, [draftId, trips]);

  // Auto calculate Trip KM whenever openingKm or closingKm changes
  useEffect(() => {
    if (formData.closingKm > 0) {
      const calculated = Math.max(0, formData.closingKm - formData.openingKm);
      setFormData((prev) => ({ ...prev, tripKm: calculated }));
    }
  }, [formData.openingKm, formData.closingKm]);

  // Auto calculate Shortage (derived, no keystroke state tearing)
  const calculatedShortage = useMemo(() => {
    const q = Number(formData.quantity) || 0;
    const uq = Number(formData.unloadedQuantity) || 0;
    if (!formData.isNoLoad && q > 0 && uq >= 0) {
      return Math.max(0, Number((q - uq).toFixed(2)));
    }
    return 0;
  }, [formData.quantity, formData.unloadedQuantity, formData.isNoLoad]);

  // Resolve configured Manager purchase rate strictly based on Crusher + Material combination
  const configuredPurchaseRateInfo = useMemo(() => {
    if (formData.isNoLoad) {
      return { rate: 0, isConfigured: true };
    }
    return findCrusherPurchaseRate(sources, rates, formData.source, formData.material);
  }, [sources, rates, formData.source, formData.material, formData.isNoLoad]);

  const managerPurchaseRate = configuredPurchaseRateInfo?.rate ?? null;
  const isPurchaseRateConfigured = configuredPurchaseRateInfo?.isConfigured ?? false;

  const managerPerKmRate = useMemo(() => {
    const configured = rates.find((r) => r.rateType === 'PER_KM' || r.unit === 'KM');
    return configured ? configured.rate : 28;
  }, [rates]);

  // Keep sourceRate and perKmRate synchronized with Manager portal configuration
  useEffect(() => {
    setFormData((prev) => {
      const nextRate = managerPurchaseRate ?? 0;
      if (prev.sourceRate === nextRate && prev.perKmRate === managerPerKmRate) {
        return prev;
      }
      return {
        ...prev,
        sourceRate: nextRate,
        perKmRate: managerPerKmRate,
      };
    });
  }, [managerPurchaseRate, managerPerKmRate]);

  // Suggest initial billing / transport rates when customer, material, or delivery location changes (if user hasn't edited)
  useEffect(() => {
    if (formData.isNoLoad) {
      setFormData((prev) => ({ ...prev, customerRate: 0, transportRate: 0 }));
      return;
    }
    if (!userEditedRates) {
      const matchingRate = rates.find(
        (r) =>
          r.material === formData.material &&
          (r.loadingLocation === formData.loadingLocation || !r.loadingLocation) &&
          (r.deliveryLocation === formData.deliveryLocation || !r.deliveryLocation)
      );
      if (matchingRate) {
        setFormData((prev) => ({
          ...prev,
          customerRate: matchingRate.rate,
          transportRate: Math.round(matchingRate.rate * 0.4),
        }));
      }
    }
  }, [formData.material, formData.loadingLocation, formData.deliveryLocation, formData.isNoLoad, rates, userEditedRates]);

  // Customer Filtering: Phone (primary), Name, ID, Address
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.filter((c) => c.status === 'ACTIVE');
    return customers.filter(
      (c) =>
        c.status === 'ACTIVE' &&
        (c.phone.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Memoized selected customer object
  const selectedCustomerObj = useMemo(
    () => customers.find((c) => c.id === formData.customerId),
    [customers, formData.customerId]
  );

  // Vehicle Filtering: Registration, ID, Type
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    const eligible = vehicles.filter((v) => v.status !== 'INACTIVE' && v.status !== 'MAINTENANCE');
    if (!q) return eligible;
    return eligible.filter(
      (v) =>
        v.registration.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.ownership.toLowerCase().includes(q)
    );
  }, [vehicles, vehicleSearch]);

  // Driver Filtering: ID, Name, Phone
  const filteredDrivers = useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    const eligible = drivers.filter((d) => d.status !== 'INACTIVE');
    if (!q) return eligible;
    return eligible.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
    );
  }, [drivers, driverSearch]);

  // Handlers for selections
  const handleSelectCustomer = (c: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      customerAddress: c.address,
      customerGstin: c.gstin || '',
      customerCreditTerms: c.creditTerms || 'Standard (30 Days)',
    }));
    setStepErrors([]);
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setFormData((prev) => {
      // If vehicle has an assigned driver and no driver chosen yet, auto-suggest driver
      let autoDriverId = prev.driverId;
      let autoDriverName = prev.driverName;
      let autoDriverPhone = prev.driverPhone;

      if (!autoDriverId && v.assignedDriverId) {
        const d = drivers.find((drv) => drv.id === v.assignedDriverId);
        if (d) {
          autoDriverId = d.id;
          autoDriverName = d.name;
          autoDriverPhone = d.phone;
        }
      }

      return {
        ...prev,
        vehicleRegistration: v.registration,
        vehicleType: v.type,
        vehicleOwnership: v.ownership,
        vehicleCapacity: v.capacity,
        openingKm: v.currentKm,
        closingKm: prev.tripKm > 0 ? v.currentKm + prev.tripKm : v.currentKm,
        driverId: autoDriverId,
        driverName: autoDriverName,
        driverPhone: autoDriverPhone,
      };
    });
    setStepErrors([]);
  };

  const handleSelectDriver = (d: Driver) => {
    setFormData((prev) => ({
      ...prev,
      driverId: d.id,
      driverName: d.name,
      driverPhone: d.phone,
      driverLicense: d.licenseNumber || 'TN-58-DL-VERIFIED',
    }));
    setStepErrors([]);
  };

  // Validation logic per step
  const validateStep = (stepIdx: number): boolean => {
    const errs: string[] = [];

    if (stepIdx === 0) {
      if (!formData.businessDate) errs.push('Business Date is required.');
      if (formData.isNoLoad && !formData.noLoadReason.trim()) {
        errs.push('Please specify an operational reason for the No Load run.');
      }
    } else if (stepIdx === 1) {
      if (!formData.customerId) {
        errs.push('Customer selection is required. Please select or create a customer.');
      }
    } else if (stepIdx === 2) {
      if (!formData.vehicleRegistration) {
        errs.push('Vehicle selection is required. Please select an active vehicle.');
      }
    } else if (stepIdx === 3) {
      if (!formData.driverId) {
        errs.push('Driver selection is required. Please select an authorized driver.');
      }
    } else if (stepIdx === 4) {
      if (formData.isNoLoad) {
        if (!formData.noLoadReason.trim()) {
          errs.push('Please specify an operational reason for the No Load run.');
        }
      } else {
        if (!formData.material) errs.push('Material type is required.');

        // Quantity validation
        const qVal = String(formData.quantity ?? '').trim();
        const qNum = Number(qVal);
        if (!qVal) {
          errs.push('Quantity is required and must be greater than zero.');
        } else if (isNaN(qNum)) {
          errs.push('Quantity must be a valid numeric value.');
        } else if (qNum < 0) {
          errs.push('Quantity cannot be negative.');
        } else if (qNum === 0) {
          errs.push('Quantity must be greater than zero.');
        }

        if (!formData.source) errs.push('Source / Quarry is required.');
        if (!formData.loadingLocation) errs.push('Loading Location is required.');

        // Missing price validation per requirement 11
        if (!formData.isNoLoad && !isPurchaseRateConfigured) {
          errs.push(`Purchase Rate is Not Configured for Crusher "${formData.source}" and Material "${formData.material}". Please select a configured Crusher and Material combination.`);
        }

        // Billing Rate validation (Worker dynamic input)
        const bVal = String(formData.customerRate ?? '').trim();
        const bNum = Number(bVal);
        if (!bVal) {
          errs.push('Billing Rate is required.');
        } else if (isNaN(bNum)) {
          errs.push('Billing Rate must be a valid numeric monetary value.');
        } else if (bNum < 0) {
          errs.push('Billing Rate cannot be negative.');
        }

        // Transport Rate validation (Worker dynamic input)
        const tVal = String(formData.transportRate ?? '').trim();
        const tNum = Number(tVal);
        if (!tVal) {
          errs.push('Transport Rate is required.');
        } else if (isNaN(tNum)) {
          errs.push('Transport Rate must be a valid numeric monetary value.');
        } else if (tNum < 0) {
          errs.push('Transport Rate cannot be negative.');
        }
      }
    } else if (stepIdx === 5) {
      if (!formData.deliveryLocation) errs.push('Delivery Location is required.');
      if (formData.tripKm < 0) {
        errs.push('Trip KM cannot be negative.');
      }
    }

    setStepErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepErrors([]);
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setStepErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const jumpToStep = (idx: number) => {
    setStepErrors([]);
    setCurrentStep(idx);
  };

  // Final Form Submission
  const handleSubmitTrip = async () => {
    if (isSubmitting) return;

    // Validate entire form across all steps
    const allErrors: string[] = [];
    if (!formData.customerId) allErrors.push('Customer is missing.');
    if (!formData.vehicleRegistration) allErrors.push('Vehicle registration is missing.');
    if (!formData.driverId) allErrors.push('Driver is missing.');
    if (!formData.deliveryLocation) allErrors.push('Delivery Location is missing.');
    if (formData.tripKm < 0) {
      allErrors.push('Trip KM cannot be negative.');
    }

    const isNoLoad = formData.isNoLoad;
    const finalQuantity = isNoLoad ? 0 : Number(formData.quantity) || 0;
    const finalBillingRate = isNoLoad ? 0 : Number(formData.customerRate) || 0;
    const finalTransportRate = isNoLoad ? 0 : Number(formData.transportRate) || 0;
    const finalPurchaseRate = isNoLoad ? 0 : Number(managerPurchaseRate) || 0;
    const finalPerKmRate = Number(managerPerKmRate) || 28;
    const finalTotalAmount = isNoLoad ? 0 : finalQuantity * finalBillingRate;
    const parsedUnload = formData.unloadedQuantity !== '' ? Number(formData.unloadedQuantity) : finalQuantity;
    const finalUnloadQuantity = isNoLoad ? 0 : (isNaN(parsedUnload) ? finalQuantity : parsedUnload);
    const finalShortage = isNoLoad ? 0 : Math.max(0, Number((finalQuantity - finalUnloadQuantity).toFixed(2)));

    if (!isNoLoad) {
      const qVal = String(formData.quantity ?? '').trim();
      const qNum = Number(qVal);
      if (!qVal) allErrors.push('Quantity is required.');
      else if (isNaN(qNum) || qNum <= 0) allErrors.push('Quantity must be greater than zero.');

      const bVal = String(formData.customerRate ?? '').trim();
      const bNum = Number(bVal);
      if (!bVal) allErrors.push('Billing Rate is required.');
      else if (isNaN(bNum) || bNum < 0) allErrors.push('Billing Rate must be a valid non-negative rate.');

      const tVal = String(formData.transportRate ?? '').trim();
      const tNum = Number(tVal);
      if (!tVal) allErrors.push('Transport Rate is required.');
      else if (isNaN(tNum) || tNum < 0) allErrors.push('Transport Rate must be a valid non-negative rate.');

      if (!isPurchaseRateConfigured) {
        allErrors.push(`Purchase Rate is Not Configured for Crusher "${formData.source}" and Material "${formData.material}".`);
      }
    }

    if (allErrors.length > 0) {
      setStepErrors(allErrors);
      setIsConfirmOpen(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const newTripRecord: Trip = {
      id: formData.id || newTripId,
      date: formData.businessDate,
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      vehicleRegistration: formData.vehicleRegistration,
      vehicleOwnership: formData.vehicleOwnership,
      driverId: formData.driverId,
      driverName: formData.driverName,
      driverPhone: formData.driverPhone,
      material: isNoLoad ? 'No Load' : formData.material,
      quantity: finalQuantity,
      unit: formData.unit,
      source: formData.source,
      sourceBillNo: formData.sourceBillNo || undefined,
      loadingLocation: formData.loadingLocation,
      deliveryLocation: formData.deliveryLocation,
      loadingDateTime: `${formData.loadingDate}T${formData.loadingTime}:00`,
      deliveryDateTime: `${formData.deliveryDate}T${formData.deliveryTime}:00`,
      unloadQuantity: finalUnloadQuantity,
      unloadUnit: formData.unloadedUnit,
      shortage: finalShortage,
      openingKm: formData.openingKm,
      closingKm: formData.closingKm,
      tripKm: formData.tripKm,
      appliedRate: finalBillingRate,
      billingRate: finalBillingRate,
      transportRate: finalTransportRate,
      purchaseRate: finalPurchaseRate,
      perKmRate: finalPerKmRate,
      rateUnit: formData.unit,
      totalAmount: finalTotalAmount,
      customerTransactionType: formData.customerTransactionType || 'Credit',
      status: isNoLoad ? 'NO_LOAD' : (formData.status === 'DRAFT' ? 'DRAFT' : 'RUNNING'),
      progress: isNoLoad ? 7 : 5,
      isNoLoad: isNoLoad,
      noLoadReason: isNoLoad ? formData.noLoadReason : undefined,
      enteredBy: formData.enteredBy || 'Arun Kumar',
      notes: formData.notes || undefined,
      deliveryProof: formData.deliveryProof || undefined,
    };

    // Check if trip already exists in local store or current state
    const currentStore = readStore();
    const isExisting = currentStore.trips.some((t) => t.id === newTripRecord.id) || trips.some((t) => t.id === newTripRecord.id);

    // 1. Try Backend API Submission
    try {
      const payload = {
        date: formData.businessDate,
        customerId: formData.customerId,
        vehicleRegistration: formData.vehicleRegistration,
        driverId: formData.driverId,
        material: isNoLoad ? 'No Load' : formData.material,
        quantity: finalQuantity,
        unit: formData.unit,
        source: formData.source,
        sourceBillNo: formData.sourceBillNo,
        loadingLocation: formData.loadingLocation,
        deliveryLocation: formData.deliveryLocation,
        loadingDateTime: `${formData.loadingDate}T${formData.loadingTime}:00`,
        deliveryDateTime: `${formData.deliveryDate}T${formData.deliveryTime}:00`,
        unloadQuantity: finalUnloadQuantity,
        unloadUnit: formData.unloadedUnit,
        shortage: finalShortage,
        openingKm: formData.openingKm,
        closingKm: formData.closingKm,
        tripKm: formData.tripKm,
        appliedRate: finalBillingRate,
        billingRate: finalBillingRate,
        transportRate: finalTransportRate,
        purchaseRate: finalPurchaseRate,
        perKmRate: finalPerKmRate,
        rateUnit: formData.unit,
        totalAmount: finalTotalAmount,
        isNoLoad: isNoLoad,
        noLoadReason: isNoLoad ? formData.noLoadReason : null,
        notes: formData.notes,
        deliveryProof: formData.deliveryProof,
      };

      if (isExisting) {
        await apiClient.trips.update(newTripRecord.id, payload);
      } else {
        const apiRes = await apiClient.trips.create(payload);
        const createdData = (apiRes && ((apiRes as any).data || apiRes)) as any;
        if (createdData && createdData.id) {
          newTripRecord.id = createdData.id;
          setFormData((prev) => ({ ...prev, id: createdData.id }));
        }
      }
    } catch (apiErr: any) {
      console.warn('Backend API trip save skipped or returned note:', apiErr?.message);
    }

    // 2. Save into unified local shared state (available across My Trips, Accounts, MD Cockpit)
    try {
      const latestStore = readStore();
      const alreadyExists = isExisting || latestStore.trips.some((t) => t.id === newTripRecord.id);
      if (alreadyExists) {
        updateTrip(newTripRecord);
      } else {
        createTrip(newTripRecord);
      }
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setSubmitError(err.message || 'Failed to record trip dispatch.');
    }
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl border border-[#D9DBD6] p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-[#16425B]">Trip Dispatched Successfully</h2>
          <p className="text-xs text-[#5A6E7F] mt-1">
            Trip <strong>{formData.id}</strong> has been logged to the operational ledger with verified zero financial leakage.
          </p>

          <div className="my-6 p-4 rounded-lg bg-[#f8faf5] border border-[#D9DBD6] text-left text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-[#D9DBD6]">
              <span className="text-[#5A6E7F]">Trip ID:</span>
              <strong className="text-sm font-mono font-bold text-[#2F668F]">{formData.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">Operational Mode:</span>
              <span className="font-semibold text-[#16425B]">
                {formData.isNoLoad ? 'No Load Run' : 'Commercial Freight'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">Customer:</span>
              <span className="font-semibold text-[#16425B]">
                {formData.customerName} ({formData.customerTransactionType || 'Credit'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">Vehicle:</span>
              <span className="font-semibold text-[#16425B]">{formData.vehicleRegistration} ({formData.vehicleOwnership})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">Driver:</span>
              <span className="font-semibold text-[#16425B]">{formData.driverName} ({formData.driverId})</span>
            </div>
            {!formData.isNoLoad && (
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Cargo Dispatched:</span>
                <span className="font-semibold text-[#16425B]">
                  {formData.quantity} {formData.unit} of {formData.material}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">Distance Recorded:</span>
              <span className="font-semibold text-[#16425B]">{formData.tripKm} KM</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#D9DBD6]">
              <span className="text-[#5A6E7F]">Status:</span>
              <StatusBadge status={formData.isNoLoad ? 'NO_LOAD' : 'RUNNING'} />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href={`/worker/trips/${formData.id}`} className="btn-primary">
              View Trip Details
            </Link>
            <Link href="/worker/trips" className="btn-secondary">
              Go to My Trips
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setCurrentStep(0);
                const currentTrips = readStore().trips;
                const nextId = generateNextId('TRP', currentTrips.map((t) => t.id));
                setFormData((prev) => ({
                  ...prev,
                  id: nextId,
                  customerId: '',
                  customerName: '',
                  customerPhone: '',
                  customerAddress: '',
                  vehicleRegistration: '',
                  driverId: '',
                  driverName: '',
                  driverPhone: '',
                  openingKm: 0,
                  closingKm: 0,
                  tripKm: 0,
                }));
              }}
              className="btn-secondary"
            >
              + Create Another Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="New Operational Trip"
        description="6-Step Guided Operational Dispatch Entry · Arun Kumar (Worker Portal)"
      />

      {/* STEP PROGRESSION BAR */}
      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(idx) => idx <= currentStep && jumpToStep(idx)}
      />

      {/* ERROR SUMMARY BANNER */}
      {stepErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <ul className="list-disc pl-4 space-y-0.5">
            {stepErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-6 shadow-sm">
        {/* ========================================================= */}
        {/* STEP 1: TRIP DETAILS                                      */}
        {/* ========================================================= */}
        {currentStep === 0 && (
          <div className="space-y-5">
            <div className="pb-2 border-b border-[#D9DBD6] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 1: Trip Identifiers & Business Date</h2>
                <p className="text-xs text-[#5A6E7F]">
                  System identifiers are protected. Configure date and operational dispatch mode.
                </p>
              </div>
              <StatusBadge status={formData.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trip ID - Read Only */}
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Trip ID <span className="text-[#8898aa] font-normal">(System Generated)</span>
                </label>
                <input
                  type="text"
                  value={formData.id}
                  readOnly
                  disabled
                  className="tms-input font-mono font-bold text-[#2F668F] bg-[#f8faf5] cursor-not-allowed"
                />
                <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                  Unique immutable identifier generated per strict sequence.
                </span>
              </div>

              {/* Business Date - Functional Date Picker */}
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Business Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.businessDate}
                    onChange={(e) => setFormData({ ...formData, businessDate: e.target.value })}
                    required
                    className="tms-input font-medium"
                  />
                </div>
                <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                  Operating ledger date for this dispatch entry.
                </span>
              </div>

              {/* Entry User - Read Only */}
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Entry Operator
                </label>
                <div className="relative">
                  <UserRound size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                  <input
                    type="text"
                    value={formData.enteredBy}
                    readOnly
                    disabled
                    className="tms-input pl-9 bg-[#f8faf5] text-[#16425B] cursor-not-allowed font-medium"
                  />
                </div>
                <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                  Logged in worker identity attached to immutable audit trail.
                </span>
              </div>

              {/* Initial Status - Controlled Selection */}
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Trip Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TripStatus })}
                  className="tms-input"
                >
                  <option value="SUBMITTED">SUBMITTED (Standard Dispatch)</option>
                  <option value="DRAFT">DRAFT (Save for later)</option>
                  <option value="LOADED">LOADED (Cargo onboard)</option>
                  <option value="RUNNING">RUNNING (In Transit)</option>
                  <option value="DELIVERED">DELIVERED (Immediate closure)</option>
                </select>
                <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                  Operational lifecycle status for dispatcher tracking.
                </span>
              </div>

              {/* Operational Mode: Freight vs No Load Run */}
              <div className="sm:col-span-2 pt-2 border-t border-[#f0f2ee]">
                <label className="block text-xs font-bold text-[#16425B] mb-2">
                  Operational Dispatch Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${!formData.isNoLoad
                      ? 'border-[#2F668F] bg-[#e8f1f5]'
                      : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="opMode"
                      checked={!formData.isNoLoad}
                      onChange={() => setFormData({ ...formData, isNoLoad: false, noLoadReason: '' })}
                      className="mt-0.5 text-[#2F668F]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#16425B] block">
                        Commercial Freight Dispatch
                      </span>
                      <p className="text-[11px] text-[#5A6E7F] mt-0.5">
                        Standard commercial trip carrying quarry material. Configured customer rates apply.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${formData.isNoLoad
                      ? 'border-amber-400 bg-amber-50/70'
                      : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="opMode"
                      checked={formData.isNoLoad}
                      onChange={() => setFormData({ ...formData, isNoLoad: true, quantity: 0 })}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        No Load Run (Zero Commercial Cargo)
                      </span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Empty transit, maintenance run, or quarry breakdown. Generates zero billing transactions.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* No Load Reason (if selected) */}
              {formData.isNoLoad && (
                <div className="sm:col-span-2 p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Reason for No Load Run <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.noLoadReason}
                    onChange={(e) => setFormData({ ...formData, noLoadReason: e.target.value })}
                    required
                    className="tms-input bg-white"
                  >
                    <option value="">Select reason from operational master...</option>
                    {NO_LOAD_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CUSTOMER DETAILS                                  */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9DBD6] gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 2: Customer Selection</h2>
                <p className="text-xs text-[#5A6E7F]">
                  Search existing customer by Phone, Name, or ID — or register a new customer master.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="btn-primary shrink-0 self-start sm:self-auto flex items-center gap-1.5"
              >
                <Plus size={14} />
                + Create New Customer
              </button>
            </div>

            {/* SELECTED CUSTOMER PREVIEW CARD */}
            {formData.customerId ? (
              <div className="p-4 bg-[#e8f1f5] border border-[#2F668F] rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#2F668F] uppercase tracking-wider block mb-1">
                      Selected Customer Master
                    </span>
                    <h3 className="text-sm font-bold text-[#16425B]">{formData.customerName}</h3>
                    <p className="text-xs text-[#5A6E7F] mt-1">
                      ID: <strong className="font-mono text-[#16425B]">{formData.customerId}</strong> · Phone:{' '}
                      <strong className="text-[#16425B]">{formData.customerPhone}</strong>
                    </p>
                    <p className="text-xs text-[#5A6E7F]">
                      Address: {formData.customerAddress || 'Tamil Nadu'}
                    </p>
                    {formData.customerGstin && (
                      <p className="text-[11px] font-mono text-[#2F668F] mt-0.5">GSTIN: {formData.customerGstin}</p>
                    )}

                    {/* Customer Transaction Type (Cash or Credit) per Requirement 14 */}
                    <div className="mt-3 pt-3 border-t border-[#2F668F]/20">
                      <span className="text-[11px] font-bold text-[#16425B] block mb-1.5">
                        Customer Transaction Type
                      </span>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#16425B]">
                          <input
                            type="radio"
                            name="customerTransactionType"
                            value="Cash"
                            checked={formData.customerTransactionType === 'Cash'}
                            onChange={() => setFormData((prev) => ({ ...prev, customerTransactionType: 'Cash' }))}
                            className="w-4 h-4 text-[#2F668F]"
                          />
                          <span>Cash</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#16425B]">
                          <input
                            type="radio"
                            name="customerTransactionType"
                            value="Credit"
                            checked={formData.customerTransactionType === 'Credit'}
                            onChange={() => setFormData((prev) => ({ ...prev, customerTransactionType: 'Credit' }))}
                            className="w-4 h-4 text-[#2F668F]"
                          />
                          <span>Credit</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomerEditOpen(true)}
                      className="px-2.5 py-1 text-xs font-semibold rounded border border-[#2F668F] text-[#2F668F] bg-white hover:bg-[#e8f1f5] flex items-center gap-1 shadow-sm"
                    >
                      <Edit size={13} />
                      Edit Customer Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customerId: '', customerName: '', customerPhone: '' })}
                      className="text-xs text-[#5A6E7F] underline hover:text-[#16425B]"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-amber-600" />
                <span>No customer selected yet. Search below or create a new customer.</span>
              </div>
            )}

            {/* LIVE CUSTOMER SEARCH INPUT */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer by 10-digit phone, customer name, or CUS-XXXXX ID..."
                className="tms-input pl-9"
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  className="absolute right-3 top-2.5 text-[#8898aa] hover:text-[#16425B]"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* CUSTOMER SEARCH RESULTS PANEL */}
            <div className="border border-[#D9DBD6] rounded-lg max-h-64 overflow-y-auto divide-y divide-[#D9DBD6]">
              {filteredCustomers.map((c) => {
                const isSelected = formData.customerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${isSelected
                      ? 'bg-[#e8f1f5] border-l-4 border-l-[#2F668F]'
                      : 'hover:bg-[#f8faf5]'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#16425B]">{c.name}</p>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f0f4f8] text-[#2F668F] font-bold">
                          {c.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A6E7F] mt-0.5">
                        Phone: <strong className="text-[#16425B]">{c.phone}</strong> · {c.address}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-semibold rounded shrink-0 transition-colors ${isSelected
                        ? 'bg-[#2F668F] text-white'
                        : 'border border-[#D9DBD6] text-[#16425B] bg-white hover:bg-[#f0f4f8]'
                        }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="p-6 text-center text-xs text-[#5A6E7F] space-y-2">
                  <p className="font-semibold text-amber-800">No matching customer found for "{customerSearch}".</p>
                  <p className="text-[11px] text-[#5A6E7F]">
                    You can register this customer immediately using the button below.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="btn-primary text-xs py-1.5 px-3 mx-auto flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    + Create Customer "{customerSearch}"
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: VEHICLE DETAILS                                   */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9DBD6] gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 3: Vehicle Assignment</h2>
                <p className="text-xs text-[#5A6E7F]">
                  Search and select an active vehicle, or register a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(true)}
                className="btn-primary shrink-0 self-start sm:self-auto flex items-center gap-1.5"
              >
                <Plus size={14} />
                + Add New Vehicle
              </button>
            </div>

            {/* SELECTED VEHICLE HIGHLIGHT */}
            {formData.vehicleRegistration && (
              <div className="p-3.5 bg-[#e8f1f5] border border-[#2F668F] rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#2F668F] uppercase">Assigned Vehicle</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <strong className="text-sm font-bold text-[#16425B]">{formData.vehicleRegistration}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#16425B] border border-[#D9DBD6]">
                      {formData.vehicleOwnership}
                    </span>
                    <span className="text-[#5A6E7F]">· {formData.vehicleType}</span>
                  </div>
                  <p className="text-[11px] text-[#5A6E7F] mt-1">
                    Capacity: <strong>{formData.vehicleCapacity}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, vehicleRegistration: '' })}
                  className="text-xs text-[#2F668F] underline hover:text-[#16425B]"
                >
                  Change
                </button>
              </div>
            )}

            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
              <input
                type="text"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Search registration number, vehicle type (Tipper, Trailer)..."
                className="tms-input pl-9"
              />
              {vehicleSearch && (
                <button
                  type="button"
                  onClick={() => setVehicleSearch('')}
                  className="absolute right-3 top-2.5 text-[#8898aa] hover:text-[#16425B]"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* VEHICLE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
              {filteredVehicles.map((v) => {
                const isSelected = formData.vehicleRegistration === v.registration;
                return (
                  <div
                    key={v.registration}
                    onClick={() => handleSelectVehicle(v)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                      ? 'border-[#2F668F] bg-[#e8f1f5] shadow-sm ring-1 ring-[#2F668F]'
                      : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Truck size={17} className="text-[#2F668F]" />
                        <strong className="text-sm font-bold text-[#16425B]">{v.registration}</strong>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B]">
                        {v.ownership}
                      </span>
                    </div>
                    <div className="text-xs text-[#5A6E7F] mt-2 space-y-0.5">
                      <p>
                        Type: <span className="font-semibold text-[#16425B]">{v.type}</span> · Capacity: {v.capacity}
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredVehicles.length === 0 && (
                <div className="sm:col-span-2 p-8 text-center text-xs text-[#5A6E7F]">
                  <p className="font-semibold text-amber-800">No active vehicles matched your search.</p>
                  <p className="text-[11px] mt-1">Ensure the vehicle is not under maintenance or marked inactive.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: DRIVER DETAILS                                    */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9DBD6] gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 4: Driver Assignment</h2>
                <p className="text-xs text-[#5A6E7F]">
                  Search and assign an authorized driver, or register a new driver.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(true)}
                className="btn-primary shrink-0 self-start sm:self-auto flex items-center gap-1.5"
              >
                <Plus size={14} />
                + Add New Driver
              </button>
            </div>

            {/* SELECTED DRIVER HIGHLIGHT */}
            {formData.driverId && (
              <div className="p-3.5 bg-[#e8f1f5] border border-[#2F668F] rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#2F668F] uppercase">Assigned Driver</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <strong className="text-sm font-bold text-[#16425B]">{formData.driverName}</strong>
                    <span className="text-[10px] font-mono font-bold text-[#2F668F]">{formData.driverId}</span>
                  </div>
                  <p className="text-[11px] text-[#5A6E7F] mt-1">
                    Phone: <strong>{formData.driverPhone}</strong> · License: {formData.driverLicense}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, driverId: '', driverName: '', driverPhone: '' })}
                  className="text-xs text-[#2F668F] underline hover:text-[#16425B]"
                >
                  Change
                </button>
              </div>
            )}

            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search driver by name, phone number, or DRV-XXXX ID..."
                className="tms-input pl-9"
              />
              {driverSearch && (
                <button
                  type="button"
                  onClick={() => setDriverSearch('')}
                  className="absolute right-3 top-2.5 text-[#8898aa] hover:text-[#16425B]"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* DRIVER GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
              {filteredDrivers.map((d) => {
                const isSelected = formData.driverId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDriver(d)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                      ? 'border-[#2F668F] bg-[#e8f1f5] shadow-sm ring-1 ring-[#2F668F]'
                      : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <UserRound size={17} className="text-[#2F668F]" />
                        <strong className="text-sm font-bold text-[#16425B]">{d.name}</strong>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#2F668F]">{d.id}</span>
                    </div>
                    <p className="text-xs text-[#5A6E7F] mt-2">
                      Phone: <strong className="text-[#16425B]">{d.phone}</strong>
                    </p>
                    <p className="text-[11px] text-[#5A6E7F] mt-0.5">
                      License: {d.licenseNumber || 'Verified Commercial Heavy'}
                    </p>
                  </div>
                );
              })}

              {filteredDrivers.length === 0 && (
                <div className="sm:col-span-2 p-8 text-center text-xs text-[#5A6E7F]">
                  <p className="font-semibold text-amber-800">No active drivers matched your search.</p>
                  <p className="text-[11px] mt-1">Please ensure driver is registered and in active status.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: LOAD & SOURCE DETAILS                             */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="pb-2 border-b border-[#D9DBD6] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#16425B]">Step 5: Cargo, Material & Source Details</h2>
                <p className="text-xs text-[#5A6E7F]">
                  Specify loading quarry, material, and quantity. Commercial rates are strictly read-only.
                </p>
              </div>

              {/* NO LOAD RUN CHECKBOX */}
              <label className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNoLoad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isNoLoad: e.target.checked,
                      quantity: e.target.checked ? 0 : 18,
                    })
                  }
                  className="rounded text-[#2F668F]"
                />
                Mark as "No Load" Run
              </label>
            </div>

            {formData.isNoLoad ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Shield size={16} />
                  <span>No Load Trip: Operating Without Commercial Cargo</span>
                </div>
                <p className="text-xs text-amber-800">
                  Vehicle is operating without commercial cargo. No financial receivables will be created in the accounts ledger.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Operational Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.noLoadReason}
                    onChange={(e) => setFormData({ ...formData, noLoadReason: e.target.value })}
                    required
                    className="tms-input bg-white"
                  >
                    <option value="">Select reason...</option>
                    {NO_LOAD_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Material - Select with 'Other' Option */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Material Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={isOtherMaterial ? 'OTHER' : formData.material}
                    onChange={(e) => {
                      if (e.target.value === 'OTHER') {
                        setIsOtherMaterial(true);
                        setFormData({ ...formData, material: customMaterial || 'Other' });
                      } else {
                        setIsOtherMaterial(false);
                        setFormData({ ...formData, material: e.target.value });
                      }
                    }}
                    className="tms-input font-medium"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                    <option value="OTHER">Other (Specify Custom Material)</option>
                  </select>

                  {/* Inline text input for Other material */}
                  {isOtherMaterial && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={customMaterial}
                        onChange={(e) => {
                          setCustomMaterial(e.target.value);
                          setFormData({ ...formData, material: e.target.value });
                        }}
                        placeholder="Enter custom material name directly..."
                        required
                        className="tms-input border-[#2F668F] bg-[#f0f7fb]"
                      />
                      <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
                        Direct custom material entry saved for this trip record.
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity & Unit */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Loaded Quantity & Unit <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.quantity ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormData((prev) => ({
                            ...prev,
                            quantity: '',
                            unloadedQuantity: '',
                          }));
                          return;
                        }
                        const sanitized = val.replace(/[^0-9.]/g, '');
                        const parts = sanitized.split('.');
                        const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
                        setFormData((prev) => ({
                          ...prev,
                          quantity: clean,
                          unloadedQuantity: clean,
                        }));
                      }}
                      required
                      placeholder="e.g. 25 or 25.75"
                      className="tms-input flex-1 min-w-0 font-bold text-[#16425B]"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unit: e.target.value as any,
                          unloadedUnit: e.target.value as any,
                        })
                      }
                      className="tms-input !w-28 sm:!w-32 shrink-0 font-medium"
                      style={{ width: '110px', minWidth: '100px' }}
                    >
                      <option value="Ton">Ton</option>
                      <option value="CFT">CFT</option>
                      <option value="Load">Load</option>
                    </select>
                  </div>
                </div>

                {/* Source / Crusher - Searchable Select */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Source / Quarry Crusher <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={sources}
                    value={formData.source}
                    onChange={(val) => setFormData({ ...formData, source: val })}
                    getOptionValue={(s) => s.name}
                    getOptionLabel={(s) => s.name}
                    getOptionSublabel={(s) => s.location}
                    placeholder="Select quarry source..."
                  />
                </div>

                {/* Source Bill Number */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Source Bill / Weighbridge Slip Number <span className="text-[#8898aa]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sourceBillNo}
                    onChange={(e) => setFormData({ ...formData, sourceBillNo: e.target.value })}
                    placeholder="e.g. VDP-9912 / CRU-4402"
                    className="tms-input"
                  />
                </div>

                {/* Loading Location - Searchable Select */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Loading Location <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={locations}
                    value={formData.loadingLocation}
                    onChange={(val) => setFormData({ ...formData, loadingLocation: val })}
                    getOptionValue={(l) => l.name}
                    getOptionLabel={(l) => l.name}
                    getOptionSublabel={(l) => l.type}
                    placeholder="Select loading yard/quarry..."
                  />
                </div>

                {/* Loading Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Loading Date & Time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={formData.loadingDate}
                      onChange={(e) => setFormData({ ...formData, loadingDate: e.target.value })}
                      required
                      className="tms-input flex-1 min-w-0"
                    />
                    <input
                      type="time"
                      value={formData.loadingTime}
                      onChange={(e) => setFormData({ ...formData, loadingTime: e.target.value })}
                      required
                      className="tms-input !w-28 sm:!w-32 shrink-0"
                      style={{ width: '120px' }}
                    />
                  </div>
                </div>

                {/* RATE CONFIGURATION & DISPATCH INPUT SECTION */}
                <div className="sm:col-span-2 p-4 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield size={14} className="text-[#2F668F]" />
                    <span className="text-xs font-bold text-[#16425B]">
                      Commercial Rates & Valuation Policy
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Billing Rate - Worker Dynamic Input */}
                    <div>
                      <label className="text-[11px] font-bold text-[#16425B] block mb-1">
                        Billing Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5A6E7F] font-bold">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={formData.customerRate ?? ''}
                          onChange={(e) => {
                            setUserEditedRates(true);
                            const val = e.target.value;
                            if (val === '') {
                              setFormData((prev) => ({ ...prev, customerRate: '' }));
                              return;
                            }
                            const sanitized = val.replace(/[^0-9.]/g, '');
                            const parts = sanitized.split('.');
                            const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
                            setFormData((prev) => ({ ...prev, customerRate: clean }));
                          }}
                          required
                          className="tms-input pl-6 font-bold text-[#16425B] bg-white text-xs"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                        Worker Input · ₹/{formData.unit}
                      </span>
                    </div>

                    {/* Transport Rate - Worker Dynamic Input */}
                    <div>
                      <label className="text-[11px] font-bold text-[#16425B] block mb-1">
                        Transport Rate <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5A6E7F] font-bold">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={formData.transportRate ?? ''}
                          onChange={(e) => {
                            setUserEditedRates(true);
                            const val = e.target.value;
                            if (val === '') {
                              setFormData((prev) => ({ ...prev, transportRate: '' }));
                              return;
                            }
                            const sanitized = val.replace(/[^0-9.]/g, '');
                            const parts = sanitized.split('.');
                            const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
                            setFormData((prev) => ({ ...prev, transportRate: clean }));
                          }}
                          required
                          className="tms-input pl-6 font-bold text-[#16425B] bg-white text-xs"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                        Worker Input · ₹/{formData.unit}
                      </span>
                    </div>

                    {/* Purchase Rate - Manager Configured (Read-Only) */}
                    <div>
                      <label className="text-[11px] font-bold text-[#16425B] block mb-1">
                        Purchase Rate:
                      </label>
                      <input
                        type="text"
                        value={
                          formData.isNoLoad
                            ? '₹0 / Ton (No Load)'
                            : isPurchaseRateConfigured && managerPurchaseRate !== null
                              ? `₹${managerPurchaseRate.toLocaleString('en-IN')} / Ton`
                              : 'Not configured'
                        }
                        readOnly
                        disabled
                        className={`tms-input font-bold text-xs cursor-not-allowed ${!formData.isNoLoad && !isPurchaseRateConfigured
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-gray-50 text-[#16425B]'
                          }`}
                      />
                      <span className={`text-[10px] mt-0.5 block ${!formData.isNoLoad && !isPurchaseRateConfigured
                        ? 'text-rose-600 font-bold'
                        : 'text-[#5A6E7F]'
                        }`}>
                        {!formData.isNoLoad && !isPurchaseRateConfigured
                          ? '⚠️ Rate Not Configured for this Crusher + Material'
                          : 'Manager Configured · Price per Ton'}
                      </span>
                    </div>

                    {/* Per-KM Rate - Manager Configured (Read-Only) */}
                    <div>
                      <label className="text-[11px] text-[#5A6E7F] block mb-1">
                        Per-KM Rate:
                      </label>
                      <input
                        type="text"
                        value={`₹${managerPerKmRate} / KM`}
                        readOnly
                        disabled
                        className="tms-input bg-gray-50 text-[#2F668F] font-bold cursor-not-allowed text-xs"
                      />
                      <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
                        Manager Configured (Read-Only)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5A6E7F] mt-2 block">
                    Purchase and Per-KM rates are strictly governed by Manager configuration. Billing and Transport rates are entered by Worker for this trip.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: DELIVERY DETAILS & COMPREHENSIVE REVIEW           */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* SUB-SECTION 1: FUNCTIONAL DELIVERY INPUT FIELDS */}
            <div>
              <div className="pb-2 border-b border-[#D9DBD6]">
                <h2 className="text-sm font-bold text-[#16425B]">Step 6: Delivery Destination & Operational Review</h2>
                <p className="text-xs text-[#5A6E7F]">
                  Enter delivery destination, odometer readings, and review complete manifest before submission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Delivery Location - Searchable Select */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Delivery Destination Site <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={locations}
                    value={formData.deliveryLocation}
                    onChange={(val) => setFormData({ ...formData, deliveryLocation: val })}
                    getOptionValue={(l) => l.name}
                    getOptionLabel={(l) => l.name}
                    getOptionSublabel={(l) => l.type}
                    placeholder="Select delivery site destination..."
                  />
                </div>

                {/* Delivery Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Delivery Date & Time <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      required
                      className="tms-input flex-1 min-w-0"
                    />
                    <input
                      type="time"
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                      required
                      className="tms-input !w-28 sm:!w-32 shrink-0"
                      style={{ width: '120px' }}
                    />
                  </div>
                </div>

                {/* Trip KM / Odometer KM - Optional Single Input */}
                <div className="sm:col-span-2 p-3.5 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#16425B]">
                      Trip Distance (Trip KM / Odometer KM) <span className="text-[#8898aa] font-normal">(Optional)</span>
                    </span>
                    {formData.openingKm > 0 && (
                      <span className="text-[11px] text-[#5A6E7F]">
                        Vehicle Baseline Odometer: <strong>{formData.openingKm.toLocaleString('en-IN')} KM</strong>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5A6E7F] mb-1">
                        Trip KM / Distance Travelled (KM)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tripKm || ''}
                        onChange={(e) => {
                          const km = Math.max(0, Number(e.target.value));
                          setFormData((prev) => ({
                            ...prev,
                            tripKm: km,
                            closingKm: prev.openingKm > 0 && km > 0 ? prev.openingKm + km : prev.closingKm,
                          }));
                        }}
                        placeholder="e.g. 45"
                        className="tms-input font-bold"
                      />
                      <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
                        Enter trip distance in KM. Leave empty if distance will be logged after transit.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5A6E7F] mb-1">
                        Calculated Ending Odometer
                      </label>
                      <input
                        type="text"
                        value={
                          formData.openingKm > 0 && formData.tripKm > 0
                            ? `${(formData.openingKm + formData.tripKm).toLocaleString('en-IN')} KM`
                            : formData.openingKm > 0
                              ? `${formData.openingKm.toLocaleString('en-IN')} KM (Baseline)`
                              : 'No vehicle baseline'
                        }
                        readOnly
                        disabled
                        className="tms-input bg-white font-medium text-[#2F668F] cursor-not-allowed"
                      />
                      <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
                        Calculated from authoritative vehicle odometer baseline.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unloaded Quantity (if not No Load) */}
                {!formData.isNoLoad && (
                  <div>
                    <label className="block text-xs font-bold text-[#16425B] mb-1">
                      Unloaded Quantity at Site
                    </label>
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.unloadedQuantity ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setFormData((prev) => ({ ...prev, unloadedQuantity: '' }));
                            return;
                          }
                          const sanitized = val.replace(/[^0-9.]/g, '');
                          const parts = sanitized.split('.');
                          const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
                          setFormData((prev) => ({ ...prev, unloadedQuantity: clean }));
                        }}
                        placeholder="e.g. 25 or 25.75"
                        className="tms-input flex-1 min-w-0 font-bold text-[#16425B]"
                      />
                      <select
                        value={formData.unloadedUnit}
                        onChange={(e) => setFormData({ ...formData, unloadedUnit: e.target.value as any })}
                        className="tms-input !w-28 sm:!w-32 shrink-0 font-medium"
                        style={{ width: '110px', minWidth: '100px' }}
                      >
                        <option value="Ton">Ton</option>
                        <option value="CFT">CFT</option>
                        <option value="Load">Load</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Delivery Notes */}
                <div className={formData.isNoLoad ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Delivery / Gate Entry Notes <span className="text-[#8898aa]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Site gate #2 entry, received by Site In-charge"
                    className="tms-input"
                  />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: COMPREHENSIVE REVIEW SUMMARY OF ALL 6 STEPS */}
            <div className="pt-4 border-t border-[#D9DBD6]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#16425B] uppercase tracking-wider">
                  Review All 6 Sections Before Final Submission
                </h3>
                <span className="text-[11px] text-[#5A6E7F]">
                  Click <strong>Edit</strong> on any section to revise fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Trip Details Summary Card */}
                <div className="p-3.5 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-1.5">
                  <div className="flex justify-between items-center pb-1 border-b border-[#D9DBD6]">
                    <span className="font-bold text-[#16425B]">1. Trip Details</span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(0)}
                      className="text-[#2F668F] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Trip ID:</span>
                    <strong className="font-mono text-[#2F668F]">{formData.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Business Date:</span>
                    <span>{formData.businessDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Entry Operator:</span>
                    <span>{formData.enteredBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Mode:</span>
                    <span className="font-semibold text-[#16425B]">
                      {formData.isNoLoad ? 'No Load Run' : 'Commercial Freight'}
                    </span>
                  </div>
                </div>

                {/* 2. Customer Summary Card */}
                <div className="p-3.5 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-1.5">
                  <div className="flex justify-between items-center pb-1 border-b border-[#D9DBD6]">
                    <span className="font-bold text-[#16425B]">2. Customer Details</span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(1)}
                      className="text-[#2F668F] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Name:</span>
                    <strong className="text-[#16425B]">{formData.customerName || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Transaction Type:</span>
                    <span className="font-semibold text-[#2F668F]">
                      {formData.customerTransactionType || 'Credit'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Customer ID:</span>
                    <span className="font-mono text-[#2F668F]">{formData.customerId || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Phone:</span>
                    <span>{formData.customerPhone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Payment Type:</span>
                    <span className="font-semibold text-[#16425B]">{formData.customerTransactionType || 'Cash'}</span>
                  </div>
                </div>

                {/* 3. Vehicle Summary Card */}
                <div className="p-3.5 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-1.5">
                  <div className="flex justify-between items-center pb-1 border-b border-[#D9DBD6]">
                    <span className="font-bold text-[#16425B]">3. Vehicle Details</span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(2)}
                      className="text-[#2F668F] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Registration:</span>
                    <strong className="text-[#16425B]">{formData.vehicleRegistration || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Type & Ownership:</span>
                    <span>
                      {formData.vehicleType || 'Tipper'} ({formData.vehicleOwnership})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Capacity:</span>
                    <span>{formData.vehicleCapacity || '18 Ton'}</span>
                  </div>
                </div>

                {/* 4. Driver Summary Card */}
                <div className="p-3.5 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-1.5">
                  <div className="flex justify-between items-center pb-1 border-b border-[#D9DBD6]">
                    <span className="font-bold text-[#16425B]">4. Driver Details</span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(3)}
                      className="text-[#2F668F] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Name:</span>
                    <strong className="text-[#16425B]">{formData.driverName || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Driver ID:</span>
                    <span className="font-mono text-[#2F668F]">{formData.driverId || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6E7F]">Phone:</span>
                    <span>{formData.driverPhone || '—'}</span>
                  </div>
                </div>

                {/* 5. Load & Source Summary Card */}
                <div className="p-3.5 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center pb-1 border-b border-[#D9DBD6]">
                    <span className="font-bold text-[#16425B]">5. Load & Source Details</span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(4)}
                      className="text-[#2F668F] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[#5A6E7F] block">Cargo:</span>
                      <strong>{formData.isNoLoad ? 'No Load' : formData.material}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Loaded Qty:</span>
                      <strong>{formData.isNoLoad ? '0' : `${formData.quantity} ${formData.unit}`}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Source / Quarry:</span>
                      <span>{formData.source}</span>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Loading Location:</span>
                      <span>{formData.loadingLocation}</span>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Billing Rate:</span>
                      <strong className="text-[#16425B]">₹{formData.customerRate} / {formData.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Transport Rate:</span>
                      <strong className="text-[#16425B]">₹{formData.transportRate} / {formData.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Purchase Rate:</span>
                      <span className={!formData.isNoLoad && !isPurchaseRateConfigured ? 'text-rose-600 font-bold' : 'text-[#16425B] font-semibold'}>
                        {formData.isNoLoad
                          ? '₹0 / Ton'
                          : isPurchaseRateConfigured && managerPurchaseRate !== null
                            ? `₹${managerPurchaseRate.toLocaleString('en-IN')} / ${formData.unit}`
                            : 'Not configured'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Per-KM Rate:</span>
                      <span className="text-[#2F668F] font-semibold">₹{managerPerKmRate} / KM</span>
                    </div>
                  </div>
                  {formData.isNoLoad && (
                    <p className="text-[11px] font-semibold text-amber-800 mt-1">
                      Reason: {formData.noLoadReason}
                    </p>
                  )}
                </div>

                {/* 6. Delivery Summary Card */}
                <div className="p-3.5 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] space-y-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center pb-1 border-b border-[#D9DBD6]">
                    <span className="font-bold text-[#16425B]">6. Delivery Details</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Active Step</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[#5A6E7F] block">Delivery Point:</span>
                      <strong>{formData.deliveryLocation}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Unloaded Qty:</span>
                      <strong>{formData.isNoLoad ? '0' : formData.unloadedQuantity ? `${formData.unloadedQuantity} ${formData.unloadedUnit || formData.unit}` : `${formData.quantity || 0} ${formData.unit}`}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Trip Distance:</span>
                      <strong className="text-[#2F668F]">{formData.tripKm ? `${formData.tripKm} KM` : 'Not logged'}</strong>
                    </div>
                    <div>
                      <span className="text-[#5A6E7F] block">Notes:</span>
                      <span>{formData.notes || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* WIZARD ACTIONS FOOTER (BACK / CONTINUE / SUBMIT)          */}
        {/* ========================================================= */}
        <div className="mt-8 pt-4 border-t border-[#D9DBD6] flex justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="btn-secondary disabled:opacity-50"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5A6E7F] hidden sm:inline">
              Step {currentStep + 1} of {STEPS.length}
            </span>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex items-center gap-1.5"
              >
                Continue to {STEPS[currentStep + 1]}
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(5)) {
                    setIsConfirmOpen(true);
                  }
                }}
                disabled={isSubmitting}
                className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {isSubmitting ? 'Recording Dispatch...' : 'Confirm & Submit Trip'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Operational Trip Dispatch"
        message={`Are you ready to submit Trip Details ${formData.id} for Customer "${formData.customerName}" with Vehicle "${formData.vehicleRegistration}"? Once submitted, core dispatch records will be locked.`}
        confirmLabel="Submit Dispatch"
        isLoading={isSubmitting}
        onCancel={() => {
          if (!isSubmitting) setIsConfirmOpen(false);
        }}
        onConfirm={handleSubmitTrip}
      />

      {/* CREATE NEW CUSTOMER MODAL */}
      <CustomerCreateModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={(newCust) => {
          handleSelectCustomer(newCust);
          setCustomerSearch(newCust.name);
        }}
        prefillPhone={customerSearch.replace(/\D/g, '')}
        prefillName={isNaN(Number(customerSearch)) ? customerSearch : ''}
      />

      {/* CUSTOMER EDIT REQUEST MODAL */}
      {selectedCustomerObj && (
        <CustomerEditRequestModal
          isOpen={isCustomerEditOpen}
          onClose={() => setIsCustomerEditOpen(false)}
          customer={selectedCustomerObj}
        />
      )}

      {/* ADD NEW VEHICLE MODAL */}
      <VehicleCreateModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onVehicleCreated={(newVehicle) => {
          handleSelectVehicle(newVehicle);
          setVehicleSearch(newVehicle.registration);
        }}
      />

      {/* ADD NEW DRIVER MODAL */}
      <DriverCreateModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onDriverCreated={(newDriver) => {
          handleSelectDriver(newDriver);
          setDriverSearch(newDriver.name);
        }}
      />
    </div>
  );
}
