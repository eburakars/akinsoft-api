package Utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class Connector {
    private final String host = "192.168.0.115:3050/C:/AKINSOFT/Wolvox8/Database_FB/01/2019/WOLVOX.FDB";
    private final String user = "SYSDBA";
    private final String password = "masterkey";

    public Statement createFirebirdStatement() throws SQLException {
        if (Boolean.parseBoolean(System.getenv().getOrDefault("USE_SQLITE", "false"))) {
            Connection con = DriverManager.getConnection("jdbc:sqlite:./src/test/resources/mock.db");
            return con.createStatement();
        }
        Connection con = DriverManager.getConnection("jdbc:firebirdsql://" + host, user, password);
        return con.createStatement();
    }
}
