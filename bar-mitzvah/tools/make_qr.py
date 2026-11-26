#!/usr/bin/env python3
"""Generate the invitation QR code.

The QR opens the site, signs the guest in with the passcode, and jumps
straight to the RSVP form.

    pip install "qrcode[pil]"
    python3 tools/make_qr.py https://kwill93.github.io/Kwill94.github.io/bar-mitzvah/ MAZELTOV

Writes qr-rsvp.png / qr-rsvp.svg (dark on white) and qr-rsvp-cyan.png
(cyan on black, to match the invitation) next to index.html.
"""
import sys
from pathlib import Path
from urllib.parse import quote

import qrcode
import qrcode.image.svg

if len(sys.argv) != 3:
    sys.exit(__doc__)

base, code = sys.argv[1].rstrip("/") + "/", sys.argv[2]
url = f"{base}?code={quote(code.upper())}#rsvp"
out = Path(__file__).resolve().parent.parent

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=20, border=2)
qr.add_data(url)
qr.make(fit=True)
qr.make_image(fill_color="black", back_color="white").save(out / "qr-rsvp.png")
qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage).save(out / "qr-rsvp.svg")
# Invitation-styled version: cyan on black, matching the printed suite.
# Light-on-dark codes scan on modern phones; test a printed proof first.
qr.make_image(fill_color="#7cf3ee", back_color="black").save(out / "qr-rsvp-cyan.png")
print(f"QR encodes: {url}")
print(f"Saved {out / 'qr-rsvp.png'} and {out / 'qr-rsvp.svg'}")
