import cv2
import numpy as np
import time
import random
from typing import Dict, List

class DarkSideEffects:
    """Special effects engine channeling the power of the dark side"""
    
    def __init__(self):
        print("⚡ Channeling the dark side of the Force...")
        self.last_lightning = time.time()
        self.sith_particles = []
        self.easter_egg_count = 0
        self.dark_energy_level = 100
        
        # Sith effect configurations
        self.dark_effects = {
            'vader': {
                'breathing_frequency': 2.0,
                'red_glow': True,
                'mechanical_sounds': True,
                'imperial_march': True
            },
            'emperor': {
                'force_lightning': True,
                'evil_cackle': True,
                'unlimited_power': True,
                'dark_side_corruption': True
            },
            'kylo': {
                'unstable_energy': True,
                'conflicted_aura': True,
                'lightsaber_crackle': True,
                'rage_mode': True
            },
            'maul': {
                'sith_tattoos': True,
                'rage_aura': True,
                'double_blade': True,
                'zabrak_fury': True
            },
            'sith': {
                'red_eyes': True,
                'dark_aura': True,
                'evil_presence': True,
                'sith_code': True
            }
        }
        
        print("✅ Dark side effects engine operational")
    
    def channel_dark_force(self, frame, filter_name, face_data):
        """Channel dark side effects based on the active filter"""
        if not face_data or filter_name not in self.dark_effects:
            return frame
        
        effects_config = self.dark_effects[filter_name]
        
        # Apply filter-specific dark effects
        if filter_name == 'vader':
            frame = self._vader_dark_effects(frame, face_data, effects_config)
        elif filter_name == 'emperor':
            frame = self._emperor_dark_effects(frame, face_data, effects_config)
        elif filter_name == 'kylo':
            frame = self._kylo_dark_effects(frame, face_data, effects_config)
        elif filter_name == 'maul':
            frame = self._maul_dark_effects(frame, face_data, effects_config)
        elif filter_name == 'sith':
            frame = self._generic_sith_effects(frame, face_data, effects_config)
        
        # Add ambient dark side effects
        frame = self._add_dark_ambient_effects(frame)
        
        return frame
    
    def _vader_dark_effects(self, frame, face_data, config):
        """Apply Darth Vader specific dark effects"""
        for face in face_data:
            x, y, w, h = face['bbox']
            
            # Breathing effect with mechanical darkness
            if config.get('breathing_frequency'):
                breath_cycle = np.sin(time.time() * config['breathing_frequency'])
                if breath_cycle < -0.5:
                    # Create mechanical breathing overlay
                    breathing_overlay = frame.copy()
                    cv2.rectangle(breathing_overlay, (x, y + 2*h//3), (x + w, y + h), (30, 30, 30), -1)
                    frame = cv2.addWeighted(frame, 0.8, breathing_overlay, 0.2, 0)
            
            # Red helmet glow
            if config.get('red_glow'):
                frame = self._add_vader_glow(frame, x, y, w, h)
            
            # Imperial presence
            frame = self._add_imperial_aura(frame, x, y, w, h)
        
        return frame
    
    def _emperor_dark_effects(self, frame, face_data, config):
        """Apply Emperor Palpatine dark effects"""
        for face in face_data:
            x, y, w, h = face['bbox']
            
            # Force lightning bursts
            if config.get('force_lightning') and random.random() < 0.1:
                frame = self._unleash_force_lightning(frame, x, y, w, h)
            
            # Dark side corruption aura
            if config.get('dark_side_corruption'):
                frame = self._add_corruption_aura(frame, x, y, w, h)
            
            # Unlimited power effect
            if config.get('unlimited_power'):
                frame = self._add_unlimited_power_effect(frame, x, y, w, h)
        
        return frame
    
    def _kylo_dark_effects(self, frame, face_data, config):
        """Apply Kylo Ren conflicted dark effects"""
        for face in face_data:
            x, y, w, h = face['bbox']
            
            # Unstable energy around mask
            if config.get('unstable_energy'):
                frame = self._add_unstable_energy(frame, x, y, w, h)
            
            # Conflicted aura (red and blue mixing)
            if config.get('conflicted_aura'):
                frame = self._add_conflicted_aura(frame, x, y, w, h)
            
            # Rage mode effect
            if config.get('rage_mode') and random.random() < 0.05:
                frame = self._trigger_rage_mode(frame, x, y, w, h)
        
        return frame
    
    def _maul_dark_effects(self, frame, face_data, config):
        """Apply Darth Maul Zabrak effects"""
        for face in face_data:
            x, y, w, h = face['bbox']
            
            # Sith tattoo glow
            if config.get('sith_tattoos'):
                frame = self._enhance_sith_tattoos(frame, x, y, w, h)
            
            # Zabrak fury aura
            if config.get('zabrak_fury'):
                frame = self._add_zabrak_fury(frame, x, y, w, h)
            
            # Rage aura
            frame = self._add_primal_rage_aura(frame, x, y, w, h)
        
        return frame
    
    def _generic_sith_effects(self, frame, face_data, config):
        """Apply generic Sith dark side effects"""
        for face in face_data:
            x, y, w, h = face['bbox']
            
            # Red glowing eyes
            if config.get('red_eyes'):
                frame = self._add_sith_eyes(frame, x, y, w, h)
            
            # Dark aura
            if config.get('dark_aura'):
                frame = self._add_dark_sith_aura(frame, x, y, w, h)
            
            # Evil presence effect
            frame = self._manifest_evil_presence(frame, x, y, w, h)
        
        return frame
    
    def _add_vader_glow(self, frame, x, y, w, h):
        """Add Vader's iconic red glow"""
        overlay = frame.copy()
        
        # Create red glow around helmet area
        cv2.ellipse(overlay, (x + w//2, y + h//3), (w//2 + 15, h//3 + 10), 
                   0, 0, 360, (0, 0, 100), -1)
        
        # Eye glow
        eye_left = (x + w//3, y + h//3)
        eye_right = (x + 2*w//3, y + h//3)
        cv2.circle(overlay, eye_left, 15, (0, 0, 200), -1)
        cv2.circle(overlay, eye_right, 15, (0, 0, 200), -1)
        
        return cv2.addWeighted(frame, 0.85, overlay, 0.15, 0)
    
    def _unleash_force_lightning(self, frame, x, y, w, h):
        """Unleash Emperor's force lightning"""
        h_frame, w_frame = frame.shape[:2]
        
        # Generate multiple lightning bolts from hands/face
        for _ in range(random.randint(3, 7)):
            # Start point (face area)
            start_x = x + random.randint(0, w)
            start_y = y + random.randint(h//2, h)
            
            # Generate jagged lightning path
            points = [(start_x, start_y)]
            current_x, current_y = start_x, start_y
            
            for step in range(random.randint(8, 15)):
                current_x += random.randint(-40, 40)
                current_y += random.randint(-30, 30)
                current_x = max(0, min(w_frame, current_x))
                current_y = max(0, min(h_frame, current_y))
                points.append((current_x, current_y))
            
            # Draw lightning with multiple layers
            for i in range(len(points) - 1):
                # Main lightning bolt
                cv2.line(frame, points[i], points[i+1], (255, 255, 100), 4)
                # Inner core
                cv2.line(frame, points[i], points[i+1], (255, 255, 255), 2)
                # Outer glow
                cv2.line(frame, points[i], points[i+1], (100, 100, 255), 1)
        
        return frame
    
    def _add_unstable_energy(self, frame, x, y, w, h):
        """Add Kylo Ren's unstable energy effects"""
        overlay = frame.copy()
        
        # Create flickering unstable energy
        flicker_intensity = random.uniform(0.3, 0.8)
        
        # Red unstable energy around mask edges
        for angle in range(0, 360, 30):
            rad = np.radians(angle)
            glow_x = int(x + w//2 + (w//2 + 20) * np.cos(rad))
            glow_y = int(y + h//2 + (h//2 + 20) * np.sin(rad))
            
            if 0 <= glow_x < frame.shape[1] and 0 <= glow_y < frame.shape[0]:
                cv2.circle(overlay, (glow_x, glow_y), 8, (0, 0, int(255 * flicker_intensity)), -1)
        
        return cv2.addWeighted(frame, 0.9, overlay, 0.1, 0)
    
    def _add_conflicted_aura(self, frame, x, y, w, h):
        """Add conflicted light/dark aura for Kylo Ren"""
        overlay = frame.copy()
        
        # Create dual-colored aura (red and blue conflicting)
        time_offset = time.time() * 3
        red_intensity = (np.sin(time_offset) + 1) / 2
        blue_intensity = (np.cos(time_offset) + 1) / 2
        
        # Red (dark side)
        cv2.ellipse(overlay, (x + w//2, y + h//2), (w//2 + 25, h//2 + 25), 
                   0, 0, 180, (0, 0, int(150 * red_intensity)), -1)
        
        # Blue (light side remnant)
        cv2.ellipse(overlay, (x + w//2, y + h//2), (w//2 + 25, h//2 + 25), 
                   0, 180, 360, (int(150 * blue_intensity), 0, 0), -1)
        
        return cv2.addWeighted(frame, 0.9, overlay, 0.1, 0)
    
    def _enhance_sith_tattoos(self, frame, x, y, w, h):
        """Enhance Darth Maul's Sith tattoos with glow"""
        overlay = frame.copy()
        
        # Create glowing red tattoo patterns
        center_x, center_y = x + w//2, y + h//2
        
        # Radial tattoo pattern
        for angle in range(0, 360, 45):
            rad = np.radians(angle)
            x1 = int(center_x + (w//4) * np.cos(rad))
            y1 = int(center_y + (h//4) * np.sin(rad))
            x2 = int(center_x + (w//2) * np.cos(rad))
            y2 = int(center_y + (h//2) * np.sin(rad))
            
            cv2.line(overlay, (x1, y1), (x2, y2), (0, 0, 200), 4)
            cv2.line(overlay, (x1, y1), (x2, y2), (0, 50, 255), 2)
        
        return cv2.addWeighted(frame, 0.8, overlay, 0.2, 0)
    
    def _add_sith_eyes(self, frame, x, y, w, h):
        """Add glowing Sith eyes"""
        overlay = frame.copy()
        
        # Calculate eye positions
        left_eye = (x + w//3, y + h//3)
        right_eye = (x + 2*w//3, y + h//3)
        
        # Pulsing red glow
        pulse = (np.sin(time.time() * 4) + 1) / 2
        intensity = int(200 * pulse + 55)
        
        # Draw glowing eyes
        cv2.circle(overlay, left_eye, 12, (0, 0, intensity), -1)
        cv2.circle(overlay, right_eye, 12, (0, 0, intensity), -1)
        cv2.circle(overlay, left_eye, 18, (0, 0, intensity//2), 3)
        cv2.circle(overlay, right_eye, 18, (0, 0, intensity//2), 3)
        
        return cv2.addWeighted(frame, 0.9, overlay, 0.1, 0)
    
    def _add_dark_ambient_effects(self, frame):
        """Add ambient dark side effects to the entire frame"""
        # Subtle red tint for dark side presence
        if random.random() < 0.05:  # 5% chance per frame
            red_tint = np.zeros_like(frame)
            red_tint[:, :, 2] = 30  # Red channel
            frame = cv2.addWeighted(frame, 0.95, red_tint, 0.05, 0)
        
        # Occasional dark energy pulses
        if random.random() < 0.02:  # 2% chance per frame
            frame = self._add_dark_energy_pulse(frame)
        
        return frame
    
    def _add_dark_energy_pulse(self, frame):
        """Add a dark energy pulse effect"""
        h, w = frame.shape[:2]
        overlay = frame.copy()
        
        # Create expanding dark ring
        center = (w//2, h//2)
        pulse_time = time.time() * 2
        radius = int(50 + 100 * (np.sin(pulse_time) + 1) / 2)
        
        cv2.circle(overlay, center, radius, (0, 0, 100), 3)
        cv2.circle(overlay, center, radius + 10, (0, 0, 50), 2)
        
        return cv2.addWeighted(frame, 0.95, overlay, 0.05, 0)
    
    def add_sith_easter_egg(self, frame):
        """Add hidden Sith easter eggs"""
        self.easter_egg_count += 1
        h, w = frame.shape[:2]
        
        easter_eggs = [
            self._draw_sith_symbol,
            self._flash_sith_code,
            self._show_death_star,
            self._display_sith_motto
        ]
        
        # Choose random easter egg
        easter_egg = random.choice(easter_eggs)
        return easter_egg(frame)
    
    def _draw_sith_symbol(self, frame):
        """Draw the Sith Empire symbol"""
        h, w = frame.shape[:2]
        
        # Draw in top right corner
        center = (w - 100, 100)
        
        # Simple Sith symbol (triangle with extensions)
        pts = np.array([
            [center[0], center[1] - 30],
            [center[0] - 25, center[1] + 20],
            [center[0] + 25, center[1] + 20]
        ], np.int32)
        
        cv2.fillPoly(frame, [pts], (0, 0, 200))
        cv2.polylines(frame, [pts], True, (0, 0, 255), 2)
        
        # Add text
        cv2.putText(frame, "SITH", (center[0] - 25, center[1] + 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        return frame
    
    def _flash_sith_code(self, frame):
        """Flash parts of the Sith Code"""
        h, w = frame.shape[:2]
        
        sith_lines = [
            "Peace is a lie",
            "There is only passion",
            "Through passion, I gain strength",
            "Through strength, I gain power",
            "Through power, I gain victory",
            "Through victory, my chains are broken",
            "The Force shall free me"
        ]
        
        line = random.choice(sith_lines)
        
        # Display in red text
        cv2.putText(frame, line, (50, h - 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        return frame
    
    def _show_death_star(self, frame):
        """Show Death Star in background"""
        h, w = frame.shape[:2]
        
        # Draw Death Star in top left
        center = (120, 120)
        radius = 60
        
        # Main sphere
        cv2.circle(frame, center, radius, (100, 100, 100), -1)
        
        # Death Star superlaser dish
        cv2.circle(frame, (center[0] - 20, center[1] - 20), 15, (80, 80, 80), -1)
        cv2.circle(frame, (center[0] - 20, center[1] - 20), 8, (60, 60, 60), -1)
        
        # Add menacing glow
        cv2.circle(frame, center, radius + 10, (0, 0, 100), 2)
        
        return frame
    
    def _display_sith_motto(self, frame):
        """Display a Sith motto or quote"""
        h, w = frame.shape[:2]
        
        mottos = [
            "UNLIMITED POWER!",
            "Let the hate flow...",
            "The dark side is strong",
            "Fear leads to anger",
            "Good... good...",
            "Strike me down!",
            "Your lack of faith..."
        ]
        
        motto = random.choice(mottos)
        
        # Display with dark styling
        cv2.putText(frame, motto, (w//2 - 150, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
        cv2.putText(frame, motto, (w//2 - 150, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 1)
        
        return frame
