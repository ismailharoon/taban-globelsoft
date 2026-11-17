import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  ShoppingBag,
  Layers,
  Users,
  Search,
  Bell,
  Mail,
  Globe,
  LogOut,
  Menu,
  X,
  RotateCcw,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR } from '../utils/exporters';
import { validateStrongPassword } from '../utils/security';

const navSections = [
  {
    group: 'Command Hub',
    items: [
      { to: '/Dashboard', label: 'Control Center', urdu: 'کنٹرول سینٹر', icon: LayoutDashboard, permKey: 'dashboard' }
    ]
  },
  {
    group: 'Ticketing & Inventory',
    items: [
      { to: '/FlightPOS', label: 'Search Flight', urdu: 'فلائٹ سرچ', icon: ShoppingBag, permKey: 'searchFlight' },
      { to: '/FlightBookings', label: 'Reservations & Tickets', urdu: 'ریزرویشنز اور ٹکٹس', icon: Ticket, badgeKey: 'pending', permKey: 'bookings' },
      { to: '/SegmentManagement', label: 'Routes & Seat Inventory', urdu: 'روٹس اور سیٹ انوینٹری', icon: Layers, adminOnly: true, permKey: 'segments' }
    ]
  },
  {
    group: 'B2B Partners',
    adminOnly: true,
    items: [
      { to: '/ManageSubAgents', label: 'Partner Agencies', urdu: 'پارٹنر ایجنسیاں', icon: Users, adminOnly: true, permKey: 'subAgents' },
      { to: '/ManageAdmins', label: 'Manage Admins', urdu: 'ایڈمنز منیجمنٹ', icon: ShieldCheck, masterOnly: true }
    ]
  }
];

