#!/usr/bin/env python3
"""Generate the invitation QR code.

The QR opens the site, signs the guest in with the passcode, and jumps
straight to the RSVP form.

    pip install "qrcode[pil]"
    python3 tools/make_qr.py https://kwill93.github.io/Kwill94.github.io/bar-mitzvah/ MAZELTOV

Writes qr-rsvp.png and qr-rsvp.svg next to index.html (print-ready).
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
qr.make_image(fill_color="#14213d", back_color="white").save(out / "qr-rsvp.png")
qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage).save(out / "qr-rsvp.svg")
print(f"QR encodes: {url}")
print(f"Saved {out / 'qr-rsvp.png'} and {out / 'qr-rsvp.svg'}")
