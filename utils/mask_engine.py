import cv2
import numpy as np
import os
from PIL import Image
import time

class SithMaskEngine:
    """Advanced mask engine powered by Sith alchemy"""
    
    def __init__(self):
        print("🎭 Awakening the Sith Mask Forge...")
        self.masks_dir = "static/images/masks"
        self.mask_cache = {}
        self.sith_creations = {}
        
        os.makedirs(self.masks_dir, exist_ok=True)
        
        # Sith mask configurations with dark enhancements
        self.dark_configs = {
            'vader': {
                'mask_file': 'vader_mask.png',
                'scale_factor': 1.4,
                'anchor_points': ['nose_tip_center', 'mouth_center'],
                'offset_x': 0,
                'offset_y': -0.1,
                'dark_power': True,
                'breathing_effect': True,
                'red_glow': True,
                'sith_aura': 'mechanical'
            },
            'emperor': {
                'mask_file': 'emperor_mask.png',
                'scale_factor': 1.2,
                'anchor_points': ['forehead_center', 'chin_center'],
                'offset_x': 0,
                'offset_y': -0.05,
                'dark_power': True,
                'lightning_eyes': True,
                'sith_aura': 'force_lightning'
            },
            'kylo': {
                'mask_file': 'kylo_mask.png',
                'scale_factor': 1.3,
                'anchor_points': ['nose_tip_center'],
                'offset_x': 0,
                'offset_y': -0.08,
                'dark_power': True,
                'unstable_energy': True,
                'sith_aura': 'conflicted'
            },
            'maul': {
                'mask_file': 'maul_mask.png',
                'scale_factor': 1.25,
                'anchor_points': ['forehead_center', 'chin_center'],
                'offset_x': 0,
                'offset_y': 0,
                'dark_power': True,
                'red_tattoos': True,
                'sith_aura': 'rage'
            },
            'sith': {
                'mask_file': 'sith_mask.png',
                'scale_factor': 1.2,
                'anchor_points': ['sith_power_point'],
                'offset_x': 0,
                'offset_y': 0,
                'dark_power': True,
                'red_eyes': True,
                'sith_aura': 'pure_evil'
            }
        }
        
        self._forge_dark_masks()
        print("✅ Sith Mask Forge operational")
    
    def _forge_dark_masks(self):
        """Forge the dark side masks using Sith alchemy"""
        for mask_name, config in self.dark_configs.items():
            mask_path = os.path.join(self.masks_dir, config['mask_file'])
            if not os.path.exists(mask_path):
                self._create_sith_mask(mask_name, mask_path, config)
    
    def _create_sith_mask(self, mask_name, mask_path, config):
        """Create a Sith mask using dark side powers"""
        mask = np.zeros((600, 500, 4), dtype=np.uint8)
        center_x, center_y = 250, 300
        
        if mask_name == 'vader':
            # Darth Vader's iconic mask
            cv2.ellipse(mask, (center_x, center_y), (180, 230), 0, 0, 360, (10, 10, 10, 255), -1)
            cv2.ellipse(mask, (center_x, center_y - 30), (150, 190), 0, 0, 360, (5, 5, 5, 255), -1)
            
            # Glowing red eyes
            cv2.ellipse(mask, (center_x - 70, center_y - 80), (40, 50), 0, 0, 360, (0, 0, 0, 0), -1)
            cv2.ellipse(mask, (center_x + 70, center_y - 80), (40, 50), 0, 0, 360, (0, 0, 0, 0), -1)
            cv2.ellipse(mask, (center_x - 70, center_y - 80), (50, 60), 0, 0, 360, (0, 0, 255, 150), 5)
            cv2.ellipse(mask, (center_x + 70, center_y - 80), (50, 60), 0, 0, 360, (0, 0, 255, 150), 5)
            
            # Breathing apparatus
            cv2.rectangle(mask, (center_x - 60, center_y + 100), (center_x + 60, center_y + 180), (20, 20, 20, 255), -1)
            for i in range(8):
                y_pos = center_y + 110 + i * 8
                cv2.line(mask, (center_x - 50, y_pos), (center_x + 50, y_pos), (80, 40, 40, 255), 3)
        
        elif mask_name == 'emperor':
            # Emperor Palpatine's hood and evil features
            cv2.ellipse(mask, (center_x, center_y - 50), (200, 150), 0, 0, 180, (40, 40, 40, 200), -1)
            cv2.ellipse(mask, (center_x, center_y), (120, 150), 0, 0, 360, (60, 50, 45, 180), -1)
            
            # Evil glowing eyes
            cv2.circle(mask, (center_x - 40, center_y - 30), 8, (100, 100, 255, 255), -1)
            cv2.circle(mask, (center_x + 40, center_y - 30), 8, (100, 100, 255, 255), -1)
            cv2.circle(mask, (center_x - 40, center_y - 30), 15, (50, 50, 255, 100), 3)
            cv2.circle(mask, (center_x + 40, center_y - 30), 15, (50, 50, 255, 100), 3)
            
            # Evil grin
            cv2.ellipse(mask, (center_x, center_y + 40), (30, 15), 0, 0, 180, (20, 20, 20, 255), -1)
        
        elif mask_name == 'kylo':
            # Kylo Ren's unstable mask
            cv2.ellipse(mask, (center_x, center_y), (160, 200), 0, 0, 360, (25, 25, 25, 255), -1)
            
            # Cracked visor effect
            cv2.line(mask, (center_x - 80, center_y - 100), (center_x + 80, center_y - 20), (50, 50, 50, 255), 3)
            cv2.line(mask, (center_x - 60, center_y - 60), (center_x + 90, center_y - 80), (50, 50, 50, 255), 2)
            
            # Eye slits with red glow
            cv2.ellipse(mask, (center_x - 50, center_y - 50), (25, 8), 0, 0, 360, (0, 0, 0, 0), -1)
            cv2.ellipse(mask, (center_x + 50, center_y - 50), (25, 8), 0, 0, 360, (0, 0, 0, 0), -1)
            cv2.ellipse(mask, (center_x - 50, center_y - 50), (30, 12), 0, 0, 360, (0, 0, 200, 120), 2)
            cv2.ellipse(mask, (center_x + 50, center_y - 50), (30, 12), 0, 0, 360, (0, 0, 200, 120), 2)
        
        elif mask_name == 'maul':
            # Darth Maul's Zabrak features and tattoos
            cv2.ellipse(mask, (center_x, center_y), (140, 180), 0, 0, 360, (80, 40, 40, 200), -1)
            
            # Red and black tattoo pattern
            for i in range(0, 360, 45):
                angle = np.radians(i)
                x1 = int(center_x + 60 * np.cos(angle))
                y1 = int(center_y + 60 * np.sin(angle))
                x2 = int(center_x + 100 * np.cos(angle))
                y2 = int(center_y + 100 * np.sin(angle))
                cv2.line(mask, (x1, y1), (x2, y2), (0, 0, 150, 200), 5)
            
            # Piercing yellow eyes
            cv2.circle(mask, (center_x - 40, center_y - 30), 10, (0, 255, 255, 255), -1)
            cv2.circle(mask, (center_x + 40, center_y - 30), 10, (0, 255, 255, 255), -1)
        
        else:  # Generic Sith mask
            cv2.ellipse(mask, (center_x, center_y), (140, 180), 0, 0, 360, (30, 30, 30, 255), -1)
            cv2.circle(mask, (center_x - 40, center_y - 30), 8, (0, 0, 255, 255), -1)
            cv2.circle(mask, (center_x + 40, center_y - 30), 8, (0, 0, 255, 255), -1)
        
        # Add dark aura glow
        glow_mask = cv2.dilate(mask[:, :, 3], np.ones((15, 15), np.uint8), iterations=1)
        glow_mask = cv2.GaussianBlur(glow_mask, (21, 21), 0)
        
        # Apply red glow for Sith energy
        glow = np.zeros_like(mask)
        glow[:, :, 0] = 0    # Blue
        glow[:, :, 1] = 0    # Green  
        glow[:, :, 2] = 255  # Red
        glow[:, :, 3] = glow_mask // 4
        
        # Combine mask with dark glow
        final_mask = np.zeros_like(mask)
        alpha_glow = glow[:, :, 3:4] / 255.0
        alpha_mask = mask[:, :, 3:4] / 255.0
        
        final_mask[:, :, :3] = (1 - alpha_mask) * alpha_glow * glow[:, :, :3] + alpha_mask * mask[:, :, :3]
        final_mask[:, :, 3] = np.maximum(glow[:, :, 3], mask[:, :, 3])
        
        cv2.imwrite(mask_path, final_mask.astype(np.uint8))
        print(f"🎭 Forged Sith mask: {mask_name}")
    
    def apply_sith_mask(self, frame, face_data_list, filter_name):
        """Apply Sith mask with dark side enhancements"""
        if not face_data_list:
            return frame
        
        if filter_name in self.dark_configs:
            config = self.dark_configs[filter_name]
            mask = self._load_dark_mask(config['mask_file'])
        elif filter_name in self.sith_creations:
            config = self.sith_creations[filter_name]['config']
            mask = self.sith_creations[filter_name]['mask']
        else:
            return frame
        
        if mask is None:
            return frame
        
        for face_data in face_data_list:
            frame = self._apply_dark_transformation(frame, face_data, mask, config)
        
        return frame
    
    def _load_dark_mask(self, mask_file):
        """Load mask with dark side caching"""
        if mask_file in self.mask_cache:
            return self.mask_cache[mask_file]
        
        mask_path = os.path.join(self.masks_dir, mask_file)
        if not os.path.exists(mask_path):
            return None
        
        try:
            pil_image = Image.open(mask_path).convert("RGBA")
            mask = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGBA2BGRA)
            self.mask_cache[mask_file] = mask
            return mask
        except Exception as e:
            print(f"Dark side mask loading failed: {e}")
            return None
    
    def _apply_dark_transformation(self, frame, face_data, mask, config):
        """Apply mask with Sith dark side effects"""
        bbox = face_data['bbox']
        x, y, w, h = bbox
        
        # Scale mask to face with dark energy
        scale = w * config['scale_factor'] / mask.shape[1]
        new_w = int(mask.shape[1] * scale)
        new_h = int(mask.shape[0] * scale)
        
        if new_w <= 0 or new_h <= 0:
            return frame
        
        scaled_mask = cv2.resize(mask, (new_w, new_h))
        
        # Calculate position with dark side precision
        pos_x = x + int(w * config.get('offset_x', 0)) - new_w // 2 + w // 2
        pos_y = y + int(h * config.get('offset_y', 0)) - new_h // 2 + h // 2
        
        # Apply mask with Sith blending
        frame = self._dark_side_blend(frame, scaled_mask, pos_x, pos_y)
        
        # Add Sith-specific effects
        if config.get('red_glow'):
            frame = self._add_sith_glow(frame, x, y, w, h)
        
        if config.get('breathing_effect'):
            frame = self._add_breathing_effect(frame, x, y, w, h)
        
        return frame
    
    def _dark_side_blend(self, frame, mask, x, y):
        """Blend mask using dark side alchemy"""
        h, w = frame.shape[:2]
        mask_h, mask_w = mask.shape[:2]
        
        # Calculate bounds
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(w, x + mask_w)
        y2 = min(h, y + mask_h)
        
        mask_x1 = max(0, -x)
        mask_y1 = max(0, -y)
        mask_x2 = mask_x1 + (x2 - x1)
        mask_y2 = mask_y1 + (y2 - y1)
        
        if x2 <= x1 or y2 <= y1:
            return frame
        
        # Dark side alpha blending
        frame_region = frame[y1:y2, x1:x2]
        mask_region = mask[mask_y1:mask_y2, mask_x1:mask_x2]
        
        if mask_region.shape[2] == 4:
            alpha = mask_region[:, :, 3] / 255.0
            alpha = alpha[:, :, np.newaxis]
            
            # Enhanced blending for dark effects
            blended = alpha * mask_region[:, :, :3] + (1 - alpha) * frame_region
            frame[y1:y2, x1:x2] = blended.astype(np.uint8)
        
        return frame
    
    def _add_sith_glow(self, frame, x, y, w, h):
        """Add red Sith glow effect"""
        overlay = frame.copy()
        cv2.ellipse(overlay, (x + w//2, y + h//2), (w//2 + 20, h//2 + 20), 
                   0, 0, 360, (0, 0, 255), -1)
        return cv2.addWeighted(frame, 0.9, overlay, 0.1, 0)
    
    def _add_breathing_effect(self, frame, x, y, w, h):
        """Add Vader-style breathing effect"""
        breathing_intensity = abs(np.sin(time.time() * 2)) * 0.3 + 0.7
        face_region = frame[y:y+h, x:x+w]
        darkened = (face_region * breathing_intensity).astype(np.uint8)
        frame[y:y+h, x:x+w] = darkened
        return frame
    
    def add_sith_creation(self, name, mask_data, config):
        """Add a custom Sith creation to the arsenal"""
        self.sith_creations[name] = {
            'mask': mask_data,
            'config': config
        }
        print(f"🌑 New Sith creation added: {name}")
