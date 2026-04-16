import json
import os
import urllib.request
import urllib.error

OUT_DIR = "public/sprites"
os.makedirs(OUT_DIR, exist_ok=True)

# app filename -> pokemon name
SPRITES = {
    "dragapult-ex.png": "dragapult",
    "blaziken.png": "blaziken",
    "dusknoir.png": "dusknoir",
    "grimmsnarl.png": "grimmsnarl",
    "froslass.png": "froslass",
    "lucario.png": "lucario",
    "hariyama.png": "hariyama",
    "absol.png": "absol",
    "zoroark.png": "zoroark",
    "ogerpon.png": "ogerpon",
    "meganium.png": "meganium",
    "spidops.png": "spidops",
    "munkidori.png": "munkidori",
    "joltik.png": "joltik",
    "crustle.png": "crustle",
    "alakazam.png": "alakazam",
    "raging-bolt.png": "raging-bolt",
    "charizard-ex.png": "charizard",
    "gardevoir-ex.png": "gardevoir",
    "gholdengo-ex.png": "gholdengo",
    "other-emerging.png": "ditto",
}

API_BASE = "https://pokeapi.co/api/v2/pokemon/{}"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
}

SPRITE_PATHS = [
    ["sprites", "other", "official-artwork", "front_default"],
    ["sprites", "front_default"],
]

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

def fetch_file(url: str, out_path: str) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(out_path, "wb") as f:
        f.write(resp.read())

def nested_get(data: dict, path: list[str]):
    cur = data
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
        if cur is None:
            return None
    return cur

def pick_sprite_url(data: dict) -> str | None:
    for path in SPRITE_PATHS:
        url = nested_get(data, path)
        if isinstance(url, str) and url:
            return url
    return None

def main():
    for out_name, pokemon_name in SPRITES.items():
        api_url = API_BASE.format(pokemon_name)
        out_path = os.path.join(OUT_DIR, out_name)

        try:
            data = fetch_json(api_url)
            sprite_url = pick_sprite_url(data)

            if not sprite_url:
                print(f"[WARN] No sprite found for {pokemon_name}")
                continue

            fetch_file(sprite_url, out_path)
            print(f"[OK] Saved {out_path}")

        except urllib.error.HTTPError as e:
            print(f"[HTTP {e.code}] {pokemon_name}: {e.reason}")
        except Exception as e:
            print(f"[FAIL] {pokemon_name}: {e}")

if __name__ == "__main__":
    main()
