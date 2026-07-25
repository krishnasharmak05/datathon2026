import { CacheService, NotificationService, AuthenticationService, TranslationService } from '../core/services';

// Cache Service (In-Memory Map)
export class LocalCacheService implements CacheService {
  private store = new Map<string, { value: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Notification Service
export class LocalNotificationService implements NotificationService {
  async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    console.log(`[PUSH NOTIFICATION] To User: ${userId} | Title: ${title} | Body: ${body}`);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`[MAIL] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 100)}...`);
  }
}

// Authentication Service
export class LocalAuthenticationService implements AuthenticationService {
  async verifyToken(token: string): Promise<{ userId: string; username: string; role: string } | null> {
    if (!token) return null;
    // Decodes standard mock token (e.g. mock-admin-token or mock-inspector-token)
    if (token.includes('admin')) {
      return { userId: 'usr-1', username: 'Superintendent_Rao', role: 'admin' };
    }
    return { userId: 'usr-2', username: 'Inspector_Gowda', role: 'inspector' };
  }
}

// Translation Service
export class LocalTranslationService implements TranslationService {
  async translate(text: string, sourceLang: 'en' | 'kn', targetLang: 'en' | 'kn'): Promise<string> {
    if (sourceLang === targetLang) return text;
    
    // Heuristic translation dictionary for UI elements and typical outputs
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
