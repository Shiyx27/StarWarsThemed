import cv2, numpy as np

class FilterManager:
    def __init__(self):
        self.builtins = {
            "vader"  : self._vader,
            "sith"   : self._sith,
            "jedi"   : self._jedi,
            "helmet" : self._stormtrooper
        }
        self.custom = {}  # name -> BGRA image

    def add_custom_filter(self, name, data): self.custom[name]=data

    # --- public ------------------------------------------------------------
    def apply_filter(self, frame, faces, name):
        if name in self.builtins:
            return self.builtins[name](frame, faces)
        if name in self.custom:
            return self._custom(frame, faces, self.custom[name])
        return frame

    # --- built-in filters ---------------------------------------------------
    def _vader(self, frame, faces):
        for (x,y,w,h) in faces:
            cv2.rectangle(frame,(x,y+h//3),(x+w,y+h),(0,0,0),-1)
            eyes_y = y+h//3+10
            for ex in (x+w//4, x+3*w//4):
                cv2.circle(frame,(ex,eyes_y),10,(0,0,255),-1)
        return frame

    def _sith(self, f, faces):
        overlay = np.full_like(f,(0,0,100))
        f[:] = cv2.addWeighted(f,0.8,overlay,0.2,0)
        for (x,y,w,h) in faces:
            ey = y+h//3; cv2.circle(f,(x+w//3,ey),12,(0,0,255),-1)
            cv2.circle(f,(x+2*w//3,ey),12,(0,0,255),-1)
        return f

    def _jedi(self, f, faces):
        overlay=np.full_like(f,(100,50,0))
        f[:] = cv2.addWeighted(f,0.8,overlay,0.2,0)
        for (x,y,w,h) in faces:
            cv2.ellipse(f,(x+w//2,y+h//2),(w//2+12,h//2+12),0,0,360,(255,200,100),3)
        return f

    def _stormtrooper(self, f, faces):
        for (x,y,w,h) in faces:
            mask=f.copy()
            cv2.ellipse(mask,(x+w//2,y+h//2),(w//2,h//2),0,0,360,(255,255,255),-1)
            f[:] = cv2.addWeighted(f,0.6,mask,0.4,0)
        return f

    # --- custom Gemini PNG --------------------------------------------------
    def _custom(self, frame, faces, overlay):
        for (x,y,w,h) in faces:
            png = cv2.resize(overlay,(w,h))
            if png.shape[2]==4:
                alpha = png[:,:,3]/255.0
                for c in range(3):
                    frame[y:y+h,x:x+w,c] = (alpha*png[:,:,c] +
                                            (1-alpha)*frame[y:y+h,x:x+w,c])
        return frame
