"""Regenerates the PNG icons in assets/icons. Run: python3 generate-icons.py (needs Pillow)."""
from PIL import Image, ImageDraw
def icon(size, maskable=False):
    S=size*4; im=Image.new('RGBA',(S,S)); px=im.load()
    for y in range(S):
        for x in range(S):
            t=(x+y)/(2*S); px[x,y]=(int(12+30*t),int(10+8*t),int(40+70*t),255)
    if not maskable:
        m=Image.new('L',(S,S),0); ImageDraw.Draw(m).rounded_rectangle((0,0,S-1,S-1),radius=int(S*.22),fill=255); im.putalpha(m)
    d=ImageDraw.Draw(im); c=S/2; r=S*(.22 if maskable else .30); w=S*(.075 if maskable else .10)
    box=(c-r,c-r,c+r,c+r)
    d.ellipse((c-r-w/2,c-r-w/2,c+r+w/2,c+r+w/2),outline=(48,44,100,255),width=int(w))
    for a0,a1,col in [(-90,60,(53,224,255)),(64,170,(138,92,255)),(174,266,(61,255,176))]:
        d.arc((c-r,c-r,c+r,c+r),a0,a1,fill=col+(255,),width=int(w))
    d.ellipse((c-w*.45,c-w*.45,c+w*.45,c+w*.45),fill=(255,255,255,255))
    return im.resize((size,size),Image.LANCZOS)
for n,s,mk in [('icon-192',192,0),('icon-512',512,0),('icon-512-maskable',512,1),('apple-touch-icon',180,1),('favicon-32',32,0)]:
    icon(s,bool(mk)).save(f'assets/icons/{n}.png')
