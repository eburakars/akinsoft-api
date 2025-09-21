# akinsoft-api Projesine Başlangıç Kılavuzu

Bu belge, `akinsoft-api` projesinin kod yapısını ve kullanımını sıfırdan bilen biri için açıklamaktadır.

## 1. Proje Özeti

Bu proje, Akınsoft Wolvox muhasebe programının veritabanına erişerek bazı stok ve fiyat bilgilerini RESTful API'ler aracılığıyla dış dünyaya sunmayı amaçlamaktadır. 

Kullanılan Teknolojiler:
- **Dil:** Java
- **API Framework'ü:** SparkJava (Hafif bir web framework'ü)
- **Veritabanı:** Firebird (Canlı bağlantı) ve SQLite (Testler için)
- **Bağımlılık Yönetimi:** Maven
- **Test Framework'ü:** JUnit

## 2. Proje Yapısı

```bash
akinsoft-api/
├── pom.xml                    # Maven yapılandırma dosyası
├── src/
│   ├── main/java/
│   │   ├── App.java           # Uygulama başlangıç noktası (main metodu)
│   │   ├── API/               # API endpoint'lerini tanımlayan sınıflar
│   │   │   ├── GetItem.java
│   │   │   ├── GetItemWithPrice.java
│   │   │   ├── GetPrice.java
│   │   │   ├── GetStockTransactions.java
│   │   │   └── PostStockTransaction.java
│   │   └── Utils/             # Yardımcı sınıflar
│   │       └── Connector.java # Veritabanı bağlantısı
│   └── test/java/             # Birim testleri
│       ├── TestAPI.java       # API'lerin test senaryoları
│       ├── TestConnector.java # Veritabanı bağlantısının testi
│       └── TestUtils.java     # Testlerde kullanılan yardımcı metodlar
│   └── test/resources/        # Test verileri ve mock veritabanı
└── README.md                  # Proje açıklaması (şu anda boş)
```

## 3. Kurulum ve Çalıştırma

### Gereksinimler
- Java 17 JDK (Proje bu versiyon için yapılandırılmış)
- Apache Maven (Bağımlılık yönetimi ve build işlemleri için)
- Git (Kaynak kodu almak için)

### Adımlar

1. **Kaynak Kodunu Alın:** Proje dizinine gidin veya yeni bir klasör oluşturun ve aşağıdaki komutu çalıştırın:
   ```bash
   git clone <proje-git-url>
   cd akinsoft-api
   ```

2. **Bağımlılıkları Yükleyin:** Maven, `pom.xml` dosyasındaki bağımlılıkları otomatik olarak çözer. Aşağıdaki komutu çalıştırarak projeyi derleyin ve bağımlılıkları indirin:
   ```bash
   mvn clean install
   ```
   Bu komut, tüm testlerin çalışmasını da tetikleyecektir. Testlerin geçmesi, temel işlevlerin doğru çalıştığını gösterir.

3. **Uygulamayı Çalıştırın:**
   Uygulama, WAR dosyası olarak paketlenmiştir. Geliştirme sırasında doğrudan `App.java` sınıfının `main` metodunu çalıştırarak test edebilirsiniz. 
   
   IDE'niz (Eclipse, IntelliJ IDEA, VS Code) varsa, `App.java` dosyasını açın ve 'Run' (Çalıştır) seçeneğini kullanın.

   Alternatif olarak, Maven ile çalıştırmak için:
   ```bash
   mvn exec:java -Dexec.mainClass="App"
   ```
   Uygulama başlatıldığında, SparkJava sunucusu çalışmaya başlayacak ve API'ler hazır hale gelecektir.

## 4. Yapılandırma

### Veritabanı Bağlantısı

Veritabanı bağlantısı `Utils/Connector.java` dosyasında yapılandırılmıştır.

- **Canlı Ortam:** 
  - `createFirebirdStatement` metodunda `jdbc:firebirdsql://...` satırı aktif edilmeli.
  - `host`, `user`, `password` değişkenleri, hedef Firebird veritabanınızın bilgileriyle güncellenmelidir.
  
