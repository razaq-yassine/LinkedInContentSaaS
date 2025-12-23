"""
Script to download LinkedIn creator profile images
"""
import os
import requests
from pathlib import Path

# Creators with their Twitter profile image URLs
CREATORS = [
    {
        "name": "Alex Hormozi",
        "slug": "alex-hormozi",
        "image_url": "https://pbs.twimg.com/profile_images/1617408747080667136/C88UDPNZ_400x400.jpg"
    },
    {
        "name": "Justin Welsh",
        "slug": "justin-welsh",
        "image_url": "https://pbs.twimg.com/profile_images/1964050794631630848/gtjsRPxS_400x400.jpg"
    },
    {
        "name": "Sahil Bloom",
        "slug": "sahil-bloom",
        "image_url": "https://pbs.twimg.com/profile_images/1586859332104343552/V1HRpbP1_400x400.jpg"
    },
    {
        "name": "Dickie Bush",
        "slug": "dickie-bush",
        "image_url": "https://pbs.twimg.com/profile_images/1645163605166379011/Wu8UcUGU_400x400.jpg"
    },
]

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "creators"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def download_image(url: str, output_path: Path) -> bool:
    """Download an image from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Downloaded: {output_path.name}")
            return True
    except Exception as e:
        print(f"❌ Failed to download {url}: {e}")
    return False

def main():
    """Download all creator profile images"""
    print("📥 Downloading creator profile images...")
    print(f"Output directory: {OUTPUT_DIR}\n")
    
    for creator in CREATORS:
        output_path = OUTPUT_DIR / f"{creator['slug']}.jpg"
        success = download_image(creator['image_url'], output_path)
        if not success:
            print(f"⚠️  Failed to download {creator['name']}'s image")
    
    print(f"\n✅ Images saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
