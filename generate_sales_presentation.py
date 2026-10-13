import os
import base64
import subprocess
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

WORKSPACE_DIR = r"c:\SchoolManagement"
ASSETS_DIR = os.path.join(WORKSPACE_DIR, "presentation_assets")
PDF_OUTPUT = os.path.join(WORKSPACE_DIR, "HustlerTech_School_Management_Presentation.pdf")
PPTX_OUTPUT = os.path.join(WORKSPACE_DIR, "HustlerTech_School_Management_Presentation.pptx")
HTML_OUTPUT = os.path.join(WORKSPACE_DIR, "presentation_slides.html")

admin_img_path = os.path.join(ASSETS_DIR, "admin_dashboard.jpg")
fee_img_path = os.path.join(ASSETS_DIR, "fee_management.jpg")
att_img_path = os.path.join(ASSETS_DIR, "attendance_grading.jpg")
logo_img_path = os.path.join(ASSETS_DIR, "hustlertech_logo.png")
emblem_img_path = os.path.join(ASSETS_DIR, "ht_emblem.png")

def get_base64_img(path, mime="image/jpeg"):
    if os.path.exists(path):
        with open(path, "rb") as f:
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

admin_b64 = get_base64_img(admin_img_path, "image/jpeg")
fee_b64 = get_base64_img(fee_img_path, "image/jpeg")
att_b64 = get_base64_img(att_img_path, "image/jpeg")
logo_b64 = get_base64_img(logo_img_path, "image/png")
emblem_b64 = get_base64_img(emblem_img_path, "image/png")

