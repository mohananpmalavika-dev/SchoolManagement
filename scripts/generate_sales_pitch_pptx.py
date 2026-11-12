"""
Generate high-impact, professional Sales Pitch Presentation for HustlerTech School ERP (in KES currency)
Target: Kenyan School Directors, Principals, Board of Governors & Bursars.
Features actual embedded UI screenshots, pricing in KES, CBC alignment, M-Pesa automation, and ROI breakdown.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

# Color Palette
NAVY_DARK = RGBColor(15, 23, 42)       # #0F172A Deep slate background
SLATE_CARD = RGBColor(30, 41, 59)      # #1E293B Card surface dark
TEXT_WHITE = RGBColor(255, 255, 255)
TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Muted slate
TEXT_DARK = RGBColor(15, 23, 42)
TEXT_BODY = RGBColor(51, 65, 85)       # #334155 Body text on light

BG_LIGHT = RGBColor(248, 250, 252)     # #F8FAFC Off-white
CARD_LIGHT = RGBColor(255, 255, 255)   # #FFFFFF Clean card
CARD_BORDER = RGBColor(226, 232, 240)  # #E2E8F0 Subtle border

INDIGO_PRIMARY = RGBColor(79, 70, 229) # #4F46E5 Primary Brand
PURPLE_BRAND = RGBColor(105, 82, 188)  # #6952BC HustlerTech Violet
EMERALD_GREEN = RGBColor(16, 185, 129) # #10B981 Money / Growth / KES
AMBER_ACCENT = RGBColor(245, 158, 11)  # #F59E0B Warning / High Risk
ROSE_ACCENT = RGBColor(244, 63, 94)    # #F43F5E Pain points / Debt
CYAN_ACCENT = RGBColor(14, 165, 233)   # #0EA5E9 Tech / Analytics

def create_deck(output_path="HustlerTech_School_Sales_Pitch_KES.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_bg(slide, color=BG_LIGHT):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, badge_text, title_text, subtitle_text, dark=False):
        # Category Badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(3.2), Inches(0.38))
        badge.fill.solid()
        badge.fill.fore_color.rgb = INDIGO_PRIMARY if dark else RGBColor(238, 242, 255)
        badge.line.fill.background()
        tf = badge.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = badge_text.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE if dark else INDIGO_PRIMARY
        p.alignment = PP_ALIGN.CENTER

        # Title Box
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.7))
        tf = title_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE if dark else TEXT_DARK

        # Subtitle Box
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.5), Inches(0.45))
        tf = sub_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = subtitle_text
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_MUTED if dark else RGBColor(100, 116, 139)

    def add_image_card(slide, img_path, left, top, width, height, caption=""):
        # Outer Card with subtle frame
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(241, 245, 249)
        card.line.color.rgb = RGBColor(203, 213, 225)
        card.line.width = Pt(1.5)
        
        # Inset image slightly
        pad = Inches(0.08)
        if os.path.exists(img_path):
            slide.shapes.add_picture(img_path, left + pad, top + pad, width - (pad * 2), height - (pad * 2))

    # ==========================================
    # SLIDE 1: TITLE / COVER SLIDE (DARK)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    add_bg(slide1, NAVY_DARK)

    # Accent decorative gradient pill
    glow = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.6), Inches(4.5), Inches(0.4))
    glow.fill.solid()
    glow.fill.fore_color.rgb = PURPLE_BRAND
    glow.line.fill.background()
    p = glow.text_frame.paragraphs[0]
    p.text = "KENYAN SCHOOL TRANSFORMATION PITCH"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.alignment = PP_ALIGN.CENTER

    # Main Title
    t_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(6.5), Inches(2.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "HustlerTech"
    p1.font.size = Pt(38)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(129, 140, 248) # Light Indigo

    p2 = tf.add_paragraph()
    p2.text = "School ERP Workspace"
    p2.font.size = Pt(38)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE

    p3 = tf.add_paragraph()
    p3.text = "The Complete Operating System for Kenyan Schools: Zero Fee Leakage, Instant M-Pesa Reconciliations & AI-Powered CBC Academics."
    p3.font.size = Pt(14)
    p3.font.color.rgb = TEXT_MUTED

    # Bullet chips
    chips = [
        ("✓ Safaricom M-Pesa STK Push", EMERALD_GREEN),
        ("✓ Automated CBC Rubrics & AI Remarks", CYAN_ACCENT),
        ("✓ WhatsApp Fee Reminders in KES", PURPLE_BRAND),
        ("✓ Tamper-Proof Digital Certificates", AMBER_ACCENT)
    ]
    top_c = 3.9
    for txt, col in chips:
        ch = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_c), Inches(5.8), Inches(0.45))
        ch.fill.solid()
        ch.fill.fore_color.rgb = SLATE_CARD
        ch.line.color.rgb = col
        ch.line.width = Pt(1.5)
        p = ch.text_frame.paragraphs[0]
        p.text = txt
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        top_c += 0.55

    # Footer note on Slide 1
    f_box = slide1.shapes.add_textbox(Inches(0.8), Inches(6.4), Inches(5.8), Inches(0.6))
    tf = f_box.text_frame
    p = tf.paragraphs[0]
    p.text = "Prepared for School Directors, Principals & Bursars | Currency: KES"
    p.font.size = Pt(11)
    p.font.color.rgb = RGBColor(148, 163, 184)

    # Hero Image Card on Right
    add_image_card(slide1, "assets/sales_pitch/dashboard_hero.png", Inches(7.0), Inches(1.2), Inches(5.6), Inches(5.4))

    # ==========================================
    # SLIDE 2: THE 5 PAIN POINTS IN KENYA (LIGHT)
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2, BG_LIGHT)
    add_header(slide2, "Current Challenges", "The 5 Crippling Headaches Kenyan Schools Face Every Term",
               "Traditional school management leads to revenue leakage, teacher burnout, and frustrated parents.")

    pains = [
        ("1. Fee Arrears & Bad Debt", "20% to 35% of term fees go unpaid or delayed. Without automated follow-ups, schools struggle to fund payroll and food suppliers.", ROSE_ACCENT),
        ("2. Manual M-Pesa Chaos", "Matching Paybill SMS confirmation codes and bank deposit slips manually takes 20+ hours a week and invites fake slip fraud.", AMBER_ACCENT),
        ("3. CBC Assessment Burden", "Kenya's Competency-Based Curriculum requires extensive formative rubrics and remarks. Teachers waste hours writing reports instead of teaching.", INDIGO_PRIMARY),
        ("4. Chaotic Parent Communication", "Disjointed WhatsApp groups, missing paper circulars, and endless phone calls lead to poor parent trust and delayed fee payments.", CYAN_ACCENT),
        ("5. Executive Blindspots", "Directors and Board members cannot see real-time cash balances, attendance trends, or multi-campus stats without manual phone calls.", PURPLE_BRAND)
    ]

    left_pos = [Inches(0.8), Inches(4.5), Inches(8.2), Inches(2.6), Inches(6.5)]
    top_pos = [Inches(2.1), Inches(2.1), Inches(2.1), Inches(4.6), Inches(4.6)]
    widths = [Inches(3.5), Inches(3.5), Inches(4.3), Inches(3.7), Inches(4.3)]

    for i, (title, desc, accent) in enumerate(pains):
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos[i], top_pos[i], widths[i], Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.5)

        # Accent bar on top of card
        bar = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_pos[i] + Inches(0.2), top_pos[i] + Inches(0.15), Inches(0.6), Inches(0.06))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()

        tb = slide2.shapes.add_textbox(left_pos[i] + Inches(0.2), top_pos[i] + Inches(0.3), widths[i] - Inches(0.4), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_DARK

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_BODY

    # ==========================================
    # SLIDE 3: THE ALL-IN-ONE SOLUTION (DARK)
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3, NAVY_DARK)
    add_header(slide3, "Unified Solution", "HustlerTech ERP: Complete Modern School Operating System",
               "Built specifically for the Kenyan educational and economic landscape.", dark=True)

    modules = [
        ("💳 Smart Fees & M-Pesa", "Instant STK push, Paybill auto-matching, WhatsApp reminders in KES, zero manual reconciliation.", EMERALD_GREEN),
        ("🤖 AI Academic Copilot", "Instant CBC student report remarks, automatic exam analysis, quiz & lesson planning in seconds.", CYAN_ACCENT),
        ("📈 Predictive Analytics", "Early warning on fee default risks, chronic absenteeism, and student dropout indicators.", AMBER_ACCENT),
        ("👨‍👩‍👧 Parent & Family Portal", "Real-time fee statements, grade book, attendance feed, and 1-click teacher meeting bookings.", INDIGO_PRIMARY),
        ("📜 Digital Certificates", "Tamper-proof Transfer Certificates with QR verification & Principal cryptographic signature.", PURPLE_BRAND),
        ("🚌 Operations & Campus", "Transport fleet tracking, library loans, staff HR/payroll, and multi-campus management.", RGBColor(236, 72, 153))
    ]

    for idx, (m_title, m_desc, m_col) in enumerate(modules):
        col_idx = idx % 3
        row_idx = idx // 3
        m_left = Inches(0.8 + (col_idx * 3.9))
        m_top = Inches(2.2 + (row_idx * 2.4))
        
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, m_left, m_top, Inches(3.6), Inches(2.1))
        card.fill.solid()
        card.fill.fore_color.rgb = SLATE_CARD
        card.line.color.rgb = m_col
        card.line.width = Pt(1.5)

        tb = slide3.shapes.add_textbox(m_left + Inches(0.2), m_top + Inches(0.2), Inches(3.2), Inches(1.6))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = m_title
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_WHITE

        p2 = tf.add_paragraph()
        p2.text = m_desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 4: EXECUTIVE DASHBOARD (SCREENSHOT)
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4, BG_LIGHT)
    add_header(slide4, "Real-time Control", "Executive Command Center: Complete School Pulse in One View",
               "Instant visibility into enrollment, daily attendance rates, fee collection velocity, and campus alerts.")

    # Left Feature Points
    points = [
        ("Real-Time School Health", "Track total students, active staff, class distribution, and campus operational status live."),
        ("Daily Attendance Pulse", "Instant view of school-wide attendance percentage (e.g. 96%) with automatic parent absence SMS."),
        ("Financial Collection Progress", "Real-time fee collection meter in KES cents and major units, showing collected vs. outstanding revenue."),
        ("Role-Based Security", "Custom dashboards for School Directors, Principals, Accountants, Teachers, and Guardians.")
    ]
    top_p = 2.2
    for p_title, p_desc in points:
        card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_p), Inches(4.5), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        tb = slide4.shapes.add_textbox(Inches(0.95), Inches(top_p + 0.08), Inches(4.2), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = "• " + p_title
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = INDIGO_PRIMARY

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_BODY
        top_p += 1.15

    # Right Screenshot
    add_image_card(slide4, "assets/sales_pitch/school_dashboard.png", Inches(5.6), Inches(2.2), Inches(6.9), Inches(4.6))

    # ==========================================
    # SLIDE 5: FEE COLLECTION & M-PESA DARAJA (LIGHT)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5, BG_LIGHT)
    add_header(slide5, "Revenue Engine", "Automated Fee Collection & M-Pesa Daraja: Recover 95%+ of Fees",
               "Eliminate manual bank slips, fake payment claims, and awkward debt collection phone calls.")

    # Left Cards with Money Emphasis
    stats = [
        ("KES 0 Manual Errors", "Direct Safaricom Daraja API integration matches Paybill/Till transactions to student invoices automatically.", EMERALD_GREEN),
        ("Instant STK Push Prompt", "Parents receive a payment prompt on their phone screen. They simply enter M-Pesa PIN and receipt is issued.", INDIGO_PRIMARY),
        ("Automated WhatsApp & SMS", "Bilingual reminders in English & Swahili: 'ബാക്കി തുക: KES 5,000' with instant 1-tap payment link.", PURPLE_BRAND),
        ("Zero Gate Cash Handling", "No physical cash handled by security guards or clerks, closing all theft and embezzlement loopholes.", ROSE_ACCENT)
    ]
    top_s = 2.2
    for s_title, s_desc, s_color in stats:
        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_s), Inches(4.5), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = s_color
        card.line.width = Pt(1.5)

        tb = slide5.shapes.add_textbox(Inches(0.95), Inches(top_s + 0.08), Inches(4.2), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = s_title
        p1.font.size = Pt(12.5)
        p1.font.bold = True
        p1.font.color.rgb = s_color

        p2 = tf.add_paragraph()
        p2.text = s_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_BODY
        top_s += 1.15

    # Right Screenshot (Modern Workspace or Fee screenshot)
    add_image_card(slide5, "assets/sales_pitch/executive_analytics.png", Inches(5.6), Inches(2.2), Inches(6.9), Inches(4.6))

    # ==========================================
    # SLIDE 6: TEACHER AI & CBC COPILOT (SCREENSHOT)
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_bg(slide6, BG_LIGHT)
    add_header(slide6, "Academic Innovation", "AI Teacher Copilot & CBC Assessment: Cut Report Time by 80%",
               "Tailored for Kenyan CBC guidelines: Exceeding, Meeting, Approaching, and Below Expectation bands.")

    copilot_points = [
        ("Automated Student Remarks", "AI generates personalized, encouraging, and constructive comments for 500+ student report cards in minutes.", INDIGO_PRIMARY),
        ("CBC Assessment Rubrics", "Aligned with KNEC and Ministry of Education CBC standards. No more manual rubric calculation.", CYAN_ACCENT),
        ("Instant Quiz & Test Maker", "Teachers generate custom quizzes, marking schemes, and revision materials tailored to class performance.", PURPLE_BRAND),
        ("Teacher Burnout Prevention", "Saves an average of 40+ hours per teacher every term, leading to higher teacher retention.", EMERALD_GREEN)
    ]
    top_cp = 2.2
    for c_title, c_desc, c_color in copilot_points:
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_cp), Inches(4.5), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        tb = slide6.shapes.add_textbox(Inches(0.95), Inches(top_cp + 0.08), Inches(4.2), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = "✓ " + c_title
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = c_color

        p2 = tf.add_paragraph()
        p2.text = c_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_BODY
        top_cp += 1.15

    # Right Screenshot
    add_image_card(slide6, "assets/sales_pitch/teacher_copilot.png", Inches(5.6), Inches(2.2), Inches(6.9), Inches(4.6))

    # ==========================================
    # SLIDE 7: PREDICTIVE ANALYTICS & RETENTION (SCREENSHOT)
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_bg(slide7, BG_LIGHT)
    add_header(slide7, "Proactive Governance", "Predictive Analytics: Catch Fee Defaults & Dropouts Early",
               "Stop reacting to lost revenue after term end. Intervene before students leave or balances become uncollectible.")

    pred_points = [
        ("Fee Default Risk Index", "Machine learning calculates risk score per family using historical payment frequency and outstanding arrears.", ROSE_ACCENT),
        ("Academic Dropout Warning", "Identifies students showing combined dips in attendance and subject mastery before failure occurs.", AMBER_ACCENT),
        ("Bursar Payment Restructuring", "Recommends flexible micro-installment plans for at-risk families to secure school revenue.", EMERALD_GREEN),
        ("Multi-Campus Benchmark", "Compare risk profiles and collection efficiency across campuses in Nairobi, Mombasa, and regional hubs.", INDIGO_PRIMARY)
    ]
    top_pr = 2.2
    for pr_title, pr_desc, pr_color in pred_points:
        card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_pr), Inches(4.5), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        tb = slide7.shapes.add_textbox(Inches(0.95), Inches(top_pr + 0.08), Inches(4.2), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = "⚡ " + pr_title
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = pr_color

        p2 = tf.add_paragraph()
        p2.text = pr_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_BODY
        top_pr += 1.15

    # Right Screenshot
    add_image_card(slide7, "assets/sales_pitch/predictive_ai.png", Inches(5.6), Inches(2.2), Inches(6.9), Inches(4.6))

    # ==========================================
    # SLIDE 8: PARENT & FAMILY ENGAGEMENT (SCREENSHOT)
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_bg(slide8, BG_LIGHT)
    add_header(slide8, "Family Satisfaction", "Modern Parent Portal & Mobile Workspace: Total Trust & Transparency",
               "Give parents live digital access to their child's academic journey, fees, homework, and teachers.")

    parent_points = [
        ("Live Fee Ledger & PDF Receipts", "Parents see clear invoice breakdowns, download payment receipts, and view payment history anytime.", EMERALD_GREEN),
        ("1-Click PTM Conference Booking", "Parents schedule parent-teacher meetings directly through available teacher time slots.", INDIGO_PRIMARY),
        ("Secure Media & Activity Feed", "Daily photo and video updates of school activities with strict school tenant privacy.", PURPLE_BRAND),
        ("Mobile PWA & WhatsApp Alerts", "Seamless mobile experience on Android, iPhone, and low-spec smartphones without app store friction.", CYAN_ACCENT)
    ]
    top_par = 2.2
    for pt_title, pt_desc, pt_color in parent_points:
        card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_par), Inches(4.5), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        tb = slide8.shapes.add_textbox(Inches(0.95), Inches(top_par + 0.08), Inches(4.2), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = "★ " + pt_title
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = pt_color

        p2 = tf.add_paragraph()
        p2.text = pt_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_BODY
        top_par += 1.15

    # Right Screenshot
    add_image_card(slide8, "assets/sales_pitch/family_portal.png", Inches(5.6), Inches(2.2), Inches(6.9), Inches(4.6))

    # ==========================================
    # SLIDE 9: DIGITAL CERTIFICATES & SECURITY (LIGHT)
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_bg(slide9, BG_LIGHT)
    add_header(slide9, "Authenticity & Compliance", "Tamper-Proof Digital Certificates & Principal Digital Signatures",
               "Issue Ministry-compliant Transfer Certificates and Leaving Diplomas in seconds with zero fraud risk.")

    cert_cards = [
        ("Instant Transfer Certificates (TC)", "Generate official Leaving and Transfer Certificates formatted with school crest, student biodata, and conduct records automatically.", INDIGO_PRIMARY),
        ("Cryptographic Principal Signature", "Authorized Principals sign certificates digitally with a single click, eliminating delays when the headteacher is off-campus.", PURPLE_BRAND),
        ("Instant QR-Code Verification", "Receiving schools, universities, and education ministries scan the QR code to verify authenticity in 2 seconds, eradicating certificate forgery.", EMERALD_GREEN),
        ("Annual Savings on Security Paper", "Eliminate costly specialized watermark stationery and administrative courier fees, saving KES 50,000+ per year.", CYAN_ACCENT)
    ]
    for idx, (c_title, c_desc, c_col) in enumerate(cert_cards):
        c_left = Inches(0.8 + ((idx % 2) * 5.9))
        c_top = Inches(2.3 + ((idx // 2) * 2.3))
        
        card = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, c_top, Inches(5.6), Inches(2.0))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = c_col
        card.line.width = Pt(1.5)

        tb = slide9.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(0.25), Inches(5.0), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = c_title
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = c_col

        p2 = tf.add_paragraph()
        p2.text = c_desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = TEXT_BODY

    # ==========================================
    # SLIDE 10: PRICING PACKAGES IN KES (HERO PRICING)
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_bg(slide10, BG_LIGHT)
    add_header(slide10, "Transparent Investment", "Simple, Predictable Annual Pricing in Kenyan Shillings (KES)",
               "Choose the plan that fits your school's enrollment size. No hidden setup fees or per-user penalties.")

    plans = [
        {
            "name": "STARTER",
            "price": "KES 15,000",
            "period": "/ year (or KES 1,500 / mo)",
            "target": "Small Academies & Primary Schools",
            "color": RGBColor(100, 116, 139),
            "popular": False,
            "features": [
                "Up to 200 Students & 30 Staff",
                "Student Admissions & Profiles",
                "Fee Management & Invoicing",
                "Basic Attendance & Class Registers",
                "500 SMS Credits / month",
                "5 GB Cloud Storage",
                "Standard Email Support"
            ]
        },
        {
            "name": "PROFESSIONAL",
            "price": "KES 40,000",
            "period": "/ year (or KES 4,000 / mo)",
            "target": "Mid-sized Day & Boarding Schools",
            "color": INDIGO_PRIMARY,
            "popular": True,
            "features": [
                "Up to 500 Students & 75 Staff",
                "Safaricom M-Pesa STK & Paybill Integration",
                "Kenyan CBC Assessment & Rubrics",
                "Full Parent & Family Portal",
                "Timetable & Exam Scheduling",
                "Automated WhatsApp & SMS (1,500/mo)",
                "15 GB Cloud Storage & Backups",
                "Priority WhatsApp Support"
            ]
        },
        {
            "name": "ENTERPRISE",
            "price": "KES 80,000",
            "period": "/ year (or KES 8,000 / mo)",
            "target": "Large Schools & Multi-Campus Groups",
            "color": PURPLE_BRAND,
            "popular": False,
            "features": [
                "Up to 2,000 Students & 200 Staff",
                "Multi-Campus Centralized Management",
                "Teacher AI Copilot & Automated Remarks",
                "Predictive Fee Default Analytics",
                "Digital TC with QR & Principal Signature",
                "Library & Fleet/Transport Management",
                "HR Management & Staff Payroll",
                "5,000 SMS/mo + 50 GB Cloud Storage",
                "Dedicated Account Manager 24/7"
            ]
        }
    ]

    for idx, plan in enumerate(plans):
        p_left = Inches(0.8 + (idx * 3.9))
        p_top = Inches(2.1)
        p_width = Inches(3.6)
        p_height = Inches(4.8)

        # Card container
        card = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p_left, p_top, p_width, p_height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = plan["color"] if plan["popular"] else CARD_BORDER
        card.line.width = Pt(2.5 if plan["popular"] else 1.5)

        # Popular Badge
        if plan["popular"]:
            pop_b = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p_left + Inches(0.6), p_top - Inches(0.18), Inches(2.4), Inches(0.35))
            pop_b.fill.solid()
            pop_b.fill.fore_color.rgb = INDIGO_PRIMARY
            pop_b.line.fill.background()
            p = pop_b.text_frame.paragraphs[0]
            p.text = "★ MOST POPULAR"
            p.font.size = Pt(10)
            p.font.bold = True
            p.font.color.rgb = TEXT_WHITE
            p.alignment = PP_ALIGN.CENTER

        # Plan Info
        tb = slide10.shapes.add_textbox(p_left + Inches(0.2), p_top + Inches(0.3), p_width - Inches(0.4), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = plan["name"]
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = plan["color"]

        p_pr = tf.add_paragraph()
        p_pr.text = plan["price"]
        p_pr.font.size = Pt(24)
        p_pr.font.bold = True
        p_pr.font.color.rgb = TEXT_DARK

        p_sub = tf.add_paragraph()
        p_sub.text = plan["period"]
        p_sub.font.size = Pt(10)
        p_sub.font.color.rgb = TEXT_MUTED

        p_div = tf.add_paragraph()
        p_div.text = plan["target"]
        p_div.font.size = Pt(10.5)
        p_div.font.italic = True
        p_div.font.color.rgb = INDIGO_PRIMARY if plan["popular"] else TEXT_BODY

        tf.add_paragraph().text = "" # blank line

        for f in plan["features"]:
            pf = tf.add_paragraph()
            pf.text = "• " + f
            pf.font.size = Pt(10)
            pf.font.color.rgb = TEXT_BODY

    # ==========================================
    # SLIDE 11: ROI & BUSINESS CASE IN KES (DARK)
    # ==========================================
    slide11 = prs.slides.add_slide(blank_layout)
    add_bg(slide11, NAVY_DARK)
    add_header(slide11, "Financial Justification", "Real-World ROI: The System that Pays for Itself in 14 Days",
               "Based on an average 400-student Kenyan private school with term fees of KES 25,000.", dark=True)

    # ROI Calculation Cards
    roi_items = [
        ("KES 1,500,000", "5% Bad Debt Recovery", "Automated M-Pesa STK push & WhatsApp reminders recover at least 5% of fees previously lost to defaulters every year.", EMERALD_GREEN),
        ("KES 150,000", "Stationery & Paper Savings", "Eliminate printed fee receipt books, paper report cards, and manual ledger files.", CYAN_ACCENT),
        ("KES 240,000", "Administrative Time Saved", "Free 15+ hours weekly from bursar and teacher manual records, redirecting time to academics.", AMBER_ACCENT)
    ]
    for idx, (amount, r_title, r_desc, r_col) in enumerate(roi_items):
        r_left = Inches(0.8 + (idx * 3.9))
        r_top = Inches(2.2)
        card = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, r_left, r_top, Inches(3.6), Inches(2.5))
        card.fill.solid()
        card.fill.fore_color.rgb = SLATE_CARD
        card.line.color.rgb = r_col
        card.line.width = Pt(1.5)

        tb = slide11.shapes.add_textbox(r_left + Inches(0.2), r_top + Inches(0.2), Inches(3.2), Inches(2.1))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = amount
        p1.font.size = Pt(26)
        p1.font.bold = True
        p1.font.color.rgb = r_col

        p2 = tf.add_paragraph()
        p2.text = r_title
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE

        p3 = tf.add_paragraph()
        p3.text = r_desc
        p3.font.size = Pt(10.5)
        p3.font.color.rgb = TEXT_MUTED

    # Bottom Comparison Banner
    banner = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.1), Inches(11.5), Inches(1.7))
    banner.fill.solid()
    banner.fill.fore_color.rgb = RGBColor(17, 24, 39)
    banner.line.color.rgb = EMERALD_GREEN
    banner.line.width = Pt(2)

    tb = banner.text_frame
    tb.word_wrap = True
    p = tb.paragraphs[0]
    p.text = "TOTAL ANNUAL BENEFIT: KES 1,890,000  |  ANNUAL SOFTWARE COST: KES 40,000"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p.alignment = PP_ALIGN.CENTER

    p2 = tb.add_paragraph()
    p2.text = "NET RETURN ON INVESTMENT: 47x (4,725% ROI) — Pays for itself within the first 2 weeks of Term 1!"
    p2.font.size = Pt(14)
    p2.font.color.rgb = TEXT_WHITE
    p2.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 12: DATA SECURITY & COMPLIANCE (LIGHT)
    # ==========================================
    slide12 = prs.slides.add_slide(blank_layout)
    add_bg(slide12, BG_LIGHT)
    add_header(slide12, "Enterprise Security", "Kenya Data Protection Compliance & 99.9% Cloud Reliability",
               "Your school data is completely private, legally compliant, and protected by bank-grade encryption.")

    sec_items = [
        ("Kenya DPA 2019 Compliant", "Strict tenant isolation guarantees that student biodata, grades, and parent contact details never leak or mix with other schools.", INDIGO_PRIMARY),
        ("Automated Cloud Backups", "Daily encrypted off-site cloud backups protect your school from computer crashes, fire, theft, or ransom risks.", EMERALD_GREEN),
        ("Offline PWA Resilience", "Progressive Web App continues functioning even during power or internet outages in rural and peri-urban locations.", AMBER_ACCENT),
        ("Audit Logs & Fraud Defense", "Every fee entry, grade alteration, and password change is logged with timestamp, user ID, and IP address.", PURPLE_BRAND)
    ]
    for idx, (st, sd, sc) in enumerate(sec_items):
        s_left = Inches(0.8 + ((idx % 2) * 5.9))
        s_top = Inches(2.3 + ((idx // 2) * 2.3))

        card = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, s_left, s_top, Inches(5.6), Inches(2.0))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = sc
        card.line.width = Pt(1.5)

        tb = slide12.shapes.add_textbox(s_left + Inches(0.3), s_top + Inches(0.25), Inches(5.0), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = st
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = sc

        p2 = tf.add_paragraph()
        p2.text = sd
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = TEXT_BODY

    # ==========================================
    # SLIDE 13: 4-WEEK ONBOARDING ROADMAP (LIGHT)
    # ==========================================
    slide13 = prs.slides.add_slide(blank_layout)
    add_bg(slide13, BG_LIGHT)
    add_header(slide13, "Seamless Transition", "4-Week Rapid Implementation: Zero Disruption to School Routine",
               "Our technical engineers handle data migration, M-Pesa testing, and staff training end-to-end.")

    steps = [
        ("WEEK 1", "Data Onboarding", "Upload existing student, class, and fee records from Excel/CSV in 24 hours.", INDIGO_PRIMARY),
        ("WEEK 2", "M-Pesa & Finance Setup", "Connect Safaricom Paybill / Till API, configure fee categories and term structures.", CYAN_ACCENT),
        ("WEEK 3", "Staff & Teacher Training", "2-hour interactive training workshop for teachers, bursars, and administrators.", PURPLE_BRAND),
        ("WEEK 4", "Parent Launch & Go-Live", "Send welcome SMS with parent portal credentials. Begin automated collection!", EMERALD_GREEN)
    ]
    for idx, (wk, st_title, st_desc, st_col) in enumerate(steps):
        st_left = Inches(0.8 + (idx * 2.9))
        st_top = Inches(2.4)
        
        card = slide13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, st_left, st_top, Inches(2.7), Inches(4.2))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = st_col
        card.line.width = Pt(2)

        # Step badge
        badge = slide13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, st_left + Inches(0.3), st_top + Inches(0.3), Inches(2.1), Inches(0.45))
        badge.fill.solid()
        badge.fill.fore_color.rgb = st_col
        badge.line.fill.background()
        p = badge.text_frame.paragraphs[0]
        p.text = wk
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.alignment = PP_ALIGN.CENTER

        tb = slide13.shapes.add_textbox(st_left + Inches(0.2), st_top + Inches(1.0), Inches(2.3), Inches(3.0))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = st_title
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_DARK

        p2 = tf.add_paragraph()
        p2.text = st_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_BODY

    # ==========================================
    # SLIDE 14: CALL TO ACTION & FREE TRIAL (DARK)
    # ==========================================
    slide14 = prs.slides.add_slide(blank_layout)
    add_bg(slide14, NAVY_DARK)
    add_header(slide14, "Take Action Today", "Transform Your School This Term — 30-Day Zero Risk Pilot",
               "Test HustlerTech School ERP alongside your current system with 100% money-back guarantee.", dark=True)

    # Big CTA Card
    cta_card = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.2), Inches(6.8), Inches(4.6))
    cta_card.fill.solid()
    cta_card.fill.fore_color.rgb = SLATE_CARD
    cta_card.line.color.rgb = INDIGO_PRIMARY
    cta_card.line.width = Pt(2)

    tb = cta_card.text_frame
    tb.word_wrap = True
    p1 = tb.paragraphs[0]
    p1.text = "OUR GUARANTEE TO SCHOOL DIRECTORS:"
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = AMBER_ACCENT

    p2 = tb.add_paragraph()
    p2.text = "If HustlerTech does not recover at least 3X the cost of the software in uncollected fees during your first term, your subscription is 100% FREE."
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE

    p3 = tb.add_paragraph()
    p3.text = "\nWhat You Get in Your 30-Day Free Pilot:"
    p3.font.size = Pt(12)
    p3.font.bold = True
    p3.font.color.rgb = CYAN_ACCENT

    features = [
        "Full access to Enterprise Plan features",
        "Free student & fee data migration from Excel",
        "Staff training session included at no cost",
        "Dedicated WhatsApp support hotline for your bursar"
    ]
    for feat in features:
        pf = tb.add_paragraph()
        pf.text = "• " + feat
        pf.font.size = Pt(11)
        pf.font.color.rgb = TEXT_MUTED

    # Contact Box on Right
    contact_card = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(2.2), Inches(4.5), Inches(4.6))
    contact_card.fill.solid()
    contact_card.fill.fore_color.rgb = SLATE_CARD
    contact_card.line.color.rgb = EMERALD_GREEN
    contact_card.line.width = Pt(2)

    tb2 = contact_card.text_frame
    tb2.word_wrap = True
    p = tb2.paragraphs[0]
    p.text = "BOOK YOUR DEMO"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p.alignment = PP_ALIGN.CENTER

    contact_info = [
        ("\n📞 Phone & WhatsApp:", "+254 700 000 000 / +254 711 000 000"),
        ("✉️ Email:", "sales@hustlertech.co.ke"),
        ("🌐 Web Portal:", "https://hustlertech.co.ke"),
        ("📍 Regional Offices:", "Nairobi • Mombasa • Kisumu • Eldoret"),
        ("\nOperating Currency:", "Kenyan Shillings (KES)")
    ]
    for label, val in contact_info:
        p_l = tb2.add_paragraph()
        p_l.text = label
        p_l.font.size = Pt(11)
        p_l.font.bold = True
        p_l.font.color.rgb = TEXT_WHITE

        p_v = tb2.add_paragraph()
        p_v.text = val
        p_v.font.size = Pt(11)
        p_v.font.color.rgb = CYAN_ACCENT

    prs.save(output_path)
    print(f"[SUCCESS] Generated Sales Pitch PPTX successfully: {output_path}")

if __name__ == "__main__":
    create_deck()
