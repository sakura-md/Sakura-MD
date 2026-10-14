/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Email sementara via generator.email: buat alamat, baca inbox, ambil OTP / link verifikasi.
// Butuh paket: axios, cheerio, ws (lihat package.json).
import axios from 'axios'
import * as cheerio from 'cheerio'
import WebSocket from 'ws'

export class EmailParser {
  /**
   * Cleans and extracts the visible text body and raw HTML block of the email content.
   * @param {object} $ Cheerio static root
   * @returns {{bodyText: string, rawHtml: string}}
   */
  static extractCleanBody($) {
    // Try primary content container selectors
    const selectors = [
      'div.mess_bodiyy',
      'div[class*="mess_bod"]',
      'div.user_mess_content',
      '#email_content',
      '#mail-summary-body'
    ];

    for (const sel of selectors) {
      const container = $(sel);
      if (container.length > 0) {
        const clone = container.first().clone();
        // Remove junk elements that distort the content or run scripts
        clone.find('script, style, ins, button, iframe, .adsbygoogle, .mesg-row, .mailsrc-panel, .tooltip-container').remove();
        
        const bodyText = clone.text().replace(/\n\s*\n/g, '\n').trim();
        const rawHtml = clone.html() || '';
        return { bodyText, rawHtml };
      }
    }

    return { bodyText: '', rawHtml: '' };
  }

  /**
   * Extracts one-time passcode (OTP) from text or HTML.
   * @param {string} text Text content
   * @param {string} html HTML content
   * @returns {string|null} OTP code or null
   */
  static extractOtp(text, html = null) {
    const combined = (text || '').trim();
    if (!combined && !html) return null;

    // Pattern 1: Hyphenated or spaced OTP, e.g. 123-456, 123 456
    const mHyphen = combined.match(/\b([0-9]{3})[- ]([0-9]{3})\b/);
    if (mHyphen) return mHyphen[1] + mHyphen[2];

    // Pattern 2: Contextual keywords for 4-8 digit OTP codes
    const mKeyword = combined.match(
      /(?:kode\s*verifikasi|verification\s*code|security\s*code|confirmation\s*code|kode\s*keamanan|auth\s*code|passcode|kode\s*otp|otp|pin|code|kode)(?:(?:\s+[a-zA-Z]+){0,4})?\s*(?:adalah|is|:|:=|-|\s)\s*\b([0-9]{4,8})\b/i
    );
    if (mKeyword) {
      const val = mKeyword[1];
      // Skip common years unless clearly labeled (avoiding 2024, 2025, 2026 false-positives)
      if (!(val.length === 4 && (val.startsWith('19') || val.startsWith('20')) && !/code|kode|otp|pin/i.test(combined))) {
        return val;
      }
    }

    // Pattern 3: Imperative actions: "use code 123456"
    const mAction = combined.match(
      /(?:use\s*code|masukkan\s*kode|gunakan\s*kode|enter\s*(?:verification\s*)?code)\s*(?:adalah|is|:|:=|-|\s)?\s*\b([0-9]{4,8})\b/i
    );
    if (mAction) return mAction[1];

    // Pattern 4: Alphanumeric codes associated with authorization
    const mAlpha = combined.match(
      /(?:otp|code|kode|token|password)(?:(?:\s+[a-zA-Z]+){0,3})?\s*(?:adalah|is|:|:=|-|\s)\s*\b([A-Z0-9]*[0-9][A-Z0-9]*)\b/i
    );
    if (mAlpha) {
      const val = mAlpha[1].trim();
      if (val.length >= 4 && val.length <= 8 && /[0-9]/.test(val) && /[a-zA-Z]/i.test(val)) {
        return val.toUpperCase();
      }
    }

    // Pattern 5: Look for large standalone numbers in HTML elements
    if (html) {
      const $ = cheerio.load(html);
      let foundHtmlOtp = null;
      $('b, strong, h1, h2, h3, td, span, font').each((_, el) => {
        const t = $(el).text().trim();
        if (/^[0-9]{4,8}$/.test(t) && !/^(19\d\d|20[2-3]\d)$/.test(t)) {
          foundHtmlOtp = t;
          return false; // Break Cheerio loop
        }
        if (/^[0-9]{3}[- ][0-9]{3}$/.test(t)) {
          foundHtmlOtp = t.replace(/[- ]/, '');
          return false;
        }
      });
      if (foundHtmlOtp) return foundHtmlOtp;
    }

    // Pattern 6: Last resort, look for any standalone 6-digit number
    const mSixDigit = combined.match(/\b([0-9]{6})\b/);
    if (mSixDigit) return mSixDigit[1];

    return null;
  }

