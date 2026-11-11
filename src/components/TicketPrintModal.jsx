import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';

function extractTime(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) {
    const parts = String(dtStr).split('T');
    return parts[1] ? parts[1].slice(0, 5) : dtStr;
  }
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function extractShortDate(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleDateString('en-GB', {
     weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDobShort(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Deterministic crisp vector barcode bars for authentic international e-ticket header
const BARCODE_WIDTHS = [
  2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2
];

export default function TicketPrintModal({ booking, onClose }) {
  const printRef = useRef(null);

  if (!booking) return null;

  const isIssued = booking.ApprovalStatus === 'Ticket Issued';
  const statusLabel = isIssued
    ? 'CONFIRMED • E-TICKET ISSUED'
    : `RESERVATION ${(booking.ApprovalStatus || 'BOOKED').toUpperCase()}`;

  const handlePrint = () => {
    const content = printRef.current ? printRef.current.innerHTML : '';
    const win = window.open('', '_blank', 'width=920,height=980');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Electronic Ticket Receipt — ${booking.PNR}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #FFFFFF;
            color: #0f172a;
            margin: 0;
            padding: 14px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const segments = booking.Segments || [];
  const passengers = booking.Passengers || [];
  const logoUrl = `${window.location.origin}/images/Taban%20Air%20Gradient%20Airline%20Logo.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[93vh] flex flex-col overflow-hidden">
        {/* Top Modal Action Bar */}
        <div className="bg-[#0F172A] text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-7 h-7 rounded bg-white p-0.5 object-contain"
            />
            <div>
              <h3 className="font-semibold text-sm tracking-wide">
                International E-Ticket & Boarding Itinerary — {booking.PNR}
              </h3>
              <p className="text-[11px] text-slate-400">
                Booking Ref: {booking.AirGroupBookingID} • Status: {booking.ApprovalStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body (Minimalist International Airline E-Ticket Design) */}
        <div className="p-5 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            style={{
              width: '790px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '26px 28px',
              color: '#0f172a',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
            }}
          >
            {/* 1. INTERNATIONAL AIRLINE MASTHEAD WITH BARCODE & PNR */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '18px',
                borderBottom: '1.5px solid #0f172a',
                marginBottom: '16px'
              }}
            >
              {/* Left: Airline Logo & Document Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '66px',
                    height: '66px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={logoUrl}
                    alt="Taban Air"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '1.8px',
                      textTransform: 'uppercase',
                      color: '#64748b',
                      marginBottom: '3px'
                    }}
                  >
                    IATA Electronic Ticket &bull; Passenger Itinerary Receipt
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      letterSpacing: '-0.3px',
                      color: '#0f172a',
                      textTransform: 'uppercase'
                    }}
                  >
                    {booking.ValidatingCarrierName || 'Taban Airlines'}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '5px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.6px',
                      color: '#1e293b'
                    }}
                  >
                    {statusLabel}
                  </div>
                </div>
              </div>

              {/* Right: Vector Barcode + Airline PNR Box */}
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      color: '#64748b'
                    }}
                  >
                    Booking Reference (PNR)
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      fontFamily: "'Courier New', Courier, monospace",
                      letterSpacing: '2.5px',
                      color: '#0f172a',
                      lineHeight: '1.15',
                      marginTop: '2px'
                    }}
                  >
                    {booking.PNR}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                    ID: {booking.AirGroupBookingID}
                  </div>
                </div>

                {/* Minimalist Vertical/Horizontal Barcode Block */}
                <div
                  style={{
                    borderLeft: '1px dashed #cbd5e1',
                    paddingLeft: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <svg width="96" height="42" viewBox="0 0 96 42" xmlns="http://www.w3.org/2000/svg">
                    {BARCODE_WIDTHS.reduce(
                      (acc, w, i) => {
                        const rect =
                          i % 2 === 0 ? (
                            <rect key={i} x={acc.x} y="2" width={w} height="38" fill="#0f172a" />
                          ) : null;
                        return { x: acc.x + w + 0.7, els: [...acc.els, rect] };
                      },
                      { x: 2, els: [] }
                    ).els}
                  </svg>
                  <span style={{ fontSize: '8.5px', fontFamily: 'monospace', color: '#64748b', letterSpacing: '1.5px' }}>
                    *{booking.PNR}*
                  </span>
                </div>
              </div>
            </div>

            {/* 2. RESERVATION METADATA STRIP (4-COLUMN CLEAN HAIRLINE GRID) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  !isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—'
                    ? 'repeat(4, 1fr)'
                    : 'repeat(3, 1fr)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                marginBottom: '20px',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {isIssued ? 'Date of Issue' : 'Date of Booking'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  {isIssued ? (booking.ApprovalDateTime || booking.TimeStamp) : booking.TimeStamp}
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Issuing Airline &bull; Agency
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  {booking.ValidatingCarrierName || 'Taban Airlines'} ({booking.SubCompanyID || 'DIRECT'})
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRight:
                    !isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—'
                      ? '1px solid #e2e8f0'
                      : 'none'
                }}
              >
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Journey Type &bull; Cabin
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                  {booking.TripType || 'One Way'} &bull; {booking.FlightCategory || 'Economy'}
                </div>
              </div>

              {!isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—' && (
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Ticketing Time Limit
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {booking.BookingTimeLimit}
                  </div>
                </div>
              )}
            </div>

            {/* 3. INTERNATIONAL BOARDING-PASS STYLE FLIGHT COUPONS */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#0f172a'
                  }}
                >
                  Flight Itinerary &amp; Coupon Details
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                  All times shown are local airport times
                </span>
              </div>

              {segments.length === 0 ? (
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    color: '#475569'
                  }}
                >
                  {booking.FlightTitle || 'Flight Sector'}
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const adtBag =
                    seg.BaggageADT !== undefined && seg.BaggageADT !== ''
                      ? seg.BaggageADT
                      : seg.BaggageCountADT || '20';
                  const cnnBag =
                    seg.BaggageCNN !== undefined && seg.BaggageCNN !== ''
                      ? seg.BaggageCNN
                      : seg.BaggageCountCNN || '20';
                  const infBag =
                    seg.BaggageINF !== undefined && seg.BaggageINF !== ''
                      ? seg.BaggageINF
                      : seg.BaggageCountINF || '0';

                  return (
                    <div
                      key={seg.AirGroupSegmentID || idx}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        marginBottom: idx < segments.length - 1 ? '12px' : 0,
                        backgroundColor: '#ffffff'
                      }}
                    >
                      {/* Top Flight Strip */}
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          padding: '7px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              color: '#0f172a',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            Coupon 0{idx + 1}
                          </span>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>
                            Flight {seg.FlightNumber}
                          </span>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <span style={{ color: '#475569', fontWeight: 500 }}>
                            Operated by {seg.OperatingAirlineName || 'Taban Airlines'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '10.5px', letterSpacing: '0.4px' }}>
                          STATUS: HK1 CONFIRMED
                        </div>
                      </div>

                      {/* Main Boarding Pass Body: Left Route (72%) + Dashed Perforation + Right Stub (28%) */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 220px'
                        }}
                      >
                        {/* Left Route Timeline */}
                        <div
                          style={{
                            padding: '16px 20px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 120px 1fr',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          {/* Origin */}
                          <div>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: '1' }}>
                              {seg.DepartureIata}
                            </div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                              {seg.DepartureCity}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                              {seg.DepartureAirport}
                            </div>
                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                                {extractTime(seg.DepartureDate)}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>
                                {extractShortDate(seg.DepartureDate)}
                              </div>
                            </div>
                          </div>

                          {/* Center Flight Path Graphic */}
                          <div style={{ textAlign: 'center', padding: '0 4px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                              {seg.FlightTime || 'Non-Stop'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'inline-block' }} />
                              <span style={{ flex: 1, borderTop: '1.5px dashed #94a3b8', margin: '0 4px' }} />
                              <span style={{ fontSize: '14px', color: '#0f172a', lineHeight: '1' }}>&#9992;</span>
                              <span style={{ flex: 1, borderTop: '1.5px dashed #94a3b8', margin: '0 4px' }} />
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', border: '1.5px solid #0f172a', display: 'inline-block' }} />
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600, marginTop: '6px', textTransform: 'uppercase' }}>
                              {seg.AirCraft || 'A320'}
                            </div>
                          </div>

                          {/* Destination */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: '1' }}>
                              {seg.ArrivalIata}
                            </div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                              {seg.ArrivalCity}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                              {seg.ArrivalAirport}
                            </div>
                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                                {extractTime(seg.ArrivalDate)}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>
                                {extractShortDate(seg.ArrivalDate)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Coupon Stub (Separated by Dashed Perforation) */}
                        <div
                          style={{
                            borderLeft: '1.5px dashed #cbd5e1',
                            backgroundColor: '#fafafa',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>
                              Cabin Class
                            </span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              {seg.FlightClass || 'Economy'} ({seg.FlightClassCode || 'Y'})
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>
                              Adult Bag
                            </span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                              {adtBag} KG
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>
                              Child / Inf
                            </span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                              {cnnBag} KG / {infBag} KG
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>
                              Meal Service
                            </span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              {seg.Meal || 'Included'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. PASSENGER & E-TICKET COUPON MANIFEST */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#0f172a',
                  marginBottom: '8px'
                }}
              >
                Passenger &amp; Electronic Ticket Manifest ({passengers.length})
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', color: '#0f172a' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #cbd5e1',
                        textAlign: 'left',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: '#475569'
                      }}
                    >
                      <th style={{ padding: '9px 12px', width: '36px' }}>#</th>
                      <th style={{ padding: '9px 12px' }}>Passenger Name (IATA Format)</th>
                      <th style={{ padding: '9px 12px' }}>Type</th>
                      <th style={{ padding: '9px 12px' }}>Date of Birth</th>
                      <th style={{ padding: '9px 12px' }}>Nat.</th>
                      <th style={{ padding: '9px 12px' }}>Passport No.</th>
                      <th style={{ padding: '9px 12px', textAlign: 'right' }}>E-Ticket Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p, idx) => (
                      <tr
                        key={p.PassengerID || idx}
                        style={{
                          borderBottom: idx < passengers.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}
                      >
                        <td style={{ padding: '9px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                          {p.LastName} / {p.FirstName} {p.Title}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#334155', fontWeight: 600 }}>
                          {p.PassengerType}
                        </td>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#334155' }}>
                          {formatDobShort(p.DOB)}
                        </td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: '#334155' }}>
                          {p.Nationality}
                        </td>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {p.PassportNumber}
                        </td>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>
                          {p.TicketNumber || 'PENDING ISSUANCE'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. CONDITIONS OF CARRIAGE & IMPORTANT PASSENGER NOTICES */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: '#fafafa',
                marginBottom: '18px'
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '6px',
                  marginBottom: '8px'
                }}
              >
                Important Passenger Notices &amp; Conditions of Carriage
              </div>

              <div style={{ fontSize: '10.5px', lineHeight: '1.6', color: '#334155' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                  داشتن ویزا ،معتبر واچر هتل و بلیط برگشت برای مسافران ایرانی هنگام ورود به پاکستان الزامی است
                </div>
                <div style={{ marginBottom: '6px' }}>
                  اگر از خروج یا ورود مسافران ایرانی توسط پلیس مهاجرت و گذرنامه جلوگیری شود تمام هزینه‌های مربوطه از جمله حمل و نقل برگشت و ،اقامتبر عهده مسافر خواهد بود شرکت هواپیمایی تابان هیچ مسئولیتی در این زمینه ندارد
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 18px', color: '#475569' }}>
                  <div>&bull; Check-in counters close strictly 3 hours prior to departure.</div>
                  <div>&bull; Tickets are non-refundable, non-transferable, and non-endorsable.</div>
                  <div>&bull; Valid passport and visa must be presented at check-in and boarding.</div>
                  <div>&bull; Passengers must carry a minimum of USD 350 for immigration check.</div>
                  <div>&bull; Each passenger must submit four (4) copies of their visa at boarding.</div>
                  <div>&bull; No refund applies in cases of no-show, offload, or force majeure.</div>
                </div>
              </div>
            </div>

            {/* 6. ISSUING OFFICE & ASSISTANCE CONTACT BOX */}
            {(() => {
              const agent = booking.AgentDetails;
              const contactHeading = (
                agent?.ContactPerson ||
                booking.SubCompanyName ||
                'MAIN CONTROLLER'
              )
                .toString()
                .toUpperCase();

              const officeLine = agent
                ? [
                    agent.Address ? agent.Address.trim() : '',
                    agent.CompanyName ? agent.CompanyName.trim() : '',
                    agent.City ? agent.City.trim() : ''
                  ]
                    .filter(Boolean)
                    .join(' - ')
                    .toUpperCase()
                : (booking.SubCompanyName || 'OFFICE 102-SKY BRIDGE AVIATION LAHORE').toUpperCase();

              const phoneVal =
                agent?.Phone || booking.MobileNumber || '+92 318 9515315';
              const emailVal = (
                agent?.Email ||
                booking.EmailAddress ||
                'BOOKINGS@BOOKLY.COM'
              )
                .toString()
                .toUpperCase();

              return (
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #cbd5e1',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>For Any Assistance Please Contact Issuing Office</span>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Passenger Support Desk</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      padding: '12px 18px'
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '6px',
                        backgroundColor: '#f8fafc'
                      }}
                    >
                      <svg
                        width="46"
                        height="46"
                        viewBox="0 0 80 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 36C20 24.402 28.9543 15 40 15C51.0457 15 60 24.402 60 36"
                          stroke="#334155"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <ellipse cx="40" cy="36" rx="13" ry="15" fill="#0f172a" />
                        <rect x="16" y="31" width="6" height="13" rx="3" fill="#475569" />
                        <rect x="58" y="31" width="6" height="13" rx="3" fill="#475569" />
                        <path
                          d="M20 42C20 46.5 28 47.5 38 47.5"
                          stroke="#334155"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="39" cy="47.5" r="2" fill="#ffffff" />
                        <path
                          d="M15 70C15 58.5 25 53 40 53C55 53 65 58.5 65 70H15Z"
                          fill="#0f172a"
                        />
                        <path d="M32 53L40 69L48 53H32Z" fill="#ffffff" />
                        <path d="M38 55H42L41.2 60L42.5 68L40 70L37.5 68L38.8 60L38 55Z" fill="#475569" />
                      </svg>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: '1.3fr 1fr',
                        gap: '6px 20px',
                        fontSize: '11.5px',
                        color: '#0f172a'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          Contact Person / Desk
                        </div>
                        <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>
                          {contactHeading}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          Telephone / Helpline
                        </div>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                          {phoneVal}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          Office Address
                        </div>
                        <div style={{ fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
                          {officeLine}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          Email Address
                        </div>
                        <div style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>
                          {emailVal}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
