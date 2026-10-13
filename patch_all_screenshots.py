import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = r"c:\SchoolManagement\presentation_assets"
FONT_PATH_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_PATH_REG = r"C:\Windows\Fonts\segoeui.ttf"

font_sm = ImageFont.truetype(FONT_PATH_REG, 13)
font_sm_b = ImageFont.truetype(FONT_PATH_BOLD, 13)
font_md = ImageFont.truetype(FONT_PATH_REG, 15)
font_md_b = ImageFont.truetype(FONT_PATH_BOLD, 15)
font_lg_b = ImageFont.truetype(FONT_PATH_BOLD, 20)
font_xl_b = ImageFont.truetype(FONT_PATH_BOLD, 22)

# ==========================================
# 1. PATCH ADMIN DASHBOARD
# ==========================================
admin_path = os.path.join(ASSETS_DIR, "admin_dashboard.jpg")
if os.path.exists(admin_path):
    img = Image.open(admin_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 1.1 Replace Sidebar "EduSolve" logo text with "HustlerTech"
    # Sidebar background is dark navy approx (15, 23, 42) / (11, 23, 39)
    draw.rectangle([58, 24, 180, 56], fill=(11, 23, 39))
    draw.text((62, 28), "HustlerTech", fill=(255, 255, 255), font=font_lg_b)

    # 1.2 Replace Header "EduSolve Academy" with "HustlerTech Academy"
    # Header bg is light grey approx (248, 250, 252)
    draw.rectangle([240, 22, 450, 56], fill=(248, 250, 252))
    draw.text((245, 26), "HustlerTech Academy", fill=(15, 23, 42), font=font_lg_b)

    # 1.3 Replace amounts in Recent Fee Payments:
    # Row 1: Sarah Chen Jan 2023 $1,200 Paid
    draw.rectangle([1140, 508, 1225, 532], fill=(255, 255, 255))
    draw.text((1142, 510), "KES 1,200", fill=(30, 41, 59), font=font_sm_b)

    # Row 2: David Lee Jan 2023 $950 Pending
    draw.rectangle([1140, 568, 1225, 592], fill=(255, 255, 255))
    draw.text((1142, 570), "KES 950", fill=(30, 41, 59), font=font_sm_b)

    # Row 3: Aisha Khan Jan 2023 $1,400 Paid
    draw.rectangle([1140, 628, 1225, 652], fill=(255, 255, 255))
    draw.text((1142, 630), "KES 1,400", fill=(30, 41, 59), font=font_sm_b)

    img.save(admin_path, quality=95)
    print("Admin dashboard patched successfully with KES and HustlerTech branding!")

# ==========================================
# 2. PATCH FEE MANAGEMENT
# ==========================================
fee_path = os.path.join(ASSETS_DIR, "fee_management.jpg")
if os.path.exists(fee_path):
    img = Image.open(fee_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Replace sidebar brand if any
    draw.rectangle([50, 22, 175, 58], fill=(11, 23, 39))
    draw.text((54, 26), "HustlerTech", fill=(255, 255, 255), font=font_lg_b)

    # Right panel:
    # Payment Breakdown $1,800
    draw.rectangle([1230, 180, 1340, 204], fill=(255, 255, 255))
    draw.text((1235, 182), "KES 1,800", fill=(15, 23, 42), font=font_md_b)

    # Current Payment $1,800
    draw.rectangle([1230, 218, 1340, 242], fill=(255, 255, 255))
    draw.text((1235, 220), "KES 1,800", fill=(15, 23, 42), font=font_md_b)

    # Table amounts rows:
    # Rows centered at [318, 365, 412, 459, 506, 553, 600, 647, 694, 741]
    # Total Fee: x=490-565; Paid Amount: x=568-645; Balance Due: x=650-730
    row_data = [
        ("KES 1,500", "KES 1,500", "KES 0"),
        ("KES 2,100", "KES 1,050", "KES 1,050"),
        ("KES 2,100", "KES 1,050", "KES 1,050"),
        ("KES 1,500", "KES 1,500", "KES 0"),
        ("KES 1,500", "KES 1,500", "KES 0"),
        ("KES 2,100", "KES 1,050", "KES 1,050"),
        ("KES 1,500", "KES 1,000", "KES 500"),
        ("KES 1,500", "KES 1,050", "KES 450"),
        ("KES 1,500", "KES 1,000", "KES 500"),
        ("KES 1,500", "KES 1,500", "KES 0")
    ]
    y_centers = [318, 365, 412, 459, 506, 553, 600, 647, 694, 741]

    for idx, (tot, paid, bal) in enumerate(row_data):
        yc = y_centers[idx]
        y1 = yc - 12
        y2 = yc + 12

        # Total fee
        draw.rectangle([485, y1, 565, y2], fill=(255, 255, 255))
        draw.text((490, y1 + 2), tot, fill=(30, 41, 59), font=font_sm)

        # Paid amount
        draw.rectangle([568, y1, 648, y2], fill=(255, 255, 255))
        draw.text((572, y1 + 2), paid, fill=(30, 41, 59), font=font_sm)

        # Balance Due
        draw.rectangle([652, y1, 735, y2], fill=(255, 255, 255))
        draw.text((656, y1 + 2), bal, fill=(30, 41, 59), font=font_sm)

    img.save(fee_path, quality=95)
    print("Fee management patched successfully with KES currency and HustlerTech branding!")

# ==========================================
# 3. PATCH ATTENDANCE & GRADING
# ==========================================
att_path = os.path.join(ASSETS_DIR, "attendance_grading.jpg")
if os.path.exists(att_path):
    img = Image.open(att_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 3.1 Browser Tab title (top left)
    # Background is gray tab approx (225, 230, 238)
    draw.rectangle([115, 60, 240, 78], fill=(228, 232, 239))
    draw.text((118, 62), "HustlerTech Portal", fill=(55, 65, 81), font=ImageFont.truetype(FONT_PATH_REG, 11))

    # 3.2 Browser URL bar
    draw.rectangle([110, 95, 300, 115], fill=(255, 255, 255))
    draw.text((115, 97), "hustlertech.co.ke/cbc/portal", fill=(75, 85, 99), font=ImageFont.truetype(FONT_PATH_REG, 12))

    # 3.3 Main Sidebar brand: "EduTrack CBC Portal"
    # Background is dark navy approx (15, 23, 42)
    draw.rectangle([80, 142, 195, 185], fill=(16, 24, 40))
    draw.text((84, 146), "HustlerTech", fill=(255, 255, 255), font=font_md_b)
    draw.text((84, 166), "CBC Portal", fill=(148, 163, 184), font=font_sm)

    # 3.4 In table: "Notify Parent" column
    # Notice the SMS icon next to WhatsApp icon on the right
    # WhatsApp icon is green around x=875-900; SMS icon is gray around x=900-925
    # Cover the SMS icon cleanly with white card background
    # Student rows y centers roughly: 435, 550, 660, 770 (let's check row positions in table)
    # The student card rows are:
    for y_icon in [435, 550, 655, 765, 870]:
        draw.rectangle([898, y_icon - 15, 930, y_icon + 15], fill=(255, 255, 255))

    img.save(att_path, quality=95)
    print("Attendance grading patched successfully with HustlerTech and clean messaging icons!")
