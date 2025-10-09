import { storage } from '../storage';
import { nanoid } from 'nanoid';
import type { InsertAnalyticsEvent } from '@shared/schema';

export interface DeviceInfo {
  type: 'ios' | 'android' | 'desktop';
  browser: string;
  version: string;
  viewport: { width: number; height: number };
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  ipAddress?: string;
  timezone?: string;
}

export interface AnalyticsEventData extends Omit<InsertAnalyticsEvent, 'id' | 'timestamp'> {
  // Additional computed fields
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
}

class AnalyticsService {
  /**
   * Record an analytics event
   */
  async recordEvent(eventData: AnalyticsEventData): Promise<void> {
    try {
      const enhancedEvent: InsertAnalyticsEvent = {
        ...eventData,
        device: eventData.device || this.parseDevice(eventData.userAgent || ''),
        eventData: {
          ...eventData.eventData,
          deviceInfo: eventData.deviceInfo,
          locationInfo: eventData.locationInfo,
        },
      };

      await storage.recordAnalyticsEvent(enhancedEvent);
      
      // Update real-time metrics
      await this.updateRealTimeMetrics(eventData);
      
    } catch (error) {
      console.error('Failed to record analytics event:', error);
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  /**
   * Record a model view event
   */
  async recordView(data: {
    modelId: string;
    projectId: string;
    workspaceId: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  }): Promise<void> {
    const sessionId = data.sessionId || this.generateSessionId();
    
    await this.recordEvent({
      modelId: data.modelId,
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      eventType: 'view',
      sessionId,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      eventData: {
        referrer: data.referrer,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Record AR launch event
   */
  async recordARLaunch(data: {
    modelId: string;
    projectId: string;
    workspaceId: string;
    sessionId: string;
    userAgent?: string;
    ipAddress?: string;
    arMode?: 'webxr' | 'quick-look' | 'scene-viewer';
  }): Promise<void> {
    await this.recordEvent({
      modelId: data.modelId,
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      eventType: 'ar_launch',
      sessionId: data.sessionId,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      eventData: {
        arMode: data.arMode,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Record hotspot interaction
   */
  async recordHotspotClick(data: {
    modelId: string;
    projectId: string;
    workspaceId: string;
    sessionId: string;
    hotspotId: string;
    hotspotType: 'info' | 'ingredient' | 'price' | 'allergen';
    userAgent?: string;
  }): Promise<void> {
    await this.recordEvent({
      modelId: data.modelId,
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      eventType: 'hotspot_click',
      sessionId: data.sessionId,
      userAgent: data.userAgent,
      eventData: {
        hotspotId: data.hotspotId,
        hotspotType: data.hotspotType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Record session end
   */
  async recordSessionEnd(data: {
    modelId: string;
    projectId: string;
    workspaceId: string;
    sessionId: string;
    sessionDuration: number;
    interactionCount?: number;
    userAgent?: string;
  }): Promise<void> {
    await this.recordEvent({
      modelId: data.modelId,
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      eventType: 'session_end',
      sessionId: data.sessionId,
      sessionDuration: data.sessionDuration,
      userAgent: data.userAgent,
      eventData: {
        interactionCount: data.interactionCount || 0,
        avgInteractionTime: data.sessionDuration / Math.max(data.interactionCount || 1, 1),
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get analytics summary for a workspace
   */
  async getWorkspaceSummary(workspaceId: string, days = 7): Promise<{
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
    deviceBreakdown: Record<string, number>;
    viewsOverTime: Array<{
      date: string;
      views: number;
      arLaunches: number;
    }>;
  }> {
    const summary = await storage.getAnalyticsSummary(workspaceId, days);
    
    // Get additional detailed data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const events = await storage.getAnalyticsEvents({
      workspaceId,
      startDate,
      endDate: new Date(),
    });

    // Calculate device breakdown
    const deviceBreakdown: Record<string, number> = {};
    events.forEach(event => {
      if (event.device) {
        deviceBreakdown[event.device] = (deviceBreakdown[event.device] || 0) + 1;
      }
    });

    // Calculate views over time
    const viewsOverTime = this.calculateViewsOverTime(events, days);

    // Get top models (would need to join with models table)
    const topModels = await this.getTopModels(workspaceId, days);

    return {
      ...summary,
      deviceBreakdown,
      viewsOverTime,
      topModels,
    };
  }

  /**
   * Get analytics for a specific project
   */
  async getProjectAnalytics(projectId: string, days = 7): Promise<{
    totalViews: number;
    arLaunches: number;
    avgSessionDuration: number;
    uniqueUsers: number;
    modelCount: number;
    topPerformingModel: string;
    conversionRate: number; // views to AR launches
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const events = await storage.getAnalyticsEvents({
      projectId,
      startDate,
      endDate: new Date(),
    });

    const views = events.filter(e => e.eventType === 'view').length;
    const arLaunches = events.filter(e => e.eventType === 'ar_launch').length;
    const sessionEvents = events.filter(e => e.eventType === 'session_end');
    const avgDuration = sessionEvents.reduce((sum, e) => sum + (e.sessionDuration || 0), 0) / Math.max(sessionEvents.length, 1);
    const uniqueUsers = new Set(events.map(e => e.sessionId)).size;

    // Get model count and top performer
    const modelViews: Record<string, number> = {};
    events.filter(e => e.eventType === 'view').forEach(event => {
      modelViews[event.modelId] = (modelViews[event.modelId] || 0) + 1;
    });

    const topPerformingModel = Object.entries(modelViews)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    return {
      totalViews: views,
      arLaunches,
      avgSessionDuration: Math.round(avgDuration),
      uniqueUsers,
      modelCount: Object.keys(modelViews).length,
      topPerformingModel,
      conversionRate: views > 0 ? Math.round((arLaunches / views) * 100) : 0,
    };
  }

  /**
   * Get analytics for a specific model
   */
  async getModelAnalytics(modelId: string, days = 7): Promise<{
    views: number;
    arLaunches: number;
    avgSessionDuration: number;
    uniqueUsers: number;
    hotspotClicks: number;
    deviceBreakdown: Record<string, number>;
    hourlyBreakdown: Array<{
      hour: number;
      views: number;
      arLaunches: number;
    }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const events = await storage.getAnalyticsEvents({
      modelId,
      startDate,
      endDate: new Date(),
    });

    const views = events.filter(e => e.eventType === 'view').length;
    const arLaunches = events.filter(e => e.eventType === 'ar_launch').length;
    const hotspotClicks = events.filter(e => e.eventType === 'hotspot_click').length;
    const sessionEvents = events.filter(e => e.eventType === 'session_end');
    const avgDuration = sessionEvents.reduce((sum, e) => sum + (e.sessionDuration || 0), 0) / Math.max(sessionEvents.length, 1);
    const uniqueUsers = new Set(events.map(e => e.sessionId)).size;

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    events.forEach(event => {
      if (event.device) {
        deviceBreakdown[event.device] = (deviceBreakdown[event.device] || 0) + 1;
      }
    });

    // Hourly breakdown
    const hourlyBreakdown = this.calculateHourlyBreakdown(events);

    return {
      views,
      arLaunches,
      avgSessionDuration: Math.round(avgDuration),
      uniqueUsers,
      hotspotClicks,
      deviceBreakdown,
      hourlyBreakdown,
    };
  }

  /**
   * Get real-time metrics for a workspace
   */
  async getRealTimeMetrics(workspaceId: string): Promise<{
    activeUsers: number;
    currentViews: number;
    recentARLaunches: number;
    averageSessionTime: number;
  }> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recentEvents = await storage.getAnalyticsEvents({
      workspaceId,
      startDate: fiveMinutesAgo,
      endDate: now,
    });

    const activeUsers = new Set(recentEvents.map(e => e.sessionId)).size;
    const currentViews = recentEvents.filter(e => e.eventType === 'view').length;
    const recentARLaunches = recentEvents.filter(e => e.eventType === 'ar_launch').length;
    
    const sessionEvents = recentEvents.filter(e => e.eventType === 'session_end');
    const averageSessionTime = sessionEvents.reduce((sum, e) => sum + (e.sessionDuration || 0), 0) / Math.max(sessionEvents.length, 1);

    return {
      activeUsers,
      currentViews,
      recentARLaunches,
      averageSessionTime: Math.round(averageSessionTime),
    };
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `sess_${nanoid(16)}_${Date.now()}`;
  }

  private parseDevice(userAgent: string): 'ios' | 'android' | 'desktop' {
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    if (/Android/.test(userAgent)) return 'android';
    return 'desktop';
  }

  private async updateRealTimeMetrics(eventData: AnalyticsEventData): Promise<void> {
    // Update real-time metrics cache/database
    // This could use Redis or similar for fast real-time updates
  }

  private calculateViewsOverTime(events: any[], days: number): Array<{
    date: string;
    views: number;
    arLaunches: number;
  }> {
    const result: Array<{ date: string; views: number; arLaunches: number }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(e => 
        new Date(e.timestamp).toISOString().split('T')[0] === dateStr
      );
      
      result.push({
        date: dateStr,
        views: dayEvents.filter(e => e.eventType === 'view').length,
        arLaunches: dayEvents.filter(e => e.eventType === 'ar_launch').length,
      });
    }
    
    return result;
  }

  private calculateHourlyBreakdown(events: any[]): Array<{
    hour: number;
    views: number;
    arLaunches: number;
  }> {
    const hourlyData: Record<number, { views: number; arLaunches: number }> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { views: 0, arLaunches: 0 };
      }
      
      if (event.eventType === 'view') {
        hourlyData[hour].views++;
      } else if (event.eventType === 'ar_launch') {
        hourlyData[hour].arLaunches++;
      }
    });

    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        hour,
        views: hourlyData[hour]?.views || 0,
        arLaunches: hourlyData[hour]?.arLaunches || 0,
      });
    }
    
    return result;
  }

  private async getTopModels(workspaceId: string, days: number): Promise<Array<{
    id: string;
    name: string;
    views: number;
    arLaunches: number;
  }>> {
    // This would require joining with the models table to get model names
    // For now, return empty array - would need to implement proper join query
    return [];
  }
}

export const analyticsService = new AnalyticsService();
