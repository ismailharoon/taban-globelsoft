import React, { useState } from 'react';
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  FileText,
  Luggage
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  formatCurrencyPKR,
  formatDateTime,
  downloadExcelManifest,
  downloadWordManifest
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
  Tier1Seats: 40,
  Tier1AdultPrice: 0,
  Tier1ChildPrice: 0,
  Tier1InfantPrice: 0,
  Tier1ReturnAdultPrice: 0,
  Tier1ReturnChildPrice: 0,
  Tier1ReturnInfantPrice: 0,
  Tier2Seats: 50,
  Tier2AdultPrice: 0,
  Tier2ChildPrice: 0,
  Tier2InfantPrice: 0,
  Tier2ReturnAdultPrice: 0,
  Tier2ReturnChildPrice: 0,
  Tier2ReturnInfantPrice: 0,
  Tier3Seats: 30,
  Tier3AdultPrice: 0,
  Tier3ChildPrice: 0,
  Tier3InfantPrice: 0,
  Tier3ReturnAdultPrice: 0,
  Tier3ReturnChildPrice: 0,
  Tier3ReturnInfantPrice: 0,
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

  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_SEGMENT_FORM);
    setShowEditor(true);
  };

  const openEditModal = (seg) => {
    const hasTiers =
      (Number(seg.Tier1Seats) || 0) +
        (Number(seg.Tier2Seats) || 0) +
        (Number(seg.Tier3Seats) || 0) >
      0;
    const tot = Number(seg.TotalSeats) || 120;
    const defT1 = hasTiers ? Number(seg.Tier1Seats) || 0 : Math.floor(tot / 3);
    const defT2 = hasTiers ? Number(seg.Tier2Seats) || 0 : Math.floor(tot / 3);
    const defT3 = hasTiers ? Number(seg.Tier3Seats) || 0 : Math.max(0, tot - defT1 - defT2);

    setEditingId(seg.AirGroupSegmentID);
    setForm({
      ...INITIAL_SEGMENT_FORM,
      ...seg,
      TotalSeats: tot,
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
    const rem = Math.max(0, tot - t1 - t2);
    setForm((prev) => ({
      ...prev,
      TotalSeats: tot,
      Tier3Seats: rem
    }));
  };

  const handleTier1SeatsChange = (val) => {
    const t1 = Math.max(0, Number(val) || 0);
    const t2 = Number(form.Tier2Seats) || 0;
    const tot = Number(form.TotalSeats) || 0;
    const rem = Math.max(0, tot - t1 - t2);
    setForm((prev) => ({
      ...prev,
      Tier1Seats: t1,
      Tier3Seats: rem,
      TotalSeats: Math.max(tot, t1 + t2 + rem)
    }));
  };

  const handleTier2SeatsChange = (val) => {
    const t2 = Math.max(0, Number(val) || 0);
    const t1 = Number(form.Tier1Seats) || 0;
    const tot = Number(form.TotalSeats) || 0;
    const rem = Math.max(0, tot - t1 - t2);
    setForm((prev) => ({
      ...prev,
      Tier2Seats: t2,
      Tier3Seats: rem,
      TotalSeats: Math.max(tot, t1 + t2 + rem)
    }));
  };

  const handleTier3SeatsChange = (val) => {
    const t3 = Math.max(0, Number(val) || 0);
    const t1 = Number(form.Tier1Seats) || 0;
    const t2 = Number(form.Tier2Seats) || 0;
    setForm((prev) => ({
      ...prev,
      Tier3Seats: t3,
      TotalSeats: t1 + t2 + t3
    }));
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
    const totalSeats = t1 + t2 + t3 > 0 ? t1 + t2 + t3 : Number(form.TotalSeats) || 120;

    const payload = {
      ...form,
      FlightNumber: fn,
      OperatingAirline: airlineCode,
      MarketingAirline: form.MarketingAirline || airlineCode,
      TotalSeats: totalSeats,
      Tier1Seats: t1,
      Tier2Seats: t2,
      Tier3Seats: t3,
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
            Sector Legs, Baggage, Pricing & IATA Manifests
          </span>
          <h1 className="font-display font-semibold text-xl text-slate-900 mt-0.5">
            Segment Management
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Flight Segment</span>
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
                <th className="py-3 px-3">Customer / Supplier Fare</th>
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
                  const cnnBag = seg.BaggageCNN ?? seg.BaggageCountCNN ?? '20';
                  const infBag = seg.BaggageINF ?? seg.BaggageCountINF ?? '0';
                  return (
                    <tr key={seg.AirGroupSegmentID} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-mono font-semibold text-sm text-[#1B3664]">
                          {seg.FlightNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {seg.OperatingAirlineName || seg.OperatingAirline || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {seg.DepartureCity} ({seg.DepartureIata})
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[170px] truncate">
                          {seg.DepartureAirport}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {seg.ArrivalCity} ({seg.ArrivalIata})
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[170px] truncate">
                          {seg.ArrivalAirport}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="font-medium text-slate-800">
                          {formatDateTime(seg.DepartureDate)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Arr: {formatDateTime(seg.ArrivalDate)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {seg.FlightClass} ({seg.FlightClassCode || 'Y'}) • {seg.AirCraft || 'A320'}
                        </div>
                        <div className="text-[11px] text-[#1B3664]">
                          ADT={adtBag}, CNN={cnnBag}, INF={infBag}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            {seg.SeatsLeft ?? seg.TotalSeats}
                          </span>{' '}
                          / <span className="text-slate-600">{seg.TotalSeats}</span>
                        </div>
                        {seg.HasTiers && (
                          <div className="mt-1 text-[10px] font-sans text-slate-500">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-[#1B3664]/10 text-[#1B3664] font-semibold">
                              Active: Tier {seg.ActiveTier} ({seg.ActiveTierSeatsLeft} left)
                            </span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              Slabs: {seg.Tier1Seats}/{seg.Tier2Seats}/{seg.Tier3Seats}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="font-semibold text-[#1B3664]">
                          1-Way: {formatCurrencyPKR(seg.AdultPrice)}
                        </div>
                        <div className="font-semibold text-emerald-700">
                          Return: {formatCurrencyPKR(Number(seg.ReturnAdultPrice) > 0 ? seg.ReturnAdultPrice : seg.AdultPrice)}
                        </div>
                        {seg.HasTiers ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            T1: {formatCurrencyPKR(seg.Tier1AdultPrice)} | T2: {formatCurrencyPKR(seg.Tier2AdultPrice)} | T3: {formatCurrencyPKR(seg.Tier3AdultPrice)}
                          </div>
                        ) : (
                          <div className="text-slate-500">
                            Sup: {formatCurrencyPKR(seg.AdultPriceSupplier)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              downloadExcelManifest(seg, getPassengersForSegment(seg))
                            }
                            className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="Download Excel Manifest (.xlsx)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() =>
                              downloadWordManifest(seg, getPassengersForSegment(seg))
                            }
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-950 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="Download Word IATA Manifest (.docx)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Word</span>
                          </button>
                          <button
                            onClick={() => setDetailsSegment(seg)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
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
                  Segment Details & Passenger Manifest — {detailsSegment.FlightNumber}
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
                  <b>Airline Code:</b> {detailsSegment.OperatingAirline || '—'}
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

      {/* ADD / EDIT SEGMENT MODAL (With Full Baggage & Airline Fields) */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h5 className="font-semibold text-sm">
                {editingId ? `Edit Flight Segment — ${editingId}` : 'Add Flight Segment'}
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
                        {a.AirportCode} — {a.CityName}
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
                        {a.AirportCode} — {a.CityName}
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

              {/* Row 4: 3-Tier Dynamic Seat & Price Division (Runtime Slabs) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <div className="text-xs font-bold text-[#1B3664] uppercase tracking-wider">
                      Dynamic 3-Slab Seat & Fare Allocation (Runtime Pricing)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Divide Total Seats ({form.TotalSeats || 0}) into 3 runtime seat slabs. Prices automatically shift to the next tier as seats sell out.
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-[#1B3664] text-white font-mono text-[11px] font-semibold">
                    Total: {Number(form.Tier1Seats || 0)} + {Number(form.Tier2Seats || 0)} + {Number(form.Tier3Seats || 0)} ={' '}
                    {Number(form.Tier1Seats || 0) + Number(form.Tier2Seats || 0) + Number(form.Tier3Seats || 0)} / {form.TotalSeats || 0} Seats
                  </div>
                </div>

                {/* TIER 1: STARTING SEATS */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3664]">
                      <span className="px-2 py-0.5 rounded bg-[#1B3664] text-white font-mono text-[10px]">
                        SLAB 1
                      </span>
                      Starting Seats (First Tier)
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Slab 1 Seats:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={form.TotalSeats}
                        value={form.Tier1Seats}
                        onChange={(e) => handleTier1SeatsChange(e.target.value)}
                        className="w-24 px-2.5 py-1 rounded-lg border border-[#1B3664] bg-slate-50 font-mono font-bold text-xs text-[#1B3664] focus:outline-none"
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
                        value={form.Tier1AdultPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            Tier1AdultPrice: Number(e.target.value),
                            AdultPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                        1-Way Child (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier1ChildPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            Tier1ChildPrice: Number(e.target.value),
                            ChildPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                        1-Way Infant (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier1InfantPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            Tier1InfantPrice: Number(e.target.value),
                            InfantPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Adult (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier1ReturnAdultPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            Tier1ReturnAdultPrice: Number(e.target.value),
                            ReturnAdultPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Child (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier1ReturnChildPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            Tier1ReturnChildPrice: Number(e.target.value),
                            ReturnChildPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Infant (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier1ReturnInfantPrice}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            Tier1ReturnInfantPrice: Number(e.target.value),
                            ReturnInfantPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* TIER 2: NEXT SEATS */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3664]">
                      <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px]">
                        SLAB 2
                      </span>
                      Next Seats (Second Tier)
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Slab 2 Seats:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={Math.max(0, Number(form.TotalSeats || 0) - Number(form.Tier1Seats || 0))}
                        value={form.Tier2Seats}
                        onChange={(e) => handleTier2SeatsChange(e.target.value)}
                        className="w-24 px-2.5 py-1 rounded-lg border border-amber-500 bg-amber-50/40 font-mono font-bold text-xs text-amber-900 focus:outline-none"
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
                        value={form.Tier2AdultPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier2AdultPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                        1-Way Child (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier2ChildPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier2ChildPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                        1-Way Infant (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier2InfantPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier2InfantPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Adult (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier2ReturnAdultPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier2ReturnAdultPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Child (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier2ReturnChildPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier2ReturnChildPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Infant (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier2ReturnInfantPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier2ReturnInfantPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* TIER 3: REMAINING SEATS */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3664]">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px]">
                        SLAB 3
                      </span>
                      Remaining Seats (Final Tier)
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Slab 3 Seats:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.Tier3Seats}
                        onChange={(e) => handleTier3SeatsChange(e.target.value)}
                        className="w-24 px-2.5 py-1 rounded-lg border border-rose-500 bg-rose-50/40 font-mono font-bold text-xs text-rose-900 focus:outline-none"
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
                        value={form.Tier3AdultPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier3AdultPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                        1-Way Child (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier3ChildPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier3ChildPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1B3664] mb-1">
                        1-Way Infant (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier3InfantPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier3InfantPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Adult (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier3ReturnAdultPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier3ReturnAdultPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Child (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier3ReturnChildPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier3ReturnChildPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Return Infant (PKR)
                      </label>
                      <input
                        type="number"
                        value={form.Tier3ReturnInfantPrice}
                        onChange={(e) =>
                          setForm({ ...form, Tier3ReturnInfantPrice: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier Fares */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Adult Price (Supplier PKR)
                    </label>
                    <input
                      type="number"
                      value={form.AdultPriceSupplier}
                      onChange={(e) =>
                        setForm({ ...form, AdultPriceSupplier: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Child Price (Supplier PKR)
                    </label>
                    <input
                      type="number"
                      value={form.ChildPriceSupplier}
                      onChange={(e) =>
                        setForm({ ...form, ChildPriceSupplier: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Infant Price (Supplier PKR)
                    </label>
                    <input
                      type="number"
                      value={form.InfantPriceSupplier}
                      onChange={(e) =>
                        setForm({ ...form, InfantPriceSupplier: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                </div>
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
