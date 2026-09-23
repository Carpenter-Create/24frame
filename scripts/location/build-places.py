#!/usr/bin/env python3
"""Build src/lib/location-places.json from GeoNames cities5000.

Keyless worldwide gazetteer for server-side location typeahead.
Source: https://download.geonames.org/export/dump/ (CC BY 4.0).
https://www.geonames.org/ — credit GeoNames when redistributing.

cities5000 is every populated place with population >= 5,000.
That covers countries and inhabited territories, including ones the
previous Natural Earth 10m subset missed (Puerto Rico, Hong Kong).
Uninhabited or obsolete GeoNames codes have no row in this dump.

US regions are stored as postal abbreviations (TX). Other regions are
admin1 names. A place with no admin1 uses the country name so city,
region, and country are all present.

Usage (from the repo root):
  python3 scripts/location/build-places.py
"""

from __future__ import annotations

import io
import json
import re
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "lib" / "location-places.json"
DUMP = "https://download.geonames.org/export/dump"
US_REGION = re.compile(r"^[A-Z]{2}$")
ISO2 = re.compile(r"^[A-Z]{2}$")


def collapse(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in decomposed if not unicodedata.category(ch).startswith("M"))
    return re.sub(r"[^a-z0-9]+", " ", stripped.lower()).strip()


def fetch(name: str) -> bytes:
    request = urllib.request.Request(
        f"{DUMP}/{name}",
        headers={"User-Agent": "24frame-location-places/1.0"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def load_admin(raw: str) -> dict[str, str]:
    names: dict[str, str] = {}
    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) < 2 or not parts[0] or not parts[1]:
            continue
        # Column 2 is the unicode admin1 name (accents kept).
        names[parts[0]] = parts[1]
    return names


def load_countries(raw: str) -> dict[str, str]:
    names: dict[str, str] = {}
    for line in raw.splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 5 or not ISO2.fullmatch(parts[0]):
            continue
        names[parts[0]] = parts[4]
    return names


def main() -> None:
    print("downloading GeoNames cities5000, admin1, countryInfo")
    cities_zip = fetch("cities5000.zip")
    admin = load_admin(fetch("admin1CodesASCII.txt").decode("utf-8"))
    countries = load_countries(fetch("countryInfo.txt").decode("utf-8"))

    with zipfile.ZipFile(io.BytesIO(cities_zip)) as archive:
        text = archive.read("cities5000.txt").decode("utf-8")

    best: dict[tuple[str, str, str], dict[str, object]] = {}
    skipped = 0
    for line in text.splitlines():
        parts = line.split("\t")
        if len(parts) < 15:
            skipped += 1
            continue
        city = parts[1].strip()
        ascii_name = parts[2].strip()
        country = parts[8].strip()
        admin_code = parts[10].strip()
        try:
            pop = int(parts[14] or 0)
        except ValueError:
            skipped += 1
            continue
        geoname_id = parts[0]
        if not city or len(city) > 80 or not ISO2.fullmatch(country):
            skipped += 1
            continue

        admin_name = admin.get(f"{country}.{admin_code}", "").strip() if admin_code else ""
        if len(admin_name) > 80:
            admin_name = ""
        region_name = ""
        if country == "US" and US_REGION.fullmatch(admin_code):
            region = admin_code
            if admin_name and admin_name != region:
                region_name = admin_name
        elif admin_name:
            region = admin_name
        else:
            region = countries.get(country, "").strip()
        if not region or len(region) > 80:
            skipped += 1
            continue

        alt = ""
        if ascii_name and ascii_name != city and collapse(ascii_name) != collapse(city):
            if len(ascii_name) <= 80:
                alt = ascii_name

        record: dict[str, object] = {
            "city": city,
            "region": region,
            "country": country,
            "pop": pop,
        }
        if region_name:
            record["regionName"] = region_name
        if alt:
            record["alt"] = alt
        record["_id"] = geoname_id

        key = (country, region, city)
        previous = best.get(key)
        if previous is None:
            best[key] = record
            continue
        prev_pop = int(previous["pop"])
        if pop > prev_pop or (pop == prev_pop and geoname_id < str(previous["_id"])):
            best[key] = record

    places = []
    for record in best.values():
        record.pop("_id", None)
        places.append(record)
    places.sort(key=lambda row: (str(row["country"]), str(row["region"]), str(row["city"])))

    payload = json.dumps(places, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(payload + "\n", encoding="utf-8")
    covered = {str(row["country"]) for row in places}
    print(f"wrote {OUT.relative_to(ROOT)} places={len(places)} countries={len(covered)} skipped={skipped}")
    print(f"bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()
