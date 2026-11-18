import React, { useState } from 'react';
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  FileText,
  Luggage,
  Clock,
  BarChart3
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  formatCurrencyPKR,
  formatDateTime,
  downloadExcelManifest,
  downloadWordManifest,
  downloadSegmentSlabReportExcel
} from '../utils/exporters';

const INITIAL_SEGMENT_FORM = {
  FlightNumber: '',
  MarketingAirline: '',
  OperatingAirline: '',
  OperatingAirlineName: 'Taban Airlines',
  DepartureIata: 'KHI',
  DepartureAirport: 'Jinnah Intl Airport',
  DepartureCity: 'Karachi',
  DepartureCountry: 'Pakistan',
  DepartureDate: '',
  ArrivalIata: 'IKA',
  ArrivalAirport: 'Imam Khomeini Intl Airport',
  ArrivalCity: 'Tehran',
  ArrivalCountry: 'Iran',
  ArrivalDate: '',
  TotalSeats: 120,
  PnrExpiryHours: 24,
  Tier1Seats: 25,
  Tier1AdultPrice: 0,
  Tier1ChildPrice: 0,
  Tier1InfantPrice: 0,
  Tier1ReturnAdultPrice: 0,
  Tier1ReturnChildPrice: 0,
  Tier1ReturnInfantPrice: 0,
  Tier2Seats: 25,
  Tier2AdultPrice: 0,
  Tier2ChildPrice: 0,
  Tier2InfantPrice: 0,
  Tier2ReturnAdultPrice: 0,
  Tier2ReturnChildPrice: 0,
  Tier2ReturnInfantPrice: 0,
  Tier3Seats: 25,
  Tier3AdultPrice: 0,
  Tier3ChildPrice: 0,
  Tier3InfantPrice: 0,
  Tier3ReturnAdultPrice: 0,
  Tier3ReturnChildPrice: 0,
  Tier3ReturnInfantPrice: 0,
  Tier4Seats: 25,
  Tier4AdultPrice: 0,
  Tier4ChildPrice: 0,
  Tier4InfantPrice: 0,
  Tier4ReturnAdultPrice: 0,
  Tier4ReturnChildPrice: 0,
  Tier4ReturnInfantPrice: 0,
  Tier5Seats: 20,
  Tier5AdultPrice: 0,
  Tier5ChildPrice: 0,
  Tier5InfantPrice: 0,
  Tier5ReturnAdultPrice: 0,
  Tier5ReturnChildPrice: 0,
  Tier5ReturnInfantPrice: 0,
  FlightClass: 'Economy',
  FlightClassCode: 'Y',
  FlightTime: '02h 30m',
  FlightMinutes: 150,
  LayoverDuration: 0,
  AirCraft: 'A320',
  Meal: 'Yes',
  BaggageADT: '20',
  BaggageCNN: '20',
  BaggageINF: '0',
  BaggageTypeADT: 'KG',
  BaggageCountADT: '20',
  BaggageTypeCNN: 'KG',
  BaggageCountCNN: '20',
  BaggageTypeINF: 'KG',
  BaggageCountINF: '0',
  AdultPrice: 0,
  AdultBasicFare: 0,
  AdultTax: 0,
  ChildPrice: 0,
  ChildBasicFare: 0,
  ChildTax: 0,
  InfantPrice: 0,
  InfantBasicFare: 0,
  InfantTax: 0,
  ReturnAdultPrice: 0,
  ReturnChildPrice: 0,
  ReturnInfantPrice: 0,
  AdultPriceSupplier: 0,
  AdultBasicFareSupplier: 0,
  AdultTaxSupplier: 0,
  ChildPriceSupplier: 0,
  ChildBasicFareSupplier: 0,
  ChildTaxSupplier: 0,
  InfantPriceSupplier: 0,
  InfantBasicFareSupplier: 0,
  InfantTaxSupplier: 0
};