  /**
   * Scrapes action links from email HTML and scores them to find the primary verification link.
   * @param {string} htmlContent HTML email body
   * @returns {{primary_link: string|null, all_links: Array<{text: string, url: string}>}}
   */
  static extractVerificationLinks(htmlContent) {
    if (!htmlContent) return { primary_link: null, all_links: [] };

    const $ = cheerio.load(htmlContent);
    const links = [];
    let primaryLink = null;
    let highestScore = -1;

    const actionKeywords = [
      'verify', 'verifikasi', 'confirm', 'konfirmasi', 'activate', 'aktifkan',
      'click here', 'klik di sini', 'log in', 'masuk', 'login', 'reset password',
      'complete registration', 'get started', 'join', 'accept', 'approve'
    ];

    const ignoreKeywords = [
      'unsubscribe', 'berhenti langganan', 'privacy policy', 'kebijakan privasi',
      'terms', 'syarat dan ketentuan', 'facebook', 'twitter', 'instagram', 'linkedin',
      'youtube', 'help center', 'pusat bantuan', 'contact us', 'hubungi kami',
      'support', 'preferences', 'settings', 'android', 'ios'
    ];

    $('a[href]').each((_, el) => {
      const href = ($(el).attr('href') || '').trim();
      if (!href.startsWith('http://') && !href.startsWith('https://')) return;

      const text = $(el).text().trim().toLowerCase();
      const hrefLower = href.toLowerCase();

      // Filter out footer junk or social media links
      if (ignoreKeywords.some((junk) => text.includes(junk) || hrefLower.includes(junk))) {
        return;
      }

      let score = 0;
      for (const kw of actionKeywords) {
        if (text.includes(kw)) score += 15;
        if (hrefLower.includes(kw)) score += 5;
      }

      // Strong signature of token or verify query parameter
      if (/token=|code=|key=|verify|activate|confirmation|auth\/links|auth_action/i.test(hrefLower)) {
        score += 10;
      }

      if (!links.some(l => l.url === href)) {
        links.push({ text: $(el).text().trim(), url: href, score });
      }

      if (score > highestScore) {
        highestScore = score;
        primaryLink = href;
      }
    });

    // Sort all discovered links by score descending
    links.sort((a, b) => b.score - a.score);

    // Use top score or first link as default fallback
    if (!primaryLink && links.length > 0) {
      primaryLink = links[0].url;
    }

    return {
      primary_link: primaryLink,
      all_links: links.map(l => ({ text: l.text, url: l.url }))
    };
  }
}

/* ============================================================
 * 3. GENERATOR.EMAIL CLIENT ENGINE
 * ============================================================ */
export class GeneratorEmail {
  static BASE_URL = 'https://generator.email';
  static WS_URL = 'wss://generator.email/notificon/ws';
  
  static DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  constructor(options = {}) {
    this.userAgent = options.userAgent || GeneratorEmail.DEFAULT_USER_AGENT;
    this.timeout = options.timeout || 15000;
    this.cacheTtl = options.cacheTtl || 300000; // 5 mins default cache
    
    this._apiToken = null;
    this._tokenFetchedAt = 0;
    this._cachedDomains = [];
    this._domainsFetchedAt = 0;
    
    // Cookie store for stateful requests
    this.cookies = new Map();
  }

  _getHeaders(extraHeaders = {}) {
    const headers = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Connection': 'keep-alive',
      ...extraHeaders
    };

    if (this.cookies.size > 0) {
      const cookieStr = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      headers['Cookie'] = cookieStr;
    }

