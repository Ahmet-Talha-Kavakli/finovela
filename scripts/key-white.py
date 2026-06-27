# Beyaz zemini kenardan flood-fill ile şeffaf yapar (kutu/kare foto YOK kuralı).
# Kullanım: python3 scripts/key-white.py <in.png> [out.png]
import sys
from collections import deque
from PIL import Image

inp = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else inp
im = Image.open(inp).convert("RGBA")
W, H = im.size
px = im.load()

def is_bg(p):
    r, g, b, a = p
    return min(r, g, b) >= 150 and (max(r, g, b) - min(r, g, b)) <= 40

seen = [[False]*W for _ in range(H)]
dq = deque()
for x in range(W):
    for y in (0, H-1):
        dq.append((x, y))
for y in range(H):
    for x in (0, W-1):
        dq.append((x, y))

while dq:
    x, y = dq.popleft()
    if x < 0 or y < 0 or x >= W or y >= H or seen[y][x]:
        continue
    seen[y][x] = True
    p = px[x, y]
    if not is_bg(p):
        continue
    px[x, y] = (p[0], p[1], p[2], 0)
    dq.extend([(x+1, y), (x-1, y), (x, y+1), (x, y-1)])

im.save(out, "PNG")
print(f"keyed {out} corners={px[0,0][3]},{px[W-1,0][3]},{px[0,H-1][3]},{px[W-1,H-1][3]}")