export default function SegmentManagement() {
  const {
    segments,
    flights,
    bookings,
    airports,
    createSegment,
    updateSegment,
    deleteSegment,
    addToast
  } = usePortal();

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_SEGMENT_FORM);
  const [detailsSegment, setDetailsSegment] = useState(null);
  const [slabReportSegment, setSlabReportSegment] = useState(null);
  const [slabReportFilter, setSlabReportFilter] = useState('ALL_ACTIVE');

  // Build CFO 5-Slab Sector Sales & Revenue Breakdown for a Segment
  const buildSegmentSlabReport = (seg, filterMode = 'ALL_ACTIVE') => {
    if (!seg) return { slabSummaries: [], rows: [], totalSeatedSold: 0, totalInfants: 0, grandTotalRevenue: 0 };

    const groupIds = flights
      .filter((f) => (f.SegmentIDs || []).includes(seg.AirGroupSegmentID))
      .map((f) => f.AirGroupID);

    const activeBookings = bookings.filter((b) => {
      if (
        b.ApprovalStatus === 'Rejected' ||
        b.ApprovalStatus === 'Ticket Void' ||
        b.ApprovalStatus === 'Cancelled'
      ) {
        return false;
      }
      if (filterMode === 'ISSUED_ONLY' && b.ApprovalStatus !== 'Ticket Issued') {
        return false;
      }
      if (Array.isArray(b.SegmentIDs) && b.SegmentIDs.includes(seg.AirGroupSegmentID)) return true;
      if (b.AirGroupSegmentID === seg.AirGroupSegmentID) return true;
      if (groupIds.includes(b.AirGroupID)) return true;
      return false;
    });

    // Sort oldest to newest so seats fill Slab 1 -> Slab 5 in exact booking sequence
    const chronological = [...activeBookings].reverse();

    const tierCaps = [
      Number(seg.Tier1Seats) || 0,
      Number(seg.Tier2Seats) || 0,
      Number(seg.Tier3Seats) || 0,
      Number(seg.Tier4Seats) || 0,
      Number(seg.Tier5Seats) || 0
    ];
    const hasTiers = tierCaps.reduce((a, b) => a + b, 0) > 0;

    const getTierFares = (tierNum, isRoundTrip) => {
      if (!hasTiers) {
        const adt =
          isRoundTrip && Number(seg.ReturnAdultPrice) > 0
            ? Number(seg.ReturnAdultPrice)
            : Number(seg.AdultPrice) || 0;
        const cnn =
          isRoundTrip && Number(seg.ReturnChildPrice) > 0
            ? Number(seg.ReturnChildPrice)
            : Number(seg.ChildPrice) || 0;
        const inf =
          isRoundTrip && Number(seg.ReturnInfantPrice) > 0
            ? Number(seg.ReturnInfantPrice)
            : Number(seg.InfantPrice) || 0;
        return { adt, cnn, inf };
      }
      const pfx = `Tier${tierNum}`;
      const oneWayAdt = Number(seg[`${pfx}AdultPrice`] ?? seg.AdultPrice) || 0;
      const oneWayCnn = Number(seg[`${pfx}ChildPrice`] ?? seg.ChildPrice) || 0;
      const oneWayInf = Number(seg[`${pfx}InfantPrice`] ?? seg.InfantPrice) || 0;
      const retAdt = Number(seg[`${pfx}ReturnAdultPrice`] ?? seg.ReturnAdultPrice) || 0;
      const retCnn = Number(seg[`${pfx}ReturnChildPrice`] ?? seg.ReturnChildPrice) || 0;
      const retInf = Number(seg[`${pfx}ReturnInfantPrice`] ?? seg.ReturnInfantPrice) || 0;
      return {
        adt: isRoundTrip && retAdt > 0 ? retAdt : oneWayAdt,
        cnn: isRoundTrip && retCnn > 0 ? retCnn : oneWayCnn,
        inf: isRoundTrip && retInf > 0 ? retInf : oneWayInf
      };
    };

    const getTierForSeatIndex = (seatIdx) => {
      if (!hasTiers) return 1;
      let cum = 0;
      for (let k = 0; k < 5; k++) {
        cum += tierCaps[k];
        if (tierCaps[k] > 0 && seatIdx < cum) return k + 1;
      }
      for (let k = 4; k >= 0; k--) {
        if (tierCaps[k] > 0) return k + 1;
      }
      return 1;
    };

    const slabStats = [1, 2, 3, 4, 5].map((tierNum) => {
      const pfx = `Tier${tierNum}`;
      return {
        tier: tierNum,
        allocated: hasTiers ? tierCaps[tierNum - 1] : tierNum === 1 ? Number(seg.TotalSeats) || 0 : 0,
        soldSeats: 0,
        infants: 0,
        oneWayAdultRate: Number(seg[`${pfx}AdultPrice`] ?? seg.AdultPrice) || 0,
        returnAdultRate: Number(seg[`${pfx}ReturnAdultPrice`] ?? seg.ReturnAdultPrice) || 0,
        revenue: 0
      };
    });

    const rows = [];
    let seatCursor = 0;

    chronological.forEach((b) => {
      const adt = Number(b.AdultCount) || 0;
      const cnn = Number(b.ChildCount) || 0;
      const inf = Number(b.InfantCount) || 0;
      const isRT = b.TripType === 'Round Trip';
      const bookedByName =
        b.SubCompanyID && b.SubCompanyID !== 'DIRECT'
          ? `${b.SubCompanyName || b.SubCompanyID}${b.BookedByLoginID ? ` (@${b.BookedByLoginID})` : ''}`
          : `Admin (${b.BookedByLoginID || 'admin'})`;

      const startTier = getTierForSeatIndex(seatCursor);
      const tierBuckets = {};

      const addSeatToBucket = (tier, fare) => {
        if (!tierBuckets[tier]) {
          tierBuckets[tier] = { tier, seatedPax: 0, unitFareSum: 0, subtotal: 0, infants: 0 };
        }
        tierBuckets[tier].seatedPax += 1;
        tierBuckets[tier].unitFareSum += fare;
        tierBuckets[tier].subtotal += fare;
        slabStats[tier - 1].soldSeats += 1;
        slabStats[tier - 1].revenue += fare;
      };

      for (let i = 0; i < adt; i++) {
        const t = getTierForSeatIndex(seatCursor);
        addSeatToBucket(t, getTierFares(t, isRT).adt);
        seatCursor += 1;
      }
      for (let i = 0; i < cnn; i++) {
        const t = getTierForSeatIndex(seatCursor);
        addSeatToBucket(t, getTierFares(t, isRT).cnn);
        seatCursor += 1;
      }

      if (inf > 0) {
        const infFare = getTierFares(startTier, isRT).inf * inf;
        if (!tierBuckets[startTier]) {
          tierBuckets[startTier] = { tier: startTier, seatedPax: 0, unitFareSum: 0, subtotal: 0, infants: 0 };
        }
        tierBuckets[startTier].infants += inf;
        tierBuckets[startTier].subtotal += infFare;
        slabStats[startTier - 1].infants += inf;
        slabStats[startTier - 1].revenue += infFare;
      }

      Object.values(tierBuckets).forEach((bucket) => {
        const unitFare =
          bucket.seatedPax > 0 ? Math.round(bucket.unitFareSum / bucket.seatedPax) : 0;
        const paxLabel =
          bucket.infants > 0
            ? `${bucket.seatedPax} Pax + ${bucket.infants} Inf`
            : `${bucket.seatedPax} Pax`;
        rows.push({
          bookingId: b.AirGroupBookingID,
          date: b.TimeStamp || '',
          pnr: b.PNR || '',
          bookedByName,
          status: b.ApprovalStatus,
          tripType: b.TripType || 'One Way',
          tier: bucket.tier,
          unitFare,
          seatedPax: bucket.seatedPax,
          infants: bucket.infants,
          paxLabel,
          totalAmount: bucket.subtotal
        });
      });
    });

    const slabSummaries = slabStats.map((s) => ({
      ...s,
      leftSeats: Math.max(0, s.allocated - s.soldSeats)
    }));

    const totalSeatedSold = slabSummaries.reduce((acc, s) => acc + s.soldSeats, 0);
    const totalInfants = slabSummaries.reduce((acc, s) => acc + s.infants, 0);
    const grandTotalRevenue = slabSummaries.reduce((acc, s) => acc + s.revenue, 0);

    return {
      slabSummaries,
      rows,
      totalSeatedSold,
      totalInfants,
      grandTotalRevenue
    };
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_SEGMENT_FORM);
    setShowEditor(true);
  };

  const openEditModal = (seg) => {
    const hasTiers =
      (Number(seg.Tier1Seats) || 0) +
        (Number(seg.Tier2Seats) || 0) +
        (Number(seg.Tier3Seats) || 0) +
        (Number(seg.Tier4Seats) || 0) +
        (Number(seg.Tier5Seats) || 0) >
      0;
    const tot = Number(seg.TotalSeats) || 120;
    const baseChunk = Math.floor(tot / 5);
    const defT1 = hasTiers ? Number(seg.Tier1Seats) || 0 : baseChunk;
    const defT2 = hasTiers ? Number(seg.Tier2Seats) || 0 : baseChunk;
    const defT3 = hasTiers ? Number(seg.Tier3Seats) || 0 : baseChunk;
    const defT4 = hasTiers ? Number(seg.Tier4Seats) || 0 : baseChunk;
    const defT5 = hasTiers
      ? Number(seg.Tier5Seats) || 0
      : Math.max(0, tot - defT1 - defT2 - defT3 - defT4);

    setEditingId(seg.AirGroupSegmentID);
    setForm({
      ...INITIAL_SEGMENT_FORM,
      ...seg,
      TotalSeats: tot,
      PnrExpiryHours: seg.PnrExpiryHours !== undefined ? Number(seg.PnrExpiryHours) : 0,
      Tier1Seats: defT1,
      Tier1AdultPrice: seg.Tier1AdultPrice ?? seg.AdultPrice ?? 0,
      Tier1ChildPrice: seg.Tier1ChildPrice ?? seg.ChildPrice ?? 0,
      Tier1InfantPrice: seg.Tier1InfantPrice ?? seg.InfantPrice ?? 0,
      Tier1ReturnAdultPrice: seg.Tier1ReturnAdultPrice ?? seg.ReturnAdultPrice ?? 0,
      Tier1ReturnChildPrice: seg.Tier1ReturnChildPrice ?? seg.ReturnChildPrice ?? 0,
      Tier1ReturnInfantPrice: seg.Tier1ReturnInfantPrice ?? seg.ReturnInfantPrice ?? 0,
      Tier2Seats: defT2,
      Tier2AdultPrice: seg.Tier2AdultPrice ?? seg.AdultPrice ?? 0,
      Tier2ChildPrice: seg.Tier2ChildPrice ?? seg.ChildPrice ?? 0,
      Tier2InfantPrice: seg.Tier2InfantPrice ?? seg.InfantPrice ?? 0,
      Tier2ReturnAdultPrice: seg.Tier2ReturnAdultPrice ?? seg.ReturnAdultPrice ?? 0,
      Tier2ReturnChildPrice: seg.Tier2ReturnChildPrice ?? seg.ReturnChildPrice ?? 0,
      Tier2ReturnInfantPrice: seg.Tier2ReturnInfantPrice ?? seg.ReturnInfantPrice ?? 0,
      Tier3Seats: defT3,
      Tier3AdultPrice: seg.Tier3AdultPrice ?? seg.AdultPrice ?? 0,
      Tier3ChildPrice: seg.Tier3ChildPrice ?? seg.ChildPrice ?? 0,
      Tier3InfantPrice: seg.Tier3InfantPrice ?? seg.InfantPrice ?? 0,
      Tier3ReturnAdultPrice: seg.Tier3ReturnAdultPrice ?? seg.ReturnAdultPrice ?? 0,
      Tier3ReturnChildPrice: seg.Tier3ReturnChildPrice ?? seg.ReturnChildPrice ?? 0,
      Tier3ReturnInfantPrice: seg.Tier3ReturnInfantPrice ?? seg.ReturnInfantPrice ?? 0,
      Tier4Seats: defT4,
      Tier4AdultPrice: seg.Tier4AdultPrice ?? seg.Tier3AdultPrice ?? seg.AdultPrice ?? 0,
      Tier4ChildPrice: seg.Tier4ChildPrice ?? seg.Tier3ChildPrice ?? seg.ChildPrice ?? 0,
      Tier4InfantPrice: seg.Tier4InfantPrice ?? seg.Tier3InfantPrice ?? seg.InfantPrice ?? 0,
      Tier4ReturnAdultPrice: seg.Tier4ReturnAdultPrice ?? seg.Tier3ReturnAdultPrice ?? seg.ReturnAdultPrice ?? 0,
      Tier4ReturnChildPrice: seg.Tier4ReturnChildPrice ?? seg.Tier3ReturnChildPrice ?? seg.ReturnChildPrice ?? 0,
      Tier4ReturnInfantPrice: seg.Tier4ReturnInfantPrice ?? seg.Tier3ReturnInfantPrice ?? seg.ReturnInfantPrice ?? 0,
      Tier5Seats: defT5,
      Tier5AdultPrice: seg.Tier5AdultPrice ?? seg.Tier4AdultPrice ?? seg.Tier3AdultPrice ?? seg.AdultPrice ?? 0,
      Tier5ChildPrice: seg.Tier5ChildPrice ?? seg.Tier4ChildPrice ?? seg.Tier3ChildPrice ?? seg.ChildPrice ?? 0,
      Tier5InfantPrice: seg.Tier5InfantPrice ?? seg.Tier4InfantPrice ?? seg.Tier3InfantPrice ?? seg.InfantPrice ?? 0,
      Tier5ReturnAdultPrice: seg.Tier5ReturnAdultPrice ?? seg.Tier4ReturnAdultPrice ?? seg.Tier3ReturnAdultPrice ?? seg.ReturnAdultPrice ?? 0,
      Tier5ReturnChildPrice: seg.Tier5ReturnChildPrice ?? seg.Tier4ReturnChildPrice ?? seg.Tier3ReturnChildPrice ?? seg.ReturnChildPrice ?? 0,
      Tier5ReturnInfantPrice: seg.Tier5ReturnInfantPrice ?? seg.Tier4ReturnInfantPrice ?? seg.Tier3ReturnInfantPrice ?? seg.ReturnInfantPrice ?? 0,
      BaggageADT: seg.BaggageADT ?? seg.BaggageCountADT ?? '20',
      BaggageCNN: seg.BaggageCNN ?? seg.BaggageCountCNN ?? '20',
      BaggageINF: seg.BaggageINF ?? seg.BaggageCountINF ?? '0',
      ReturnAdultPrice: seg.ReturnAdultPrice ?? 0,
      ReturnChildPrice: seg.ReturnChildPrice ?? 0,
      ReturnInfantPrice: seg.ReturnInfantPrice ?? 0
    });
    setShowEditor(true);
  };

  const handleAirportSelect = (prefix, code) => {
    const found = airports.find((a) => a.AirportCode === code);
    if (!found) return;
    if (prefix === 'Departure') {
      setForm((prev) => ({
        ...prev,
        DepartureIata: found.AirportCode,
        DepartureAirport: found.AirportName,
        DepartureCity: found.CityName,
        DepartureCountry: found.CountryName
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        ArrivalIata: found.AirportCode,
        ArrivalAirport: found.AirportName,
        ArrivalCity: found.CityName,
        ArrivalCountry: found.CountryName
      }));
    }
  };

  const handleTotalSeatsChange = (val) => {
    const tot = Math.max(0, Number(val) || 0);
    const t1 = Number(form.Tier1Seats) || 0;
    const t2 = Number(form.Tier2Seats) || 0;
    const t3 = Number(form.Tier3Seats) || 0;
    const t4 = Number(form.Tier4Seats) || 0;
    const rem = Math.max(0, tot - t1 - t2 - t3 - t4);
    setForm((prev) => ({
      ...prev,
      TotalSeats: tot,
      Tier5Seats: rem
    }));
  };

  const handleTierSeatsChange = (tierNum, val) => {
    const numVal = Math.max(0, Number(val) || 0);
    setForm((prev) => {
      const next = { ...prev, [`Tier${tierNum}Seats`]: numVal };
      const t1 = Number(next.Tier1Seats) || 0;
      const t2 = Number(next.Tier2Seats) || 0;
      const t3 = Number(next.Tier3Seats) || 0;
      const t4 = Number(next.Tier4Seats) || 0;
      const t5 = Number(next.Tier5Seats) || 0;
      if (tierNum < 5) {
        const tot = Number(prev.TotalSeats) || 0;
        const rem = Math.max(0, tot - t1 - t2 - t3 - t4);
        next.Tier5Seats = rem;
        next.TotalSeats = Math.max(tot, t1 + t2 + t3 + t4 + rem);
      } else {
        next.TotalSeats = t1 + t2 + t3 + t4 + t5;
      }
      return next;
    });
  };

  const handleSaveSegment = async (e) => {
    e.preventDefault();
    const fn = form.FlightNumber.trim();
    if (!fn) {
      addToast('Please enter Flight Number (e.g. HH 7212).', 'error');
      return;
    }

    // Extract carrier prefix from FlightNumber if OperatingAirline not explicitly entered
    const extractedPrefix = fn.split(/[\s-]+/)[0] || '';
    const airlineCode = (form.OperatingAirline || extractedPrefix).trim().toUpperCase();

    const t1 = Math.max(0, Number(form.Tier1Seats) || 0);
    const t2 = Math.max(0, Number(form.Tier2Seats) || 0);
    const t3 = Math.max(0, Number(form.Tier3Seats) || 0);
    const t4 = Math.max(0, Number(form.Tier4Seats) || 0);
    const t5 = Math.max(0, Number(form.Tier5Seats) || 0);
    const sumSlabs = t1 + t2 + t3 + t4 + t5;
    const totalSeats = sumSlabs > 0 ? sumSlabs : Number(form.TotalSeats) || 120;

    const payload = {
      ...form,
      FlightNumber: fn,
      OperatingAirline: airlineCode,
      MarketingAirline: form.MarketingAirline || airlineCode,
      TotalSeats: totalSeats,
      PnrExpiryHours: Math.max(0, Number(form.PnrExpiryHours) || 0),
      Tier1Seats: t1,
      Tier2Seats: t2,
      Tier3Seats: t3,
      Tier4Seats: t4,
      Tier5Seats: t5,
      AdultPrice: Number(form.Tier1AdultPrice || form.AdultPrice) || 0,
      ChildPrice: Number(form.Tier1ChildPrice || form.ChildPrice) || 0,
      InfantPrice: Number(form.Tier1InfantPrice || form.InfantPrice) || 0,
      ReturnAdultPrice: Number(form.Tier1ReturnAdultPrice || form.ReturnAdultPrice) || 0,
      ReturnChildPrice: Number(form.Tier1ReturnChildPrice || form.ReturnChildPrice) || 0,
      ReturnInfantPrice: Number(form.Tier1ReturnInfantPrice || form.ReturnInfantPrice) || 0,
      BaggageADT: String(form.BaggageADT ?? '20'),
      BaggageCNN: String(form.BaggageCNN ?? '20'),
      BaggageINF: String(form.BaggageINF ?? '0'),
      BaggageCountADT: String(form.BaggageADT ?? '20'),
      BaggageCountCNN: String(form.BaggageCNN ?? '20'),
      BaggageCountINF: String(form.BaggageINF ?? '0')
    };

    try {
      if (editingId) {
        await updateSegment(editingId, payload);
      } else {
        await createSegment(payload);
      }
      setShowEditor(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Only reflect TICKET ISSUED bookings in Excel & Word manifests
  const getPassengersForSegment = (seg) => {
    if (!seg) return [];
    const groupIds = flights
      .filter((f) => (f.SegmentIDs || []).includes(seg.AirGroupSegmentID))
      .map((f) => f.AirGroupID);

    const relevantBookings = bookings.filter((b) => {
      if (b.ApprovalStatus !== 'Ticket Issued') return false;
      if (Array.isArray(b.SegmentIDs) && b.SegmentIDs.includes(seg.AirGroupSegmentID)) return true;
      if (b.AirGroupSegmentID === seg.AirGroupSegmentID) return true;
      if (groupIds.includes(b.AirGroupID)) return true;
      return false;
    });

    const paxList = [];
    relevantBookings.forEach((b) => {
      (b.Passengers || []).forEach((p) => {
        paxList.push({
          ...p,
          PNR: b.PNR,
          MobileNumber: b.MobileNumber,
          EmailAddress: b.EmailAddress,
          BookingStatus: b.ApprovalStatus
        });
      });
    });
    return paxList;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1B3664]">
            Route Schedule, Seat Allocation & Manifest Exports
          </span>
          <h1 className="font-display font-semibold text-xl text-slate-900 mt-0.5">
            Routes & Seat Inventory
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Flight Sector</span>
        </button>
      </div>

      {/* Segments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1D314F] text-white text-[11px] font-medium uppercase tracking-wider">
                <th className="py-3 px-3">Flight No & Airline</th>
                <th className="py-3 px-3">From (Departure)</th>
                <th className="py-3 px-3">To (Arrival)</th>
                <th className="py-3 px-3">Flight Date & Time</th>
                <th className="py-3 px-3">Cabin & Baggage</th>
                <th className="py-3 px-3 text-center">Seats (Left / Total)</th>
                <th className="py-3 px-3">Fares</th>
                <th className="py-3 px-4 text-right">Actions & Manifests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {segments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No flight segments added yet. Click &ldquo;Add Flight Segment&rdquo; to create your first sector.
                  </td>
                </tr>
              ) : (
                segments.map((seg) => {
                  const adtBag = seg.BaggageADT ?? seg.BaggageCountADT ?? '20';
                  return (
                    <tr key={seg.AirGroupSegmentID} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-sm text-[#1B3664]">
                          {seg.FlightNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {seg.OperatingAirlineName || seg.OperatingAirline || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {seg.DepartureCity} ({seg.DepartureIata})
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[160px] truncate">
                          {seg.DepartureAirport}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {seg.ArrivalCity} ({seg.ArrivalIata})
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[160px] truncate">
                          {seg.ArrivalAirport}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {formatDateTime(seg.DepartureDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Arr: {formatDateTime(seg.ArrivalDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {seg.FlightClass} ({seg.FlightClassCode || 'Y'}) • {adtBag} KG
                        </div>
                        <div className="mt-1">
                          {Number(seg.PnrExpiryHours) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                              PNR Expiry: {seg.PnrExpiryHours}h
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No PNR Expiry</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-semibold border border-slate-200">
                            {seg.SeatsLeft ?? seg.TotalSeats}
                          </span>{' '}
                          <span className="text-slate-400">/</span>{' '}
                          <span className="text-slate-600">{seg.TotalSeats}</span>
                        </div>
                        {seg.HasTiers && (
                          <div className="mt-1 text-[10px] font-sans text-slate-500">
                            Slab {seg.ActiveTier} ({seg.ActiveTierSeatsLeft} left)
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          1-Way: {formatCurrencyPKR(seg.AdultPrice)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Return:{' '}
                          {formatCurrencyPKR(
                            Number(seg.ReturnAdultPrice) > 0 ? seg.ReturnAdultPrice : seg.AdultPrice
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              downloadExcelManifest(seg, getPassengersForSegment(seg))
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                            title="Download Excel Manifest (.xlsx)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() =>
                              downloadWordManifest(seg, getPassengersForSegment(seg))
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                            title="Download Word IATA Manifest (.docx)"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#1B3664]" />
                            <span>Word</span>
                          </button>
                          <button
                            onClick={() => setSlabReportSegment(seg)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                            title="Sector Slab Report"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Slab Report</span>
                          </button>
                          <button
                            onClick={() => setDetailsSegment(seg)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => openEditModal(seg)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] cursor-pointer"
                            title="Edit Segment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete segment ${seg.FlightNumber}?`)) {
                                deleteSegment(seg.AirGroupSegmentID);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-red-600 text-slate-500 hover:text-red-600 cursor-pointer"
                            title="Delete Segment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILS & MANIFEST DOWNLOAD MODAL */}
      {detailsSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div>
                <h5 className="font-semibold text-sm">
                  Segment Details & Passenger Manifest - {detailsSegment.FlightNumber}
                </h5>
                <p className="text-[11px] text-white/75">
                  {detailsSegment.DepartureCity} ({detailsSegment.DepartureIata}) &rarr;{' '}
                  {detailsSegment.ArrivalCity} ({detailsSegment.ArrivalIata})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    downloadExcelManifest(detailsSegment, getPassengersForSegment(detailsSegment))
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel Manifest (.xlsx)</span>
                </button>
                <button
                  onClick={() =>
                    downloadWordManifest(detailsSegment, getPassengersForSegment(detailsSegment))
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word IATA Manifest (.docx)</span>
                </button>
                <button
                  onClick={() => setDetailsSegment(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <b>Flight No:</b> {detailsSegment.FlightNumber}
                </div>
                <div>
                  <b>Aircraft:</b> {detailsSegment.AirCraft || 'A320'}
                </div>
                <div>
                  <b>Class:</b> {detailsSegment.FlightClass} ({detailsSegment.FlightClassCode})
                </div>
                <div>
                  <b>Flight Time:</b> {detailsSegment.FlightTime}
                </div>
                <div>
                  <b>Airline Code:</b> {detailsSegment.OperatingAirline || '-'}
                </div>
                <div>
                  <b>Operating Airline:</b> {detailsSegment.OperatingAirlineName}
                </div>
                <div>
                  <b>Baggage:</b> Adult={detailsSegment.BaggageADT ?? detailsSegment.BaggageCountADT ?? '20'}, Child={detailsSegment.BaggageCNN ?? detailsSegment.BaggageCountCNN ?? '20'}, Infant={detailsSegment.BaggageINF ?? detailsSegment.BaggageCountINF ?? '0'}
                </div>
                <div>
                  <b>Meal / Total Seats:</b> {detailsSegment.Meal} / {detailsSegment.TotalSeats}
                </div>
              </div>

              <div>
                <h6 className="font-semibold text-xs text-[#1B3664] mb-2">
                  Issued Ticket Passengers on {detailsSegment.FlightNumber} (
                  {getPassengersForSegment(detailsSegment).length})
                </h6>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Last Name</th>
                        <th className="py-2 px-3">First Name</th>
                        <th className="py-2 px-3">Pax Type</th>
                        <th className="py-2 px-3">Passport #</th>
                        <th className="py-2 px-3">DOB</th>
                        <th className="py-2 px-3">PNR</th>
                        <th className="py-2 px-3">Ticket #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getPassengersForSegment(detailsSegment).map((p, idx) => (
                        <tr key={p.PassengerID || idx}>
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3">{p.Title}</td>
                          <td className="py-2 px-3 font-medium">{p.LastName}</td>
                          <td className="py-2 px-3 font-medium">{p.FirstName}</td>
                          <td className="py-2 px-3">{p.PassengerType}</td>
                          <td className="py-2 px-3 font-mono">{p.PassportNumber}</td>
                          <td className="py-2 px-3 font-mono">{p.DOB}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-[#1B3664]">{p.PNR}</td>
                          <td className="py-2 px-3 font-mono">{p.TicketNumber || 'PENDING'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTOR SLAB REPORT MODAL */}
      {slabReportSegment && (() => {
        const report = buildSegmentSlabReport(slabReportSegment, slabReportFilter);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
              <div className="bg-[#1D314F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <h5 className="font-semibold text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span>
                      Slab Report - {slabReportSegment.FlightNumber} (
                      {slabReportSegment.DepartureIata} &rarr; {slabReportSegment.ArrivalIata})
                    </span>
                  </h5>
                  <p className="text-[11px] text-white/75">
                    Flight Date: {formatDateTime(slabReportSegment.DepartureDate)} • Total Capacity:{' '}
                    {slabReportSegment.TotalSeats} Seats
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg bg-white/10 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSlabReportFilter('ALL_ACTIVE')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                        slabReportFilter === 'ALL_ACTIVE'
                          ? 'bg-white text-[#1B3664]'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      All Active Bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlabReportFilter('ISSUED_ONLY')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                        slabReportFilter === 'ISSUED_ONLY'
                          ? 'bg-white text-[#1B3664]'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Issued Tickets Only
                    </button>
                  </div>
                  <button
                    onClick={() => downloadSegmentSlabReportExcel(slabReportSegment, report)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => setSlabReportSegment(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 text-xs">
                {/* 1. 5-SLAB SUMMARY TABLE */}
                <div>
                  <h6 className="font-display font-semibold text-xs uppercase tracking-wider text-[#1B3664] mb-2">
                    5-Slab Allocation &amp; Revenue Summary
                  </h6>
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px] uppercase">
                          <th className="py-2 px-3">Slab</th>
                          <th className="py-2 px-3 text-center">Allocated Seats</th>
                          <th className="py-2 px-3 text-center">Sold Seats</th>
                          <th className="py-2 px-3 text-center">Remaining</th>
                          <th className="py-2 px-3 text-right">1-Way Adult Rate</th>
                          <th className="py-2 px-3 text-right">Return Adult Rate</th>
                          <th className="py-2 px-3 text-center">Infants</th>
                          <th className="py-2 px-3 text-right">Slab Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {report.slabSummaries.map((s) => (
                          <tr key={s.tier} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-sans font-bold text-[#1B3664]">
                              SLAB {s.tier}
                            </td>
                            <td className="py-2 px-3 text-center">{s.allocated}</td>
                            <td className="py-2 px-3 text-center font-semibold text-emerald-700">
                              {s.soldSeats}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{s.leftSeats}</td>
                            <td className="py-2 px-3 text-right">
                              {formatCurrencyPKR(s.oneWayAdultRate)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {formatCurrencyPKR(
                                s.returnAdultRate > 0 ? s.returnAdultRate : s.oneWayAdultRate
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">{s.infants}</td>
                            <td className="py-2 px-3 text-right font-bold text-[#1B3664]">
                              {formatCurrencyPKR(s.revenue)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#EFF4FB] font-bold text-[#1B3664] border-t-2 border-slate-300">
                          <td className="py-2.5 px-3 font-sans">SECTOR TOTAL</td>
                          <td className="py-2.5 px-3 text-center">
                            {slabReportSegment.TotalSeats}
                          </td>
                          <td className="py-2.5 px-3 text-center text-emerald-800">
                            {report.totalSeatedSold}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {Math.max(
                              0,
                              (Number(slabReportSegment.TotalSeats) || 0) - report.totalSeatedSold
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">-</td>
                          <td className="py-2.5 px-3 text-right">-</td>
                          <td className="py-2.5 px-3 text-center">{report.totalInfants}</td>
                          <td className="py-2.5 px-3 text-right text-sm">
                            {formatCurrencyPKR(report.grandTotalRevenue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. AGENT / ADMIN SLAB-WISE BREAKDOWN TABLE */}
                <div>
                  <h6 className="font-display font-semibold text-xs uppercase tracking-wider text-[#1B3664] mb-2">
                    Agent &amp; Admin Booking Breakdown by Slab ({report.rows.length} Entries)
                  </h6>
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#A9D08E] text-slate-900 font-bold border-b border-slate-300 text-[11px] uppercase">
                            <th className="py-2.5 px-3 border-r border-slate-300">#</th>
                            <th className="py-2.5 px-3 border-r border-slate-300">Date</th>
                            <th className="py-2.5 px-3 border-r border-slate-300">PNR</th>
                            <th className="py-2.5 px-3 border-r border-slate-300">
                              Agent / Admin Name
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-300">Status</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">
                              Slab
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-right">
                              Fare Rate
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">
                              Pax Taken
                            </th>
                            <th className="py-2.5 px-3 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {report.rows.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-slate-400">
                                No bookings found for this sector under the selected filter.
                              </td>
                            </tr>
                          ) : (
                            report.rows.map((row, idx) => (
                              <tr key={`${row.bookingId}-${row.tier}-${idx}`} className="hover:bg-slate-50">
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                  {row.date}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-[#1B3664]">
                                  {row.pnr}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                                  {row.bookedByName}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      row.status === 'Ticket Issued'
                                        ? 'bg-[#1B3664] text-white'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-center">
                                  <span className="px-2 py-0.5 rounded bg-[#1B3664]/10 text-[#1B3664] font-mono font-bold text-[11px]">
                                    SLAB {row.tier}
                                  </span>
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-medium">
                                  {formatCurrencyPKR(row.unitFare)}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-semibold">
                                  {row.paxLabel}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-[#1B3664]">
                                  {formatCurrencyPKR(row.totalAmount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD / EDIT SEGMENT MODAL (With Full Baggage & Airline Fields) */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h5 className="font-semibold text-sm">
                {editingId ? `Edit Flight Segment - ${editingId}` : 'Add Flight Segment'}
              </h5>
              <button onClick={() => setShowEditor(false)} className="text-white/75 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSegment} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Row 1: Departure & Arrival */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Departure Airport</label>
                  <select
                    value={form.DepartureIata}
                    onChange={(e) => handleAirportSelect('Departure', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  >
                    {airports.map((a) => (
                      <option key={a.AirportCode} value={a.AirportCode}>
                        {a.AirportCode} - {a.CityName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Departure Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.DepartureDate?.slice(0, 16) || ''}
                    onChange={(e) => setForm({ ...form, DepartureDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Arrival Airport</label>
                  <select
                    value={form.ArrivalIata}
                    onChange={(e) => handleAirportSelect('Arrival', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  >
                    {airports.map((a) => (
                      <option key={a.AirportCode} value={a.AirportCode}>
                        {a.AirportCode} - {a.CityName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Arrival Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.ArrivalDate?.slice(0, 16) || ''}
                    onChange={(e) => setForm({ ...form, ArrivalDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Flight Number, Airline, Seats, Cabin, Aircraft */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. HH 7212"
                    value={form.FlightNumber}
                    onChange={(e) => setForm({ ...form, FlightNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold focus:border-[#1B3664] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Operating Airline</label>
                  <input
                    type="text"
                    placeholder="e.g. Taban Airlines"
                    value={form.OperatingAirlineName}
                    onChange={(e) => setForm({ ...form, OperatingAirlineName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={form.TotalSeats}
                    onChange={(e) => handleTotalSeatsChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Flight Class</label>
                  <select
                    value={form.FlightClass}
                    onChange={(e) => setForm({ ...form, FlightClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Class Code</label>
                  <input
                    type="text"
                    value={form.FlightClassCode}
                    onChange={(e) =>
                      setForm({ ...form, FlightClassCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Aircraft</label>
                  <input
                    type="text"
                    placeholder="e.g. A320 / MD88"
                    value={form.AirCraft}
                    onChange={(e) => setForm({ ...form, AirCraft: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2b: Agent PNR Expiry Time Limit */}
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Agent PNR Expiry Time Limit (Hours)</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    If a Sub-Agent books without issuing within this time, booking auto-cancels. Main Admin bookings never expire.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {[
                    { label: 'No Expiry', val: 0 },
                    { label: '12 Hours', val: 12 },
                    { label: '24 Hours', val: 24 },
                    { label: '48 Hours', val: 48 },
                    { label: '72 Hours', val: 72 }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setForm({ ...form, PnrExpiryHours: opt.val })}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        Number(form.PnrExpiryHours) === opt.val
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    value={form.PnrExpiryHours}
                    onChange={(e) =>
                      setForm({ ...form, PnrExpiryHours: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-16 px-2 py-1.5 rounded-lg border border-amber-300 bg-white font-mono text-xs text-center font-bold text-amber-900"
                    title="Custom Expiry Hours (0 = No Expiry)"
                  />
                </div>
              </div>

              {/* Row 3: Baggage Allowance (Adult, Child, Infant) & Flight Time / Meal */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B3664]">
                  <Luggage className="w-4 h-4" />
                  <span>Baggage Allowance & Cabin Service</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Adult Baggage (KG)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 20"
                      value={form.BaggageADT}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          BaggageADT: e.target.value,
                          BaggageCountADT: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Child Baggage (KG)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 20"
                      value={form.BaggageCNN}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          BaggageCNN: e.target.value,
                          BaggageCountCNN: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Infant Baggage (KG)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0"
                      value={form.BaggageINF}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          BaggageINF: e.target.value,
                          BaggageCountINF: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Flight Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 02h 30m"
                      value={form.FlightTime}
                      onChange={(e) => setForm({ ...form, FlightTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Meal Included</label>
                    <select
                      value={form.Meal}
                      onChange={(e) => setForm({ ...form, Meal: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-[#1B3664] focus:outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 4: 5-Slab Dynamic Seat & Price Division (Runtime Slabs) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                {[
                  { num: 1, title: 'Starting Seats (Slab 1)', badgeBg: 'bg-[#1B3664]' },
                  { num: 2, title: 'Second Tier Seats (Slab 2)', badgeBg: 'bg-teal-700' },
                  { num: 3, title: 'Third Tier Seats (Slab 3)', badgeBg: 'bg-amber-600' },
                  { num: 4, title: 'Fourth Tier Seats (Slab 4)', badgeBg: 'bg-orange-600' },
                  { num: 5, title: 'Remaining Seats (Slab 5 - Final Tier)', badgeBg: 'bg-rose-600' }
                ].map((slab) => {
                  const pfx = `Tier${slab.num}`;
                  return (
                    <div
                      key={slab.num}
                      className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3664]">
                          <span
                            className={`px-2 py-0.5 rounded ${slab.badgeBg} text-white font-mono text-[10px]`}
                          >
                            SLAB {slab.num}
                          </span>
                          {slab.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-700">
                            Slab {slab.num} Seats:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={form[`${pfx}Seats`]}
                            onChange={(e) => handleTierSeatsChange(slab.num, e.target.value)}
                            className="w-24 px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 font-mono font-bold text-xs text-[#1B3664] focus:border-[#1B3664] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                            1-Way Adult (PKR)
                          </label>
                          <input
                            type="number"
                            value={form[`${pfx}AdultPrice`]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                [`${pfx}AdultPrice`]: v,
                                ...(slab.num === 1 ? { AdultPrice: v } : {})
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                            1-Way Child (PKR)
                          </label>
                          <input
                            type="number"
                            value={form[`${pfx}ChildPrice`]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                [`${pfx}ChildPrice`]: v,
                                ...(slab.num === 1 ? { ChildPrice: v } : {})
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                            1-Way Infant (PKR)
                          </label>
                          <input
                            type="number"
                            value={form[`${pfx}InfantPrice`]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                [`${pfx}InfantPrice`]: v,
                                ...(slab.num === 1 ? { InfantPrice: v } : {})
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                            Return Adult (PKR)
                          </label>
                          <input
                            type="number"
                            value={form[`${pfx}ReturnAdultPrice`]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                [`${pfx}ReturnAdultPrice`]: v,
                                ...(slab.num === 1 ? { ReturnAdultPrice: v } : {})
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                            Return Child (PKR)
                          </label>
                          <input
                            type="number"
                            value={form[`${pfx}ReturnChildPrice`]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                [`${pfx}ReturnChildPrice`]: v,
                                ...(slab.num === 1 ? { ReturnChildPrice: v } : {})
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                            Return Infant (PKR)
                          </label>
                          <input
                            type="number"
                            value={form[`${pfx}ReturnInfantPrice`]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((prev) => ({
                                ...prev,
                                [`${pfx}ReturnInfantPrice`]: v,
                                ...(slab.num === 1 ? { ReturnInfantPrice: v } : {})
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
