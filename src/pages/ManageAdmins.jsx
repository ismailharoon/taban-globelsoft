import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { usePortal, ALL_ADMIN_PERMISSIONS } from '../context/PortalContext';
import { validateStrongPassword } from '../utils/security';
import ConfirmActionModal from '../components/ConfirmActionModal';

const PERMISSION_ITEMS = [
  {
    key: 'dashboard',
    label: 'Control Center (Dashboard)',
    desc: 'View portal KPIs, revenue summary, and system overview'
  },
  {
    key: 'searchFlight',
    label: 'Search Flight (POS Desk)',
    desc: 'Search routes and create direct flight bookings'
  },
  {
    key: 'bookings',
    label: 'Reservations & Tickets (View)',
    desc: 'View bookings list, passenger details, and print e-tickets'
  },
  {
    key: 'bookingActions',
    label: 'Booking Actions (Approve / Issue / Void / Edit / Delete)',
    desc: 'Approve, reject, issue e-tickets, void tickets, and edit/delete bookings or passengers'
  },
  {
    key: 'segments',
    label: 'Routes & Seat Inventory',
    desc: 'Create/edit flight segments, 3-slab pricing, PNR expiry, and Excel/Word manifests'
  },
  {
    key: 'subAgents',
    label: 'Partner Agencies & Credit Ledger',
    desc: 'Manage sub-agents, top up credit balances, and view/export statements'
  }
];

const INITIAL_ADMIN_FORM = {
  LoginID: '',
  PassCode: '',
  FullName: '',
  Email: '',
  Designation: 'Ticketing & Operations Admin',
  Role: 'Admin',
  AccountStatus: 'Enable',
  Permissions: {
    dashboard: true,
    searchFlight: true,
    bookings: true,
    bookingActions: false,
    segments: false,
    flights: false,
    subAgents: false
  }
};

