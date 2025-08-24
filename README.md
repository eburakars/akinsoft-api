# Akınsoft REST API

Java ve [Spark](http://sparkjava.com/) kullanılarak geliştirilmiş küçük bir REST servisidir. Proje, Akınsoft Firebird veritabanını HTTP üzerinden tüketmek için örnek uçlar sunar. Kod temel olarak test amaçlı hazırlanmış bir SQLite veritabanı üzerinde çalışır ancak kolaylıkla gerçek Firebird veritabanına bağlanacak şekilde düzenlenebilir.

## Özellikler

* Firebird/SQLite veritabanına JDBC ile bağlanma.
* Stok ve fiyat bilgilerini sorgulayan JSON tabanlı GET uçları.
* Stok hareketi eklemeye izin veren POST ucu.
* [Gson](https://github.com/google/gson) ile okunabilir JSON çıktısı.
* Maven ile test ve bağımlılık yönetimi.

## Gereksinimler

* Java 17+
* [Maven](https://maven.apache.org/)

## Kurulum

```bash
git clone https://github.com/<kullanici>/akinsoft-api.git
cd akinsoft-api
mvn package
```

## Veritabanı Yapılandırması

Varsayılan olarak `Utils/Connector.java` sınıfı testlerde kullanılan `mock.db` SQLite dosyasına bağlanır. Gerçek bir Firebird veritabanına bağlanmak için bu sınıftaki `host`, `user` ve `password` alanlarını düzenleyin ve ilgili JDBC bağlantı satırının yorumunu kaldırın.

```java
//Connection con = DriverManager.getConnection("jdbc:firebirdsql://" + host, user, password);
```

## Sunucuyu Çalıştırma

Sunucu `App` sınıfındaki `main` metodu ile başlar. Bir IDE üzerinden ya da Maven komutu kullanarak çalıştırabilirsiniz:

```bash
mvn exec:java -Dexec.mainClass=App
```

> **Not:** Maven `exec` eklentisi kurulu değilse uygulamayı derledikten sonra IDE üzerinden veya manuel classpath ayarlayarak `java App` şeklinde çalıştırabilirsiniz.

Sunucu varsayılan olarak `localhost:4567` adresinde dinler.

## API Uçları

### `GET /item`

Barkod veya stok kodu ile ürün sorgular. Örnek:

```
GET /item?barcode=8413240602088
```

Yanıt yapısı:

```json
{
  "items": [
    {
      "blstcode": 99840,
      "barcode": "8413240602088",
      "name": "ALPİNO 6 LI OYUN HAMURU",
      "unit": "ADET",
      "tax": 18,
      "sku": "CEM0100",
      "intermediate_group": "OYUN HAMURLARI",
      "alt_group": null
    }
  ],
  "response": "ok"
}
```

### `GET /prices`

Bir ürünün alış ve satış fiyatlarını döner. Parametreler `/item` ucu ile aynıdır.

### `GET /itemwithsaleprice`

Ürün temel bilgileri ile birlikte satış fiyatını tek nesne olarak döner.

### `GET /stocktransactions`

Belirtilen tarih aralığındaki stok hareketlerini listeler.

```
GET /stocktransactions?datestart=2022-04-04&dateend=2222-04-04
```

### `POST /stocktransaction`

Yeni stok hareketi ekler. İstek gövdesi JSON dizisidir ve her eleman için `blstcode`, `quantity`, `price`, `tax` ve `unit` alanları beklenir. `round` sorgu parametresi 1 (alış) veya 0 (satış) değerlerini alır.

```json
[
  {
    "blstcode": 99840,
    "quantity": 1,
    "price": 10.0,
    "tax": 18,
    "unit": "ADET"
  }
]
```

## Testler

Proje, SQLite üzerinde çalışan birim testleri içerir. Tüm testleri çalıştırmak için:

```bash
mvn test
```

## Katkıda Bulunma

1. Bir fork oluşturun.
2. Yeni bir özellik dalı açın (`git checkout -b feature/yenilik`).
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik'`).
4. Dalı push edin (`git push origin feature/yenilik`).
5. Bir Pull Request açın.

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

