#!/usr/bin/env python3
"""Draws the lesson pictures in ../assets/lessons/*.svg (one scene function per lesson id). The output is plain static SVG;
the site itself has no build step, so re-run this only after changing a scene or the shared palette / frame.
Run:  python3 -I make_lesson_svgs.py ../assets/lessons [<folder for contact sheets to eyeball the result>]"""
import math, pathlib, sys

W, H = 420, 236
BG, PN, LN, TX, MU = "#0D1117", "#161B22", "#30363D", "#E6EDF3", "#8B949E"
G, GB, B, P, R, RB, Y, SK = "#3FB950", "#0F2A1A", "#79C0FF", "#D2A8FF", "#FF7B72", "#2D1417", "#E3B341", "#21262D"
FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace"


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def n(v):
    return f"{v:.1f}".rstrip("0").rstrip(".") if isinstance(v, float) else str(v)


def t(x, y, s, size=16, fill=TX, anchor="middle", weight=700):
    a = "" if anchor == "middle" else f' text-anchor="{anchor}"'
    w = "" if weight == 700 else f' font-weight="{weight}"'
    return f'<text x="{n(x)}" y="{n(y)}" font-size="{n(size)}" fill="{fill}"{a}{w}>{esc(s)}</text>'


def tt(x, y, parts, size=16):
    spans = "".join(f'<tspan fill="{c}">{esc(s)}</tspan>' for s, c in parts)
    return f'<text x="{n(x)}" y="{n(y)}" font-size="{n(size)}">{spans}</text>'


def e(x, y, ch, size=30, anchor="middle"):
    a = "" if anchor == "middle" else f' text-anchor="{anchor}"'
    return f'<text class="e" x="{n(x)}" y="{n(y)}" font-size="{n(size)}"{a}>{emoji(ch)}</text>'


def emoji(s):  # BMP emoji also exist as plain glyphs in monospace fonts: ask for the colour form
    for ch in "⏰☕⚽⭐⚡☔⚖⛓":
        s = s.replace(ch + "️", ch).replace(ch, ch + "️")
    return s


def rect(x, y, w, h, fill=PN, stroke=LN, rx=8, sw=1.5, extra=""):
    s = f' stroke="{stroke}" stroke-width="{n(sw)}"' if stroke else ""
    r = f' rx="{n(rx)}"' if rx else ""
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}"{r} fill="{fill}"{s}{extra}/>'


def circ(cx, cy, r, fill="none", stroke=LN, sw=1.5, extra=""):
    s = f' stroke="{stroke}" stroke-width="{n(sw)}"' if stroke else ""
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{fill}"{s}{extra}/>'


def line(x1, y1, x2, y2, stroke=MU, sw=2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<line x1="{n(float(x1))}" y1="{n(float(y1))}" x2="{n(float(x2))}" y2="{n(float(y2))}" '
            f'stroke="{stroke}" stroke-width="{n(sw)}" stroke-linecap="round"{d}/>')


def path(d, fill="none", stroke=None, sw=2, extra=""):
    s = f' stroke="{stroke}" stroke-width="{n(sw)}"' if stroke else ""
    return f'<path d="{d}" fill="{fill}"{s}{extra}/>'


def poly(points, fill):
    return f'<polygon points="{" ".join(f"{n(float(x))},{n(float(y))}" for x, y in points)}" fill="{fill}"/>'


def arrow(x1, y1, x2, y2, color=G, sw=2.5, head=8):
    a = math.atan2(y2 - y1, x2 - x1)
    bx, by = x2 - head * math.cos(a), y2 - head * math.sin(a)
    px, py = -math.sin(a) * head * 0.6, math.cos(a) * head * 0.6
    return line(x1, y1, bx, by, color, sw) + poly(((x2, y2), (bx + px, by + py), (bx - px, by - py)), color)


ROUND = ' stroke-linecap="round" stroke-linejoin="round"'

# ------------------------------------------------------------------ English


