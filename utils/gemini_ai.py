import cv2
import numpy as np
import time
from typing import Dict, Tuple
import random

class SithAIGenerator:
    """AI filter generation powered by the dark side of the Force"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.creation_count = 0
        self.sith_templates = self._load_sith_knowledge()
        
        print("🤖 Sith AI Generator awakened...")
        if not api_key or api_key == "your_gemini_api_key_here":
            print("⚠️ Using Sith fallback mode (no external AI)")
        else:
            print("✅ Connected to external AI through the Force")
    
    def _load_sith_knowledge(self):
        """Load ancient Sith knowledge for filter creation"""
        return {
            'dark_side_keywords': [
                'sith', 'dark', 'evil', 'red', 'black', 'shadow', 'nightmare',
                'demon', 'skull', 'death', 'hate', 'anger', 'power', 'darkness'
            ],
            'sith_colors': {
                'primary': (0, 0, 200),     # Dark red
                'secondary': (0, 0, 0),      # Black
                'accent': (0, 0, 255),       # Bright red
                'glow': (0, 50, 255),        # Red glow
                'energy': (100, 0, 255)      # Purple energy
            },
            'effect_patterns': [
                'jagged_edges', 'sharp_angles', 'menacing_glow',
                'battle_damage', 'evil_symbols', 'dark_aura'
            ]
        }
    
    def forge_dark_filter(self, prompt: str) -> Dict:
        """Forge a dark filter using Sith alchemy"""
        try:
            # Analyze prompt for dark side elements
            dark_analysis = self._analyze_with_sith_wisdom(prompt)
            
            # Create filter using Sith techniques
            filter_data = self._create_sith_filter(prompt, dark_analysis)
            
            filter_name = f"sith_creation_{int(time.time())}_{self.creation_count}"
            self.creation_count += 1
            
            config = self._generate_dark_config(prompt, dark_analysis)
            
            return {
                'status': 'success',
                'filter_name': filter_name,
                'filter_data': filter_data,
                'config': config,
                'dark_blessing': self._bestow_sith_blessing(prompt),
                'description': f"Sith creation forged from: {prompt}"
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'The dark side has failed: {str(e)}'
            }
    
    def _analyze_with_sith_wisdom(self, prompt: str) -> Dict:
        """Analyze prompt using ancient Sith wisdom"""
        prompt_lower = prompt.lower()
        
        # Determine darkness level
        darkness_score = 0
        for keyword in self.sith_templates['dark_side_keywords']:
            if keyword in prompt_lower:
                darkness_score += 1
        
        # Classify dark side archetype
        if any(word in prompt_lower for word in ['emperor', 'palpatine', 'lightning']):
            archetype = 'sith_emperor'
        elif any(word in prompt_lower for word in ['vader', 'mechanical', 'breathing']):
            archetype = 'dark_lord'
        elif any(word in prompt_lower for word in ['maul', 'tattoo', 'rage']):
            archetype = 'sith_assassin'
        elif any(word in prompt_lower for word in ['kylo', 'unstable', 'conflicted']):
            archetype = 'fallen_jedi'
        else:
            archetype = 'generic_sith'
        
        return {
            'darkness_level': min(10, darkness_score + 3),
            'archetype': archetype,
            'primary_color': self._choose_sith_colors(prompt_lower),
            'effects_needed': self._determine_dark_effects(prompt_lower),
            'power_level': random.randint(7, 10)
        }
    
    def _choose_sith_colors(self, prompt: str) -> Tuple[int, int, int]:
        """Choose appropriate Sith colors"""
        colors = self.sith_templates['sith_colors']
        
        if 'red' in prompt or 'blood' in prompt:
            return colors['accent']
        elif 'black' in prompt or 'shadow' in prompt:
            return colors['secondary']
        elif 'purple' in prompt or 'energy' in prompt:
            return colors['energy']
        else:
            return colors['primary']
    
    def _determine_dark_effects(self, prompt: str) -> list:
        """Determine what dark effects to apply"""
        effects = []
        
        if any(word in prompt for word in ['glow', 'energy', 'power']):
            effects.append('dark_glow')
        if any(word in prompt for word in ['lightning', 'electric', 'shock']):
            effects.append('force_lightning')
        if any(word in prompt for word in ['damage', 'battle', 'scar']):
            effects.append('battle_damage')
        if any(word in prompt for word in ['breathing', 'mechanical']):
            effects.append('breathing_apparatus')
        if any(word in prompt for word in ['tattoo', 'mark', 'symbol']):
            effects.append('sith_markings')
        
        return effects if effects else ['dark_glow']
    
    def _create_sith_filter(self, prompt: str, analysis: Dict) -> np.ndarray:
        """Create filter using Sith dark magic"""
        mask_size = (500, 600)  # Width, Height
        mask = np.zeros((mask_size[1], mask_size[0], 4), dtype=np.uint8)
        
        center_x, center_y = mask_size[0] // 2, mask_size[1] // 2
        archetype = analysis['archetype']
        color = analysis['primary_color']
        darkness = analysis['darkness_level']
        
        # Create base mask based on archetype
        if archetype == 'sith_emperor':
            self._forge_emperor_mask(mask, center_x, center_y, color, darkness)
        elif archetype == 'dark_lord':
            self._forge_dark_lord_mask(mask, center_x, center_y, color, darkness)
        elif archetype == 'sith_assassin':
            self._forge_assassin_mask(mask, center_x, center_y, color, darkness)
        elif archetype == 'fallen_jedi':
            self._forge_fallen_mask(mask, center_x, center_y, color, darkness)
        else:
            self._forge_generic_sith_mask(mask, center_x, center_y, color, darkness)
        
        # Apply dark effects
        for effect in analysis['effects_needed']:
            mask = self._apply_dark_effect(mask, effect, color)
        
        # Add Sith aura
        mask = self._infuse_sith_aura(mask, darkness)
        
        return mask
    
    def _forge_emperor_mask(self, mask, cx, cy, color, darkness):
        """Forge an Emperor-style mask"""
        # Dark hood
        cv2.ellipse(mask, (cx, cy - 80), (220, 180), 0, 0, 180, (20, 20, 20, 255), -1)
        
        # Pale, evil face
        cv2.ellipse(mask, (cx, cy), (140, 170), 0, 0, 360, (80, 70, 60, 200), -1)
        
        # Glowing Sith eyes
        cv2.circle(mask, (cx - 50, cy - 40), 12, color + (255,), -1)
        cv2.circle(mask, (cx + 50, cy - 40), 12, color + (255,), -1)
        
        # Evil wrinkles
        for i in range(5):
            y_offset = cy - 20 + i * 15
            cv2.line(mask, (cx - 60, y_offset), (cx + 60, y_offset), (40, 40, 40, 180), 2)
    
    def _forge_dark_lord_mask(self, mask, cx, cy, color, darkness):
        """Forge a Vader-style dark lord mask"""
        # Main helmet
        cv2.ellipse(mask, (cx, cy), (190, 240), 0, 0, 360, (15, 15, 15, 255), -1)
        
        # Face plate
        cv2.ellipse(mask, (cx, cy - 20), (160, 200), 0, 0, 360, (10, 10, 10, 255), -1)
        
        # Menacing red eye glow
        cv2.ellipse(mask, (cx - 70, cy - 70), (45, 55), 0, 0, 360, (0, 0, 0, 0), -1)
        cv2.ellipse(mask, (cx + 70, cy - 70), (45, 55), 0, 0, 360, (0, 0, 0, 0), -1)
        cv2.ellipse(mask, (cx - 70, cy - 70), (55, 65), 0, 0, 360, color + (200,), 5)
        cv2.ellipse(mask, (cx + 70, cy - 70), (55, 65), 0, 0, 360, color + (200,), 5)
    
    def _forge_assassin_mask(self, mask, cx, cy, color, darkness):
        """Forge a Maul-style assassin mask"""
        # Red and black skin
        cv2.ellipse(mask, (cx, cy), (150, 190), 0, 0, 360, (40, 40, 80, 220), -1)
        
        # Sith tattoo patterns
        for angle in range(0, 360, 30):
            rad = np.radians(angle)
            x1 = int(cx + 70 * np.cos(rad))
            y1 = int(cy + 70 * np.sin(rad))
            x2 = int(cx + 120 * np.cos(rad))
            y2 = int(cy + 120 * np.sin(rad))
            cv2.line(mask, (x1, y1), (x2, y2), color + (200,), 6)
        
        # Fierce yellow eyes
        cv2.circle(mask, (cx - 45, cy - 30), 15, (0, 255, 255, 255), -1)
        cv2.circle(mask, (cx + 45, cy - 30), 15, (0, 255, 255, 255), -1)
    
    def _forge_fallen_mask(self, mask, cx, cy, color, darkness):
        """Forge a fallen Jedi mask"""
        # Cracked, unstable mask
        cv2.ellipse(mask, (cx, cy), (170, 210), 0, 0, 360, (30, 30, 30, 240), -1)
        
        # Crack patterns
        crack_points = [(cx - 80, cy - 120), (cx + 90, cy - 30), (cx - 60, cy + 80)]
        for i in range(len(crack_points) - 1):
            cv2.line(mask, crack_points[i], crack_points[i + 1], (60, 60, 60, 255), 4)
        
        # Unstable red energy seeping through cracks
        cv2.line(mask, crack_points[0], crack_points[1], color + (150,), 2)
        cv2.line(mask, crack_points[1], crack_points[2], color + (150,), 2)
    
    def _forge_generic_sith_mask(self, mask, cx, cy, color, darkness):
        """Forge a generic Sith mask"""
        # Basic evil mask
        cv2.ellipse(mask, (cx, cy), (160, 200), 0, 0, 360, (25, 25, 25, 255), -1)
        
        # Glowing red eyes
        cv2.circle(mask, (cx - 50, cy - 40), 15, color + (255,), -1)
        cv2.circle(mask, (cx + 50, cy - 40), 15, color + (255,), -1)
        
        # Evil mouth
        cv2.ellipse(mask, (cx, cy + 60), (40, 20), 0, 0, 180, (10, 10, 10, 255), -1)
    
    def _apply_dark_effect(self, mask, effect, color):
        """Apply specific dark side effects"""
        if effect == 'dark_glow':
            glow_mask = cv2.dilate(mask[:, :, 3], np.ones((20, 20), np.uint8))
            glow_mask = cv2.GaussianBlur(glow_mask, (25, 25), 0)
            mask[:, :, 2] = np.maximum(mask[:, :, 2], glow_mask // 3)  # Red channel
        
        elif effect == 'force_lightning':
            h, w = mask.shape[:2]
            for _ in range(5):
                x1, y1 = random.randint(0, w), random.randint(0, h)
                x2, y2 = random.randint(0, w), random.randint(0, h)
                cv2.line(mask, (x1, y1), (x2, y2), (255, 255, 0, 180), 3)
        
        return mask
    
    def _infuse_sith_aura(self, mask, darkness_level):
        """Infuse the mask with Sith aura energy"""
        aura_intensity = darkness_level * 25
        
        # Create pulsing red aura
        aura = cv2.dilate(mask[:, :, 3], np.ones((30, 30), np.uint8))
        aura = cv2.GaussianBlur(aura, (31, 31), 0)
        
        # Add to red channel for Sith energy
        mask[:, :, 2] = np.minimum(255, mask[:, :, 2] + aura_intensity)
        
        return mask
    
    def _generate_dark_config(self, prompt: str, analysis: Dict) -> Dict:
        """Generate configuration infused with dark side parameters"""
        base_config = {
            'scale_factor': 1.3,
            'anchor_points': ['sith_power_point', 'dark_aura_center'],
            'offset_x': 0,
            'offset_y': -0.1,
            'rotation_enabled': True,
            'opacity': 0.9,
            'dark_power': True
        }
        
        # Adjust based on archetype
        archetype = analysis['archetype']
        if archetype == 'sith_emperor':
            base_config.update({
                'scale_factor': 1.2,
                'lightning_effects': True,
                'evil_aura': True
            })
        elif archetype == 'dark_lord':
            base_config.update({
                'scale_factor': 1.4,
                'breathing_effect': True,
                'mechanical_sounds': True
            })
        
        return base_config
    
    def _bestow_sith_blessing(self, prompt: str) -> str:
        """Bestow a Sith blessing upon the creation"""
        blessings = [
            "The dark side has blessed your creation with unlimited power!",
            "Your filter radiates with the fury of a thousand Sith Lords!",
            "The Emperor himself would approve of this dark masterpiece!",
            "Feel the hate flow through your filtered visage!",
            "This creation shall serve the Empire well!",
            "The Force is strong with this dark filter!",
            "Your journey to the dark side is nearly complete!"
        ]
        return random.choice(blessings)