- **Test Ortamı:** 
  - Varsayılan olarak, testler için SQLite veritabanı (`mock.db`) kullanılmaktadır. Bu, `Connector.java` dosyasında yorum satırına alınmış olan Firebird bağlantısının yerine `jdbc:sqlite:...` bağlantısının kullanılmasıyla sağlanır.

### API Endpoint'leri

API'ler, `App.java` dosyasının `main` metodunda tanımlanır ve başlatılır. Her API sınıfı (`GetItem`, `GetPrice`, vb.) kendi endpoint'ini ve işlevselliğini tanımlar.

## 5. API Kullanımı

Sunucu çalışmaya başladıktan sonra, aşağıdaki endpoint'lere istek atabilirsiniz. Bu örnekler `GetStockTransactions` ve `PostStockTransaction` sınıflarında tanımlanmıştır. Diğer sınıflar için benzer desenler izlenir.

- **GET /stocktransactions**
  - Açıklama: Belirli bir tarih aralığındaki stok hareketlerini getirir.
  - Parametreler:
    - `datestart`: Başlangıç tarihi (YYYY-MM-DD formatında)
    - `dateend`: Bitiş tarihi (YYYY-MM-DD formatında)
  - Örnek: `http://localhost:4567/stocktransactions?datestart=2022-01-01&dateend=2022-12-31`

- **POST /stocktransaction**
  - Açıklama: Yeni bir stok hareketi kaydeder.
  - Parametreler:
    - `round`: İşlem turu (genellikle 0 veya 1)
  - Gövde (Body): JSON formatında stok hareketi verileri. Örnek format `src/test/resources/TestPostStockTransactionRequest.json` dosyasında bulunabilir.

Diğer endpoint'ler için sınıfların `handle` metodlarını inceleyebilirsiniz.

## 6. Testler

Proje, `src/test/java` dizininde birim testleri içerir. `TestAPI.java` dosyası, her bir API'nin doğru çalışıp çalışmadığını kontrol eder. Testler, verileri gerçek veritabanından değil, `src/test/resources/mock.db` adlı SQLite mock veritabanından alır.

Testleri çalıştırmak için:
```bash
mvn test
```
komutunu kullanabilirsiniz.

## 7. Geliştirme

Yeni bir API endpoint'i eklemek istiyorsanız:
1. `src/main/java/API` dizininde yeni bir Java sınıfı oluşturun.
2. Gerekli veritabanı sorgularını ve JSON dönüşümünü bu sınıfta tanımlayın. Ortak davranışlar için mevcut sınıflardan (örneğin `GetItem`) miras alabilir veya yeni bir interface tanımlayabilirsiniz.
3. `App.java` dosyasının `main` metodunda, yeni oluşturduğunuz sınıfın bir örneğini alın ve `handle` metodunu çağırın.

## 8. Frontend UI

- Proje artık SparkJava tarafından servis edilen basit bir HTML arayüzü ile gelir. Statik dosyalar `src/main/resources/public/` dizininde tutulur.
- Backend'i başlattıktan sonra (`mvn exec:java -Dexec.mainClass=App`), tarayıcıdan `http://localhost:4567/` adresine giderek arayüze ulaşabilirsiniz.
- **Item Lookup:** Barkod veya stok kodu girerek ürünleri ve isterseniz satış fiyatlarını görüntüler.
- **Price Book:** Satış ve alış fiyatlarını ayrıştırılmış olarak listeler.
- **Stock Transactions:** Tarih aralığı seçerek stok hareketlerini tablodan takip edebilirsiniz.
- **Record Stock Transaction:** Çok satırlı formla stok hareketi ekleyebilir, `round` parametresi ile alış/satış tipini belirleyebilirsiniz.
- Arayüzdeki üst kısımdan API temel adresini değiştirebilir, farklı ortamlar için kayıtlı URL'yi tarayıcı depolamasında saklayabilirsiniz.