def v01():  # clock at seven, calendar Monday 13 May, 13 vs 30
    o = []
    cx, cy, r = 78, 115, 62
    o.append(circ(cx, cy, r, PN, B, 2.5))
    for i in range(12):
        a = math.radians(i * 30)
        big = i % 3 == 0
        r1, r2 = (r - 11 if big else r - 8), r - 4
        o.append(line(cx + r1 * math.sin(a), cy - r1 * math.cos(a), cx + r2 * math.sin(a), cy - r2 * math.cos(a), TX if big else MU, 2.5 if big else 1.5))
    for num, deg in ((12, 0), (3, 90), (6, 180), (9, 270)):
        a = math.radians(deg)
        o.append(t(cx + (r - 22) * math.sin(a), cy - (r - 22) * math.cos(a), num, 13))
    for deg, length, col, sw in ((210, 24, TX, 5), (0, 30, G, 3.5)):
        a = math.radians(deg)
        o.append(line(cx, cy, cx + length * math.sin(a), cy - length * math.cos(a), col, sw))
    o.append(circ(cx, cy, 4.5, Y, None))
    x, y, w, h = 160, 36, 108, 158
    o.append(rect(x, y, w, h, PN, LN, 10))
    o.append(path(f"M{x},{y + 38} V{y + 10} Q{x},{y} {x + 10},{y} H{x + w - 10} Q{x + w},{y} {x + w},{y + 10} V{y + 38} Z", R))
    o += [circ(x + 28, y + 2, 4.5, BG, MU, 2), circ(x + w - 28, y + 2, 4.5, BG, MU, 2)]
    o += [t(x + w / 2, y + 21, "MAY", 17, BG), t(x + w / 2, y + 86, "13", 52), t(x + w / 2, y + 134, "Monday", 16, MU)]
    for ty, num, parts, col, fill in ((36, "13", [("thir", MU), ("TEEN", TX)], G, GB), (122, "30", [("THIR", TX), ("ty", MU)], Y, SK)):
        o += [rect(292, ty, 112, 72, fill, col, 10, 2), t(348, ty + 26, num, 28, col), tt(348, ty + 54, parts, 15)]
    o.append(t(348, 115, "≠", 15, MU))
    return o


def v03():  # Noy's family tree
    o = []
    xl, xr, mid = 150, 262, 206
    o += [line(xl + 24, 44, xr - 24, 44), line(mid, 44, mid, 80), line(mid, 80, xl, 80), line(xl, 80, xl, 96)]
    o += [line(xl + 24, 118, xr - 24, 118), line(mid, 118, mid, 154), line(xl, 154, xr, 154), line(xl, 154, xl, 170), line(xr, 154, xr, 170)]
    people = (("👴", xl, 44, "grandfather"), ("👵", xr, 44, "grandmother"), ("👨", xl, 118, "father"),
              ("👩", xr, 118, "mother"), ("👧", xl, 192, "Noy (me)"), ("👦", xr, 192, "Tom"))
    for ch, x, y, name in people:
        left = x == xl
        o += [e(x, y, ch, 36), t(x - 28 if left else x + 28, y, name, 15, G if "Noy" in name else TX, "end" if left else "start")]
    return o


