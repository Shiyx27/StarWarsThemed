import time
import threading
from typing import Dict
import numpy as np

class PerformanceOptimizer:
    """Performance optimization powered by Sith efficiency"""
    
    def __init__(self):
        print("⚡ Initiating Sith performance protocols...")
        self.target_fps = 30
        self.current_fps = 0
        self.frame_times = []
        self.max_samples = 30
        
        # Sith efficiency metrics
        self.dark_power_level = 1.0
        self.force_efficiency = 1.0
        self.frame_skip_ratio = 1
        self.skip_counter = 0
        
        # Performance monitoring
        self.last_optimization = time.time()
        
        print("✅ Sith performance optimizer ready")
    
    def should_skip_frame(self, frame_count: int) -> bool:
        """Determine if frame should be skipped using Sith wisdom"""
        self.skip_counter += 1
        
        if self.frame_skip_ratio > 1:
            return (self.skip_counter % self.frame_skip_ratio) != 0
        
        return False
    
    def start_frame_timing(self) -> float:
        """Begin timing with dark side precision"""
        return time.time()
    
    def end_frame_timing(self, start_time: float):
        """Complete timing and update Sith metrics"""
        frame_time = time.time() - start_time
        
        # Update frame times with Sith efficiency
        self.frame_times.append(frame_time)
        if len(self.frame_times) > self.max_samples:
            self.frame_times.pop(0)
        
        # Calculate FPS using the Force
        if self.frame_times:
            avg_frame_time = np.mean(self.frame_times)
            self.current_fps = 1.0 / avg_frame_time if avg_frame_time > 0 else 0
        
        # Adaptive Sith optimization
        self._optimize_with_dark_side()
    
    def _optimize_with_dark_side(self):
        """Optimize performance using Sith techniques"""
        current_time = time.time()
        
        # Only optimize every 2 seconds
        if current_time - self.last_optimization < 2.0:
            return
        
        self.last_optimization = current_time
        
        # Adjust dark power based on performance
        if self.current_fps < 20:
            # Channel more dark side power for performance
            self.dark_power_level = max(0.5, self.dark_power_level - 0.1)
            self.frame_skip_ratio = min(3, self.frame_skip_ratio + 1)
        elif self.current_fps > 25:
            # Restore full Sith power
            self.dark_power_level = min(1.0, self.dark_power_level + 0.05)
            self.frame_skip_ratio = max(1, self.frame_skip_ratio - 1)
        
        # Update force efficiency
        self.force_efficiency = self.current_fps / self.target_fps
    
    def get_dark_stats(self) -> Dict:
        """Get performance statistics infused with Sith data"""
        return {
            'fps': round(self.current_fps, 2),
            'target_fps': self.target_fps,
            'dark_power_level': round(self.dark_power_level, 2),
            'force_efficiency': round(self.force_efficiency, 2),
            'frame_skip_ratio': self.frame_skip_ratio,
            'avg_frame_time_ms': round(np.mean(self.frame_times) * 1000, 2) if self.frame_times else 0,
            'sith_optimization': 'active' if self.dark_power_level < 1.0 else 'dormant'
        }
    
    def get_jpeg_quality(self) -> int:
        """Get JPEG quality based on Sith power level"""
        base_quality = 90
        return max(50, int(base_quality * self.dark_power_level))
    
    def channel_dark_energy(self, enabled: bool):
        """Channel dark side energy for optimization"""
        if enabled:
            self.target_fps = 30
            print("⚡ Dark side energy channeled")
        else:
            self.target_fps = 20
            print("🌑 Conserving Sith power")
    
    def reset_sith_metrics(self):
        """Reset all Sith performance metrics"""
        self.frame_times.clear()
        self.skip_counter = 0
        self.dark_power_level = 1.0
        self.force_efficiency = 1.0
        self.frame_skip_ratio = 1
        print("🔄 Sith metrics reset")
