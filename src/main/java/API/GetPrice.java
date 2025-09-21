package API;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import spark.Request;

public class GetPrice implements ItemCallable {
    public GetPrice(Statement stat) {
        this.stat = stat;
    }

    public Statement stat;

    @Override
    public String mainQuery() {
        return """
                  SELECT sf.BLKODU, sf.BLSTKODU, sf.TANIMI, sf.FIYATI, sf.ALIS_SATIS, sf.FIYAT_NO, s.BARKODU, s.BLKODU, s.STOKKODU, s.STOK_ADI, s.KDV_ORANI
                  FROM STOK as s, STOK_FIYAT as sf
                  WHERE s.BLKODU = sf.BLSTKODU AND
                """;
    };

    @Override
    public JSONObject getResponse(Request req) throws JSONException, SQLException {
        ResultSet res = stat.executeQuery(getQuery(req));
        JSONArray items = new JSONArray();
        while (res.next()) {
            JSONObject item = new JSONObject();
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.getJSONObject(i);
                String barcode = o.getString("barcode");
                if (barcode.contains(res.getString("BARKODU"))) {
                    item = o;
                }
            }
            if (!item.has("barcode")) {
                item.put("blstcode", res.getInt("BLSTKODU"));
                item.put("barcode", res.getString("BARKODU"));
                item.put("sku", res.getString("STOKKODU"));
                item.put("name", res.getString("STOK_ADI"));
                item.put("tax", res.getDouble("KDV_ORANI"));
                item.put("sell_prices", new JSONArray());
                item.put("buy_prices", new JSONArray());
            }
            JSONObject price = new JSONObject();
            price.put("defination", res.getString("TANIMI"));
            price.put("id", res.getInt("FIYAT_NO"));
            price.put("price", res.getDouble("FIYATI"));
            // 1 for buy 2 for sell
            if (res.getInt("ALIS_SATIS") == 1) {
                item.getJSONArray("buy_prices").put(price);
            } else if (res.getInt("ALIS_SATIS") == 2) {
                item.getJSONArray("sell_prices").put(price);
            }
            boolean found = false;
            for (int i = 0; i < items.length(); i++) {
                if(items.getJSONObject(i).getString("barcode") == item.getString("barcode")){
                    found = true;
                }
            }            
            if(found == false) items.put(item);
        }
        return new JSONObject().put("items", items);
    }

}