def v04():  # one day, six stops
    o = []
    cells = (("06:00", "⏰", "get up"), ("07:00", "🍳", "have breakfast"), ("08:00", "🏫", "go to school"),
             ("12:00", "🍚", "have lunch"), ("18:00", "📚", "do homework"), ("22:00", "😴", "go to bed"))
    for i, (time, ch, phrase) in enumerate(cells):
        cx, top = 72 + (i % 3) * 138, 14 + (i // 3) * 108
        o += [rect(cx - 63, top, 126, 100, PN, LN, 10), t(cx, top + 18, time, 15, Y), e(cx, top + 51, ch, 32), t(cx, top + 83, phrase, 13)]
        if i % 3:
            o.append(t(cx - 69, top + 50, "›", 16, MU))
    return o


def v06():  # match the job to the place
    o = []
    jobs = (("📖", "teacher"), ("💉", "doctor"), ("🍜", "waiter"), ("💻", "developer"))
    places = (("🏥", "hospital"), ("🏢", "office"), ("🏫", "school"), ("🍴", "restaurant"))
    for i, ((jc, job), (pc, place)) in enumerate(zip(jobs, places)):
        y = 38 + i * 53
        o += [rect(14, y - 20, 164, 40, PN, B, 10), e(38, y, jc, 22), t(60, y, job, 16, TX, "start")]
        o += [rect(242, y - 20, 164, 40, PN, G, 10), e(266, y, pc, 22), t(288, y, place, 16, TX, "start")]
        o += [line(183, y, 195, y, MU, 2, "2 5"), line(225, y, 237, y, MU, 2, "2 5")]
    o.append(t(210, 118, "?", 46, Y))
    return o


def g01():  # the "to be" machine
    o = [line(16, 82, 404, 82, LN, 1.5), line(16, 154, 404, 154, LN, 1.5)]
    rows = ((46, "🙋", "I", "am", G, GB), (118, "👦👧🐶", "he / she / it", "is", B, SK), (190, "👫👥", "you / we / they", "are", P, SK))
    for y, em, subj, verb, col, fill in rows:
        o += [e(24, y - 15, em, 22, "start"), t(24, y + 14, subj, 17, TX, "start"), arrow(204, y, 262, y, col)]
        o += [rect(276, y - 24, 124, 48, fill, col, 10, 2), t(338, y, verb, 24, col)]
    return o


def g03():  # near: this / these, far: that / those
    o = [line(210, 34, 210, 222, LN, 2, "6 6"), t(124, 20, "near", 15, G), t(315, 20, "far", 15, P)]
    o += [e(34, 112, "🙋", 34), t(34, 142, "you", 12, MU)]
    o += [e(124, 72, "🍎", 34), t(124, 104, "this apple", 14)]
    o += [e(124 + dx, 160, "🍎", 28) for dx in (-34, 0, 34)]
    o.append(t(124, 190, "these apples", 14))
    o += [e(315, 76, "🚗", 20), t(315, 104, "that car", 14)]
    o += [e(315 + dx, 162, "🚗", 18) for dx in (-26, 0, 26)]
    o.append(t(315, 190, "those cars", 14))
    return o


def g05():  # how many days a week?
    o = []
    xs = [176 + i * 27 for i in range(7)]
    o += [t(x, 26, d, 13, MU) for x, d in zip(xs, "MTWTFSS")]
    rows = (("always", 7, G, "100%"), ("usually", 6, G, "80%"), ("often", 4, B, "60%"), ("sometimes", 3, Y, "40%"), ("never", 0, R, "0%"))
    for i, (word, k, col, pct) in enumerate(rows):
        y = 60 + i * 37
        o.append(t(22, y, word, 16, TX, "start"))
        o += [circ(x, y, 9, col, None) if j < k else circ(x, y, 8.5, "none", LN, 1.5) for j, x in enumerate(xs)]
        o.append(t(402, y, pct, 13, MU, "end"))
    return o


def p03():  # street map with the way to the bank
    o = [rect(0, 95, 420, 30, SK, None, 0), rect(195, 110, 30, 126, SK, None, 0)]
    o += [line(8, 110, 412, 110, MU, 1.5, "8 8"), line(210, 134, 210, 184, MU, 1.5, "8 8")]
    blocks = ((60, 18, "🏦", "bank"), (146, 18, "🏫", "school"), (330, 18, "☕", "café"),
              (60, 134, "🏥", "hospital"), (146, 134, "🌳", "park"), (330, 134, "🏪", "shop"))
    for cx, top, ch, name in blocks:
        o += [rect(cx - 38, top, 76, 68, PN, LN, 10), e(cx, top + 26, ch, 28), t(cx, top + 54, name, 13)]
    o += [path("M210,186 V110 H86", "none", G, 3.5, ROUND), poly(((72, 110), (86, 103), (86, 117)), G)]
    o += [e(210, 208, "🚶", 26), t(240, 210, "YOU", 13, Y, "start")]
    return o


def g07():  # a room to count things in
    o = [line(14, 198, 406, 198, MU, 2.5)]
    o += [rect(286, 26, 100, 74, SK, B, 6, 2), line(336, 26, 336, 100, B, 2), line(286, 63, 386, 63, B, 2), e(362, 46, "🐦", 24)]
    o.append(line(28, 92, 156, 92, MU, 4))
    o += [e(x, 74, ch, 28) for x, ch in ((60, "📕"), (92, "📗"), (124, "📘"))]
    o.append(e(84, 166, "🛏️", 56))
    o += [e(196, 178, "🐈", 30), e(238, 178, "🐈", 30)]
    o += [line(296, 160, 380, 160, MU, 4), line(306, 160, 306, 198, MU, 3), line(370, 160, 370, 198, MU, 3)]
    o += [circ(338, 135, 23, SK, B, 2), e(338, 137, "🐟", 20)]
    return o


def g09():  # now vs going to
    o = [rect(14, 14, 188, 208, PN, G, 12, 2), rect(218, 14, 188, 208, PN, Y, 12, 2)]
    o += [t(108, 36, "NOW", 16, G), t(312, 36, "GOING TO", 16, Y)]
    o += [e(48, 92, "🏃", 34), t(76, 92, "He's running.", 13.5, TX, "start")]
    o += [e(48, 160, "🍳", 34), t(76, 160, "She's cooking.", 13.5, TX, "start")]
    o += [e(284, 82, "☁️", 40), e(340, 82, "☁️", 40), arrow(312, 110, 312, 136, Y), e(312, 162, "☔", 32), t(312, 200, "It's going to rain.", 13.5)]
    return o


def g10():  # today's verbs travel back to yesterday
    o = [rect(30, 46, 160, 178, PN, P, 12, 2), rect(230, 46, 160, 178, PN, G, 12, 2)]
    o += [t(110, 26, "YESTERDAY", 15, P), t(310, 26, "TODAY", 15, G)]
    o += [poly(((198, 26), (209, 19), (209, 33)), Y), poly(((211, 26), (222, 19), (222, 33)), Y)]
    rows = (([("was", B)], "am / is"), ([("were", B)], "are"), ([("walk", TX), ("ed", G)], "walk"), ([("went", Y)], "go"), ([("ate", Y)], "eat"))
    for i, (past, now) in enumerate(rows):
        y = 72 + i * 33
        o += [tt(110, y, past, 18), t(310, y, now, 18), arrow(226, y, 196, y, MU, 2, 6)]
    return o


# ------------------------------------------------------------------ maths


def m01():  # 3/4 of a pizza, 5/10 of a battery
    o = []
    cx, cy, r = 104, 100, 72
    o.append(path(f"M{cx},{cy} V{cy - r} A{r},{r} 0 0 1 {cx + r},{cy} Z", "none", MU, 2, ' stroke-dasharray="5 5"'))
    for d in (f"M{cx},{cy} H{cx + r} A{r},{r} 0 0 1 {cx},{cy + r} Z", f"M{cx},{cy} V{cy + r} A{r},{r} 0 0 1 {cx - r},{cy} Z", f"M{cx},{cy} H{cx - r} A{r},{r} 0 0 1 {cx},{cy - r} Z"):
        o.append(path(d, Y, BG, 3))
    o += [circ(cx + dx, cy + dy, 7, R, None) for dx, dy in ((26, 22), (44, 40), (-24, 26), (-46, 34), (-26, -24), (-44, -42))]
    o.append(t(cx, 206, "3/4 = 0.75", 18))
    o += [rect(226, 66, 160, 68, "none", TX, 10, 3), rect(388, 88, 10, 24, TX, None, 3)]
    o += [rect(234 + i * 14.72, 74, 11.5, 52, G if i < 5 else SK, None, 3) for i in range(10)]
    o.append(t(306, 206, "5/10 = 0.5", 18))
    return o


def m03():  # Venn diagram: football and music in a class of 35
    o = [rect(14, 12, 392, 212, "none", MU, 12, 2), t(28, 30, "U = 35", 14, MU, "start")]
    o += [circ(162, 124, 76, B, B, 2.5, ' fill-opacity="0.14"'), circ(258, 124, 76, G, G, 2.5, ' fill-opacity="0.14"')]
    o += [e(106, 40, "⚽", 24), e(326, 44, "🎸", 24)]
    o += [t(118, 124, "15", 26), t(210, 124, "5", 26), t(302, 124, "10", 26), t(372, 198, "?", 26, Y)]
    return o


def m06():  # drinks x sweets
    o = [t(64, 42, "A × B", 16, Y), line(120, 16, 120, 220, LN, 2), line(14, 74, 406, 74, LN, 2)]
    cols, rows = ((176, "🍰"), (270, "🍪"), (364, "🍩")), ((112, "☕"), (180, "🍵"))
    o += [e(x, 42, ch, 30) for x, ch in cols] + [e(64, y, ch, 30) for y, ch in rows]
    for y, a in rows:
        for x, b in cols:
            o += [rect(x - 42, y - 27, 84, 54, PN, LN, 10), t(x - 31, y, "(", 18, MU), e(x - 14, y, a, 20), t(x, y + 3, ",", 18, MU), e(x + 14, y, b, 20), t(x + 31, y, ")", 18, MU)]
    return o


def m08():  # arrow diagram of a relation
    o = [f'<ellipse cx="110" cy="126" rx="56" ry="90" fill="{B}" fill-opacity="0.1" stroke="{B}" stroke-width="2.5"/>',
         f'<ellipse cx="310" cy="126" rx="56" ry="90" fill="{G}" fill-opacity="0.1" stroke="{G}" stroke-width="2.5"/>']
    o += [t(110, 20, "A", 17, B), t(310, 20, "B", 17, G), t(210, 46, "R", 17, Y)]
    for i, (a, b) in enumerate(((1, 2), (2, 3), (3, 4))):
        y = 72 + i * 54
        o += [t(110, y, a, 24), t(310, y, b, 24), arrow(134, y, 286, y, Y)]
    return o


def m10():  # six cards, three bins
    o = []
    cards = (("2 + 3 = 5", 76, 30), ("x + 1 = 4", 210, 30), ("7 < 3", 344, 30), ("5 + 2 = ?", 76, 72), ("2 + 3 = 6", 210, 72), ("9 − 4 = 5", 344, 72))
    for s, x, y in cards:
        o += [rect(x - 56, y - 16, 112, 32, PN, MU, 8), t(x, y, s, 15)]
    for x, col, fill, lab in ((76, G, GB, "T"), (210, R, RB, "F"), (344, Y, SK, "?")):
        o.append(arrow(x, 96, x, 120, MU, 2, 6))
        o.append(path(f"M{x - 52},132 V212 Q{x - 52},222 {x - 42},222 H{x + 42} Q{x + 52},222 {x + 52},212 V132", fill, col, 3))
        o.append(t(x + (16 if lab != "?" else 0), 178, lab, 28, col))
    o.append(path("M50,178 l8,9 l14,-18", "none", G, 4, ROUND))
    o.append(path("M186,169 l16,18 M202,169 l-16,18", "none", R, 4, ROUND))
    return o


# ------------------------------------------------------------------ computer repair


def r01():  # information system: people in the middle
    chips = ((86, 48, "📋", "Procedure"), (334, 48, "💿", "Software"), (86, 188, "💻", "Hardware"), (334, 188, "📊", "Data"))
    o = [line(210, 118, cx, cy, MU, 2) for cx, cy, _, _ in chips]
    o += [circ(210, 118, 46, GB, G, 3), e(210, 108, "👫", 30), t(210, 140, "People", 14, G), e(210, 52, "⭐", 18)]
    for cx, cy, ch, name in chips:
        o += [rect(cx - 62, cy - 24, 124, 48, PN, LN, 10), e(cx - 40, cy, ch, 22), t(cx - 22, cy, name, 14, TX, "start")]
    return o


def r02():  # 1969 Internet, 1991 Web, three kinds of e-commerce
    o = [arrow(30, 62, 392, 62, MU, 3, 9)]
    o += [circ(110, 62, 7, B, None), t(110, 30, "1969", 20, B), t(110, 88, "ARPANET → Internet", 12.5)]
    o += [circ(300, 62, 7, G, None), t(300, 30, "1991", 20, G), t(300, 88, "Web (CERN)", 12.5)]
    o.append(t(205, 44, "? years", 13, Y))
    for cx, name, col, a, b in ((76, "B2C", B, "🏢", "👤"), (210, "C2C", G, "👤", "👤"), (344, "B2B", P, "🏢", "🏢")):
        o += [rect(cx - 62, 122, 124, 100, PN, col, 10, 2), t(cx, 146, name, 17, col), e(cx - 32, 188, a, 28), arrow(cx - 11, 188, cx + 11, 188, MU, 2, 6), e(cx + 32, 188, b, 28)]
    return o


def r03():  # bitmap pixels vs vector objects
    o = []
    cell, rad, cx, cy = 14, 4.6, 110, 104
    for j in range(-5, 5):
        xs = [i for i in range(-5, 5) if (i + .5) ** 2 + (j + .5) ** 2 <= rad ** 2]
        o.append(rect(cx + xs[0] * cell, cy + j * cell, (xs[-1] - xs[0] + 1) * cell, cell, B, None, 0))
    for k in range(-4, 5):
        o += [line(cx + k * cell, cy - 5 * cell, cx + k * cell, cy + 5 * cell, BG, 1.5), line(cx - 5 * cell, cy + k * cell, cx + 5 * cell, cy + k * cell, BG, 1.5)]
    o.append(t(110, 206, "Bitmap = pixels", 14))
    o.append(circ(310, 104, 66, B, None))
    o += [line(276, 38, 344, 38, TX, 1.5), circ(276, 38, 3.5, TX, None), circ(344, 38, 3.5, TX, None)]
    o += [rect(hx - 4.5, hy - 4.5, 9, 9, BG, TX, 1, 1.5) for hx, hy in ((310, 38), (376, 104), (310, 170), (244, 104))]
    o += [t(310, 206, "Vector = objects", 14), e(210, 104, "🔍", 26)]
    return o


def r04():  # the layers between the user and the hardware
    o = [e(190, 30, "👤", 22), t(206, 30, "User", 15, TX, "start")]
    o += [rect(30, 52, 360, 40, PN, B, 10, 2), t(210, 72, "Application software", 15, B)]
    o += [rect(30, 100, 360, 66, PN, G, 10, 2), t(210, 117, "System software", 15, G)]
    for i, name in enumerate(("OS", "Utility", "Driver", "Translator")):
        o += [rect(38 + i * 87, 132, 82, 26, GB, None, 6), t(79 + i * 87, 145, name, 12)]
    o += [rect(30, 174, 360, 40, PN, P, 10, 2), t(210, 194, "Hardware", 15, P)]
    return o


def r05():  # CPU = control unit + ALU, memory = RAM / ROM / flash
    o = [line(12, 52 + k * 26, 22, 52 + k * 26, B, 2.5) for k in range(6)]
    o += [rect(22, 34, 170, 168, PN, B, 10, 2.5), t(107, 54, "CPU", 16, B)]
    o += [rect(36, 72, 142, 54, SK, LN, 8), t(107, 91, "Control unit", 14), t(107, 111, "directs the work", 11.5, MU, weight=400)]
    o += [rect(36, 136, 142, 54, SK, LN, 8), t(107, 155, "ALU", 14), t(107, 175, "+ − × ÷   > < =", 11.5, MU, weight=400)]
    o += [arrow(221, 118, 247, 118, Y, 3, 8), arrow(221, 118, 197, 118, Y, 3, 8), t(222, 98, "bus", 13, Y)]
    for top, name, col, sub, ch in ((40, "RAM", G, "volatile", "⚡"), (96, "ROM", P, "BIOS chip", "🔒"), (152, "Flash", Y, "keeps data", "💾")):
        o += [rect(252, top, 154, 48, PN, col, 10, 2), t(266, top + 16, name, 16, col, "start"), t(266, top + 35, sub, 12, MU, "start", 400), e(384, top + 24, ch, 20)]
    return o


def r06():  # input -> process -> output
    o = [t(74, 26, "INPUT", 15, B), t(346, 26, "OUTPUT", 15, G)]
    o += [rect(14, 42, 120, 180, PN, B, 12, 2), rect(286, 42, 120, 180, PN, G, 12, 2)]
    for i, (ch, name) in enumerate((("⌨️", "keyboard"), ("🖱️", "mouse"), ("🎤", "mic"), ("📷", "camera"))):
        o += [e(36, 68 + i * 43, ch, 22), t(54, 68 + i * 43, name, 13, TX, "start")]
    for i, (ch, name) in enumerate((("🖥️", "soft copy"), ("🖨️", "hard copy"), ("🔊", "sound"))):
        o += [e(308, 76 + i * 56, ch, 22), t(326, 76 + i * 56, name, 13, TX, "start")]
    o += [e(210, 116, "💻", 54), t(210, 162, "process", 13, MU)]
    o += [arrow(140, 124, 176, 124, B, 3, 8), arrow(244, 124, 280, 124, G, 3, 8)]
    return o


def r07():  # a platter with one track and one sector, and the other kinds of storage
    o = []
    cx, cy = 104, 106

    def pt(r, deg):
        a = math.radians(deg)
        return cx + r * math.cos(a), cy + r * math.sin(a)

    o.append(circ(cx, cy, 84, SK, MU, 2))
    o += [circ(cx, cy, rr, "none", LN, 1.5) for rr in (28, 44, 76)]
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = pt(84, -70), pt(84, -30), pt(14, -30), pt(14, -70)
    o.append(path(f"M{x1:.1f},{y1:.1f} A84,84 0 0 1 {x2:.1f},{y2:.1f} L{x3:.1f},{y3:.1f} A14,14 0 0 0 {x4:.1f},{y4:.1f} Z", Y, Y, 1.5, ' fill-opacity="0.3"'))
    o += [circ(cx, cy, 60, "none", G, 3.5), circ(cx, cy, 12, MU, None)]
    o += [line(182, 186, 140, 148, TX, 4), circ(182, 186, 6, TX, None), rect(133, 141, 12, 10, TX, None, 2)]
    o += [circ(42, 216, 5, "none", G, 3), t(54, 216, "track", 13.5, G, "start"), rect(114, 211, 10, 10, Y, None, 2), t(130, 216, "sector", 13.5, Y, "start")]
    for top, ch, name, sub in ((24, "⚡", "SSD · USB", "no moving parts"), (88, "💿", "CD · DVD · Blu-ray", "ROM · R · RW"), (152, "☁️", "Cloud", "via Internet")):
        o += [rect(212, top, 194, 54, PN, LN, 10), e(236, top + 27, ch, 24), t(258, top + 18, name, 12.5, TX, "start"), t(258, top + 37, sub, 11.5, MU, "start", 400)]
    return o


def r08():  # where the pins are: PGA vs LGA
    o = []
    for x0, name, col, cap in ((14, "PGA", B, "pins on the CPU"), (218, "LGA", G, "pins on the socket")):
        mid = x0 + 94
        o += [rect(x0, 14, 188, 208, PN, col, 12, 2), t(mid, 36, name, 17, col)]
        o += [rect(mid - 56, 58, 112, 28, SK, TX, 5, 2), t(mid, 72, "CPU", 13)]
        o += [rect(mid - 68, 140, 136, 32, SK, MU, 5, 2), t(mid, 159, "socket", 12.5, MU)]
        for k in range(9):
            x = mid - 44 + k * 11
            if name == "PGA":
                o += [line(x, 89, x, 108, Y, 2.5), rect(x - 2.5, 141, 5, 7, BG, None, 1)]
            else:
                o += [rect(x - 3, 86, 6, 3.5, Y, None, 1), line(x, 138, x, 122, Y, 2.5)]
        o.append(t(mid, 198, cap, 13))
    return o


def r09():  # the notch moves from one DDR generation to the next
    o = []
    x0, w = 18, 232
    for top, name, sub, f in ((22, "DDR2", "240 pin · 1.8 V", 0.53), (92, "DDR3", "240 pin · 1.5 V", 0.40), (162, "DDR4", "288 pin · 1.2 V", 0.56)):
        nx = x0 + f * w
        o.append(rect(x0, top, w, 34, GB, G, 4, 2))
        o += [rect(x0 + 14 + k * 36, top + 9, 24, 16, SK, LN, 2, 1) for k in range(6)]
        o += [rect(x0 + 4, top + 35, nx - 5 - (x0 + 4), 8, Y, None, 1), rect(nx + 5, top + 35, x0 + w - 4 - (nx + 5), 8, Y, None, 1)]
        o.append(poly(((nx, top + 47), (nx - 6, top + 57), (nx + 6, top + 57)), R))
        o += [t(262, top + 12, name, 16, TX, "start"), t(262, top + 32, sub, 12.5, MU, "start", 400)]
    return o


def r10():  # RAID 0 splits, RAID 1 copies
    o = []
    for x0, name, col, d1, d2, cap in ((14, "RAID 0", B, "AC", "BD", "fast · no backup"), (218, "RAID 1", G, "AB", "AB", "same data twice")):
        mid = x0 + 94
        o += [rect(x0, 14, 188, 208, PN, col, 12, 2), t(mid, 36, name, 17, col)]
        for dx, blocks in ((-44, d1), (44, d2)):
            o.append(rect(mid + dx - 34, 54, 68, 118, SK, MU, 12, 2))
            for k, b in enumerate(blocks):
                o += [rect(mid + dx - 24, 66 + k * 50, 48, 38, col, col, 6, 1.5, ' fill-opacity="0.22"'), t(mid + dx, 85 + k * 50, b, 17)]
        o.append(t(mid, 198, cap, 12.5, MU, weight=400))
    return o


def r11():  # map of an ATX mainboard
    o = [rect(16, 12, 388, 212, GB, G, 10, 2)]
    o += [rect(26, 24, 22, 88, SK, MU, 3), t(37, 124, "I/O", 12, MU)]
    o += [rect(108, 28, 74, 74, SK, TX, 6, 2), rect(122, 42, 46, 46, PN, LN, 3), t(145, 65, "CPU", 15)]
    o += [rect(206 + k * 14, 24, 8, 96, B, None, 2) for k in range(4)]
    o.append(t(231, 132, "RAM", 13, B))
    o += [rect(372, 28, 16, 68, Y, None, 3), t(378, 108, "Power", 12, Y), t(318, 40, "ATX", 13, MU)]
    o += [rect(60, 150, 136, 12, SK, TX, 3), t(204, 156, "PCIe x16", 12, TX, "start")]
    o += [rect(60, 186, 100, 12, SK, MU, 3), t(168, 192, "PCI", 12, MU, "start")]
    o += [rect(280, 136, 64, 36, SK, P, 5, 2), t(312, 154, "Chipset", 12, P)]
    o += [rect(364, 138, 20, 10, R, None, 2), rect(364, 154, 20, 10, R, None, 2), t(374, 178, "SATA", 12, R)]
    o += [circ(226, 198, 11, SK, Y, 2), t(244, 198, "BIOS battery", 12, Y, "start")]
    return o


# ------------------------------------------------------------------ law


def l01():  # five steps of society; the scales (law) appear on step 2
    o = []
    for i, ch in enumerate("🔥⛓🌾🏭🤝"):
        x, h = 20 + i * 78, 34 + i * 26
        o += [rect(x, 214 - h, 68, h, GB if i == 1 else PN, Y if i == 1 else LN), t(x + 34, 200, i + 1, 18, Y if i == 1 else TX), e(x + 34, 192 - h, ch, 26)]
    o.append(e(132, 176, "⚖", 20))
    return o


def l02():  # the constitution on the top floor, laws below, rules at the bottom
    o = [rect(140, 22, 140, 58, GB, Y, 8, 2.5), e(168, 51, "📜", 26), t(226, 36, "REV. 2025", 12, Y), t(226, 51, "FIRST 1991", 12), t(226, 66, "14 | 122", 12, B)]
    o += [rect(90, 88, 240, 58), e(150, 117, "⚖", 26), t(226, 117, "LAW", 18)]
    o += [rect(40, 154, 340, 58)] + [e(110 + i * 50, 183, "📄", 24) for i in range(5)]
    return o


def l03():  # three columns: the higher, the heavier the punishment
    o = []
    for i, (h, col, top, label) in enumerate(((60, G, "💬 💵", ""), (110, Y, "🔒", "3m–10y"), (160, R, "🔒🔒", "5y +"))):
        x = 44 + i * 122
        o += [rect(x, 214 - h, 90, h, PN, col, 8, 2.5), t(x + 45, 196, i + 1, 20, col), e(x + 45, 236 - h, top, 22)]
        if label:
            o.append(t(x + 45, 262 - h, label, 14))
    return o


def l04():  # A pays, B delivers; four conditions of a valid contract
    o = [e(64, 70, "🧑", 44), t(64, 112, "A", 18, B), e(356, 70, "👩", 44), t(356, 112, "B", 18, P), e(210, 72, "📝", 40)]
    o += [arrow(104, 46, 316, 46, Y), e(210, 26, "💵", 22), arrow(316, 104, 104, 104, G), e(210, 124, "📦", 22)]
    o += [line(20, 150, 400, 150, LN, 2)] + [e(72 + i * 92, 190, ch, 30) for i, ch in enumerate("🤝🧠⚖📝")]
    return o


def l05():  # marriage at 18+, working time limits
    o = [e(104, 62, "💍", 46), t(104, 122, "18+", 28, Y), t(104, 166, "1 + 1", 18), line(210, 20, 210, 216, LN, 2)]
    o += [e(250, 52, "⏰", 30), t(280, 52, "8 h / day", 17, TX, "start"), e(250, 104, "📅", 30), t(280, 104, "48 h / week", 17, TX, "start")]
    o += [e(250, 156, "👶", 30), t(280, 156, "105 d", 17, TX, "start"), e(250, 200, "🏖", 24), t(280, 200, "15 d", 17, TX, "start")]
    return o


SCENES = dict(v01=v01, v03=v03, v04=v04, v06=v06, g01=g01, g03=g03, g05=g05, p03=p03, g07=g07, g09=g09, g10=g10,
              m01=m01, m03=m03, m06=m06, m08=m08, m10=m10,
              r01=r01, r02=r02, r03=r03, r04=r04, r05=r05, r06=r06, r07=r07, r08=r08, r09=r09, r10=r10, r11=r11,
              l01=l01, l02=l02, l03=l03, l04=l04, l05=l05)
HEAD = (f'font-family="{FONT}" font-weight="700" text-anchor="middle"><style>text{{dominant-baseline:central}}.e{{font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}}</style>'
        f'<defs><pattern id="d" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="{SK}"/></pattern></defs>')
FRAME = f'<rect width="{W}" height="{H}" fill="{BG}"/><rect width="{W}" height="{H}" fill="url(#d)"/>'

out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
for name, scene in SCENES.items():
    (out / f"{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" {HEAD}{FRAME}{"".join(scene())}</svg>\n', encoding="utf8")
print(len(SCENES), "svg files ->", out)

if len(sys.argv) > 2:  # contact sheets for eyeballing: 2 x 3 scenes each
    sheets = pathlib.Path(sys.argv[2])
    sheets.mkdir(parents=True, exist_ok=True)
    names = list(SCENES)
    for s in range(0, len(names), 6):
        body = "".join(f'<g transform="translate({(i % 2) * (W + 12)},{(i // 2) * (H + 12)})">{FRAME}{"".join(SCENES[nm]())}</g>' for i, nm in enumerate(names[s:s + 6]))
        (sheets / f"sheet{s // 6 + 1}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2 * W + 12} {2 * W + 12}" width="{2 * (2 * W + 12)}" height="{2 * (2 * W + 12)}" {HEAD}<rect width="100%" height="100%" fill="#FBF8F1"/>{body}</svg>\n', encoding="utf8")
