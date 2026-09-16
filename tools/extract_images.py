import openpyxl
import os
import re
import sys
import io
import json
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
sys.stdout.reconfigure(encoding='utf-8')

excel_path = r'd:\victor\Web-product-project\Sunglasses_120_Models_Embedded_Product_Images.xlsx'
out_dir = r'd:\victor\Web-product-project\apps\storefront\public\images\sunglasses'
json_out = r'd:\victor\Web-product-project\apps\backend\src\scripts\data\sunglasses-120.json'

os.makedirs(out_dir, exist_ok=True)

wb = openpyxl.load_workbook(excel_path)
sheet = wb['Master 120 Models']

def slug(s):
    return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', str(s).lower()))

items = []
count = 0

for img in sheet._images:
    r = img.anchor._from.row
    row_vals = [cell.value for cell in sheet[r + 1]]
    
    n = int(row_vals[0]) if row_vals[0] is not None else (count + 1)
    brand = str(row_vals[1] or '').strip()
    model = str(row_vals[2] or '').strip()
    shape = str(row_vals[3] or '').strip()
    info = str(row_vals[4] or '').strip()
    tier = str(row_vals[5] or '').strip()
    
    handle = f"sun-{slug(brand)}-{slug(model)}"
    fname = f"{handle}.jpg"
    img_path = os.path.join(out_dir, fname)
    public_url = f"/images/sunglasses/{fname}"
    
    try:
        pil_img = Image.open(io.BytesIO(img._data()))
        if pil_img.mode in ('RGBA', 'P', 'LA'):
            pil_img = pil_img.convert('RGB')
        pil_img.save(img_path, 'JPEG', quality=92)
    except Exception as e:
        print(f"Warning saving {handle}: {e}")
    
    count += 1
    items.append({
        "n": n,
        "brand": brand,
        "model": model,
        "shape": shape,
        "info": info,
        "tier": tier,
        "handle": handle,
        "image": public_url
    })
    print(f"[{count}/120] Saved image for {brand} {model} -> {public_url}")

items.sort(key=lambda x: x["n"])

with open(json_out, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f"\nSuccessfully extracted {len(items)} images and updated {json_out}!")