export default function Layout({ children }) {
  const {
    user,
    isAdmin,
    isMasterAdmin,
    isSubAgent,
    hasPermission,
    logout,
    language,
    setLanguage,
    bookings,
    segments,
    subAgents,
    toasts,
    addToast,
    showTimeoutModal,
    setShowTimeoutModal,
    resetDemoData,
    changeOwnPassword
  } = usePortal();

  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  // Change Password Modal State
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    const passCheck = validateStrongPassword(newPass);
    if (!passCheck.valid) {
      addToast(passCheck.error, 'error');
      return;
    }
    if (newPass !== confirmPass) {
      addToast('New password and confirmation do not match.', 'error');
      return;
    }
    try {
      await changeOwnPassword(currentPass, newPass);
      setShowPassModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const visibleNavSections = React.useMemo(() => {
    return navSections
      .filter((sec) => !isSubAgent || !sec.adminOnly)
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => {
          if (item.masterOnly) return isMasterAdmin;
          if (isSubAgent) return !item.adminOnly;
          if (item.permKey) return hasPermission(item.permKey);
          return true;
        })
      }))
      .filter((sec) => sec.items.length > 0);
  }, [isSubAgent, isMasterAdmin, hasPermission]);

  const pendingCount = bookings.filter((b) => b.ApprovalStatus === 'Pending').length;

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { bookings: [], segments: [], agents: [] };
    return {
      bookings: bookings
        .filter(
          (b) =>
            b.PNR?.toLowerCase().includes(q) ||
            b.AirGroupBookingID?.toLowerCase().includes(q) ||
            b.SubCompanyName?.toLowerCase().includes(q) ||
            (b.Passengers || []).some(
              (p) =>
                p.FirstName?.toLowerCase().includes(q) ||
                p.LastName?.toLowerCase().includes(q) ||
                p.PassportNumber?.toLowerCase().includes(q)
            )
        )
        .slice(0, 4),
      segments: (segments || [])
        .filter(
          (s) =>
            s.FlightNumber?.toLowerCase().includes(q) ||
            s.DepartureIata?.toLowerCase().includes(q) ||
            s.ArrivalIata?.toLowerCase().includes(q) ||
            s.DepartureCity?.toLowerCase().includes(q) ||
            s.ArrivalCity?.toLowerCase().includes(q)
        )
        .slice(0, 4),
      agents: subAgents
        .filter(
          (a) =>
            a.CompanyName?.toLowerCase().includes(q) ||
            a.City?.toLowerCase().includes(q)
        )
        .slice(0, 3)
    };
  }, [searchQuery, bookings, segments, subAgents]);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR — Deep Royal Navy #0F172A / #1B3664 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0F172A] text-white border-r border-slate-800 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-[#0B1221]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {!sidebarCollapsed ? (
              <div className="leading-tight">
                <div className="font-display font-semibold text-sm tracking-wide text-white flex items-center gap-1.5">
                  BOOKLY <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B3664] text-white font-mono">OTA</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">B2B Booking &amp; Inventory</p>
              </div>
            ) : (
              <div className="font-display font-bold text-xs text-white tracking-wider">BK</div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Operator Card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/70 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B3664] flex items-center justify-center font-semibold text-xs text-white shrink-0">
              {(user?.LoginID || 'TE').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.FullName || 'Test Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {user?.AccountType || 'Administrator'} • @{user?.LoginID || 'test'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
          {visibleNavSections.map((sec) => (
            <div key={sec.group}>
              {!sidebarCollapsed && (
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {sec.group}
                </div>
              )}
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.toLowerCase() === item.to.toLowerCase();
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1B3664] text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate">
                            {language === 'Urdu' ? item.urdu : item.label}
                          </span>
                        )}
                      </div>
                      {!sidebarCollapsed && item.badgeKey === 'pending' && pendingCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                            isActive
                              ? 'bg-white text-[#1B3664]'
                              : 'bg-[#1B3664] text-white'
                          }`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2.5 border-t border-slate-800 bg-[#0B1221] space-y-1">
          {isMasterAdmin && (
            <button
              onClick={() => setShowPassModal(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span>Change Password</span>}
            </button>
          )}
          <button
            onClick={() => setShowTimeoutModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span>Session Guard</span>}
          </button>
          {isMasterAdmin && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all portal data?')) {
                  resetDemoData();
                }
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span>Clear All Data</span>}
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-[#1B3664] text-white hover:bg-[#152a4f] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out ({user?.LoginID || 'test'})</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Hamburger + Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Toggle Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenDropdown('search');
                }}
                onFocus={() => setOpenDropdown('search')}
                placeholder={
                  isSubAgent
                    ? 'Search your PNR, Booking ID, Passenger, or Flight...'
                    : 'Search PNR, Booking ID, Passenger, Flight Segment, or Agent...'
                }
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#1B3664] focus:bg-white transition"
              />
              {openDropdown === 'search' && searchQuery.trim().length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-50 max-h-80 overflow-y-auto"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1B3664] px-2 py-1">
                    Bookings ({searchResults.bookings.length})
                  </div>
                  {searchResults.bookings.map((b) => (
                    <button
                      key={b.AirGroupBookingID}
                      onClick={() => {
                        setOpenDropdown(null);
                        setSearchQuery('');
                        navigate('/FlightBookings');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#1B3664] font-mono">{b.PNR}</span> •{' '}
                        <span className="font-medium">{b.SubCompanyName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {b.ApprovalStatus}
                      </span>
                    </button>
                  ))}

                  {!isSubAgent && (
                    <>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1B3664] px-2 py-1 mt-1.5">
                        Flight Segments ({searchResults.segments.length})
                      </div>
                      {searchResults.segments.map((s) => (
                        <button
                          key={s.AirGroupSegmentID}
                          onClick={() => {
                            setOpenDropdown(null);
                            setSearchQuery('');
                            navigate('/FlightPOS');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                        >
                          <span className="font-medium truncate">
                            {s.FlightNumber} • {s.DepartureIata} &rarr; {s.ArrivalIata}
                          </span>
                          <span className="font-mono text-[#1B3664] font-semibold">
                            {formatCurrencyPKR(s.AdultPrice)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {searchResults.bookings.length === 0 &&
                    searchResults.segments.length === 0 &&
                    searchResults.agents.length === 0 && (
                      <div className="text-xs text-slate-500 py-3 text-center">
                        No matching records found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick POS Button, Language, Notifications, Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/FlightPOS')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3664] text-white hover:bg-[#0F172A] text-xs font-medium transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Search Flight</span>
            </button>

            <button
              onClick={() => setLanguage((l) => (l === 'English' ? 'Urdu' : 'English'))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#1B3664]" />
              <span>{language}</span>
            </button>

            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications')
                }
                className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-slate-700" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1B3664] text-white text-[10px] font-semibold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              {openDropdown === 'notifications' && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="bg-[#1D314F] text-white px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold">
                    <span>Notifications</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px]">Live</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {pendingCount > 0 ? (
                      <div
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate(isSubAgent ? '/Dashboard' : '/FlightBookings');
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="text-xs font-semibold text-[#1B3664]">
                          {pendingCount} Pending Booking(s)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {isSubAgent
                            ? 'Click to view your booking status on Dashboard.'
                            : 'Click to review, approve, or issue e-tickets.'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No pending notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B3664] text-white flex items-center justify-center font-semibold text-xs">
                  {(user?.LoginID || 'TE').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-none">
                    {user?.LoginID || 'test'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {user?.AccountType || 'Administrator'}
                  </div>
                </div>
              </button>
              {openDropdown === 'profile' && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3.5 bg-[#1D314F] text-white">
                    <div className="font-semibold text-xs">{user?.FullName || 'Test Admin'}</div>
                    <div className="text-[11px] text-white/75">{user?.Email || 'admin@bookly.com'}</div>
                  </div>
                  <div className="p-1.5">
                    {isMasterAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setOpenDropdown(null);
                            setShowPassModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 text-left cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#1B3664]" />
                          <span>Change Password</span>
                        </button>
                        <hr className="my-1 border-slate-100" />
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setOpenDropdown(null);
                            navigate('/ManageSubAgents');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 text-left cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#1B3664]" />
                          <span>Sub Agent & Profile Settings</span>
                        </button>
                        <hr className="my-1 border-slate-100" />
                      </>
                    )}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              <b className="text-[#1B3664]">BOOKLY</b> • B2B Booking &amp; Inventory System
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#1B3664]" />
            <span>B2B Aviation Portal</span>
          </div>
        </footer>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                <h4 className="font-semibold text-sm">Change Account Password</h4>
              </div>
              <button
                onClick={() => setShowPassModal(false)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePasswordChangeSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                Signed in as <b className="text-[#1B3664] font-mono">{user?.LoginID}</b>. Your new password will be cryptographically hashed (Salted SHA-256) before saving.
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  New Strong Password (8+ chars, alphanumeric + 1 special char) *
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="e.g. Pass@1234"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-semibold transition cursor-pointer"
                >
                  Update &amp; Hash Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SESSION TIMEOUT MODAL */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3 flex items-center gap-2.5">
              <Clock className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Session Timeout</h4>
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-slate-600">
                Your session has been idle. Would you like to continue working or sign out?
              </p>
              <div className="flex items-center justify-center gap-2.5 mt-5">
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                >
                  Logout
                </button>
                <button
                  onClick={() => setShowTimeoutModal(false)}
                  className="px-5 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-medium transition-all ${
              t.type === 'error'
                ? 'bg-[#0F172A] text-white border-red-500'
                : 'bg-[#0F172A] text-white border-[#1B3664]'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : t.type === 'warning' ? (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
