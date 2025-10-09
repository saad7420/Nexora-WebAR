export interface AnalyticsEvent {
  modelId: string;
  projectId?: string;
  workspaceId?: string;
  eventType: 'view' | 'ar_launch' | 'hotspot_click' | 'session_end';
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  device?: 'ios' | 'android' | 'desktop';
  sessionDuration?: number;
  eventData?: Record<string, any>;
}

export interface AnalyticsSummary {
  totalViews: number;
  arLaunches: number;
  avgSessionDuration: number;
  uniqueUsers: number;
  topModels: Array<{
    id: string;
    name: string;
    views: number;
    arLaunches: number;
  }>;
  deviceBreakdown: {
    ios: number;
    android: number;
    desktop: number;
  };
  viewsOverTime: Array<{
    date: string;
    views: number;
    arLaunches: number;
  }>;
}

class AnalyticsService {
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  }

  private getDeviceType(): 'ios' | 'android' | 'desktop' {
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    } else if (/Android/.test(userAgent)) {
      return 'android';
    } else {
      return 'desktop';
    }
  }

  private async getLocation(): Promise<{ country?: string; ipAddress?: string }> {
    try {
      // Use a service like ipapi.co or similar for geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        country: data.country_name,
        ipAddress: data.ip,
      };
    } catch (error) {
      console.warn('Failed to get location data:', error);
      return {};
    }
  }

  async recordEvent(event: Omit<AnalyticsEvent, 'sessionId' | 'userAgent' | 'device'>): Promise<void> {
    try {
      const location = await this.getLocation();
      
      const fullEvent: AnalyticsEvent = {
        ...event,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        device: this.getDeviceType(),
        ...location,
      };

      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEvent),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to record analytics event:', error);
    }
  }

  async recordView(modelId: string, projectId?: string, workspaceId?: string): Promise<void> {
    return this.recordEvent({
      modelId,
      projectId,
      workspaceId,
      eventType: 'view',
    });
  }

  async recordARLaunch(modelId: string, projectId?: string, workspaceId?: string): Promise<void> {
    return this.recordEvent({
      modelId,
      projectId,
      workspaceId,
      eventType: 'ar_launch',
    });
  }

  async recordHotspotClick(
    modelId: string, 
    hotspotId: string, 
    projectId?: string, 
    workspaceId?: string
  ): Promise<void> {
    return this.recordEvent({
      modelId,
      projectId,
      workspaceId,
      eventType: 'hotspot_click',
      eventData: { hotspotId },
    });
  }

  async recordSessionEnd(modelId: string, projectId?: string, workspaceId?: string): Promise<void> {
    const sessionDuration = Math.floor((Date.now() - this.startTime) / 1000);
    
    return this.recordEvent({
      modelId,
      projectId,
      workspaceId,
      eventType: 'session_end',
      sessionDuration,
    });
  }

  async getAnalyticsSummary(workspaceId: string, days = 7): Promise<AnalyticsSummary> {
    try {
      const response = await fetch(`/api/analytics/${workspaceId}/summary?days=${days}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      
      // Return empty summary on error
      return {
        totalViews: 0,
        arLaunches: 0,
        avgSessionDuration: 0,
        uniqueUsers: 0,
        topModels: [],
        deviceBreakdown: { ios: 0, android: 0, desktop: 0 },
        viewsOverTime: [],
      };
    }
  }

  async getProjectAnalytics(projectId: string, days = 7): Promise<Partial<AnalyticsSummary>> {
    try {
      const response = await fetch(`/api/analytics/projects/${projectId}?days=${days}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project analytics');
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to fetch project analytics:', error);
      return {};
    }
  }

  async getModelAnalytics(modelId: string, days = 7): Promise<Partial<AnalyticsSummary>> {
    try {
      const response = await fetch(`/api/analytics/models/${modelId}?days=${days}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch model analytics');
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to fetch model analytics:', error);
      return {};
    }
  }

  // Utility method to start a new session (useful for SPA navigation)
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  getCurrentSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Auto-track page visibility changes for session management
if (typeof window !== 'undefined') {
  let isVisible = true;
  let visibilityStartTime = Date.now();

  const handleVisibilityChange = () => {
    if (document.hidden && isVisible) {
      // Page became hidden
      isVisible = false;
    } else if (!document.hidden && !isVisible) {
      // Page became visible - start new session if hidden for more than 30 minutes
      const hiddenDuration = Date.now() - visibilityStartTime;
      if (hiddenDuration > 30 * 60 * 1000) {
        analytics.startNewSession();
      }
      isVisible = true;
      visibilityStartTime = Date.now();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Auto-record session end on page unload
  window.addEventListener('beforeunload', () => {
    // Note: This might not always work due to browser restrictions
    // Consider using sendBeacon for more reliable tracking
    navigator.sendBeacon('/api/analytics/session-end', JSON.stringify({
      sessionId: analytics.getCurrentSessionId(),
      duration: analytics.getSessionDuration(),
    }));
  });
}

export default analytics;
