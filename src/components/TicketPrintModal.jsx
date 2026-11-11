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
  const statusLabel = isIssued ? 'TICKET ISSUED' : (booking.ApprovalStatus || 'BOOKED').toUpperCase();

  const handlePrint = () => {
    const content = printRef.current ? printRef.current.innerHTML : '';
    const win = window.open('', '_blank', 'width=900,height=950');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>E-Ticket Receipt — PNR ${booking.PNR}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
            background: #FFFFFF;
            color: #111827;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Action Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-7 h-7 rounded bg-white p-0.5 object-contain"
            />
            <div>
              <h3 className="font-semibold text-sm">
                Electronic Ticket & Itinerary — {booking.PNR}
              </h3>
              <p className="text-[11px] text-slate-400">
                Ref: {booking.AirGroupBookingID} • Status: {booking.ApprovalStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
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

        {/* Printable Document Body (Minimalist Clean Layout) */}
        <div className="p-5 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            style={{
              width: '780px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '24px 26px',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif"
            }}
          >
            {/* MINIMALIST HEADER */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '2px solid #111827',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={logoUrl}
                  alt="Taban Air"
                  style={{
                    width: '62px',
                    height: '62px',
                    objectFit: 'contain',
                    display: 'block',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '4px'
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      color: '#111827',
                      textTransform: 'uppercase'
                    }}
                  >
                    {booking.ValidatingCarrierName || 'Taban Airlines'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#4b5563',
                      fontWeight: 500,
                      marginTop: '2px'
                    }}
                  >
                    Electronic Passenger Ticket & Itinerary Receipt
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '2px'
                    }}
                  >
                    Booking Ref: {booking.AirGroupBookingID} • Agency ID: {booking.SubCompanyID || 'DIRECT'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px'
                  }}
                >
                  PNR / Status ({statusLabel})
                </div>
                <div
                  style={{
                    fontSize: '19px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '1.5px',
                    color: '#111827',
                    marginTop: '2px'
                  }}
                >
                  {booking.PNR}
                </div>
              </div>
            </div>

            {/* MINIMALIST SUMMARY BAR */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  !isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—'
                    ? 'repeat(4, 1fr)'
                    : 'repeat(3, 1fr)',
                gap: '10px',
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: '#f9fafb',
                marginBottom: '18px',
                fontSize: '11.5px'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  {isIssued ? 'Issue Date' : 'Booking Date'}
                </div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                  {isIssued ? (booking.ApprovalDateTime || booking.TimeStamp) : booking.TimeStamp}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Issuing Airline
                </div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                  {booking.ValidatingCarrierName || 'Taban Airlines'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Journey & Cabin
                </div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                  {booking.TripType || 'One Way'} • {booking.FlightCategory || 'Economy'}
                </div>
              </div>

              {!isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—' && (
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Booking Time Limit
                  </div>
                  <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                    {booking.BookingTimeLimit}
                  </div>
                </div>
              )}
            </div>

            {/* FLIGHT SECTORS */}
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#111827',
                  marginBottom: '8px'
                }}
              >
                Flight Itinerary
              </div>

              {segments.length === 0 ? (
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#4b5563'
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
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginBottom: idx < segments.length - 1 ? '10px' : 0
                      }}
                    >
                      {/* Clean Grey Top Strip */}
                      <div
                        style={{
                          backgroundColor: '#f3f4f6',
                          borderBottom: '1px solid #e5e7eb',
                          padding: '7px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11.5px',
                          color: '#1f2937'
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          Sector {idx + 1}: {seg.FlightNumber} • Aircraft: {seg.AirCraft || 'A320'}
                        </div>
                        <div style={{ color: '#374151', fontWeight: 600 }}>
                          Cabin: {seg.FlightClass || 'Economy'} ({seg.FlightClassCode || 'Y'}) &nbsp;|&nbsp; Baggage: ADT={adtBag}, CNN={cnnBag}, INF={infBag}
                        </div>
                      </div>

                      {/* 3-Column Route Row */}
                      <div
                        style={{
                          padding: '12px 16px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 110px 1fr',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '12px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                            Departure
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginTop: '1px' }}>
                            {seg.DepartureCity} ({seg.DepartureIata})
                          </div>
                          <div style={{ fontSize: '11px', color: '#4b5563' }}>{seg.DepartureAirport}</div>
                          <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                            {extractShortDate(seg.DepartureDate)} • {extractTime(seg.DepartureDate)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>
                          <div>{seg.FlightTime || 'Direct'}</div>
                          <div style={{ borderTop: '1px solid #9ca3af', margin: '5px 0' }} />
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>Confirmed</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                            Arrival
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginTop: '1px' }}>
                            {seg.ArrivalCity} ({seg.ArrivalIata})
                          </div>
                          <div style={{ fontSize: '11px', color: '#4b5563' }}>{seg.ArrivalAirport}</div>
                          <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                            {extractShortDate(seg.ArrivalDate)} • {extractTime(seg.ArrivalDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PASSENGER TABLE */}
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#111827',
                  marginBottom: '8px'
                }}
              >
                Passenger Details ({passengers.length})
              </div>

              <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', color: '#1f2937' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700 }}>
                      <th style={{ padding: '8px 10px', width: '34px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Passenger Name</th>
                      <th style={{ padding: '8px 10px' }}>Type</th>
                      <th style={{ padding: '8px 10px' }}>DOB</th>
                      <th style={{ padding: '8px 10px' }}>Nationality</th>
                      <th style={{ padding: '8px 10px' }}>Passport No.</th>
                      <th style={{ padding: '8px 10px' }}>Ticket Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p, idx) => (
                      <tr
                        key={p.PassengerID || idx}
                        style={{
                          borderBottom: idx < passengers.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        <td style={{ padding: '8px 10px', color: '#6b7280' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#111827' }}>
                          {p.Title} {p.FirstName} {p.LastName}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{p.PassengerType}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{formatDobShort(p.DOB)}</td>
                        <td style={{ padding: '8px 10px' }}>{p.Nationality}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600 }}>
                          {p.PassportNumber}
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {p.TicketNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <div
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  color: '#111827',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '6px',
                  marginBottom: '8px'
                }}
              >
                Terms & Conditions of Carriage
              </div>

              <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#374151' }}>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  داشتن ویزا ،معتبر واچر هتل و بلیط برگشت برای مسافران ایرانی هنگام ورود به پاکستان الزامی است
                </div>
                <div style={{ marginBottom: '6px' }}>
                  اگر از خروج یا ورود مسافران ایرانی توسط پلیس مهاجرت و گذرنامه جلوگیری شود تمام هزینه‌های مربوطه از جمله حمل و نقل برگشت و ،اقامتبر عهده مسافر خواهد بود شرکت هواپیمایی تابان هیچ مسئولیتی در این زمینه ندارد
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', fontSize: '10.5px', color: '#4b5563' }}>
                  <div>• Check-in closes 3 hours prior to scheduled departure.</div>
                  <div>• All tickets are non-refundable and non-transferable.</div>
                  <div>• Valid passport and visa must be presented at check-in.</div>
                  <div>• Minimum USD 350 cash must be carried per passenger.</div>
                  <div>• Four (4) copies of visa are required at boarding counter.</div>
                  <div>• No refund applies in cases of no-show, offload, or force majeure.</div>
                </div>
              </div>
            </div>

            {/* MINIMALIST OFFICE ASSISTANCE BOX */}
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
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f3f4f6',
                      borderBottom: '1px solid #d1d5db',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#111827',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase'
                    }}
                  >
                    For Any Assistance Please Contact Our Office
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '22px',
                      padding: '14px 18px'
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <svg
                        width="52"
                        height="52"
                        viewBox="0 0 80 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 36C20 24.402 28.9543 15 40 15C51.0457 15 60 24.402 60 36"
                          stroke="#374151"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <ellipse cx="40" cy="36" rx="13" ry="15" fill="#1F2937" />
                        <rect x="16" y="31" width="6" height="13" rx="3" fill="#4B5563" />
                        <rect x="58" y="31" width="6" height="13" rx="3" fill="#4B5563" />
                        <path
                          d="M20 42C20 46.5 28 47.5 38 47.5"
                          stroke="#374151"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="39" cy="47.5" r="2" fill="#ffffff" />
                        <path
                          d="M15 70C15 58.5 25 53 40 53C55 53 65 58.5 65 70H15Z"
                          fill="#1F2937"
                        />
                        <path d="M32 53L40 69L48 53H32Z" fill="#ffffff" />
                        <path d="M38 55H42L41.2 60L42.5 68L40 70L37.5 68L38.8 60L38 55Z" fill="#4B5563" />
                      </svg>
                    </div>

                    <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#111827' }}>
                      <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                        {contactHeading}
                      </div>
                      <div style={{ textTransform: 'uppercase', color: '#374151' }}>
                        {officeLine}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700 }}>PHONE:</span> {phoneVal}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700 }}>EMAIL:</span> {emailVal}
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
