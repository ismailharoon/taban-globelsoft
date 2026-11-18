import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { initialSeedData } from '../data/seedData';
import {
  hashPassword,
  verifyPassword,
  isPasswordHashed,
  validateStrongPassword,
  generateTotpSecret,
  deriveDefaultTotpSecret,
  verifyTotpToken,
  buildOtpAuthUri
} from '../utils/security';

const PortalContext = createContext(null);
const STORAGE_KEY = 'ota_portal_clean_v1';

export const ALL_ADMIN_PERMISSIONS = {
  dashboard: true,
  searchFlight: true,
  bookings: true,
  bookingActions: true,
  segments: true,
  flights: true,
  subAgents: true
};

const DEFAULT_MASTER_ADMIN = {
  AdminID: 'ADM-MASTER',
  LoginID: 'test',
  PassCode: 'test123',
  FullName: 'Master Admin',
  Email: 'admin@bookly.com',
  Designation: 'Master Administrator',
  Role: 'Master Admin',
  AccountStatus: 'Enable',
  Permissions: { ...ALL_ADMIN_PERMISSIONS },
  Created: 'System Default'
};

// Purge any old demo storage keys so existing browsers immediately see a fresh state
try {
  localStorage.removeItem('taban_executive_db_v1');
  localStorage.removeItem('taban_executive_db_v2');
} catch {}

function formatNow() {
  const d = new Date();
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function generatePNR(prefix = 'PN') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = (prefix || 'PN').slice(0, 2).toUpperCase();
  for (let i = 0; i < 4; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function loadLocalDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.bookings)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local DB, seeding fresh state:', e);
  }
  const fresh = JSON.parse(JSON.stringify(initialSeedData));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

export function calculateSegmentPassengerTotal(
  seg,
  adults = 1,
  children = 0,
  infants = 0,
  isRoundTrip = false
) {
  if (!seg) return { adtTotal: 0, cnnTotal: 0, infTotal: 0, total: 0, adtUnit: 0, cnnUnit: 0, infUnit: 0 };

  const adtCount = Number(adults) || 0;
  const cnnCount = Number(children) || 0;
  const infCount = Number(infants) || 0;

  const t1 = Number(seg.Tier1Seats) || 0;
  const t2 = Number(seg.Tier2Seats) || 0;
  const t3 = Number(seg.Tier3Seats) || 0;
  const hasTiers = t1 + t2 + t3 > 0;

  const getTierFares = (tierNum) => {
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
    const prefix = `Tier${tierNum}`;
    const oneWayAdt = Number(seg[`${prefix}AdultPrice`] ?? seg.AdultPrice) || 0;
    const oneWayCnn = Number(seg[`${prefix}ChildPrice`] ?? seg.ChildPrice) || 0;
    const oneWayInf = Number(seg[`${prefix}InfantPrice`] ?? seg.InfantPrice) || 0;

    const retAdt = Number(seg[`${prefix}ReturnAdultPrice`] ?? seg.ReturnAdultPrice) || 0;
    const retCnn = Number(seg[`${prefix}ReturnChildPrice`] ?? seg.ReturnChildPrice) || 0;
    const retInf = Number(seg[`${prefix}ReturnInfantPrice`] ?? seg.ReturnInfantPrice) || 0;

    return {
      adt: isRoundTrip && retAdt > 0 ? retAdt : oneWayAdt,
      cnn: isRoundTrip && retCnn > 0 ? retCnn : oneWayCnn,
      inf: isRoundTrip && retInf > 0 ? retInf : oneWayInf
    };
  };

  const getTierForSeatIndex = (seatIdx) => {
    if (!hasTiers) return 1;
    if (t1 > 0 && seatIdx < t1) return 1;
    if (t2 > 0 && seatIdx < t1 + t2) return 2;
    return 3;
  };

  const startBooked = Number(seg.BookedSeats) || 0;
  let seatCursor = startBooked;

  let adtTotal = 0;
  for (let i = 0; i < adtCount; i++) {
    const tier = getTierForSeatIndex(seatCursor);
    adtTotal += getTierFares(tier).adt;
    seatCursor++;
  }

  let cnnTotal = 0;
  for (let i = 0; i < cnnCount; i++) {
    const tier = getTierForSeatIndex(seatCursor);
    cnnTotal += getTierFares(tier).cnn;
    seatCursor++;
  }

  const activeTier = getTierForSeatIndex(startBooked);
  const activeFares = getTierFares(activeTier);
  const infTotal = infCount * activeFares.inf;

  return {
    adtTotal,
    cnnTotal,
    infTotal,
    total: adtTotal + cnnTotal + infTotal,
    adtUnit: adtCount > 0 ? Math.round(adtTotal / adtCount) : activeFares.adt,
    cnnUnit: cnnCount > 0 ? Math.round(cnnTotal / cnnCount) : activeFares.cnn,
    infUnit: activeFares.inf
  };
}

function formatSaleTransactionDescription(booking) {
  if (!booking) return '';
  const segs = Array.isArray(booking.Segments) ? booking.Segments : [];
  const firstSeg = segs[0];
  let datePart = '';
  if (firstSeg?.DepartureDate) {
    const d = new Date(firstSeg.DepartureDate);
    if (!isNaN(d.getTime())) {
      const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      datePart = `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}`;
    }
  }
  let routePart = '';
  if (segs.length === 1) {
    routePart = `${segs[0].DepartureIata}-${segs[0].ArrivalIata}`;
  } else if (segs.length > 1) {
    routePart = `${segs[0].DepartureIata}-${segs.map((s) => s.ArrivalIata).join('-')}`;
  } else if (booking.FlightTitle) {
    const m = String(booking.FlightTitle).match(/([A-Z]{3})\s*(?:→|⇄|->|-)\s*([A-Z]{3})/i);
    if (m) routePart = `${m[1].toUpperCase()}-${m[2].toUpperCase()}`;
  }
  const tripPart = String(booking.TripType || 'ONEWAY')
    .toUpperCase()
    .replace(/\s+/g, '');
  const adtCnn = (Number(booking.AdultCount) || 0) + (Number(booking.ChildCount) || 0) || 1;
  const inf = Number(booking.InfantCount) || 0;
  const paxPart = inf > 0 ? `${adtCnn} PAX + ${inf}` : `${adtCnn} PAX`;
  return [datePart, routePart, tripPart, paxPart].filter(Boolean).join(' ');
}