export default function ManageAdmins() {
  const {
    adminUsers,
    createAdminUser,
    updateAdminUser,
    resetAdmin2FA,
    deleteAdminUser,
    addToast
  } = usePortal();

  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState(INITIAL_ADMIN_FORM);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setForm(INITIAL_ADMIN_FORM);
    setShowModal(true);
  };

  const openEditModal = (adm) => {
    setEditingAdmin(adm);
    setForm({
      LoginID: adm.LoginID || '',
      PassCode: '',
      FullName: adm.FullName || '',
      Email: adm.Email || '',
      Designation: adm.Designation || 'Admin',
      Role: adm.Role || 'Admin',
      AccountStatus: adm.AccountStatus || 'Enable',
      Permissions:
        adm.Role === 'Master Admin'
          ? { ...ALL_ADMIN_PERMISSIONS }
          : {
              dashboard: Boolean(adm.Permissions?.dashboard),
              searchFlight: Boolean(adm.Permissions?.searchFlight),
              bookings: Boolean(adm.Permissions?.bookings),
              bookingActions: Boolean(adm.Permissions?.bookingActions),
              segments: Boolean(adm.Permissions?.segments),
              flights: Boolean(adm.Permissions?.flights),
              subAgents: Boolean(adm.Permissions?.subAgents)
            }
    });
    setShowModal(true);
  };

  const togglePerm = (key) => {
    setForm((prev) => {
      const nextVal = !prev.Permissions[key];
      const nextPerms = { ...prev.Permissions, [key]: nextVal };
      // If Booking Actions is enabled, automatically enable Reservations View
      if (key === 'bookingActions' && nextVal) {
        nextPerms.bookings = true;
      }
      if (key === 'segments') {
        nextPerms.flights = nextVal;
      }
      return { ...prev, Permissions: nextPerms };
    });
  };

  const selectAllPerms = (val) => {
    setForm((prev) => ({
      ...prev,
      Permissions: {
        dashboard: val,
        searchFlight: val,
        bookings: val,
        bookingActions: val,
        segments: val,
        flights: val,
        subAgents: val
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.LoginID.trim() || !form.FullName.trim()) {
      addToast('Please fill in Login ID and Full Name.', 'error');
      return;
    }
    if (!editingAdmin && !form.PassCode.trim()) {
      addToast('Please enter a password for the new Admin.', 'error');
      return;
    }
    if (form.PassCode && form.PassCode.trim().length > 0) {
      const passCheck = validateStrongPassword(form.PassCode);
      if (!passCheck.valid) {
        addToast(passCheck.error, 'error');
        return;
      }
    }
    try {
      if (editingAdmin) {
        await updateAdminUser(editingAdmin.AdminID, form);
      } else {
        await createAdminUser(form);
      }
      setShowModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const isEditingMaster = editingAdmin?.Role === 'Master Admin';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#1B3664]">
            Master Admin Access Control &amp; Staff Roles
          </span>
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-slate-900 mt-0.5">
            Manage Admins &amp; Permissions
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs transition shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1D314F] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Admin Name &amp; Role</th>
                <th className="py-3 px-3">Login ID</th>
                <th className="py-3 px-3">Assigned Module Access</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(adminUsers || []).map((adm) => {
                const isMaster = adm.Role === 'Master Admin';
                const perms = adm.Permissions || {};
                const enabledLabels = isMaster
                  ? ['Full Master Access (All Modules)']
                  : PERMISSION_ITEMS.filter((p) => perms[p.key]).map((p) => p.label);

                return (
                  <tr key={adm.AdminID || adm.LoginID} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{adm.FullName}</span>
                        {isMaster ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1B3664] text-white text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            Master Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                            Sub-Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {adm.Designation || 'Admin'} {adm.Email ? `• ${adm.Email}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="font-semibold text-[#1B3664]">{adm.LoginID}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {enabledLabels.length === 0 ? (
                          <span className="text-[11px] text-red-600 font-medium">
                            No modules assigned
                          </span>
                        ) : (
                          enabledLabels.map((lbl) => (
                            <span
                              key={lbl}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                isMaster
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {lbl}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          adm.AccountStatus === 'Enable'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {adm.AccountStatus || 'Enable'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{adm.Created || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {adm.TwoFactorEnrolled && (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                title: 'Reset 2FA Authenticator',
                                message: `Reset Google Authenticator 2FA for "${adm.FullName}" (${adm.LoginID})? They will scan a new QR code on next login.`,
                                confirmLabel: 'Yes, Reset 2FA',
                                variant: 'warning',
                                action: () => resetAdmin2FA(adm.AdminID)
                              })
                            }
                            className="px-2 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] transition cursor-pointer"
                            title="Reset Google Authenticator 2FA"
                          >
                            Reset 2FA
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(adm)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#1B3664] text-slate-700 hover:text-[#1B3664] font-medium text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isMaster ? 'Edit Credentials' : 'Edit & Permissions'}</span>
                        </button>
                        {!isMaster && (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                title: 'Delete Admin Account',
                                message: `Do you really want to delete admin "${adm.FullName}" (${adm.LoginID})?`,
                                confirmLabel: 'Yes, Delete Admin',
                                variant: 'danger',
                                action: () => deleteAdminUser(adm.AdminID)
                              })
                            }
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-red-600 text-slate-500 hover:text-red-600 transition cursor-pointer"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT ADMIN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm">
                  {editingAdmin
                    ? `Edit Admin - ${editingAdmin.FullName}`
                    : 'Create New Admin Account'}
                </h5>
                <p className="text-[11px] text-white/75">
                  Configure login credentials and select allowed portal modules
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.FullName}
                    onChange={(e) => setForm({ ...form, FullName: e.target.value })}
                    placeholder="e.g. Ahmed Raza"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={form.Designation}
                    onChange={(e) => setForm({ ...form, Designation: e.target.value })}
                    placeholder="e.g. Sales & Ticketing Admin"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Login ID *</label>
                  <input
                    type="text"
                    value={form.LoginID}
                    onChange={(e) => setForm({ ...form, LoginID: e.target.value })}
                    placeholder="e.g. admin_sales"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {editingAdmin ? 'New Password (optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    value={form.PassCode}
                    onChange={(e) => setForm({ ...form, PassCode: e.target.value })}
                    placeholder={
                      editingAdmin
                        ? 'Leave blank to keep current password'
                        : '8+ characters (letters, numbers & symbol)'
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:border-[#1B3664] focus:outline-none"
                    required={!editingAdmin}
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.Email}
                    onChange={(e) => setForm({ ...form, Email: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
                {!isEditingMaster && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                    <select
                      value={form.AccountStatus}
                      onChange={(e) => setForm({ ...form, AccountStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-[#1B3664] focus:outline-none"
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Permissions Selector */}
              {isEditingMaster ? (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <b>Master Admin</b> automatically has unrestricted access to all modules and permissions.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#1B3664] uppercase tracking-wider text-[11px]">
                      Select Allowed Access &amp; Modules
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllPerms(true)}
                        className="text-[11px] font-semibold text-[#1B3664] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => selectAllPerms(false)}
                        className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {PERMISSION_ITEMS.map((item) => {
                      const checked = Boolean(form.Permissions[item.key]);
                      return (
                        <label
                          key={item.key}
                          onClick={() => togglePerm(item.key)}
                          className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${
                            checked
                              ? 'border-[#1B3664] bg-[#EFF4FB]/60'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="mt-0.5 accent-[#1B3664]"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {checked && <CheckCircle2 className="w-3.5 h-3.5 text-[#1B3664]" />}
                            </div>
                            <div className="text-[11px] text-slate-500">{item.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-semibold transition cursor-pointer"
                >
                  {editingAdmin ? 'Save Changes' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          const fn = confirmDialog?.action;
          setConfirmDialog(null);
          if (fn) {
            try {
              await fn();
            } catch (err) {
              addToast(err.message, 'error');
            }
          }
        }}
      />
    </div>
  );
}
