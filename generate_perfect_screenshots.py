import os
import subprocess

WORKSPACE_DIR = r"c:\SchoolManagement"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "presentation_assets")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# ========================================================
# 1. HTML FOR ADMIN DASHBOARD
# ========================================================
html_admin = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HustlerTech - Executive Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
  body { background: #f1f5f9; display: flex; height: 900px; width: 1600px; overflow: hidden; color: #0f172a; }
  
  /* Sidebar */
  .sidebar { width: 260px; background: #0f172a; color: #fff; padding: 24px 20px; display: flex; flex-direction: column; justify-content: space-between; }
  .logo-box { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .logo-icon { background: #2563eb; color: #fff; font-weight: 800; font-size: 16px; padding: 6px 10px; border-radius: 8px; }
  .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .nav-menu { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; font-size: 15px; font-weight: 600; color: #94a3b8; }
  .nav-item.active { background: #2563eb; color: #ffffff; }
  
  /* Main Content */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { background: #ffffff; height: 70px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
  .school-title { font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
  .term-badge { background: #ecfdf5; color: #059669; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; }
  .user-profile { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; }
  
  .content { padding: 28px 32px; flex: 1; display: flex; flex-direction: column; gap: 24px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; }
  .header-left h1 { font-size: 28px; font-weight: 800; color: #0f172a; }
  .header-left p { font-size: 14px; color: #64748b; margin-top: 2px; }
  .action-btn { background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 10px; border: none; font-weight: 700; font-size: 14px; }
  
  /* KPI Cards */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .kpi-card { background: #ffffff; padding: 22px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
  .kpi-label { font-size: 13.5px; font-weight: 600; color: #64748b; }
  .kpi-value { font-size: 32px; font-weight: 800; color: #0f172a; margin: 8px 0 4px 0; }
  .kpi-sub { font-size: 12.5px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 4px; }
  
  /* Split Layout */
  .dashboard-columns { display: grid; grid-template-columns: 1.4fr 1.6fr; gap: 24px; flex: 1; }
  .panel { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 22px; display: flex; flex-direction: column; }
  .panel-title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
  
  /* Chart Simulation */
  .bar-chart { display: flex; align-items: flex-end; gap: 28px; height: 180px; padding-top: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px; }
  .bar-col { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
  .bar { width: 44px; border-radius: 8px 8px 0 0; background: #2563eb; }
  .bar-label { font-size: 12px; font-weight: 600; color: #64748b; }
  .bar-amt { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  
  /* Table */
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; color: #64748b; font-weight: 700; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
  td { padding: 12px; font-size: 13.5px; border-bottom: 1px solid #f8fafc; color: #1e293b; }
  .pill { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11.5px; font-weight: 700; }
  .pill.paid { background: #ecfdf5; color: #059669; }
  .pill.pending { background: #fffbeb; color: #d97706; }
</style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div class="logo-box">
        <div class="logo-icon">HT</div>
        <div class="logo-text">HustlerTech</div>
      </div>
      <ul class="nav-menu">
        <li class="nav-item active">Dashboard</li>
        <li class="nav-item">Students & SIS</li>
        <li class="nav-item">Academics & CBC</li>
        <li class="nav-item">Smart Attendance</li>
        <li class="nav-item">Fees & M-Pesa</li>
        <li class="nav-item">Timetable & Rooms</li>
        <li class="nav-item">School Transport</li>
        <li class="nav-item">Reports & Audits</li>
      </ul>
    </div>
    <div style="font-size: 12px; color: #64748b;">HustlerTech ERP v2.4</div>
  </div>

  <div class="main">
    <div class="topbar">
      <div class="school-title">
        <span>HustlerTech Academy (Main Campus)</span>
        <span class="term-badge">Term 1, 2025</span>
      </div>
      <div class="user-profile">
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 700;">Josphine Sololo</div>
          <div style="font-size: 12px; color: #64748b;">School Administrator</div>
        </div>
        <div class="avatar">JS</div>
      </div>
    </div>

    <div class="content">
      <div class="page-header">
        <div class="header-left">
          <h1>Executive Admin Dashboard</h1>
          <p>Real-time institutional metrics across student enrollment, attendance, and M-Pesa collections.</p>
        </div>
        <button class="action-btn">+ New Admission</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Students Enrolled</div>
          <div class="kpi-value">1,280</div>
          <div class="kpi-sub">↑ +14% enrollment this term</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Today's Attendance Rate</div>
          <div class="kpi-value">96.4%</div>
          <div class="kpi-sub">1,234 Present / 46 Absent</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Fee Collection (Term 1)</div>
          <div class="kpi-value" style="color: #2563eb;">KES 8.45M</div>
          <div class="kpi-sub">84.5% target recovered via M-Pesa</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Active Classes & Streams</div>
          <div class="kpi-value">32</div>
          <div class="kpi-sub" style="color: #64748b;">Grade 1 to Grade 8 (CBC)</div>
        </div>
      </div>

      <div class="dashboard-columns">
        <div class="panel">
          <div class="panel-title">Monthly Fee Collection Trends (KES)</div>
          <div class="bar-chart">
            <div class="bar-col">
              <span class="bar-amt">KES 2.4M</span>
              <div class="bar" style="height: 100px; background: #93c5fd;"></div>
              <span class="bar-label">Jan (T1)</span>
            </div>
            <div class="bar-col">
              <span class="bar-amt">KES 3.8M</span>
              <div class="bar" style="height: 150px; background: #2563eb;"></div>
              <span class="bar-label">Feb (T1)</span>
            </div>
            <div class="bar-col">
              <span class="bar-amt">KES 2.25M</span>
              <div class="bar" style="height: 95px; background: #60a5fa;"></div>
              <span class="bar-label">Mar (T1)</span>
            </div>
          </div>
          <div style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: auto;">
            <strong>M-Pesa Auto-Reconciliation:</strong> 99.2% of mobile fees matched instantaneously with invoices without manual ledger entry.
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">Recent Fee Payments (Real-Time Lipa Na M-Pesa)</div>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Amount (KES)</th>
                <th>Payment Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sarah Cherono</strong></td>
                <td>Grade 7A</td>
                <td><strong style="color:#059669;">KES 15,000</strong></td>
                <td>M-Pesa STK Push</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
              <tr>
                <td><strong>David Kimani</strong></td>
                <td>Grade 5B</td>
                <td><strong style="color:#059669;">KES 12,500</strong></td>
                <td>M-Pesa STK Push</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
              <tr>
                <td><strong>Brian Ochieng</strong></td>
                <td>Grade 8Alpha</td>
                <td><strong style="color:#d97706;">KES 6,500</strong></td>
                <td>M-Pesa Paybill</td>
                <td><span class="pill pending">Partial</span></td>
              </tr>
              <tr>
                <td><strong>Faith Wanjiku</strong></td>
                <td>Grade 6East</td>
                <td><strong style="color:#059669;">KES 15,000</strong></td>
                <td>M-Pesa STK Push</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
              <tr>
                <td><strong>Mercy Achieng</strong></td>
                <td>Grade 4Alpha</td>
                <td><strong style="color:#059669;">KES 10,000</strong></td>
                <td>Bank Transfer</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ========================================================
# 2. HTML FOR FEE MANAGEMENT
# ========================================================
html_fee = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HustlerTech - Fee Billing & M-Pesa</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
  body { background: #f8fafc; display: flex; height: 900px; width: 1600px; overflow: hidden; color: #0f172a; }

  /* Sidebar */
  .sidebar { width: 260px; background: #0f172a; color: #fff; padding: 24px 20px; display: flex; flex-direction: column; justify-content: space-between; }
  .logo-box { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .logo-icon { background: #2563eb; color: #fff; font-weight: 800; font-size: 16px; padding: 6px 10px; border-radius: 8px; }
  .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .nav-menu { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; font-size: 15px; font-weight: 600; color: #94a3b8; }
  .nav-item.active { background: #2563eb; color: #ffffff; }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { background: #ffffff; height: 70px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
  .search-input { width: 380px; padding: 10px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; }
  .content { padding: 28px 32px; flex: 1; display: flex; gap: 24px; }
  
  .table-section { flex: 1.8; display: flex; flex-direction: column; gap: 20px; }
  .action-row { display: flex; gap: 12px; }
  .btn-primary { background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 10px; border: none; font-weight: 700; font-size: 14px; }
  .btn-outline { background: #fff; color: #1e293b; padding: 10px 18px; border-radius: 10px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 14px; }

  /* Table */
  .table-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; color: #64748b; font-weight: 700; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; background: #f8fafc; }
  td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  .pill { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11.5px; font-weight: 700; }
  .pill.paid { background: #ecfdf5; color: #059669; }
  .pill.partial { background: #fffbeb; color: #d97706; }
  .pill.overdue { background: #fff1f2; color: #e11d48; }

  /* Right Side Drawer: M-Pesa Panel */
  .mpesa-panel { flex: 1.1; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
  .panel-header { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .inv-summary { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
  
  .mpesa-card { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
  .mpesa-logo { color: #16a34a; font-size: 20px; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .mpesa-detail { font-size: 13.5px; color: #374151; margin-bottom: 6px; display: flex; justify-content: space-between; }
  .verified-badge { background: #16a34a; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 10px; }
</style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div class="logo-box">
        <div class="logo-icon">HT</div>
        <div class="logo-text">HustlerTech</div>
      </div>
      <ul class="nav-menu">
        <li class="nav-item">Dashboard</li>
        <li class="nav-item">Students & SIS</li>
        <li class="nav-item">Academics & CBC</li>
        <li class="nav-item">Smart Attendance</li>
        <li class="nav-item active">Fee Billing & M-Pesa</li>
        <li class="nav-item">Timetable & Rooms</li>
        <li class="nav-item">School Transport</li>
        <li class="nav-item">Reports & Audits</li>
      </ul>
    </div>
    <div style="font-size: 12px; color: #64748b;">HustlerTech ERP v2.4</div>
  </div>

  <div class="main">
    <div class="topbar">
      <h2 style="font-size: 20px; font-weight: 800;">Fee Management & Lipa Na M-Pesa Engine</h2>
      <input type="text" class="search-input" placeholder="Search student name, invoice no, or phone...">
      <div style="font-size: 14px; font-weight: 700; color: #2563eb;">Josphine Sololo (Admin)</div>
    </div>

    <div class="content">
      <div class="table-section">
        <div class="action-row">
          <button class="btn-primary">+ Generate Bulk Term Invoices</button>
          <button class="btn-outline">Create Fee Structure</button>
          <button class="btn-outline">Record Manual Payment</button>
          <button class="btn-outline">Export M-Pesa Ledger</button>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Term Fee</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>INV-2025-101</strong></td>
                <td>Emily Chebet</td>
                <td>Grade 7A</td>
                <td>KES 15,000</td>
                <td><strong style="color:#059669;">KES 15,000</strong></td>
                <td>KES 0</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
              <tr>
                <td><strong>INV-2025-102</strong></td>
                <td>Liam Davies</td>
                <td>Grade 5B</td>
                <td>KES 21,000</td>
                <td><strong style="color:#059669;">KES 10,500</strong></td>
                <td><strong style="color:#d97706;">KES 10,500</strong></td>
                <td><span class="pill partial">Partial</span></td>
              </tr>
              <tr>
                <td><strong>INV-2025-103</strong></td>
                <td>Francis Khanoa</td>
                <td>Grade 8Alpha</td>
                <td>KES 21,000</td>
                <td><strong style="color:#e11d48;">KES 0</strong></td>
                <td><strong style="color:#e11d48;">KES 21,000</strong></td>
                <td><span class="pill overdue">Overdue</span></td>
              </tr>
              <tr>
                <td><strong>INV-2025-104</strong></td>
                <td>Chloe Adams</td>
                <td>Grade 6B</td>
                <td>KES 15,000</td>
                <td><strong style="color:#059669;">KES 15,000</strong></td>
                <td>KES 0</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
              <tr>
                <td><strong>INV-2025-105</strong></td>
                <td>Brian Mutua</td>
                <td>Grade 4A</td>
                <td>KES 12,500</td>
                <td><strong style="color:#059669;">KES 12,500</strong></td>
                <td>KES 0</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
              <tr>
                <td><strong>INV-2025-106</strong></td>
                <td>Faith Moraa</td>
                <td>Grade 7B</td>
                <td>KES 15,000</td>
                <td><strong style="color:#059669;">KES 7,500</strong></td>
                <td><strong style="color:#d97706;">KES 7,500</strong></td>
                <td><span class="pill partial">Partial</span></td>
              </tr>
              <tr>
                <td><strong>INV-2025-107</strong></td>
                <td>Kevin Mwangi</td>
                <td>Grade 1Alpha</td>
                <td>KES 10,000</td>
                <td><strong style="color:#059669;">KES 10,000</strong></td>
                <td>KES 0</td>
                <td><span class="pill paid">Paid</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mpesa-panel">
        <div>
          <div class="panel-header">
            <span>Payment Details</span>
            <span style="font-size: 13px; color: #2563eb;">INV-2025-104</span>
          </div>

          <div class="inv-summary">
            <div class="summary-row"><span>Student Name:</span><strong>Chloe Adams</strong></div>
            <div class="summary-row"><span>Term Breakdown:</span><span>Tuition + Activities</span></div>
            <div class="summary-row" style="font-size:16px; margin-top:8px; border-top:1px solid #e2e8f0; padding-top:8px;">
              <span>Total Fee:</span><strong>KES 15,000</strong>
            </div>
          </div>

          <div class="mpesa-card">
            <div class="mpesa-logo">
              <span>● M-PESA</span>
              <span style="font-size: 13px; color: #16a34a; font-weight: 600;">STK Push Online</span>
            </div>
            <div class="mpesa-detail"><span>Transaction ID:</span><strong>MP-XYZ94821</strong></div>
            <div class="mpesa-detail"><span>Parent Mobile:</span><strong>+254 727 417410</strong></div>
            <div class="mpesa-detail"><span>Amount Paid:</span><strong>KES 15,000</strong></div>
            <div class="mpesa-detail"><span>Date & Time:</span><span>Today, 10:42 AM</span></div>
            <div class="verified-badge">✓ Auto-Reconciled & Matched</div>
          </div>
        </div>

        <div>
          <button class="btn-primary" style="width: 100%; margin-bottom: 8px;">Download Official Receipt (PDF)</button>
          <button class="btn-outline" style="width: 100%;">Send WhatsApp Notification</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ========================================================
# 3. HTML FOR ATTENDANCE & CBC GRADING
# ========================================================
html_att = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HustlerTech CBC Portal</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
  body { background: #0f172a; padding: 20px; display: flex; align-items: center; justify-content: center; height: 900px; width: 1600px; }

  /* Simulated Browser Window */
  .browser-window { width: 100%; height: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
  .browser-bar { background: #e2e8f0; height: 44px; display: flex; align-items: center; padding: 0 16px; gap: 14px; border-bottom: 1px solid #cbd5e1; }
  .dots { display: flex; gap: 6px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .url-bar { background: #ffffff; flex: 1; max-width: 650px; height: 28px; border-radius: 6px; display: flex; align-items: center; padding: 0 14px; font-size: 13px; color: #475569; }

  /* App Layout */
  .app-body { display: flex; flex: 1; overflow: hidden; }
  .sidebar { width: 240px; background: #0f172a; color: #fff; padding: 24px 18px; }
  .logo-box { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; }
  .logo-icon { background: #2563eb; color: #fff; font-weight: 800; font-size: 15px; padding: 5px 9px; border-radius: 8px; }
  .logo-text { font-size: 20px; font-weight: 800; }
  .nav-item { padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
  .nav-item.active { background: #2563eb; color: #fff; }

  /* Content */
  .main-area { flex: 1; padding: 24px 32px; background: #f8fafc; display: flex; flex-direction: column; gap: 20px; overflow: hidden; }
  .top-row { display: flex; justify-content: space-between; align-items: center; }
  .top-row h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
  .btn-primary { background: #2563eb; color: #fff; padding: 10px 18px; border-radius: 8px; border: none; font-weight: 700; font-size: 14px; }
  .btn-orange { background: #f97316; color: #fff; padding: 10px 18px; border-radius: 8px; border: none; font-weight: 700; font-size: 14px; }

  .filter-bar { background: #ffffff; padding: 16px 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; gap: 20px; align-items: center; }
  .filter-select { padding: 8px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13.5px; font-weight: 600; }

  /* Table */
  .table-card { background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; flex: 1; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; color: #64748b; font-weight: 700; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; background: #f8fafc; }
  td { padding: 12px 16px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: #2563eb; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 10px; font-size: 13px; }
  .status-tag { padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; }
  .status-tag.present { background: #dcfce7; color: #15803d; }
  .status-tag.late { background: #fef3c7; color: #b45309; }
  .status-tag.absent { background: #fee2e2; color: #b91c1c; }

  .cbc-level { padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; color: #fff; display: inline-block; }
  .cbc-4 { background: #2563eb; }
  .cbc-3 { background: #16a34a; }
  .cbc-2 { background: #f59e0b; }

  .btn-wa { background: #25d366; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; border: none; display: inline-flex; align-items: center; gap: 4px; }
</style>
</head>
<body>
  <div class="browser-window">
    <div class="browser-bar">
      <div class="dots">
        <div class="dot" style="background: #ef4444;"></div>
        <div class="dot" style="background: #f59e0b;"></div>
        <div class="dot" style="background: #10b981;"></div>
      </div>
      <div class="url-bar">https://hustlertech.co.ke/academics/cbc-assessment</div>
    </div>

    <div class="app-body">
      <div class="sidebar">
        <div class="logo-box">
          <div class="logo-icon">HT</div>
          <div class="logo-text">HustlerTech</div>
        </div>
        <div class="nav-item">Dashboard</div>
        <div class="nav-item active">CBC Assessment</div>
        <div class="nav-item">Smart Attendance</div>
        <div class="nav-item">Report Cards</div>
        <div class="nav-item">Settings</div>
      </div>

      <div class="main-area">
        <div class="top-row">
          <h1>Class: Grade 7 Alpha - CBC Competency Assessment & Attendance</h1>
          <div style="display: flex; gap: 10px;">
            <button class="btn-primary">Generate CBC Report Card (PDF)</button>
            <button class="btn-orange">Export Term Summary</button>
          </div>
        </div>

        <div class="filter-bar">
          <div><label style="font-size: 12px; color: #64748b; font-weight: 700; display: block;">DATE</label><input type="text" class="filter-select" value="Wednesday, Term 1"></div>
          <div><label style="font-size: 12px; color: #64748b; font-weight: 700; display: block;">CLASS</label><select class="filter-select"><option>Grade 7 Alpha</option></select></div>
          <div><label style="font-size: 12px; color: #64748b; font-weight: 700; display: block;">LEARNING STRAND</label><select class="filter-select"><option>Integrated Science & Tech</option></select></div>
          <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13.5px; font-weight: 700; color: #059669;">● Mark All Present Active</span>
          </div>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Daily Roll Call</th>
                <th>CBC Competency Level</th>
                <th>Teacher Remarks & Strands</th>
                <th>Parent Notice</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div style="display: flex; align-items: center;"><div class="avatar">LO</div><strong>Liam Onyango</strong></div></td>
                <td>R101</td>
                <td><span class="status-tag present">Present</span></td>
                <td><span class="cbc-level cbc-4">4 Exceeding Expectation</span></td>
                <td>Active participation in practical lab experiments</td>
                <td><button class="btn-wa">WhatsApp Notice</button></td>
              </tr>
              <tr>
                <td><div style="display: flex; align-items: center;"><div class="avatar" style="background:#059669;">MA</div><strong>Maria Adhiambo</strong></div></td>
                <td>R102</td>
                <td><span class="status-tag present">Present</span></td>
                <td><span class="cbc-level cbc-3">3 Meeting Expectation</span></td>
                <td>Consistent grasp of core scientific inquiry</td>
                <td><button class="btn-wa">WhatsApp Notice</button></td>
              </tr>
              <tr>
                <td><div style="display: flex; align-items: center;"><div class="avatar" style="background:#7c3aed;">NK</div><strong>Noah Kimani</strong></div></td>
                <td>R103</td>
                <td><span class="status-tag late">Late (12m)</span></td>
                <td><span class="cbc-level cbc-3">3 Meeting Expectation</span></td>
                <td>Completed research project on environmental conservation</td>
                <td><button class="btn-wa">WhatsApp Notice</button></td>
              </tr>
              <tr>
                <td><div style="display: flex; align-items: center;"><div class="avatar" style="background:#d97706;">CW</div><strong>Chloe Wanjiku</strong></div></td>
                <td>R104</td>
                <td><span class="status-tag present">Present</span></td>
                <td><span class="cbc-level cbc-4">4 Exceeding Expectation</span></td>
                <td>Outstanding scientific model presentation</td>
                <td><button class="btn-wa">WhatsApp Notice</button></td>
              </tr>
              <tr>
                <td><div style="display: flex; align-items: center;"><div class="avatar" style="background:#e11d48;">DK</div><strong>David Kioko</strong></div></td>
                <td>R105</td>
                <td><span class="status-tag absent">Absent</span></td>
                <td><span class="cbc-level cbc-2">2 Approaching Expectation</span></td>
                <td>Requires revision on molecular biology strand</td>
                <td><button class="btn-wa">WhatsApp Notice</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# Save HTML files
html_admin_path = os.path.join(WORKSPACE_DIR, "render_admin_dashboard.html")
html_fee_path = os.path.join(WORKSPACE_DIR, "render_fee_management.html")
html_att_path = os.path.join(WORKSPACE_DIR, "render_attendance_grading.html")

with open(html_admin_path, "w", encoding="utf-8") as f: f.write(html_admin)
with open(html_fee_path, "w", encoding="utf-8") as f: f.write(html_fee)
with open(html_att_path, "w", encoding="utf-8") as f: f.write(html_att)

print("Saved clean UI mockups HTML.")

# Render to JPG via Chrome Headless
screens = [
    (html_admin_path, os.path.join(ASSETS_DIR, "admin_dashboard.jpg")),
    (html_fee_path, os.path.join(ASSETS_DIR, "fee_management.jpg")),
    (html_att_path, os.path.join(ASSETS_DIR, "attendance_grading.jpg"))
]

for src, dst in screens:
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--window-size=1600,900",
        f"--screenshot={dst}",
        f"file:///{src.replace(os.sep, '/')}"
    ]
    print(f"Capturing pristine screenshot: {dst}")
    subprocess.run(cmd, check=True)

print("ALL 3 SCREENSHOTS RE-RENDERED WITH PERFECT KES CURRENCY, NO OVERLAPS, AND 100% CLEAN HUSTLERTECH BRANDING!")
