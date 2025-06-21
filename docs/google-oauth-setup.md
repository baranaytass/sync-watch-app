# Google OAuth Setup Rehberi

Bu rehber, Sync Watch App için Google OAuth entegrasyonunu kurma adımlarını içerir.

## 1. Google Cloud Console'da Proje Oluşturma

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Yeni bir proje oluşturun veya mevcut bir projeyi seçin
3. "Sync Watch App" gibi bir isim verin

## 2. OAuth Consent Screen Konfigürasyonu

1. Sol menüden **"APIs & Services"** > **"OAuth consent screen"** seçin
2. **"External"** kullanıcı tipini seçin (geliştirme için)
3. Gerekli bilgileri doldurun:
   - **App name**: Sync Watch App
   - **User support email**: Your email
   - **Developer contact information**: Your email

## 3. OAuth 2.0 Credentials Oluşturma

1. **"APIs & Services"** > **"Credentials"** bölümüne gidin
2. **"+ CREATE CREDENTIALS"** > **"OAuth 2.0 Client IDs"** seçin
3. **Application type**: Web application
4. **Name**: Sync Watch App Backend
5. **Authorized redirect URIs** ekleyin:
   ```
   http://localhost:3000/api/auth/google/callback
   ```

## 4. Gerekli API'leri Etkinleştirme

1. **"APIs & Services"** > **"Library"** bölümüne gidin
2. Aşağıdaki API'leri arayın ve etkinleştirin:
   - **Google+ API** (kullanıcı profil bilgileri için)
   - **YouTube Data API v3** (video bilgileri için)

## 5. Environment Variables Ayarlama

Oluşturulan credentials'ları kopyalayın ve backend/.env dosyasına ekleyin:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
YOUTUBE_API_KEY=your-youtube-api-key-here
```

## 6. YouTube API Key Oluşturma

1. **"APIs & Services"** > **"Credentials"** bölümüne gidin
2. **"+ CREATE CREDENTIALS"** > **"API key"** seçin
3. Oluşturulan API key'i kopyalayın
4. İsteğe bağlı: API key'i kısıtlayın (sadece YouTube Data API v3)

## 7. Test

OAuth setup'ınızı test etmek için:

```bash
# Backend sunucusunu başlat
cd backend
npm run dev

# Tarayıcıda aşağıdaki URL'e git
http://localhost:3000/api/auth/google
```

## Production Notları

Production ortamı için:

1. **OAuth consent screen** için verification süreci gerekebilir
2. **Authorized redirect URIs** production domain'inizi içermeli:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```
3. API quotas ve limits'leri kontrol edin
4. Güvenlik için API key restrictions ekleyin

## Troubleshooting

### Sık Karşılaşılan Hatalar

- **"redirect_uri_mismatch"**: Redirect URI'nin Google Console'da tanımlı olduğundan emin olun
- **"invalid_client"**: Client ID ve Secret'ın doğru olduğunu kontrol edin
- **"access_denied"**: OAuth consent screen ayarlarını kontrol edin

### Log Kontrolü

Backend log'larında hata detaylarını görebilirsiniz:

```bash
cd backend
npm run dev
``` 