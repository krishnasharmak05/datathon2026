import { CacheService, NotificationService, AuthenticationService, TranslationService } from '../core/services';
import catalyst from 'zcatalyst-sdk-node';

export class CatalystCacheService implements CacheService {
  private getSegment() {
    const app = catalyst.initialize({});
    return app.cache().segment();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const segment = this.getSegment();
      const val = await segment.getValue(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch (e) {
      console.error('Error getting from Catalyst cache:', e);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      const segment = this.getSegment();
      const expiryInHours = ttlSeconds / 3600;
      await segment.put(key, JSON.stringify(value), expiryInHours);
    } catch (e) {
      console.error('Error setting in Catalyst cache:', e);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const segment = this.getSegment();
      await segment.delete(key);
    } catch (e) {
      console.error('Error deleting from Catalyst cache:', e);
    }
  }

  async clear(): Promise<void> {
    // Cache clearing at segment level is handled via individual key eviction in Node SDK
  }
}

export class CatalystNotificationService implements NotificationService {
  async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    try {
      const app = catalyst.initialize({});
      const push = app.pushNotification();
      const pushService = typeof push.web === 'function' ? push.web() : (push as any).web;
      
      const payload = JSON.stringify({ title, body });
      await pushService.send_notification(payload, [userId]);
      console.log(`[Catalyst Push] Notification sent to: ${userId}`);
    } catch (error) {
      console.error('Error sending Catalyst push notification:', error);
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      const app = catalyst.initialize({});
      const email = app.email();
      
      await email.sendMail({
        from_email: process.env.CATALYST_SENDER_EMAIL || 'no-reply@karnatakapolice.gov.in',
        to_email: [to],
        subject,
        content: body,
        html_mode: body.trim().startsWith('<')
      });
      console.log(`[Catalyst Email] Mail sent to: ${to}`);
    } catch (error) {
      console.error('Error sending Catalyst email:', error);
    }
  }
}

export class CatalystAuthenticationService implements AuthenticationService {
  async verifyToken(token: string): Promise<{ userId: string; username: string; role: string } | null> {
    try {
      const app = catalyst.initialize({});
      const userManagement = app.userManagement();
      const user = await userManagement.getCurrentUser();
      
      if (user) {
        return {
          userId: (user as any).user_id,
          username: (user as any).email_id || 'user',
          role: (user as any).role_details?.role_name || 'user'
        };
      }
      return null;
    } catch (error) {
      console.error('Error verifying Catalyst session:', error);
      return null;
    }
  }
}

export class CatalystTranslationService implements TranslationService {
  async translate(text: string, sourceLang: 'en' | 'kn', targetLang: 'en' | 'kn'): Promise<string> {
    if (sourceLang === targetLang) return text;

    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/zia/translate`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_ZIA_API_KEY || ''}`
        },
        body: JSON.stringify({
          text,
          source_language: sourceLang,
          target_language: targetLang
        })
      });

      if (!response.ok) {
        throw new Error(`Zia Translation failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.translated_text || text;
    } catch (error: any) {
      console.warn('Zia Translation failed, using local translation dictionary fallback:', error.message);
      return this.localTranslationFallback(text, sourceLang, targetLang);
    }
  }

  private localTranslationFallback(text: string, sourceLang: 'en' | 'kn', targetLang: 'en' | 'kn'): string {
    const dictKnToEn: Record<string, string> = {
      'ಅಪರಾಧ': 'Crime',
      'ಅಪರಾಧಿ': 'Accused',
      'ಪೊಲೀಸ್': 'Police',
      'ದೂರುದಾರ': 'Complainant',
      'ಬೆಂಗಳೂರು': 'Bengaluru',
      'ಮೈಸೂರು': 'Mysuru',
    };

    const dictEnToKn: Record<string, string> = {
      'Crime Count': 'ಅಪರಾಧಗಳ ಸಂಖ್ಯೆ',
      'Accused': 'ಆರೋಪಿ',
      'Victim': 'ಸಂತ್ರಸ್ತ',
      'Investigating Officer': 'ತನಿಖಾಧಿಕಾರಿ',
      'Case registered': 'ಪ್ರಕರಣ ದಾಖಲಿಸಲಾಗಿದೆ',
    };

    if (sourceLang === 'kn') {
      let translated = text;
      for (const [k, v] of Object.entries(dictKnToEn)) {
        translated = translated.replace(new RegExp(k, 'g'), v);
      }
      return translated;
    } else {
      let translated = text;
      for (const [k, v] of Object.entries(dictEnToKn)) {
        translated = translated.replace(new RegExp(k, 'g'), v);
      }
      return translated;
    }
  }
}
