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
    year: '2-digit'
  });
}

export default function TicketPrintModal({ booking, onClose }) {
  const printRef = useRef(null);

  if (!booking) return null;

  const isIssued = booking.ApprovalStatus === 'Ticket Issued';
  const statusBadgeText = isIssued ? 'E-TICKET ISSUED' : (booking.ApprovalStatus || 'BOOKED').toUpperCase();

  const handlePrint = () => {
    const content = printRef.current ? printRef.current.innerHTML : '';
    const win = window.open('', '_blank', 'width=920,height=960');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>E-Ticket Itinerary — PNR ${booking.PNR}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
            background: #FFFFFF;
            color: #1e293b;
            margin: 0;
            padding: 16px;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Action Bar */}
        <div className="bg-[#0F172A] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain"
            />
            <div>
              <h3 className="font-semibold text-sm tracking-wide">
                Electronic Ticket & Itinerary — PNR {booking.PNR}
              </h3>
              <p className="text-[11px] text-slate-300">
                Reference: {booking.AirGroupBookingID} • Status: {booking.ApprovalStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Download PDF
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

        {/* Printable Document Body (Modern Boarding-Pass & E-Ticket Design) */}
        <div className="p-5 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            style={{
              width: '790px',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif"
            }}
          >
            {/* MODERN EXECUTIVE HEADER BANNER */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1B3664 100%)',
                padding: '20px 24px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '4px solid #0ea5e9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  <img
                    src={logoUrl}
                    alt="Taban Air"
                    style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: '#93c5fd',
                      fontWeight: 700,
                      marginBottom: '3px'
                    }}
                  >
                    Electronic Passenger Itinerary & Receipt
                  </div>
                  <div
                    style={{
                      fontSize: '19px',
                      fontWeight: 800,
                      letterSpacing: '0.3px',
                      color: '#ffffff'
                    }}
                  >
                    {booking.ValidatingCarrierName || 'TABAN AIRLINES'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>
                    Ref ID: {booking.AirGroupBookingID} • Agency Code: {booking.SubCompanyID || 'DIRECT'}
                  </div>
                </div>
              </div>

              {/* Right PNR & Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.6px',
                    backgroundColor: isIssued ? '#10b981' : '#f59e0b',
                    color: '#ffffff',
                    marginBottom: '8px'
                  }}
                >
                  {statusBadgeText}
                </div>
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: '8px',
                    padding: '6px 14px'
                  }}
                >
                  <div style={{ fontSize: '9.5px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Booking Reference (PNR)
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '2px', color: '#ffffff', fontFamily: 'monospace' }}>
                    {booking.PNR}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* 4-COLUMN SUMMARY METADATA STRIP */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: !isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—'
                    ? 'repeat(4, 1fr)'
                    : 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '3px solid #1B3664',
                    borderRadius: '6px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {isIssued ? 'Ticket Issue Date' : 'Booking Date'}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {isIssued ? (booking.ApprovalDateTime || booking.TimeStamp) : booking.TimeStamp}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '3px solid #0ea5e9',
                    borderRadius: '6px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Operating Carrier
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {booking.ValidatingCarrierName || 'Taban Airlines'}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '3px solid #10b981',
                    borderRadius: '6px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Trip Type & Class
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {booking.TripType || 'One Way'} • {booking.FlightCategory || 'Economy'}
                  </div>
                </div>

                {!isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—' && (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderLeft: '3px solid #f59e0b',
                      borderRadius: '6px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                      Hold Time Limit
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginTop: '3px' }}>
                      {booking.BookingTimeLimit}
                    </div>
                  </div>
                )}
              </div>

              {/* FLIGHT SECTORS / BOARDING PASS CARDS */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      color: '#1B3664'
                    }}
                  >
                    Flight Itinerary & Sector Schedule
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {segments.length} {segments.length === 1 ? 'Sector' : 'Sectors'} Confirmed
                  </div>
                </div>

                {segments.length === 0 ? (
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                      fontSize: '12.5px',
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
                        {/* Sector Ribbon Header */}
                        <div
                          style={{
                            backgroundColor: '#f1f5f9',
                            borderBottom: '1px solid #e2e8f0',
                            padding: '8px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11.5px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                backgroundColor: '#1B3664',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              Sector 0{idx + 1}
                            </span>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', fontFamily: 'monospace' }}>
                              Flight {seg.FlightNumber}
                            </span>
                            <span style={{ color: '#64748b' }}>•</span>
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              Aircraft: {seg.AirCraft || 'A320'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155', fontWeight: 600 }}>
                            <span>
                              Cabin: <b>{seg.FlightClass || 'Economy'} ({seg.FlightClassCode || 'Y'})</b>
                            </span>
                            <span
                              style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700
                              }}
                            >
                              Baggage: ADT {adtBag}KG | CNN {cnnBag}KG | INF {infBag}KG
                            </span>
                          </div>
                        </div>

                        {/* Sector Route Body */}
                        <div
                          style={{
                            padding: '14px 18px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 140px 1fr',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          {/* Departure Block */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                              Departure
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                              <span style={{ fontSize: '22px', fontWeight: 800, color: '#1B3664' }}>
                                {seg.DepartureIata}
                              </span>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                {seg.DepartureCity}
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                              {seg.DepartureAirport}
                            </div>
                            <div
                              style={{
                                marginTop: '6px',
                                display: 'inline-block',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '5px',
                                padding: '3px 9px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: '#0f172a'
                              }}
                            >
                              {extractShortDate(seg.DepartureDate)} • {extractTime(seg.DepartureDate)}
                            </div>
                          </div>

                          {/* Center Flight Path Graphic */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                              {seg.FlightTime || 'Non-Stop'}
                            </div>
                            <div
                              style={{
                                position: 'relative',
                                height: '2px',
                                backgroundColor: '#94a3b8',
                                width: '100%',
                                margin: '6px 0'
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: '#ffffff',
                                  padding: '0 4px',
                                  color: '#1B3664',
                                  fontSize: '13px'
                                }}
                              >
                                &#9992;
                              </span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, marginTop: '4px' }}>
                              CONFIRMED (OK)
                            </div>
                          </div>

                          {/* Arrival Block */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                              Arrival
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                {seg.ArrivalCity}
                              </span>
                              <span style={{ fontSize: '22px', fontWeight: 800, color: '#1B3664' }}>
                                {seg.ArrivalIata}
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                              {seg.ArrivalAirport}
                            </div>
                            <div
                              style={{
                                marginTop: '6px',
                                display: 'inline-block',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '5px',
                                padding: '3px 9px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: '#0f172a'
                              }}
                            >
                              {extractShortDate(seg.ArrivalDate)} • {extractTime(seg.ArrivalDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PASSENGER & E-TICKET MANIFEST */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: '#1B3664',
                    marginBottom: '8px'
                  }}
                >
                  Passenger & E-Ticket Manifest ({passengers.length})
                </div>

                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1B3664', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '9px 10px', width: '36px' }}>#</th>
                        <th style={{ padding: '9px 10px' }}>Passenger Name</th>
                        <th style={{ padding: '9px 10px' }}>Category</th>
                        <th style={{ padding: '9px 10px' }}>Date of Birth</th>
                        <th style={{ padding: '9px 10px' }}>Nationality</th>
                        <th style={{ padding: '9px 10px' }}>Passport No.</th>
                        <th style={{ padding: '9px 10px' }}>E-Ticket Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((p, idx) => (
                        <tr
                          key={p.PassengerID || idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: idx < passengers.length - 1 ? '1px solid #e2e8f0' : 'none'
                          }}
                        >
                          <td style={{ padding: '9px 10px', fontWeight: 700, color: '#64748b' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a' }}>
                            {p.Title} {p.FirstName} {p.LastName}
                          </td>
                          <td style={{ padding: '9px 10px', color: '#334155', fontWeight: 600 }}>
                            {p.PassengerType}
                          </td>
                          <td style={{ padding: '9px 10px', color: '#475569', fontFamily: 'monospace' }}>
                            {formatDobShort(p.DOB)}
                          </td>
                          <td style={{ padding: '9px 10px', color: '#475569', fontWeight: 600 }}>
                            {p.Nationality}
                          </td>
                          <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                            {p.PassportNumber}
                          </td>
                          <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontWeight: 700, color: isIssued ? '#047857' : '#64748b' }}>
                            {p.TicketNumber || 'PENDING ISSUANCE'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IMPORTANT NOTICES & CONDITIONS OF CARRIAGE */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  padding: '14px 16px',
                  marginBottom: '18px'
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '11.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#1e293b',
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: '6px',
                    marginBottom: '10px'
                  }}
                >
                  Important Travel Notices & Conditions of Carriage
                </div>

                <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#475569' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    داشتن ویزا ،معتبر واچر هتل و بلیط برگشت برای مسافران ایرانی هنگام ورود به پاکستان الزامی است
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    اگر از خروج یا ورود مسافران ایرانی توسط پلیس مهاجرت و گذرنامه جلوگیری شود تمام هزینه‌های مربوطه از جمله حمل و نقل برگشت و ،اقامتبر عهده مسافر خواهد بود شرکت هواپیمایی تابان هیچ مسئولیتی در این زمینه ندارد
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '10.5px' }}>
                    <div>• Check-in closes strictly 3 hours prior to departure.</div>
                    <div>• All tickets are non-refundable, non-transferable & non-endorsable.</div>
                    <div>• Valid passport and required visa must be presented at boarding.</div>
                    <div>• Passengers must carry a minimum of USD 350 for immigration check.</div>
                    <div>• Each passenger must submit 4 copies of their visa at the counter.</div>
                    <div>• No refund applies in case of no-show, offload, or force majeure.</div>
                  </div>
                </div>
              </div>

              {/* ISSUING OFFICE & ASSISTANCE CONTACT FOOTER */}
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
                        padding: '9px 16px',
                        backgroundColor: '#0F172A',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '0.6px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>For Any Assistance Please Contact Issuing Office</span>
                      <span style={{ fontSize: '10px', color: '#93c5fd', fontWeight: 600 }}>
                        24/7 Booking Support Desk
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '22px',
                        padding: '14px 20px',
                        backgroundColor: '#f8fafc'
                      }}
                    >
                      {/* Support Agent With Headset Icon */}
                      <div
                        style={{
                          flexShrink: 0,
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '6px'
                        }}
                      >
                        <svg
                          width="56"
                          height="56"
                          viewBox="0 0 80 80"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 36C20 24.402 28.9543 15 40 15C51.0457 15 60 24.402 60 36"
                            stroke="#2563EB"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <ellipse cx="40" cy="36" rx="13" ry="15" fill="#1E293B" />
                          <rect x="16" y="31" width="6" height="13" rx="3" fill="#2563EB" />
                          <rect x="58" y="31" width="6" height="13" rx="3" fill="#2563EB" />
                          <path
                            d="M21 42C21 46.5 29 47.5 38 47.5"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M20 42C20 46.5 28 47.5 38 47.5"
                            stroke="#1E293B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <circle cx="39" cy="47.5" r="2.2" fill="#ffffff" />
                          <path
                            d="M15 70C15 58.5 25 53 40 53C55 53 65 58.5 65 70H15Z"
                            fill="#1E293B"
                          />
                          <path d="M32 53L40 69L48 53H32Z" fill="#ffffff" />
                          <path d="M38 55H42L41.2 60L42.5 68L40 70L37.5 68L38.8 60L38 55Z" fill="#2563EB" />
                        </svg>
                      </div>

                      {/* Contact Details Grid */}
                      <div
                        style={{
                          flex: 1,
                          display: 'grid',
                          gridTemplateColumns: '1.3fr 1fr',
                          gap: '6px 20px',
                          fontSize: '12px',
                          color: '#1e293b'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Issuing Officer / Desk
                          </div>
                          <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                            {contactHeading}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Direct Helpline
                          </div>
                          <div style={{ fontWeight: 700, color: '#1B3664' }}>
                            {phoneVal}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Agency / Office Location
                          </div>
                          <div style={{ fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
                            {officeLine}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            Support Email
                          </div>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
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
    </div>
  );
}
