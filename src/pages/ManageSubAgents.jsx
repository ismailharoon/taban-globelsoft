import React, { useState } from 'react';
import {
  Plus,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Banknote,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatDateTime, downloadAgentStatementExcel } from '../utils/exporters';

const INITIAL_AGENT_FORM = {
  CompanyName: '',
  LoginID: '',
  PassCode: '',
  City: 'Karachi',
  Country: 'Pakistan',
  MobileNumber: '',
  AccountStatus: 'Enable',
  Address: '',
  Email: '',
  CreditLimit: 5000000,
  PrimaryColor: '#1B3664',
  SecondaryColor: '#0F172A',
  LightColor: '#EFF4FB',
  SubDomain: '',
  FacebookLink: '',
  TwitterLink: '',
  InstagramLink: '',
  AboutUs: '',
  CompanyHeaderLogo: '',
  CompanyFooterLogo: '',
  CompanyFavIcon: '',
  CompanyBackPicture: ''
};

const INITIAL_USER_FORM = {
  LoginID: '',
  PassCode: '',
  FullName: '',
  Email: '',
  Designation: 'Ticketing Officer',
  WhatsAppNumber: '',
  AccountType: 'Operator',
  AccountStatus: 'Enable',
  Reset2FA: false
};

export default function ManageSubAgents() {
  const {
    subAgents,
    creditTransactions,
    createSubAgent,
    updateSubAgent,
    topUpSubAgentCredit,
    deleteSubAgent,
    createSubAgentUser,
    updateSubAgentUser,
    deleteSubAgentUser,
    addToast
  } = usePortal();

  const [expandedRows, setExpandedRows] = useState({});
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [agentForm, setAgentForm] = useState(INITIAL_AGENT_FORM);

  // Top-Up / Add Credit Modal State
  const [creditTargetAgent, setCreditTargetAgent] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  // Statement Modal State
  const [statementAgent, setStatementAgent] = useState(null);
  const [statementFrom, setStatementFrom] = useState('');
  const [statementTo, setStatementTo] = useState('');

  const getAgentTransactions = (subCompanyId) => {
    return (creditTransactions || [])
      .filter((t) => t.SubCompanyID === subCompanyId)
      .sort((a, b) => String(a.IsoTimestamp || '').localeCompare(String(b.IsoTimestamp || '')));
  };

  const formatSlashDate = (isoOrDate) => {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const [showUserModal, setShowUserModal] = useState(false);
  const [activeSubCompanyId, setActiveSubCompanyId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM);

  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateAgent = () => {
    setEditingAgentId(null);
    setAgentForm(INITIAL_AGENT_FORM);
    setShowAgentModal(true);
  };

  const openEditAgent = (agent) => {
    setEditingAgentId(agent.SubCompanyID);
    setAgentForm({ ...INITIAL_AGENT_FORM, ...agent });
    setShowAgentModal(true);
  };

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    if (!agentForm.CompanyName.trim()) {
      addToast('Company Name is required.', 'error');
      return;
    }
    try {
      if (editingAgentId) {
        await updateSubAgent(editingAgentId, agentForm);
      } else {
        await createSubAgent(agentForm);
      }
      setShowAgentModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openAddUserModal = (subCompanyId) => {
    setActiveSubCompanyId(subCompanyId);
    setEditingUserId(null);
    setUserForm(INITIAL_USER_FORM);
    setShowUserModal(true);
  };

  const openEditUserModal = (subCompanyId, u) => {
    setActiveSubCompanyId(subCompanyId);
    setEditingUserId(u.UserID);
    setUserForm({ ...INITIAL_USER_FORM, ...u });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await updateSubAgentUser(activeSubCompanyId, editingUserId, userForm);
      } else {
        await createSubAgentUser(activeSubCompanyId, userForm);
      }
      setShowUserModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openTopUpModal = (agent) => {
    setCreditTargetAgent(agent);
    setTopUpAmount('');
  };

  const handleConfirmTopUp = async (e) => {
    e.preventDefault();
    if (!creditTargetAgent) return;
    try {
      await topUpSubAgentCredit(creditTargetAgent.SubCompanyID, Number(topUpAmount));
      setCreditTargetAgent(null);
      setTopUpAmount('');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#1B3664]">
            B2B Travel Partner Network & Credit Wallets
          </span>
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-slate-900 mt-0.5">
            Partner Agencies
          </h1>
        </div>
        <button
          onClick={openCreateAgent}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Partner Agency</span>
        </button>
      </div>

      {/* Sub Agents Master-Detail Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1D314F] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-10"></th>
                <th className="py-3 px-3">Company Name & Domain</th>
                <th className="py-3 px-3">City / Country</th>
                <th className="py-3 px-3">Contact & Email</th>
                <th className="py-3 px-3">Credit Limit / Balance</th>
                <th className="py-3 px-3">Branding Swatches</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subAgents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No sub agents added yet. Click &ldquo;Add New Sub Agent&rdquo; to register your first B2B agency.
                  </td>
                </tr>
              ) : (
                subAgents.map((agent) => {
                  const isExpanded = Boolean(expandedRows[agent.SubCompanyID]);
                  return (
                    <React.Fragment key={agent.SubCompanyID}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleExpand(agent.SubCompanyID)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white transition cursor-pointer"
                            title="Expand Users"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-xs text-slate-900">{agent.CompanyName}</div>
                          <div className="text-[11px] text-[#1B3664] font-mono">
                            {agent.SubDomain || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{agent.City}</div>
                          <div className="text-[11px] text-slate-500">{agent.Country}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-medium">{agent.MobileNumber}</div>
                          <div className="text-[11px] text-slate-500">{agent.Email}</div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="font-semibold text-[#1B3664]">
                            Lim: {formatCurrencyPKR(agent.CreditLimit)}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Bal: {formatCurrencyPKR(agent.CreditLimitBalance)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Used: {formatCurrencyPKR(Math.max(0, (Number(agent.CreditLimit) || 0) - (Number(agent.CreditLimitBalance) || 0)))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: agent.PrimaryColor || '#1B3664' }}
                              title={`Primary: ${agent.PrimaryColor}`}
                            />
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: agent.SecondaryColor || '#0F172A' }}
                              title={`Secondary: ${agent.SecondaryColor}`}
                            />
                            <span
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ backgroundColor: agent.LightColor || '#EFF4FB' }}
                              title={`Light: ${agent.LightColor}`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              agent.AccountStatus === 'Enable'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {agent.AccountStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{agent.Created}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openTopUpModal(agent)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Add / Top-Up Credit Balance"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>+ Add Credit</span>
                            </button>
                            <button
                              onClick={() => setStatementAgent(agent)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="View Credit / Debit Statement"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Statement</span>
                            </button>
                            <button
                              onClick={() =>
                                downloadAgentStatementExcel(
                                  agent,
                                  getAgentTransactions(agent.SubCompanyID)
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Export Live Statement to Excel (.xlsx)"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Excel</span>
                            </button>
                            <button
                              onClick={() => openAddUserModal(agent.SubCompanyID)}
                              className="px-2.5 py-1 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add User</span>
                            </button>
                            <button
                              onClick={() => openEditAgent(agent)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] cursor-pointer"
                              title="Edit Sub Agent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete Sub Agent "${agent.CompanyName}"?`)) {
                                  deleteSubAgent(agent.SubCompanyID);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-red-600 text-slate-500 hover:text-red-600 cursor-pointer"
                              title="Delete Sub Agent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED SUB AGENT USERS TABLE */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="p-4 border-b border-slate-200">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                                <h5 className="font-display font-semibold text-xs uppercase tracking-wider text-[#1B3664] flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5" />
                                  Registered Users for {agent.CompanyName} ({(agent.Users || []).length})
                                </h5>
                                <button
                                  onClick={() => openAddUserModal(agent.SubCompanyID)}
                                  className="px-2.5 py-1 rounded-lg bg-[#1B3664] text-white font-medium text-[11px] hover:bg-[#0F172A] transition cursor-pointer"
                                >
                                  + Add New User
                                </button>
                              </div>
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <th className="py-2 px-3">Login ID</th>
                                    <th className="py-2 px-3">Full Name</th>
                                    <th className="py-2 px-3">Email</th>
                                    <th className="py-2 px-3">Designation</th>
                                    <th className="py-2 px-3">WhatsApp Number</th>
                                    <th className="py-2 px-3">Account Type</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(agent.Users || []).length === 0 ? (
                                    <tr>
                                      <td colSpan={8} className="py-5 text-center text-slate-500">
                                        No users registered under this Sub Agent yet.
                                      </td>
                                    </tr>
                                  ) : (
                                    (agent.Users || []).map((u) => (
                                      <tr key={u.UserID} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-mono font-semibold text-[#1B3664]">
                                          {u.LoginID}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-slate-900">
                                          {u.FullName}
                                        </td>
                                        <td className="py-2 px-3">{u.Email}</td>
                                        <td className="py-2 px-3">{u.Designation}</td>
                                        <td className="py-2 px-3 font-mono">{u.WhatsAppNumber}</td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1B3664] font-medium">
                                            {u.AccountType}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3">{u.AccountStatus}</td>
                                        <td className="py-2 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={() => openEditUserModal(agent.SubCompanyID, u)}
                                              className="px-2.5 py-1 rounded-lg bg-[#1B3664] text-white text-[11px] font-medium hover:bg-[#0F172A] transition cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (window.confirm(`Delete user ${u.LoginID}?`)) {
                                                  deleteSubAgentUser(agent.SubCompanyID, u.UserID);
                                                }
                                              }}
                                              className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT SUB AGENT MODAL */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h5 className="font-semibold text-sm">
                {editingAgentId ? 'Edit SubAgent' : 'Add SubAgent'}
              </h5>
              <button
                onClick={() => setShowAgentModal(false)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={agentForm.CompanyName}
                    onChange={(e) => setAgentForm({ ...agentForm, CompanyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={agentForm.City}
                    onChange={(e) => setAgentForm({ ...agentForm, City: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={agentForm.Country}
                    onChange={(e) => setAgentForm({ ...agentForm, Country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={agentForm.MobileNumber}
                    onChange={(e) => setAgentForm({ ...agentForm, MobileNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={agentForm.Email}
                    onChange={(e) => setAgentForm({ ...agentForm, Email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Credit Limit (PKR)</label>
                  <input
                    type="number"
                    value={agentForm.CreditLimit}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, CreditLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={agentForm.AccountStatus}
                    onChange={(e) => setAgentForm({ ...agentForm, AccountStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                  </select>
                </div>
              </div>

              {!editingAgentId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-lg bg-[#EFF4FB] border border-[#1B3664]/20">
                  <div>
                    <label className="block font-semibold text-[#1B3664] mb-1">
                      Sub-Agent Login ID (For POS Login)
                    </label>
                    <input
                      type="text"
                      value={agentForm.LoginID || ''}
                      onChange={(e) => setAgentForm({ ...agentForm, LoginID: e.target.value })}
                      placeholder="e.g. agent1"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1B3664] mb-1">
                      Sub-Agent Password
                    </label>
                    <input
                      type="text"
                      value={agentForm.PassCode || ''}
                      onChange={(e) => setAgentForm({ ...agentForm, PassCode: e.target.value })}
                      placeholder="e.g. Pass@123"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={agentForm.Address}
                  onChange={(e) => setAgentForm({ ...agentForm, Address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* White-Label Colors & Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={agentForm.PrimaryColor || '#1B3664'}
                    onChange={(e) => setAgentForm({ ...agentForm, PrimaryColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={agentForm.SecondaryColor || '#0F172A'}
                    onChange={(e) => setAgentForm({ ...agentForm, SecondaryColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Light Color</label>
                  <input
                    type="color"
                    value={agentForm.LightColor || '#EFF4FB'}
                    onChange={(e) => setAgentForm({ ...agentForm, LightColor: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sub Domain</label>
                  <input
                    type="text"
                    value={agentForm.SubDomain}
                    onChange={(e) => setAgentForm({ ...agentForm, SubDomain: e.target.value })}
                    placeholder="sub.domain.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Social Links & About Us */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Facebook Link</label>
                  <input
                    type="text"
                    value={agentForm.FacebookLink}
                    onChange={(e) => setAgentForm({ ...agentForm, FacebookLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Twitter Link</label>
                  <input
                    type="text"
                    value={agentForm.TwitterLink}
                    onChange={(e) => setAgentForm({ ...agentForm, TwitterLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Instagram Link</label>
                  <input
                    type="text"
                    value={agentForm.InstagramLink}
                    onChange={(e) => setAgentForm({ ...agentForm, InstagramLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">About Us</label>
                <textarea
                  rows={2}
                  value={agentForm.AboutUs}
                  onChange={(e) => setAgentForm({ ...agentForm, AboutUs: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Save SubAgent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / TOP-UP CREDIT MODAL */}
      {creditTargetAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm">
                  Add / Top-Up Agency Credit
                </h5>
                <p className="text-[11px] text-white/75">
                  {creditTargetAgent.CompanyName} ({creditTargetAgent.City})
                </p>
              </div>
              <button
                onClick={() => setCreditTargetAgent(null)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTopUp} className="p-5 space-y-4 text-xs">
              {/* Current Credit Breakdown */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Total Credit Limit:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrencyPKR(creditTargetAgent.CreditLimit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Credit Used:</span>
                  <span className="font-semibold text-amber-700">
                    {formatCurrencyPKR(
                      Math.max(
                        0,
                        (Number(creditTargetAgent.CreditLimit) || 0) -
                          (Number(creditTargetAgent.CreditLimitBalance) || 0)
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-sans font-semibold text-slate-700">
                    Current Available Balance:
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrencyPKR(creditTargetAgent.CreditLimitBalance)}
                  </span>
                </div>
              </div>

              {/* Amount to Add */}
              <div>
                <label className="block font-semibold text-[#1B3664] mb-1">
                  Enter Additional Credit Amount to Add (PKR) *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 3000000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-sm text-[#1B3664] focus:border-[#1B3664] focus:outline-none"
                  required
                />
                {/* Quick Preset Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: '+1 Million', val: 1000000 },
                    { label: '+2 Million', val: 2000000 },
                    { label: '+3 Million', val: 3000000 },
                    { label: '+4 Million', val: 4000000 },
                    { label: '+5 Million', val: 5000000 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() =>
                        setTopUpAmount(String((Number(topUpAmount) || 0) + preset.val))
                      }
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-[#1B3664] text-slate-700 hover:text-white font-mono text-[11px] font-semibold transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Balance Preview */}
              {Number(topUpAmount) > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1 font-mono">
                  <div className="flex justify-between text-emerald-900">
                    <span className="font-sans font-semibold">New Available Balance:</span>
                    <span className="font-bold text-sm">
                      {formatCurrencyPKR(
                        (Number(creditTargetAgent.CreditLimitBalance) || 0) +
                          (Number(topUpAmount) || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span className="font-sans">New Total Credit Limit:</span>
                    <span>
                      {formatCurrencyPKR(
                        (Number(creditTargetAgent.CreditLimit) || 0) +
                          (Number(topUpAmount) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreditTargetAgent(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer"
                >
                  Confirm &amp; Add Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUB AGENT USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm">
                {editingUserId ? 'Edit User' : 'Add User'}
              </h5>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Login ID *</label>
                  <input
                    type="text"
                    disabled={Boolean(editingUserId)}
                    value={userForm.LoginID}
                    onChange={(e) => setUserForm({ ...userForm, LoginID: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold disabled:bg-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pass Code *</label>
                  <input
                    type="text"
                    value={userForm.PassCode}
                    onChange={(e) => setUserForm({ ...userForm, PassCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={userForm.FullName}
                    onChange={(e) => setUserForm({ ...userForm, FullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={userForm.Email}
                    onChange={(e) => setUserForm({ ...userForm, Email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={userForm.Designation}
                    onChange={(e) => setUserForm({ ...userForm, Designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">WhatsApp Number *</label>
                  <input
                    type="text"
                    value={userForm.WhatsAppNumber}
                    onChange={(e) => setUserForm({ ...userForm, WhatsAppNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Type</label>
                  <select
                    value={userForm.AccountType}
                    onChange={(e) => setUserForm({ ...userForm, AccountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={userForm.AccountStatus}
                    onChange={(e) => setUserForm({ ...userForm, AccountStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-[#1B3664]">
                <input
                  type="checkbox"
                  checked={Boolean(userForm.Reset2FA)}
                  onChange={(e) => setUserForm({ ...userForm, Reset2FA: e.target.checked })}
                />
                <span>Reset 2FA</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGENT CREDIT / DEBIT STATEMENT MODAL */}
      {statementAgent && (() => {
        const allTxs = getAgentTransactions(statementAgent.SubCompanyID);
        const txs = allTxs.filter((t) => {
          const day = String(t.IsoTimestamp || '').slice(0, 10);
          if (statementFrom && day && day < statementFrom) return false;
          if (statementTo && day && day > statementTo) return false;
          return true;
        });
        const totalCredited = txs
          .filter((t) => t.Type === 'CREDIT')
          .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
        const totalDebited = txs
          .filter((t) => t.Type === 'DEBIT')
          .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
        const openingBal =
          txs.length > 0
            ? Number(txs[0].PreviousBalance) || 0
            : Number(statementAgent.CreditLimitBalance) || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-[#1D314F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <h5 className="font-semibold text-sm">
                    BOOKLY Statement — {statementAgent.CompanyName}
                  </h5>
                  <p className="text-[11px] text-white/75">
                    Agency ID: {statementAgent.SubCompanyID} • Live Account Ledger
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg text-[11px]">
                    <span>From:</span>
                    <input
                      type="date"
                      value={statementFrom}
                      onChange={(e) => setStatementFrom(e.target.value)}
                      className="bg-transparent text-white border-b border-white/30 focus:outline-none text-[11px]"
                    />
                    <span>To:</span>
                    <input
                      type="date"
                      value={statementTo}
                      onChange={(e) => setStatementTo(e.target.value)}
                      className="bg-transparent text-white border-b border-white/30 focus:outline-none text-[11px]"
                    />
                  </div>
                  <button
                    onClick={() =>
                      downloadAgentStatementExcel(statementAgent, txs, {
                        from: statementFrom,
                        to: statementTo
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => setStatementAgent(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">
                      Total Credit Limit
                    </div>
                    <div className="font-mono font-bold text-sm text-[#1B3664] mt-0.5">
                      {formatCurrencyPKR(statementAgent.CreditLimit)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-semibold uppercase text-emerald-700">
                      Total Credited (+)
                    </div>
                    <div className="font-mono font-bold text-sm text-emerald-800 mt-0.5">
                      {formatCurrencyPKR(totalCredited)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-[10px] font-semibold uppercase text-red-700">
                      Total Ticket Debits (-)
                    </div>
                    <div className="font-mono font-bold text-sm text-red-700 mt-0.5">
                      {formatCurrencyPKR(totalDebited)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#EFF4FB] border border-[#1B3664]/20">
                    <div className="text-[10px] font-semibold uppercase text-[#1B3664]">
                      Current Available Balance
                    </div>
                    <div className="font-mono font-bold text-sm text-[#1B3664] mt-0.5">
                      {formatCurrencyPKR(statementAgent.CreditLimitBalance)}
                    </div>
                  </div>
                </div>

                {/* Transactions Table matching Statement format */}
                <div className="border border-slate-400 rounded-lg overflow-hidden">
                  {/* Grey Statement Header Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 bg-[#D9D9D9] border-b border-slate-400 text-slate-900">
                    <div className="sm:col-span-7 p-3 border-b sm:border-b-0 sm:border-r border-slate-400 space-y-0.5">
                      <div className="font-bold text-base tracking-tight">BOOKLY-</div>
                      <div className="text-[11px]">
                        <span className="font-semibold">ADDRESS:</span>{' '}
                        {[statementAgent.Address, statementAgent.City, statementAgent.Country]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </div>
                      <div className="text-[11px]">
                        <span className="font-semibold">Phone:</span>{' '}
                        {statementAgent.MobileNumber || '—'}
                      </div>
                      <div className="text-[11px]">
                        <span className="font-semibold">Email:</span> {statementAgent.Email || '—'}
                      </div>
                    </div>
                    <div className="sm:col-span-5 flex flex-col justify-center text-center divide-y divide-slate-400">
                      <div className="py-1 font-bold text-xs">Statement</div>
                      <div className="py-1 font-semibold text-[11px]">
                        From:{' '}
                        {statementFrom
                          ? formatSlashDate(statementFrom)
                          : txs.length > 0
                          ? formatSlashDate(txs[0].IsoTimestamp)
                          : formatSlashDate(new Date())}{' '}
                        to{' '}
                        {statementTo
                          ? formatSlashDate(statementTo)
                          : txs.length > 0
                          ? formatSlashDate(txs[txs.length - 1].IsoTimestamp)
                          : formatSlashDate(new Date())}
                      </div>
                      <div className="py-2 font-bold text-sm uppercase">
                        AGENT : {statementAgent.CompanyName}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#A9D08E] text-slate-900 font-bold border-b border-slate-400 text-[11px] uppercase">
                          <th className="py-2 px-3 border-r border-slate-400">N.NO</th>
                          <th className="py-2 px-3 border-r border-slate-400">DATE</th>
                          <th className="py-2 px-3 border-r border-slate-400">VOUCHER</th>
                          <th className="py-2 px-3 border-r border-slate-400">PNR</th>
                          <th className="py-2 px-3 border-r border-slate-400">DETAILS OF TRANSACTION</th>
                          <th className="py-2 px-3 border-r border-slate-400 text-right">DEBIT AMT</th>
                          <th className="py-2 px-3 border-r border-slate-400 text-right">CREDIT AMT</th>
                          <th className="py-2 px-3 text-right">BALANCE .CR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-slate-50 font-semibold">
                          <td className="py-2 px-3 border-r border-slate-200"></td>
                          <td className="py-2 px-3 border-r border-slate-200"></td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono">OPENING</td>
                          <td className="py-2 px-3 border-r border-slate-200"></td>
                          <td className="py-2 px-3 border-r border-slate-200">OPENING BALANCE .CR.....</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right"></td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right"></td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#1B3664]">
                            {Number(openingBal).toLocaleString('en-US')}
                          </td>
                        </tr>
                        {txs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No credit or debit transactions recorded yet for this agency.
                            </td>
                          </tr>
                        ) : (
                          txs.map((tx, idx) => {
                            const isCredit = tx.Type === 'CREDIT';
                            const voucher = tx.Voucher || (isCredit ? 'RV' : 'SALE');
                            return (
                              <tr key={tx.TransactionID || idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                  {formatSlashDate(tx.IsoTimestamp)}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isCredit
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-blue-50 text-[#1B3664]'
                                    }`}
                                  >
                                    {voucher}
                                  </span>
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold text-[#1B3664]">
                                  {tx.ReferencePNR || ''}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                                  {tx.Description}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-red-600">
                                  {!isCredit ? Number(tx.Amount || 0).toLocaleString('en-US') : ''}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                                  {isCredit ? Number(tx.Amount || 0).toLocaleString('en-US') : ''}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-[#1B3664]">
                                  {Number(tx.CurrentBalance || 0).toLocaleString('en-US')}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