    return headers;
  }

  _updateCookies(headers) {
    if (!headers || !headers['set-cookie']) return;
    const rawCookies = Array.isArray(headers['set-cookie']) 
      ? headers['set-cookie'] 
      : [headers['set-cookie']];

    for (const cookie of rawCookies) {
      const parts = cookie.split(';')[0].split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        this.cookies.set(name, value);
      }
    }
  }

  _formatResponse(status, data, message = null, errorCode = null) {
    const response = {
      status,
      timestamp: new Date().toISOString(),
      data
    };
    if (message) response.message = message;
    if (errorCode) response.error_code = errorCode;
    return response;
  }

  /**
   * Fetches/Extracts a valid API Token from generator.email meta tags.
   */
  async getApiToken(forceRefresh = false) {
    const now = Date.now();
    if (this._apiToken && !forceRefresh && (now - this._tokenFetchedAt < this.cacheTtl)) {
      return this._apiToken;
    }

    try {
      const res = await axios.get(`${GeneratorEmail.BASE_URL}/`, {
        headers: this._getHeaders(),
        timeout: this.timeout,
        validateStatus: () => true
      });

      this._updateCookies(res.headers);

      if (res.status === 200) {
        const $ = cheerio.load(res.data);
        const token = $('meta[name="api-token"]').attr('content');
        if (token) {
          this._apiToken = token.trim();
          this._tokenFetchedAt = now;
          return this._apiToken;
        }
      }
    } catch (err) {
      if (this._apiToken) return this._apiToken;
      throw new Error(`Failed to retrieve API Token: ${err.message}`);
    }

    if (this._apiToken) return this._apiToken;
    throw new Error('Failed to find meta tag api-token in document');
  }

  /**
   * Fetches active email domains from the site API.
   */
  async getActiveDomains(forceRefresh = false) {
    const now = Date.now();
    if (this._cachedDomains.length > 0 && !forceRefresh && (now - this._domainsFetchedAt < this.cacheTtl)) {
      return this._cachedDomains;
    }

    try {
      const token = await this.getApiToken(forceRefresh);
      const headers = this._getHeaders({
        'X-API-Token': token,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${GeneratorEmail.BASE_URL}/`
      });

      let res = await axios.get(`${GeneratorEmail.BASE_URL}/api/domains.php`, {
        headers,
        timeout: this.timeout,
        validateStatus: () => true
      });

      // Handle token expiration / 403 Forbidden
      if (res.status === 403) {
        const renewedToken = await this.getApiToken(true);
        headers['X-API-Token'] = renewedToken;
        res = await axios.get(`${GeneratorEmail.BASE_URL}/api/domains.php`, {
          headers,
          timeout: this.timeout,
          validateStatus: () => true
        });
      }

      if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const domains = res.data
          .map(d => (typeof d === 'object' && d !== null ? (d.ascii || d.display) : null))
          .filter(val => !!val)
          .map(val => val.trim().toLowerCase());
        
        if (domains.length > 0) {
          this._cachedDomains = domains;
          this._domainsFetchedAt = now;
          return this._cachedDomains;
        }
      }
    } catch (_) {
      // Keep going to fallback below
    }

    const fallback = ['fboxmail.com', 'cunan.store', 'sds-awe.top', 'mengundang.live', 'kintil.buzz', 'ketua.id'];
    if (this._cachedDomains.length === 0) {
      this._cachedDomains = fallback;
    }
    return this._cachedDomains;
  }

  sanitizeUsername(username) {
    if (!username) return `user_${Math.floor(Date.now() / 1000)}`;
    const cleaned = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '');
    return cleaned || `user_${Math.floor(Date.now() / 1000)}`;
  }

  /**
   * Generates a fully qualified temporary email address.
   */
  async generateEmail(username = null, domain = null) {
    const domains = await this.getActiveDomains();
    
    let selectedDomain = domain ? domain.trim().toLowerCase().replace(/^@/, '') : null;
    if (!selectedDomain || !domains.includes(selectedDomain)) {
      selectedDomain = selectedDomain || domains[Math.floor(Math.random() * domains.length)] || 'fboxmail.com';
    }

    const userPart = username 
      ? this.sanitizeUsername(username)
      : `user_${Math.random().toString(36).substring(2, 12)}`;

    return `${userPart}@${selectedDomain}`.toLowerCase();
  }

  /**
   * Checks the inbox for a specific email address.
   */
  async checkInbox(email) {
    const formattedEmail = (email || '').trim().toLowerCase();
    if (!formattedEmail.includes('@')) {
      return this._formatResponse('error', null, `Invalid email format: ${formattedEmail}`, 'INVALID_EMAIL');
    }

    const [username, domain] = formattedEmail.split('@');
    const inboxCtxVal = `${domain}/${username}/`;
    
    // Inject cookies representing the session for this mail inbox
    this.cookies.set('inbox_ctx', encodeURIComponent(inboxCtxVal));
    this.cookies.set('surl', `${domain}/${username}`);
    this.cookies.set('embx', encodeURIComponent(JSON.stringify([formattedEmail])));

    try {
      const res = await axios.get(`${GeneratorEmail.BASE_URL}/inbox1/`, {
        headers: this._getHeaders({
          'Referer': GeneratorEmail.BASE_URL + '/'
        }),
        timeout: this.timeout,
        validateStatus: () => true
      });

      this._updateCookies(res.headers);

      if (res.status !== 200) {
        return this._formatResponse('error', null, `Inbox check failed (HTTP ${res.status})`, 'HTTP_ERROR');
      }

      const $ = cheerio.load(res.data);
      let scriptCount = 0;
      
      $('script').each((_, el) => {
        const text = $(el).text() || '';
        if (text.includes('window.SITE_DATA=')) {
          const match = text.match(/num_mess:\s*(\d+)/);
          if (match) scriptCount = parseInt(match[1], 10);
        }
      });

      const messages = [];
      $('#email-table .list-group-item').each((_, el) => {
        const item = $(el);
        const fromText = item.find('[class*="from_div"]').text().trim();
        const subjText = item.find('[class*="subj_div"]').text().trim();
        const timeText = item.find('[class*="time_div"]').text().trim();
        const onclick = item.attr('onclick') || '';
        const linkMatch = onclick.match(/loadInboxClientSide\(['"](.*?)['\"]\)/);
        const link = linkMatch ? linkMatch[1] : '';

        messages.push({
          from: fromText,
          subject: subjText,
          date: timeText,
          link
        });
      });

      const { bodyText, rawHtml } = EmailParser.extractCleanBody($);
      const otp = bodyText ? EmailParser.extractOtp(bodyText, rawHtml) : null;
      const linksInfo = rawHtml ? EmailParser.extractVerificationLinks(rawHtml) : { primary_link: null, all_links: [] };

      const inboxData = {
        email: formattedEmail,
        total_messages: Math.max(messages.length, scriptCount),
        messages,
        otp,
        verification_link: linksInfo.primary_link,
        body: rawHtml || null
      };

      return this._formatResponse('success', inboxData);
    } catch (err) {
      return this._formatResponse('error', null, `Network connection failed: ${err.message}`, 'NETWORK_ERROR');
    }
  }

  /**
   * Retrieves the body and parsed details of a single message.
   */
  async readMessage(email, linkOrMsgId) {
    const formattedEmail = (email || '').trim().toLowerCase();
    if (!formattedEmail.includes('@')) {
      return this._formatResponse('error', null, `Invalid email format: ${formattedEmail}`, 'INVALID_EMAIL');
    }

    const [username, domain] = formattedEmail.split('@');
    const link = (linkOrMsgId || '').replace(/^\//, '');

    const url = link.startsWith(domain)
      ? `${GeneratorEmail.BASE_URL}/${link}`
      : `${GeneratorEmail.BASE_URL}/${domain}/${username}/${link}`;

    const inboxCtxVal = `${domain}/${username}/${linkOrMsgId}`;
    
    this.cookies.set('inbox_ctx', encodeURIComponent(inboxCtxVal));
    this.cookies.set('surl', `${domain}/${username}`);
    this.cookies.set('embx', encodeURIComponent(JSON.stringify([formattedEmail])));

    try {
      const res = await axios.get(url, {
        headers: this._getHeaders({
          'Referer': `${GeneratorEmail.BASE_URL}/inbox1/`
        }),
        timeout: this.timeout,
        validateStatus: () => true
      });

      this._updateCookies(res.headers);

      if (res.status !== 200) {
        return this._formatResponse('error', null, `Failed to load message (HTTP ${res.status})`, 'HTTP_ERROR');
      }

      const $ = cheerio.load(res.data);
      let sender = '';
      let subject = '';
      let dateStr = '';

      const headText = $('#mail-summary-head').text() || '';
      for (const line of headText.split('\n')) {
        const lower = line.toLowerCase();
        if (lower.includes('from:') || lower.includes('dari:')) {
          sender = line.replace(/^(from|dari):\s*/i, '').trim();
        } else if (lower.includes('subject:') || lower.includes('subjek:')) {
          subject = line.replace(/^(subject|subjek):\s*/i, '').trim();
        } else if (lower.includes('date:') || lower.includes('tanggal:') || lower.includes('received:')) {
          dateStr = line.replace(/^(date|tanggal|received):\s*/i, '').trim();
        }
      }

      const { bodyText, rawHtml } = EmailParser.extractCleanBody($);
      const otp = EmailParser.extractOtp(bodyText, rawHtml);
      const linksInfo = EmailParser.extractVerificationLinks(rawHtml);

      const msgData = {
        email: formattedEmail,
        from: sender,
        subject,
        date: dateStr,
        otp,
        verification_link: linksInfo.primary_link,
        body: rawHtml // Retain HTML for visual styling representation
      };

      return this._formatResponse('success', msgData);
    } catch (err) {
      return this._formatResponse('error', null, `Network error reading message: ${err.message}`, 'NETWORK_ERROR');
    }
  }

  /**
   * Connects to generator.email's WebSocket stream to receive notifications of new incoming emails.
   */
  async listenInboxWs(email, timeoutSec = 180, onMessageCallback = null) {
    const formattedEmail = (email || '').trim().toLowerCase();
    const wsUrl = `${GeneratorEmail.WS_URL}?email=${encodeURIComponent(formattedEmail)}`;

    return new Promise((resolve) => {
      let isResolved = false;
      const ws = new WebSocket(wsUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Origin': GeneratorEmail.BASE_URL
        }
      });

      const cleanupTimer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try { ws.close(); } catch (_) {}
          resolve(this._formatResponse('timeout', null, `Listening timed out after ${timeoutSec} seconds.`, 'TIMEOUT'));
        }
      }, timeoutSec * 1000);

      ws.on('message', async (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          const link = payload.link || '';
          let emailBody = {};

          if (link) {
            const detailRes = await this.readMessage(formattedEmail, link);
            if (detailRes && detailRes.status === 'success') {
              emailBody = detailRes.data;
            }
          }

          const parsedBodyText = emailBody.body ? cheerio.load(emailBody.body).text() : '';
          const otp = emailBody.otp || EmailParser.extractOtp(parsedBodyText, emailBody.body);
          
          const fullEmailData = {
            email: formattedEmail,
            from: payload.from || emailBody.from,
            subject: payload.subject || emailBody.subject,
            date: payload.date || emailBody.date,
            otp,
            verification_link: emailBody.verification_link,
            body: emailBody.body || ''
          };

          const successRes = this._formatResponse('success', fullEmailData, 'New email received in real-time');

          if (onMessageCallback) {
            onMessageCallback(successRes);
          }

          if (!isResolved) {
            isResolved = true;
            clearTimeout(cleanupTimer);
            try { ws.close(); } catch (_) {}
            resolve(successRes);
          }
        } catch (err) {
          // Keep WS listening on parsing errors
        }
      });

      ws.on('error', (err) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(cleanupTimer);
          resolve(this._formatResponse('error', null, `WebSocket stream error: ${err.message}`, 'WS_ERROR'));
        }
      });

      ws.on('close', () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(cleanupTimer);
          resolve(this._formatResponse('error', null, 'WebSocket connection closed prematurely', 'WS_CLOSED'));
        }
      });
    });
  }

  async waitForOtp(email, timeoutSec = 180) {
    const res = await this.listenInboxWs(email, timeoutSec);
    if (res.status === 'success' && res.data) {
      return this._formatResponse('success', {
        email,
        otp: res.data.otp,
        subject: res.data.subject,
        from: res.data.from,
        date: res.data.date
      });
    }
    return res;
  }

  async waitForVerificationLink(email, timeoutSec = 180) {
    const res = await this.listenInboxWs(email, timeoutSec);
    if (res.status === 'success' && res.data) {
      return this._formatResponse('success', {
        email,
        verification_link: res.data.verification_link,
        subject: res.data.subject,
        from: res.data.from,
        date: res.data.date
      });
    }
    return res;
  }
}

// Satu klien bersama (cache token & domain dipakai ulang antar perintah)
export const tempmail = new GeneratorEmail()