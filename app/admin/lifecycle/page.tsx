'use client';

import React, { useState } from "react";
import {
  Briefcase,
  Users,
  AlertOctagon,
  GraduationCap,
  TrendingUp,
  FileBadge,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function LifecycleAndRecruitmentHubPage() {
  const [activeTab, setActiveTab] = useState<"ATS" | "LETTERS" | "DISCIPLINE" | "TRAINING" | "KPI">("ATS");

  // Mock ATS Jobs and Candidates
  const [jobs, setJobs] = useState([
    { id: "1", title: "Senior Full Stack Engineer", dept: "Engineering", type: "Full-Time", applicants: 18, status: "OPEN" },
    { id: "2", title: "HR Business Partner", dept: "Human Resources", type: "Full-Time", applicants: 9, status: "OPEN" },
    { id: "3", title: "Quality Assurance Inspector", dept: "Factory Production", type: "Contract", applicants: 14, status: "SHORTLISTING" },
  ]);

  // Mock Disciplinary Records
  const [disciplinaryList, setDisciplinaryList] = useState([
    { id: "1", employee: "EKH-26-0004 - Arif Hossain", type: "WRITTEN_WARNING", reason: "Repeated unauthorized late attendance past 10:30 AM", date: "2026-10-14", status: "ISSUED" },
    { id: "2", employee: "EKH-26-0003 - Kazi Nazmul", type: "EXPLANATION_CALL", reason: "Unreturned corporate testing equipment after release", date: "2026-10-20", status: "RESOLVED" },
  ]);

  // Mock Training Programs
  const [trainingList, setTrainingList] = useState([
    { id: "1", topic: "Workplace Safety & ISO 9001 Compliance", trainer: "Engr. Mahmudul Hasan", date: "2026-11-05", enrolled: 24, status: "UPCOMING" },
    { id: "2", topic: "Advanced Node.js & Microservices Architecture", trainer: "Lead Architect", date: "2026-10-28", enrolled: 12, status: "IN_PROGRESS" },
  ]);

  // Letter Generator State
  const [letterTemplate, setLetterTemplate] = useState({
    recipientName: "Tanvir Ahmed",
    employeeId: "EKH-26-0001",
    designation: "Principal Software Engineer",
    department: "Engineering Division",
    effectiveDate: "2026-11-01",
    salaryAmount: "120,000",
    letterType: "APPOINTMENT",
  });

  const handlePrintLetter = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-700" />
            Recruitment ATS & Lifecycle Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage job openings, candidate pipeline, corporate letter templates, disciplinary actions, and training.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        {[
          { id: "ATS", label: "Recruitment & ATS Pipeline", icon: Users },
          { id: "LETTERS", label: "Letter Studio & Documents", icon: FileBadge },
          { id: "DISCIPLINE", label: "Disciplinary & Grievance", icon: AlertOctagon },
          { id: "TRAINING", label: "Training & Development", icon: GraduationCap },
          { id: "KPI", label: "KPI & Performance Appraisal", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: ATS RECRUITMENT ================= */}
      {activeTab === "ATS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{job.title}</h3>
                    <p className="text-[10px] text-slate-500">{job.dept} &bull; {job.type}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-[11px]">Active Candidates:</span>
                  <span className="font-bold text-emerald-700">{job.applicants} applied</span>
                </div>
                <button className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition border border-slate-200">
                  View Kanban Pipeline
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: LETTER STUDIO ================= */}
      {activeTab === "LETTERS" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileBadge className="w-4 h-4 text-emerald-700" />
              Letter Configuration
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-700">Document Type</label>
              <select
                value={letterTemplate.letterType}
                onChange={(e) => setLetterTemplate({ ...letterTemplate, letterType: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="APPOINTMENT">Official Appointment Letter</option>
                <option value="PROMOTION">Designation Promotion Letter</option>
                <option value="SALARY_CERTIFICATE">Salary Verification Certificate</option>
                <option value="NOC">No Objection Certificate (NOC)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Employee Full Name</label>
              <input
                type="text"
                value={letterTemplate.recipientName}
                onChange={(e) => setLetterTemplate({ ...letterTemplate, recipientName: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Designation</label>
              <input
                type="text"
                value={letterTemplate.designation}
                onChange={(e) => setLetterTemplate({ ...letterTemplate, designation: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Gross Monthly Salary (BDT)</label>
              <input
                type="text"
                value={letterTemplate.salaryAmount}
                onChange={(e) => setLetterTemplate({ ...letterTemplate, salaryAmount: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              onClick={handlePrintLetter}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>

          <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-8 shadow-xs print:border-none print:shadow-none space-y-5 font-serif text-slate-800 leading-relaxed text-sm">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-sans">
                  EKHONE IT GLOBAL WORKSPACE
                </h1>
                <p className="text-xs text-slate-500 font-sans mt-0.5">Official Human Resource & Legal Department</p>
              </div>
              <p className="text-xs text-slate-400 font-sans">Date: {new Date().toLocaleDateString()}</p>
            </div>

            <p>To,<br /><b>{letterTemplate.recipientName}</b><br />Employee ID: {letterTemplate.employeeId}<br />Department: {letterTemplate.department}</p>

            <p className="font-bold underline uppercase text-xs tracking-wider">
              Subject: {letterTemplate.letterType === "APPOINTMENT" && "Letter of Formal Employment Offer & Appointment"}
              {letterTemplate.letterType === "PROMOTION" && "Notification of Professional Grade Promotion"}
              {letterTemplate.letterType === "SALARY_CERTIFICATE" && "Certificate of Employment and Salary Statement"}
              {letterTemplate.letterType === "NOC" && "No Objection Certificate for Official Endorsement"}
            </p>

            <p>
              Dear {letterTemplate.recipientName},<br />
              We are pleased to formally issue this document confirming your assignment as <b>{letterTemplate.designation}</b>. Your compensations, emoluments, and workplace statutory policies shall comply fully with the Bangladesh National Labor Code 2006.
            </p>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg font-sans text-xs space-y-1">
              <p><b>Designation:</b> {letterTemplate.designation}</p>
              <p><b>Monthly Gross Compensation:</b> BDT {letterTemplate.salaryAmount} / month</p>
              <p><b>Effective Date:</b> {letterTemplate.effectiveDate}</p>
            </div>

            <p className="pt-6">
              Sincerely,<br /><br />
              <b>Authorized HR Signatory</b><br />
              Ekhone IT Workspace Management
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DISCIPLINARY ================= */}
      {activeTab === "DISCIPLINE" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Active Disciplinary & Grievance Actions
              </h2>
              <p className="text-[11px] text-slate-400">Official show-cause notices and warnings.</p>
            </div>
            <button className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Show-Cause</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {disciplinaryList.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{item.employee}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{item.reason}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Issued: {item.date}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: TRAINING ================= */}
      {activeTab === "TRAINING" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                Corporate Training Calendar & Skill Sessions
              </h2>
              <p className="text-[11px] text-slate-400">Scheduled skill development modules and employee enrollments.</p>
            </div>
            <button className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {trainingList.map((tr) => (
              <div key={tr.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{tr.topic}</h3>
                  <p className="text-xs text-slate-500">Conducted by: {tr.trainer} &bull; Date: {tr.date}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">{tr.enrolled} Personnel Enrolled</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {tr.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: KPI ================= */}
      {activeTab === "KPI" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                Dynamic KPI & 360 Performance Appraisal
              </h2>
              <p className="text-[11px] text-slate-400">Quarterly employee objective scores, appraisals, and ratings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p className="text-xs font-bold text-slate-800">Q4 2026 Appraisal Cycle: Active</p>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full w-3/4" />
              </div>
              <p className="text-[10px] text-slate-500">75% of staff evaluations finalized by team supervisors.</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-emerald-950">
              <p className="text-xs font-bold">Top Performance Tier: Grade A+</p>
              <p className="text-[11px] text-emerald-800">Average organizational metric achievement: 91.4%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