# Vector SVG icons to replace emojis completely
svg_check = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
svg_money = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
svg_clock = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
svg_file = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
svg_chat = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
svg_school = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
svg_card = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>'
svg_user = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
svg_mobile = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
svg_ai = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>'
svg_bus = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
svg_calendar = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
svg_globe = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HustlerTech School Management Software - Executive Presentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

  @page {{
    size: 16in 9in;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
    background-color: #0b0f19;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .slide {{
    width: 16in;
    height: 9in;
    position: relative;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
    padding: 0.72in 0.95in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  .slide.hero-dark {{
    background: radial-gradient(circle at 80% 20%, #1e3a8a 0%, #0f172a 50%, #020617 100%);
    color: #ffffff;
  }}

  .slide.clean-light {{
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
    color: #0f172a;
  }}

  .slide.split-theme {{
    background: #ffffff;
    color: #0f172a;
  }}

  .slide-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.28in;
  }}

  .category-tag {{
    display: inline-block;
    padding: 5px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 5px;
  }}

  .tag-blue {{ background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }}
  .tag-dark-blue {{ background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }}
  .tag-emerald {{ background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }}
  .tag-purple {{ background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }}

  .slide-title {{
    font-size: 36px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.5px;
  }}

  .slide-subtitle {{
    font-size: 16px;
    color: #64748b;
    margin-top: 4px;
    font-weight: 500;
  }}

  .watermark-logo {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .watermark-logo img {{
    height: 44px;
    width: auto;
    border-radius: 8px;
    background: #ffffff;
    padding: 2px 6px;
  }}

  
  .ht-brand-badge {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 6px 16px;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  }}

  .ht-logo-img {{
    height: 38px;
    width: auto;
    display: block;
    object-fit: contain;
  }}

  .ht-brand-name {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }}

  .hero-dark .ht-brand-badge {{
    background: #ffffff;
    border-color: #cbd5e1;
  }}

  .hero-dark .ht-brand-name {{
    color: #0f172a;
  }}

  .watermark-text {{
    font-size: 19px;
    font-weight: 800;
    color: #2563eb;
    letter-spacing: 0.5px;
  }}

  .watermark-text {{
    color: #60a5fa;
  }}

  .slide-body {{
    flex: 1;
    display: flex;
    gap: 0.45in;
    align-items: center;
  }}

  .slide-footer {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.18in;
    border-top: 1px solid #e2e8f0;
    font-size: 13.5px;
    color: #64748b;
    font-weight: 600;
  }}

  .hero-dark .slide-footer {{
    border-top-color: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
  }}

  .hero-content {{
    max-width: 10in;
    margin-top: auto;
    margin-bottom: auto;
  }}

  .hero-badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(37, 99, 235, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.4);
    color: #93c5fd;
    padding: 8px 18px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 18px;
  }}

  .hero-title {{
    font-size: 54px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1.5px;
    margin-bottom: 18px;
    background: linear-gradient(135deg, #ffffff 40%, #93c5fd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .hero-lead {{
    font-size: 21px;
    line-height: 1.5;
    color: #cbd5e1;
    margin-bottom: 30px;
    font-weight: 400;
  }}

  .hero-pills {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }}

  .hero-pill {{
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 9px 18px;
    border-radius: 12px;
    font-size: 14.5px;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  .grid-2x2 {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
  }}

  .grid-3col {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
  }}

  .feature-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  .feature-card.compact {{
    padding: 18px 20px;
  }}

  .card-icon {{
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }}

  .card-icon.blue {{ background: #eff6ff; color: #2563eb; }}
  .card-icon.emerald {{ background: #ecfdf5; color: #059669; }}
  .card-icon.purple {{ background: #f5f3ff; color: #7c3aed; }}
  .card-icon.amber {{ background: #fffbeb; color: #d97706; }}
  .card-icon.rose {{ background: #fff1f2; color: #e11d48; }}

  .card-title {{
    font-size: 19px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
  }}

  .card-desc {{
    font-size: 14px;
    line-height: 1.5;
    color: #475569;
  }}

  .feature-checklist {{
    list-style: none;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: #334155;
  }}

  .feature-checklist li {{
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.4;
  }}

  .split-left {{
    flex: 1.05;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }}

  .split-right {{
    flex: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
  }}

  .screenshot-frame {{
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.22);
    border: 1px solid #cbd5e1;
    background: #ffffff;
  }}

  .screenshot-frame img {{
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }}

  .bullet-list {{
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 10px;
  }}

  .bullet-item {{
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }}

  .bullet-badge {{
    min-width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #eff6ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13.5px;
    margin-top: 2px;
  }}

  .bullet-text h4 {{
    font-size: 16.5px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 2px;
  }}

  .bullet-text p {{
    font-size: 14px;
    line-height: 1.4;
    color: #64748b;
  }}

  .stats-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    width: 100%;
    margin-bottom: 22px;
  }}

  .stat-card {{
    background: #ffffff;
    border-radius: 16px;
    padding: 26px 20px;
    text-align: center;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.04);
  }}

  .stat-number {{
    font-size: 42px;
    font-weight: 800;
    color: #2563eb;
    line-height: 1;
    margin-bottom: 8px;
  }}

  .stat-card.emerald .stat-number {{ color: #059669; }}
  .stat-card.purple .stat-number {{ color: #7c3aed; }}
  .stat-card.amber .stat-number {{ color: #d97706; }}

  .stat-label {{
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 5px;
  }}

  .stat-desc {{
    font-size: 13px;
    color: #64748b;
    line-height: 1.35;
  }}

  .pricing-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
    width: 100%;
  }}

  .pricing-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    box-shadow: 0 8px 25px -4px rgba(0,0,0,0.04);
  }}

  .pricing-card.featured {{
    border: 2px solid #2563eb;
    box-shadow: 0 16px 36px -8px rgba(37, 99, 235, 0.18);
    transform: scale(1.02);
  }}

  .popular-badge {{
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: #ffffff;
    padding: 4px 16px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }}

  .plan-name {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 5px;
  }}

  .plan-price {{
    font-size: 36px;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 10px;
  }}

  .plan-price span {{
    font-size: 14.5px;
    color: #64748b;
    font-weight: 500;
  }}

  .plan-features {{
    list-style: none;
    margin: 16px 0;
    display: flex;
    flex-direction: column;
    gap: 9px;
    font-size: 13px;
    color: #334155;
  }}

  .plan-features li {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
</style>
</head>
<body>

<!-- SLIDE 1: HERO COVER -->
<div class="slide hero-dark">
  <div class="slide-header">
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
    <span class="hero-badge">Enterprise School ERP Platform</span>
  </div>

  <div class="hero-content">
    <div class="tag-dark-blue category-tag">Next-Gen Education Cloud Platform</div>
    <h1 class="hero-title">HustlerTech School Management Software</h1>
    <p class="hero-lead">The complete multi-tenant digital backbone for Kenyan schools: Automated M-Pesa Fee Collection, CBC Competency Assessments, Smart Attendance, Real-Time Parent WhatsApp Alerts, and AI-Powered Academic Tools.</p>
    
    <div class="hero-pills">
      <div class="hero-pill">100% Cloud-Based SaaS</div>
      <div class="hero-pill">Automated M-Pesa STK Push</div>
      <div class="hero-pill">CBC Competency Gradebook</div>
      <div class="hero-pill">Instant Parent WhatsApp & Mobile Alerts</div>
      <div class="hero-pill">Live GPS Bus Transport</div>
      <div class="hero-pill">AI Lesson Copilot</div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Direct Contact: <strong>Josphine Sololo</strong> | <strong>+254 727 417410</strong> | <strong>jmweshsololo@gmail.com</strong></div>
    <div>HustlerTech Solutions</div>
  </div>
</div>

<!-- SLIDE 2: CURRENT CHALLENGES -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-blue">The Reality in School Administration</span>
      <h2 class="slide-title">Critical Challenges Facing Modern Schools</h2>
      <p class="slide-subtitle">Manual record keeping, delayed fees, and fragmented systems cost schools thousands of shillings every month.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="grid-2x2">
      <div class="feature-card">
        <div>
          <div class="card-icon rose">{svg_money}</div>
          <h3 class="card-title">Delayed Fee Collection & Cash Leakage</h3>
          <p class="card-desc">Chasing overdue school fees manually with paper ledger receipts creates reconciliation errors, high default rates, and unaccounted cash leakage.</p>
        </div>
        <div style="margin-top: 14px; font-weight: 700; color: #e11d48; font-size: 13.5px;">Impact: Up to 25% of school revenue delayed every term</div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon amber">{svg_clock}</div>
          <h3 class="card-title">Exhausting Manual Attendance & Paperwork</h3>
          <p class="card-desc">Teachers spend countless hours compiling roll calls and calculating report cards instead of focusing on classroom teaching and mentoring.</p>
        </div>
        <div style="margin-top: 14px; font-weight: 700; color: #d97706; font-size: 13.5px;">Impact: 15+ hours lost per teacher every single week</div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon purple">{svg_file}</div>
          <h3 class="card-title">Complex CBC & Curriculum Assessment</h3>
          <p class="card-desc">Managing multi-strand competency assessments, rubrics, and generating government-standard report cards creates endless confusion and term-end stress.</p>
        </div>
        <div style="margin-top: 14px; font-weight: 700; color: #7c3aed; font-size: 13.5px;">Impact: Weeks of administrative delay during exams</div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon blue">{svg_chat}</div>
          <h3 class="card-title">Poor Parent Communication & Disconnect</h3>
          <p class="card-desc">Parents are kept in the dark about student absences, pending fees, or exam schedules, leading to friction and poor institutional reputation.</p>
        </div>
        <div style="margin-top: 14px; font-weight: 700; color: #2563eb; font-size: 13.5px;">Impact: Higher student churn and frustrated parents</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>HustlerTech School Management Software | Executive Presentation</div>
    <div>Page 02</div>
  </div>
</div>

<!-- SLIDE 3: COMPLETE ARCHITECTURE (11 IMPLEMENTED MODULES) -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-emerald">Unified Platform Architecture</span>
      <h2 class="slide-title">11 Fully Implemented Core Operational Modules</h2>
      <p class="slide-subtitle">A seamless, single-login ecosystem connecting Administrators, Teachers, Accountants, Parents & Students.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="grid-3col">
      <div class="feature-card compact">
        <h4 style="color:#2563eb; font-size:16px; margin-bottom:4px;">1. Student & Admissions CRM</h4>
        <p class="card-desc">Admission tracking, digital student profiles, guardian linking, bulk CSV import, auto admission numbering.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#059669; font-size:16px; margin-bottom:4px;">2. Finance & M-Pesa Engine</h4>
        <p class="card-desc">Automated STK push, C2B payments, zero-error reconciliation, bulk term invoices, instant digital PDF receipts.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#7c3aed; font-size:16px; margin-bottom:4px;">3. CBC Academic & Grading</h4>
        <p class="card-desc">Kenya CBC competency rubrics (Levels 1-4), exam marks collation, 1-click official report card generation.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#d97706; font-size:16px; margin-bottom:4px;">4. Smart Attendance System</h4>
        <p class="card-desc">Daily & period-wise roll calls (1-10 periods), late arrival tracking, staff check-in, automatic parent absence alerts.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#2563eb; font-size:16px; margin-bottom:4px;">5. Timetable & Substitution</h4>
        <p class="card-desc">Conflict detection engine, teacher/room scheduling, 1-click emergency teacher substitution workflow.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#059669; font-size:16px; margin-bottom:4px;">6. Parent Engagement Portal</h4>
        <p class="card-desc">Daily activity feeds, photo/video media gallery, homework submission tracking, behavior points, absence requests.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#7c3aed; font-size:16px; margin-bottom:4px;">7. Multi-Channel Messaging</h4>
        <p class="card-desc">Direct WhatsApp & instant messaging integration, broadcast alerts to classes, automated fee reminders, instant parent notices.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#e11d48; font-size:16px; margin-bottom:4px;">8. Transport & Fleet GPS</h4>
        <p class="card-desc">Live school bus GPS tracking, route and stop allocation, driver roster, parent ETA arrival notifications.</p>
      </div>

      <div class="feature-card compact">
        <h4 style="color:#2563eb; font-size:16px; margin-bottom:4px;">9. AI Academic Copilot</h4>
        <p class="card-desc">OpenAI-powered lesson plan generator, quiz creator, student performance predictive analytics, pedagogical copilot.</p>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Plus Virtual PTM Video Meetings & Full Bilingual (English / Swahili) Localization</div>
    <div>Page 03</div>
  </div>
</div>

<!-- SLIDE 4: SCREENSHOT - ADMIN DASHBOARD -->
<div class="slide split-theme">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-blue">Executive Operations</span>
      <h2 class="slide-title">Admin Dashboard & Live School Intelligence</h2>
      <p class="slide-subtitle">Real-time visibility over attendance, fee revenue, enrollment, and daily school activities.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="split-left">
      <ul class="bullet-list">
        <li class="bullet-item">
          <div class="bullet-badge">1</div>
          <div class="bullet-text">
            <h4>Live KPI Metrics at a Glance</h4>
            <p>Monitor student attendance percentage (96.4%), active classes, fee collection rate (84%), and total admissions in real time.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">2</div>
          <div class="bullet-text">
            <h4>Financial & Attendance Analytics</h4>
            <p>Interactive monthly fee trend curves and daily student attendance distribution graphs for informed leadership decisions.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">3</div>
          <div class="bullet-text">
            <h4>Real-Time Payments & Admissions Stream</h4>
            <p>Live stream of incoming fee payments with clear status badges (Paid, Pending, Overdue) and student admission tracking.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">4</div>
          <div class="bullet-text">
            <h4>Multi-Tenant Enterprise Security</h4>
            <p>Strict access security and isolated tenant partitions for Directors, Principals, Accountants, Teachers, and Staff.</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="split-right">
      <div class="screenshot-frame">
        <img src="{admin_b64}" alt="Executive Admin Dashboard Screenshot">
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Live Screen: HustlerTech Administrative Control Center</div>
    <div>Page 04</div>
  </div>
</div>

<!-- SLIDE 5: SCREENSHOT - FEE BILLING & M-PESA -->
<div class="slide split-theme">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-emerald">Finance & Billing Automation</span>
      <h2 class="slide-title">Automated Fee Collection & Instant M-Pesa Reconciliation</h2>
      <p class="slide-subtitle">Eliminate manual receipt matching. Collect fees 3x faster with direct mobile money integration.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="split-left">
      <ul class="bullet-list">
        <li class="bullet-item">
          <div class="bullet-badge">1</div>
          <div class="bullet-text">
            <h4>Lipa Na M-Pesa STK Push Integration</h4>
            <p>Trigger payment prompts straight to a parent's mobile phone. Parent enters their M-Pesa PIN, and funds reflect immediately.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">2</div>
          <div class="bullet-text">
            <h4>Zero-Error Auto-Reconciliation</h4>
            <p>System automatically pairs transaction IDs with student accounts and invoice numbers without human intervention.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">3</div>
          <div class="bullet-text">
            <h4>Automated Bulk Invoicing & Reminders</h4>
            <p>Generate term invoices in seconds with customizable fee structures and schedule automated polite reminders via WhatsApp and parent mobile alerts.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">4</div>
          <div class="bullet-text">
            <h4>Downloadable PDF Digital Receipts</h4>
            <p>Instant tamper-proof receipts generated and texted to guardians upon successful payment.</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="split-right">
      <div class="screenshot-frame">
        <img src="{fee_b64}" alt="Fee Management and M-Pesa Billing Screenshot">
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Live Screen: HustlerTech Fee Billing & M-Pesa Engine</div>
    <div>Page 05</div>
  </div>
</div>

<!-- SLIDE 6: SCREENSHOT - ATTENDANCE & CBC GRADING -->
<div class="slide split-theme">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-purple">Academics & CBC Compliance</span>
      <h2 class="slide-title">Smart Attendance & CBC Competency Assessments</h2>
      <p class="slide-subtitle">Streamlined classroom management fully aligned with the Kenya Competency-Based Curriculum.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="split-left">
      <ul class="bullet-list">
        <li class="bullet-item">
          <div class="bullet-badge">1</div>
          <div class="bullet-text">
            <h4>1-Click Smart Roll Call</h4>
            <p>Teachers take class attendance in under 30 seconds with 'Mark All Present' toggle, absence flags, and late arrival logging.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">2</div>
          <div class="bullet-text">
            <h4>Native CBC Assessment Rubrics</h4>
            <p>Evaluate learning strands with official levels: Exceeding Expectation (4), Meeting (3), Approaching (2), and Below (1).</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">3</div>
          <div class="bullet-text">
            <h4>Instant WhatsApp Parent Alerts</h4>
            <p>Notify parents immediately when a child is marked absent or tardy, ensuring student safety and accountability.</p>
          </div>
        </li>
        <li class="bullet-item">
          <div class="bullet-badge">4</div>
          <div class="bullet-text">
            <h4>1-Click Term Report Card Generation</h4>
            <p>Produce beautifully styled official CBC report cards ready for print or digital download by parents.</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="split-right">
      <div class="screenshot-frame">
        <img src="{att_b64}" alt="Smart Attendance and CBC Assessment Screenshot">
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Live Screen: HustlerTech Teacher Attendance & CBC Assessment</div>
    <div>Page 06</div>
  </div>
</div>

<!-- SLIDE 7: FEATURE HIGHLIGHT 1 - STUDENT, ACADEMIC & TIMETABLE -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-blue">Deep Feature Breakdown</span>
      <h2 class="slide-title">Student Lifecycle, Academics & Staff Operations</h2>
      <p class="slide-subtitle">Automating every school routine from admission to graduation.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="grid-3col">
      <div class="feature-card">
        <div>
          <div class="card-icon blue">{svg_school}</div>
          <h3 class="card-title">Student Information (SIS)</h3>
          <p class="card-desc">End-to-end digital student lifecycle records.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Digital admission & auto ID numbers</li>
            <li>{svg_check} Guardian linking & multi-contact profiles</li>
            <li>{svg_check} Class & stream assignments (A, B, East, West)</li>
            <li>{svg_check} Bulk student import/export via Excel/CSV</li>
            <li>{svg_check} Digital student document & photo storage</li>
          </ul>
        </div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon purple">{svg_file}</div>
          <h3 class="card-title">CBC Curriculum & Exams</h3>
          <p class="card-desc">Complete CBC assessment & traditional exams.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Multi-strand CBC competency rubrics</li>
            <li>{svg_check} Traditional percentage & letter grading</li>
            <li>{svg_check} Term exam scheduling & mark entry</li>
            <li>{svg_check} 1-Click tamper-proof report card generation</li>
            <li>{svg_check} Digital verifiable certificates with QR codes</li>
          </ul>
        </div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon amber">{svg_calendar}</div>
          <h3 class="card-title">Timetable & Substitution</h3>
          <p class="card-desc">Intelligent scheduling with zero room collisions.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Automated conflict detection engine</li>
            <li>{svg_check} Teacher period & room allocation</li>
            <li>{svg_check} Emergency 1-click teacher substitution</li>
            <li>{svg_check} Substitute notification sent to staff phone</li>
            <li>{svg_check} Printable master & teacher timetables</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>HustlerTech Academic & Operational Automation</div>
    <div>Page 07</div>
  </div>
</div>

<!-- SLIDE 8: FEATURE HIGHLIGHT 2 - PARENT ENGAGEMENT & TRANSPORT -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-emerald">Deep Feature Breakdown</span>
      <h2 class="slide-title">Parent Engagement, WhatsApp & Fleet Transport</h2>
      <p class="slide-subtitle">Delivering transparency, trust, and total peace of mind for every school guardian.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="grid-3col">
      <div class="feature-card">
        <div>
          <div class="card-icon emerald">{svg_mobile}</div>
          <h3 class="card-title">Parent Engagement Portal</h3>
          <p class="card-desc">24/7 dedicated mobile app for guardians.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Daily school activity feed with 10 event types</li>
            <li>{svg_check} School photo & video gallery (50MB media)</li>
            <li>{svg_check} Homework assignments & overdue alerts</li>
            <li>{svg_check} Student behavior tracking (positive points)</li>
            <li>{svg_check} Online digital leave/absence requests</li>
          </ul>
        </div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon blue">{svg_chat}</div>
          <h3 class="card-title">WhatsApp & Parent Messaging Engine</h3>
          <p class="card-desc">Instant school-wide communication channels.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Direct WhatsApp & instant broadcast messaging</li>
            <li>{svg_check} Instant absence alert sent upon roll call</li>
            <li>{svg_check} Automated polite fee reminder notifications</li>
            <li>{svg_check} Emergency circulars & school announcements</li>
            <li>{svg_check} Instant parent acknowledgment alerts</li>
          </ul>
        </div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon amber">{svg_bus}</div>
          <h3 class="card-title">Live Transport GPS Tracking</h3>
          <p class="card-desc">Real-time school bus safety on interactive map.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Live GPS route tracking for parents & dispatch</li>
            <li>{svg_check} Estimated time of arrival (ETA) at pickup stop</li>
            <li>{svg_check} Boarding & alighting student check-in</li>
            <li>{svg_check} Driver profile & direct emergency calling</li>
            <li>{svg_check} Fleet vehicle maintenance & fuel logging</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>HustlerTech Engagement & Safety Suite</div>
    <div>Page 08</div>
  </div>
</div>

<!-- SLIDE 9: AI COPILOT & BILINGUAL -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-purple">Innovation & Localization</span>
      <h2 class="slide-title">AI Academic Copilot & Bilingual Support</h2>
      <p class="slide-subtitle">Modern technology tailored directly for Kenyan classrooms and cultural requirements.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="grid-2x2">
      <div class="feature-card">
        <div>
          <div class="card-icon purple">{svg_ai}</div>
          <h3 class="card-title">AI Academic Copilot & Lesson Studio</h3>
          <p class="card-desc">Integrated OpenAI intelligence that empowers teachers and school leadership with generative tools.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Generates curriculum-aligned lesson plans in seconds</li>
            <li>{svg_check} Creates classroom quizzes, question banks & answer keys</li>
            <li>{svg_check} Identifies struggling students early using predictive analytics</li>
            <li>{svg_check} Drafts individualized teacher remarks for report cards</li>
          </ul>
        </div>
        <div style="margin-top: 10px; font-weight: 700; color: #7c3aed; font-size: 13.5px;">Saves teachers over 10 hours of prep time weekly</div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon emerald">{svg_globe}</div>
          <h3 class="card-title">Full Bilingual: English & Kiswahili</h3>
          <p class="card-desc">100% bilingual user interface designed specifically for local Kenyan schools, teachers, and guardians.</p>
          <ul class="feature-checklist">
            <li>{svg_check} 1-Click language switcher between English and Kiswahili</li>
            <li>{svg_check} Full translation of parent alerts, fee invoices & menus</li>
            <li>{svg_check} Ensures non-English speaking guardians stay 100% informed</li>
            <li>{svg_check} Compliant with local educational accessibility standards</li>
          </ul>
        </div>
        <div style="margin-top: 10px; font-weight: 700; color: #059669; font-size: 13.5px;">100% culturally aligned for all communities</div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon blue">{svg_user}</div>
          <h3 class="card-title">Virtual PTM (Parent-Teacher Video Rooms)</h3>
          <p class="card-desc">Built-in WebRTC video conferencing for seamless virtual parent-teacher conferences.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Schedule 1-on-1 virtual meetings without external Zoom/Meet links</li>
            <li>{svg_check} Built-in waiting room, screen sharing, and meeting notes</li>
          </ul>
        </div>
      </div>

      <div class="feature-card">
        <div>
          <div class="card-icon amber">{svg_card}</div>
          <h3 class="card-title">Enterprise Tenant Isolation & 99.9% Uptime</h3>
          <p class="card-desc">High-reliability cloud architecture hosted on secure multi-tenant infrastructure.</p>
          <ul class="feature-checklist">
            <li>{svg_check} Bank-Grade Multi-Tenant Cloud Architecture (100% Data Privacy & Zero Mixing)</li>
            <li>{svg_check} Automatic daily cloud backups & 256-bit SSL encryption</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Cutting-Edge Capabilities Beyond Traditional Systems</div>
    <div>Page 09</div>
  </div>
</div>

<!-- SLIDE 10: ROI & VALUE METRICS -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-emerald">Institutional Return on Investment</span>
      <h2 class="slide-title">Measurable Results From Day 1</h2>
      <p class="slide-subtitle">Investing in HustlerTech School Management Software delivers clear financial and operational returns.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body" style="flex-direction: column; justify-content: center;">
    <div class="stats-grid">
      <div class="stat-card emerald">
        <div class="stat-number">+35%</div>
        <div class="stat-label">Faster Fee Recovery</div>
        <p class="stat-desc">Accelerated cash flow and 90% reduction in uncollected bad debts via automated M-Pesa STK push.</p>
      </div>

      <div class="stat-card blue">
        <div class="stat-number">80%</div>
        <div class="stat-label">Admin Time Saved</div>
        <p class="stat-desc">Paperless admissions, 1-click attendance, and instant report cards save hundreds of staff hours.</p>
      </div>

      <div class="stat-card purple">
        <div class="stat-number">98%</div>
        <div class="stat-label">Parent Engagement</div>
        <p class="stat-desc">Direct WhatsApp and instant messaging alerts keep guardians connected and deeply satisfied with your school.</p>
      </div>

      <div class="stat-card amber">
        <div class="stat-number">0 KES</div>
        <div class="stat-label">Server Maintenance</div>
        <p class="stat-desc">100% Cloud-managed SaaS. No servers to buy, no IT staff required, automatic backups & upgrades.</p>
      </div>
    </div>

    <div class="feature-card" style="width: 100%; padding: 22px 30px; background: #f8fafc;">
      <h3 style="font-size: 19px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Enterprise Data Security & Strict Isolation</h3>
      <p style="font-size: 14.5px; color: #475569; line-height: 1.55;">
        Every school's student records, grades, and accounting ledgers are strictly segregated with dedicated multi-tenant security partitioning. Protected with banking-grade 256-bit SSL encryption, automatic daily cloud backups, and full compliance with student data privacy laws.
      </p>
    </div>
  </div>

  <div class="slide-footer">
    <div>Proven Value for School Directors & Board of Management</div>
    <div>Page 10</div>
  </div>
</div>

<!-- SLIDE 11: PRICING -->
<div class="slide clean-light">
  <div class="slide-header">
    <div>
      <span class="category-tag tag-blue">Term-Based Calendar Pricing</span>
      <h2 class="slide-title">Affordable Rate Per Student Per Term</h2>
      <p class="slide-subtitle">Framed around Kenya's 3-term academic school calendar (Term 1, Term 2 & Term 3). Billed per enrolled student.</p>
    </div>
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
  </div>

  <div class="slide-body">
    <div class="pricing-grid">
      <!-- Starter -->
      <div class="pricing-card">
        <div>
          <div class="plan-name">Standard Academy</div>
          <div class="plan-price">100 KES <span>/ student / term</span></div>
          <p style="font-size: 13.5px; color: #64748b;">Ideal for growing primary schools and tuition academies needing core SIS & CBC grading.</p>
          <ul class="plan-features">
            <li>{svg_check} Complete Student & Staff Database</li>
            <li>{svg_check} Digital Fee Structure & Invoices</li>
            <li>{svg_check} Daily & Period Attendance Tracking</li>
            <li>{svg_check} CBC Assessment & Grading</li>
            <li>{svg_check} 1-Click Report Card PDF Generator</li>
            <li>{svg_check} Dedicated Phone Support</li>
          </ul>
        </div>
        <div style="font-size: 13px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">Free Staff Onboarding Training</div>
      </div>

      <!-- Growth -->
      <div class="pricing-card featured">
        <div class="popular-badge">Most Popular Choice</div>
        <div>
          <div class="plan-name">Growth Excellence</div>
          <div class="plan-price" style="color: #2563eb;">125 KES <span>/ student / term</span></div>
          <p style="font-size: 13.5px; color: #64748b;">Designed for mid-to-large schools wanting automated mobile money & timetable automation.</p>
          <ul class="plan-features">
            <li>{svg_check} <strong>Everything in Standard, plus:</strong></li>
            <li>{svg_check} Automated M-Pesa STK Push Integration</li>
            <li>{svg_check} Instant Auto-Reconciliation of Fees</li>
            <li>{svg_check} Bulk Messaging & WhatsApp Parent Alerts</li>
            <li>{svg_check} Timetable Conflict Resolution Engine</li>
            <li>{svg_check} Teacher Substitution Manager</li>
            <li>{svg_check} Priority WhatsApp & Call Support</li>
          </ul>
        </div>
        <div style="font-size: 13px; color: #2563eb; font-weight: 700; text-align: center; border-top: 1px solid #dbeafe; padding-top: 12px;">Includes Free Data Import from Excel</div>
      </div>

      <!-- Enterprise -->
      <div class="pricing-card">
        <div>
          <div class="plan-name">Premium Enterprise</div>
          <div class="plan-price">150 KES <span>/ student / term</span></div>
          <p style="font-size: 13.5px; color: #64748b;">For premier institutions desiring AI capabilities, transport GPS, and multi-campus control.</p>
          <ul class="plan-features">
            <li>{svg_check} <strong>Everything in Growth, plus:</strong></li>
            <li>{svg_check} AI Academic Copilot & Lesson Studio</li>
            <li>{svg_check} Live GPS School Bus Transport Tracking</li>
            <li>{svg_check} Virtual PTM Video Meeting Rooms</li>
            <li>{svg_check} Multi-Campus Headquarter Analytics</li>
            <li>{svg_check} Custom School Subdomain & Branding</li>
            <li>{svg_check} Dedicated 24/7 Account Manager</li>
          </ul>
        </div>
        <div style="font-size: 13px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">Tailored Customizations Available</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>Term-Based Calendar Billing: Invoiced per term based on active enrollment | Contact Josphine Sololo (+254 727 417410)</div>
    <div>Page 11</div>
  </div>
</div>

<!-- SLIDE 12: ONBOARDING & CALL TO ACTION -->
<div class="slide hero-dark">
  <div class="slide-header">
    <div class="watermark-logo">
      <div class="ht-brand-badge">
        <img src="{emblem_b64}" class="ht-logo-img" alt="HustlerTech Official Logo">
        <span class="ht-brand-name">HustlerTech</span>
      </div>
    </div>
    <span class="hero-badge">Seamless 48-Hour Implementation</span>
  </div>

  <div class="hero-content" style="max-width: 10in;">
    <div class="tag-dark-blue category-tag">Next Steps & Partnership</div>
    <h1 class="hero-title" style="font-size: 46px; margin-bottom: 16px;">Ready to Modernize Your School?</h1>
    <p class="hero-lead" style="margin-bottom: 24px; max-width: 10in; font-size: 20px;">Switching to HustlerTech School Management Software is fast and seamless. Our technical engineers handle full data migration from your current spreadsheets, setup fee structures, and train your staff in under 48 hours.</p>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;">
      <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 24px; font-weight: 800; color: #60a5fa; margin-bottom: 4px;">01</div>
        <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 15px;">Free 30-Min Demo</div>
        <div style="font-size: 13px; color: #94a3b8;">Live walk-through tailored to your school's unique requirements.</div>
      </div>

      <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 24px; font-weight: 800; color: #34d399; margin-bottom: 4px;">02</div>
        <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 15px;">Data Migration</div>
        <div style="font-size: 13px; color: #94a3b8;">We securely import all existing student, staff & fee records.</div>
      </div>

      <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 24px; font-weight: 800; color: #a78bfa; margin-bottom: 4px;">03</div>
        <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 15px;">Staff Workshop</div>
        <div style="font-size: 13px; color: #94a3b8;">Hands-on training for teachers, accountants & administration.</div>
      </div>

      <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 24px; font-weight: 800; color: #f472b6; margin-bottom: 4px;">04</div>
        <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 15px;">Go Live & Grow</div>
        <div style="font-size: 13px; color: #94a3b8;">Launch to parents with ongoing dedicated 24/7 support.</div>
      </div>
    </div>

    <!-- Contact Box Highlight -->
    <div style="background: linear-gradient(90deg, rgba(37,99,235,0.25) 0%, rgba(16,185,129,0.25) 100%); border: 1.5px solid rgba(96,165,250,0.5); border-radius: 18px; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 21px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Book Your Free School Demo Today</div>
        <div style="font-size: 14.5px; color: #cbd5e1;">Contact our Business Development & Solutions Engineering Lead:</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 22px; font-weight: 800; color: #38bdf8;">Josphine Sololo</div>
        <div style="font-size: 22px; font-weight: 800; color: #34d399; margin-top: 2px;">+254 727 417410</div>
        <div style="font-size: 14.5px; color: #cbd5e1; margin-top: 4px;">Email: jmweshsololo@gmail.com</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <div>HustlerTech Solutions | Transforming School Management Across Kenya</div>
    <div>Thank You</div>
  </div>
</div>

</body>
</html>
"""

# Write HTML file with UTF-8
with open(HTML_OUTPUT, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"Generated clean HTML slide deck at: {HTML_OUTPUT}")

# Convert HTML to PDF using Chrome Headless
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={PDF_OUTPUT}",
    "--no-pdf-header-footer",
    f"file:///{HTML_OUTPUT.replace(os.sep, '/')}"
]
print("Converting HTML to PDF via Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(PDF_OUTPUT):
    print(f"SUCCESS: Generated clean PDF at {PDF_OUTPUT} (Size: {os.path.getsize(PDF_OUTPUT)} bytes)")
else:
    print(f"Error generating PDF: {res.stderr}")

# Also update PPTX
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

def add_header(slide, tag_text, title_text, subtitle_text):
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.3))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p0 = tf.paragraphs[0]
    p0.text = tag_text.upper()
    p0.font.size = Pt(10)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(37, 99, 235)
    
    p1 = tf.add_paragraph()
    p1.text = title_text
    p1.font.size = Pt(23)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(15, 23, 42)
    
    p2 = tf.add_paragraph()
    p2.text = subtitle_text
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = RGBColor(100, 116, 139)

# PPTX Slide 1: Cover
slide1 = prs.slides.add_slide(blank_layout)
bg = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg.fill.solid()
bg.fill.fore_color.rgb = RGBColor(15, 23, 42)
bg.line.fill.background()

if os.path.exists(emblem_img_path):
    slide1.shapes.add_picture(emblem_img_path, Inches(1.0), Inches(0.8), Inches(1.8))

tb = slide1.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.3), Inches(4.5))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "HustlerTech School Management Software"
p.font.size = Pt(36)
p.font.bold = True
p.font.color.rgb = RGBColor(96, 165, 250)

p2 = tf.add_paragraph()
p2.text = "The Complete Multi-Tenant Education ERP for Kenya"
p2.font.size = Pt(24)
p2.font.bold = True
p2.font.color.rgb = RGBColor(255, 255, 255)

p3 = tf.add_paragraph()
p3.text = "\nAutomated M-Pesa Fee Billing - Smart Attendance - CBC Gradebook - Parent WhatsApp & Mobile Alerts - Transport GPS\n\nContact: Josphine Sololo | Phone: +254 727 417410 | Email: jmweshsololo@gmail.com"
p3.font.size = Pt(15)
p3.font.color.rgb = RGBColor(203, 213, 225)

# PPTX Slide 2: Dashboard
slide2 = prs.slides.add_slide(blank_layout)
add_header(slide2, "HustlerTech Operations", "Executive Admin Dashboard & Live Intelligence", "Real-time visibility over attendance, fee collection, and student performance.")
if os.path.exists(admin_img_path):
    slide2.shapes.add_picture(admin_img_path, Inches(6.0), Inches(1.8), Inches(6.5))
tb = slide2.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(4.8), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.text = "Executive Features:\n\n* Live KPI Cards (Attendance %, Collection %, Active Classes)\n* Interactive Monthly Fee Trends & Analytics\n* Daily Attendance Visual Distribution (Present vs Absent)\n* Live Stream of Invoices, Fees & Student Admissions\n* Multi-role Security (Director, Principal, Accountant, Teacher)"

# PPTX Slide 3: Fees & M-Pesa
slide3 = prs.slides.add_slide(blank_layout)
add_header(slide3, "HustlerTech Finance", "Automated Fee Billing & M-Pesa STK Push", "Eliminate revenue loss and reconcile fees directly from parent mobile phones.")
if os.path.exists(fee_img_path):
    slide3.shapes.add_picture(fee_img_path, Inches(6.0), Inches(1.8), Inches(6.5))
tb = slide3.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(4.8), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.text = "Financial Automation:\n\n* Lipa Na M-Pesa Online (Direct STK Push to Parents)\n* Zero-Error Automatic Payment Reconciliation\n* Bulk Term Invoice Generation in 1-Click\n* Automated WhatsApp & In-App Fee Reminders\n* Downloadable Digital PDF Receipts & Ledgers"

# PPTX Slide 4: Attendance & CBC
slide4 = prs.slides.add_slide(blank_layout)
add_header(slide4, "HustlerTech Academics", "Smart Attendance & CBC Assessment Engine", "Kenya CBC competency evaluation and automated student report cards.")
if os.path.exists(att_img_path):
    slide4.shapes.add_picture(att_img_path, Inches(6.0), Inches(1.8), Inches(6.5))
tb = slide4.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(4.8), Inches(4.8))
tf = tb.text_frame
tf.word_wrap = True
tf.text = "Academic Tools:\n\n* 1-Click Roll Call with Instant Parent Absence WhatsApp Alerts\n* Full CBC Competency Levels (Exceeding, Meeting, Approaching, Below)\n* Automated End-of-Term Report Card PDF Generation\n* Timetable Conflict Detection & Smart Room Allocation\n* Bilingual Interface: English & Swahili"

# PPTX Slide 5: Pricing & Contact
slide5 = prs.slides.add_slide(blank_layout)
add_header(slide5, "Term-Based Pricing", "Term-Based Calendar Framing (Rate Per Student)", "Invoiced per term (Terms 1, 2 & 3) based on active enrollment. 48-Hour setup included.")
tb = slide5.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
tf = tb.text_frame
tf.word_wrap = True
tf.text = "Term-Based Subscription Plans (Per Student / Per Term):\n\n* Standard Academy (100 KES / student / term): Core SIS, Attendance, CBC Grading & Report Cards\n* Growth Excellence (125 KES / student / term): Full M-Pesa Auto-Reconciliation, Parent Alerts & Timetable\n* Premium Enterprise (150 KES / student / term): AI Copilot, GPS Bus Tracking & Virtual PTM\n\nContact Details:\nProduct: HustlerTech School Management Software\nContact Person: Josphine Sololo\nPhone / WhatsApp: +254 727 417410\nEmail: jmweshsololo@gmail.com"

prs.save(PPTX_OUTPUT)
print(f"SUCCESS: Generated PowerPoint presentation at {PPTX_OUTPUT}")