function computeEnriched(db) {
  const rawSegments = db.segments || [];
  const rawFlights = db.flights || [];
  const rawBookings = db.bookings || [];
  const rawSubAgents = db.subAgents || [];

  const flightsById = Object.fromEntries(rawFlights.map((f) => [f.AirGroupID, f]));
  const agentsById = Object.fromEntries(rawSubAgents.map((a) => [a.SubCompanyID, a]));

  // Calculate booked seats per segment across both direct segment bookings and group flight bookings
  const segments = rawSegments.map((s) => {
    const segBookings = rawBookings.filter((b) => {
      if (
        b.ApprovalStatus === 'Rejected' ||
        b.ApprovalStatus === 'Ticket Void' ||
        b.ApprovalStatus === 'Cancelled'
      ) {
        return false;
      }
      if (Array.isArray(b.SegmentIDs) && b.SegmentIDs.includes(s.AirGroupSegmentID)) return true;
      if (b.AirGroupSegmentID === s.AirGroupSegmentID) return true;
      const fl = flightsById[b.AirGroupID];
      if (fl && Array.isArray(fl.SegmentIDs) && fl.SegmentIDs.includes(s.AirGroupSegmentID)) {
        return true;
      }
      return false;
    });

    const bookedSeats = segBookings.reduce(
      (sum, b) => sum + (Number(b.AdultCount) || 0) + (Number(b.ChildCount) || 0),
      0
    );

    const t1Seats = Number(s.Tier1Seats) || 0;
    const t2Seats = Number(s.Tier2Seats) || 0;
    const t3Seats = Number(s.Tier3Seats) || 0;
    const hasTiers = t1Seats + t2Seats + t3Seats > 0;

    const totalSeats = hasTiers ? t1Seats + t2Seats + t3Seats : Number(s.TotalSeats) || 0;
    const seatsLeft = Math.max(0, totalSeats - bookedSeats);

    const tier1Left = Math.max(0, t1Seats - bookedSeats);
    const tier2Left = Math.max(0, Math.min(t2Seats, t1Seats + t2Seats - bookedSeats));
    const tier3Left = Math.max(0, Math.min(t3Seats, t1Seats + t2Seats + t3Seats - bookedSeats));

    let activeTier = 1;
    let activeTierSeatsLeft = seatsLeft;
    let adultPrice = Number(s.AdultPrice) || 0;
    let childPrice = Number(s.ChildPrice) || 0;
    let infantPrice = Number(s.InfantPrice) || 0;
    let returnAdultPrice = Number(s.ReturnAdultPrice) || 0;
    let returnChildPrice = Number(s.ReturnChildPrice) || 0;
    let returnInfantPrice = Number(s.ReturnInfantPrice) || 0;

    if (hasTiers) {
      if (t1Seats > 0 && bookedSeats < t1Seats) {
        activeTier = 1;
        activeTierSeatsLeft = tier1Left;
        adultPrice = Number(s.Tier1AdultPrice ?? s.AdultPrice) || 0;
        childPrice = Number(s.Tier1ChildPrice ?? s.ChildPrice) || 0;
        infantPrice = Number(s.Tier1InfantPrice ?? s.InfantPrice) || 0;
        returnAdultPrice = Number(s.Tier1ReturnAdultPrice ?? s.ReturnAdultPrice) || 0;
        returnChildPrice = Number(s.Tier1ReturnChildPrice ?? s.ReturnChildPrice) || 0;
        returnInfantPrice = Number(s.Tier1ReturnInfantPrice ?? s.ReturnInfantPrice) || 0;
      } else if (t2Seats > 0 && bookedSeats < t1Seats + t2Seats) {
        activeTier = 2;
        activeTierSeatsLeft = tier2Left;
        adultPrice = Number(s.Tier2AdultPrice ?? s.AdultPrice) || 0;
        childPrice = Number(s.Tier2ChildPrice ?? s.ChildPrice) || 0;
        infantPrice = Number(s.Tier2InfantPrice ?? s.InfantPrice) || 0;
        returnAdultPrice = Number(s.Tier2ReturnAdultPrice ?? s.ReturnAdultPrice) || 0;
        returnChildPrice = Number(s.Tier2ReturnChildPrice ?? s.ReturnChildPrice) || 0;
        returnInfantPrice = Number(s.Tier2ReturnInfantPrice ?? s.ReturnInfantPrice) || 0;
      } else {
        activeTier = 3;
        activeTierSeatsLeft = tier3Left;
        adultPrice = Number(s.Tier3AdultPrice ?? s.AdultPrice) || 0;
        childPrice = Number(s.Tier3ChildPrice ?? s.ChildPrice) || 0;
        infantPrice = Number(s.Tier3InfantPrice ?? s.InfantPrice) || 0;
        returnAdultPrice = Number(s.Tier3ReturnAdultPrice ?? s.ReturnAdultPrice) || 0;
        returnChildPrice = Number(s.Tier3ReturnChildPrice ?? s.ReturnChildPrice) || 0;
        returnInfantPrice = Number(s.Tier3ReturnInfantPrice ?? s.ReturnInfantPrice) || 0;
      }
    }

    return {
      ...s,
      TotalSeats: totalSeats,
      BookedSeats: bookedSeats,
      SeatsLeft: seatsLeft,
      AvailableSeats: seatsLeft,
      HasTiers: hasTiers,
      ActiveTier: activeTier,
      ActiveTierSeatsLeft: activeTierSeatsLeft,
      Tier1Left: tier1Left,
      Tier2Left: tier2Left,
      Tier3Left: tier3Left,
      AdultPrice: adultPrice,
      ChildPrice: childPrice,
      InfantPrice: infantPrice,
      ReturnAdultPrice: returnAdultPrice,
      ReturnChildPrice: returnChildPrice,
      ReturnInfantPrice: returnInfantPrice
    };
  });

  const segmentsById = Object.fromEntries(segments.map((s) => [s.AirGroupSegmentID, s]));

  const flights = rawFlights.map((f) => {
    const groupBookings = rawBookings.filter((b) => b.AirGroupID === f.AirGroupID);
    const activeBookings = groupBookings.filter(
      (b) =>
        b.ApprovalStatus !== 'Rejected' &&
        b.ApprovalStatus !== 'Ticket Void' &&
        b.ApprovalStatus !== 'Cancelled'
    );
    const bookedSeats = activeBookings.reduce(
      (sum, b) => sum + (Number(b.AdultCount) || 0) + (Number(b.ChildCount) || 0),
      0
    );
    const pendingCount = groupBookings.filter((b) => b.ApprovalStatus === 'Pending').length;
    const attachedSegments = (f.SegmentIDs || [])
      .map((id) => segmentsById[id])
      .filter(Boolean);
    const firstSeg = attachedSegments[0];
    return {
      ...f,
      GroupDepartureDate: firstSeg ? firstSeg.DepartureDate : f.GroupDepartureDate,
      GroupDepartureIata: firstSeg ? firstSeg.DepartureIata : f.GroupDepartureIata,
      TotalSeatsSegment: f.TotalSeats,
      SeatsLeft: Math.max(0, (Number(f.TotalSeats) || 0) - bookedSeats),
      TotalBookings: groupBookings.length,
      ApprovalPending: pendingCount,
      Segments: attachedSegments
    };
  });

  const enrichedFlightsById = Object.fromEntries(flights.map((f) => [f.AirGroupID, f]));

  const bookings = rawBookings.map((b) => {
    const flight = enrichedFlightsById[b.AirGroupID];
    const directSegments = Array.isArray(b.SegmentIDs)
      ? b.SegmentIDs.map((id) => segmentsById[id]).filter(Boolean)
      : b.AirGroupSegmentID && segmentsById[b.AirGroupSegmentID]
      ? [segmentsById[b.AirGroupSegmentID]]
      : [];

    const resolvedSegments =
      directSegments.length > 0
        ? directSegments
        : flight
        ? flight.Segments
        : Array.isArray(b.Segments)
        ? b.Segments
        : [];

    const firstSeg = resolvedSegments[0];
    const lastSeg = resolvedSegments[resolvedSegments.length - 1];
    const autoTitle =
      firstSeg && lastSeg
        ? resolvedSegments.length > 1
          ? `${firstSeg.FlightNumber} • ${firstSeg.DepartureIata} → ${lastSeg.ArrivalIata} (${resolvedSegments.length} Legs)`
          : `${firstSeg.FlightNumber} • ${firstSeg.DepartureIata} → ${firstSeg.ArrivalIata}`
        : 'Flight Booking';

    const agentObj = b.SubCompanyID ? agentsById[b.SubCompanyID] : null;
    const matchedAgentUser = agentObj?.Users?.find(
      (u) => u.LoginID && b.BookedByLoginID && u.LoginID.toLowerCase() === b.BookedByLoginID.toLowerCase()
    );

    const agentDetails = agentObj
      ? {
          ContactPerson:
            matchedAgentUser?.Designation ||
            matchedAgentUser?.FullName ||
            agentObj.Users?.[0]?.Designation ||
            agentObj.Users?.[0]?.FullName ||
            'MAIN CONTROLLER',
          CompanyName: agentObj.CompanyName || b.SubCompanyName || '',
          Address: agentObj.Address || '',
          City: agentObj.City || '',
          Phone: agentObj.MobileNumber || b.MobileNumber || '',
          Email: agentObj.Email || b.EmailAddress || ''
        }
      : b.AgentDetails || null;

    return {
      ...b,
      FlightTitle: b.FlightTitle || (flight ? flight.Title : autoTitle),
      FlightCategory: b.FlightCategory || (flight ? flight.Category : firstSeg?.FlightClass || 'Economy'),
      TripType: b.TripType || (flight ? flight.TripType : resolvedSegments.length > 1 ? 'Round Trip' : 'One Way'),
      Segments: resolvedSegments,
      AgentDetails: agentDetails
    };
  });

  const totalUsers = (db.subAgents || []).reduce(
    (acc, sa) => acc + (sa.Users ? sa.Users.length : 0),
    0
  );
  const validSalesBookings = bookings.filter(
    (b) =>
      b.ApprovalStatus !== 'Rejected' &&
      b.ApprovalStatus !== 'Ticket Void' &&
      b.ApprovalStatus !== 'Cancelled'
  );
  const totalSales = validSalesBookings.reduce((acc, b) => acc + (Number(b.TotalPrice) || 0), 0);

  const bookingsByPnr = Object.fromEntries(bookings.map((b) => [b.PNR, b]));
  const enrichedTransactions = (db.creditTransactions || []).map((tx) => {
    if (tx.Type === 'DEBIT' && tx.ReferencePNR && bookingsByPnr[tx.ReferencePNR]) {
      const formatted = formatSaleTransactionDescription(bookingsByPnr[tx.ReferencePNR]);
      if (formatted) {
        return { ...tx, Description: formatted };
      }
    }
    return tx;
  });

  const rawAdmins = Array.isArray(db.adminUsers) ? db.adminUsers : [];
  const hasMasterInDb = rawAdmins.some(
    (a) =>
      a.Role === 'Master Admin' ||
      (a.LoginID && a.LoginID.toLowerCase() === DEFAULT_MASTER_ADMIN.LoginID.toLowerCase())
  );
  const adminUsers = hasMasterInDb ? rawAdmins : [DEFAULT_MASTER_ADMIN, ...rawAdmins];

  return {
    stats: {
      TotalSubAgents: (db.subAgents || []).length,
      TotalBookings: bookings.length,
      TotalUsers: totalUsers,
      TotalBookingPrice: totalSales
    },
    airports: initialSeedData.airports,
    airlines: db.airlines || initialSeedData.airlines || [],
    suppliers: db.suppliers || initialSeedData.suppliers || [],
    segments,
    flights,
    bookings,
    subAgents: db.subAgents || [],
    creditTransactions: enrichedTransactions,
    adminUsers
  };
}

export function PortalProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ota_portal_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed?.LoginID?.toLowerCase() === 'atta') {
        localStorage.removeItem('ota_portal_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [dbState, setDbState] = useState(() => loadLocalDb());
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const isSavingRef = useRef(false);

  const addToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const fetchRemoteDb = useCallback(async () => {
    if (isSavingRef.current) return;
    try {
      const res = await fetch('/api/db', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok && data.state) {
        setDbState(data.state);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
        } catch {}
      }
    } catch {
      // Fallback to local state when running offline
    }
  }, []);

  useEffect(() => {
    fetchRemoteDb();
    const interval = setInterval(fetchRemoteDb, 4000);
    const handleFocus = () => fetchRemoteDb();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchRemoteDb]);

  const saveRemoteDb = useCallback(async (nextState) => {
    isSavingRef.current = true;
    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.state) {
          setDbState(data.state);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Cloud DB sync warning:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const updateLocalDb = useCallback(
    (updater) => {
      setDbState((prev) => {
        const next =
          typeof updater === 'function' ? updater(JSON.parse(JSON.stringify(prev))) : updater;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        saveRemoteDb(next);
        return next;
      });
    },
    [saveRemoteDb]
  );

  // Auto-cancel expired unissued Sub-Agent bookings (Main Admin / DIRECT bookings never expire)
  useEffect(() => {
    const checkExpiredBookings = () => {
      const nowMs = Date.now();
      const hasExpired = (dbState.bookings || []).some((b) => {
        if (!b.SubCompanyID || b.SubCompanyID === 'DIRECT') return false;
        if (
          b.ApprovalStatus === 'Ticket Issued' ||
          b.ApprovalStatus === 'Cancelled' ||
          b.ApprovalStatus === 'Rejected' ||
          b.ApprovalStatus === 'Ticket Void'
        ) {
          return false;
        }
        if (!b.PnrExpiresAt) return false;
        const expMs = new Date(b.PnrExpiresAt).getTime();
        return !isNaN(expMs) && nowMs >= expMs;
      });

      if (!hasExpired) return;

      updateLocalDb((draft) => {
        const currentMs = Date.now();
        draft.bookings = (draft.bookings || []).map((b) => {
          if (!b.SubCompanyID || b.SubCompanyID === 'DIRECT') return b;
          if (
            b.ApprovalStatus === 'Ticket Issued' ||
            b.ApprovalStatus === 'Cancelled' ||
            b.ApprovalStatus === 'Rejected' ||
            b.ApprovalStatus === 'Ticket Void'
          ) {
            return b;
          }
          if (!b.PnrExpiresAt) return b;
          const expMs = new Date(b.PnrExpiresAt).getTime();
          if (!isNaN(expMs) && currentMs >= expMs) {
            return {
              ...b,
              ApprovalStatus: 'Cancelled',
              VoidLoginID: 'SYSTEM (PNR EXPIRED)',
              VoidDateTime: formatNow(),
              VoidReason: 'Auto-cancelled: PNR expiry time elapsed before ticket issuance'
            };
          }
          return b;
        });
        return draft;
      });
    };

    checkExpiredBookings();
    const expInterval = setInterval(checkExpiredBookings, 15000);
    return () => clearInterval(expInterval);
  }, [dbState.bookings, updateLocalDb]);

  const enriched = React.useMemo(() => computeEnriched(dbState), [dbState]);

  const isAdmin = !user || user.SubCompanyID === 'ADMIN';
  const isSubAgent = Boolean(user && user.SubCompanyID && user.SubCompanyID !== 'ADMIN');

  const liveAdminRecord = React.useMemo(() => {
    if (!isAdmin || !user?.LoginID) return null;
    return (
      (enriched.adminUsers || []).find(
        (a) => a.LoginID && a.LoginID.toLowerCase() === user.LoginID.toLowerCase()
      ) || null
    );
  }, [isAdmin, user, enriched.adminUsers]);

  const isMasterAdmin = Boolean(
    isAdmin &&
      user &&
      (liveAdminRecord?.Role === 'Master Admin' ||
        user.Role === 'Master Admin' ||
        user.AccountType === 'Master Admin' ||
        user.AccountType === 'Administrator')
  );

  const hasPermission = useCallback(
    (permKey) => {
      if (isSubAgent) return false;
      if (isMasterAdmin) return true;
      const perms = liveAdminRecord?.Permissions || user?.Permissions || {};
      return Boolean(perms[permKey]);
    },
    [isSubAgent, isMasterAdmin, liveAdminRecord, user]
  );

  const login = async (loginId, password, require2FA = false) => {
    if (!loginId || !password) {
      throw new Error('Please enter both Login ID and Password.');
    }

    const cleanLogin = String(loginId).trim().toLowerCase();
    let matchedUser = null;
    let matchedAgent = null;

    // 1. Check Admin / Master Admin accounts first
    for (const adm of enriched.adminUsers || []) {
      if (
        adm.LoginID &&
        adm.LoginID.trim().toLowerCase() === cleanLogin &&
        (await verifyPassword(password, adm.PassCode))
      ) {
        matchedUser = {
          UserID: adm.AdminID || `ADM-${adm.LoginID}`,
          LoginID: adm.LoginID,
          FullName: adm.FullName || adm.LoginID,
          Email: adm.Email || 'admin@bookly.com',
          Designation: adm.Designation || adm.Role || 'Admin',
          Role: adm.Role || 'Admin',
          AccountType: adm.Role === 'Master Admin' ? 'Master Admin' : 'Admin',
          AccountStatus: adm.AccountStatus || 'Enable',
          TwoFactorSecret: adm.TwoFactorSecret || '',
          TwoFactorEnrolled: Boolean(adm.TwoFactorEnrolled && !adm.Reset2FA),
          Reset2FA: Boolean(adm.Reset2FA),
          Permissions:
            adm.Role === 'Master Admin'
              ? { ...ALL_ADMIN_PERMISSIONS }
              : { ...(adm.Permissions || {}) }
        };
        break;
      }
    }

    // 2. Check Sub-Agent accounts
    if (!matchedUser) {
      for (const agent of dbState.subAgents || []) {
        for (const u of agent.Users || []) {
          if (
            u.LoginID &&
            u.LoginID.trim().toLowerCase() === cleanLogin &&
            (await verifyPassword(password, u.PassCode))
          ) {
            matchedUser = u;
            matchedAgent = agent;
            break;
          }
        }
        if (
          !matchedUser &&
          agent.LoginID &&
          agent.LoginID.trim().toLowerCase() === cleanLogin &&
          (await verifyPassword(password, agent.PassCode))
        ) {
          matchedUser = {
            UserID: `USR-${agent.SubCompanyID}`,
            LoginID: agent.LoginID,
            FullName: agent.CompanyName,
            Email: agent.Email || '',
            Designation: 'Sub Agent',
            AccountType: 'Sub Agent',
            AccountStatus: agent.AccountStatus || 'Enable',
            TwoFactorSecret: agent.TwoFactorSecret || '',
            TwoFactorEnrolled: Boolean(agent.TwoFactorEnrolled && !agent.Reset2FA),
            Reset2FA: Boolean(agent.Reset2FA)
          };
          matchedAgent = agent;
        }
        if (matchedUser) break;
      }
    }

    if (!matchedUser) {
      throw new Error('Invalid Login ID or Password.');
    }

    if (matchedUser.AccountStatus === 'Disable' || matchedAgent?.AccountStatus === 'Disable') {
      throw new Error('Your user or agency account is currently disabled.');
    }

    const userObj = {
      LoginID: matchedUser.LoginID,
      FullName: matchedUser.FullName,
      Email: matchedUser.Email,
      Designation: matchedUser.Designation,
      Role: matchedAgent ? 'Sub Agent' : matchedUser.Role || matchedUser.AccountType,
      AccountType: matchedAgent ? 'Sub Agent' : matchedUser.AccountType,
      Permissions: matchedAgent ? null : matchedUser.Permissions || {},
      SubCompanyID: matchedAgent?.SubCompanyID || 'ADMIN',
      SubCompanyName: matchedAgent?.CompanyName || 'Bookly'
    };

    const isEnrolled = Boolean(matchedUser.TwoFactorEnrolled && !matchedUser.Reset2FA);
    const activeSecret =
      matchedUser.TwoFactorSecret || deriveDefaultTotpSecret(matchedUser.LoginID);

    if (require2FA || isEnrolled) {
      return {
        status: '2fa_required',
        isEnrolled,
        manualKey: isEnrolled ? '' : activeSecret,
        otpAuthUri: isEnrolled
          ? ''
          : buildOtpAuthUri(matchedUser.LoginID, activeSecret, 'Bookly'),
        secret: activeSecret,
        user: userObj
      };
    }

    setUser(userObj);
    localStorage.setItem('ota_portal_user', JSON.stringify(userObj));
    addToast(`Welcome, ${userObj.FullName || userObj.LoginID}`, 'success');
    return { status: 'authenticated', user: userObj };
  };

  const verifyOtpAndFinishLogin = async (pendingUser, otp, secretFromLogin) => {
    const cleanOtp = String(otp || '').replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanOtp)) {
      throw new Error('Please enter the 6-digit code from your Google Authenticator app.');
    }

    const secretToVerify =
      secretFromLogin || deriveDefaultTotpSecret(pendingUser?.LoginID || 'user');
    const isValid = await verifyTotpToken(secretToVerify, cleanOtp, 1);
    if (!isValid) {
      throw new Error(
        'Invalid 6-digit Google Authenticator code. Please check your app and try again.'
      );
    }

    // Persist TwoFactorEnrolled = true and TwoFactorSecret so future logins only ask for the 6-digit code
    const cleanLogin = String(pendingUser?.LoginID || '').toLowerCase();
    updateLocalDb((draft) => {
      if (pendingUser?.SubCompanyID === 'ADMIN') {
        const currentList = Array.isArray(draft.adminUsers) ? draft.adminUsers : [];
        const hasMaster = currentList.some(
          (a) =>
            a.Role === 'Master Admin' ||
            (a.LoginID && a.LoginID.toLowerCase() === DEFAULT_MASTER_ADMIN.LoginID.toLowerCase())
        );
        const list = hasMaster ? [...currentList] : [{ ...DEFAULT_MASTER_ADMIN }, ...currentList];
        const idx = list.findIndex(
          (a) => a.LoginID && a.LoginID.toLowerCase() === cleanLogin
        );
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            TwoFactorSecret: secretToVerify,
            TwoFactorEnrolled: true,
            Reset2FA: false
          };
        }
        draft.adminUsers = list;
      } else {
        for (const ag of draft.subAgents || []) {
          if (ag.LoginID && ag.LoginID.toLowerCase() === cleanLogin) {
            ag.TwoFactorSecret = secretToVerify;
            ag.TwoFactorEnrolled = true;
            ag.Reset2FA = false;
          }
          if (Array.isArray(ag.Users)) {
            ag.Users = ag.Users.map((u) =>
              u.LoginID && u.LoginID.toLowerCase() === cleanLogin
                ? {
                    ...u,
                    TwoFactorSecret: secretToVerify,
                    TwoFactorEnrolled: true,
                    Reset2FA: false
                  }
                : u
            );
          }
        }
      }
      return draft;
    });

    setUser(pendingUser);
    localStorage.setItem('ota_portal_user', JSON.stringify(pendingUser));
    addToast(`Google Authenticator Verified. Welcome, ${pendingUser.FullName}`, 'success');
    return { status: 'authenticated' };
  };

  const logout = () => {
    setUser(null);
    setShowTimeoutModal(false);
    localStorage.removeItem('ota_portal_user');
    addToast('Signed out successfully.', 'info');
  };

  const resetDemoData = async () => {
    const fresh = JSON.parse(JSON.stringify(initialSeedData));
    updateLocalDb(fresh);
    addToast('All portal records cleared (Fresh state).', 'info');
  };

  // --- Booking mutations ---
  const createBooking = async (bookingPayload) => {
    const {
      AirGroupID,
      SegmentIDs = [],
      TripType = 'One Way',
      SubCompanyID,
      EmailAddress,
      MobileNumber,
      Remarks,
      Passengers = [],
      ExpectedTotalPrice,
      BookingChannelName = 'Flight POS Desk'
    } = bookingPayload;

    // Fetch latest state from server right before booking so concurrent bookings within 1-2s use live seat counts & rates
    let latestDb = dbState;
    try {
      const res = await fetch('/api/db', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.state) {
          latestDb = data.state;
        }
      }
    } catch {
      // Fallback to local state if offline
    }
    const liveEnriched = computeEnriched(latestDb);

    const selectedSegments = (SegmentIDs || [])
      .map((id) => (liveEnriched.segments || []).find((s) => s.AirGroupSegmentID === id))
      .filter(Boolean);

    const flight = AirGroupID
      ? (latestDb.flights || []).find((f) => f.AirGroupID === AirGroupID)
      : null;

    if (selectedSegments.length === 0 && !flight) {
      throw new Error('Please select at least one Flight Segment to book.');
    }

    const effectiveSubCompanyID = isSubAgent ? user.SubCompanyID : 'DIRECT';

    const agent =
      isSubAgent && effectiveSubCompanyID && effectiveSubCompanyID !== 'DIRECT'
        ? (latestDb.subAgents || []).find((a) => a.SubCompanyID === effectiveSubCompanyID)
        : null;

    const resolvedCompanyId = agent ? agent.SubCompanyID : isSubAgent ? user.SubCompanyID : 'DIRECT';
    const resolvedCompanyName = agent
      ? agent.CompanyName
      : isSubAgent
      ? user.SubCompanyName
      : 'Bookly Direct Desk';

    if (!Passengers.length) throw new Error('Please add at least one passenger.');

    const adults = Passengers.filter((p) => p.PassengerType === 'Adult').length;
    const children = Passengers.filter((p) => p.PassengerType === 'Child').length;
    const infants = Passengers.filter((p) => p.PassengerType === 'Infant').length;
    const seatedNeeded = adults + children;

    if (isSubAgent && seatedNeeded > 9) {
      throw new Error(
        'Sub-Agents can book a maximum of 9 passengers (Adults + Children) per booking.'
      );
    }

    // Check live seat availability on each selected segment
    for (const seg of selectedSegments) {
      const left = Number(seg.SeatsLeft) || 0;
      if (left < seatedNeeded) {
        setDbState(latestDb);
        throw new Error(
          `Only ${left} seat(s) left on ${seg.FlightNumber} (${seg.DepartureIata} → ${seg.ArrivalIata}). Cannot book ${seatedNeeded} seats.`
        );
      }
    }

    let totalPrice = 0;
    const isRoundTrip = TripType === 'Round Trip';
    if (selectedSegments.length > 0) {
      selectedSegments.forEach((seg) => {
        const segFare = calculateSegmentPassengerTotal(
          seg,
          adults,
          children,
          infants,
          isRoundTrip
        );
        totalPrice += segFare.total;
      });
    } else if (flight) {
      totalPrice =
        adults * (Number(flight.AdultPrice) || 0) +
        children * (Number(flight.ChildPrice) || 0) +
        infants * (Number(flight.InfantPrice) || 0);
    }

    // If fare changed due to another concurrent booking, update UI and ask user to confirm the new fare
    if (
      ExpectedTotalPrice !== undefined &&
      Number(ExpectedTotalPrice) > 0 &&
      Number(ExpectedTotalPrice) !== totalPrice
    ) {
      setDbState(latestDb);
      throw new Error(
        `Fare updated to PKR ${totalPrice.toLocaleString('en-US')} based on current seat availability. Please review the updated fare and confirm again.`
      );
    }

    const firstSeg = selectedSegments[0];
    const lastSeg = selectedSegments[selectedSegments.length - 1];
    const airlineCode =
      firstSeg?.OperatingAirline || firstSeg?.MarketingAirline || flight?.Airline || 'HH';
    const pnr = generatePNR(airlineCode);
    const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;

    const formattedPassengers = Passengers.map((p, idx) => ({
      PassengerID: p.PassengerID || `PAX-${Date.now()}-${idx + 1}`,
      PassengerType: p.PassengerType || 'Adult',
      Title: p.Title || 'MR',
      FirstName: (p.FirstName || 'NTBA').toUpperCase(),
      LastName: (p.LastName || 'NTBA').toUpperCase(),
      PersianFirstName: p.PersianFirstName || '',
      PersianLastName: p.PersianLastName || '',
      Gender: p.Gender || (p.Title === 'MRS' || p.Title === 'MISS' ? 'Female' : 'Male'),
      DOB: p.DOB || '1990-01-01',
      Nationality: (p.Nationality || 'PAK').toUpperCase(),
      NationalId: p.NationalId || '',
      PassportNumber: (p.PassportNumber || 'NTBA').toUpperCase(),
      PassportIssueDate: p.PassportIssueDate || '2024-01-01',
      PassportExpiryDate: p.PassportExpiryDate || '2029-01-01',
      TicketNumber: p.TicketNumber || '',
      WithAdult: p.WithAdult || '',
      SSRCode:
        p.SSRCode ||
        (p.PassengerType === 'Infant' ? 'INFT' : p.PassengerType === 'Child' ? 'CHLD' : 'TKNE'),
      PassportImageName: p.PassportImageName || '',
      PassportFileData: p.PassportFileData || ''
    }));

    const flightTitle =
      selectedSegments.length > 0
        ? selectedSegments.length > 1
          ? `${firstSeg.FlightNumber} • ${firstSeg.DepartureIata} ⇄ ${lastSeg.ArrivalIata} (${TripType})`
          : `${firstSeg.FlightNumber} • ${firstSeg.DepartureIata} → ${firstSeg.ArrivalIata}`
        : flight?.Title || 'Flight Booking';

    const expiryHoursList = selectedSegments
      .map((s) => Number(s.PnrExpiryHours) || 0)
      .filter((h) => h > 0);
    const pnrExpiryHours = expiryHoursList.length > 0 ? Math.min(...expiryHoursList) : 0;
    const isAgentBooking = Boolean(resolvedCompanyId && resolvedCompanyId !== 'DIRECT');
    const nowDate = new Date();
    const pnrExpiresDate =
      isAgentBooking && pnrExpiryHours > 0
        ? new Date(nowDate.getTime() + pnrExpiryHours * 3600 * 1000)
        : null;
    const pnrExpiresAt = pnrExpiresDate ? pnrExpiresDate.toISOString() : '';
    const computedTimeLimit = pnrExpiresDate
      ? pnrExpiresDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      : firstSeg?.DepartureDate
      ? firstSeg.DepartureDate.replace('T', ' ')
      : flight?.TimeLimit
      ? flight.TimeLimit.replace('T', ' ')
      : '—';

    const newBooking = {
      AirGroupBookingID: bookingId,
      AirGroupID: flight ? flight.AirGroupID : `POS-${bookingId}`,
      SegmentIDs: selectedSegments.map((s) => s.AirGroupSegmentID),
      AirGroupSegmentID: firstSeg ? firstSeg.AirGroupSegmentID : '',
      FlightTitle: flightTitle,
      FlightCategory: firstSeg?.FlightClass || flight?.Category || 'Economy',
      TripType: TripType || (selectedSegments.length > 1 ? 'Round Trip' : 'One Way'),
      SubCompanyID: resolvedCompanyId,
      SubCompanyName: resolvedCompanyName,
      BookedByLoginID: user?.LoginID || 'test',
      BookingChannelName,
      PNR: pnr,
      PNR_AIRLINE: flight?.PNR_AIRLINE || firstSeg?.FlightNumber || pnr,
      ValidatingCarrierName:
        firstSeg?.OperatingAirlineName ||
        flight?.ValidatingCarrierName ||
        'Taban Airlines',
      ApprovalStatus: 'Pending',
      AdultCount: adults,
      ChildCount: children,
      InfantCount: infants,
      TotalPrice: totalPrice,
      PnrExpiryHours: isAgentBooking ? pnrExpiryHours : 0,
      PnrExpiresAt: pnrExpiresAt,
      CreatedAtIso: nowDate.toISOString(),
      BookingTimeLimit: computedTimeLimit,
      ApprovalLoginID: '',
      ApprovalDateTime: '',
      VoidLoginID: '',
      VoidDateTime: '',
      VoidReason: '',
      EmailAddress: EmailAddress || agent?.Email || 'bookings@bookly.com',
      MobileNumber: MobileNumber || agent?.MobileNumber || '',
      Remarks: Remarks || '',
      TimeStamp: formatNow(),
      Passengers: formattedPassengers
    };

    // Booking does NOT deduct agent credit balance; deduction happens only on Ticket Issue
    // Merge onto latestDb so concurrent bookings from other agents are preserved
    updateLocalDb(() => {
      const merged = JSON.parse(JSON.stringify(latestDb));
      merged.bookings = [newBooking, ...(merged.bookings || [])];
      return merged;
    });

    addToast(`Booking Created Successfully. PNR : ${pnr}`, 'success');
    return newBooking;
  };

  const updateBooking = async (id, payload) => {
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        if (payload.SubCompanyID) {
          const agent = draft.subAgents.find((a) => a.SubCompanyID === payload.SubCompanyID);
          if (agent) {
            booking.SubCompanyID = agent.SubCompanyID;
            booking.SubCompanyName = agent.CompanyName;
          }
        }
        if (payload.BookingTimeLimit !== undefined) booking.BookingTimeLimit = payload.BookingTimeLimit;
        if (payload.EmailAddress !== undefined) booking.EmailAddress = payload.EmailAddress;
        if (payload.MobileNumber !== undefined) booking.MobileNumber = payload.MobileNumber;
        if (payload.Remarks !== undefined) booking.Remarks = payload.Remarks;
        if (payload.PNR !== undefined) booking.PNR = payload.PNR;
      }
      return draft;
    });
    addToast('Booking Updated Successfully.', 'success');
  };

  const approveBooking = async (id) => {
    const loginId = user?.LoginID || 'test';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Approved';
        booking.ApprovalLoginID = loginId;
        booking.ApprovalDateTime = formatNow();
      }
      return draft;
    });
    addToast(`Booking ${id} approved successfully.`, 'success');
  };

  const rejectBooking = async (id) => {
    const loginId = user?.LoginID || 'test';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Rejected';
        booking.ApprovalLoginID = loginId;
        booking.ApprovalDateTime = formatNow();
      }
      return draft;
    });
    addToast(`Booking ${id} rejected successfully.`, 'warning');
  };

  const issueTicket = async (id) => {
    const loginId = user?.LoginID || 'test';
    const existingBooking = (dbState.bookings || []).find((b) => b.AirGroupBookingID === id);
    const enrichedBooking = (enriched.bookings || []).find((b) => b.AirGroupBookingID === id);
    if (!existingBooking) throw new Error('Booking not found.');
    if (existingBooking.ApprovalStatus === 'Ticket Issued') {
      throw new Error('Ticket is already issued.');
    }
    if (
      existingBooking.ApprovalStatus === 'Cancelled' ||
      existingBooking.ApprovalStatus === 'Rejected' ||
      existingBooking.ApprovalStatus === 'Ticket Void'
    ) {
      throw new Error('Cannot issue a cancelled, rejected, or voided booking.');
    }

    if (existingBooking.SubCompanyID && existingBooking.SubCompanyID !== 'DIRECT') {
      if (existingBooking.PnrExpiresAt) {
        const expMs = new Date(existingBooking.PnrExpiresAt).getTime();
        if (!isNaN(expMs) && Date.now() >= expMs) {
          throw new Error('PNR has expired and cannot be issued.');
        }
      }
      const agCheck = (dbState.subAgents || []).find(
        (a) => a.SubCompanyID === existingBooking.SubCompanyID
      );
      const fare = Number(existingBooking.TotalPrice) || 0;
      const curBal = Number(agCheck?.CreditLimitBalance) || 0;
      if (agCheck && curBal < fare) {
        throw new Error(
          `Insufficient credit balance. Required PKR ${fare.toLocaleString('en-US')}, available PKR ${curBal.toLocaleString('en-US')}.`
        );
      }
    }

    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking && booking.ApprovalStatus !== 'Ticket Issued') {
        if (booking.SubCompanyID && booking.SubCompanyID !== 'DIRECT') {
          const ag = draft.subAgents.find((a) => a.SubCompanyID === booking.SubCompanyID);
          if (ag) {
            const fare = Number(booking.TotalPrice) || 0;
            const prevBal = Number(ag.CreditLimitBalance) || 0;
            if (prevBal < fare) {
              return draft;
            }
            const nextBal = prevBal - fare;
            ag.CreditLimitBalance = nextBal;
            const segList =
              enrichedBooking?.Segments && enrichedBooking.Segments.length > 0
                ? enrichedBooking.Segments
                : Array.isArray(booking.SegmentIDs) && booking.SegmentIDs.length > 0
                ? booking.SegmentIDs.map((sid) =>
                    (draft.segments || []).find((s) => s.AirGroupSegmentID === sid)
                  ).filter(Boolean)
                : booking.AirGroupSegmentID
                ? (draft.segments || []).filter(
                    (s) => s.AirGroupSegmentID === booking.AirGroupSegmentID
                  )
                : [];
            const saleDesc = formatSaleTransactionDescription({
              ...booking,
              Segments: segList
            });
            draft.creditTransactions = draft.creditTransactions || [];
            draft.creditTransactions.push({
              TransactionID: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              SubCompanyID: ag.SubCompanyID,
              CompanyName: ag.CompanyName,
              DateTime: formatNow(),
              IsoTimestamp: new Date().toISOString(),
              Voucher: 'SALE',
              Type: 'DEBIT',
              Description: saleDesc || `PNR ${booking.PNR} ISSUED`,
              ReferencePNR: booking.PNR,
              PreviousBalance: prevBal,
              Amount: fare,
              CurrentBalance: nextBal,
              PerformedBy: loginId
            });
          }
        }

        booking.ApprovalStatus = 'Ticket Issued';
        if (!booking.ApprovalLoginID) booking.ApprovalLoginID = loginId;
        booking.ApprovalDateTime = formatNow();
        booking.BookingTimeLimit = '';
        const baseSeq = Math.floor(1000 + Math.random() * 8999);
        booking.Passengers = (booking.Passengers || []).map((pax, i) => ({
          ...pax,
          TicketNumber:
            pax.TicketNumber && pax.TicketNumber.trim()
              ? pax.TicketNumber
              : `740000000${baseSeq + i}`
        }));
      }
      return draft;
    });
    addToast('Booking Issued Successfully.', 'success');
  };

  const voidBooking = async (id, reason) => {
    if (!String(reason).trim()) {
      throw new Error('Void Remarks are required to void a booking.');
    }
    const loginId = user?.LoginID || 'test';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Ticket Void';
        booking.VoidLoginID = loginId;
        booking.VoidDateTime = formatNow();
        booking.VoidReason = reason;
      }
      return draft;
    });
    addToast('Booking Void Successfully.', 'warning');
  };

  const cancelBooking = async (id) => {
    const loginId = user?.LoginID || 'agent';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking && booking.ApprovalStatus !== 'Ticket Issued' && booking.ApprovalStatus !== 'Cancelled') {
        booking.ApprovalStatus = 'Cancelled';
        booking.VoidLoginID = loginId;
        booking.VoidDateTime = formatNow();
        booking.VoidReason = 'Cancelled by Agent before Ticket Issuance';
      }
      return draft;
    });
    addToast(`Booking ${id} cancelled successfully.`, 'warning');
  };

  const deleteBooking = async (id) => {
    updateLocalDb((draft) => {
      draft.bookings = draft.bookings.filter((b) => b.AirGroupBookingID !== id);
      return draft;
    });
    addToast('Booking Deleted Successfully.', 'info');
  };

  const updatePassenger = async (bookingId, passengerId, paxData) => {
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === bookingId);
      if (booking) {
        const idx = (booking.Passengers || []).findIndex((p) => p.PassengerID === passengerId);
        if (idx !== -1) {
          booking.Passengers[idx] = { ...booking.Passengers[idx], ...paxData };
        }
      }
      return draft;
    });
    addToast('Passenger Updated Successfully.', 'success');
  };

  const deletePassenger = async (bookingId, passengerId) => {
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === bookingId);
      if (booking) {
        booking.Passengers = (booking.Passengers || []).filter((p) => p.PassengerID !== passengerId);
        booking.AdultCount = booking.Passengers.filter((p) => p.PassengerType === 'Adult').length;
        booking.ChildCount = booking.Passengers.filter((p) => p.PassengerType === 'Child').length;
        booking.InfantCount = booking.Passengers.filter((p) => p.PassengerType === 'Infant').length;
      }
      return draft;
    });
    addToast('Passenger Deleted Successfully.', 'info');
  };

  // --- Flight Group mutations ---
  const createFlight = async (payload) => {
    const newFlight = {
      AirGroupID: payload.AirGroupID || `AG-${Math.floor(500 + Math.random() * 9000)}`,
      Title: payload.Title || 'Group Flight',
      Category: payload.Category || 'Tourism',
      TripType: payload.TripType || 'Round',
      Airline: payload.Airline || payload.ValidatingCarrier || 'HH',
      ValidatingCarrier: payload.ValidatingCarrier || 'HH',
      ValidatingCarrierName: payload.ValidatingCarrierName || payload.ValidatingCarrier || 'Taban Airlines',
      SupplierName: payload.SupplierName || 'Direct Airline Inventory',
      isDomestic: Boolean(payload.isDomestic),
      isSOTO: Boolean(payload.isSOTO),
      isEnabled: payload.isEnabled !== undefined ? Boolean(payload.isEnabled) : true,
      PNR_GDS: payload.PNR_GDS || generatePNR('GD'),
      PNR_AIRLINE: payload.PNR_AIRLINE || generatePNR('AR'),
      TimeLimit: payload.TimeLimit || '',
      GroupDepartureDate: payload.GroupDepartureDate || '',
      GroupDepartureIata: payload.GroupDepartureIata || 'KHI',
      TotalSeats: Number(payload.TotalSeats) || 160,
      SeatsLeft: Number(payload.TotalSeats) || 160,
      AdultPrice: Number(payload.AdultPrice) || 0,
      AdultBasicFare: Number(payload.AdultBasicFare) || 0,
      AdultTax: Number(payload.AdultTax) || 0,
      ChildPrice: Number(payload.ChildPrice) || 0,
      ChildBasicFare: Number(payload.ChildBasicFare) || 0,
      ChildTax: Number(payload.ChildTax) || 0,
      InfantPrice: Number(payload.InfantPrice) || 0,
      InfantBasicFare: Number(payload.InfantBasicFare) || 0,
      InfantTax: Number(payload.InfantTax) || 0,
      SegmentIDs: Array.isArray(payload.SegmentIDs) ? payload.SegmentIDs : [],
      Timestamp: formatNow()
    };
    updateLocalDb((draft) => {
      draft.flights.unshift(newFlight);
      return draft;
    });
    addToast('Flight Saved Successfully.', 'success');
  };

  const updateFlight = async (id, payload) => {
    updateLocalDb((draft) => {
      const idx = draft.flights.findIndex((f) => f.AirGroupID === id);
      if (idx !== -1) {
        draft.flights[idx] = { ...draft.flights[idx], ...payload };
      }
      return draft;
    });
    addToast('Flight Updated Successfully.', 'success');
  };

  const deleteFlight = async (id) => {
    updateLocalDb((draft) => {
      draft.flights = draft.flights.filter((f) => f.AirGroupID !== id);
      return draft;
    });
    addToast('Flight Deleted Successfully.', 'info');
  };

  // --- Segment mutations ---
  const createSegment = async (p) => {
    const newSeg = {
      ...p,
      AirGroupSegmentID: p.AirGroupSegmentID || `SEG-${Math.floor(1000 + Math.random() * 9000)}`,
      TotalSeats: Number(p.TotalSeats) || 160,
      AvailableSeats: Number(p.TotalSeats) || 160
    };
    updateLocalDb((draft) => {
      draft.segments.unshift(newSeg);
      return draft;
    });
    addToast('Segment saved successfully.', 'success');
  };

  const updateSegment = async (id, payload) => {
    updateLocalDb((draft) => {
      const idx = draft.segments.findIndex((s) => s.AirGroupSegmentID === id);
      if (idx !== -1) {
        draft.segments[idx] = { ...draft.segments[idx], ...payload };
      }
      return draft;
    });
    addToast('Segment saved successfully.', 'success');
  };

  const deleteSegment = async (id) => {
    updateLocalDb((draft) => {
      draft.segments = draft.segments.filter((s) => s.AirGroupSegmentID !== id);
      return draft;
    });
    addToast('Segment Deleted Successfully.', 'info');
  };

  // --- SubAgent & User mutations ---
  const createSubAgent = async (p) => {
    if (!p.CompanyName) throw new Error('Company Name is required.');
    const rawPass = p.PassCode ? String(p.PassCode).trim() : 'Pass@1234';
    if (!isPasswordHashed(rawPass)) {
      const check = validateStrongPassword(rawPass);
      if (!check.valid) throw new Error(check.error);
    }
    const subCompanyId = `SUB-${Math.floor(205 + Math.random() * 800)}`;
    const hashedPass = await hashPassword(rawPass);
    const initialUsers = [];
    if (p.LoginID && String(p.LoginID).trim()) {
      initialUsers.push({
        UserID: `USR-${Math.floor(100 + Math.random() * 9000)}`,
        SubCompanyID: subCompanyId,
        LoginID: String(p.LoginID).trim(),
        PassCode: hashedPass,
        FullName: p.FullName || p.CompanyName,
        Email: p.Email || '',
        Designation: 'Sub Agent',
        WhatsAppNumber: p.MobileNumber || '',
        AccountType: 'Sub Agent',
        AccountStatus: p.AccountStatus || 'Enable',
        Reset2FA: false
      });
    }
    const initialCredit = Number(p.CreditLimitBalance ?? p.CreditLimit) || 0;
    const newAgent = {
      ...p,
      PassCode: hashedPass,
      SubCompanyID: subCompanyId,
      CreditLimit: Number(p.CreditLimit) || 0,
      CreditLimitBalance: initialCredit,
      OpeningBalance: initialCredit,
      Created: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      Users: initialUsers
    };
    updateLocalDb((draft) => {
      draft.subAgents.unshift(newAgent);
      return draft;
    });
    addToast('SubAgent created successfully.', 'success');
  };

  const updateSubAgent = async (id, payload) => {
    const nextPayload = { ...payload };
    if (nextPayload.PassCode && String(nextPayload.PassCode).trim() && !isPasswordHashed(nextPayload.PassCode)) {
      const check = validateStrongPassword(nextPayload.PassCode);
      if (!check.valid) throw new Error(check.error);
      nextPayload.PassCode = await hashPassword(String(nextPayload.PassCode).trim());
    }
    updateLocalDb((draft) => {
      const idx = draft.subAgents.findIndex((a) => a.SubCompanyID === id);
      if (idx !== -1) {
        const existing = draft.subAgents[idx];
        const nextLimit =
          nextPayload.CreditLimit !== undefined
            ? Number(nextPayload.CreditLimit) || 0
            : Number(existing.CreditLimit) || 0;
        let nextBalance =
          nextPayload.CreditLimitBalance !== undefined
            ? Number(nextPayload.CreditLimitBalance) || 0
            : Number(existing.CreditLimitBalance) || 0;

        // If CreditLimit was changed without an explicit CreditLimitBalance override, adjust balance by delta
        if (
          nextPayload.CreditLimit !== undefined &&
          nextPayload.CreditLimitBalance === undefined &&
          nextLimit !== Number(existing.CreditLimit)
        ) {
          const delta = nextLimit - (Number(existing.CreditLimit) || 0);
          nextBalance = Math.max(0, (Number(existing.CreditLimitBalance) || 0) + delta);
        }

        const prevBal = Number(existing.CreditLimitBalance) || 0;
        draft.subAgents[idx] = {
          ...existing,
          ...nextPayload,
          CreditLimit: nextLimit,
          CreditLimitBalance: nextBalance
        };
        if (nextBalance !== prevBal) {
          const diff = nextBalance - prevBal;
          draft.creditTransactions = draft.creditTransactions || [];
          draft.creditTransactions.push({
            TransactionID: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            SubCompanyID: existing.SubCompanyID,
            CompanyName: payload.CompanyName || existing.CompanyName,
            DateTime: formatNow(),
            IsoTimestamp: new Date().toISOString(),
            Voucher: diff > 0 ? 'RV' : 'ADJ',
            Type: diff > 0 ? 'CREDIT' : 'DEBIT',
            Description:
              diff > 0
                ? `${Math.abs(diff)} CREDIT TO ACCOUNT (ADMIN ADJUST)`
                : `${Math.abs(diff)} DEBIT ADJUSTMENT BY ADMIN`,
            ReferencePNR: '',
            PreviousBalance: prevBal,
            Amount: Math.abs(diff),
            CurrentBalance: nextBalance,
            PerformedBy: user?.LoginID || 'admin'
          });
        }
      }
      return draft;
    });
    addToast('SubAgent updated successfully.', 'success');
  };

  const topUpSubAgentCredit = async (id, addAmount) => {
    const amount = Number(addAmount) || 0;
    if (amount <= 0) {
      throw new Error('Please enter a valid credit amount greater than 0.');
    }
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === id);
      if (ag) {
        const prevBal = Number(ag.CreditLimitBalance) || 0;
        const nextBal = prevBal + amount;
        ag.CreditLimit = (Number(ag.CreditLimit) || 0) + amount;
        ag.CreditLimitBalance = nextBal;
        draft.creditTransactions = draft.creditTransactions || [];
        draft.creditTransactions.push({
          TransactionID: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          SubCompanyID: ag.SubCompanyID,
          CompanyName: ag.CompanyName,
          DateTime: formatNow(),
          IsoTimestamp: new Date().toISOString(),
          Voucher: 'RV',
          Type: 'CREDIT',
          Description: `${amount} CREDIT TO ACCOUNT`,
          ReferencePNR: '',
          PreviousBalance: prevBal,
          Amount: amount,
          CurrentBalance: nextBal,
          PerformedBy: user?.LoginID || 'admin'
        });
      }
      return draft;
    });
    addToast(`Added PKR ${amount.toLocaleString('en-US')} credit successfully.`, 'success');
  };

  const deleteSubAgent = async (id) => {
    updateLocalDb((draft) => {
      draft.subAgents = draft.subAgents.filter((a) => a.SubCompanyID !== id);
      return draft;
    });
    addToast('SubAgent Deleted Successfully.', 'info');
  };

  const createSubAgentUser = async (subCompanyId, u) => {
    if (!u.LoginID || !u.FullName || !u.Email) {
      throw new Error('Login ID, Full Name, and Email are required.');
    }
    const rawPass = u.PassCode ? String(u.PassCode).trim() : 'Pass@1234';
    if (!isPasswordHashed(rawPass)) {
      const check = validateStrongPassword(rawPass);
      if (!check.valid) throw new Error(check.error);
    }
    const hashedPass = await hashPassword(rawPass);
    const newUser = {
      UserID: `USR-${Math.floor(100 + Math.random() * 9000)}`,
      SubCompanyID: subCompanyId,
      LoginID: u.LoginID,
      PassCode: hashedPass,
      FullName: u.FullName,
      Email: u.Email,
      Designation: u.Designation || 'Ticketing Executive',
      WhatsAppNumber: u.WhatsAppNumber || '',
      AccountType: u.AccountType || 'Operator',
      AccountStatus: u.AccountType ? u.AccountStatus || 'Enable' : 'Enable',
      Reset2FA: Boolean(u.Reset2FA)
    };
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === subCompanyId);
      if (ag) {
        ag.Users = ag.Users || [];
        ag.Users.push(newUser);
      }
      return draft;
    });
    addToast('User created successfully.', 'success');
  };

  const updateSubAgentUser = async (subCompanyId, userId, payload) => {
    const nextPayload = { ...payload };
    if (nextPayload.PassCode && !isPasswordHashed(nextPayload.PassCode)) {
      const check = validateStrongPassword(nextPayload.PassCode);
      if (!check.valid) throw new Error(check.error);
      nextPayload.PassCode = await hashPassword(nextPayload.PassCode);
    }
    if (nextPayload.Reset2FA) {
      nextPayload.TwoFactorSecret = generateTotpSecret(16);
      nextPayload.TwoFactorEnrolled = false;
      nextPayload.Reset2FA = false;
    }
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === subCompanyId);
      if (ag) {
        const idx = (ag.Users || []).findIndex((u) => u.UserID === userId);
        if (idx !== -1) {
          ag.Users[idx] = { ...ag.Users[idx], ...nextPayload };
        }
      }
      return draft;
    });
    addToast('User updated successfully.', 'success');
  };

  const deleteSubAgentUser = async (subCompanyId, userId) => {
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === subCompanyId);
      if (ag) {
        ag.Users = (ag.Users || []).filter((u) => u.UserID !== userId);
      }
      return draft;
    });
    addToast('User Deleted Successfully.', 'info');
  };

  // --- Master Admin -> Admin User Management ---
  const createAdminUser = async (payload) => {
    const cleanLogin = String(payload.LoginID || '').trim();
    if (!cleanLogin || !payload.PassCode || !payload.FullName) {
      throw new Error('Login ID, Password, and Full Name are required.');
    }
    const existsInAdmins = (enriched.adminUsers || []).some(
      (a) => a.LoginID && a.LoginID.toLowerCase() === cleanLogin.toLowerCase()
    );
    const existsInAgents = (dbState.subAgents || []).some(
      (ag) =>
        (ag.LoginID && ag.LoginID.toLowerCase() === cleanLogin.toLowerCase()) ||
        (ag.Users || []).some((u) => u.LoginID && u.LoginID.toLowerCase() === cleanLogin.toLowerCase())
    );
    if (existsInAdmins || existsInAgents) {
      throw new Error(`Login ID "${cleanLogin}" is already in use.`);
    }

    const passCheck = validateStrongPassword(payload.PassCode);
    if (!passCheck.valid) {
      throw new Error(passCheck.error);
    }
    const hashedPass = await hashPassword(payload.PassCode);
    const newAdmin = {
      AdminID: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      LoginID: cleanLogin,
      PassCode: hashedPass,
      FullName: payload.FullName.trim(),
      Email: payload.Email || '',
      Designation: payload.Designation || 'Operations Admin',
      Role: payload.Role === 'Master Admin' ? 'Master Admin' : 'Admin',
      AccountStatus: payload.AccountStatus || 'Enable',
      Permissions:
        payload.Role === 'Master Admin'
          ? { ...ALL_ADMIN_PERMISSIONS }
          : { ...(payload.Permissions || {}) },
      Created: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    };

    updateLocalDb((draft) => {
      const currentList = Array.isArray(draft.adminUsers) ? draft.adminUsers : [];
      const hasMaster = currentList.some(
        (a) =>
          a.Role === 'Master Admin' ||
          (a.LoginID && a.LoginID.toLowerCase() === DEFAULT_MASTER_ADMIN.LoginID.toLowerCase())
      );
      draft.adminUsers = hasMaster
        ? [...currentList, newAdmin]
        : [DEFAULT_MASTER_ADMIN, ...currentList, newAdmin];
      return draft;
    });
    addToast(`Admin "${newAdmin.FullName}" created successfully (Password Hashed).`, 'success');
  };

  const updateAdminUser = async (adminId, payload) => {
    const nextPayload = { ...payload };
    if (nextPayload.PassCode && String(nextPayload.PassCode).trim()) {
      const passCheck = validateStrongPassword(nextPayload.PassCode);
      if (!passCheck.valid) {
        throw new Error(passCheck.error);
      }
      nextPayload.PassCode = await hashPassword(String(nextPayload.PassCode).trim());
    } else {
      delete nextPayload.PassCode;
    }

    updateLocalDb((draft) => {
      const currentList = Array.isArray(draft.adminUsers) ? draft.adminUsers : [];
      const hasMaster = currentList.some(
        (a) =>
          a.Role === 'Master Admin' ||
          (a.LoginID && a.LoginID.toLowerCase() === DEFAULT_MASTER_ADMIN.LoginID.toLowerCase())
      );
      const list = hasMaster ? [...currentList] : [DEFAULT_MASTER_ADMIN, ...currentList];
      const idx = list.findIndex((a) => a.AdminID === adminId);
      if (idx !== -1) {
        const existing = list[idx];
        const isMaster = existing.Role === 'Master Admin';
        list[idx] = {
          ...existing,
          ...nextPayload,
          PassCode: nextPayload.PassCode || existing.PassCode,
          Role: isMaster ? 'Master Admin' : nextPayload.Role || existing.Role || 'Admin',
          AccountStatus: isMaster ? 'Enable' : nextPayload.AccountStatus || existing.AccountStatus,
          Permissions: isMaster
            ? { ...ALL_ADMIN_PERMISSIONS }
            : { ...(nextPayload.Permissions || existing.Permissions || {}) }
        };
      }
      draft.adminUsers = list;
      return draft;
    });
    addToast('Admin account updated successfully.', 'success');
  };

  const changeOwnPassword = async (currentPassword, newPassword) => {
    if (!user?.LoginID) throw new Error('You must be signed in to change your password.');
    if (!currentPassword || !newPassword) {
      throw new Error('Please enter both current and new password.');
    }
    const cleanNew = String(newPassword).trim();
    const passCheck = validateStrongPassword(cleanNew);
    if (!passCheck.valid) {
      throw new Error(passCheck.error);
    }

    const cleanLogin = user.LoginID.toLowerCase();

    if (isAdmin) {
      const admRecord = (enriched.adminUsers || []).find(
        (a) => a.LoginID && a.LoginID.toLowerCase() === cleanLogin
      );
      if (!admRecord) throw new Error('Admin account record not found.');
      const valid = await verifyPassword(currentPassword, admRecord.PassCode);
      if (!valid) throw new Error('Current password is incorrect.');
      const newHashed = await hashPassword(cleanNew);

      updateLocalDb((draft) => {
        const currentList = Array.isArray(draft.adminUsers) ? draft.adminUsers : [];
        const hasMaster = currentList.some(
          (a) =>
            a.Role === 'Master Admin' ||
            (a.LoginID && a.LoginID.toLowerCase() === DEFAULT_MASTER_ADMIN.LoginID.toLowerCase())
        );
        const list = hasMaster ? [...currentList] : [{ ...DEFAULT_MASTER_ADMIN }, ...currentList];
        const idx = list.findIndex(
          (a) => a.LoginID && a.LoginID.toLowerCase() === cleanLogin
        );
        if (idx !== -1) {
          list[idx] = { ...list[idx], PassCode: newHashed };
        }
        draft.adminUsers = list;
        return draft;
      });
      addToast('Password changed and hashed (SHA-256) successfully.', 'success');
      return;
    }

    // Sub-Agent password change
    let foundSubAgent = null;
    let foundSubUser = null;
    for (const ag of dbState.subAgents || []) {
      for (const u of ag.Users || []) {
        if (u.LoginID && u.LoginID.toLowerCase() === cleanLogin) {
          foundSubAgent = ag;
          foundSubUser = u;
          break;
        }
      }
      if (!foundSubUser && ag.LoginID && ag.LoginID.toLowerCase() === cleanLogin) {
        foundSubAgent = ag;
      }
      if (foundSubAgent) break;
    }

    if (!foundSubAgent) throw new Error('User account record not found.');
    const storedHash = foundSubUser ? foundSubUser.PassCode : foundSubAgent.PassCode;
    const valid = await verifyPassword(currentPassword, storedHash);
    if (!valid) throw new Error('Current password is incorrect.');
    const newHashed = await hashPassword(cleanNew);

    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === foundSubAgent.SubCompanyID);
      if (ag) {
        if (ag.LoginID && ag.LoginID.toLowerCase() === cleanLogin) {
          ag.PassCode = newHashed;
        }
        if (Array.isArray(ag.Users)) {
          ag.Users = ag.Users.map((u) =>
            u.LoginID && u.LoginID.toLowerCase() === cleanLogin
              ? { ...u, PassCode: newHashed }
              : u
          );
        }
      }
      return draft;
    });
    addToast('Password changed and hashed (SHA-256) successfully.', 'success');
  };

  const resetAdmin2FA = async (adminId) => {
    const freshSecret = generateTotpSecret(16);
    updateLocalDb((draft) => {
      const currentList = Array.isArray(draft.adminUsers) ? draft.adminUsers : [];
      const hasMaster = currentList.some(
        (a) =>
          a.Role === 'Master Admin' ||
          (a.LoginID && a.LoginID.toLowerCase() === DEFAULT_MASTER_ADMIN.LoginID.toLowerCase())
      );
      const list = hasMaster ? [...currentList] : [{ ...DEFAULT_MASTER_ADMIN }, ...currentList];
      const idx = list.findIndex((a) => a.AdminID === adminId);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          TwoFactorSecret: freshSecret,
          TwoFactorEnrolled: false,
          Reset2FA: false
        };
      }
      draft.adminUsers = list;
      return draft;
    });
    addToast('2FA has been reset. Admin will scan a new QR code on next login.', 'info');
  };

  const deleteAdminUser = async (adminId) => {
    const target = (enriched.adminUsers || []).find((a) => a.AdminID === adminId);
    if (target?.Role === 'Master Admin') {
      throw new Error('Master Admin account cannot be deleted.');
    }
    updateLocalDb((draft) => {
      draft.adminUsers = (draft.adminUsers || []).filter((a) => a.AdminID !== adminId);
      return draft;
    });
    addToast('Admin account deleted successfully.', 'info');
  };

  // Role-based filtering: Sub Agents ONLY see their own bookings & agency
  const visibleBookings = React.useMemo(() => {
    if (!isSubAgent) return enriched.bookings;
    return enriched.bookings.filter((b) => b.SubCompanyID === user.SubCompanyID);
  }, [enriched.bookings, isSubAgent, user]);

  const visibleSubAgents = React.useMemo(() => {
    if (!isSubAgent) return enriched.subAgents;
    return enriched.subAgents.filter((a) => a.SubCompanyID === user.SubCompanyID);
  }, [enriched.subAgents, isSubAgent, user]);

  const visibleCreditTransactions = React.useMemo(() => {
    const list = enriched.creditTransactions || [];
    if (!isSubAgent) return list;
    return list.filter((t) => t.SubCompanyID === user.SubCompanyID);
  }, [enriched.creditTransactions, isSubAgent, user]);

  const visibleStats = React.useMemo(() => {
    if (!isSubAgent) return enriched.stats;
    const validOwnBookings = visibleBookings.filter(
      (b) =>
        b.ApprovalStatus !== 'Rejected' &&
        b.ApprovalStatus !== 'Ticket Void' &&
        b.ApprovalStatus !== 'Cancelled'
    );
    const ownSales = validOwnBookings.reduce((acc, b) => acc + (Number(b.TotalPrice) || 0), 0);
    return {
      TotalSubAgents: 1,
      TotalBookings: visibleBookings.length,
      TotalUsers: (visibleSubAgents[0]?.Users || []).length || 1,
      TotalBookingPrice: ownSales
    };
  }, [enriched.stats, isSubAgent, visibleBookings, visibleSubAgents]);

  return (
    <PortalContext.Provider
      value={{
        user,
        isAdmin,
        isMasterAdmin,
        isSubAgent,
        hasPermission,
        adminUsers: enriched.adminUsers,
        loading,
        language,
        setLanguage,
        showTimeoutModal,
        setShowTimeoutModal,
        toasts,
        addToast,
        stats: visibleStats,
        airports: enriched.airports,
        airlines: enriched.airlines,
        suppliers: enriched.suppliers,
        segments: enriched.segments,
        flights: enriched.flights,
        bookings: visibleBookings,
        subAgents: visibleSubAgents,
        creditTransactions: visibleCreditTransactions,
        login,
        verifyOtpAndFinishLogin,
        logout,
        resetDemoData,
        createBooking,
        updateBooking,
        approveBooking,
        rejectBooking,
        issueTicket,
        voidBooking,
        cancelBooking,
        deleteBooking,
        updatePassenger,
        deletePassenger,
        createFlight,
        updateFlight,
        deleteFlight,
        createSegment,
        updateSegment,
        deleteSegment,
        createSubAgent,
        updateSubAgent,
        topUpSubAgentCredit,
        deleteSubAgent,
        createSubAgentUser,
        updateSubAgentUser,
        deleteSubAgentUser,
        createAdminUser,
        updateAdminUser,
        resetAdmin2FA,
        deleteAdminUser,
        changeOwnPassword
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within a PortalProvider');
  return ctx;
}
